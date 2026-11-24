import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  HudMode,
  SatelliteTelemetry,
  SpatialAction,
  SpectralMode,
  UserPersona,
  ViewMode,
} from "@/types/cosmos";
import { FLAGSHIP_PROFILES, ISS_MODULES } from "@/data/knowledgeBase";
import { OBSERVER_CITIES } from "@/data/cities";
import { LAUNCH_PADS } from "@/data/launchPads";

interface CommanderRequest {
  message: string;
  context: {
    persona: UserPersona;
    viewMode: ViewMode;
    spectralMode: SpectralMode;
    hudMode: HudMode;
    selectedTargetId: string;
    selectedIssModuleId: string;
    observerCityName: string;
    telemetry: SatelliteTelemetry | null;
  };
}

const SPATIAL_TOOLS = [
  {
    type: "function" as const,
    name: "fly_to_target",
    description:
      "Fly the 3D camera to an orbital target, Shell 2 deep-space object, or launch pad. Valid targets: 'earth', 'shell-1b' (MEO/GEO/Magnetosphere), 'cislunar' (1.5M km Moon/L1/L2 overview), 'moon', 'lunar-apollo11', 'lunar-artemis3', 'lunar-tycho', 'lro' (Lunar Reconnaissance Orbiter), 'jwst' (James Webb at L2), 'dscovr' (Sun-Earth L1), 'neo-bennu' (Asteroid Bennu), 'neo-apophis', 'iss', 'hubble', 'tiangong', 'starlink', 'gps', 'galileo', 'goes', 'sat-49260' (Landsat 9), 'sat-25994' (Terra EOS), 'sat-43013' (NOAA-20), 'sat-33053' (Fermi), or 'pad-<id>'.",
    parameters: {
      type: "object",
      properties: {
        targetId: {
          type: "string",
          description: "Target identifier to fly to.",
        },
      },
      required: ["targetId"],
    },
  },
  {
    type: "function" as const,
    name: "set_view_mode",
    description:
      "Switch camera viewpoint mode: 'orbit' (free 3D orbital view), 'ground' (Ground-Up Earth Sky View from a city), or 'iss-interior' (3D interactive cutaway of ISS modules).",
    parameters: {
      type: "object",
      properties: {
        viewMode: {
          type: "string",
          enum: ["orbit", "ground", "iss-interior"],
        },
        issModuleId: {
          type: "string",
          description:
            "Optional ISS interior module when viewMode='iss-interior': cupola, destiny, tranquility, columbus, kibo, zvezda.",
        },
        cityId: {
          type: "string",
          description:
            "Optional city name or id when viewMode='ground' (e.g. tokyo, london, karachi, new-york, dubai, sydney).",
        },
      },
      required: ["viewMode"],
    },
  },
  {
    type: "function" as const,
    name: "set_persona",
    description:
      "Change the adaptive scientific depth mode: 'explorer', 'student', 'teacher', or 'scientist'.",
    parameters: {
      type: "object",
      properties: {
        persona: {
          type: "string",
          enum: ["explorer", "student", "teacher", "scientist"],
        },
      },
      required: ["persona"],
    },
  },
  {
    type: "function" as const,
    name: "set_spectral_mode",
    description:
      "Switch viewport sensor vision filter: 'optical' (true color), 'infrared' (thermal FLIR), or 'radar' (tactical wireframe).",
    parameters: {
      type: "object",
      properties: {
        spectralMode: {
          type: "string",
          enum: ["optical", "infrared", "radar"],
        },
      },
      required: ["spectralMode"],
    },
  },
  {
    type: "function" as const,
    name: "set_hud_mode",
    description:
      "Toggle interface style between 'tactical' (God's Eye command HUD) and 'cinema' (clean unobstructed view).",
    parameters: {
      type: "object",
      properties: {
        hudMode: {
          type: "string",
          enum: ["tactical", "cinema"],
        },
      },
      required: ["hudMode"],
    },
  },
  {
    type: "function" as const,
    name: "control_time",
    description:
      "Control the 4D orbital time engine: speed multiplier (e.g., 1, 10, 60, 300, -60), pause/resume, or snap back to live UTC.",
    parameters: {
      type: "object",
      properties: {
        multiplier: { type: "number" },
        paused: { type: "boolean" },
        resetToLive: { type: "boolean" },
      },
    },
  },
  {
    type: "function" as const,
    name: "open_panel",
    description:
      "Open or close an overlay drawer: 'launches' (upcoming global rocket launches), 'news' (spaceflight news), 'livecam' (ISS live Earth stream), 'memory' (4-Tier GPU memory & FPS monitor), or 'none'.",
    parameters: {
      type: "object",
      properties: {
        panel: {
          type: "string",
          enum: ["launches", "news", "livecam", "memory", "none"],
        },
      },
      required: ["panel"],
    },
  },
  {
    type: "function" as const,
    name: "set_shell1b_layer",
    description:
      "Toggle a Shell 1B orbital mechanics or magnetosphere layer on/off: 'vanAllenBelts' (3D Inner & Outer Van Allen Radiation Belts), 'magnetosphere' (3D Earth Magnetic Field Lines & Solar Wind), 'hohmannTransfer' (LEO 400 km -> GTO -> GEO 35,786 km transfer visualizer), or 'geoFootprint' (GEO coverage cone).",
    parameters: {
      type: "object",
      properties: {
        layer: {
          type: "string",
          enum: ["vanAllenBelts", "magnetosphere", "hohmannTransfer", "geoFootprint"],
        },
        enabled: { type: "boolean" },
      },
      required: ["layer", "enabled"],
    },
  },
  {
    type: "function" as const,
    name: "set_moon_cutaway",
    description:
      "Slice open the 3D Moon internal core cutaway (0.0 = solid exterior, 0.75 = open cutaway showing crust, silicate mantle, molten boundary & iron core).",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number" },
      },
      required: ["amount"],
    },
  },
];

function mapToolCallToAction(
  name: string,
  args: Record<string, unknown>
): SpatialAction | null {
  switch (name) {
    case "fly_to_target":
      return typeof args.targetId === "string"
        ? { type: "fly_to_target", targetId: args.targetId }
        : null;
    case "set_view_mode":
      return typeof args.viewMode === "string"
        ? {
            type: "set_view_mode",
            viewMode: args.viewMode as ViewMode,
            issModuleId:
              typeof args.issModuleId === "string" ? args.issModuleId : undefined,
            cityId: typeof args.cityId === "string" ? args.cityId : undefined,
          }
        : null;
    case "set_persona":
      return typeof args.persona === "string"
        ? { type: "set_persona", persona: args.persona as UserPersona }
        : null;
    case "set_spectral_mode":
      return typeof args.spectralMode === "string"
        ? {
            type: "set_spectral_mode",
            spectralMode: args.spectralMode as SpectralMode,
          }
        : null;
    case "set_hud_mode":
      return typeof args.hudMode === "string"
        ? { type: "set_hud_mode", hudMode: args.hudMode as HudMode }
        : null;
    case "control_time":
      return {
        type: "control_time",
        multiplier:
          typeof args.multiplier === "number" ? args.multiplier : undefined,
        paused: typeof args.paused === "boolean" ? args.paused : undefined,
        resetToLive:
          typeof args.resetToLive === "boolean" ? args.resetToLive : undefined,
      };
    case "open_panel":
      return typeof args.panel === "string"
        ? {
            type: "open_panel",
            panel: args.panel as "launches" | "news" | "livecam" | "memory" | "none",
          }
        : null;
    case "set_shell1b_layer":
      return typeof args.layer === "string" && typeof args.enabled === "boolean"
        ? {
            type: "set_shell1b_layer",
            layer: args.layer as
              | "vanAllenBelts"
              | "magnetosphere"
              | "hohmannTransfer"
              | "geoFootprint",
            enabled: args.enabled,
          }
        : null;
    case "set_moon_cutaway":
      return typeof args.amount === "number"
        ? { type: "set_moon_cutaway", amount: Math.max(0, Math.min(1, args.amount)) }
        : null;
    default:
      return null;
  }
}

/**
 * Intelligent local spatial command & science engine when GEMINI_API_KEY is not configured yet.
 */
function runLocalCommander(req: CommanderRequest): {
  reply: string;
  actions: SpatialAction[];
} {
  const q = req.message.toLowerCase();
  const actions: SpatialAction[] = [];
  const notes: string[] = [];
  const persona = req.context.persona;

  // Persona switches
  if (q.includes("scientist")) {
    actions.push({ type: "set_persona", persona: "scientist" });
    notes.push("Switched knowledge depth to **Scientist** mode (equations, state vectors & spectroscopy).");
  } else if (q.includes("student")) {
    actions.push({ type: "set_persona", persona: "student" });
    notes.push("Switched knowledge depth to **Student** mode.");
  } else if (q.includes("teacher")) {
    actions.push({ type: "set_persona", persona: "teacher" });
    notes.push("Switched knowledge depth to **Teacher** classroom mode.");
  } else if (q.includes("explorer") || q.includes("normal user")) {
    actions.push({ type: "set_persona", persona: "explorer" });
    notes.push("Switched knowledge depth to **Explorer** mode.");
  }

  // Spectral vision
  if (q.includes("infrared") || q.includes("thermal") || q.includes("flir")) {
    actions.push({ type: "set_spectral_mode", spectralMode: "infrared" });
    notes.push("Activated **Thermal Infrared (FLIR)** spectral shader.");
  } else if (q.includes("radar") || q.includes("wireframe")) {
    actions.push({ type: "set_spectral_mode", spectralMode: "radar" });
    notes.push("Activated **Tactical Radar Wireframe** vision mode.");
  } else if (q.includes("optical") || q.includes("normal view") || q.includes("true color")) {
    actions.push({ type: "set_spectral_mode", spectralMode: "optical" });
    notes.push("Restored **Optical True-Color** vision mode.");
  }

  // HUD mode
  if (q.includes("cinema") || q.includes("hide hud") || q.includes("clean mode")) {
    actions.push({ type: "set_hud_mode", hudMode: "cinema" });
    notes.push("Switched to **Clean Cinema Mode**.");
  } else if (q.includes("tactical") || q.includes("show hud")) {
    actions.push({ type: "set_hud_mode", hudMode: "tactical" });
    notes.push("Activated **Tactical Command HUD**.");
  }

  // View modes & ISS Interior
  if (
    q.includes("interior") ||
    q.includes("inside") ||
    q.includes("cutaway") ||
    q.includes("cupola") ||
    q.includes("destiny") ||
    q.includes("columbus") ||
    q.includes("kibo") ||
    q.includes("zvezda") ||
    q.includes("tranquility")
  ) {
    const matchedMod = ISS_MODULES.find((m) => q.includes(m.id));
    actions.push({
      type: "set_view_mode",
      viewMode: "iss-interior",
      issModuleId: matchedMod?.id ?? "cupola",
    });
    notes.push(
      `Entered **ISS 3D Interior Cutaway (Tier 3 Isolated Sub-Scene)** focused on **${
        matchedMod?.name ?? "Cupola Observatory"
      }**.`
    );
  } else if (
    q.includes("ground") ||
    q.includes("look up") ||
    q.includes("sky from") ||
    q.includes("surface view")
  ) {
    const city = OBSERVER_CITIES.find(
      (c) => q.includes(c.name.toLowerCase()) || q.includes(c.country.toLowerCase())
    );
    actions.push({
      type: "set_view_mode",
      viewMode: "ground",
      cityId: city?.id,
    });
    notes.push(
      `Switched to **Ground-Up Earth Sky View** from **${
        city ? `${city.name}, ${city.country}` : req.context.observerCityName
      }** looking up at live overhead satellites.`
    );
  } else if (q.includes("orbit view") || q.includes("back to space")) {
    actions.push({ type: "set_view_mode", viewMode: "orbit" });
    notes.push("Returned to **3D Orbital Command View**.");
  }

  // Shell 1B Magnetosphere, Van Allen Belts & Hohmann Transfer
  if (q.includes("van allen") || q.includes("radiation belt")) {
    const turnOff = q.includes("hide") || q.includes("off");
    actions.push({ type: "set_shell1b_layer", layer: "vanAllenBelts", enabled: !turnOff });
    if (!turnOff) actions.push({ type: "fly_to_target", targetId: "shell-1b" });
    notes.push(
      turnOff
        ? "Hidden **Van Allen Radiation Belts**."
        : "Activated **3D Volumetric Inner (Proton) & Outer (Relativistic Electron) Van Allen Radiation Belts** reacting live to NOAA geomagnetic Kp telemetry!"
    );
  }
  if (q.includes("magnetosphere") || q.includes("magnetic field") || q.includes("solar wind")) {
    const turnOff = q.includes("hide") || q.includes("off");
    actions.push({ type: "set_shell1b_layer", layer: "magnetosphere", enabled: !turnOff });
    if (!turnOff) actions.push({ type: "fly_to_target", targetId: "shell-1b" });
    notes.push(
      turnOff
        ? "Hidden **3D Earth Magnetosphere**."
        : "Activated **Dynamic 3D Earth Magnetosphere Field Lines & Solar Wind Stream**—observe the sun-compressed dayside bow shock and stretched nightside magnetotail."
    );
  }
  if (q.includes("hohmann") || q.includes("transfer orbit") || q.includes("gto")) {
    const turnOff = q.includes("hide") || q.includes("off");
    actions.push({ type: "set_shell1b_layer", layer: "hohmannTransfer", enabled: !turnOff });
    if (!turnOff) actions.push({ type: "fly_to_target", targetId: "shell-1b" });
    notes.push(
      turnOff
        ? "Hidden **Hohmann Transfer Visualizer**."
        : "Activated **LEO (400 km) → GTO → GEO (35,786 km) Hohmann Transfer Visualizer** (Burn 1 Δv₁ = +2.44 km/s, Burn 2 Δv₂ = +1.47 km/s, ~5.26 hr ascent)."
    );
  }

  // Targets & Launch pads
  const matchedPad = LAUNCH_PADS.find(
    (p) =>
      q.includes(p.shortName.toLowerCase()) ||
      q.includes(p.id.toLowerCase()) ||
      (p.id === "ksc-39a" && (q.includes("kennedy") || q.includes("cape canaveral"))) ||
      (p.id === "sriharikota" && q.includes("india"))
  );

  if (matchedPad) {
    actions.push({ type: "fly_to_target", targetId: `pad-${matchedPad.id}` });
    notes.push(`Slewing orbital camera over **${matchedPad.name}** (${matchedPad.country}).`);
  } else if (q.includes("jwst") || q.includes("james webb") || q.includes("webb") || q.includes("l2")) {
    actions.push({ type: "fly_to_target", targetId: "jwst" });
    notes.push(`Locked onto **James Webb Space Telescope at Sun–Earth L2 (1.5M km)**. ${FLAGSHIP_PROFILES.jwst.overview[persona]}`);
  } else if (q.includes("dscovr") || q.includes("epic") || q.includes("soho") || q.includes("l1")) {
    actions.push({ type: "fly_to_target", targetId: "dscovr" });
    notes.push(`Locked onto **DSCOVR & SOHO at Sun–Earth L1 (+1.5M km)**. ${FLAGSHIP_PROFILES.dscovr.overview[persona]}`);
  } else if (q.includes("bennu") || q.includes("asteroid") || q.includes("neo")) {
    const isApophis = q.includes("apophis");
    actions.push({ type: "fly_to_target", targetId: isApophis ? "neo-apophis" : "neo-bennu" });
    notes.push(`Locked onto **${isApophis ? "99942 Apophis" : "101955 Bennu (Official NASA Radar GLB)"}**. ${FLAGSHIP_PROFILES["neo-bennu"].overview[persona]}`);
  } else if (q.includes("lro") || q.includes("lunar orbiter")) {
    actions.push({ type: "fly_to_target", targetId: "lro" });
    notes.push(`Locked onto **NASA Lunar Reconnaissance Orbiter (LRO)** at 50 km polar lunar orbit. ${FLAGSHIP_PROFILES.lro.overview[persona]}`);
  } else if (q.includes("apollo 11") || q.includes("tranquility")) {
    actions.push({ type: "fly_to_target", targetId: "lunar-apollo11" });
    notes.push("Zooming down to **Apollo 11 Tranquility Base** (with our 3D NASA Apollo Lunar Module Eagle)!");
  } else if (q.includes("artemis") || q.includes("shackleton") || q.includes("south pole")) {
    actions.push({ type: "fly_to_target", targetId: "lunar-artemis3" });
    notes.push("Zooming down to **Artemis III — Shackleton Crater (Lunar South Pole)** where permanently shadowed craters trap billions of tons of H₂O ice!");
  } else if (q.includes("moon") || q.includes("lunar")) {
    if (q.includes("core") || q.includes("cutaway") || q.includes("slice") || q.includes("inside")) {
      actions.push({ type: "set_moon_cutaway", amount: 0.72 });
      notes.push("Opened **Moon Internal Core Cutaway (72%)** revealing the crust, olivine mantle, molten boundary, liquid outer iron core & solid inner iron core!");
    }
    actions.push({ type: "fly_to_target", targetId: "moon" });
    notes.push(`Locked onto **The Moon (384,400 km)**. ${FLAGSHIP_PROFILES.moon.overview[persona]}`);
  } else if (q.includes("cislunar")) {
    actions.push({ type: "fly_to_target", targetId: "cislunar" });
    notes.push("Pulled out to the **1.5 Million km Cislunar Neighborhood Map** showing Earth, Moon, L1 DSCOVR, L2 JWST & live Near-Earth Asteroids.");
  } else if (q.includes("hubble")) {
    actions.push({ type: "fly_to_target", targetId: "hubble" });
    notes.push(`Locked onto **Hubble Space Telescope (NORAD 20580)**. ${FLAGSHIP_PROFILES.hubble.overview[persona]}`);
  } else if (q.includes("tiangong") || q.includes("chinese station")) {
    actions.push({ type: "fly_to_target", targetId: "tiangong" });
    notes.push(`Locked onto **Tiangong Space Station (NORAD 48274)**. ${FLAGSHIP_PROFILES.tiangong.overview[persona]}`);
  } else if (q.includes("gps") || q.includes("relativity") || q.includes("glonass") || q.includes("beidou")) {
    actions.push({ type: "fly_to_target", targetId: "gps" });
    notes.push(`Locked onto **GPS III MEO Constellation (~20,200 km)**. ${FLAGSHIP_PROFILES.gps.overview[persona]}`);
  } else if (q.includes("galileo")) {
    actions.push({ type: "fly_to_target", targetId: "galileo" });
    notes.push(`Locked onto **ESA Galileo MEO Constellation (~23,222 km)**. ${FLAGSHIP_PROFILES.gps.overview[persona]}`);
  } else if (q.includes("goes") || q.includes("geostationary") || (q.includes("geo") && !q.includes("hohmann"))) {
    actions.push({ type: "fly_to_target", targetId: "goes" });
    notes.push(`Locked onto **GOES Geostationary Belt (35,786 km)**. ${FLAGSHIP_PROFILES.goes.overview[persona]}`);
  } else if (q.includes("landsat")) {
    actions.push({ type: "fly_to_target", targetId: "sat-49260" });
    notes.push(`Locked onto **Landsat 9 (NORAD 49260)**. ${FLAGSHIP_PROFILES.landsat.overview[persona]}`);
  } else if (q.includes("terra") || q.includes("aqua")) {
    actions.push({ type: "fly_to_target", targetId: "sat-25994" });
    notes.push(`Locked onto **Terra EOS (NORAD 25994)**. ${FLAGSHIP_PROFILES.terra.overview[persona]}`);
  } else if (q.includes("noaa") || q.includes("weather sat")) {
    actions.push({ type: "fly_to_target", targetId: "sat-43013" });
    notes.push(`Locked onto **NOAA-20 JPSS (NORAD 43013)**. ${FLAGSHIP_PROFILES.weather.overview[persona]}`);
  } else if (q.includes("fermi") || q.includes("gamma")) {
    actions.push({ type: "fly_to_target", targetId: "sat-33053" });
    notes.push(`Locked onto **Fermi Gamma-Ray Space Telescope (NORAD 33053)**. ${FLAGSHIP_PROFILES.fermi.overview[persona]}`);
  } else if (q.includes("starlink")) {
    actions.push({ type: "fly_to_target", targetId: "starlink" });
    notes.push(`Tracking **Starlink LEO Shell (~550 km)**. ${FLAGSHIP_PROFILES.starlink.overview[persona]}`);
  } else if (q.includes("iss") || q.includes("space station")) {
    if (!actions.some((a) => a.type === "set_view_mode")) {
      actions.push({ type: "fly_to_target", targetId: "iss" });
      notes.push(`Locked onto **International Space Station (NORAD 25544)**. ${FLAGSHIP_PROFILES.iss.overview[persona]}`);
    }
  } else if (q.includes("earth") && (q.includes("fly") || q.includes("zoom") || q.includes("show"))) {
    actions.push({ type: "fly_to_target", targetId: "earth" });
    notes.push(`Centered on **Earth (Shell 1A Anchor)**. ${FLAGSHIP_PROFILES.earth.overview[persona]}`);
  }

  // Time controls
  if (q.includes("live") && (q.includes("snap") || q.includes("reset") || q.includes("real time"))) {
    actions.push({ type: "control_time", resetToLive: true });
    notes.push("Synchronized 4D orbital engine to **1x LIVE UTC**.");
  } else if (q.includes("pause") || q.includes("stop time")) {
    actions.push({ type: "control_time", paused: true });
    notes.push("Paused 4D orbital propagation.");
  } else if (q.includes("fast") || q.includes("speed") || q.includes("forward") || q.includes("rewind")) {
    const match = q.match(/(-?\d+)\s*x/);
    const mult = match ? Number(match[1]) : q.includes("rewind") ? -60 : 60;
    actions.push({ type: "control_time", multiplier: mult, paused: false });
    notes.push(`4D Time Scrubber set to **${mult}x** speed—watch real SGP4 orbital mechanics accelerate.`);
  }

  // Panels
  if (q.includes("launch")) {
    actions.push({ type: "open_panel", panel: "launches" });
    notes.push("Opened **Upcoming Global Launches** telemetry drawer.");
  } else if (q.includes("news")) {
    actions.push({ type: "open_panel", panel: "news" });
    notes.push("Opened **Live Spaceflight News** briefing.");
  } else if (q.includes("live cam") || q.includes("camera") || q.includes("stream")) {
    actions.push({ type: "open_panel", panel: "livecam" });
    notes.push("Opened **ISS Live Earth-Viewing Video Feed**.");
  } else if (q.includes("memory") || q.includes("fps") || q.includes("performance")) {
    actions.push({ type: "open_panel", panel: "memory" });
    notes.push("Opened **4-Tier Spatial Memory & GPU Monitor**.");
  }

  // Science Q&A answers
  const targetProfile =
    FLAGSHIP_PROFILES[req.context.selectedTargetId] ?? FLAGSHIP_PROFILES.iss;
  if (
    q.includes("oxygen") ||
    q.includes("o2") ||
    q.includes("o₂") ||
    q.includes("water") ||
    q.includes("chem") ||
    q.includes("sabatier")
  ) {
    notes.push(
      `**Chemistry (${targetProfile.name}):** ${targetProfile.science.chemistry.summary[persona]}`
    );
  } else if (q.includes("bio") || q.includes("bone") || q.includes("human") || q.includes("plant") || q.includes("life")) {
    notes.push(
      `**Astrobiology & Life (${targetProfile.name}):** ${targetProfile.science.biology.summary[persona]}`
    );
  } else if (q.includes("physics") || q.includes("gravity") || q.includes("velocity") || q.includes("math") || q.includes("orbit")) {
    notes.push(
      `**Physics & Astrodynamics (${targetProfile.name}):** ${targetProfile.science.physics.summary[persona]}`
    );
  }

  if (notes.length === 0) {
    notes.push(
      `Standing by in **Local Spatial Commander Mode** (persona: **${persona.toUpperCase()}**). Currently viewing **${targetProfile.name}**: ${targetProfile.overview[persona]}\n\n*Tip: Add your free Google AI Studio key to \`GEMINI_API_KEY\` in \`.env.local\` for full conversational Gemini 4 astrophysics reasoning!*`
    );
  }

  return { reply: notes.join("\n\n"), actions };
}

const GEMINI_MODEL_CASCADE = [
  "gemini-4-hydrogen",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

async function callGeminiWithTimeout(
  ai: GoogleGenAI,
  params: Record<string, unknown>,
  timeoutMs = 10000
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await ai.interactions.create(
      { ...(params as Parameters<GoogleGenAI["interactions"]["create"]>[0]), stream: false },
      {
        timeout: timeoutMs,
        maxRetries: 0,
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  let parsedBody: CommanderRequest | null = null;
  try {
    parsedBody = (await request.json()) as CommanderRequest;
    const body = parsedBody;
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey.toLowerCase().includes("your_gemini_api_key")) {
      const local = runLocalCommander(body);
      return NextResponse.json({
        reply: local.reply,
        actions: local.actions,
        mode: "local",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const ctx = body.context;

    const systemInstruction = `You are the AI Spatial Mission Commander for Project Cosmos (Shell 1A + 1B: Earth, LEO, MEO GNSS, GEO Belt & Magnetosphere, 0 -> 40,000 km).
You are both a world-class astrophysicist/astrobiologist/space-chemist AND the pilot of a real-time 3D/4D WebGL orbital simulator.

CURRENT LIVE TELEMETRY CONTEXT:
- User Persona Mode: ${ctx.persona.toUpperCase()} (CRITICAL: tailor your tone, vocabulary, and math/equation depth strictly to this persona!)
- Active Viewpoint: ${ctx.viewMode}
- Active Spectral Sensor: ${ctx.spectralMode}
- Active HUD Mode: ${ctx.hudMode}
- Selected Target: ${ctx.selectedTargetId}
- Observer City: ${ctx.observerCityName}
- Live Telemetry: ${ctx.telemetry ? JSON.stringify({
      name: ctx.telemetry.name,
      lat: ctx.telemetry.latitude.toFixed(2),
      lon: ctx.telemetry.longitude.toFixed(2),
      altKm: ctx.telemetry.altitudeKm.toFixed(1),
      velKmS: ctx.telemetry.velocityKmS.toFixed(2),
      periodMin: ctx.telemetry.periodMin.toFixed(1),
      inclDeg: ctx.telemetry.inclinationDeg.toFixed(2),
      inSunlight: ctx.telemetry.inSunlight,
      provenance: ctx.telemetry.provenance,
    }) : "Earth overview"}

RULES:
1. Whenever the user asks to navigate, zoom, open ISS interior, view from a city sky, switch persona/spectral/HUD modes, change time speed, or open launches/news/livecam/memory panels, ALWAYS invoke the matching function tool(s).
2. Give concise, vivid, scientifically accurate answers integrating Physics, Chemistry, Astrobiology, and Engineering where relevant. Use clean Unicode math symbols (e.g. v = √(μ/r), CO₂, H₂O) instead of raw LaTeX dollar signs.
3. Be scientifically honest about data provenance (distinguish live CelesTrak TLE SGP4 propagation vs fallback orbital elements).`;

    let response: Awaited<ReturnType<typeof callGeminiWithTimeout>> | null = null;
    let modelUsed: string = GEMINI_MODEL_CASCADE[0];
    let lastErr: unknown = null;

    for (const model of GEMINI_MODEL_CASCADE) {
      try {
        response = await callGeminiWithTimeout(
          ai,
          {
            model,
            system_instruction: systemInstruction,
            input: body.message,
            tools: SPATIAL_TOOLS,
          },
          10000
        );
        modelUsed = model;
        break;
      } catch (err) {
        lastErr = err;
        // Fast cascade to next model on transient 503/timeout/rate-limit
      }
    }

    if (!response) {
      throw lastErr ?? new Error("All Gemini models unavailable");
    }

    const actions: SpatialAction[] = [];
    const functionResultInputs: Array<{
      type: "function_result";
      name: string;
      call_id: string;
      result: string;
    }> = [];

    const steps = response.steps ?? [];
    for (const step of steps) {
      if (step.type === "function_call") {
        const args = (step.arguments ?? {}) as Record<string, unknown>;
        const mapped = mapToolCallToAction(step.name, args);
        if (mapped) actions.push(mapped);
        functionResultInputs.push({
          type: "function_result",
          name: step.name,
          call_id: step.id,
          result: JSON.stringify({ ok: true, executed: mapped }),
        });
      }
    }

    let finalReply = response.output_text ?? "";

    // If Gemini requested tool calls and didn't emit final explanation text yet, send tool results back
    if (functionResultInputs.length > 0 && !finalReply.trim()) {
      try {
        const followUp = await callGeminiWithTimeout(
          ai,
          {
            model: modelUsed,
            previous_interaction_id: response.id,
            system_instruction: systemInstruction,
            input: functionResultInputs,
          },
          8000
        );
        finalReply = followUp.output_text ?? "";
      } catch {
        // Keep executed spatial actions and provide concise local confirmation
        const localSummary = runLocalCommander(body);
        finalReply = localSummary.reply;
      }
    }

    return NextResponse.json({
      reply: finalReply || "Spatial command executed.",
      actions,
      mode: "gemini",
      modelUsed,
    });
  } catch (err) {
    // Graceful fallback if key is invalid or rate-limited
    if (parsedBody) {
      const fallback = runLocalCommander(parsedBody);
      return NextResponse.json({
        reply: `${fallback.reply}\n\n*(Gemini API temporarily busy: ${
          err instanceof Error ? err.message : "check GEMINI_API_KEY"
        } — executed instantly via Local Spatial Commander.)*`,
        actions: fallback.actions,
        mode: "local",
      });
    }
    return NextResponse.json(
      { reply: "Command failed to parse.", actions: [], mode: "local" },
      { status: 200 }
    );
  }
}
