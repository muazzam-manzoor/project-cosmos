"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Newspaper,
  Pause,
  Play,
  Radio,
  Rocket,
  Video,
} from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";

const SPEEDS = [-300, -60, 1, 10, 60, 300];
const MAX_SCRUB_MIN = 720; // +/- 12 hours interactive 4D scrub window

export function BottomTimeBar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const hudMode = useCosmosStore((s) => s.hudMode);
  const simTimestamp = useCosmosStore((s) => s.simTimestamp);
  const timeMultiplier = useCosmosStore((s) => s.timeMultiplier);
  const isPaused = useCosmosStore((s) => s.isPaused);
  const setTimeMultiplier = useCosmosStore((s) => s.setTimeMultiplier);
  const setIsPaused = useCosmosStore((s) => s.setIsPaused);
  const scrubSimTimestamp = useCosmosStore((s) => s.scrubSimTimestamp);
  const snapToLive = useCosmosStore((s) => s.snapToLive);
  const activePanel = useCosmosStore((s) => s.activePanel);
  const setActivePanel = useCosmosStore((s) => s.setActivePanel);
  const aiDrawerOpen = useCosmosStore((s) => s.aiDrawerOpen);
  const setAiDrawerOpen = useCosmosStore((s) => s.setAiDrawerOpen);

  if (hudMode === "cinema") return null;

  const effectiveTs = mounted && simTimestamp > 0 ? simTimestamp : 0;
  const nowMs = mounted ? Date.now() : 0;
  const offsetMin =
    effectiveTs > 0
      ? Math.max(-MAX_SCRUB_MIN, Math.min(MAX_SCRUB_MIN, Math.round((effectiveTs - nowMs) / 60000)))
      : 0;

  const isLiveNow =
    mounted &&
    !isPaused &&
    timeMultiplier === 1 &&
    effectiveTs > 0 &&
    Math.abs(effectiveTs - nowMs) < 5000;

  const utcString =
    effectiveTs > 0
      ? new Date(effectiveTs).toISOString().replace("T", " ").slice(0, 19)
      : "---- -- -- --:--:--";

  return (
    <footer className="pointer-events-auto flex w-full shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-400/20 bg-slate-950/85 px-3 py-1.5 pl-11 sm:pl-3.5 backdrop-blur-xl shadow-2xl">
      {/* 4D Time Clock + Live Indicator */}
      <div className="flex items-center gap-2">
        <button
          onClick={snapToLive}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider transition ${
            isLiveNow
              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50"
              : "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40 hover:bg-amber-500/30"
          }`}
          title="Snap 4D orbital engine back to current live UTC (L)"
        >
          <Radio className={`h-3 w-3 ${isLiveNow ? "animate-pulse" : ""}`} />
          {isLiveNow ? "1x LIVE" : "SNAP LIVE"}
        </button>

        <div className="font-mono text-[11px] text-slate-200" suppressHydrationWarning>
          {utcString} <span className="text-[10px] text-slate-500">UTC</span>
        </div>
      </div>

      {/* 4D Time Multiplier + Interactive ±12h Scrub Slider */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-900/80 p-0.5">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
            title={isPaused ? "Resume 4D time (Space)" : "Pause 4D time (Space)"}
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>

          {SPEEDS.map((spd) => {
            const active = !isPaused && timeMultiplier === spd;
            return (
              <button
                key={spd}
                onClick={() => setTimeMultiplier(spd)}
                className={`rounded-lg px-1.5 py-1 font-mono text-[10px] font-semibold transition sm:px-2 ${
                  active
                    ? "bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {spd}x
              </button>
            );
          })}
        </div>

        {/* 4D Interactive Orbit Time Scrubber (±12h) */}
        <div
          className="hidden items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-1 xl:flex"
          title="Scrub 4D orbital time (-12h to +12h)"
        >
          <span className="font-mono text-[9px] text-slate-500">-12h</span>
          <input
            type="range"
            min={-MAX_SCRUB_MIN}
            max={MAX_SCRUB_MIN}
            step={1}
            value={offsetMin}
            onChange={(e) => {
              const mins = Number(e.target.value);
              scrubSimTimestamp(Date.now() + mins * 60000);
            }}
            className="h-1 w-24 cursor-pointer accent-sky-400"
            aria-label="4D Time Scrubber"
          />
          <span className="font-mono text-[9px] text-slate-500">+12h</span>
        </div>
      </div>

      {/* Quick Drawers & AI Spatial Commander */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setActivePanel("launches")}
          className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium transition sm:px-2.5 ${
            activePanel === "launches"
              ? "bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/50"
              : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white"
          }`}
        >
          <Rocket className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden md:inline">Launches</span>
        </button>

        <button
          onClick={() => setActivePanel("news")}
          className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium transition sm:px-2.5 ${
            activePanel === "news"
              ? "bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50"
              : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white"
          }`}
        >
          <Newspaper className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden md:inline">News</span>
        </button>

        <button
          onClick={() => setActivePanel("livecam")}
          className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium transition sm:px-2.5 ${
            activePanel === "livecam"
              ? "bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50"
              : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white"
          }`}
        >
          <Video className="h-3.5 w-3.5 text-rose-400" />
          <span className="hidden md:inline">ISS Cam</span>
        </button>

        <button
          onClick={() => setActivePanel("memory")}
          className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-medium transition sm:px-2.5 ${
            activePanel === "memory"
              ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/50"
              : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white"
          }`}
          title="4-Tier Spatial Memory & GPU Telemetry"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden lg:inline">GPU/Mem</span>
        </button>

        <button
          onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 ${
            aiDrawerOpen
              ? "bg-violet-500/35 text-white ring-1 ring-violet-400"
              : "bg-gradient-to-r from-sky-500/25 to-violet-500/25 text-sky-100 ring-1 ring-sky-400/40 hover:from-sky-500/35 hover:to-violet-500/35"
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-violet-300" />
          <span className="hidden sm:inline">AI Commander</span>
        </button>
      </div>
    </footer>
  );
}
