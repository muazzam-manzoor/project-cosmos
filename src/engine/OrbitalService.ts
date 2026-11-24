import * as satellite from "satellite.js";
import * as THREE from "three";
import {
  ConjunctionAlert,
  OrbitalRegime,
  SatelliteTelemetry,
  SatelliteTLE,
} from "@/types/cosmos";
import {
  computeObserverLookAngles,
  EARTH_RADIUS_KM,
  EARTH_RADIUS_UNITS,
  getSunDirectionECEF,
  latLonAltToVec3,
  UNITS_TO_KM,
} from "./geoMath";
import {
  getModelProvenanceLabel,
  resolveSpacecraftArchetype,
} from "./SpacecraftModels";

const MU_EARTH_KM3_S2 = 398600.4418;
const C_KM_S = 299792.458;

/**
 * Exact Einstein Relativistic Clock Offset (General + Special Relativity) in microseconds/day
 * relative to a clock at sea level on Earth's surface.
 * - GPS (~20,200 km): +38.6 μs/day (GR gravitational blueshift dominates!)
 * - ISS (~420 km): -24.5 μs/day (SR orbital speed time dilation dominates!)
 */
function computeRelativityOffsetUsDay(altKm: number, velKmS: number): number {
  const r = EARTH_RADIUS_KM + altKm;
  const c2 = C_KM_S * C_KM_S;
  const grTerm = (MU_EARTH_KM3_S2 / c2) * (1 / EARTH_RADIUS_KM - 1 / r);
  const srTerm = -(velKmS * velKmS) / (2 * c2);
  return (grTerm + srTerm) * 86400 * 1e6;
}

/**
 * Estimated unshielded trapped-particle Van Allen radiation dose rate (mSv/hr) by orbital altitude.
 */
function estimateVanAllenDoseMSvHr(altKm: number): number {
  if (altKm < 800) return 0.03; // Protected below inner belt (LEO / ISS ~0.5 mSv/day)
  // Inner Proton Belt Gaussian peak around ~3,200 km
  const inner = 85.0 * Math.exp(-Math.pow((altKm - 3200) / 1900, 2));
  // Outer Relativistic Electron Belt Gaussian peak around ~21,000 km
  const outer = 42.0 * Math.exp(-Math.pow((altKm - 21000) / 6800, 2));
  return Number((0.08 + inner + outer).toFixed(2));
}

function classifyOrbitalRegime(altKm: number): OrbitalRegime {
  if (altKm >= 32000) return "GEO";
  if (altKm >= 2500) return "MEO";
  return "LEO";
}

interface CompiledSatellite {
  tle: SatelliteTLE;
  satrec: satellite.SatRec;
  inclinationDeg: number;
  eccentricity: number;
  periodMin: number;
  index: number;
}

export interface PropagatedFrame {
  positions: Float32Array; // [x, y, z] per satellite in Three.js scene units
  validFlags: Uint8Array;
  durationMs: number;
  fromWorker: boolean;
}

/**
 * 64-bit SGP4 Astrodynamics Engine with dedicated Web Worker acceleration.
 * Propagates real CelesTrak TLE catalogs off the main thread using Transferable Float32 buffers,
 * computes cylindrical Earth-shadow eclipse state, 4D trajectory ribbons, and observer sky angles.
 */
export class OrbitalService {
  private compiled: CompiledSatellite[] = [];
  private byNorad = new Map<number, CompiledSatellite>();
  private byFlagship = new Map<string, CompiledSatellite>();
  private dataSource: "live" | "fallback" = "fallback";

  // Synchronous fallback / latest worker frame buffers
  private posBuffer: Float32Array = new Float32Array(0);
  private validBuffer: Uint8Array = new Uint8Array(0);
  private lastDurationMs = 0;
  private tmpVec = new THREE.Vector3();

  // Dedicated Off-Main-Thread Web Worker
  private worker: Worker | null = null;
  private workerReady = false;
  private workerBusy = false;
  private workerHasFrame = false;
  private workerRequestId = 0;

  constructor() {
    if (typeof window !== "undefined" && typeof Worker !== "undefined") {
      try {
        this.worker = new Worker(
          new URL("./orbital.worker.ts", import.meta.url),
          { type: "module" }
        );
        this.worker.onmessage = (
          e: MessageEvent<{
            type: string;
            positions: Float32Array;
            validFlags: Uint8Array;
            durationMs: number;
          }>
        ) => {
          if (e.data?.type === "frame") {
            if (e.data.validFlags.length === this.compiled.length) {
              this.posBuffer = e.data.positions;
              this.validBuffer = e.data.validFlags;
              this.lastDurationMs = e.data.durationMs;
              this.workerHasFrame = true;
            }
            this.workerBusy = false;
          }
        };
        this.worker.onerror = () => {
          // Gracefully degrade to synchronous propagation if bundler/sandbox blocks workers
          this.workerReady = false;
          this.workerBusy = false;
          this.worker?.terminate();
          this.worker = null;
        };
        this.workerReady = true;
      } catch {
        this.worker = null;
        this.workerReady = false;
      }
    }
  }

  public isWorkerActive(): boolean {
    return this.workerReady && this.worker !== null;
  }

  public loadCatalog(
    tles: SatelliteTLE[],
    source: "live" | "fallback" = "fallback"
  ): void {
    this.dataSource = source;
    this.compiled = [];
    this.byNorad.clear();
    this.byFlagship.clear();
    this.workerHasFrame = false;
    this.workerBusy = false;

    for (const tle of tles) {
      try {
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
        const meanMotionRevPerDay = (satrec.no * 1440) / (2 * Math.PI);
        const periodMin =
          meanMotionRevPerDay > 0 ? 1440 / meanMotionRevPerDay : 92.9;

        const entry: CompiledSatellite = {
          tle,
          satrec,
          inclinationDeg: (satrec.inclo * 180) / Math.PI,
          eccentricity: satrec.ecco,
          periodMin,
          index: this.compiled.length,
        };
        this.compiled.push(entry);
        this.byNorad.set(tle.noradId, entry);
        if (tle.flagshipId && !this.byFlagship.has(tle.flagshipId)) {
          this.byFlagship.set(tle.flagshipId, entry);
        }
      } catch {
        // Skip malformed TLE cleanly
      }
    }

    this.posBuffer = new Float32Array(this.compiled.length * 3);
    this.validBuffer = new Uint8Array(this.compiled.length);

    if (this.worker && this.workerReady) {
      this.worker.postMessage({
        type: "load",
        tles: this.compiled.map((c) => ({
          line1: c.tle.line1,
          line2: c.tle.line2,
        })),
      });
    }
  }

  public getCount(): number {
    return this.compiled.length;
  }

  public getSatelliteAt(index: number): SatelliteTLE | undefined {
    return this.compiled[index]?.tle;
  }

  public findSatelliteIndex(targetId: string): number {
    const item = this.findSatelliteByTargetId(targetId);
    return item ? item.index : -1;
  }

  public findSatelliteByTargetId(targetId: string): CompiledSatellite | undefined {
    if (this.byFlagship.has(targetId)) {
      return this.byFlagship.get(targetId);
    }
    if (targetId.startsWith("sat-")) {
      const norad = parseInt(targetId.slice(4), 10);
      if (!Number.isNaN(norad)) return this.byNorad.get(norad);
    }
    return undefined;
  }

  /**
   * Dispatches off-main-thread SGP4 propagation via Web Worker when available.
   * For frame 0 (before first worker reply) or if Worker is unavailable, computes synchronously
   * so satellites appear immediately with zero blank frames.
   */
  public propagateAll(timestampMs: number): PropagatedFrame {
    if (this.worker && this.workerReady) {
      if (!this.workerBusy) {
        this.workerBusy = true;
        this.workerRequestId++;
        this.worker.postMessage({
          type: "propagate",
          timestampMs,
          requestId: this.workerRequestId,
        });
      }
      if (this.workerHasFrame) {
        return {
          positions: this.posBuffer,
          validFlags: this.validBuffer,
          durationMs: this.lastDurationMs,
          fromWorker: true,
        };
      }
    }

    // Immediate synchronous propagation (frame 0 seed or fallback)
    const t0 = performance.now();
    const date = new Date(timestampMs);
    const gmst = satellite.gstime(date);

    for (let i = 0; i < this.compiled.length; i++) {
      const item = this.compiled[i];
      const pv = satellite.propagate(item.satrec, date);
      if (
        pv &&
        pv.position &&
        typeof pv.position !== "boolean" &&
        !Number.isNaN(pv.position.x)
      ) {
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(gd.latitude);
        const lon = satellite.degreesLong(gd.longitude);
        const altKm = Math.max(120, Math.min(45000, gd.height));

        latLonAltToVec3(lat, lon, altKm, this.tmpVec);
        this.posBuffer[i * 3] = this.tmpVec.x;
        this.posBuffer[i * 3 + 1] = this.tmpVec.y;
        this.posBuffer[i * 3 + 2] = this.tmpVec.z;
        this.validBuffer[i] = 1;
      } else {
        this.validBuffer[i] = 0;
      }
    }

    this.lastDurationMs = performance.now() - t0;
    return {
      positions: this.posBuffer,
      validFlags: this.validBuffer,
      durationMs: this.lastDurationMs,
      fromWorker: false,
    };
  }

  /**
   * Computes whether a spacecraft at scenePos is sunlit or inside Earth's cylindrical umbra.
   */
  private isInSunlight(scenePos: THREE.Vector3, timestampMs: number): boolean {
    const sunDir = getSunDirectionECEF(timestampMs);
    const proj = scenePos.dot(sunDir);
    if (proj >= 0) return true; // On sun-facing hemisphere
    // Perpendicular distance from Earth-Sun axis
    const perpSq = scenePos.lengthSq() - proj * proj;
    return perpSq > EARTH_RADIUS_UNITS * EARTH_RADIUS_UNITS;
  }

  /**
   * Computes high-precision telemetry for a single target at timestampMs.
   */
  public getTelemetry(
    targetId: string,
    timestampMs: number,
    obsLat?: number,
    obsLon?: number
  ): { telemetry: SatelliteTelemetry; scenePos: THREE.Vector3 } | null {
    const item = this.findSatelliteByTargetId(targetId);
    if (!item) return null;

    const date = new Date(timestampMs);
    const gmst = satellite.gstime(date);
    const pv = satellite.propagate(item.satrec, date);
    if (
      !pv ||
      !pv.position ||
      typeof pv.position === "boolean" ||
      !pv.velocity ||
      typeof pv.velocity === "boolean"
    ) {
      return null;
    }

    const gd = satellite.eciToGeodetic(pv.position, gmst);
    const lat = satellite.degreesLat(gd.latitude);
    const lon = satellite.degreesLong(gd.longitude);
    const altKm = Math.max(120, gd.height);
    const velKmS = Math.sqrt(
      pv.velocity.x * pv.velocity.x +
        pv.velocity.y * pv.velocity.y +
        pv.velocity.z * pv.velocity.z
    );

    const scenePos = latLonAltToVec3(lat, lon, altKm);
    const inSunlight = this.isInSunlight(scenePos, timestampMs);

    let azimuthDeg: number | undefined;
    let elevationDeg: number | undefined;
    let visibleFromObserver: boolean | undefined;

    if (obsLat !== undefined && obsLon !== undefined) {
      const look = computeObserverLookAngles(obsLat, obsLon, lat, lon, altKm);
      azimuthDeg = look.azimuthDeg;
      elevationDeg = look.elevationDeg;
      visibleFromObserver = look.elevationDeg > 5;
    }

    const epochNote =
      typeof item.tle.epochAgeDays === "number"
        ? ` · epoch ${item.tle.epochAgeDays.toFixed(1)}d ago`
        : "";
    const srcLabel =
      this.dataSource === "live" ? "Live CelesTrak TLE" : "Deterministic Fallback TLE";

    // Semi-major axis a = (mu / n^2)^(1/3) -> exact Keplerian Apogee & Perigee
    const nRadS = item.satrec.no / 60;
    const semiMajorAxisKm =
      nRadS > 0 ? Math.cbrt(MU_EARTH_KM3_S2 / (nRadS * nRadS)) : EARTH_RADIUS_KM + altKm;
    const apogeeKm = Math.max(120, semiMajorAxisKm * (1 + item.eccentricity) - EARTH_RADIUS_KM);
    const perigeeKm = Math.max(120, semiMajorAxisKm * (1 - item.eccentricity) - EARTH_RADIUS_KM);
    const groundSpeedKmH = velKmS * (EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm)) * 3600;
    const archetype = resolveSpacecraftArchetype(
      item.tle.name,
      item.tle.category,
      item.tle.flagshipId
    );
    const modelProvenance = getModelProvenanceLabel(archetype);
    const orbitalRegime = classifyOrbitalRegime(altKm);
    const relativityOffsetUsDay = computeRelativityOffsetUsDay(altKm, velKmS);
    const radiationDoseMSvHr = estimateVanAllenDoseMSvHr(altKm);

    return {
      scenePos,
      telemetry: {
        id: item.tle.flagshipId ?? `sat-${item.tle.noradId}`,
        noradId: item.tle.noradId,
        name: item.tle.name,
        category: item.tle.category,
        latitude: lat,
        longitude: lon,
        altitudeKm: altKm,
        velocityKmS: velKmS,
        periodMin: item.periodMin,
        inclinationDeg: item.inclinationDeg,
        eccentricity: item.eccentricity,
        azimuthDeg,
        elevationDeg,
        visibleFromObserver,
        inSunlight,
        apogeeKm,
        perigeeKm,
        groundSpeedKmH,
        orbitalRegime,
        relativityOffsetUsDay,
        radiationDoseMSvHr,
        modelProvenance,
        epochAgeDays: item.tle.epochAgeDays,
        dataSource: this.dataSource,
        provenance: "PHYSICS_PROPAGATED",
        provenanceDetail: `64-bit SGP4 (${srcLabel} · NORAD #${item.tle.noradId}${epochNote})`,
        tleLine1: item.tle.line1,
        tleLine2: item.tle.line2,
      },
    };
  }

  /**
   * Generates a 4D orbital trajectory ribbon (past 25% + future 75% = 1 full orbit) in scene coordinates.
   */
  public computeOrbitTrack(
    targetId: string,
    timestampMs: number,
    samples = 140
  ): THREE.Vector3[] {
    const item = this.findSatelliteByTargetId(targetId);
    if (!item) return [];

    const points: THREE.Vector3[] = [];
    const spanMs = item.periodMin * 60 * 1000;
    const startMs = timestampMs - spanMs * 0.25;

    for (let i = 0; i <= samples; i++) {
      const t = startMs + (i / samples) * spanMs;
      const date = new Date(t);
      const gmst = satellite.gstime(date);
      const pv = satellite.propagate(item.satrec, date);
      if (pv && pv.position && typeof pv.position !== "boolean") {
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(gd.latitude);
        const lon = satellite.degreesLong(gd.longitude);
        const altKm = Math.max(120, Math.min(45000, gd.height));
        points.push(latLonAltToVec3(lat, lon, altKm));
      }
    }
    return points;
  }

  /**
   * Finds all satellites currently above the local horizon (> 5 deg elevation)
   * for the Ground-Up Earth Sky View.
   */
  public getOverheadSatellites(
    obsLat: number,
    obsLon: number,
    timestampMs: number,
    maxCount = 24
  ): SatelliteTelemetry[] {
    const date = new Date(timestampMs);
    const gmst = satellite.gstime(date);
    const visible: SatelliteTelemetry[] = [];

    for (let i = 0; i < this.compiled.length; i++) {
      const item = this.compiled[i];
      const pv = satellite.propagate(item.satrec, date);
      if (
        !pv ||
        !pv.position ||
        typeof pv.position === "boolean" ||
        !pv.velocity ||
        typeof pv.velocity === "boolean"
      ) {
        continue;
      }

      const gd = satellite.eciToGeodetic(pv.position, gmst);
      const lat = satellite.degreesLat(gd.latitude);
      const lon = satellite.degreesLong(gd.longitude);
      const altKm = Math.max(120, gd.height);
      const look = computeObserverLookAngles(obsLat, obsLon, lat, lon, altKm);

      if (look.elevationDeg > 5) {
        const velKmS = Math.sqrt(
          pv.velocity.x * pv.velocity.x +
            pv.velocity.y * pv.velocity.y +
            pv.velocity.z * pv.velocity.z
        );
        const scenePos = latLonAltToVec3(lat, lon, altKm);
        visible.push({
          id: item.tle.flagshipId ?? `sat-${item.tle.noradId}`,
          noradId: item.tle.noradId,
          name: item.tle.name,
          category: item.tle.category,
          latitude: lat,
          longitude: lon,
          altitudeKm: altKm,
          velocityKmS: velKmS,
          periodMin: item.periodMin,
          inclinationDeg: item.inclinationDeg,
          eccentricity: item.eccentricity,
          azimuthDeg: look.azimuthDeg,
          elevationDeg: look.elevationDeg,
          visibleFromObserver: true,
          inSunlight: this.isInSunlight(scenePos, timestampMs),
          dataSource: this.dataSource,
          provenance: "PHYSICS_PROPAGATED",
          provenanceDetail: `Overhead pass · Elev ${look.elevationDeg.toFixed(1)}° · Az ${look.azimuthDeg.toFixed(0)}°`,
        });
      }
    }

    // Sort highest elevation first (closest to zenith)
    visible.sort((a, b) => (b.elevationDeg ?? 0) - (a.elevationDeg ?? 0));
    return visible.slice(0, maxCount);
  }

  /**
   * Shell 1B Conjunction / Proximity Scanner:
   * Scans the latest propagated position buffer for the tightest live orbital passes
   * between tracked satellites / debris (filtering out docked co-located vehicles < 2 km).
   */
  public scanClosestConjunctions(maxAlerts = 4): ConjunctionAlert[] {
    const n = Math.min(this.compiled.length, 650); // fast O(n^2) upper bound on priority subset
    if (n < 2 || this.posBuffer.length < n * 3) return [];

    const alerts: ConjunctionAlert[] = [];
    const maxUnitsSq = Math.pow(350 / UNITS_TO_KM, 2); // within 350 km proximity
    const minUnitsSq = Math.pow(2.5 / UNITS_TO_KM, 2); // exclude docked vehicles on ISS/CSS

    for (let i = 0; i < n; i++) {
      if (this.validBuffer[i] !== 1) continue;
      const ax = this.posBuffer[i * 3];
      const ay = this.posBuffer[i * 3 + 1];
      const az = this.posBuffer[i * 3 + 2];

      for (let j = i + 1; j < n; j++) {
        if (this.validBuffer[j] !== 1) continue;
        const dx = ax - this.posBuffer[j * 3];
        const dy = ay - this.posBuffer[j * 3 + 1];
        const dz = az - this.posBuffer[j * 3 + 2];
        const dSq = dx * dx + dy * dy + dz * dz;

        if (dSq > minUnitsSq && dSq < maxUnitsSq) {
          const distKm = Math.sqrt(dSq) * UNITS_TO_KM;
          const rUnits = Math.sqrt(ax * ax + ay * ay + az * az);
          const altKm = Math.max(120, rUnits * UNITS_TO_KM - EARTH_RADIUS_KM);
          const a = this.compiled[i].tle;
          const b = this.compiled[j].tle;
          alerts.push({
            id: `${a.noradId}-${b.noradId}`,
            satA: a.name,
            satB: b.name,
            targetIdA: a.flagshipId ?? `sat-${a.noradId}`,
            distanceKm: Number(distKm.toFixed(1)),
            altitudeKm: Math.round(altKm),
            riskLevel: distKm < 65 ? "WATCH" : "ADVISORY",
          });
        }
      }
    }

    alerts.sort((a, b) => a.distanceKm - b.distanceKm);
    return alerts.slice(0, maxAlerts);
  }

  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
    }
  }
}
