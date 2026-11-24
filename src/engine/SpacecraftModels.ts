import * as THREE from "three";
import { SatelliteCategory } from "@/types/cosmos";
import { getSharedGltfLoader } from "./sharedGltfLoader";
import {
  getGoldKaptonMaps,
  getParabolicDishMaps,
  getSolarArrayMaps,
  getSpacecraftHullMaps,
} from "./PBRTextureFactory";

export type SpacecraftArchetype =
  | "iss"
  | "hubble"
  | "tiangong"
  | "starlink"
  | "landsat"
  | "terra"
  | "aqua"
  | "fermi"
  | "swift"
  | "sentinel"
  | "weather"
  | "science-generic"
  | "debris"
  | "gnss"
  | "geo"
  | "tdrs"
  | "sdo"
  | "van-allen";

interface NasaGlbSpec {
  url: string;
  targetSize: number;
  label: string;
  photoUrl: string;
  tintPalette?: {
    primaryHex: number;
    accentHex: number;
    solarHex: number;
    solarVariant?: "blue-gaas" | "iss-amber" | "cyan-starlink";
  };
}

const NASA_GLB_SPECS: Partial<Record<SpacecraftArchetype, NasaGlbSpec>> = {
  iss: {
    url: "/models/iss.glb",
    targetSize: 0.88,
    label: "Official NASA 3D ISS Replica",
    photoUrl: "/images/iss.jpg",
    tintPalette: {
      primaryHex: 0xeaf0f7,
      accentHex: 0xa8b8cc,
      solarHex: 0xd97706,
      solarVariant: "iss-amber",
    },
  },
  hubble: {
    url: "/models/hubble_hi.glb",
    targetSize: 0.5,
    label: "Official NASA High-Res Hubble (1,308-Part CAD)",
    photoUrl: "/images/hubble.jpg",
    tintPalette: {
      primaryHex: 0xe6edf5,
      accentHex: 0xf59e0b,
      solarHex: 0x1d4ed8,
      solarVariant: "blue-gaas",
    },
  },
  landsat: {
    url: "/models/landsat.glb",
    targetSize: 0.48,
    label: "Official NASA Landsat 8/9 3D Replica",
    photoUrl: "/images/landsat.jpg",
    tintPalette: {
      primaryHex: 0xf59e0b,
      accentHex: 0xe2e8f0,
      solarHex: 0x0284c7,
      solarVariant: "blue-gaas",
    },
  },
  terra: {
    url: "/models/aqua.glb",
    targetSize: 0.48,
    label: "Official NASA EOS (Terra/Aqua) 3D Replica",
    photoUrl: "/images/terra.jpg",
  },
  aqua: {
    url: "/models/aqua.glb",
    targetSize: 0.48,
    label: "Official NASA Aqua EOS 3D Replica",
    photoUrl: "/images/terra.jpg",
  },
  fermi: {
    url: "/models/fermi.glb",
    targetSize: 0.48,
    label: "Official NASA Fermi Gamma-Ray 3D Replica",
    photoUrl: "/images/fermi.jpg",
    tintPalette: {
      primaryHex: 0xf8fafc,
      accentHex: 0xd97706,
      solarHex: 0x1e3a8a,
      solarVariant: "blue-gaas",
    },
  },
  swift: {
    url: "/models/swift.glb",
    targetSize: 0.46,
    label: "Official NASA Swift Observatory 3D Replica",
    photoUrl: "/images/fermi.jpg",
    tintPalette: {
      primaryHex: 0xcbd5e1,
      accentHex: 0xf59e0b,
      solarHex: 0x2563eb,
      solarVariant: "blue-gaas",
    },
  },
  sentinel: {
    url: "/models/sentinel.glb",
    targetSize: 0.48,
    label: "Official NASA/ESA Sentinel-6 3D Replica",
    photoUrl: "/images/landsat.jpg",
  },
  weather: {
    url: "/models/suomi_weather.glb",
    targetSize: 0.48,
    label: "Official NASA/NOAA JPSS Weather 3D Replica",
    photoUrl: "/images/weather.jpg",
  },
  geo: {
    url: "/models/goes.glb",
    targetSize: 0.96,
    label: "Official NASA/NOAA GOES Geostationary 3D CAD",
    photoUrl: "/images/weather.jpg",
    tintPalette: {
      primaryHex: 0xf59e0b,
      accentHex: 0xe2e8f0,
      solarHex: 0x1d4ed8,
      solarVariant: "blue-gaas",
    },
  },
  tdrs: {
    url: "/models/tdrs.glb",
    targetSize: 1.05,
    label: "Official NASA TDRS GEO Relay 3D CAD (64-Part)",
    photoUrl: "/images/weather.jpg",
    tintPalette: {
      primaryHex: 0xfbbf24,
      accentHex: 0xe2e8f0,
      solarHex: 0x1e40af,
      solarVariant: "blue-gaas",
    },
  },
  sdo: {
    url: "/models/sdo.glb",
    targetSize: 0.9,
    label: "Official NASA Solar Dynamics Observatory 3D CAD",
    photoUrl: "/images/weather.jpg",
    tintPalette: {
      primaryHex: 0xe2e8f0,
      accentHex: 0xf59e0b,
      solarHex: 0x1d4ed8,
      solarVariant: "blue-gaas",
    },
  },
  "van-allen": {
    url: "/models/van_allen.glb",
    targetSize: 0.72,
    label: "Official NASA Van Allen Probes 3D CAD",
    photoUrl: "/images/earth.jpg",
    tintPalette: {
      primaryHex: 0xfbbf24,
      accentHex: 0xcbd5e1,
      solarHex: 0x0284c7,
      solarVariant: "blue-gaas",
    },
  },
  "science-generic": {
    url: "/models/aura.glb",
    targetSize: 0.46,
    label: "Official NASA Aura Science 3D Replica",
    photoUrl: "/images/terra.jpg",
  },
};

const sharedGltfLoader = getSharedGltfLoader();

export function resolveSpacecraftArchetype(
  name: string,
  category: SatelliteCategory | "planet",
  flagshipId?: string
): SpacecraftArchetype {
  const upper = name.toUpperCase();
  if (flagshipId === "iss" || upper.includes("ISS (ZARYA)") || upper === "ISS") return "iss";
  if (flagshipId === "hubble" || upper.includes("HUBBLE") || upper.includes("HST")) return "hubble";
  if (
    flagshipId === "tiangong" ||
    upper.includes("TIANGONG") ||
    upper.includes("TIANHE") ||
    upper.includes("CSS")
  ) {
    return "tiangong";
  }
  if (category === "debris" || upper.includes(" DEB") || upper.includes("R/B") || upper.includes("DEBRIS")) {
    return "debris";
  }
  if (upper.includes("LANDSAT")) return "landsat";
  if (upper.includes("TERRA")) return "terra";
  if (upper.includes("AQUA")) return "aqua";
  if (upper.includes("FERMI")) return "fermi";
  if (upper.includes("SWIFT")) return "swift";
  if (upper.includes("SENTINEL") || upper.includes("JASON") || upper.includes("CRYOSAT")) {
    return "sentinel";
  }
  if (upper.includes("TDRS")) return "tdrs";
  if (upper.includes("SDO")) return "sdo";
  if (upper.includes("RBSP") || upper.includes("VAN ALLEN")) return "van-allen";
  if (
    category === "weather" ||
    upper.includes("NOAA") ||
    upper.includes("SUOMI") ||
    upper.includes("METOP") ||
    upper.includes("JPSS")
  ) {
    return "weather";
  }
  if (
    category === "gnss" ||
    flagshipId === "gps" ||
    flagshipId === "galileo" ||
    upper.includes("GPS") ||
    upper.includes("NAVSTAR") ||
    upper.includes("GALILEO") ||
    upper.includes("GLONASS") ||
    upper.includes("BEIDOU")
  ) {
    return "gnss";
  }
  if (
    category === "geo" ||
    flagshipId === "goes" ||
    upper.includes("GOES") ||
    upper.includes("METEOSAT") ||
    upper.includes("HIMAWARI")
  ) {
    // GOES/Weather GEO use Official NASA GOES CAD; commercial telecom relays use NASA TDRS 64-part twin-dish CAD!
    if (
      flagshipId === "goes" ||
      upper.includes("GOES") ||
      upper.includes("METEOSAT") ||
      upper.includes("HIMAWARI") ||
      upper.includes("FENGYUN")
    ) {
      return "geo";
    }
    return "tdrs";
  }
  if (category === "starlink" || upper.includes("STARLINK")) return "starlink";
  if (category === "station") return "tiangong";
  return "science-generic";
}

export function getModelProvenanceLabel(archetype: SpacecraftArchetype): string {
  const spec = NASA_GLB_SPECS[archetype];
  if (spec) return spec.label;
  if (archetype === "tiangong") return "High-Detail PBR Tiangong (CSS) Multi-Module Replica";
  if (archetype === "starlink") return "High-Detail PBR Starlink v2 Mini Replica";
  if (archetype === "gnss") return "High-Detail PBR GPS III / Galileo MEO Navigation Replica";
  if (archetype === "geo") return "Official NASA/NOAA GOES Geostationary 3D CAD";
  if (archetype === "tdrs") return "Official NASA TDRS GEO Relay 3D CAD (64-Part)";
  return "High-Detail PBR Orbital Debris / Spent Stage Fragment";
}

export function getHeroPhotoForTarget(
  targetId: string,
  archetype?: SpacecraftArchetype
): { url: string; caption: string } {
  if (targetId === "earth") {
    return { url: "/images/earth.jpg", caption: "NASA Blue Marble — Earth from Space" };
  }
  if (targetId === "moon" || targetId.startsWith("lunar-") || targetId === "lro") {
    return {
      url: "/images/moon.jpg",
      caption: "NASA Lunar Reconnaissance Orbiter (LRO) — Full-Disk Lunar Photography",
    };
  }
  if (targetId === "jwst") {
    return {
      url: "/images/jwst.jpg",
      caption: "NASA / ESA / CSA James Webb Space Telescope — NIRCam Carina Cosmic Cliffs",
    };
  }
  if (targetId === "dscovr") {
    return {
      url: "/images/earth.jpg",
      caption: "NOAA / NASA DSCOVR EPIC — Full-Disc Sunlit Earth from Sun–Earth L1 (1.5M km)",
    };
  }
  if (targetId.startsWith("neo-")) {
    return {
      url: "/images/asteroid.jpg",
      caption: "NASA OSIRIS-REx PolyCam — Carbonaceous Regolith on Asteroid 101955 Bennu",
    };
  }
  if (targetId === "phenom-hohmann-craft" || targetId === "phenom-perigee-burn") {
    return { url: "/images/launch.jpg", caption: "Orbital Transfer Mechanics — LEO (400 km) → GTO → GEO (35,786 km)" };
  }
  if (targetId === "phenom-apogee-burn") {
    return { url: "/images/weather.jpg", caption: "Geostationary Circularization — 35,786 km Clarke Belt Arrival" };
  }
  if (
    targetId === "phenom-van-allen-inner" ||
    targetId === "phenom-van-allen-outer" ||
    targetId === "phenom-magnetosphere"
  ) {
    return { url: "/images/earth.jpg", caption: "NASA / NOAA Geomagnetic Radiation & Magnetosphere Environment" };
  }
  if (targetId.startsWith("pad-")) {
    return { url: "/images/launch.jpg", caption: "NASA Kennedy Space Center Orbital Launch" };
  }
  const arch = archetype ?? (targetId as SpacecraftArchetype);
  const spec = NASA_GLB_SPECS[arch];
  if (spec?.photoUrl) {
    return { url: spec.photoUrl, caption: `Real NASA Mission Photograph · ${spec.label}` };
  }
  if (arch === "gnss" || targetId === "gps" || targetId === "galileo") {
    return { url: "/images/earth.jpg", caption: "MEO Global Navigation Constellation (~20,200 km)" };
  }
  if (arch === "geo" || arch === "tdrs" || targetId === "goes") {
    return { url: "/images/weather.jpg", caption: "NOAA / NASA Geostationary Weather & Relay Belt (35,786 km)" };
  }
  if (arch === "debris") {
    return { url: "/images/debris.jpg", caption: "NASA Orbital Debris Environment Visualization" };
  }
  if (arch === "starlink") {
    return { url: "/images/launch.jpg", caption: "LEO Broadband Constellation Deployment" };
  }
  return { url: "/images/iss.jpg", caption: "NASA Low Earth Orbit Mission Photography" };
}

/**
 * Generates a high-dynamic-range Orbital Space + Bright Sun + Panoramic Blue Earthshine IBL Environment Map
 * via PMREMGenerator so crinkled Kapton gold foil, chrome hulls, and solar arrays gleam photorealistically
 * from EVERY viewing angle without dark faces crushing to pitch black!
 */
export function createOrbitalEnvironmentMap(
  renderer: THREE.WebGLRenderer
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  // Deep aerospace ambient reflection base (prevents metallic black crush in vacuum)
  envScene.background = new THREE.Color(0x13223b);

  // 1. Intense Solar Key Light Hotspot (+X, +Y, +Z)
  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb })
  );
  sunSphere.position.set(26, 18, 22);
  envScene.add(sunSphere);

  // 2. Warm Solar Halo Ring for smooth specular roll-off on metallic gold foil
  const sunHalo = new THREE.Mesh(
    new THREE.SphereGeometry(18, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.45 })
  );
  sunHalo.position.set(28, 16, 20);
  envScene.add(sunHalo);

  // 3. Panoramic Luminous Blue-White Earthshine Albedo Dome underneath (-Y)
  const earthGlow = new THREE.Mesh(
    new THREE.SphereGeometry(32, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
  );
  earthGlow.position.set(0, -34, 0);
  envScene.add(earthGlow);

  // Cloud-albedo bright cap on Earthshine hemisphere
  const cloudAlbedo = new THREE.Mesh(
    new THREE.SphereGeometry(18, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xdbeafe })
  );
  cloudAlbedo.position.set(6, -30, 8);
  envScene.add(cloudAlbedo);

  // 4. Opposing Soft Cool Rim Fill (-X, +Y, -Z) so shadow-side trusses & dishes stay readable
  const rimGlow = new THREE.Mesh(
    new THREE.SphereGeometry(16, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x93c5fd })
  );
  rimGlow.position.set(-28, 10, -24);
  envScene.add(rimGlow);

  const rimWarm = new THREE.Mesh(
    new THREE.SphereGeometry(12, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x64748b })
  );
  rimWarm.position.set(-18, -10, 26);
  envScene.add(rimWarm);

  const rt = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  envScene.traverse((obj) => {
    const m = obj as THREE.Mesh;
    m.geometry?.dispose();
    if (m.material) (m.material as THREE.Material).dispose();
  });
  return rt.texture;
}

function disposeChildrenCleanly(group: THREE.Object3D): void {
  const children = [...group.children];
  for (const child of children) {
    group.remove(child);
    child.traverse((node) => {
      const m = node as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          const std = mat as THREE.MeshStandardMaterial;
          const safeDispose = (tex: THREE.Texture | null | undefined) => {
            if (tex && !tex.userData?.sharedTexture) tex.dispose();
          };
          safeDispose(std.map);
          safeDispose(std.normalMap);
          safeDispose(std.bumpMap);
          safeDispose(std.roughnessMap);
          safeDispose(std.metalnessMap);
          safeDispose(std.emissiveMap);
          mat.dispose();
        }
      }
    });
  }
}

/**
 * Streams an official NASA .glb model into `container`, auto-normalizes scale/centering,
 * upgrades untextured CAD parts with procedural PBR micro-detail (Kapton MLI crinkle bump,
 * triple-junction solar cell wafers, parabolic dish weave, spacecraft panel rivets),
 * and disposes placeholder geometry cleanly.
 */
function hydrateWithNasaGlb(container: THREE.Group, spec: NasaGlbSpec): void {
  sharedGltfLoader.load(
    spec.url,
    (gltf) => {
      if (container.userData.disposed) {
        disposeChildrenCleanly(gltf.scene);
        return;
      }

      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z, 1e-4);
      const scale = spec.targetSize / maxDim;

      model.position.sub(center);
      const normalizedWrapper = new THREE.Group();
      normalizedWrapper.scale.setScalar(scale);
      normalizedWrapper.add(model);

      const kaptonMaps = getGoldKaptonMaps();
      const solarMaps = getSolarArrayMaps(spec.tintPalette?.solarVariant ?? "blue-gaas");
      const dishMaps = getParabolicDishMaps();
      const hullMaps = getSpacecraftHullMaps();

      let meshIndex = 0;
      model.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        meshIndex++;
        const meshName = (mesh.name || "").toLowerCase();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const hasUV = Boolean(mesh.geometry?.attributes?.uv);

        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const matName = (mat.name || "").toLowerCase();
            const hint = `${meshName} ${matName}`;
            mat.envMapIntensity = 1.95;

            if (!mat.map) {
              const isGoldHue =
                mat.color.r > 0.55 && mat.color.g > 0.35 && mat.color.b < 0.28;
              const isBlueSolarHue =
                mat.color.b > 0.35 && mat.color.b > mat.color.r * 1.45;
              const isDarkUnlit =
                mat.color.r < 0.22 && mat.color.g < 0.22 && mat.color.b < 0.22;

              if (
                hint.includes("solar") ||
                hint.includes("wing") ||
                hint.includes("array") ||
                hint.includes("panel") ||
                hint.includes("cell") ||
                isBlueSolarHue
              ) {
                if (hasUV) {
                  mat.map = solarMaps.map;
                  mat.bumpMap = solarMaps.bumpMap;
                  mat.bumpScale = 0.015;
                }
                mat.color.setHex(0xcfe8ff);
                mat.metalness = 0.55;
                mat.roughness = 0.24;
                mat.emissive.setHex(spec.tintPalette?.solarHex ?? 0x1d4ed8);
                mat.emissiveIntensity = 0.16;
              } else if (
                hint.includes("dish") ||
                hint.includes("reflector") ||
                hint.includes("antenna") ||
                hint.includes("umbrella")
              ) {
                if (hasUV) {
                  mat.map = dishMaps.map;
                  mat.bumpMap = dishMaps.bumpMap;
                  mat.bumpScale = 0.02;
                }
                mat.color.setHex(0xfef3c7);
                mat.metalness = 0.68;
                mat.roughness = 0.3;
              } else if (
                hint.includes("gold") ||
                hint.includes("foil") ||
                hint.includes("mli") ||
                hint.includes("kapton") ||
                hint.includes("blanket") ||
                isGoldHue
              ) {
                if (hasUV) {
                  mat.map = kaptonMaps.map;
                  mat.bumpMap = kaptonMaps.bumpMap;
                  mat.bumpScale = 0.035;
                  mat.roughnessMap = kaptonMaps.roughnessMap ?? null;
                }
                mat.color.setHex(0xfbbf24);
                mat.metalness = 0.68;
                mat.roughness = 0.3;
                mat.emissive.setHex(0x451a03);
                mat.emissiveIntensity = 0.12;
              } else if (
                hint.includes("rad") ||
                hint.includes("white") ||
                hint.includes("hull") ||
                hint.includes("body") ||
                hint.includes("bus")
              ) {
                if (hasUV) {
                  mat.map = hullMaps.map;
                  mat.bumpMap = hullMaps.bumpMap;
                  mat.bumpScale = 0.012;
                }
                mat.color.setHex(0xf1f5f9);
                mat.metalness = 0.35;
                mat.roughness = 0.36;
              } else if (isDarkUnlit && spec.tintPalette) {
                // Prevent dark untextured NASA CAD sub-parts from vanishing in vacuum!
                const useGold = meshIndex % 3 === 0;
                if (hasUV) {
                  mat.map = useGold ? kaptonMaps.map : hullMaps.map;
                  mat.bumpMap = useGold ? kaptonMaps.bumpMap : hullMaps.bumpMap;
                  mat.bumpScale = useGold ? 0.03 : 0.012;
                }
                mat.color.setHex(useGold ? 0xf59e0b : spec.tintPalette.accentHex);
                mat.metalness = 0.58;
                mat.roughness = 0.34;
                mat.emissive.setHex(useGold ? 0x3b1704 : 0x0f172a);
                mat.emissiveIntensity = 0.1;
              } else {
                mat.metalness = Math.min(0.68, Math.max(0.32, mat.metalness));
                mat.roughness = Math.max(0.24, Math.min(0.48, mat.roughness));
              }
            } else {
              // Textured official NASA models (like ISS / Aqua / Sentinel) — brighten metallic specular slightly
              mat.metalness = Math.min(0.68, mat.metalness);
              mat.roughness = Math.max(0.22, mat.roughness);
              mat.envMapIntensity = 2.0;
            }
            mat.needsUpdate = true;
          }
        }
      });

      disposeChildrenCleanly(container);
      container.add(normalizedWrapper);
      container.userData.glbLoaded = true;
    },
    undefined,
    () => {
      // Keep crisp high-detail archetype PBR seed seamlessly
    }
  );
}

/**
 * Shared reusable material factory backed by high-res PBRTextureFactory maps.
 */
function buildAerospaceMaterials(solarVariant: "blue-gaas" | "iss-amber" | "cyan-starlink" = "blue-gaas") {
  const kapton = getGoldKaptonMaps();
  const solar = getSolarArrayMaps(solarVariant);
  const dish = getParabolicDishMaps();
  const hull = getSpacecraftHullMaps();

  const goldMli = new THREE.MeshStandardMaterial({
    map: kapton.map,
    bumpMap: kapton.bumpMap,
    bumpScale: 0.032,
    roughnessMap: kapton.roughnessMap,
    color: 0xfcd34d,
    emissive: 0x451a03,
    emissiveIntensity: 0.14,
    metalness: 0.66,
    roughness: 0.32,
  });

  const whiteHull = new THREE.MeshStandardMaterial({
    map: hull.map,
    bumpMap: hull.bumpMap,
    bumpScale: 0.015,
    color: 0xf1f5f9,
    metalness: 0.38,
    roughness: 0.34,
  });

  const titanium = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.78,
    roughness: 0.26,
  });

  const darkCarbon = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.62,
    roughness: 0.38,
  });

  const dishMesh = new THREE.MeshStandardMaterial({
    map: dish.map,
    bumpMap: dish.bumpMap,
    bumpScale: 0.022,
    color: 0xfef3c7,
    metalness: 0.65,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  const solarPanel = new THREE.MeshStandardMaterial({
    map: solar.map,
    bumpMap: solar.bumpMap,
    bumpScale: 0.012,
    color: 0xdbeafe,
    emissive: solarVariant === "iss-amber" ? 0x451a03 : 0x0c2d5c,
    emissiveIntensity: 0.24,
    metalness: 0.56,
    roughness: 0.22,
    side: THREE.DoubleSide,
  });

  const opticalLens = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.25,
    metalness: 0.92,
    roughness: 0.08,
  });

  return { goldMli, whiteHull, titanium, darkCarbon, dishMesh, solarPanel, opticalLens };
}

/**
 * Helper: Builds a museum-grade articulated parabolic antenna dish with rear backing hub,
 * tripod feed-horn struts, and wave-guide receiver cone!
 */
function createDetailedParabolicDish(
  radius: number,
  dishMat: THREE.Material,
  strutMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // Concave woven parabolic dish reflector
  const dishGeo = new THREE.SphereGeometry(radius, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.36);
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.y = -radius * 0.72;
  g.add(dish);

  // Structural rim ring around dish edge
  const rimRadius = radius * Math.sin(Math.PI * 0.36);
  const rimY = radius * Math.cos(Math.PI * 0.36) - radius * 0.72;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, radius * 0.032, 8, 28), strutMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = rimY;
  g.add(rim);

  // Feed-horn focal receiver suspended on 3 tripod struts
  const feedY = rimY + radius * 0.42;
  const feedHorn = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.11, radius * 0.07, radius * 0.18, 12),
    strutMat
  );
  feedHorn.position.y = feedY;
  g.add(feedHorn);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const bx = Math.cos(a) * rimRadius * 0.85;
    const bz = Math.sin(a) * rimRadius * 0.85;
    const start = new THREE.Vector3(bx, rimY, bz);
    const end = new THREE.Vector3(0, feedY, 0);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.018, radius * 0.018, len, 6),
      strutMat
    );
    strut.position.copy(start).add(end).multiplyScalar(0.5);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    g.add(strut);
  }

  return g;
}

export function createISSProceduralFallback(): THREE.Group {
  const root = new THREE.Group();
  const m = buildAerospaceMaterials("iss-amber");

  const truss = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.044, 0.054), m.titanium);
  root.add(truss);

  for (const x of [-0.52, -0.38, 0.38, 0.52]) {
    for (const sign of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.006, 0.4), m.solarPanel);
      panel.position.set(x, 0, sign * 0.24);
      root.add(panel);
    }
  }
  for (const x of [-0.16, 0.16]) {
    const rad = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.22), m.whiteHull);
    rad.position.set(x, -0.022, -0.15);
    root.add(rad);
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.58, 20), m.whiteHull);
  spine.rotation.x = Math.PI / 2;
  root.add(spine);

  root.scale.setScalar(0.64);
  return root;
}

export function createTiangongModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = "tiangong-lod-model";
  const m = buildAerospaceMaterials("blue-gaas");

  // Tianhe Core Module with machined ribs & gold docking adapter collar
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.062, 0.5, 24), m.whiteHull);
  core.rotation.x = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 16), m.titanium);
  hub.position.set(0, 0, 0.19);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.028, 20), m.goldMli);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0, -0.08);
  const aftRing = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.008, 8, 20), m.darkCarbon);
  aftRing.position.set(0, 0, -0.23);
  root.add(core, hub, collar, aftRing);

  // Wentian + Mengtian T-Cross Lab Modules with end airlocks & radiator bands
  const tBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.66, 24), m.whiteHull);
  tBar.rotation.z = Math.PI / 2;
  tBar.position.set(0, 0, 0.19);
  root.add(tBar);

  for (const sign of [-1, 1]) {
    const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.05, 18), m.titanium);
    endCap.rotation.z = sign * (Math.PI / 2);
    endCap.position.set(sign * 0.355, 0, 0.19);
    root.add(endCap);

    // Dual massive flexible triple-junction solar wings on rotary gimbals
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.58), m.titanium);
    mast.position.set(sign * 0.375, 0, 0.19);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.006, 0.54), m.solarPanel);
    wing.position.set(sign * 0.375, 0, 0.19);
    root.add(wing, mast);
  }

  // Tianhe aft solar wings
  for (const sign of [-1, 1]) {
    const aftWing = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.006, 0.095), m.solarPanel);
    aftWing.position.set(sign * 0.19, 0, -0.15);
    root.add(aftWing);
  }

  // Docked Shenzhou Crew Spacecraft (with orbital module, capsule & twin mini solar wings!)
  const shenzhou = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.18, 18), m.whiteHull);
  shenzhou.position.set(0, -0.135, 0.19);
  const szWing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.042), m.solarPanel);
  szWing.position.set(0, -0.17, 0.19);
  root.add(shenzhou, szWing);

  // Docked Tianzhou Cargo Freighter + Chinarm Robotic Arm
  const tianzhou = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.2, 18), m.darkCarbon);
  tianzhou.rotation.x = Math.PI / 2;
  tianzhou.position.set(0, 0, -0.35);
  const tzFoil = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.06, 18), m.goldMli);
  tzFoil.rotation.x = Math.PI / 2;
  tzFoil.position.set(0, 0, -0.31);
  const roboArm = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.24, 8), m.whiteHull);
  roboArm.position.set(0.06, 0.08, 0.02);
  roboArm.rotation.z = -0.5;
  root.add(tianzhou, tzFoil, roboArm);

  root.scale.setScalar(0.68);
  return root;
}

export function createStarlinkModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = "starlink-lod-model";
  const m = buildAerospaceMaterials("cyan-starlink");

  // Flat-pack carbon/titanium avionics chassis + white Ku/Ka phased-array antenna deck
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.024, 0.36), m.darkCarbon);
  const phasedArray = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.3), m.whiteHull);
  phasedArray.position.set(0, -0.016, 0);
  const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.246, 0.012, 0.06), m.goldMli);
  goldTrim.position.set(0, 0.002, -0.12);
  root.add(bus, phasedArray, goldTrim);

  // Signature tall vertical single-wing solar sail + structural hinge bar
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8), m.titanium);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.set(0, 0.022, 0);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.48, 0.22), m.solarPanel);
  fin.position.set(0, 0.26, 0);
  root.add(hinge, fin);

  // Optical Space Laser Inter-Satellite Links (gimbals + glowing turquoise aperture)
  for (const sign of [-1, 1]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.032, 12), m.titanium);
    turret.position.set(sign * 0.08, 0.024, 0.12);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), m.opticalLens);
    lens.position.set(sign * 0.08, 0.04, 0.12);
    root.add(turret, lens);
  }

  // Dual Argon Hall-Effect Ion Thrusters + glowing electric cyan plasma plumes!
  const ionMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const sign of [-1, 1]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.022, 10), m.titanium);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(sign * 0.05, -0.008, -0.19);
    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.065, 12), ionMat);
    plume.rotation.x = -Math.PI / 2;
    plume.position.set(sign * 0.05, -0.008, -0.23);
    root.add(nozzle, plume);
  }

  root.scale.setScalar(0.62);
  return root;
}

export function createDebrisModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = "debris-lod-model";
  root.userData.isTumblingDebris = true;
  const m = buildAerospaceMaterials("blue-gaas");

  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.078, 0.25, 14, 1, true, 0, Math.PI * 1.45),
    m.darkCarbon
  );
  tank.rotation.z = 0.55;
  root.add(tank);

  const foil = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), m.goldMli);
  foil.position.set(0.055, 0.04, 0.045);
  foil.rotation.set(0.6, 0.8, 0.3);
  const shard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.008, 0.08), m.titanium);
  shard.position.set(-0.08, -0.02, 0);
  shard.rotation.set(0.2, 0.4, -0.5);
  const brokenPanel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.005, 0.09), m.solarPanel);
  brokenPanel.position.set(0.02, -0.06, -0.06);
  brokenPanel.rotation.set(0.5, -0.4, 0.7);
  root.add(foil, shard, brokenPanel);

  root.scale.setScalar(0.68);
  return root;
}

/**
 * High-Detail PBR MEO Navigation Spacecraft (GPS III / Galileo) Replica:
 * Crinkled gold Kapton MLI atomic-clock bus, white thermal louver radiators,
 * iconic 12-element Nadir L-Band Helical Phased-Array Navigation Panel,
 * laser retroreflector corner-cube array, S-band telemetry dish, star trackers,
 * apogee engine bell, and articulated dual multi-panel GaAs solar wings!
 */
export function createGnssModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = "gnss-meo-lod-model";
  const m = buildAerospaceMaterials("blue-gaas");

  // Main Gold Kapton MLI Atomic-Clock Bus + side thermal radiator louvers
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.24), m.goldMli);
  root.add(bus);

  for (const sign of [-1, 1]) {
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.012), m.whiteHull);
    radiator.position.set(0, 0.01, sign * 0.124);
    root.add(radiator);
  }

  // Iconic Nadir L-Band Helical Navigation Antenna Panel (12 gold/silver helices!)
  const navDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.132, 0.018, 24), m.whiteHull);
  navDeck.position.set(0, -0.118, 0);
  root.add(navDeck);

  // Outer ring of 8 helices + inner ring of 4 helices
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.072, 10), m.titanium);
    h.position.set(Math.cos(a) * 0.088, -0.156, Math.sin(a) * 0.088);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), m.goldMli);
    tip.position.set(Math.cos(a) * 0.088, -0.194, Math.sin(a) * 0.088);
    root.add(h, tip);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.078, 10), m.goldMli);
    h.position.set(Math.cos(a) * 0.038, -0.16, Math.sin(a) * 0.038);
    root.add(h);
  }

  // Laser Retroreflector Panel + Star Tracker Optical Baffles
  const retro = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.012, 0.055), m.opticalLens);
  retro.position.set(0.075, -0.112, 0.075);
  const tracker = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.045, 12), m.darkCarbon);
  tracker.position.set(-0.08, 0.13, 0.07);
  tracker.rotation.x = 0.45;
  root.add(retro, tracker);

  // Zenith Apogee Engine Nozzle & S-Band Omni Mast
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.075, 18, 1, true), m.darkCarbon);
  nozzle.position.set(0, 0.145, 0);
  const sBand = createDetailedParabolicDish(0.055, m.dishMesh, m.titanium);
  sBand.position.set(0.08, 0.125, -0.07);
  sBand.rotation.set(-0.4, 0, -0.35);
  root.add(nozzle, sBand);

  // Dual Articulated 3-Panel High-Efficiency GaAs Solar Wings with Rotary Yoke Drives
  for (const sign of [-1, 1]) {
    const drive = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12), m.titanium);
    drive.rotation.z = Math.PI / 2;
    drive.position.set(sign * 0.12, 0, 0);

    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.08), m.titanium);
    yoke.position.set(sign * 0.17, 0, 0);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.009, 0.185), m.solarPanel);
    wing.position.set(sign * 0.49, 0, 0);
    const frameBar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.014, 0.012), m.titanium);
    frameBar.position.set(sign * 0.49, 0, 0);
    root.add(drive, yoke, wing, frameBar);
  }

  root.scale.setScalar(0.9);
  return root;
}

/**
 * High-Detail PBR Geostationary (GOES-18 / GEO Communications) Fallback & Seed:
 * Shown instantaneously while Official NASA GOES / TDRS .glb streams in.
 */
export function createGeoModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = "geo-belt-lod-model";
  const m = buildAerospaceMaterials("blue-gaas");

  // Heavy Gold Kapton MLI GEO Spacecraft Bus + White Thermal Louver Radiators
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.28), m.goldMli);
  root.add(bus);
  for (const sign of [-1, 1]) {
    const rad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.014), m.whiteHull);
    rad.position.set(0, 0, sign * 0.145);
    root.add(rad);
  }

  // ABI Advanced Baseline Imager Telescope Barrel + Sunshade Baffle + Germanium Lens
  const abiHousing = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.12), m.whiteHull);
  abiHousing.position.set(0.02, -0.15, 0.05);
  const abiBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.05, 0.09, 20), m.titanium);
  abiBarrel.position.set(0.02, -0.21, 0.05);
  const abiLens = new THREE.Mesh(new THREE.CircleGeometry(0.04, 20), m.opticalLens);
  abiLens.rotation.x = Math.PI / 2;
  abiLens.position.set(0.02, -0.256, 0.05);
  root.add(abiHousing, abiBarrel, abiLens);

  // Twin Museum-Grade Ribbed Parabolic Dishes WITH Tripod Feed Horns & Struts
  for (const sign of [-1, 1]) {
    const dish = createDetailedParabolicDish(0.15, m.dishMesh, m.titanium);
    dish.position.set(0, -0.02, sign * 0.23);
    dish.rotation.x = sign > 0 ? Math.PI * 0.56 : -Math.PI * 0.56;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.12, 10), m.titanium);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, -0.02, sign * 0.17);
    root.add(dish, arm);
  }

  // Massive Twin High-Power Articulated GEO Solar Wings with Structural Spine & Drive Yoke
  for (const sign of [-1, 1]) {
    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 10), m.titanium);
    yoke.rotation.z = Math.PI / 2;
    yoke.position.set(sign * 0.17, 0.02, 0);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.009, 0.22), m.solarPanel);
    wing.position.set(sign * 0.56, 0.02, 0);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.014, 0.014), m.titanium);
    spine.position.set(sign * 0.56, 0.02, 0);
    root.add(yoke, wing, spine);
  }

  // Magnetometer Boom + Solar Radiation Trim Sail + Apogee Engine Nozzle
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.42, 8), m.titanium);
  boom.position.set(0, 0.34, 0);
  const magSensor = new THREE.Mesh(new THREE.OctahedronGeometry(0.024, 0), m.goldMli);
  magSensor.position.set(0, 0.55, 0);
  root.add(boom, magSensor);

  root.scale.setScalar(1.05);
  return root;
}

/**
 * Distinct archetype-specific PBR seed shown briefly while official NASA GLB streams in
 * (never a generic identical drum!).
 */
function createDistinctPbrSeed(archetype: SpacecraftArchetype): THREE.Group {
  if (archetype === "iss") return createISSProceduralFallback();
  if (archetype === "geo" || archetype === "tdrs" || archetype === "sdo") return createGeoModel();
  if (archetype === "van-allen") return createGnssModel();

  const root = new THREE.Group();
  const m = buildAerospaceMaterials("blue-gaas");

  if (archetype === "hubble") {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.082, 0.44, 24), m.titanium);
    tube.rotation.x = Math.PI / 2;
    const aft = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.102, 0.16, 24), m.whiteHull);
    aft.rotation.x = Math.PI / 2;
    aft.position.z = -0.2;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.14), m.titanium);
    door.position.set(0, 0.09, 0.24);
    door.rotation.x = -0.6;
    for (const sign of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.007, 0.115), m.solarPanel);
      wing.position.set(sign * 0.24, 0, -0.02);
      root.add(wing);
    }
    root.add(tube, aft, door);
    return root;
  }

  if (archetype === "landsat" || archetype === "weather") {
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.23, 6), m.goldMli);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.007, 0.14), m.solarPanel);
    wing.position.set(0.25, 0, 0);
    const baffle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.09, 14), m.whiteHull);
    baffle.position.set(0, -0.14, 0);
    root.add(bus, wing, baffle);
    return root;
  }

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), m.whiteHull);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 8), m.goldMli);
  base.position.y = -0.12;
  for (const sign of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.007, 0.125), m.solarPanel);
    wing.position.set(sign * 0.24, -0.08, 0);
    root.add(wing);
  }
  root.add(head, base);
  return root;
}

export function createSpacecraftByArchetype(archetype: SpacecraftArchetype): THREE.Group {
  const spec = NASA_GLB_SPECS[archetype];
  if (spec) {
    const container = new THREE.Group();
    container.name = `nasa-glb-${archetype}`;
    container.userData.archetype = archetype;
    container.add(createDistinctPbrSeed(archetype));
    hydrateWithNasaGlb(container, spec);
    return container;
  }

  if (archetype === "tiangong") return createTiangongModel();
  if (archetype === "gnss") return createGnssModel();
  if (archetype === "debris") return createDebrisModel();
  return createStarlinkModel();
}

export function createSpacecraftByFlagship(flagshipId?: string): THREE.Group {
  const arch: SpacecraftArchetype =
    flagshipId === "iss" || flagshipId === "hubble" || flagshipId === "tiangong" || flagshipId === "starlink"
      ? flagshipId
      : "science-generic";
  return createSpacecraftByArchetype(arch);
}
