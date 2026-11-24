import { NextResponse } from "next/server";
import { SpaceNewsItem } from "@/types/cosmos";
import { getFallbackNews } from "@/data/launchPads";

let newsCache: { data: SpaceNewsItem[]; source: "live" | "fallback"; fetchedAt: number } | null = null;
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000;
const FALLBACK_CACHE_TTL_MS = 30 * 1000;

interface SNAPIArticle {
  id: number | string;
  title?: string;
  summary?: string;
  url?: string;
  image_url?: string;
  news_site?: string;
  published_at?: string;
}

function sanitizeSummary(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/Discover the cosmos![^.]*\./gi, "")
    .replace(/(?:Archive|Submissions|Index|Search|Calendar|RSS|Education|About APOD|Discuss)\s*[|/>]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const activeTtl =
    newsCache?.source === "live" ? LIVE_CACHE_TTL_MS : FALLBACK_CACHE_TTL_MS;
  if (newsCache && Date.now() - newsCache.fetchedAt < activeTtl) {
    return NextResponse.json({ news: newsCache.data });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      "https://api.spaceflightnewsapi.net/v4/articles/?limit=12",
      {
        signal: controller.signal,
        headers: { "User-Agent": "ProjectCosmos-Shell1A/0.1" },
        cache: "no-store",
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const json = (await res.json()) as { results?: SNAPIArticle[] };
      const mapped: SpaceNewsItem[] = (json.results ?? []).map((a) => ({
        id: String(a.id),
        title: a.title ?? "Spaceflight Update",
        summary: sanitizeSummary(a.summary),
        url: a.url ?? "https://www.nasa.gov",
        imageUrl: a.image_url,
        newsSite: a.news_site ?? "Spaceflight News",
        publishedAt: a.published_at ?? new Date().toISOString(),
        source: "live",
      }));

      if (mapped.length > 0) {
        newsCache = { data: mapped, source: "live", fetchedAt: Date.now() };
        return NextResponse.json({ news: mapped });
      }
    }
  } catch {
    // Graceful fallback below
  }

  const fallback = getFallbackNews();
  newsCache = { data: fallback, source: "fallback", fetchedAt: Date.now() };
  return NextResponse.json({ news: fallback });
}
