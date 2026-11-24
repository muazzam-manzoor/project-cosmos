"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Presentation,
  X,
} from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";
import { SpatialAction } from "@/types/cosmos";

interface LessonStep {
  title: string;
  caption: string;
  actions: SpatialAction[];
}

const CLASSROOM_STEPS: LessonStep[] = [
  {
    title: "1. Earth & Solar Terminator",
    caption:
      "Observe Earth's real-time day/night line, Rayleigh blue atmospheric limb, and polar auroral ovals.",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "set_spectral_mode", spectralMode: "optical" },
      { type: "fly_to_target", targetId: "earth" },
    ],
  },
  {
    title: "2. ISS & Orbital Free-Fall (~420 km)",
    caption:
      "At 420 km, gravity is still ~88.5% of surface gravity! Astronauts float because they fall continuously at 7.66 km/s.",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "fly_to_target", targetId: "iss" },
    ],
  },
  {
    title: "3. Inside ISS: Closed-Loop Chemistry & Biology",
    caption:
      "Explore Tranquility & Destiny modules to demonstrate water electrolysis (2H₂O → 2H₂ + O₂) and Sabatier CO₂ recycling.",
    actions: [
      { type: "set_view_mode", viewMode: "iss-interior", issModuleId: "tranquility" },
    ],
  },
  {
    title: "4. Hubble & Space Optics (~525 km)",
    caption:
      "Above Earth's turbulent atmosphere, Hubble captures ultraviolet and diffraction-limited optical images.",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "fly_to_target", targetId: "hubble" },
    ],
  },
  {
    title: "5. Thermal Infrared Earth Observation",
    caption:
      "Switch to FLIR Thermal Infrared to visualize equatorial solar heating, ocean heat capacity, and urban heat signatures.",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "set_spectral_mode", spectralMode: "infrared" },
      { type: "fly_to_target", targetId: "earth" },
    ],
  },
  {
    title: "6. Van Allen Belts & Magnetosphere",
    caption:
      "Shell 1B: Visualize Earth's magnetic dipole shield & trapped proton/electron radiation belts reacting live to NOAA solar wind!",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "set_spectral_mode", spectralMode: "optical" },
      { type: "set_shell1b_layer", layer: "vanAllenBelts", enabled: true },
      { type: "set_shell1b_layer", layer: "magnetosphere", enabled: true },
      { type: "fly_to_target", targetId: "shell-1b" },
    ],
  },
  {
    title: "7. Hohmann Transfer: LEO → GEO (35,786 km)",
    caption:
      "Watch Kepler's 2nd Law live on a two-burn Hohmann transfer ellipse (Δv₁ = 2.44 km/s, Δv₂ = 1.47 km/s) climbing to the Geostationary Ring!",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "set_shell1b_layer", layer: "hohmannTransfer", enabled: true },
      { type: "fly_to_target", targetId: "shell-1b" },
    ],
  },
  {
    title: "8. The Moon: Internal Core Cutaway & Artemis",
    caption:
      "Shell 2: Slice open our 3D Moon (384,400 km) to reveal its silicate mantle & molten iron core, plus Apollo 11 & Artemis South Pole water ice!",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "set_moon_cutaway", amount: 0.72 },
      { type: "fly_to_target", targetId: "moon" },
    ],
  },
  {
    title: "9. JWST at Sun–Earth L2 (1.5M km)",
    caption:
      "Explore James Webb's 18 gold beryllium mirrors & 5-layer Kapton sunshield separating +85°C sunlight from −233°C deep-space infrared optics!",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "set_moon_cutaway", amount: 0 },
      { type: "fly_to_target", targetId: "jwst" },
    ],
  },
  {
    title: "10. Asteroid Bennu & Planetary Defense",
    caption:
      "Inspect NASA's real OSIRIS-REx radar 3D shape model of 101955 Bennu & live NASA NeoWs close-approach flybys in Earth's neighborhood!",
    actions: [
      { type: "set_view_mode", viewMode: "orbit" },
      { type: "fly_to_target", targetId: "neo-bennu" },
    ],
  },
];

const COMPARISON_ROWS = [
  {
    metric: "Orbital Regime",
    iss: "LEO (~420 km)",
    hubble: "LEO (~525 km)",
    gps: "MEO (20,200 km)",
    goes: "GEO (35,786 km)",
  },
  {
    metric: "Orbital Velocity",
    iss: "7.66 km/s",
    hubble: "7.59 km/s",
    gps: "3.87 km/s",
    goes: "3.07 km/s",
  },
  {
    metric: "Orbital Period",
    iss: "92.9 min",
    hubble: "95.2 min",
    gps: "11h 58m",
    goes: "23h 56m (Locked)",
  },
  {
    metric: "Einstein Clock Δt",
    iss: "−24.5 μs/day",
    hubble: "−23.4 μs/day",
    gps: "+38.6 μs/day",
    goes: "+45.5 μs/day",
  },
  {
    metric: "Radiation Zone",
    iss: "Below Belts (Safe)",
    hubble: "SAA Fringe",
    gps: "Outer Van Allen",
    goes: "Magnetopause Edge",
  },
  {
    metric: "Primary Physics/Chem",
    iss: "O₂ Electrolysis",
    hubble: "UV Space Optics",
    gps: "Rb-87 Atomic Clock",
    goes: "16-Band IR + Solar Sail",
  },
];

export function TeacherClassroomBar() {
  const persona = useCosmosStore((s) => s.persona);
  const hudMode = useCosmosStore((s) => s.hudMode);
  const dispatchSpatialActions = useCosmosStore((s) => s.dispatchSpatialActions);

  const [stepIdx, setStepIdx] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);

  if (persona !== "teacher" || hudMode === "cinema") return null;

  const step = CLASSROOM_STEPS[stepIdx];

  const goToStep = (nextIdx: number) => {
    const clamped = (nextIdx + CLASSROOM_STEPS.length) % CLASSROOM_STEPS.length;
    setStepIdx(clamped);
    dispatchSpatialActions(CLASSROOM_STEPS[clamped].actions);
  };

  return (
    <>
      <div className="pointer-events-auto flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-slate-950/88 px-3 py-1.5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
          <Presentation className="h-3.5 w-3.5" />
          Classroom
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => goToStep(stepIdx - 1)}
            className="rounded-lg border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:border-amber-400/50 hover:text-white"
            title="Previous Lesson Step"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => goToStep(stepIdx)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-400/40 hover:bg-amber-500/25"
            title={step.caption}
          >
            <BookOpen className="h-3 w-3 text-amber-300" />
            <span className="max-w-[200px] truncate">{step.title}</span>
          </button>
          <button
            onClick={() => goToStep(stepIdx + 1)}
            className="rounded-lg border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:border-amber-400/50 hover:text-white"
            title="Next Lesson Step"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => setCompareOpen((v) => !v)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
            compareOpen
              ? "bg-sky-500/30 text-white ring-1 ring-sky-400"
              : "border border-slate-700 bg-slate-900/90 text-sky-200 hover:border-sky-400/50"
          }`}
        >
          <Columns3 className="h-3 w-3" />
          Compare LEO
        </button>

        <div className="w-full text-center text-[11px] leading-snug text-slate-300">
          {step.caption}
        </div>
      </div>

      {/* Side-by-Side Classroom Comparison Matrix */}
      {compareOpen && (
        <div className="pointer-events-auto fixed left-1/2 top-24 z-40 w-[640px] max-w-[calc(100vw-24px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-amber-400/35 bg-slate-950/95 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Columns3 className="h-4 w-4 text-amber-400" />
              <h3 className="font-mono text-xs font-bold tracking-wider text-white">
                SHELL 1A + 1B SIDE-BY-SIDE ORBITAL COMPARISON (LEO · MEO · GEO)
              </h3>
            </div>
            <button
              onClick={() => setCompareOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto p-3">
            <table className="w-full border-collapse text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                  <th className="py-2 pr-3">Parameter</th>
                  <th className="px-2 py-2 text-amber-300">ISS (LEO)</th>
                  <th className="px-2 py-2 text-violet-300">Hubble (LEO)</th>
                  <th className="px-2 py-2 text-lime-300">GPS (MEO)</th>
                  <th className="px-2 py-2 text-pink-300">GOES (GEO)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.metric}
                    className="border-b border-slate-800/60 text-slate-200 last:border-0"
                  >
                    <td className="py-2 pr-3 font-semibold text-slate-400">{row.metric}</td>
                    <td className="px-2 py-2">{row.iss}</td>
                    <td className="px-2 py-2">{row.hubble}</td>
                    <td className="px-2 py-2">{row.gps}</td>
                    <td className="px-2 py-2">{row.goes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
