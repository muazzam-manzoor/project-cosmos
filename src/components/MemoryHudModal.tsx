"use client";

import { Activity, Cpu, ShieldCheck, Trash2, X } from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";

export function MemoryHudModal() {
  const activePanel = useCosmosStore((s) => s.activePanel);
  const setActivePanel = useCosmosStore((s) => s.setActivePanel);
  const stats = useCosmosStore((s) => s.memoryStats);
  const triggerCacheFlush = useCosmosStore((s) => s.triggerCacheFlush);
  const triggerStressTest = useCosmosStore((s) => s.triggerStressTest);
  const stressTestResult = useCosmosStore((s) => s.stressTestResult);

  if (activePanel !== "memory") return null;

  return (
    <div className="pointer-events-auto fixed left-1/2 top-20 z-40 w-[440px] max-w-[calc(100vw-24px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950/94 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <h3 className="font-mono text-xs font-bold tracking-wider text-white">
            4-TIER SPATIAL MEMORY & GPU MONITOR
          </h3>
        </div>
        <button
          onClick={() => setActivePanel("none")}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2.5 p-4 font-mono text-xs">
        <div className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
          <div>
            <div className="text-[10px] text-emerald-300">ACTIVE STREAMING TIER</div>
            <div className="mt-0.5 text-sm font-bold text-white">{stats.activeTier}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-400">ASTRO WORKER</div>
            <div
              className={`text-[10px] font-bold ${
                stats.workerActive ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {stats.workerActive ? "WEB WORKER ON" : "SYNC FALLBACK"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">FRAME RATE</div>
            <div className="text-lg font-bold text-emerald-300">{stats.fps} FPS</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">SGP4 PROPAGATION</div>
            <div className="text-lg font-bold text-sky-300">
              {stats.workerPropagationMs} ms
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">GPU DRAW CALLS</div>
            <div className="text-sm font-bold text-white">{stats.drawCalls}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">TRIANGLES</div>
            <div className="text-sm font-bold text-white">
              {stats.triangles.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">VRAM GEOMETRIES</div>
            <div className="text-sm font-bold text-violet-300">{stats.geometries}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">VRAM TEXTURES</div>
            <div className="text-sm font-bold text-violet-300">{stats.textures}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">LRU LOD CACHED</div>
            <div className="text-sm font-bold text-amber-300">
              {stats.lruCachedAssets} models
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="text-[10px] text-slate-400">DISPOSED / EVICTED</div>
            <div className="text-sm font-bold text-rose-300">
              {stats.evictedAssets} assets
            </div>
          </div>
        </div>

        <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-sky-400" />
              Camera Altitude
            </span>
            <span className="font-bold text-white">
              {stats.cameraAltitudeKm.toLocaleString()} km
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Floating-Origin Bridge (Float64→32)</span>
            <span
              className={
                stats.floatingOriginActive ? "font-bold text-emerald-300" : "text-slate-400"
              }
            >
              {stats.floatingOriginActive
                ? `LOCKED · ${stats.floatingOriginOffsetKm.toLocaleString()} km`
                : "EARTH ANCHOR (0,0,0)"}
            </span>
          </div>
        </div>

        {stressTestResult && (
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-200">
            {stressTestResult}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={triggerStressTest}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/15 py-2 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-500/25"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            50-Cycle Leak Test
          </button>

          <button
            onClick={triggerCacheFlush}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/35 bg-rose-500/15 py-2 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/25"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Flush Unused LOD
          </button>
        </div>
      </div>
    </div>
  );
}
