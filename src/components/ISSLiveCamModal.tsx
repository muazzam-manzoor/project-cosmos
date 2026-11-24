"use client";

import { useState } from "react";
import { ExternalLink, Moon, Radio, Sun, Video, X } from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";

const STREAMS = [
  {
    id: "ehdc",
    label: "ISS HD Earth View",
    embedUrl: "https://www.youtube.com/embed/P9C25Un7xaM?autoplay=1&mute=1",
    externalUrl: "https://www.youtube.com/watch?v=P9C25Un7xaM",
  },
  {
    id: "nasa-live",
    label: "NASA Live Feed",
    embedUrl: "https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1",
    externalUrl: "https://www.youtube.com/@NASA/streams",
  },
];

export function ISSLiveCamModal() {
  const activePanel = useCosmosStore((s) => s.activePanel);
  const setActivePanel = useCosmosStore((s) => s.setActivePanel);
  const issTelemetry = useCosmosStore((s) => s.issTelemetry);
  const [streamIdx, setStreamIdx] = useState(0);

  if (activePanel !== "livecam") return null;

  const currentStream = STREAMS[streamIdx];

  return (
    <div className="pointer-events-auto fixed bottom-20 left-1/2 z-40 w-[460px] max-w-[calc(100vw-24px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-rose-400/35 bg-slate-950/94 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-rose-400" />
          <span className="font-mono text-xs font-bold text-white">
            ISS LIVE EARTH-VIEWING FEED
          </span>
          <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-300">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          {STREAMS.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => setStreamIdx(idx)}
              className={`rounded-md px-2 py-0.5 font-mono text-[9px] transition ${
                streamIdx === idx
                  ? "bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st.label}
            </button>
          ))}
          <button
            onClick={() => setActivePanel("none")}
            className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative aspect-video w-full bg-slate-950">
        <iframe
          key={currentStream.id}
          src={currentStream.embedUrl}
          title={currentStream.label}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 px-3.5 py-2 font-mono text-[10px] text-slate-300">
        <div className="flex items-center gap-2">
          <span>
            {issTelemetry
              ? `ALT ${issTelemetry.altitudeKm.toFixed(1)} KM · ${issTelemetry.velocityKmS.toFixed(2)} KM/S · ${issTelemetry.latitude.toFixed(2)}°, ${issTelemetry.longitude.toFixed(2)}°`
              : "ISS ORBIT ~420 KM · 7.66 KM/S · 16 ORBITS/DAY"}
          </span>
          {issTelemetry && issTelemetry.inSunlight !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] ${
                issTelemetry.inSunlight
                  ? "bg-amber-500/15 text-amber-200"
                  : "bg-indigo-500/20 text-indigo-200"
              }`}
              title="During orbital night (~45 min/orbit), NASA ISS Earth cameras naturally appear dark."
            >
              {issTelemetry.inSunlight ? (
                <>
                  <Sun className="h-2.5 w-2.5 text-amber-300" /> DAYLIGHT
                </>
              ) : (
                <>
                  <Moon className="h-2.5 w-2.5 text-indigo-300" /> ORBITAL NIGHT
                </>
              )}
            </span>
          )}
        </div>
        <a
          href={currentStream.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sky-400 hover:underline"
        >
          Open Stream
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
