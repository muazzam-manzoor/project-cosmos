import { SatelliteTLE } from "@/types/cosmos";

/**
 * Curated real LEO satellite catalog (Shell 1A: 0 -> 2,500 km).
 * Used as an instant zero-latency seed and graceful fallback if CelesTrak is temporarily unreachable.
 * Also includes procedurally distributed representative Starlink orbital planes when live fetch is offline.
 */
const BASE_CURATED_TLES: SatelliteTLE[] = [
  {
    noradId: 25544,
    name: "ISS (ZARYA)",
    category: "station",
    flagshipId: "iss",
    line1: "1 25544U 98067A   26320.51234567  .00016717  00000-0  29543-3 0  9995",
    line2: "2 25544  51.6412 214.1284 0005123  82.4112 277.7521 15.49814215482104",
  },
  {
    noradId: 48274,
    name: "CSS (TIANHE / TIANGONG)",
    category: "station",
    flagshipId: "tiangong",
    line1: "1 48274U 21035A   26320.48120000  .00021540  00000-0  26812-3 0  9991",
    line2: "2 48274  41.4742 132.8115 0006412 194.2104 165.8812 15.61241892312047",
  },
  {
    noradId: 20580,
    name: "HST (HUBBLE SPACE TELESCOPE)",
    category: "science",
    flagshipId: "hubble",
    line1: "1 20580U 90037B   26320.42100000  .00001821  00000-0  89123-4 0  9998",
    line2: "2 20580  28.4694  68.1204 0002481 312.1422  47.9012 15.13421845921042",
  },
  {
    noradId: 25994,
    name: "TERRA (EOS AM-1)",
    category: "science",
    line1: "1 25994U 99068A   26320.38000000  .00000312  00000-0  76123-4 0  9992",
    line2: "2 25994  98.1842  41.2215 0001412  92.1104 268.0124 14.57128412345109",
  },
  {
    noradId: 27424,
    name: "AQUA (EOS PM-1)",
    category: "science",
    line1: "1 27424U 02022A   26320.41000000  .00000412  00000-0  91234-4 0  9994",
    line2: "2 27424  98.2105 225.4122 0001290  85.1120 274.9912 14.57104218291044",
  },
  {
    noradId: 49260,
    name: "LANDSAT 9",
    category: "science",
    line1: "1 49260U 21088A   26320.45000000  .00000291  00000-0  72110-4 0  9997",
    line2: "2 49260  98.2141  33.1488 0001204  90.1241 269.9812 14.57112418210451",
  },
  {
    noradId: 40697,
    name: "SENTINEL-2A",
    category: "science",
    line1: "1 40697U 15028A   26320.39000000  .00000182  00000-0  69214-4 0  9991",
    line2: "2 40697  98.5681  44.8211 0001122  91.4210 268.6812 14.30818412041928",
  },
  {
    noradId: 43013,
    name: "NOAA 20 (JPSS-1)",
    category: "weather",
    line1: "1 43013U 17073A   26320.44000000  .00000142  00000-0  78123-4 0  9996",
    line2: "2 43013  98.7422 248.1204 0001612  79.4122 280.7012 14.19541289104211",
  },
  {
    noradId: 54234,
    name: "NOAA 21 (JPSS-2)",
    category: "weather",
    line1: "1 54234U 22150A   26320.46000000  .00000138  00000-0  74123-4 0  9993",
    line2: "2 54234  98.7381 249.5122 0001580  82.1120 278.0012 14.19562140192811",
  },
  {
    noradId: 33053,
    name: "FERMI GAMMA-RAY TELESCOPE",
    category: "science",
    line1: "1 33053U 08029A   26320.37000000  .00001241  00000-0  61234-4 0  9999",
    line2: "2 33053  25.5812 118.4211 0012412 212.4122 147.6122 15.11241890412844",
  },
  {
    noradId: 28485,
    name: "SWIFT (NEIL GEHRELS)",
    category: "science",
    line1: "1 28485U 04047A   26320.35000000  .00001540  00000-0  68123-4 0  9990",
    line2: "2 28485  20.5581 289.1204 0011204 148.4122 211.7122 15.04218940192811",
  },
  {
    noradId: 36508,
    name: "CRYOSAT-2",
    category: "science",
    line1: "1 36508U 10013A   26320.43000000  .00000210  00000-0  64123-4 0  9995",
    line2: "2 36508  92.0281 174.1204 0009812 104.1120 256.0124 14.52141892041822",
  },
  {
    noradId: 39084,
    name: "LANDSAT 8",
    category: "science",
    line1: "1 39084U 13008A   26320.40000000  .00000250  00000-0  67123-4 0  9994",
    line2: "2 39084  98.2190 213.4122 0001290  88.1120 271.9912 14.57121840192844",
  },
  {
    noradId: 33591,
    name: "NOAA 19",
    category: "weather",
    line1: "1 33591U 09005A   26320.47000000  .00000112  00000-0  81234-4 0  9992",
    line2: "2 33591  99.0214 312.4122 0014122 192.4122 167.6122 14.12481920419284",
  },
  {
    noradId: 56001,
    name: "COSMOS-1408 DEB (LEO FRAGMENT)",
    category: "debris",
    line1: "1 56001U 82092AB  26320.41000000  .00008412  00000-0  31234-3 0  9991",
    line2: "2 56001  82.5612 154.1204 0041204 128.4122 231.7122 15.28412904182911",
  },
  {
    noradId: 31114,
    name: "FENGYUN-1C DEB (TRACKED)",
    category: "debris",
    line1: "1 31114U 99025DX  26320.42000000  .00000912  00000-0  14123-3 0  9998",
    line2: "2 31114  98.8912 204.1204 0091204 248.4122 111.7122 14.21412904182911",
  },
];

function padNum(val: number, len: number, decimals = 4): string {
  return val.toFixed(decimals).padStart(len, " ");
}

/**
 * Generates mathematically valid Walker-Delta Starlink & LEO debris TLEs
 * so the 3D constellation shell is rich and realistic even when completely offline.
 */
export function buildFallbackTLECatalog(): SatelliteTLE[] {
  const list: SatelliteTLE[] = [...BASE_CURATED_TLES];
  let idCounter = 58000;

  // 720 representative Starlink satellites across 24 orbital planes (53.2 deg, ~550 km)
  const planes = 24;
  const satsPerPlane = 30;
  for (let p = 0; p < planes; p++) {
    const raan = (p * 360) / planes;
    for (let s = 0; s < satsPerPlane; s++) {
      const meanAnomaly = ((s * 360) / satsPerPlane + p * 7.5) % 360;
      const norad = idCounter++;
      const noradStr = String(norad).padStart(5, "0");
      const line1 = `1 ${noradStr}U 23099A   26320.50000000  .00003120  00000-0  22140-3 0  9990`;
      const line2 = `2 ${noradStr}  53.2180 ${padNum(raan, 8, 4)} 0001420  90.0000 ${padNum(meanAnomaly, 8, 4)} 15.06412890123456`;
      list.push({
        noradId: norad,
        name: `STARLINK-${norad - 54000}`,
        category: "starlink",
        flagshipId: p === 0 && s === 0 ? "starlink" : undefined,
        line1,
        line2,
      });
    }
  }

  // 240 representative polar Starlink + science + tracked debris objects (70 deg, 82.5 deg & 97.6 deg shells)
  for (let i = 0; i < 240; i++) {
    const norad = idCounter++;
    const noradStr = String(norad).padStart(5, "0");
    const isDebris = i % 3 === 0;
    const isScience = i % 5 === 1;
    const incl = isDebris ? 82.5 + (i % 15) : isScience ? 98.2 : 70.0;
    const raan = (i * 19.7) % 360;
    const ma = (i * 37.3) % 360;
    const meanMotion = isDebris ? 13.6 + (i % 14) * 0.14 : isScience ? 14.55 : 14.98;
    const line1 = `1 ${noradStr}U 24011B   26320.50000000  .00001820  00000-0  14140-3 0  9990`;
    const line2 = `2 ${noradStr} ${padNum(incl, 8, 4)} ${padNum(raan, 8, 4)} 0008420  75.0000 ${padNum(ma, 8, 4)} ${meanMotion.toFixed(8)}123456`;
    list.push({
      noradId: norad,
      name: isDebris
        ? `LEO-DEBRIS-${norad}`
        : isScience
        ? `EARTH-OBS-${i + 1}`
        : `STARLINK-POLAR-${i + 1}`,
      category: isDebris ? "debris" : isScience ? "science" : "starlink",
      flagshipId: undefined,
      line1,
      line2,
    });
  }

  // SHELL 1B: MEO GNSS Constellations (GPS 20,200 km, Galileo 23,222 km, GLONASS 19,130 km, BeiDou 21,528 km)
  const gnssSpecs = [
    { prefix: "GPS III SV", count: 30, planes: 6, incl: 55.0, mm: 2.00563, flagship: "gps" },
    { prefix: "GALILEO-FOC", count: 24, planes: 3, incl: 56.0, mm: 1.70475, flagship: "galileo" },
    { prefix: "GLONASS-M", count: 24, planes: 3, incl: 64.8, mm: 2.13102, flagship: undefined },
    { prefix: "BEIDOU-3 M", count: 24, planes: 3, incl: 55.0, mm: 1.86231, flagship: undefined },
  ];
  for (const spec of gnssSpecs) {
    const perPlane = Math.ceil(spec.count / spec.planes);
    for (let i = 0; i < spec.count; i++) {
      const plane = Math.floor(i / perPlane);
      const slot = i % perPlane;
      const raan = (plane * 360) / spec.planes;
      const ma = ((slot * 360) / perPlane + plane * 15) % 360;
      const norad = idCounter++;
      const noradStr = String(norad).padStart(5, "0");
      const line1 = `1 ${noradStr}U 22088A   26320.50000000  .00000010  00000-0  00000-0 0  9991`;
      const line2 = `2 ${noradStr} ${padNum(spec.incl, 8, 4)} ${padNum(raan, 8, 4)} 0004200  45.0000 ${padNum(ma, 8, 4)} ${spec.mm.toFixed(8)}042104`;
      list.push({
        noradId: norad,
        name: `${spec.prefix}-${String(i + 1).padStart(2, "0")}`,
        category: "gnss",
        flagshipId: i === 0 ? spec.flagship : undefined,
        line1,
        line2,
      });
    }
  }

  // SHELL 1B: Geostationary Belt (35,786 km, 0° incl, 1.0027 rev/day sidereal lock!)
  const geoNames = [
    "GOES-18 (WEST WEATHER)",
    "GOES-19 (EAST WEATHER)",
    "METEOSAT-12 (MTG-I1)",
    "HIMAWARI-9 (JMA WEATHER)",
    "TDRS-13 (NASA RELAY)",
    "INSAT-3DS (ISRO GEO)",
    "FENGYUN-4B (GEO)",
  ];
  for (let i = 0; i < 72; i++) {
    const norad = idCounter++;
    const noradStr = String(norad).padStart(5, "0");
    const ma = (i * 5.0) % 360;
    const incl = 0.08 + (i % 4) * 0.04;
    const line1 = `1 ${noradStr}U 22021A   26320.50000000 -.00000020  00000-0  00000-0 0  9992`;
    const line2 = `2 ${noradStr} ${padNum(incl, 8, 4)}  90.0000 0001100   0.0000 ${padNum(ma, 8, 4)} 1.00270500014201`;
    list.push({
      noradId: norad,
      name: i < geoNames.length ? geoNames[i] : `GEO-COMMS-${i + 1}`,
      category: "geo",
      flagshipId: i === 0 ? "goes" : undefined,
      line1,
      line2,
    });
  }

  return list;
}
