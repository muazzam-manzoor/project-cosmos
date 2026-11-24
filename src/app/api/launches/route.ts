import { NextResponse } from "next/server";
import { LaunchEvent } from "@/types/cosmos";
import { getFallbackLaunches } from "@/data/launchPads";

let launchCache: { data: LaunchEvent[]; source: "live" | "fallback"; fetchedAt: number } | null = null;
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000;
const FALLBACK_CACHE_TTL_MS = 30 * 1000;

interface LL2Launch {
  id: string;
  name?: string;
  net?: string;
  status?: { abbrev?: string; name?: string };
  launch_service_provider?: { name?: string };
  rocket?: { configuration?: { full_name?: string; name?: string } };
  mission?: { description?: string; orbit?: { name?: string } };
  pad?: {
    name?: string;
    latitude?: string | number;
    longitude?: string | number;
    location?: { name?: string };
  };
}

export async function GET() {
  const activeTtl =
    launchCache?.source === "live" ? LIVE_CACHE_TTL_MS : FALLBACK_CACHE_TTL_MS;
  if (launchCache && Date.now() - launchCache.fetchedAt < activeTtl) {
    return NextResponse.json({ launches: launchCache.data });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=detailed",
      {
        signal: controller.signal,
        headers: { "User-Agent": "ProjectCosmos-Shell1A/0.1" },
        cache: "no-store",
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const json = (await res.json()) as { results?: LL2Launch[] };
      const mapped: LaunchEvent[] = (json.results ?? []).map((item) => ({
        id: item.id,
        name: item.name ?? "Orbital Launch",
        provider: item.launch_service_provider?.name ?? "Space Agency",
        vehicle:
          item.rocket?.configuration?.full_name ??
          item.rocket?.configuration?.name ??
          "Orbital Rocket",
        padName: `${item.pad?.name ?? "Launch Pad"}${
          item.pad?.location?.name ? ` · ${item.pad.location.name}` : ""
        }`,
        lat: Number(item.pad?.latitude ?? 28.6083),
        lon: Number(item.pad?.longitude ?? -80.6041),
        net: item.net ?? new Date(Date.now() + 86400000).toISOString(),
        status: item.status?.abbrev ?? item.status?.name ?? "Scheduled",
        missionDescription:
          item.mission?.description ??
          "Orbital payload deployment into Low Earth Orbit or transfer trajectory.",
        orbit: item.mission?.orbit?.name ?? "LEO",
        source: "live",
      }));

      if (mapped.length > 0) {
        launchCache = { data: mapped, source: "live", fetchedAt: Date.now() };
        return NextResponse.json({ launches: mapped });
      }
    }
  } catch {
    // Graceful fallback below
  }

  const fallback = getFallbackLaunches();
  launchCache = { data: fallback, source: "fallback", fetchedAt: Date.now() };
  return NextResponse.json({ launches: fallback });
}
