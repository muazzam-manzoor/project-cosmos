import { NextResponse } from "next/server";
import { DscovrEpicData } from "@/types/cosmos";

interface EpicCache {
  data: DscovrEpicData;
  fetchedAt: number;
}

let epicCache: EpicCache | null = null;
const LIVE_TTL_MS = 1000 * 60 * 60; // 1 hour
const FALLBACK_TTL_MS = 1000 * 60; // 1 minute retry

const FALLBACK_EPIC: DscovrEpicData = {
  imageUrl: "/images/earth.jpg",
  caption: "Sun–Earth L1 Full-Disc Earth View (DSCOVR EPIC Reference · 1.5 Million km Sunward)",
  date: "Reference Baseline",
  distanceToEarthKm: 1496000,
  centroidLat: 12.4,
  centroidLon: -42.1,
  source: "fallback",
};

export async function GET() {
  const now = Date.now();
  if (epicCache) {
    const ttl = epicCache.data.source === "live" ? LIVE_TTL_MS : FALLBACK_TTL_MS;
    if (now - epicCache.fetchedAt < ttl) {
      return NextResponse.json(epicCache.data);
    }
  }

  try {
    const res = await fetch("https://epic.gsfc.nasa.gov/api/natural", {
      signal: AbortSignal.timeout(7000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`EPIC HTTP ${res.status}`);
    const list = (await res.json()) as Array<Record<string, unknown>>;
    const latest = list?.[0];
    if (!latest || !latest.image || !latest.date) {
      throw new Error("Empty EPIC response");
    }

    const dateStr = String(latest.date); // "YYYY-MM-DD HH:MM:SS"
    const [ymd] = dateStr.split(" ");
    const [yyyy, mm, dd] = ymd.split("-");
    const imgName = String(latest.image);
    const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${yyyy}/${mm}/${dd}/jpg/${imgName}.jpg`;

    const dscovrPos = (latest.dscovr_j2000_position as Record<string, number>) ?? {};
    const distKm =
      dscovrPos.x !== undefined
        ? Math.round(Math.hypot(dscovrPos.x, dscovrPos.y, dscovrPos.z))
        : 1496000;
    const centroid = (latest.centroid_coordinates as Record<string, number>) ?? {};

    const data: DscovrEpicData = {
      imageUrl,
      caption: String(latest.caption ?? "Live NASA DSCOVR EPIC Full-Disc Sunlit Earth from Sun–Earth L1"),
      date: dateStr,
      distanceToEarthKm: distKm,
      centroidLat: Number((centroid.lat ?? 0).toFixed(2)),
      centroidLon: Number((centroid.lon ?? 0).toFixed(2)),
      source: "live",
    };

    epicCache = { data, fetchedAt: now };
    return NextResponse.json(data);
  } catch {
    epicCache = { data: FALLBACK_EPIC, fetchedAt: now };
    return NextResponse.json(FALLBACK_EPIC);
  }
}
