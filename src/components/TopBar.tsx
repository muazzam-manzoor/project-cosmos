"use client";

import {
  Compass,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  Microscope,
  Orbit,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";
import { SpectralMode, UserPersona, ViewMode } from "@/types/cosmos";

const PERSONAS: Array<{ id: UserPersona; label: string; icon: typeof Sparkles }> = [
  { id: "explorer", label: "Explorer", icon: Sparkles },
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "teacher", label: "Teacher", icon: Users },
  { id: "scientist", label: "Scientist", icon: Microscope },
];

const SPECTRAL_MODES: Array<{ id: SpectralMode; label: string; short: string }> = [
  { id: "optical", label: "Optical", short: "OPT" },
  { id: "infrared", label: "Thermal IR", short: "IR" },
  { id: "radar", label: "Radar", short: "RAD" },
];

const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: typeof Orbit }> = [
  { id: "orbit", label: "3D Orbit", icon: Orbit },
  { id: "ground", label: "Ground Sky", icon: Compass },
  { id: "iss-interior", label: "ISS Interior", icon: Layers },
];

export function TopBar() {
  const persona = useCosmosStore((s) => s.persona);
  const setPersona = useCosmosStore((s) => s.setPersona);
  const hudMode = useCosmosStore((s) => s.hudMode);
  const toggleHudMode = useCosmosStore((s) => s.toggleHudMode);
  const spectralMode = useCosmosStore((s) => s.spectralMode);
  const setSpectralMode = useCosmosStore((s) => s.setSpectralMode);
  const viewMode = useCosmosStore((s) => s.viewMode);
  const setViewMode = useCosmosStore((s) => s.setViewMode);
  const satellitesSource = useCosmosStore((s) => s.satellitesSource);
  const memoryStats = useCosmosStore((s) => s.memoryStats);
  const spaceWeather = useCosmosStore((s) => s.spaceWeather);
  const dispatchSpatialActions = useCosmosStore((s) => s.dispatchSpatialActions);

  const shellBand =
    memoryStats.cameraAltitudeKm > 900000
      ? "L1/L2"
      : memoryStats.cameraAltitudeKm > 60000
      ? "CISLUNAR"
      : memoryStats.cameraAltitudeKm > 28000
      ? "GEO"
      : memoryStats.cameraAltitudeKm > 2500
      ? "MEO"
      : "LEO";

  // Clean Cinema Mode shows only a whisper-thin floating restore button
  if (hudMode === "cinema") {
    return (
      <div className="pointer-events-auto ml-auto flex items-center gap-2">
        <button
          onClick={toggleHudMode}
          className="flex items-center gap-2 rounded-full border border-sky-400/30 bg-slate-950/75 px-3.5 py-2 text-xs font-medium text-sky-200 backdrop-blur-md transition hover:border-sky-400/60 hover:bg-slate-900"
        >
          <Eye className="h-3.5 w-3.5 text-sky-400" />
          Restore Tactical HUD
        </button>
      </div>
    );
  }

  return (
    <header className="pointer-events-auto flex w-full shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-400/20 bg-slate-950/82 px-3 py-1.5 backdrop-blur-xl shadow-2xl">
      {/* Brand + Shell 1A Status */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/40">
          <Radio className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mono text-xs font-bold tracking-[0.16em] text-white">
              PROJECT COSMOS
            </h1>
            <span className="hidden rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-sky-300 ring-1 ring-sky-400/30 sm:inline">
              SHELL 1–2 · 0–1.5M KM
            </span>
            <span className="hidden rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 md:inline">
              {shellBand}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  satellitesSource === "live" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {satellitesSource === "live" ? "CELESTRAK LIVE" : "SGP4 PROPAGATED"}
            </span>
            <span>·</span>
            <span title="Live LEO + MEO GNSS + GEO Belt tracked in real time via 64-bit SGP4 Web Worker">
              {memoryStats.trackedSatellites.toLocaleString()} TRACKED
            </span>
            <span>·</span>
            <span className="text-emerald-300">{memoryStats.fps} FPS</span>
            {spaceWeather && (
              <>
                <span className="hidden md:inline">·</span>
                <button
                  onClick={() =>
                    dispatchSpatialActions([
                      { type: "set_shell1b_layer", layer: "vanAllenBelts", enabled: true },
                      { type: "set_shell1b_layer", layer: "magnetosphere", enabled: true },
                      { type: "fly_to_target", targetId: "shell-1b" },
                    ])
                  }
                  className={`hidden items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-semibold transition hover:brightness-125 md:inline-flex ${
                    spaceWeather.kpIndex >= 5
                      ? "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40"
                      : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30"
                  }`}
                  title={`NOAA SWPC Space Weather (${spaceWeather.source.toUpperCase()}): Kp ${spaceWeather.kpIndex}, Solar Wind ${spaceWeather.solarWindKmS} km/s, IMF Bz ${spaceWeather.imfBzNt} nT. Click to view 3D Magnetosphere & Van Allen Belts!`}
                >
                  Kp {spaceWeather.kpIndex.toFixed(1)} · {spaceWeather.stormLevel}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Viewpoint + Adaptive User Persona Switchers */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* View Mode Switcher */}
        <div className="flex items-center rounded-xl border border-slate-700/70 bg-slate-900/80 p-0.5">
          {VIEW_MODES.map((vm) => {
            const Icon = vm.icon;
            const active = viewMode === vm.id;
            return (
              <button
                key={vm.id}
                onClick={() => setViewMode(vm.id)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{vm.label}</span>
              </button>
            );
          })}
        </div>

        {/* Adaptive Persona Switcher */}
        <div
          className="flex items-center rounded-xl border border-slate-700/70 bg-slate-900/80 p-0.5"
          title="Adapts scientific depth, formulas, and explanations"
        >
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const active = persona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-violet-500/25 text-violet-200 ring-1 ring-violet-400/50"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Spectral Vision (ALWAYS visible on all screen sizes!) + Tactical/Cinema Toggle */}
      <div className="flex items-center gap-1.5">
        <div
          className="flex items-center rounded-xl border border-slate-700/70 bg-slate-900/80 p-0.5"
          title="Spectral Vision Filter"
        >
          {SPECTRAL_MODES.map((sm) => {
            const active = spectralMode === sm.id;
            return (
              <button
                key={sm.id}
                onClick={() => setSpectralMode(sm.id)}
                className={`rounded-lg px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                  active
                    ? sm.id === "infrared"
                      ? "bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50"
                      : sm.id === "radar"
                      ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/50"
                      : "bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="hidden lg:inline">{sm.label}</span>
                <span className="lg:hidden">{sm.short}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={toggleHudMode}
          className="flex items-center gap-1.5 rounded-xl border border-sky-400/30 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 transition hover:bg-sky-500/20"
          title="Toggle Clean Cinema Mode (C)"
        >
          <EyeOff className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden sm:inline">Cinema</span>
        </button>
      </div>
    </header>
  );
}
