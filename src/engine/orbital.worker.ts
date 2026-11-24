import * as satellite from "satellite.js";

const EARTH_RADIUS_KM = 6371.0;
const EARTH_RADIUS_UNITS = 10.0;
const KM_TO_UNITS = EARTH_RADIUS_UNITS / EARTH_RADIUS_KM;
const DEG2RAD = Math.PI / 180;

interface WorkerTLE {
  line1: string;
  line2: string;
}

type WorkerInbound =
  | { type: "load"; tles: WorkerTLE[] }
  | { type: "propagate"; timestampMs: number; requestId: number };

let satrecs: Array<satellite.SatRec | null> = [];

self.onmessage = (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data;
  if (msg.type === "load") {
    satrecs = msg.tles.map((tle) => {
      try {
        return satellite.twoline2satrec(tle.line1, tle.line2);
      } catch {
        return null;
      }
    });
    return;
  }

  if (msg.type === "propagate") {
    const t0 = performance.now();
    const count = satrecs.length;
    const positions = new Float32Array(count * 3);
    const validFlags = new Uint8Array(count);

    const date = new Date(msg.timestampMs);
    const gmst = satellite.gstime(date);

    for (let i = 0; i < count; i++) {
      const satrec = satrecs[i];
      if (!satrec) continue;
      const pv = satellite.propagate(satrec, date);
      if (
        pv &&
        pv.position &&
        typeof pv.position !== "boolean" &&
        !Number.isNaN(pv.position.x)
      ) {
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(gd.latitude);
        const lon = satellite.degreesLong(gd.longitude);
        // Shell 1A + 1B altitude band: 120 km LEO -> 45,000 km MEO/GEO/HEO
        const altKm = Math.max(120, Math.min(45000, gd.height));

        const r = (EARTH_RADIUS_KM + altKm) * KM_TO_UNITS;
        const phi = (90 - lat) * DEG2RAD;
        const theta = (lon + 180) * DEG2RAD;
        const sinPhi = Math.sin(phi);

        positions[i * 3] = -r * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi);
        positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
        validFlags[i] = 1;
      }
    }

    const durationMs = performance.now() - t0;
    self.postMessage(
      {
        type: "frame",
        requestId: msg.requestId,
        positions,
        validFlags,
        durationMs,
      },
      { transfer: [positions.buffer, validFlags.buffer] }
    );
  }
};
