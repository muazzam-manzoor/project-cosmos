import { NextResponse } from "next/server";
import { SatelliteCategory, SatelliteTLE } from "@/types/cosmos";
import { buildFallbackTLECatalog } from "@/data/fallbackTLEs";

interface CacheEntry {
  data: SatelliteTLE[];
  source: "live" | "fallback";
  fetchedAt: number;
}

let tleCache: CacheEntry | null = null;
const LIVE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes for live CelesTrak
const FALLBACK_CACHE_TTL_MS = 30 * 1000; // 30s retry window if network was offline

const CELESTRAK_GROUPS: Array<{
  url: string;
  category: SatelliteCategory;
  limit: number;
}> = [
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
    category: "station",
    limit: 80,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle",
    category: "science",
    limit: 260,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle",
    category: "weather",
    limit: 180,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
    category: "starlink",
    limit: 1800,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
    category: "science",
    limit: 700,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-1408-deb&FORMAT=tle",
    category: "debris",
    limit: 180,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=fengyun-1c-deb&FORMAT=tle",
    category: "debris",
    limit: 180,
  },
  // Shell 1B MEO GNSS Constellations (~19,100 - 23,222 km)
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle",
    category: "gnss",
    limit: 36,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle",
    category: "gnss",
    limit: 32,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=tle",
    category: "gnss",
    limit: 28,
  },
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=tle",
    category: "gnss",
    limit: 42,
  },
  // Shell 1B Geostationary Belt (~35,786 km)
  {
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle",
    category: "geo",
    limit: 260,
  },
];

function computeTleEpochAgeDays(line1: string): number | undefined {
  const epochStr = line1.slice(18, 32).trim();
  if (epochStr.length < 5) return undefined;
  const yy = parseInt(epochStr.slice(0, 2), 10);
  const dayOfYear = parseFloat(epochStr.slice(2));
  if (Number.isNaN(yy) || Number.isNaN(dayOfYear)) return undefined;
  const fullYear = yy >= 57 ? 1900 + yy : 2000 + yy;
  const jan1 = Date.UTC(fullYear, 0, 1);
  const epochMs = jan1 + (dayOfYear - 1) * 86400000;
  return Math.max(0, (Date.now() - epochMs) / 86400000);
}

function parseTLEText(
  raw: string,
  defaultCategory: SatelliteCategory,
  limit: number
): SatelliteTLE[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: SatelliteTLE[] = [];

  // Evenly stride through massive catalogs (like 6,500+ Starlinks) so ALL orbital planes are represented!
  const totalTriples = Math.floor(lines.length / 3);
  const stride = totalTriples > limit ? Math.max(1, Math.floor(totalTriples / limit)) : 1;

  for (let t = 0; t < totalTriples && results.length < limit; t += stride) {
    const i = t * 3;
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!line1 || !line2 || !line1.startsWith("1 ") || !line2.startsWith("2 ")) {
      continue;
    }

    const noradId = parseInt(line1.slice(2, 7).trim(), 10);
    const meanMotion = parseFloat(line2.slice(52, 63).trim());
    // Shell 1A + 1B filter: LEO (10.6+ rev/d) + MEO GNSS (~1.6–2.4 rev/d) + GEO (~0.9–1.1 rev/d)
    if (Number.isNaN(noradId) || Number.isNaN(meanMotion) || meanMotion < 0.8) {
      continue;
    }

    const upper = name.toUpperCase();
    let effectiveCategory: SatelliteCategory = defaultCategory;
    if (upper.includes(" DEB") || upper.includes("R/B")) {
      effectiveCategory = "debris";
    } else if (meanMotion <= 1.25) {
      effectiveCategory = "geo";
    } else if (
      defaultCategory === "gnss" ||
      (meanMotion >= 1.5 && meanMotion <= 2.6) ||
      upper.includes("GPS") ||
      upper.includes("NAVSTAR") ||
      upper.includes("GALILEO") ||
      upper.includes("GSAT") ||
      upper.includes("COSMOS 2") && meanMotion < 3 ||
      upper.includes("BEIDOU")
    ) {
      effectiveCategory = "gnss";
    } else if (upper.includes("STARLINK")) {
      effectiveCategory = "starlink";
    } else if (upper.includes("NOAA") || upper.includes("METOP") || upper.includes("METEOR")) {
      effectiveCategory = "weather";
    } else if (noradId === 25544 || noradId === 48274) {
      effectiveCategory = "station";
    }

    let flagshipId: string | undefined;
    if (noradId === 25544) flagshipId = "iss";
    else if (noradId === 20580) flagshipId = "hubble";
    else if (noradId === 48274) flagshipId = "tiangong";
    else if (noradId === 51850 || upper.includes("GOES 18") || upper.includes("GOES-18")) flagshipId = "goes";

    results.push({
      noradId,
      name,
      line1,
      line2,
      category: effectiveCategory,
      epochAgeDays: computeTleEpochAgeDays(line1),
      flagshipId,
    });
  }

  return results;
}

export async function GET() {
  const activeTtl =
    tleCache?.source === "live" ? LIVE_CACHE_TTL_MS : FALLBACK_CACHE_TTL_MS;
  if (tleCache && Date.now() - tleCache.fetchedAt < activeTtl) {
    return NextResponse.json({
      satellites: tleCache.data,
      source: tleCache.source,
      count: tleCache.data.length,
      cachedAt: new Date(tleCache.fetchedAt).toISOString(),
    });
  }

  try {
    const settled = await Promise.allSettled(
      CELESTRAK_GROUPS.map(async (group) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 11000);
        try {
          const res = await fetch(group.url, {
            signal: controller.signal,
            headers: { "User-Agent": "ProjectCosmos-Shell1A/0.2" },
            cache: "no-store",
          });
          if (!res.ok) return [];
          const text = await res.text();
          return parseTLEText(text, group.category, group.limit);
        } finally {
          clearTimeout(timeout);
        }
      })
    );

    const byNorad = new Map<number, SatelliteTLE>();
    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        for (const sat of outcome.value) {
          if (!byNorad.has(sat.noradId)) {
            byNorad.set(sat.noradId, sat);
          }
        }
      }
    }

    // Ensure flagship targets + rich Starlink/Debris shells ALWAYS exist even if one CelesTrak group timed out
    const fallback = buildFallbackTLECatalog();
    for (const mustHave of fallback.slice(0, 16)) {
      if (!byNorad.has(mustHave.noradId)) {
        byNorad.set(mustHave.noradId, mustHave);
      }
    }

    const starlinkCount = Array.from(byNorad.values()).filter(
      (s) => s.category === "starlink"
    ).length;
    if (starlinkCount < 80) {
      for (const fb of fallback) {
        if (fb.category === "starlink" && !byNorad.has(fb.noradId)) {
          byNorad.set(fb.noradId, fb);
        }
      }
    }

    const debrisCount = Array.from(byNorad.values()).filter(
      (s) => s.category === "debris"
    ).length;
    if (debrisCount < 30) {
      for (const fb of fallback) {
        if (fb.category === "debris" && !byNorad.has(fb.noradId)) {
          byNorad.set(fb.noradId, fb);
        }
      }
    }

    // Ensure Shell 1B MEO GNSS & GEO Belt ALWAYS exist even if a CelesTrak group times out
    const gnssCount = Array.from(byNorad.values()).filter((s) => s.category === "gnss").length;
    if (gnssCount < 24) {
      for (const fb of fallback) {
        if (fb.category === "gnss" && !byNorad.has(fb.noradId)) {
          byNorad.set(fb.noradId, fb);
        }
      }
    }

    const geoCount = Array.from(byNorad.values()).filter((s) => s.category === "geo").length;
    if (geoCount < 36) {
      for (const fb of fallback) {
        if (fb.category === "geo" && !byNorad.has(fb.noradId)) {
          byNorad.set(fb.noradId, fb);
        }
      }
    }

    // Guarantee lead flagship IDs for starlink, gps, galileo, and goes!
    const liveList = Array.from(byNorad.values());
    if (!liveList.some((s) => s.flagshipId === "starlink")) {
      const firstStarlink = liveList.find((s) => s.category === "starlink");
      if (firstStarlink) firstStarlink.flagshipId = "starlink";
    }
    if (!liveList.some((s) => s.flagshipId === "gps")) {
      const firstGps = liveList.find(
        (s) => s.category === "gnss" && (s.name.toUpperCase().includes("GPS") || s.name.toUpperCase().includes("NAVSTAR"))
      ) ?? liveList.find((s) => s.category === "gnss");
      if (firstGps) firstGps.flagshipId = "gps";
    }
    if (!liveList.some((s) => s.flagshipId === "galileo")) {
      const firstGal = liveList.find(
        (s) => s.category === "gnss" && (s.name.toUpperCase().includes("GALILEO") || s.name.toUpperCase().includes("GSAT"))
      );
      if (firstGal) firstGal.flagshipId = "galileo";
    }
    if (!liveList.some((s) => s.flagshipId === "goes")) {
      const firstGeo = liveList.find(
        (s) => s.category === "geo" && s.name.toUpperCase().includes("GOES")
      ) ?? liveList.find((s) => s.category === "geo");
      if (firstGeo) firstGeo.flagshipId = "goes";
    }

    if (liveList.length >= 60) {
      tleCache = { data: liveList, source: "live", fetchedAt: Date.now() };
      return NextResponse.json({
        satellites: liveList,
        source: "live",
        count: liveList.length,
        cachedAt: new Date(tleCache.fetchedAt).toISOString(),
      });
    }
  } catch {
    // Fall through to rich multi-shell fallback catalog
  }

  const fallbackList = buildFallbackTLECatalog();
  tleCache = { data: fallbackList, source: "fallback", fetchedAt: Date.now() };
  return NextResponse.json({
    satellites: fallbackList,
    source: "fallback",
    count: fallbackList.length,
    cachedAt: new Date(tleCache.fetchedAt).toISOString(),
  });
}
