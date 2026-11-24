export type UserPersona = "explorer" | "student" | "teacher" | "scientist";
export type HudMode = "tactical" | "cinema";
export type SpectralMode = "optical" | "infrared" | "radar";
export type ViewMode = "orbit" | "ground" | "iss-interior";
export type SatelliteCategory =
  | "station"
  | "science"
  | "weather"
  | "starlink"
  | "debris"
  | "gnss"
  | "geo";

export type OrbitalRegime = "LEO" | "MEO" | "GEO";

export interface SpaceWeatherData {
  kpIndex: number;
  stormLevel: "G0" | "G1" | "G2" | "G3" | "G4" | "G5";
  stormLabel: string;
  solarWindKmS: number;
  imfBzNt: number;
  protonDensity: number;
  updatedAt: string;
  source: "live" | "fallback";
}

export interface ConjunctionAlert {
  id: string;
  satA: string;
  satB: string;
  targetIdA: string;
  distanceKm: number;
  altitudeKm: number;
  riskLevel: "WATCH" | "ADVISORY";
}

export interface NearEarthAsteroid {
  id: string;
  neoReferenceId: string;
  name: string;
  diameterMinM: number;
  diameterMaxM: number;
  velocityKmS: number;
  missDistanceKm: number;
  missDistanceLD: number;
  closeApproachDate: string;
  isHazardous: boolean;
  spectralType: string;
  absoluteMagnitudeH: number;
  inclinationDeg: number;
  orbitalAngleDeg: number;
  provenance: ProvenanceType;
  provenanceDetail: string;
  hasOfficialGlb?: boolean;
}

export interface DscovrEpicData {
  imageUrl: string;
  caption: string;
  date: string;
  distanceToEarthKm: number;
  centroidLat: number;
  centroidLon: number;
  source: "live" | "fallback";
}

export interface LunarLandmark {
  id: string;
  name: string;
  shortName: string;
  type: "apollo" | "artemis" | "crater" | "mare" | "basin";
  lat: number;
  lon: number;
  missionYear?: string;
  agency?: string;
  description: string;
  geology: string;
  highlight: string;
  hasLunarModule?: boolean;
}

export interface MoonLiveTelemetry {
  distanceKm: number;
  phaseFraction: number; // 0 = New Moon, 0.5 = First/Last Quarter, 1 = Full Moon
  phaseName: string;
  orbitalSpeedKmS: number;
  lightDelaySec: number;
}

export type ProvenanceType =
  | "LIVE_TELEMETRY"
  | "PHYSICS_PROPAGATED"
  | "SPECTRAL_DATA"
  | "AI_PHYSICS_RECONSTRUCTION";

export interface PersonaText {
  explorer: string;
  student: string;
  teacher: string;
  scientist: string;
}

export interface ScienceDeepDive {
  physics: {
    summary: PersonaText;
    equations: Array<{ label: string; formula: string; value: string }>;
  };
  chemistry: {
    summary: PersonaText;
    compounds: Array<{ name: string; formula: string; role: string }>;
  };
  biology: {
    summary: PersonaText;
    highlights: string[];
  };
  engineering: {
    summary: PersonaText;
    specs: Array<{ label: string; value: string }>;
  };
}

export interface FlagshipProfile {
  id: string;
  noradId?: number;
  name: string;
  subtitle: string;
  category: "planet" | SatelliteCategory;
  provenance: ProvenanceType;
  provenanceDetail: string;
  has3DModel: boolean;
  hasInterior?: boolean;
  hasLiveCam?: boolean;
  overview: PersonaText;
  science: ScienceDeepDive;
  quickFacts: Array<{ label: string; value: string }>;
}

export interface SatelliteTLE {
  noradId: number;
  name: string;
  line1: string;
  line2: string;
  category: SatelliteCategory;
  epochAgeDays?: number;
  flagshipId?: string;
}

export interface SatelliteTelemetry {
  id: string;
  noradId?: number;
  name: string;
  category: "planet" | SatelliteCategory;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmS: number;
  periodMin: number;
  inclinationDeg: number;
  eccentricity: number;
  azimuthDeg?: number;
  elevationDeg?: number;
  visibleFromObserver?: boolean;
  inSunlight?: boolean;
  apogeeKm?: number;
  perigeeKm?: number;
  groundSpeedKmH?: number;
  orbitalRegime?: OrbitalRegime;
  relativityOffsetUsDay?: number;
  radiationDoseMSvHr?: number;
  modelProvenance?: string;
  epochAgeDays?: number;
  dataSource?: "live" | "fallback";
  provenance: ProvenanceType;
  provenanceDetail: string;
  tleLine1?: string;
  tleLine2?: string;
}

export interface HoverInfo {
  label: string;
  sub: string;
  x: number;
  y: number;
}

export interface ISSModuleSpec {
  id: string;
  name: string;
  agency: string;
  role: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  overview: PersonaText;
  chemistry: string;
  biology: string;
  physics: string;
  keySystems: string[];
}

export interface LaunchPad {
  id: string;
  name: string;
  shortName: string;
  country: string;
  agency: string;
  lat: number;
  lon: number;
  vehicles: string[];
  description: string;
}

export interface LaunchEvent {
  id: string;
  name: string;
  provider: string;
  vehicle: string;
  padName: string;
  padId?: string;
  lat: number;
  lon: number;
  net: string; // ISO timestamp
  status: string;
  missionDescription: string;
  orbit: string;
  source: "live" | "fallback";
}

export interface SpaceNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  newsSite: string;
  publishedAt: string;
  source: "live" | "fallback";
}

export interface ObserverCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface MemoryStats {
  fps: number;
  activeTier: "Tier 1: Orbital Shell" | "Tier 2: High-Detail LOD" | "Tier 3: Isolated Interior" | "Ground Sky Dome";
  trackedSatellites: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  lruCachedAssets: number;
  evictedAssets: number;
  workerPropagationMs: number;
  workerActive: boolean;
  floatingOriginActive: boolean;
  floatingOriginOffsetKm: number;
  cameraAltitudeKm: number;
}

export type SpatialAction =
  | { type: "fly_to_target"; targetId: string }
  | { type: "set_view_mode"; viewMode: ViewMode; issModuleId?: string; cityId?: string }
  | { type: "set_persona"; persona: UserPersona }
  | { type: "set_spectral_mode"; spectralMode: SpectralMode }
  | { type: "set_hud_mode"; hudMode: HudMode }
  | { type: "control_time"; multiplier?: number; paused?: boolean; resetToLive?: boolean }
  | { type: "open_panel"; panel: "launches" | "news" | "livecam" | "memory" | "none" }
  | {
      type: "set_shell1b_layer";
      layer: "vanAllenBelts" | "magnetosphere" | "hohmannTransfer" | "geoFootprint";
      enabled: boolean;
    }
  | {
      type: "set_shell2_layer";
      layer: "cislunar" | "lagrangePoints" | "neos" | "lunarLandmarks";
      enabled: boolean;
    }
  | {
      type: "set_moon_cutaway";
      amount: number;
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: SpatialAction[];
  mode?: "gemini" | "local";
  timestamp: number;
}
