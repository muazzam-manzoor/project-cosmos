import * as THREE from "three";

export interface EarthTextureBundle {
  dayMap: THREE.Texture;
  nightMap: THREE.Texture;
  normalMap: THREE.Texture;
  specularMap: THREE.Texture;
  cloudMap: THREE.Texture;
}

// Simplified continental polygons [lon, lat][] for instant frame-0 zero-flicker seed
const CONTINENTS: Array<{
  color: string;
  ice?: boolean;
  coords: Array<[number, number]>;
}> = [
  {
    color: "#2d5a3c",
    coords: [
      [-168, 66], [-140, 70], [-95, 70], [-78, 62], [-60, 48], [-70, 42],
      [-80, 26], [-88, 21], [-97, 26], [-105, 20], [-117, 32], [-125, 48], [-152, 60],
    ],
  },
  {
    color: "#cbd5e1",
    ice: true,
    coords: [[-52, 60], [-42, 60], [-20, 72], [-22, 82], [-58, 81], [-62, 68]],
  },
  {
    color: "#2b5f38",
    coords: [
      [-79, 9], [-62, 10], [-35, -6], [-40, -22], [-58, -38], [-68, -54],
      [-75, -45], [-71, -18], [-81, -4],
    ],
  },
  {
    color: "#366343",
    coords: [
      [-9, 37], [3, 43], [15, 40], [28, 41], [40, 46], [58, 66], [28, 70],
      [10, 63], [-4, 58], [-10, 52],
    ],
  },
  {
    color: "#7c6c42",
    coords: [
      [-17, 15], [-6, 35], [11, 37], [32, 31], [43, 12], [51, 11], [40, -10],
      [33, -26], [20, -35], [12, -16], [9, 4], [-10, 5],
    ],
  },
  {
    color: "#436345",
    coords: [
      [28, 41], [40, 46], [58, 66], [105, 74], [170, 66], [142, 46], [128, 35],
      [120, 23], [106, 10], [98, 16], [88, 22], [78, 8], [67, 24], [56, 26],
      [48, 30], [35, 31],
    ],
  },
  {
    color: "#8f5e3b",
    coords: [
      [114, -22], [130, -12], [143, -11], [153, -27], [149, -37], [136, -35],
      [115, -34],
    ],
  },
  {
    color: "#dbeafe",
    ice: true,
    coords: [
      [-180, -70], [-120, -73], [-60, -64], [0, -70], [60, -67], [120, -66],
      [180, -70], [180, -90], [-180, -90],
    ],
  },
];

function lonToX(lon: number, w: number): number {
  return ((lon + 180) / 360) * w;
}
function latToY(lat: number, h: number): number {
  return ((90 - lat) / 180) * h;
}

/**
 * Generates instant frame-0 Earth textures (replaced within ~50ms by our locally staged
 * high-resolution 2048px NASA Blue Marble, Black Marble, Normal Relief, Specular, & Cloud maps).
 */
export function createProceduralEarthTextures(): EarthTextureBundle {
  const W = 512;
  const H = 256;

  // 1. Seed Day Texture
  const dayCanvas = document.createElement("canvas");
  dayCanvas.width = W;
  dayCanvas.height = H;
  const dCtx = dayCanvas.getContext("2d")!;
  dCtx.fillStyle = "#0a2a52";
  dCtx.fillRect(0, 0, W, H);
  for (const cont of CONTINENTS) {
    dCtx.beginPath();
    cont.coords.forEach(([lon, lat], idx) => {
      const x = lonToX(lon, W);
      const y = latToY(lat, H);
      if (idx === 0) dCtx.moveTo(x, y);
      else dCtx.lineTo(x, y);
    });
    dCtx.closePath();
    dCtx.fillStyle = cont.color;
    dCtx.fill();
  }
  const dayMap = new THREE.CanvasTexture(dayCanvas);
  dayMap.colorSpace = THREE.SRGBColorSpace;

  // 2. Seed Night Lights Texture
  const nightCanvas = document.createElement("canvas");
  nightCanvas.width = 64;
  nightCanvas.height = 32;
  const nCtx = nightCanvas.getContext("2d")!;
  nCtx.fillStyle = "#000000";
  nCtx.fillRect(0, 0, 64, 32);
  const nightMap = new THREE.CanvasTexture(nightCanvas);
  nightMap.colorSpace = THREE.SRGBColorSpace;

  // 3. Flat Neutral Normal Map Seed (128, 128, 255)
  const normCanvas = document.createElement("canvas");
  normCanvas.width = 8;
  normCanvas.height = 8;
  const nmCtx = normCanvas.getContext("2d")!;
  nmCtx.fillStyle = "rgb(128, 128, 255)";
  nmCtx.fillRect(0, 0, 8, 8);
  const normalMap = new THREE.CanvasTexture(normCanvas);

  // 4. Neutral Ocean Specular Mask Seed
  const specCanvas = document.createElement("canvas");
  specCanvas.width = 8;
  specCanvas.height = 8;
  const spCtx = specCanvas.getContext("2d")!;
  spCtx.fillStyle = "#555555";
  spCtx.fillRect(0, 0, 8, 8);
  const specularMap = new THREE.CanvasTexture(specCanvas);

  // 5. Transparent Cloud Seed
  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 8;
  cloudCanvas.height = 8;
  const cCtx = cloudCanvas.getContext("2d")!;
  cCtx.clearRect(0, 0, 8, 8);
  const cloudMap = new THREE.CanvasTexture(cloudCanvas);
  cloudMap.wrapS = THREE.RepeatWrapping;

  return { dayMap, nightMap, normalMap, specularMap, cloudMap };
}

/**
 * Loads our locally staged 2048px NASA Blue Marble, Black Marble Night Lights,
 * Topographic Relief Normal Map, Ocean Specular Mask, and Real Global Cloud Layer
 * from /textures/ (instant local HTTP load, 100% offline-proof!).
 */
export function loadLocalHighResEarthTextures(
  onUpgrade: (maps: Partial<EarthTextureBundle>) => void
): void {
  const loader = new THREE.TextureLoader();

  const sources: Array<{
    key: keyof EarthTextureBundle;
    url: string;
    srgb: boolean;
    repeatX?: boolean;
  }> = [
    { key: "dayMap", url: "/textures/earth_atmos_2048.jpg", srgb: true },
    { key: "nightMap", url: "/textures/earth_lights_2048.png", srgb: true },
    { key: "normalMap", url: "/textures/earth_normal_2048.jpg", srgb: false },
    { key: "specularMap", url: "/textures/earth_specular_2048.jpg", srgb: false },
    { key: "cloudMap", url: "/textures/earth_clouds_1024.png", srgb: false, repeatX: true },
  ];

  for (const src of sources) {
    loader.load(
      src.url,
      (tex) => {
        if (src.srgb) tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        if (src.repeatX) tex.wrapS = THREE.RepeatWrapping;
        onUpgrade({ [src.key]: tex });
      },
      undefined,
      () => {
        // Keep seed texture safely if missing
      }
    );
  }
}

/**
 * Generates a photorealistic optical solar corona flare sprite for the live Sun in space.
 */
export function createSunCoronaTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.12, "rgba(255, 250, 230, 0.95)");
  grad.addColorStop(0.28, "rgba(255, 214, 130, 0.45)");
  grad.addColorStop(0.55, "rgba(255, 160, 75, 0.12)");
  grad.addColorStop(1.0, "rgba(255, 120, 40, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle diffraction lens spikes
  ctx.save();
  ctx.translate(half, half);
  ctx.strokeStyle = "rgba(255, 245, 210, 0.28)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-half * 0.85, 0);
    ctx.lineTo(half * 0.85, 0);
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
