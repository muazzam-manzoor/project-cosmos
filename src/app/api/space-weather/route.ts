import { NextResponse } from "next/server";
import { SpaceWeatherData } from "@/types/cosmos";

interface CacheEntry {
  data: SpaceWeatherData;
  fetchedAt: number;
}

let swpcCache: CacheEntry | null = null;
const LIVE_TTL_MS = 5 * 60 * 1000; // 5 minutes for live NOAA SWPC
const FALLBACK_TTL_MS = 30 * 1000; // 30s retry window if network was offline

function classifyKpStorm(kp: number): {
  stormLevel: SpaceWeatherData["stormLevel"];
  stormLabel: string;
} {
  if (kp >= 9) return { stormLevel: "G5", stormLabel: "Extreme Storm" };
  if (kp >= 8) return { stormLevel: "G4", stormLabel: "Severe Storm" };
  if (kp >= 7) return { stormLevel: "G3", stormLabel: "Strong Storm" };
  if (kp >= 6) return { stormLevel: "G2", stormLabel: "Moderate Storm" };
  if (kp >= 5) return { stormLevel: "G1", stormLabel: "Minor Storm" };
  if (kp >= 4) return { stormLevel: "G0", stormLabel: "Active Magnetosphere" };
  return { stormLevel: "G0", stormLabel: "Quiet" };
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 7000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ProjectCosmos-Shell1B/0.2" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const ttl = swpcCache?.data.source === "live" ? LIVE_TTL_MS : FALLBACK_TTL_MS;
  if (swpcCache && Date.now() - swpcCache.fetchedAt < ttl) {
    return NextResponse.json({ spaceWeather: swpcCache.data });
  }

  try {
    const [kpRaw, plasmaRaw, magRaw] = await Promise.allSettled([
      fetchJsonWithTimeout("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"),
      fetchJsonWithTimeout("https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json"),
      fetchJsonWithTimeout("https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json"),
    ]);

    let kpIndex = 2.33;
    let solarWindKmS = 415;
    let protonDensity = 4.8;
    let imfBzNt = -1.6;
    let gotLive = false;

    if (kpRaw.status === "fulfilled" && Array.isArray(kpRaw.value) && kpRaw.value.length > 1) {
      for (let i = kpRaw.value.length - 1; i >= 1; i--) {
        const row = kpRaw.value[i];
        const parsed = Array.isArray(row) ? parseFloat(String(row[1])) : NaN;
        if (!Number.isNaN(parsed)) {
          kpIndex = parsed;
          gotLive = true;
          break;
        }
      }
    }

    if (
      plasmaRaw.status === "fulfilled" &&
      Array.isArray(plasmaRaw.value) &&
      plasmaRaw.value.length > 1
    ) {
      for (let i = plasmaRaw.value.length - 1; i >= 1; i--) {
        const row = plasmaRaw.value[i];
        if (Array.isArray(row)) {
          const dens = parseFloat(String(row[1]));
          const spd = parseFloat(String(row[2]));
          if (!Number.isNaN(spd) && spd > 100) {
            solarWindKmS = Math.round(spd);
            if (!Number.isNaN(dens)) protonDensity = Number(dens.toFixed(1));
            gotLive = true;
            break;
          }
        }
      }
    }

    if (magRaw.status === "fulfilled" && Array.isArray(magRaw.value) && magRaw.value.length > 1) {
      for (let i = magRaw.value.length - 1; i >= 1; i--) {
        const row = magRaw.value[i];
        if (Array.isArray(row)) {
          const bz = parseFloat(String(row[3]));
          if (!Number.isNaN(bz)) {
            imfBzNt = Number(bz.toFixed(1));
            gotLive = true;
            break;
          }
        }
      }
    }

    const { stormLevel, stormLabel } = classifyKpStorm(kpIndex);
    const data: SpaceWeatherData = {
      kpIndex: Number(kpIndex.toFixed(2)),
      stormLevel,
      stormLabel,
      solarWindKmS,
      imfBzNt,
      protonDensity,
      updatedAt: new Date().toISOString(),
      source: gotLive ? "live" : "fallback",
    };

    swpcCache = { data, fetchedAt: Date.now() };
    return NextResponse.json({ spaceWeather: data });
  } catch {
    const fallback: SpaceWeatherData = {
      kpIndex: 2.33,
      stormLevel: "G0",
      stormLabel: "Quiet",
      solarWindKmS: 412,
      imfBzNt: -1.4,
      protonDensity: 4.5,
      updatedAt: new Date().toISOString(),
      source: "fallback",
    };
    swpcCache = { data: fallback, fetchedAt: Date.now() };
    return NextResponse.json({ spaceWeather: fallback });
  }
}
