"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Newspaper, Rocket, X } from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";
import { formatCountdown } from "@/engine/geoMath";
import { LAUNCH_PADS } from "@/data/launchPads";

export function LaunchesNewsModal() {
  const activePanel = useCosmosStore((s) => s.activePanel);
  const setActivePanel = useCosmosStore((s) => s.setActivePanel);
  const launches = useCosmosStore((s) => s.launches);
  const news = useCosmosStore((s) => s.news);
  const dispatchSpatialActions = useCosmosStore((s) => s.dispatchSpatialActions);

  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (activePanel !== "launches") return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activePanel]);

  if (activePanel !== "launches" && activePanel !== "news") return null;

  const flyToLaunchPad = (lat: number, lon: number, padId?: string) => {
    if (padId) {
      dispatchSpatialActions([{ type: "fly_to_target", targetId: `pad-${padId}` }]);
      setActivePanel("none");
      return;
    }
    // Find nearest known pad
    let best = LAUNCH_PADS[0];
    let bestDist = Infinity;
    for (const p of LAUNCH_PADS) {
      const d = Math.hypot(p.lat - lat, p.lon - lon);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    dispatchSpatialActions([{ type: "fly_to_target", targetId: `pad-${best.id}` }]);
    setActivePanel("none");
  };

  return (
    <div className="pointer-events-auto fixed left-1/2 top-20 z-40 flex max-h-[72vh] w-[540px] max-w-[calc(100vw-24px)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-sky-400/30 bg-slate-950/92 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          {activePanel === "launches" ? (
            <Rocket className="h-4 w-4 text-amber-400" />
          ) : (
            <Newspaper className="h-4 w-4 text-sky-400" />
          )}
          <h3 className="text-sm font-bold text-white">
            {activePanel === "launches"
              ? "Upcoming Global Orbital Launches"
              : "Live Spaceflight & Orbital News"}
          </h3>
        </div>
        <button
          onClick={() => setActivePanel("none")}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {activePanel === "launches" &&
          launches.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 transition hover:border-amber-400/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">{l.name}</div>
                  <div className="font-mono text-[10px] text-amber-300">
                    {l.provider} · {l.orbit}
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-amber-500/20 px-2 py-1 font-mono text-[11px] font-bold text-amber-200 ring-1 ring-amber-400/40">
                  {formatCountdown(l.net, nowMs)}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-300">
                {l.missionDescription}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate font-mono">{l.padName}</span>
                <button
                  onClick={() => flyToLaunchPad(l.lat, l.lon, l.padId)}
                  className="ml-2 flex shrink-0 items-center gap-1 rounded-lg bg-sky-500/15 px-2 py-1 font-medium text-sky-300 hover:bg-sky-500/25"
                >
                  <MapPin className="h-3 w-3" />
                  Fly to Pad
                </button>
              </div>
            </div>
          ))}

        {activePanel === "news" &&
          news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-slate-800 bg-slate-900/80 p-3 transition hover:border-sky-400/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-white">{item.title}</div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-300">
                {item.summary}
              </p>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                <span className="text-sky-300">{item.newsSite}</span>
                <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}
