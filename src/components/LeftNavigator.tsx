"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe,
  MapPin,
  Rocket,
  Satellite,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";
import { OBSERVER_CITIES } from "@/data/cities";
import { LAUNCH_PADS } from "@/data/launchPads";
import { LUNAR_LANDMARKS } from "@/data/lunarLandmarks";
import { SatelliteCategory } from "@/types/cosmos";

const FLAGSHIPS = [
  { id: "earth", label: "Earth", tag: "NASA Blue/Black Marble · Relief", color: "text-sky-400" },
  { id: "iss", label: "ISS (Zarya)", tag: "NASA 3D GLB + Lab Cutaway", color: "text-amber-400" },
  { id: "hubble", label: "Hubble Telescope", tag: "NASA 3D GLB · 525 km", color: "text-violet-400" },
  { id: "tiangong", label: "Tiangong (CSS)", tag: "PBR T-Station · Ion Thrusters", color: "text-amber-300" },
  { id: "starlink", label: "Starlink Shell", tag: "PBR v2 Mini · Laser Mesh", color: "text-cyan-400" },
];

const NASA_REPLICAS = [
  { id: "sat-49260", label: "Landsat 9", tag: "NASA GLB · Earth Obs" },
  { id: "sat-25994", label: "Terra EOS", tag: "NASA GLB · Climate" },
  { id: "sat-43013", label: "NOAA-20", tag: "NASA/NOAA JPSS Weather" },
  { id: "sat-33053", label: "Fermi Telescope", tag: "NASA GLB · Gamma-Ray" },
];

const SHELL_1B_TARGETS = [
  { id: "gps", label: "GPS III (MEO)", tag: "20,200 km · +38.6 μs/d", color: "text-lime-300" },
  { id: "galileo", label: "Galileo (MEO)", tag: "23,222 km · ESA GNSS", color: "text-lime-200" },
  { id: "goes", label: "GOES-18 (GEO)", tag: "35,786 km · Clarke Belt", color: "text-pink-300" },
];

const SHELL_2_TARGETS = [
  { id: "moon", label: "The Moon (Luna)", tag: "384,400 km · Craters + Cutaway", color: "text-slate-100" },
  { id: "lro", label: "Lunar Orbiter (LRO)", tag: "NASA GLB · 50 km Polar Laser", color: "text-violet-300" },
  { id: "jwst", label: "JWST (Sun–Earth L2)", tag: "NASA GLB · −1.5M km · 40 K IR", color: "text-amber-300" },
  { id: "dscovr", label: "DSCOVR (Sun–Earth L1)", tag: "NASA GLB · +1.5M km · EPIC", color: "text-sky-300" },
];

const CATEGORY_META: Array<{ id: SatelliteCategory; label: string; dot: string }> = [
  { id: "station", label: "Stations", dot: "bg-amber-400" },
  { id: "science", label: "Science", dot: "bg-violet-400" },
  { id: "weather", label: "Weather", dot: "bg-emerald-400" },
  { id: "starlink", label: "Starlink", dot: "bg-sky-400" },
  { id: "debris", label: "Debris", dot: "bg-rose-400" },
  { id: "gnss", label: "MEO GNSS", dot: "bg-lime-400" },
  { id: "geo", label: "GEO Belt", dot: "bg-pink-400" },
];

export function LeftNavigator() {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"targets" | "layers" | "ground">("targets");

  // Auto-collapse on narrow viewports so 3D Earth always has ample room
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  const hudMode = useCosmosStore((s) => s.hudMode);
  const selectedTargetId = useCosmosStore((s) => s.selectedTargetId);
  const satellites = useCosmosStore((s) => s.satellites);
  const layers = useCosmosStore((s) => s.layers);
  const toggleLayer = useCosmosStore((s) => s.toggleLayer);
  const toggleCategory = useCosmosStore((s) => s.toggleCategory);
  const observerCity = useCosmosStore((s) => s.observerCity);
  const setObserverCity = useCosmosStore((s) => s.setObserverCity);
  const overheadSatellites = useCosmosStore((s) => s.overheadSatellites);
  const spaceWeather = useCosmosStore((s) => s.spaceWeather);
  const conjunctions = useCosmosStore((s) => s.conjunctions);
  const neos = useCosmosStore((s) => s.neos);
  const neosSource = useCosmosStore((s) => s.neosSource);
  const viewMode = useCosmosStore((s) => s.viewMode);
  const setViewMode = useCosmosStore((s) => s.setViewMode);
  const dispatchSpatialActions = useCosmosStore((s) => s.dispatchSpatialActions);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const shell2Matches = [
      ...SHELL_2_TARGETS.filter(
        (t) => t.label.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q) || t.id.includes(q)
      ).map((t) => ({ id: t.id, name: t.label, sub: `Shell 2 · ${t.tag}` })),
      ...LUNAR_LANDMARKS.filter(
        (lm) => lm.name.toLowerCase().includes(q) || lm.type.includes(q)
      ).map((lm) => ({ id: `lunar-${lm.id}`, name: lm.name, sub: `Lunar ${lm.type.toUpperCase()}` })),
      ...neos
        .filter((n) => n.name.toLowerCase().includes(q) || n.spectralType.toLowerCase().includes(q))
        .map((n) => ({
          id: n.id,
          name: n.name,
          sub: `NEO Asteroid · ${n.missDistanceLD} LD · ${n.velocityKmS} km/s`,
        })),
    ];

    const satMatches = satellites
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) || String(s.noradId).includes(q)
      )
      .slice(0, 12)
      .map((s) => ({
        id: s.flagshipId ?? `sat-${s.noradId}`,
        name: s.name,
        sub: `NORAD #${s.noradId} · ${s.category.toUpperCase()}`,
      }));

    const padMatches = LAUNCH_PADS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    ).map((p) => ({
      id: `pad-${p.id}`,
      name: p.shortName,
      sub: `Launch Pad · ${p.country}`,
    }));

    return [...shell2Matches, ...padMatches, ...satMatches].slice(0, 12);
  }, [query, satellites, neos]);

  if (hudMode === "cinema") return null;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setObserverCity({
        id: "gps-local",
        name: "My GPS Location",
        country: "Live",
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
      setViewMode("ground");
    });
  };

  if (collapsed) {
    return (
      <div className="pointer-events-auto self-start">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1 rounded-xl border border-sky-400/25 bg-slate-950/85 px-2.5 py-2 text-xs text-sky-200 backdrop-blur-md hover:bg-slate-900 shadow-lg"
        >
          <ChevronRight className="h-4 w-4" />
          Nav
        </button>
      </div>
    );
  }

  return (
    <aside className="pointer-events-auto flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-slate-950/82 backdrop-blur-xl shadow-2xl lg:w-72">
      {/* Header + Collapse */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800/90 px-3 py-2">
        <div className="flex gap-1">
          {(
            [
              { id: "targets", label: "Targets", icon: Satellite },
              { id: "layers", label: "Layers", icon: SlidersHorizontal },
              { id: "ground", label: "Sky", icon: Compass },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  tab === t.id
                    ? "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          title="Collapse Navigator"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "targets" && (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search satellite, NORAD, pad..."
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400/60"
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Matches ({searchResults.length})
                </div>
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      dispatchSpatialActions([{ type: "fly_to_target", targetId: res.id }]);
                      setQuery("");
                    }}
                    className="flex w-full flex-col rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-2 text-left transition hover:border-sky-400/40 hover:bg-sky-500/10"
                  >
                    <span className="truncate text-xs font-medium text-white">{res.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{res.sub}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Shell 1A Flagship Objects
                  </div>
                  {FLAGSHIPS.map((f) => {
                    const active = selectedTargetId === f.id && viewMode === "orbit";
                    return (
                      <button
                        key={f.id}
                        onClick={() =>
                          dispatchSpatialActions([{ type: "fly_to_target", targetId: f.id }])
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-sky-400/60 bg-sky-500/15 text-white"
                            : "border-slate-800/90 bg-slate-900/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800/70"
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-semibold ${f.color}`}>{f.label}</div>
                          <div className="font-mono text-[10px] text-slate-400">{f.tag}</div>
                        </div>
                        <Globe className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    );
                  })}
                </div>

                {/* NASA 3D Replica Satellites */}
                <div className="space-y-1.5 pt-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Official NASA 3D Replicas
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {NASA_REPLICAS.map((rep) => (
                      <button
                        key={rep.id}
                        onClick={() =>
                          dispatchSpatialActions([{ type: "fly_to_target", targetId: rep.id }])
                        }
                        className={`rounded-lg border px-2 py-1.5 text-left transition ${
                          selectedTargetId === rep.id
                            ? "border-violet-400/60 bg-violet-500/20"
                            : "border-slate-800 bg-slate-900/60 hover:border-violet-400/40 hover:bg-violet-500/10"
                        }`}
                      >
                        <div className="truncate text-[11px] font-medium text-violet-200">
                          {rep.label}
                        </div>
                        <div className="truncate font-mono text-[9px] text-slate-400">
                          {rep.tag}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shell 1B: MEO GNSS, GEO Belt & Magnetosphere */}
                <div className="space-y-1.5 pt-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-lime-300/90">
                    Shell 1B · MEO, GEO & Magnetosphere
                  </div>
                  <div className="space-y-1">
                    {SHELL_1B_TARGETS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          dispatchSpatialActions([{ type: "fly_to_target", targetId: t.id }])
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-1.5 text-left transition ${
                          selectedTargetId === t.id
                            ? "border-pink-400/60 bg-pink-500/15"
                            : "border-slate-800 bg-slate-900/60 hover:border-lime-400/40 hover:bg-lime-500/10"
                        }`}
                      >
                        <div>
                          <div className={`text-[11px] font-semibold ${t.color}`}>{t.label}</div>
                          <div className="font-mono text-[9px] text-slate-400">{t.tag}</div>
                        </div>
                        <Globe className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    ))}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() =>
                          dispatchSpatialActions([
                            { type: "set_shell1b_layer", layer: "vanAllenBelts", enabled: true },
                            { type: "set_shell1b_layer", layer: "magnetosphere", enabled: true },
                            { type: "fly_to_target", targetId: "shell-1b" },
                          ])
                        }
                        className="rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/10 px-2 py-1.5 text-left transition hover:bg-fuchsia-500/20"
                      >
                        <div className="text-[10px] font-semibold text-fuchsia-200">Van Allen Belts</div>
                        <div className="font-mono text-[8px] text-slate-400">3D Plasma + Mag</div>
                      </button>
                      <button
                        onClick={() =>
                          dispatchSpatialActions([
                            { type: "set_shell1b_layer", layer: "hohmannTransfer", enabled: true },
                            { type: "fly_to_target", targetId: "shell-1b" },
                          ])
                        }
                        className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2 py-1.5 text-left transition hover:bg-emerald-500/20"
                      >
                        <div className="text-[10px] font-semibold text-emerald-200">Hohmann GTO</div>
                        <div className="font-mono text-[8px] text-slate-400">LEO → GEO Burn</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shell 2: Cislunar, Moon, L1/L2 & Live Near-Earth Asteroids */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-amber-300/90">
                    <span>Shell 2 · Moon, L1/L2 & NEOs</span>
                    <button
                      onClick={() =>
                        dispatchSpatialActions([{ type: "fly_to_target", targetId: "cislunar" }])
                      }
                      className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-amber-200 ring-1 ring-amber-400/35 hover:bg-amber-500/30"
                      title="Zoom out to 1.5 Million km Cislunar Overview"
                    >
                      1.5M km Map
                    </button>
                  </div>
                  <div className="space-y-1">
                    {SHELL_2_TARGETS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          dispatchSpatialActions([{ type: "fly_to_target", targetId: t.id }])
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-1.5 text-left transition ${
                          selectedTargetId === t.id
                            ? "border-amber-400/60 bg-amber-500/15"
                            : "border-slate-800 bg-slate-900/60 hover:border-amber-400/40 hover:bg-amber-500/10"
                        }`}
                      >
                        <div>
                          <div className={`text-[11px] font-semibold ${t.color}`}>{t.label}</div>
                          <div className="font-mono text-[9px] text-slate-400">{t.tag}</div>
                        </div>
                        <Globe className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>

                  {/* Live Near-Earth Asteroids (NASA NeoWs) */}
                  {neos.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-slate-400">
                        <span>Near-Earth Asteroids ({neos.length})</span>
                        <span className={neosSource === "live" ? "text-emerald-300" : "text-amber-300"}>
                          {neosSource === "live" ? "NASA NEOWS LIVE" : "JPL CATALOG"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {neos.slice(0, 4).map((neo) => (
                          <button
                            key={neo.id}
                            onClick={() =>
                              dispatchSpatialActions([{ type: "fly_to_target", targetId: neo.id }])
                            }
                            className={`rounded-lg border px-2 py-1.5 text-left transition ${
                              selectedTargetId === neo.id
                                ? "border-rose-400/60 bg-rose-500/20"
                                : neo.isHazardous
                                ? "border-rose-400/25 bg-rose-500/5 hover:border-rose-400/50"
                                : "border-slate-800 bg-slate-900/60 hover:border-emerald-400/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate text-[10px] font-semibold text-slate-100">
                                {neo.name.split("(")[0].trim()}
                              </span>
                              {neo.isHazardous && (
                                <span className="shrink-0 rounded bg-rose-500/25 px-1 font-mono text-[7px] font-bold text-rose-200">
                                  PHA
                                </span>
                              )}
                            </div>
                            <div className="truncate font-mono text-[8px] text-slate-400">
                              {neo.missDistanceLD} LD · {neo.velocityKmS} km/s
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Launch Pads quick list */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    <Rocket className="h-3 w-3 text-amber-400" />
                    3D Launch Complexes
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LAUNCH_PADS.slice(0, 6).map((pad) => (
                      <button
                        key={pad.id}
                        onClick={() =>
                          dispatchSpatialActions([
                            { type: "fly_to_target", targetId: `pad-${pad.id}` },
                          ])
                        }
                        className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-left transition hover:border-amber-400/50 hover:bg-amber-500/10"
                      >
                        <div className="truncate text-[11px] font-medium text-amber-200">
                          {pad.shortName}
                        </div>
                        <div className="truncate font-mono text-[9px] text-slate-400">
                          {pad.country}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "layers" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Scene Layers
              </div>
              {(
                [
                  ["satellites", "LEO / MEO / GEO Swarm"],
                  ["orbits", "4D Orbital Trajectory"],
                  ["launchPads", "3D Launch Complexes"],
                  ["auroras", "Polar Auroral Ovals (Kp)"],
                  ["clouds", "Atmospheric Cloud Layer"],
                  ["grid", "Lat / Lon Tactical Grid"],
                  ["vanAllenBelts", "Van Allen Radiation Belts"],
                  ["magnetosphere", "3D Earth Magnetosphere"],
                  ["hohmannTransfer", "Hohmann Transfer (LEO→GEO)"],
                  ["geoFootprint", "GEO Coverage Footprint Cone"],
                  ["cislunar", "3D Moon & Lunar Orbit (Shell 2)"],
                  ["lunarLandmarks", "Apollo & Artemis Moon Pins"],
                  ["lagrangePoints", "Lagrange L1/L2 (DSCOVR & JWST)"],
                  ["neos", "Near-Earth Asteroids (NEOs)"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 hover:border-slate-700"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={() => toggleLayer(key)}
                    className="h-3.5 w-3.5 accent-sky-400"
                  />
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Satellite Categories
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORY_META.map((cat) => {
                  const active = layers.categories[cat.id];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                        active
                          ? "border-sky-400/40 bg-slate-800/90 text-white"
                          : "border-slate-800 bg-slate-950/60 text-slate-500"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${cat.dot}`} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live NOAA SWPC Space Weather Card */}
            {spaceWeather && (
              <div className="space-y-1 rounded-xl border border-amber-400/25 bg-amber-500/5 p-2.5 font-mono text-[10px]">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>NOAA SPACE WEATHER</span>
                  <span>{spaceWeather.stormLevel}</span>
                </div>
                <div className="text-slate-300">
                  Kp {spaceWeather.kpIndex.toFixed(1)} ({spaceWeather.stormLabel}) · Wind{" "}
                  {spaceWeather.solarWindKmS} km/s
                </div>
                <div className="text-[9px] text-slate-400">
                  IMF Bz {spaceWeather.imfBzNt} nT · Proton {spaceWeather.protonDensity} p/cm³
                </div>
              </div>
            )}

            {/* Shell 1B Conjunction / Proximity Alert Scanner */}
            {conjunctions.length > 0 && (
              <div className="space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-rose-300">
                  Close-Approach Conjunctions
                </div>
                {conjunctions.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      dispatchSpatialActions([{ type: "fly_to_target", targetId: c.targetIdA }])
                    }
                    className="flex w-full flex-col rounded-lg border border-rose-400/25 bg-rose-500/5 px-2 py-1.5 text-left hover:bg-rose-500/15"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="truncate font-semibold text-rose-200">{c.satA}</span>
                      <span className="shrink-0 text-amber-300">{c.distanceKm} km</span>
                    </div>
                    <div className="truncate font-mono text-[9px] text-slate-400">
                      ↔ {c.satB} · Alt {c.altitudeKm.toLocaleString()} km
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "ground" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-200">
              Stand anywhere on Earth, look up at the real live sky, and click any overhead satellite to launch into orbit.
            </div>

            <button
              onClick={handleUseMyLocation}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/20 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
            >
              <MapPin className="h-3.5 w-3.5" />
              Use My Real GPS Location
            </button>

            <div className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Observer City
              </div>
              <select
                value={observerCity.id}
                onChange={(e) => {
                  const city = OBSERVER_CITIES.find((c) => c.id === e.target.value);
                  if (city) {
                    setObserverCity(city);
                    setViewMode("ground");
                  }
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white outline-none"
              >
                {OBSERVER_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country} ({c.lat.toFixed(1)}°, {c.lon.toFixed(1)}°)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setViewMode("ground")}
              className="w-full rounded-xl bg-emerald-500/25 py-2 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-500/35"
            >
              Enter Ground-Up Sky Dome
            </button>

            {overheadSatellites.length > 0 && (
              <div className="space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Overhead Right Now ({overheadSatellites.length})
                </div>
                {overheadSatellites.slice(0, 8).map((sat) => (
                  <button
                    key={sat.id}
                    onClick={() =>
                      dispatchSpatialActions([{ type: "fly_to_target", targetId: sat.id }])
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-left hover:border-sky-400/40"
                  >
                    <span className="truncate text-[11px] text-white">{sat.name}</span>
                    <span className="font-mono text-[10px] text-emerald-300">
                      El {sat.elevationDeg?.toFixed(0)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
