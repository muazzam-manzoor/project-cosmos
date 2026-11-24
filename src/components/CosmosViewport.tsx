"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Eye, Layers, Moon, Rocket, Sun } from "lucide-react";
import { CosmosEngine } from "@/engine/CosmosEngine";
import { useCosmosStore } from "@/store/useCosmosStore";
import { FLAGSHIP_PROFILES, ISS_MODULES } from "@/data/knowledgeBase";
import { LUNAR_LANDMARKS } from "@/data/lunarLandmarks";

export function CosmosViewport() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CosmosEngine | null>(null);

  const satellites = useCosmosStore((s) => s.satellites);
  const satellitesSource = useCosmosStore((s) => s.satellitesSource);
  const neos = useCosmosStore((s) => s.neos);
  const hoveredObject = useCosmosStore((s) => s.hoveredObject);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new CosmosEngine(containerRef.current);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && satellites.length > 0) {
      engineRef.current.loadSatellites(satellites, satellitesSource);
    }
  }, [satellites, satellitesSource]);

  useEffect(() => {
    if (engineRef.current && neos.length > 0) {
      engineRef.current.loadNeos(neos);
    }
  }, [neos]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020611]">
      <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(2,6,17,0.68)_100%)]" />

      {/* Live Hover Tooltip over any Satellite or 3D Launch Complex */}
      {hoveredObject && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl border border-sky-400/40 bg-slate-950/92 px-2.5 py-1.5 backdrop-blur-md shadow-xl"
          style={{
            left: Math.min(
              hoveredObject.x + 14,
              typeof window !== "undefined" ? window.innerWidth - 260 : hoveredObject.x + 14
            ),
            top: Math.max(12, hoveredObject.y - 44),
          }}
        >
          <div className="text-[11px] font-bold text-white">{hoveredObject.label}</div>
          <div className="font-mono text-[9px] text-sky-300">{hoveredObject.sub}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Floating Sub-Mode Dock & Exit-Focus Pill rendered inside the zero-overlap flex HUD center column.
 */
export function ViewportSubModeDock() {
  const viewMode = useCosmosStore((s) => s.viewMode);
  const hudMode = useCosmosStore((s) => s.hudMode);
  const selectedTargetId = useCosmosStore((s) => s.selectedTargetId);
  const selectedTelemetry = useCosmosStore((s) => s.selectedTelemetry);
  const observerCity = useCosmosStore((s) => s.observerCity);
  const overheadSatellites = useCosmosStore((s) => s.overheadSatellites);
  const selectedIssModuleId = useCosmosStore((s) => s.selectedIssModuleId);
  const setSelectedIssModuleId = useCosmosStore((s) => s.setSelectedIssModuleId);
  const issCutawayAmount = useCosmosStore((s) => s.issCutawayAmount);
  const setIssCutawayAmount = useCosmosStore((s) => s.setIssCutawayAmount);
  const issInsideCabin = useCosmosStore((s) => s.issInsideCabin);
  const setIssInsideCabin = useCosmosStore((s) => s.setIssInsideCabin);
  const groundStargazerNight = useCosmosStore((s) => s.groundStargazerNight);
  const setGroundStargazerNight = useCosmosStore((s) => s.setGroundStargazerNight);
  const exitFocus = useCosmosStore((s) => s.exitFocus);
  const dispatchSpatialActions = useCosmosStore((s) => s.dispatchSpatialActions);
  const layers = useCosmosStore((s) => s.layers);
  const neos = useCosmosStore((s) => s.neos);

  if (hudMode === "cinema") return null;

  if (viewMode === "iss-interior") {
    return (
      <div className="pointer-events-auto flex max-w-full flex-col items-center gap-1.5 rounded-xl border border-sky-400/30 bg-slate-950/90 px-3 py-2 backdrop-blur-md shadow-2xl">
        <div className="flex flex-wrap items-center justify-center gap-2.5 border-b border-slate-800/90 pb-1.5">
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
            <Layers className="h-3 w-3 text-sky-400" />
            <span>HULL CUTAWAY</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(issCutawayAmount * 100)}
              onChange={(e) => setIssCutawayAmount(Number(e.target.value) / 100)}
              className="h-1 w-24 cursor-pointer accent-sky-400"
              aria-label="ISS Hull Cutaway"
            />
            <span className="w-8 text-sky-300">{Math.round(issCutawayAmount * 100)}%</span>
          </div>

          <button
            onClick={() => setIssInsideCabin(!issInsideCabin)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition ${
              issInsideCabin
                ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/50"
                : "border border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400/50"
            }`}
          >
            <Eye className="h-3 w-3" />
            {issInsideCabin ? "Inside Cabin ON" : "Step Inside Cabin"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-sky-400">
            Modules:
          </span>
          {ISS_MODULES.map((mod) => {
            const active = selectedIssModuleId === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedIssModuleId(mod.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-sky-500/25 text-white ring-1 ring-sky-400"
                    : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: mod.color }}
                />
                {mod.name.split(" ")[0]}
              </button>
            );
          })}
          <button
            onClick={exitFocus}
            className="ml-1 flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/25"
          >
            <ArrowLeft className="h-3 w-3" />
            Exit to Earth (Esc)
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === "ground") {
    return (
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-slate-950/88 px-3.5 py-2 backdrop-blur-md shadow-2xl">
        <div className="font-mono text-[11px] text-emerald-300">
          {observerCity.name.toUpperCase()} SKY ({observerCity.lat.toFixed(1)}°,{" "}
          {observerCity.lon.toFixed(1)}°)
        </div>
        <span className="text-[11px] text-slate-300">
          {overheadSatellites.length} overhead · Click any glowing streak to launch
        </span>
        <button
          onClick={() => setGroundStargazerNight(!groundStargazerNight)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
            groundStargazerNight
              ? "bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/50"
              : "border border-slate-700 bg-slate-900 text-amber-200 hover:border-amber-400/40"
          }`}
          title="Toggle between real local Sun time and clear Milky Way stargazer night"
        >
          {groundStargazerNight ? (
            <>
              <Moon className="h-3 w-3" /> Stargazer Night
            </>
          ) : (
            <>
              <Sun className="h-3 w-3" /> Real Local Sky
            </>
          )}
        </button>
        <button
          onClick={() => dispatchSpatialActions([{ type: "fly_to_target", targetId: "iss" }])}
          className="flex items-center gap-1 rounded-lg border border-sky-400/40 bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          <Rocket className="h-3 w-3" />
          Launch to ISS
        </button>
        <button
          onClick={exitFocus}
          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2 py-1 text-xs text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Earth (Esc)
        </button>
      </div>
    );
  }

  // Orbit View: Show clickable Shell 1B Legend Chips (when Van Allen/Magnetosphere/Hohmann active)
  // AND/OR the active Tracking + Exit Focus Pill!
  const shell1bChips: Array<{ id: string; label: string; dot: string }> = [];
  if (layers.vanAllenBelts) {
    shell1bChips.push(
      { id: "phenom-van-allen-inner", label: "Inner Proton Donut", dot: "#e879f9" },
      { id: "phenom-van-allen-outer", label: "Outer Electron Donut", dot: "#38bdf8" }
    );
  }
  if (layers.magnetosphere) {
    shell1bChips.push({
      id: "phenom-magnetosphere",
      label: "Solar Wind & Bow Shock",
      dot: "#67e8f9",
    });
  }
  if (layers.hohmannTransfer) {
    shell1bChips.push(
      { id: "phenom-perigee-burn", label: "Perigee Δv₁", dot: "#38bdf8" },
      { id: "phenom-hohmann-craft", label: "GTO Craft", dot: "#34d399" },
      { id: "phenom-apogee-burn", label: "Apogee Δv₂", dot: "#fbbf24" }
    );
  }

  const isFocused =
    Boolean(selectedTargetId) &&
    selectedTargetId !== "earth" &&
    selectedTargetId !== "shell-1b" &&
    selectedTargetId !== "cislunar";

  const focusLabel =
    selectedTelemetry?.name ??
    (selectedTargetId.startsWith("lunar-")
      ? LUNAR_LANDMARKS.find((l) => `lunar-${l.id}` === selectedTargetId)?.name
      : undefined) ??
    (selectedTargetId.startsWith("neo-")
      ? neos.find((n) => n.id === selectedTargetId)?.name
      : undefined) ??
    FLAGSHIP_PROFILES[selectedTargetId]?.name ??
    selectedTargetId.replace("pad-", "").toUpperCase();

  if (!isFocused && shell1bChips.length === 0) return null;

  return (
    <div className="pointer-events-auto flex max-w-full flex-col items-center gap-1.5">
      {shell1bChips.length > 0 && (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border border-sky-400/25 bg-slate-950/88 px-2.5 py-1.5 backdrop-blur-md shadow-xl">
          <span className="mr-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
            Inspect:
          </span>
          {shell1bChips.map((chip) => {
            const active = selectedTargetId === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() =>
                  dispatchSpatialActions([{ type: "fly_to_target", targetId: chip.id }])
                }
                className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 font-mono text-[10px] font-medium transition ${
                  active
                    ? "bg-sky-500/30 text-white ring-1 ring-sky-400"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: chip.dot }}
                />
                {chip.label}
              </button>
            );
          })}
        </div>
      )}

      {isFocused && (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-sky-400/35 bg-slate-950/90 px-3 py-1.5 backdrop-blur-md shadow-2xl">
          <span className="max-w-[220px] truncate font-mono text-[10px] font-semibold text-sky-200">
            {focusLabel}
          </span>
          <button
            onClick={exitFocus}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-amber-400/45 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200 transition hover:bg-amber-500/30"
            title="Release tracking and return to Earth Overview (Esc)"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Earth (Esc)
          </button>
        </div>
      )}
    </div>
  );
}
