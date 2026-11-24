import { create } from "zustand";
import {
  ChatMessage,
  ConjunctionAlert,
  DscovrEpicData,
  HoverInfo,
  HudMode,
  LaunchEvent,
  MemoryStats,
  MoonLiveTelemetry,
  NearEarthAsteroid,
  ObserverCity,
  SatelliteCategory,
  SatelliteTelemetry,
  SatelliteTLE,
  SpaceNewsItem,
  SpaceWeatherData,
  SpatialAction,
  SpectralMode,
  UserPersona,
  ViewMode,
} from "@/types/cosmos";
import { OBSERVER_CITIES } from "@/data/cities";

export interface LayerVisibility {
  satellites: boolean;
  orbits: boolean;
  launchPads: boolean;
  auroras: boolean;
  clouds: boolean;
  grid: boolean;
  // Shell 1B Layers (2,500 -> 40,000 km)
  vanAllenBelts: boolean;
  magnetosphere: boolean;
  hohmannTransfer: boolean;
  geoFootprint: boolean;
  // Shell 2 Layers (40,000 km -> 1.5 Million km)
  cislunar: boolean;
  lagrangePoints: boolean;
  neos: boolean;
  lunarLandmarks: boolean;
  categories: Record<SatelliteCategory, boolean>;
}

interface CosmosStoreState {
  // Core Modes
  persona: UserPersona;
  hudMode: HudMode;
  spectralMode: SpectralMode;
  viewMode: ViewMode;

  // Target & Camera
  selectedTargetId: string; // 'earth' | 'iss' | 'hubble' | 'tiangong' | 'sat-<norad>' | 'pad-<id>'
  selectedIssModuleId: string;
  issCutawayAmount: number;
  issInsideCabin: boolean;
  moonCutawayAmount: number;
  groundStargazerNight: boolean;
  rideAlongLocked: boolean;
  observerCity: ObserverCity;
  hoveredObject: HoverInfo | null;

  // 4D Time Engine
  simTimestamp: number;
  clockSyncNonce: number;
  timeMultiplier: number;
  isPaused: boolean;

  // Live Data
  satellites: SatelliteTLE[];
  satellitesSource: "live" | "fallback";
  selectedTelemetry: SatelliteTelemetry | null;
  issTelemetry: SatelliteTelemetry | null;
  overheadSatellites: SatelliteTelemetry[];
  launches: LaunchEvent[];
  news: SpaceNewsItem[];
  spaceWeather: SpaceWeatherData | null;
  conjunctions: ConjunctionAlert[];
  hohmannTelemetry: {
    altitudeKm: number;
    speedKmS: number;
    phasePct: number;
    burnState: string;
  } | null;
  // Shell 2 Live Data
  neos: NearEarthAsteroid[];
  neosSource: "live" | "fallback";
  dscovrEpic: DscovrEpicData | null;
  moonTelemetry: MoonLiveTelemetry | null;

  // Layers & Panels
  layers: LayerVisibility;
  activePanel: "none" | "launches" | "news" | "livecam" | "memory";
  aiDrawerOpen: boolean;
  memoryStats: MemoryStats;

  // AI Spatial Commander
  chatMessages: ChatMessage[];
  aiLoading: boolean;
  pendingActions: SpatialAction[];
  flushCacheCounter: number;
  stressTestCounter: number;
  stressTestResult: string | null;

  // Setters & Actions
  setPersona: (persona: UserPersona) => void;
  setHudMode: (hudMode: HudMode) => void;
  toggleHudMode: () => void;
  setSpectralMode: (spectralMode: SpectralMode) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSelectedTargetId: (id: string, lockRideAlong?: boolean) => void;
  setSelectedIssModuleId: (moduleId: string) => void;
  setIssCutawayAmount: (amount: number) => void;
  setIssInsideCabin: (inside: boolean) => void;
  setMoonCutawayAmount: (amount: number) => void;
  setGroundStargazerNight: (night: boolean) => void;
  exitFocus: () => void;
  setHoveredObject: (info: HoverInfo | null) => void;
  setRideAlongLocked: (locked: boolean) => void;
  setObserverCity: (city: ObserverCity) => void;
  setTimeMultiplier: (mult: number) => void;
  setIsPaused: (paused: boolean) => void;
  setSimTimestamp: (ts: number) => void;
  scrubSimTimestamp: (ts: number) => void;
  snapToLive: () => void;
  setSatellites: (list: SatelliteTLE[], source: "live" | "fallback") => void;
  setSelectedTelemetry: (t: SatelliteTelemetry | null) => void;
  setIssTelemetry: (t: SatelliteTelemetry | null) => void;
  setOverheadSatellites: (list: SatelliteTelemetry[]) => void;
  setLaunches: (list: LaunchEvent[]) => void;
  setNews: (list: SpaceNewsItem[]) => void;
  setSpaceWeather: (sw: SpaceWeatherData) => void;
  setConjunctions: (list: ConjunctionAlert[]) => void;
  setHohmannTelemetry: (
    t: { altitudeKm: number; speedKmS: number; phasePct: number; burnState: string } | null
  ) => void;
  setNeos: (list: NearEarthAsteroid[], source: "live" | "fallback") => void;
  setDscovrEpic: (epic: DscovrEpicData) => void;
  setMoonTelemetry: (m: MoonLiveTelemetry) => void;
  toggleLayer: (key: Exclude<keyof LayerVisibility, "categories">) => void;
  setLayerValue: (key: Exclude<keyof LayerVisibility, "categories">, value: boolean) => void;
  toggleCategory: (cat: SatelliteCategory) => void;
  setActivePanel: (panel: "none" | "launches" | "news" | "livecam" | "memory") => void;
  setAiDrawerOpen: (open: boolean) => void;
  setMemoryStats: (stats: MemoryStats) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setAiLoading: (loading: boolean) => void;
  dispatchSpatialActions: (actions: SpatialAction[]) => void;
  consumePendingActions: () => SpatialAction[];
  triggerCacheFlush: () => void;
  triggerStressTest: () => void;
  setStressTestResult: (result: string | null) => void;
}

export const useCosmosStore = create<CosmosStoreState>((set, get) => ({
  persona: "explorer",
  hudMode: "tactical",
  spectralMode: "optical",
  viewMode: "orbit",

  selectedTargetId: "earth",
  selectedIssModuleId: "cupola",
  issCutawayAmount: 0.65,
  issInsideCabin: false,
  moonCutawayAmount: 0,
  groundStargazerNight: false,
  rideAlongLocked: false,
  observerCity: OBSERVER_CITIES[0],
  hoveredObject: null,

  simTimestamp: 0,
  clockSyncNonce: 0,
  timeMultiplier: 1,
  isPaused: false,

  satellites: [],
  satellitesSource: "fallback",
  selectedTelemetry: null,
  issTelemetry: null,
  overheadSatellites: [],
  launches: [],
  news: [],
  spaceWeather: {
    kpIndex: 2.33,
    stormLevel: "G0",
    stormLabel: "Quiet",
    solarWindKmS: 415,
    imfBzNt: -1.4,
    protonDensity: 4.6,
    updatedAt: "",
    source: "fallback",
  },
  conjunctions: [],
  hohmannTelemetry: null,
  neos: [],
  neosSource: "fallback",
  dscovrEpic: null,
  moonTelemetry: null,

  layers: {
    satellites: true,
    orbits: true,
    launchPads: true,
    auroras: true,
    clouds: true,
    grid: false,
    vanAllenBelts: false,
    magnetosphere: false,
    hohmannTransfer: false,
    geoFootprint: true,
    cislunar: true,
    lagrangePoints: true,
    neos: true,
    lunarLandmarks: true,
    categories: {
      station: true,
      science: true,
      weather: true,
      starlink: true,
      debris: true,
      gnss: true,
      geo: true,
    },
  },
  activePanel: "none",
  aiDrawerOpen: false,
  memoryStats: {
    fps: 60,
    activeTier: "Tier 1: Orbital Shell",
    trackedSatellites: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    lruCachedAssets: 0,
    evictedAssets: 0,
    workerPropagationMs: 0,
    workerActive: false,
    floatingOriginActive: false,
    floatingOriginOffsetKm: 0,
    cameraAltitudeKm: 12000,
  },

  chatMessages: [
    {
      id: "welcome-1",
      role: "assistant",
      mode: "local",
      timestamp: 0,
      content:
        "Welcome to **Project Cosmos — Shells 1A + 1B + 2 (0 → 1.5 Million km: Earth, LEO/MEO/GEO, Moon, L1 DSCOVR, L2 JWST & Near-Earth Asteroids)**. Ask me to fly anywhere or explain orbital physics, lunar geology, infrared cosmology, or asteroid defense:\n- *\"Fly to the Moon & slice open its internal core\"*\n- *\"Fly to James Webb Space Telescope at L2\"*\n- *\"Show Asteroid Bennu & live Near-Earth Asteroids\"*\n- *\"Show Van Allen belts & Magnetosphere\"*",
    },
  ],
  aiLoading: false,
  pendingActions: [],
  flushCacheCounter: 0,
  stressTestCounter: 0,
  stressTestResult: null,

  setPersona: (persona) => set({ persona }),
  setHudMode: (hudMode) => set({ hudMode }),
  toggleHudMode: () =>
    set((s) => ({ hudMode: s.hudMode === "tactical" ? "cinema" : "tactical" })),
  setSpectralMode: (spectralMode) => set({ spectralMode }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedTargetId: (id, lockRideAlong) =>
    set((s) => ({
      selectedTargetId: id,
      rideAlongLocked: lockRideAlong !== undefined ? lockRideAlong : s.rideAlongLocked,
    })),
  setSelectedIssModuleId: (selectedIssModuleId) => set({ selectedIssModuleId }),
  setIssCutawayAmount: (issCutawayAmount) => set({ issCutawayAmount }),
  setIssInsideCabin: (issInsideCabin) => set({ issInsideCabin }),
  setMoonCutawayAmount: (moonCutawayAmount) => set({ moonCutawayAmount }),
  setGroundStargazerNight: (groundStargazerNight) => set({ groundStargazerNight }),
  exitFocus: () => {
    set((s) => ({
      viewMode: "orbit",
      selectedTargetId: "earth",
      rideAlongLocked: false,
      issInsideCabin: false,
      hoveredObject: null,
      pendingActions: [...s.pendingActions, { type: "fly_to_target", targetId: "earth" }],
    }));
  },
  setHoveredObject: (hoveredObject) => set({ hoveredObject }),
  setRideAlongLocked: (rideAlongLocked) => set({ rideAlongLocked }),
  setObserverCity: (observerCity) => set({ observerCity }),
  setTimeMultiplier: (timeMultiplier) => set({ timeMultiplier, isPaused: false }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setSimTimestamp: (simTimestamp) => set({ simTimestamp }),
  scrubSimTimestamp: (simTimestamp) =>
    set((s) => ({ simTimestamp, clockSyncNonce: s.clockSyncNonce + 1 })),
  snapToLive: () =>
    set((s) => ({
      simTimestamp: Date.now(),
      timeMultiplier: 1,
      isPaused: false,
      clockSyncNonce: s.clockSyncNonce + 1,
    })),
  setSatellites: (satellites, satellitesSource) => set({ satellites, satellitesSource }),
  setSelectedTelemetry: (selectedTelemetry) => set({ selectedTelemetry }),
  setIssTelemetry: (issTelemetry) => set({ issTelemetry }),
  setOverheadSatellites: (overheadSatellites) => set({ overheadSatellites }),
  setLaunches: (launches) => set({ launches }),
  setNews: (news) => set({ news }),
  setSpaceWeather: (spaceWeather) => set({ spaceWeather }),
  setConjunctions: (conjunctions) => set({ conjunctions }),
  setHohmannTelemetry: (hohmannTelemetry) => set({ hohmannTelemetry }),
  setNeos: (neos, neosSource) => set({ neos, neosSource }),
  setDscovrEpic: (dscovrEpic) => set({ dscovrEpic }),
  setMoonTelemetry: (moonTelemetry) => set({ moonTelemetry }),
  toggleLayer: (key) =>
    set((s) => ({
      layers: { ...s.layers, [key]: !s.layers[key] },
    })),
  setLayerValue: (key, value) =>
    set((s) => ({
      layers: { ...s.layers, [key]: value },
    })),
  toggleCategory: (cat) =>
    set((s) => ({
      layers: {
        ...s.layers,
        categories: {
          ...s.layers.categories,
          [cat]: !s.layers.categories[cat],
        },
      },
    })),
  setActivePanel: (activePanel) =>
    set((s) => ({
      activePanel: s.activePanel === activePanel ? "none" : activePanel,
    })),
  setAiDrawerOpen: (aiDrawerOpen) => set({ aiDrawerOpen }),
  setMemoryStats: (memoryStats) => set({ memoryStats }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setAiLoading: (aiLoading) => set({ aiLoading }),
  dispatchSpatialActions: (actions) => {
    const state = get();
    // Apply state-level actions immediately and queue camera/engine actions
    for (const action of actions) {
      if (action.type === "set_persona") state.setPersona(action.persona);
      if (action.type === "set_spectral_mode") state.setSpectralMode(action.spectralMode);
      if (action.type === "set_hud_mode") state.setHudMode(action.hudMode);
      if (action.type === "open_panel") set({ activePanel: action.panel });
      if (action.type === "control_time") {
        if (action.resetToLive) {
          state.snapToLive();
        } else {
          if (typeof action.multiplier === "number") state.setTimeMultiplier(action.multiplier);
          if (typeof action.paused === "boolean") state.setIsPaused(action.paused);
        }
      }
      if (action.type === "set_view_mode") {
        state.setViewMode(action.viewMode);
        if (action.issModuleId) state.setSelectedIssModuleId(action.issModuleId);
        if (action.cityId) {
          const found = OBSERVER_CITIES.find(
            (c) =>
              c.id.toLowerCase() === action.cityId!.toLowerCase() ||
              c.name.toLowerCase().includes(action.cityId!.toLowerCase())
          );
          if (found) state.setObserverCity(found);
        }
      }
      if (action.type === "set_shell1b_layer") {
        state.setLayerValue(action.layer, action.enabled);
      }
      if (action.type === "set_shell2_layer") {
        state.setLayerValue(action.layer, action.enabled);
      }
      if (action.type === "set_moon_cutaway") {
        state.setMoonCutawayAmount(action.amount);
      }
      if (action.type === "fly_to_target") {
        if (get().viewMode !== "orbit") {
          set({ viewMode: "orbit" });
        }
        if (
          action.targetId === "shell-1b" ||
          action.targetId === "van-allen" ||
          action.targetId === "magnetosphere" ||
          action.targetId === "cislunar"
        ) {
          state.setSelectedTargetId("earth", false);
        } else if (action.targetId.startsWith("phenom-")) {
          state.setSelectedTargetId(action.targetId, action.targetId === "phenom-hohmann-craft");
        } else if (
          action.targetId === "moon" ||
          action.targetId.startsWith("lunar-") ||
          action.targetId === "lro" ||
          action.targetId === "jwst" ||
          action.targetId === "dscovr" ||
          action.targetId.startsWith("neo-")
        ) {
          state.setSelectedTargetId(action.targetId, true);
        } else {
          state.setSelectedTargetId(action.targetId, action.targetId !== "earth");
        }
      }
    }
    set((s) => ({ pendingActions: [...s.pendingActions, ...actions] }));
  },
  consumePendingActions: () => {
    const actions = get().pendingActions;
    if (actions.length > 0) set({ pendingActions: [] });
    return actions;
  },
  triggerCacheFlush: () =>
    set((s) => ({ flushCacheCounter: s.flushCacheCounter + 1 })),
  triggerStressTest: () =>
    set((s) => ({
      stressTestCounter: s.stressTestCounter + 1,
      stressTestResult: "Running 50-cycle LOD & disposal test...",
    })),
  setStressTestResult: (stressTestResult) => set({ stressTestResult }),
}));
