import * as THREE from "three";

export interface PBRMaterialMaps {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
}

const textureCache = new Map<string, PBRMaterialMaps>();

function markShared(tex: THREE.CanvasTexture, srgb: boolean, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  tex.userData.sharedTexture = true;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Deterministic pseudo-random generator for reproducible aerospace material micro-detail.
 */
function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 1. Crinkled Gold Kapton MLI (Multi-Layer Insulation) Foil — Albedo + Crinkle Bump + Roughness
 * Replicates authentic faceted thermal blankets used on Hubble, Landsat, GPS III, GOES & TDRS.
 */
export function getGoldKaptonMaps(): PBRMaterialMaps {
  const cached = textureCache.get("kapton-gold");
  if (cached) return cached;

  const size = 512;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = size;
  colCanvas.height = size;
  const colCtx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext("2d")!;

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext("2d")!;

  // Warm gold-amber MLI base
  colCtx.fillStyle = "#c98512";
  colCtx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = "#808080";
  bumpCtx.fillRect(0, 0, size, size);
  roughCtx.fillStyle = "#484848";
  roughCtx.fillRect(0, 0, size, size);

  const rand = seededRand(4207);

  // Layer 1: Broad quilted thermal blanket pillows
  for (let i = 0; i < 650; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 14 + rand() * 34;
    const a1 = rand() * Math.PI * 2;
    const a2 = a1 + 1.4 + rand() * 1.2;
    const a3 = a2 + 1.4 + rand() * 1.2;

    const p1x = x + Math.cos(a1) * r;
    const p1y = y + Math.sin(a1) * r;
    const p2x = x + Math.cos(a2) * r;
    const p2y = y + Math.sin(a2) * r;
    const p3x = x + Math.cos(a3) * r;
    const p3y = y + Math.sin(a3) * r;

    const facetLum = rand();
    const goldPalette = [
      "#fde047",
      "#fbbf24",
      "#f59e0b",
      "#d97706",
      "#b45309",
      "#eab308",
    ];
    colCtx.fillStyle = goldPalette[Math.floor(facetLum * goldPalette.length)];
    colCtx.globalAlpha = 0.72;
    colCtx.beginPath();
    colCtx.moveTo(p1x, p1y);
    colCtx.lineTo(p2x, p2y);
    colCtx.lineTo(p3x, p3y);
    colCtx.closePath();
    colCtx.fill();

    // Matching crinkle elevation in bump map
    const bVal = Math.floor(45 + facetLum * 200);
    bumpCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    bumpCtx.globalAlpha = 0.78;
    bumpCtx.beginPath();
    bumpCtx.moveTo(p1x, p1y);
    bumpCtx.lineTo(p2x, p2y);
    bumpCtx.lineTo(p3x, p3y);
    bumpCtx.closePath();
    bumpCtx.fill();

    // Subtle specular roughness variation per crinkle
    const rVal = Math.floor(42 + (1 - facetLum) * 95);
    roughCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
    roughCtx.globalAlpha = 0.65;
    roughCtx.beginPath();
    roughCtx.moveTo(p1x, p1y);
    roughCtx.lineTo(p2x, p2y);
    roughCtx.lineTo(p3x, p3y);
    roughCtx.closePath();
    roughCtx.fill();
  }

  // Layer 2: Crisp sharp crease ridges & Kapton tape seam lines
  colCtx.globalAlpha = 0.55;
  bumpCtx.globalAlpha = 0.9;
  for (let i = 0; i < 220; i++) {
    const x1 = rand() * size;
    const y1 = rand() * size;
    const len = 12 + rand() * 38;
    const ang = rand() * Math.PI * 2;
    const x2 = x1 + Math.cos(ang) * len;
    const y2 = y1 + Math.sin(ang) * len;

    colCtx.strokeStyle = rand() > 0.5 ? "#fef08a" : "#78350f";
    colCtx.lineWidth = 1.1;
    colCtx.beginPath();
    colCtx.moveTo(x1, y1);
    colCtx.lineTo(x2, y2);
    colCtx.stroke();

    bumpCtx.strokeStyle = rand() > 0.5 ? "#ffffff" : "#222222";
    bumpCtx.lineWidth = 1.4;
    bumpCtx.beginPath();
    bumpCtx.moveTo(x1, y1);
    bumpCtx.lineTo(x2, y2);
    bumpCtx.stroke();
  }

  // Subtle stitched Kapton seam grid
  colCtx.globalAlpha = 0.35;
  colCtx.strokeStyle = "#713f12";
  colCtx.lineWidth = 2;
  for (let p = 128; p < size; p += 128) {
    colCtx.beginPath();
    colCtx.moveTo(p, 0);
    colCtx.lineTo(p, size);
    colCtx.stroke();
    colCtx.beginPath();
    colCtx.moveTo(0, p);
    colCtx.lineTo(size, p);
    colCtx.stroke();
  }

  const maps: PBRMaterialMaps = {
    map: markShared(new THREE.CanvasTexture(colCanvas), true, 1, 1),
    bumpMap: markShared(new THREE.CanvasTexture(bumpCanvas), false, 1, 1),
    roughnessMap: markShared(new THREE.CanvasTexture(roughCanvas), false, 1, 1),
  };
  textureCache.set("kapton-gold", maps);
  return maps;
}

/**
 * 2. Triple-Junction GaAs Photovoltaic Solar Cell Array — Albedo + Cell Grid Bump + Specular Roughness
 */
export function getSolarArrayMaps(
  variant: "blue-gaas" | "iss-amber" | "cyan-starlink"
): PBRMaterialMaps {
  const key = `solar-${variant}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const w = 512;
  const h = 512;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = w;
  colCanvas.height = h;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext("2d")!;

  const palette =
    variant === "iss-amber"
      ? { bg: "#2b1204", cellA: "#9a4a10", cellB: "#b85c18", trace: "#f59e0b", frame: "#94a3b8" }
      : variant === "cyan-starlink"
      ? { bg: "#041226", cellA: "#0b3b6e", cellB: "#0f4e8c", trace: "#7dd3fc", frame: "#cbd5e1" }
      : { bg: "#071330", cellA: "#102e70", cellB: "#183f94", trace: "#93c5fd", frame: "#e2e8f0" };

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = "#404040";
  bCtx.fillRect(0, 0, w, h);

  const cols = 8;
  const rows = 16;
  const cw = w / cols;
  const ch = h / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw + 2.5;
      const y = r * ch + 2;
      const cellW = cw - 5;
      const cellH = ch - 4;

      // Subtle wafer-to-wafer iridescence
      const grad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
      grad.addColorStop(0, (r + c) % 2 === 0 ? palette.cellA : palette.cellB);
      grad.addColorStop(1, (r + c) % 2 === 0 ? palette.cellB : palette.cellA);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, cellW, cellH);

      // Chamfered corner silver interconnect dots (signature triple-junction solar cells!)
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(x, y, 4, 3);
      ctx.fillRect(x + cellW - 4, y + cellH - 3, 4, 3);

      // Fine silver collector grid fingers inside each photovoltaic cell
      ctx.strokeStyle = palette.trace;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 0.7;
      for (let fy = y + 6; fy < y + cellH - 2; fy += 6) {
        ctx.beginPath();
        ctx.moveTo(x + 1, fy);
        ctx.lineTo(x + cellW - 1, fy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Raised glass cover on bump map
      bCtx.fillStyle = "#d8d8d8";
      bCtx.fillRect(x, y, cellW, cellH);
    }
  }

  // Structural aluminum fold hinges every 4 rows & central silver busbar
  ctx.fillStyle = palette.frame;
  bCtx.fillStyle = "#ffffff";
  for (let r = 0; r <= rows; r += 4) {
    const y = r * ch - 2;
    ctx.fillRect(0, y, w, 4);
    bCtx.fillRect(0, y, w, 4);
  }
  ctx.fillRect(w / 2 - 2.5, 0, 5, h);
  bCtx.fillRect(w / 2 - 2.5, 0, 5, h);

  // Outer perimeter aluminum panel frame
  ctx.strokeStyle = palette.frame;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  const maps: PBRMaterialMaps = {
    map: markShared(new THREE.CanvasTexture(colCanvas), true, 1, 1),
    bumpMap: markShared(new THREE.CanvasTexture(bumpCanvas), false, 1, 1),
  };
  textureCache.set(key, maps);
  return maps;
}

/**
 * 3. Parabolic RF Mesh & Radial Rib Reflector — Gold/Titanium woven RF antenna dish texture
 */
export function getParabolicDishMaps(): PBRMaterialMaps {
  const cached = textureCache.get("parabolic-dish");
  if (cached) return cached;

  const size = 512;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = size;
  colCanvas.height = size;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;

  // Metallic gold-champagne woven reflector base
  const radGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, size / 2);
  radGrad.addColorStop(0, "#fef3c7");
  radGrad.addColorStop(0.45, "#e2c07a");
  radGrad.addColorStop(0.85, "#b78d40");
  radGrad.addColorStop(1, "#7c581c");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  // Fine woven RF gold-molybdenum mesh crosshatch
  ctx.strokeStyle = "rgba(120, 75, 16, 0.22)";
  ctx.lineWidth = 1;
  bCtx.strokeStyle = "#a8a8a8";
  bCtx.lineWidth = 1;
  for (let p = 0; p < size; p += 6) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(p, 0);
    bCtx.lineTo(p, size);
    bCtx.stroke();
  }

  // Concentric structural rings + 16 radial titanium umbrella ribs
  ctx.strokeStyle = "rgba(255, 248, 220, 0.65)";
  ctx.lineWidth = 2.5;
  bCtx.strokeStyle = "#ffffff";
  bCtx.lineWidth = 3;
  for (let r = 48; r < size / 2; r += 48) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    bCtx.beginPath();
    bCtx.arc(cx, cy, r, 0, Math.PI * 2);
    bCtx.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * size * 0.5, cy + Math.sin(a) * size * 0.5);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(cx, cy);
    bCtx.lineTo(cx + Math.cos(a) * size * 0.5, cy + Math.sin(a) * size * 0.5);
    bCtx.stroke();
  }

  const maps: PBRMaterialMaps = {
    map: markShared(new THREE.CanvasTexture(colCanvas), true, 1, 1),
    bumpMap: markShared(new THREE.CanvasTexture(bumpCanvas), false, 1, 1),
  };
  textureCache.set("parabolic-dish", maps);
  return maps;
}

/**
 * 4. Spacecraft White Beta-Cloth, Panel Seams & Thermal Radiator Louvers
 */
export function getSpacecraftHullMaps(): PBRMaterialMaps {
  const cached = textureCache.get("spacecraft-hull");
  if (cached) return cached;

  const size = 512;
  const colCanvas = document.createElement("canvas");
  colCanvas.width = size;
  colCanvas.height = size;
  const ctx = colCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#909090";
  bCtx.fillRect(0, 0, size, size);

  // Machined aerospace panel plates + subtle tonal variation
  const rand = seededRand(8801);
  const tiles = 4;
  const tw = size / tiles;
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const shade = 216 + Math.floor(rand() * 26);
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 9})`;
      ctx.fillRect(x * tw + 3, y * tw + 3, tw - 6, tw - 6);

      // Panel rivets along edges
      ctx.fillStyle = "#64748b";
      bCtx.fillStyle = "#d8d8d8";
      for (let r = 14; r < tw - 10; r += 20) {
        ctx.fillRect(x * tw + r, y * tw + 7, 2.5, 2.5);
        ctx.fillRect(x * tw + r, (y + 1) * tw - 9.5, 2.5, 2.5);
        bCtx.fillRect(x * tw + r, y * tw + 7, 3, 3);
      }
    }
  }

  // Recessed panel seam lines
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 2.5;
  bCtx.strokeStyle = "#303030";
  bCtx.lineWidth = 3.5;
  for (let i = 0; i <= tiles; i++) {
    const p = i * tw;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(p, 0);
    bCtx.lineTo(p, size);
    bCtx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(0, p);
    bCtx.lineTo(size, p);
    bCtx.stroke();
  }

  // Thermal louver slats in two quadrants
  for (let sy = 20; sy < 110; sy += 9) {
    ctx.fillStyle = "#475569";
    ctx.fillRect(148, sy, 92, 4);
    bCtx.fillStyle = "#202020";
    bCtx.fillRect(148, sy, 92, 4);
  }

  const maps: PBRMaterialMaps = {
    map: markShared(new THREE.CanvasTexture(colCanvas), true, 1, 1),
    bumpMap: markShared(new THREE.CanvasTexture(bumpCanvas), false, 1, 1),
  };
  textureCache.set("spacecraft-hull", maps);
  return maps;
}

let cachedMilkyWayTex: THREE.CanvasTexture | null = null;

/**
 * 5. Pre-Baked Equirectangular Deep-Space Milky Way Galactic Sky-Dome Texture (1024x512).
 * Generated ONCE at startup (~12ms) and sampled with a single GPU texture lookup so
 * the full-screen cosmic backdrop renders at a locked 60 FPS even on integrated/software GPUs!
 */
export function getMilkyWaySkyTexture(): THREE.CanvasTexture {
  if (cachedMilkyWayTex) return cachedMilkyWayTex;

  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Deep cosmic space background
  ctx.fillStyle = "#02050d";
  ctx.fillRect(0, 0, w, h);

  const rand = seededRand(90210);

  // Soft tilted Milky Way galactic band (sinusoidal sweep across equirectangular projection)
  const galacticY = (x: number) =>
    h * 0.5 + Math.sin((x / w) * Math.PI * 2 + 0.6) * h * 0.24;

  // Layer 1: Broad galactic indigo-blue star-cloud glow
  for (let i = 0; i < 160; i++) {
    const x = rand() * w;
    const cy = galacticY(x) + (rand() - 0.5) * 86;
    const rad = 36 + rand() * 78;
    const isCore = Math.abs(x - w * 0.52) < w * 0.16;
    const g = ctx.createRadialGradient(x, cy, 0, x, cy, rad);
    if (isCore) {
      g.addColorStop(0, "rgba(186, 152, 114, 0.13)");
      g.addColorStop(0.45, "rgba(74, 102, 168, 0.08)");
      g.addColorStop(1, "rgba(2, 5, 13, 0)");
    } else {
      g.addColorStop(0, "rgba(96, 138, 212, 0.095)");
      g.addColorStop(0.5, "rgba(52, 68, 138, 0.045)");
      g.addColorStop(1, "rgba(2, 5, 13, 0)");
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 2: Subtle faint violet/rose emission nebula pockets (Orion / Carina style)
  for (let i = 0; i < 26; i++) {
    const x = rand() * w;
    const cy = galacticY(x) + (rand() - 0.5) * 44;
    const rad = 18 + rand() * 38;
    const g = ctx.createRadialGradient(x, cy, 0, x, cy, rad);
    g.addColorStop(0, i % 2 === 0 ? "rgba(148, 86, 178, 0.085)" : "rgba(64, 148, 198, 0.08)");
    g.addColorStop(1, "rgba(2, 5, 13, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 3: Great Rift dark interstellar dust lanes carving through the galactic equator
  for (let i = 0; i < 95; i++) {
    const x = rand() * w;
    const cy = galacticY(x) + (rand() - 0.5) * 24;
    const rad = 14 + rand() * 32;
    const g = ctx.createRadialGradient(x, cy, 0, x, cy, rad);
    g.addColorStop(0, "rgba(2, 4, 11, 0.58)");
    g.addColorStop(0.55, "rgba(2, 4, 11, 0.22)");
    g.addColorStop(1, "rgba(2, 4, 11, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 4: Thousands of ultra-fine unresolved galactic background micro-stars
  for (let i = 0; i < 3200; i++) {
    const inBand = i < 2300;
    const x = rand() * w;
    const y = inBand ? galacticY(x) + (rand() - 0.5) * 115 : rand() * h;
    if (y < 0 || y >= h) continue;
    const alpha = 0.14 + Math.pow(rand(), 2.2) * 0.52;
    const warm = rand() > 0.65;
    ctx.fillStyle = warm
      ? `rgba(255, 232, 200, ${alpha.toFixed(2)})`
      : `rgba(195, 222, 255, ${alpha.toFixed(2)})`;
    ctx.fillRect(x, y, 1.1, 1.1);
  }

  cachedMilkyWayTex = markShared(new THREE.CanvasTexture(canvas), true, 1, 1);
  return cachedMilkyWayTex;
}
