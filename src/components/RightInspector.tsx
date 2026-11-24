"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Atom,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Dna,
  FlaskConical,
  Layers,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Unlock,
  Video,
} from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";
import { FLAGSHIP_PROFILES, ISS_MODULES } from "@/data/knowledgeBase";
import { LAUNCH_PADS } from "@/data/launchPads";
import { LUNAR_LANDMARKS } from "@/data/lunarLandmarks";
import { EARTH_RADIUS_KM } from "@/engine/geoMath";
import {
  getHeroPhotoForTarget,
  resolveSpacecraftArchetype,
} from "@/engine/SpacecraftModels";

type ScienceFilter = "all" | "physics" | "chemistry" | "biology" | "engineering";

const MU_EARTH_KM3_S2 = 398600.4418;
const G0_M_S2 = 9.80665;

export function RightInspector() {
  const [collapsed, setCollapsed] = useState(false);
  const [scienceFilter, setScienceFilter] = useState<ScienceFilter>("all");

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  const hudMode = useCosmosStore((s) => s.hudMode);
  const aiDrawerOpen = useCosmosStore((s) => s.aiDrawerOpen);
  const persona = useCosmosStore((s) => s.persona);
  const viewMode = useCosmosStore((s) => s.viewMode);
  const selectedTargetId = useCosmosStore((s) => s.selectedTargetId);
  const selectedIssModuleId = useCosmosStore((s) => s.selectedIssModuleId);
  const telemetry = useCosmosStore((s) => s.selectedTelemetry);
  const hohmannTelemetry = useCosmosStore((s) => s.hohmannTelemetry);
  const spaceWeather = useCosmosStore((s) => s.spaceWeather);
  const moonTelemetry = useCosmosStore((s) => s.moonTelemetry);
  const moonCutawayAmount = useCosmosStore((s) => s.moonCutawayAmount);
  const setMoonCutawayAmount = useCosmosStore((s) => s.setMoonCutawayAmount);
  const neos = useCosmosStore((s) => s.neos);
  const dscovrEpic = useCosmosStore((s) => s.dscovrEpic);
  const dispatchSpatialActions = useCosmosStore((s) => s.dispatchSpatialActions);
  const rideAlongLocked = useCosmosStore((s) => s.rideAlongLocked);
  const setRideAlongLocked = useCosmosStore((s) => s.setRideAlongLocked);
  const setViewMode = useCosmosStore((s) => s.setViewMode);
  const setActivePanel = useCosmosStore((s) => s.setActivePanel);
  const exitFocus = useCosmosStore((s) => s.exitFocus);

  if (hudMode === "cinema" || aiDrawerOpen) return null;

  if (collapsed) {
    return (
      <div className="pointer-events-auto self-start">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1 rounded-xl border border-sky-400/25 bg-slate-950/85 px-2.5 py-2 text-xs text-sky-200 backdrop-blur-md hover:bg-slate-900 shadow-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          Intel
        </button>
      </div>
    );
  }

  // Case 1: Tier 3 ISS Interior Cutaway Inspector
  if (viewMode === "iss-interior") {
    const mod =
      ISS_MODULES.find((m) => m.id === selectedIssModuleId) ?? ISS_MODULES[0];
    return (
      <aside className="pointer-events-auto flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-sky-400/25 bg-slate-950/88 backdrop-blur-xl shadow-2xl lg:w-[340px]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: mod.color }}
              />
              <h2 className="text-sm font-bold text-white">{mod.name}</h2>
            </div>
            <p className="font-mono text-[10px] text-sky-300">
              {mod.agency} · TIER 3 ARCHITECTURAL CUTAWAY
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={exitFocus}
              className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-200 hover:bg-amber-500/25"
              title="Exit Interior (Esc)"
            >
              Exit
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
          {/* Real NASA ISS Photograph Banner */}
          <div className="relative h-28 w-full overflow-hidden rounded-xl border border-slate-800">
            <img
              src="/images/iss.jpg"
              alt="NASA International Space Station"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent px-2.5 py-1.5 font-mono text-[9px] text-sky-200">
              REAL NASA PHOTO · {mod.role}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-violet-300">
              {persona} Briefing
            </div>
            <p className="leading-relaxed text-slate-200">{mod.overview[persona]}</p>
          </div>

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-emerald-300">
              <FlaskConical className="h-3.5 w-3.5" /> Chemistry & Life Support
            </div>
            <p className="leading-relaxed text-slate-300">{mod.chemistry}</p>
          </div>

          <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-rose-300">
              <Dna className="h-3.5 w-3.5" /> Microgravity Biology
            </div>
            <p className="leading-relaxed text-slate-300">{mod.biology}</p>
          </div>

          <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-sky-300">
              <Atom className="h-3.5 w-3.5" /> Orbital Physics
            </div>
            <p className="leading-relaxed text-slate-300">{mod.physics}</p>
          </div>

          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Key Hardware Racks
            </div>
            {mod.keySystems.map((sys) => (
              <div
                key={sys}
                className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 font-mono text-[11px] text-slate-200"
              >
                • {sys}
              </div>
            ))}
          </div>

          <button
            onClick={() => setActivePanel("livecam")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
          >
            <Video className="h-3.5 w-3.5" />
            Open ISS Live Earth-Viewing Cam
          </button>
        </div>
      </aside>
    );
  }

  // Case 2: 3D Launch Complex Selected
  if (selectedTargetId.startsWith("pad-")) {
    const pad = LAUNCH_PADS.find((p) => `pad-${p.id}` === selectedTargetId);
    if (pad) {
      return (
        <aside className="pointer-events-auto flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950/88 backdrop-blur-xl shadow-2xl lg:w-[340px]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-amber-300">{pad.name}</h2>
              <p className="font-mono text-[10px] text-slate-400">
                {pad.agency} · {pad.country}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={exitFocus}
                className="flex items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-200 hover:bg-amber-500/25"
                title="Back to Earth (Esc)"
              >
                <ArrowLeft className="h-3 w-3" />
                Earth
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
            <div className="relative h-28 w-full overflow-hidden rounded-xl border border-slate-800">
              <img
                src="/images/launch.jpg"
                alt={pad.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent px-2.5 py-1.5 font-mono text-[9px] text-amber-200">
                REAL NASA LAUNCH PHOTO · 3D COMPLEX ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                <div className="font-mono text-[9px] text-slate-400">LATITUDE</div>
                <div className="font-mono text-sm font-semibold text-white">
                  {pad.lat.toFixed(4)}°
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                <div className="font-mono text-[9px] text-slate-400">LONGITUDE</div>
                <div className="font-mono text-sm font-semibold text-white">
                  {pad.lon.toFixed(4)}°
                </div>
              </div>
            </div>
            <p className="leading-relaxed text-slate-300">{pad.description}</p>
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase text-slate-400">
                Active Launch Vehicles
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pad.vehicles.map((v) => (
                  <span
                    key={v}
                    className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-200"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActivePanel("launches")}
              className="w-full rounded-xl border border-sky-400/40 bg-sky-500/20 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
            >
              View Global Upcoming Launches
            </button>
          </div>
        </aside>
      );
    }
  }

  // Case 2.5: Shell 2 Lunar Landmark Selected (Apollo 11, Artemis III South Pole, Tycho, Mare Imbrium, SPA Basin)
  if (selectedTargetId.startsWith("lunar-")) {
    const lm = LUNAR_LANDMARKS.find((l) => `lunar-${l.id}` === selectedTargetId);
    if (lm) {
      return (
        <aside className="pointer-events-auto flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950/88 backdrop-blur-xl shadow-2xl lg:w-[340px]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
                LUNAR {lm.type} · {lm.missionYear ?? "NASA LRO MAPPED"}
              </div>
              <h2 className="truncate text-sm font-bold text-white">{lm.name}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => dispatchSpatialActions([{ type: "fly_to_target", targetId: "moon" }])}
                className="rounded-lg border border-sky-400/35 bg-sky-500/10 px-2 py-1 font-mono text-[10px] text-sky-200 hover:bg-sky-500/25"
              >
                Moon
              </button>
              <button
                onClick={exitFocus}
                className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-200 hover:bg-amber-500/25"
              >
                Exit
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
            <div className="relative h-28 w-full overflow-hidden rounded-xl border border-slate-800">
              <img src="/images/moon.jpg" alt={lm.name} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent px-2.5 py-1.5 font-mono text-[9px] text-amber-200">
                SELENOGRAPHIC: {lm.lat.toFixed(2)}°, {lm.lon.toFixed(2)}° {lm.agency ? `· ${lm.agency}` : ""}
              </div>
            </div>

            <p className="leading-relaxed text-slate-200">{lm.description}</p>

            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> Highlighted Discovery
              </div>
              <p className="leading-relaxed text-amber-100">{lm.highlight}</p>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-emerald-300">
                <FlaskConical className="h-3.5 w-3.5" /> Lunar Geology & Chemistry
              </div>
              <p className="leading-relaxed text-slate-300">{lm.geology}</p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                Jump to Other Lunar Sites
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {LUNAR_LANDMARKS.map((other) => (
                  <button
                    key={other.id}
                    onClick={() =>
                      dispatchSpatialActions([{ type: "fly_to_target", targetId: `lunar-${other.id}` }])
                    }
                    className={`rounded-lg border px-2 py-1 text-left font-mono text-[10px] transition ${
                      other.id === lm.id
                        ? "border-amber-400/60 bg-amber-500/20 text-amber-200"
                        : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-sky-400/40"
                    }`}
                  >
                    {other.shortName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      );
    }
  }

  // Case 3: Flagship, Shell 2 Deep Space Target, or Tracked Satellite
  const selectedNeo = selectedTargetId.startsWith("neo-")
    ? neos.find((n) => n.id === selectedTargetId) ?? null
    : null;

  const archetype = telemetry
    ? resolveSpacecraftArchetype(telemetry.name, telemetry.category)
    : undefined;

  const resolvedProfileKey = (() => {
    if (FLAGSHIP_PROFILES[selectedTargetId]) return selectedTargetId;
    if (selectedNeo) return "neo-bennu";
    if (selectedTargetId === "galileo") return "gps";
    if (archetype) {
      if (FLAGSHIP_PROFILES[archetype]) return archetype;
      if (archetype === "gnss") return "gps";
      if (archetype === "geo" || archetype === "tdrs") return "goes";
      if (archetype === "aqua" || archetype === "sentinel" || archetype === "science-generic")
        return "terra";
      if (archetype === "swift") return "fermi";
      if (telemetry?.category === "gnss") return "gps";
      if (telemetry?.category === "geo") return "goes";
      if (telemetry?.category === "weather") return "weather";
      if (telemetry?.category === "debris") return "debris";
      if (telemetry?.category === "starlink") return "starlink";
      return "landsat";
    }
    return "earth";
  })();

  const flagship = FLAGSHIP_PROFILES[resolvedProfileKey] ?? FLAGSHIP_PROFILES.earth;
  const heroPhoto =
    selectedTargetId === "dscovr" && dscovrEpic
      ? { url: dscovrEpic.imageUrl, caption: dscovrEpic.caption }
      : getHeroPhotoForTarget(selectedTargetId, archetype);

  const isGenericSat =
    selectedTargetId.startsWith("sat-") &&
    telemetry &&
    !FLAGSHIP_PROFILES[selectedTargetId];

  const displayName = selectedNeo
    ? selectedNeo.name
    : isGenericSat
    ? telemetry.name
    : flagship.name;
  const displaySub = selectedNeo
    ? `${selectedNeo.spectralType} · ${selectedNeo.closeApproachDate}`
    : isGenericSat
    ? `NORAD #${telemetry.noradId} · ${telemetry.category.toUpperCase()} OBJECT`
    : flagship.subtitle;
  const provenance = selectedNeo?.provenance ?? telemetry?.provenance ?? flagship.provenance;

  const liveCalc = telemetry
    ? (() => {
        const r = EARTH_RADIUS_KM + telemetry.altitudeKm;
        const vCirc = Math.sqrt(MU_EARTH_KM3_S2 / r);
        const gLocal = G0_M_S2 * Math.pow(EARTH_RADIUS_KM / r, 2);
        const gPct = (gLocal / G0_M_S2) * 100;
        const horizonKm = Math.sqrt(
          2 * EARTH_RADIUS_KM * telemetry.altitudeKm +
            telemetry.altitudeKm * telemetry.altitudeKm
        );
        return { vCirc, gLocal, gPct, horizonKm };
      })()
    : null;

  const showSection = (sec: Exclude<ScienceFilter, "all">) =>
    scienceFilter === "all" || scienceFilter === sec;

  return (
    <aside className="pointer-events-auto flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-slate-950/88 backdrop-blur-xl shadow-2xl lg:w-[340px]">
      {/* Header + Prominent Exit Button */}
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-800 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider ${
                telemetry?.dataSource === "live" || provenance === "LIVE_TELEMETRY"
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
                  : "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40"
              }`}
              title={telemetry?.provenanceDetail ?? flagship.provenanceDetail}
            >
              {telemetry?.dataSource === "live"
                ? "LIVE TLE · SGP4"
                : provenance.replace(/_/g, " ")}
            </span>
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-[9px] uppercase text-violet-300">
              {persona}
            </span>
            {telemetry && telemetry.inSunlight !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold ${
                  telemetry.inSunlight
                    ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30"
                    : "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30"
                }`}
              >
                {telemetry.inSunlight ? (
                  <>
                    <Sun className="h-2.5 w-2.5 text-amber-300" />
                    SUNLIT
                  </>
                ) : (
                  <>
                    <Moon className="h-2.5 w-2.5 text-indigo-300" />
                    SHADOW
                  </>
                )}
              </span>
            )}
          </div>
          <h2 className="truncate text-sm font-bold text-white">{displayName}</h2>
          <p className="truncate font-mono text-[10px] text-slate-400">{displaySub}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {selectedTargetId !== "earth" && (
            <button
              onClick={exitFocus}
              className="flex items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-1 font-mono text-[10px] font-semibold text-amber-200 hover:bg-amber-500/25"
              title="Exit focus and return to Earth (Esc)"
            >
              <ArrowLeft className="h-3 w-3" />
              Exit
            </button>
          )}
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Live Telemetry Bar (for satellites) */}
      {telemetry && (
        <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-slate-800/80 bg-slate-900/50 p-2.5 font-mono">
          <div>
            <div className="text-[9px] text-slate-400">ALTITUDE</div>
            <div className="text-xs font-bold text-sky-300">
              {telemetry.altitudeKm.toFixed(1)} km
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">VELOCITY</div>
            <div className="text-xs font-bold text-emerald-300">
              {telemetry.velocityKmS.toFixed(2)} km/s
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">PERIOD</div>
            <div className="text-xs font-bold text-amber-300">
              {telemetry.periodMin.toFixed(1)} m
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">APOGEE</div>
            <div className="text-[11px] text-sky-200">
              {(telemetry.apogeeKm ?? telemetry.altitudeKm).toFixed(0)} km
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">PERIGEE</div>
            <div className="text-[11px] text-sky-200">
              {(telemetry.perigeeKm ?? telemetry.altitudeKm).toFixed(0)} km
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">GND SPEED</div>
            <div className="text-[11px] text-emerald-200">
              {Math.round(telemetry.groundSpeedKmH ?? telemetry.velocityKmS * 3600).toLocaleString()} km/h
            </div>
          </div>
        </div>
      )}

      {/* Live Moon Astronomical Telemetry + Interactive Core Cutaway Control */}
      {selectedTargetId === "moon" && moonTelemetry && (
        <div className="shrink-0 space-y-2 border-b border-slate-800/80 bg-slate-900/65 p-2.5 font-mono">
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <div className="text-[9px] text-slate-400">DISTANCE</div>
              <div className="text-xs font-bold text-sky-300">
                {moonTelemetry.distanceKm.toLocaleString()} km
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">ILLUMINATION</div>
              <div className="text-xs font-bold text-amber-300">
                {Math.round(moonTelemetry.phaseFraction * 100)}% {moonTelemetry.phaseName.split(" ")[0]}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">LIGHT DELAY</div>
              <div className="text-xs font-bold text-emerald-300">
                {moonTelemetry.lightDelaySec} s
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1.5">
            <span className="shrink-0 text-[9px] font-bold text-amber-200">CORE CUTAWAY</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(moonCutawayAmount * 100)}
              onChange={(e) => setMoonCutawayAmount(Number(e.target.value) / 100)}
              className="h-1 flex-1 cursor-pointer accent-amber-400"
              aria-label="Moon Internal Core Cutaway"
            />
            <span className="w-7 text-right text-[9px] text-amber-300">
              {Math.round(moonCutawayAmount * 100)}%
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {LUNAR_LANDMARKS.map((lm) => (
              <button
                key={lm.id}
                onClick={() =>
                  dispatchSpatialActions([{ type: "fly_to_target", targetId: `lunar-${lm.id}` }])
                }
                className="rounded border border-slate-700 bg-slate-900/90 px-1.5 py-0.5 text-[9px] text-slate-200 hover:border-amber-400/50 hover:text-amber-200"
              >
                {lm.shortName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* JWST L2 Heatshield Thermal Gradient Telemetry */}
      {selectedTargetId === "jwst" && (
        <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-slate-800/80 bg-amber-950/30 p-2.5 font-mono">
          <div>
            <div className="text-[9px] text-slate-400">SUN SIDE HOT</div>
            <div className="text-xs font-bold text-orange-300">+85°C (358 K)</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">MIRROR COLD</div>
            <div className="text-xs font-bold text-sky-300">−233°C (40 K)</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">MIRI CRYO</div>
            <div className="text-xs font-bold text-violet-300">6.7 K (−266°C)</div>
          </div>
        </div>
      )}

      {/* DSCOVR L1 Live Solar Wind + EPIC Distance Telemetry */}
      {selectedTargetId === "dscovr" && (
        <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-slate-800/80 bg-sky-950/35 p-2.5 font-mono">
          <div>
            <div className="text-[9px] text-slate-400">L1 RANGE</div>
            <div className="text-xs font-bold text-sky-300">
              {((dscovrEpic?.distanceToEarthKm ?? 1496000) / 1e6).toFixed(2)}M km
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">SOLAR WIND</div>
            <div className="text-xs font-bold text-amber-300">
              {Math.round(spaceWeather?.solarWindKmS ?? 415)} km/s
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">WARNING LEAD</div>
            <div className="text-xs font-bold text-emerald-300">
              ~{Math.round(1500000 / Math.max(spaceWeather?.solarWindKmS ?? 415, 250) / 60)} min
            </div>
          </div>
        </div>
      )}

      {/* Live Near-Earth Asteroid Telemetry + Kinetic Impact Energy Estimator */}
      {selectedNeo && (() => {
        const avgDiamM = (selectedNeo.diameterMinM + selectedNeo.diameterMaxM) / 2;
        const radiusM = avgDiamM / 2;
        const massKg = (4 / 3) * Math.PI * Math.pow(radiusM, 3) * 2600;
        const velMS = selectedNeo.velocityKmS * 1000;
        const energyMt = (0.5 * massKg * velMS * velMS) / 4.184e15;
        return (
          <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-slate-800/80 bg-rose-950/25 p-2.5 font-mono">
            <div>
              <div className="text-[9px] text-slate-400">MISS DIST</div>
              <div className="text-xs font-bold text-sky-300">{selectedNeo.missDistanceLD} LD</div>
              <div className="text-[8px] text-slate-400">
                {selectedNeo.missDistanceKm.toLocaleString()} km
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">FLYBY SPEED</div>
              <div className="text-xs font-bold text-emerald-300">
                {selectedNeo.velocityKmS} km/s
              </div>
              <div className="text-[8px] text-slate-400">
                Ø {selectedNeo.diameterMinM}–{selectedNeo.diameterMaxM} m
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">KINETIC E</div>
              <div className="text-xs font-bold text-amber-300">
                {energyMt >= 10
                  ? `${Math.round(energyMt).toLocaleString()} Mt`
                  : `${energyMt.toFixed(2)} Mt`}
              </div>
              <div className="text-[8px] text-rose-300">
                {selectedNeo.isHazardous ? "PHA MONITORED" : "SAFE PASSAGE"}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Live Keplerian Telemetry Bar for Hohmann Transfer Craft */}
      {selectedTargetId === "phenom-hohmann-craft" && hohmannTelemetry && (
        <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-slate-800/80 bg-emerald-950/30 p-2.5 font-mono">
          <div>
            <div className="text-[9px] text-slate-400">ALTITUDE</div>
            <div className="text-xs font-bold text-sky-300">
              {hohmannTelemetry.altitudeKm.toLocaleString()} km
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">VIS-VIVA SPEED</div>
            <div className="text-xs font-bold text-emerald-300">
              {hohmannTelemetry.speedKmS.toFixed(2)} km/s
            </div>
          </div>
          <div>
            <div className="text-[9px] text-slate-400">TRANSFER PHASE</div>
            <div className="text-[10px] font-bold text-amber-300">
              {hohmannTelemetry.burnState}
            </div>
          </div>
        </div>
      )}

      {/* Live NOAA Space Weather Bar for Van Allen Belts & Magnetosphere */}
      {(selectedTargetId === "phenom-van-allen-inner" ||
        selectedTargetId === "phenom-van-allen-outer" ||
        selectedTargetId === "phenom-magnetosphere") &&
        spaceWeather && (
          <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-slate-800/80 bg-indigo-950/35 p-2.5 font-mono">
            <div>
              <div className="text-[9px] text-slate-400">NOAA Kp INDEX</div>
              <div className="text-xs font-bold text-amber-300">
                Kp {spaceWeather.kpIndex.toFixed(1)} · {spaceWeather.stormLevel}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">SOLAR WIND</div>
              <div className="text-xs font-bold text-sky-300">
                {Math.round(spaceWeather.solarWindKmS)} km/s
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">IMF Bz</div>
              <div className="text-xs font-bold text-fuchsia-300">
                {spaceWeather.imfBzNt.toFixed(1)} nT
              </div>
            </div>
          </div>
        )}

      {/* Action Buttons (Ride-Along only for moving satellites & moving Hohmann Transfer Craft!) */}
      {selectedTargetId !== "earth" &&
        (!selectedTargetId.startsWith("phenom-") ||
          selectedTargetId === "phenom-hohmann-craft") && (
        <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-800/80 px-3 py-2">
          <button
            onClick={() => setRideAlongLocked(!rideAlongLocked)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
              rideAlongLocked
                ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/50"
                : "bg-slate-900 text-slate-300 ring-1 ring-slate-700 hover:text-white"
            }`}
          >
            {rideAlongLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {rideAlongLocked ? "Ride-Along ON" : "Ride-Along"}
          </button>

          {selectedTargetId === "iss" && (
            <>
              <button
                onClick={() => setViewMode("iss-interior")}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-500/20 px-2 py-1.5 text-[11px] font-semibold text-sky-200 ring-1 ring-sky-400/40 hover:bg-sky-500/30"
              >
                <Layers className="h-3 w-3" />
                3D Interior
              </button>
              <button
                onClick={() => setActivePanel("livecam")}
                className="flex items-center justify-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/40 hover:bg-amber-500/30"
                title="Open ISS Live Cam"
              >
                <Video className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Optional Quick Discipline Filter Pills — defaults to "ALL" so EVERY fact & science area is visible up front! */}
      <div className="flex shrink-0 gap-1 border-b border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
        {(
          [
            { id: "all", label: "All Intel" },
            { id: "physics", label: "Phys" },
            { id: "chemistry", label: "Chem" },
            { id: "biology", label: "Bio" },
            { id: "engineering", label: "Eng" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setScienceFilter(t.id)}
            className={`flex-1 rounded-md py-1 font-mono text-[9px] font-semibold uppercase tracking-wide transition ${
              scienceFilter === t.id
                ? "bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/40"
                : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Unified Magazine-Grade Front-View Intelligence Feed (Real NASA Photo + Highlights + All 4 Sciences!) */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
        {/* 1. Real NASA Mission Photograph Hero Card */}
        <div className="relative h-28 w-full overflow-hidden rounded-xl border border-slate-800">
          <img
            src={heroPhoto.url}
            alt={displayName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-transparent px-2.5 py-1.5 font-mono text-[9px] text-sky-200">
            {heroPhoto.caption}
          </div>
        </div>

        {/* 2. Core Mission Story + Quick Facts */}
        <p className="leading-relaxed text-slate-200">{flagship.overview[persona]}</p>

        {/* 3. Highlighted Key Facts & Live Insights right on the Front View! */}
        <div className="space-y-1.5 rounded-xl border border-amber-400/25 bg-amber-500/5 p-2.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Highlighted Live & Key Facts
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {flagship.quickFacts.map((qf) => (
              <div
                key={qf.label}
                className="rounded-lg border border-slate-800/80 bg-slate-950/70 px-2 py-1.5"
              >
                <div className="font-mono text-[8px] uppercase text-slate-400">{qf.label}</div>
                <div className="mt-0.5 text-[11px] font-semibold text-white">{qf.value}</div>
              </div>
            ))}
          </div>
          {liveCalc && (
            <div className="space-y-1 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-100">
              <div>
                <span className="font-semibold text-emerald-300">Live Gravity Insight:</span> At{" "}
                {telemetry!.altitudeKm.toFixed(0)} km ({telemetry!.orbitalRegime ?? "LEO"}), Earth&apos;s pull is{" "}
                <strong>{liveCalc.gPct.toFixed(1)}%</strong> ({liveCalc.gLocal.toFixed(2)} m/s²) at{" "}
                <strong>{liveCalc.vCirc.toFixed(2)} km/s</strong>!
              </div>
              {telemetry!.relativityOffsetUsDay !== undefined && (
                <div className="font-mono text-[10px] text-sky-200">
                  ⏱ Einstein Relativity Clock:{" "}
                  <strong>
                    {telemetry!.relativityOffsetUsDay >= 0 ? "+" : ""}
                    {telemetry!.relativityOffsetUsDay.toFixed(1)} μs/day
                  </strong>{" "}
                  · Radiation:{" "}
                  <strong className="text-amber-200">
                    {telemetry!.radiationDoseMSvHr?.toFixed(2) ?? "0.03"} mSv/hr
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Physics & Orbital Math */}
        {showSection("physics") && (
          <div className="space-y-2 rounded-xl border border-sky-400/20 bg-sky-500/5 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-sky-300">
              <Atom className="h-3.5 w-3.5" /> Physics & Orbital Math
            </div>
            <p className="leading-relaxed text-slate-200">
              {flagship.science.physics.summary[persona]}
            </p>
            {liveCalc && (persona === "student" || persona === "scientist") && (
              <div className="space-y-1 rounded-lg border border-emerald-400/25 bg-slate-950/70 p-2 font-mono text-[10px]">
                <div className="text-[9px] font-bold text-emerald-300">
                  LIVE REAL-TIME SOLVER (h = {telemetry!.altitudeKm.toFixed(1)} km)
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">v = √(μ / r)</span>
                  <span className="font-bold text-white">{liveCalc.vCirc.toFixed(3)} km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">g(h) = g₀(R/r)²</span>
                  <span className="font-bold text-emerald-200">
                    {liveCalc.gLocal.toFixed(2)} m/s² ({liveCalc.gPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horizon d = √(2Rh+h²)</span>
                  <span className="font-bold text-sky-200">
                    {Math.round(liveCalc.horizonKm).toLocaleString()} km
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              {flagship.science.physics.equations.map((eq) => (
                <div
                  key={eq.label}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-2 py-1.5 font-mono text-[10px]"
                >
                  <span className="text-sky-200">{eq.formula}</span>
                  <span className="text-slate-400">{eq.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Chemistry & Materials */}
        {showSection("chemistry") && (
          <div className="space-y-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
              <FlaskConical className="h-3.5 w-3.5" /> Chemistry & Space Materials
            </div>
            <p className="leading-relaxed text-slate-200">
              {flagship.science.chemistry.summary[persona]}
            </p>
            <div className="space-y-1.5">
              {flagship.science.chemistry.compounds.map((c) => (
                <div
                  key={c.name}
                  className="rounded-lg border border-emerald-400/15 bg-slate-950/60 px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-200">{c.name}</span>
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                      {c.formula}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{c.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Astrobiology & Life Sciences */}
        {showSection("biology") && (
          <div className="space-y-2 rounded-xl border border-rose-400/20 bg-rose-500/5 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-rose-300">
              <Dna className="h-3.5 w-3.5" /> Astrobiology & Human Life
            </div>
            <p className="leading-relaxed text-slate-200">
              {flagship.science.biology.summary[persona]}
            </p>
            <div className="space-y-1">
              {flagship.science.biology.highlights.map((h) => (
                <div
                  key={h}
                  className="rounded-lg bg-slate-950/60 px-2.5 py-1.5 text-[11px] text-slate-200"
                >
                  • {h}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Spacecraft Engineering & Provenance */}
        {showSection("engineering") && (
          <div className="space-y-2 rounded-xl border border-slate-700/70 bg-slate-900/60 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-sky-400" /> Spacecraft Engineering
            </div>
            <p className="leading-relaxed text-slate-200">
              {flagship.science.engineering.summary[persona]}
            </p>
            <div className="space-y-1">
              {flagship.science.engineering.specs.map((sp) => (
                <div
                  key={sp.label}
                  className="flex items-center justify-between rounded-lg bg-slate-950/70 px-2.5 py-1.5 font-mono text-[10px]"
                >
                  <span className="text-slate-400">{sp.label}</span>
                  <span className="font-semibold text-white">{sp.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Scientific Provenance & Raw SGP4 TLE (Scientist Mode) */}
        {telemetry && (
          <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-900/50 px-2.5 py-2 font-mono text-[10px] text-slate-400">
            <div>
              <span className="text-sky-300">Provenance:</span> {telemetry.provenanceDetail}
            </div>
            {telemetry.modelProvenance && (
              <div>
                <span className="text-emerald-300">3D Model:</span> {telemetry.modelProvenance}
              </div>
            )}
          </div>
        )}

        {persona === "scientist" && telemetry?.tleLine1 && (
          <div className="rounded-xl border border-violet-400/25 bg-violet-950/20 p-2.5 font-mono text-[10px] text-violet-200">
            <div className="mb-1 text-[9px] uppercase text-violet-400">
              Raw SGP4 Two-Line Element (TLE) · e = {telemetry.eccentricity.toFixed(6)}
            </div>
            <div className="break-all">{telemetry.tleLine1}</div>
            <div className="break-all">{telemetry.tleLine2}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
