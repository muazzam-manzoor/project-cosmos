import * as THREE from "three";
import { ISS_MODULES } from "@/data/knowledgeBase";

/**
 * Generates a realistic brushed aluminum-lithium + Whipple micrometeoroid hull panel texture.
 */
function createHullPanelTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#cfd8e3";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle metallic brushing & machined panel seams
  for (let y = 0; y < 512; y += 64) {
    ctx.fillStyle = y % 128 === 0 ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.08)";
    ctx.fillRect(0, y, 512, 62);
    ctx.fillStyle = "rgba(30,41,59,0.28)";
    ctx.fillRect(0, y, 512, 2);
  }
  for (let x = 0; x < 512; x += 64) {
    ctx.fillStyle = "rgba(30,41,59,0.22)";
    ctx.fillRect(x, 0, 2, 512);
    // Rivet rows
    ctx.fillStyle = "rgba(71,85,105,0.45)";
    for (let y = 8; y < 512; y += 16) {
      ctx.fillRect(x + 6, y, 2, 2);
      ctx.fillRect(x + 56, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Generates a realistic ISS ISPR (International Standard Payload Rack) front-face texture
 * with telemetry displays, sample drawers, ventilation grilles, and LED status banks.
 */
function createIsprRackTexture(accentHex: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  // White/cream anodized aluminum rack cabinet
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, 256, 512);

  // Vertical mounting rails
  ctx.fillStyle = "#475569";
  ctx.fillRect(0, 0, 14, 512);
  ctx.fillRect(242, 0, 14, 512);

  // Top glowing OLED telemetry monitor screen
  ctx.fillStyle = "#091224";
  ctx.fillRect(24, 24, 208, 108);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 208, 108);

  // Waveform / telemetry bars inside screen
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 32; x < 224; x += 8) {
    const y = 78 + Math.sin(x * 0.14) * 22 + Math.cos(x * 0.06) * 8;
    if (x === 32) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Status LED array
  const ledColors = ["#22c55e", "#22c55e", "#38bdf8", "#f59e0b", "#22c55e", "#38bdf8"];
  ledColors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(38 + i * 24, 154, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4 Metallic Sample Drawers & Ventilation Louvers
  for (let d = 0; d < 4; d++) {
    const y = 178 + d * 78;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(22, y, 212, 64);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.strokeRect(22, y, 212, 64);

    // Metallic drawer latch handle
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(88, y + 26, 80, 10);

    // Accent strip
    ctx.fillStyle = accentHex;
    ctx.fillRect(24, y + 4, 6, 56);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSolarGridTex(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#5c2808";
  ctx.fillRect(0, 0, 128, 512);
  ctx.fillStyle = "#c26918";
  for (let r = 0; r < 32; r++) {
    for (let col = 0; col < 6; col++) {
      ctx.fillRect(col * 21 + 2, r * 16 + 2, 17, 12);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface CutawayModuleEntry {
  root: THREE.Group;
  outerShell: THREE.Mesh;
  highlightRing: THREE.Mesh;
  focusTarget: THREE.Vector3;
  cameraOffset: THREE.Vector3;
  insidePos: THREE.Vector3;
  insideLook: THREE.Vector3;
  baseColor: THREE.Color;
}

/**
 * Tier 3 Isolated Interior Sub-Scene: Photorealistic Architectural 3D ISS Cutaway.
 * Replaces simple boxes with real machined cylindrical pressurized modules, ribbed Whipple shields,
 * CBM berthing rings, glowing ISPR science racks, Veggie magenta hydroponic plant bay,
 * ECLSS O2/H2O closed-loop piping, 7-window Cupola Observatory, and curved NASA Blue Marble Earth below!
 */
export class ISSCutawayScene {
  public readonly group = new THREE.Group();
  private modules = new Map<string, CutawayModuleEntry>();
  private pickables: THREE.Object3D[] = [];
  private lifeSupportParticles: THREE.Points;
  private earthBackdrop: THREE.Mesh;
  private cloudBackdrop: THREE.Mesh;
  private selectedId = "cupola";
  private cutawayAmount = 0.65; // 0 = closed exterior, 1 = full open interior

  private hullTex: THREE.CanvasTexture;
  private solarTex: THREE.CanvasTexture;
  private particleTex: THREE.CanvasTexture;
  private rackTextures: THREE.CanvasTexture[] = [];
  private loadedEarthTextures: THREE.Texture[] = [];

  constructor() {
    this.group.visible = false;

    this.hullTex = createHullPanelTexture();
    this.solarTex = createSolarGridTex();
    // Soft circular glow sprite for ECLSS air/water particles (no blocky WebGL squares!)
    const pc = document.createElement("canvas");
    pc.width = 32;
    pc.height = 32;
    const pctx = pc.getContext("2d")!;
    const pg = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    pg.addColorStop(0, "rgba(255,255,255,1)");
    pg.addColorStop(0.4, "rgba(56,189,248,0.85)");
    pg.addColorStop(1, "rgba(0,0,0,0)");
    pctx.fillStyle = pg;
    pctx.fillRect(0, 0, 32, 32);
    this.particleTex = new THREE.CanvasTexture(pc);

    // 1. Studio + Orbital Earthshine + Cabin Key Lighting
    const ambient = new THREE.AmbientLight(0xb8d4f4, 0.95);
    const sunKey = new THREE.DirectionalLight(0xfffaf0, 2.2);
    sunKey.position.set(10, 12, 8);
    const earthBounce = new THREE.DirectionalLight(0x38bdf8, 1.35);
    earthBounce.position.set(0, -14, 2);
    const cabinFill = new THREE.PointLight(0xe0f2fe, 2.4, 16);
    cabinFill.position.set(0, 1.2, 0);
    this.group.add(ambient, sunKey, earthBounce, cabinFill);

    // 2. Photorealistic Curved NASA Blue Marble Earth + Clouds + Atmosphere Glow Beneath Cupola!
    const texLoader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(34, 72, 48, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.1,
    });
    texLoader.load("/textures/earth_atmos_2048.jpg", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = t;
      earthMat.needsUpdate = true;
      this.loadedEarthTextures.push(t);
    });
    this.earthBackdrop = new THREE.Mesh(earthGeo, earthMat);
    this.earthBackdrop.position.set(0, -37.2, 0);
    this.group.add(this.earthBackdrop);

    const cloudGeo = new THREE.SphereGeometry(34.35, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    texLoader.load("/textures/earth_clouds_1024.png", (t) => {
      cloudMat.map = t;
      cloudMat.alphaMap = t;
      cloudMat.needsUpdate = true;
      this.loadedEarthTextures.push(t);
    });
    this.cloudBackdrop = new THREE.Mesh(cloudGeo, cloudMat);
    this.cloudBackdrop.position.set(0, -37.2, 0);
    this.group.add(this.cloudBackdrop);

    // Atmospheric Rayleigh blue horizon halo band
    const haloGeo = new THREE.SphereGeometry(35.1, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, -37.2, 0);
    this.group.add(haloMesh);

    // 3. Exterior Integrated Truss + Copper-Gold Solar Array Context Wings
    this.buildStationTrussContext();

    // 4. Build All 6 Realistic Pressurized Cutaway Modules
    this.buildAllPressurizedModules();

    // 5. Animated ECLSS O2 / H2O Closed-Loop Flow Particles
    const pCount = 180;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const alongSpine = i < 120;
      pPos[i * 3] = alongSpine ? (Math.random() - 0.5) * 0.7 : (Math.random() - 0.5) * 5.8;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      pPos[i * 3 + 2] = alongSpine ? (Math.random() - 0.5) * 7.0 : -2.2 + (Math.random() - 0.5) * 0.7;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      map: this.particleTex,
      size: 0.14,
      transparent: true,
      opacity: 0.8,
      alphaTest: 0.02,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.lifeSupportParticles = new THREE.Points(pGeo, pMat);
    this.group.add(this.lifeSupportParticles);

    this.setSelectedModule("cupola");
  }

  private buildStationTrussContext(): void {
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.35,
    });
    const solarMat = new THREE.MeshStandardMaterial({
      map: this.solarTex,
      color: 0xffd7a8,
      emissive: 0x451a03,
      emissiveIntensity: 0.28,
      metalness: 0.65,
      roughness: 0.24,
      side: THREE.DoubleSide,
    });
    const radMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.25,
      roughness: 0.38,
      side: THREE.DoubleSide,
    });

    // Overhead S0/P1/S1 Integrated Truss Backbone raised slightly so it frames cutaway cleanly
    const trussBeam = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.24, 0.28), trussMat);
    trussBeam.position.set(0, 2.08, -0.35);
    this.group.add(trussBeam);

    // Truss diagonal struts connecting S0 truss down to Destiny Lab
    for (const x of [-0.6, 0.6]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 1.35, 8), trussMat);
      strut.position.set(x, 1.38, -0.35);
      strut.rotation.z = x > 0 ? 0.22 : -0.22;
      this.group.add(strut);
    }

    // Outer Solar Array Wings (4 Port, 4 Starboard framing the cutaway silhouette)
    for (const x of [-4.6, -5.5, 4.6, 5.5]) {
      for (const sign of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 2.8), solarMat);
        wing.position.set(x, 2.08, -0.35 + sign * 1.75);
        this.group.add(wing);
      }
    }

    // White Ammonia Thermal Radiators
    for (const x of [-2.1, 2.1]) {
      const rad = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 1.8), radMat);
      rad.position.set(x, 2.04, 0.85);
      this.group.add(rad);
    }
  }

  private buildAllPressurizedModules(): void {
    const hullMatBase = new THREE.MeshStandardMaterial({
      map: this.hullTex,
      color: 0xdbe4ee,
      metalness: 0.68,
      roughness: 0.34,
      side: THREE.DoubleSide,
    });
    const innerCabinMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.72,
      metalness: 0.12,
      side: THREE.BackSide,
    });
    const cbmRingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.86,
      roughness: 0.28,
    });
    const handrailBlue = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.45,
      roughness: 0.3,
    });
    const handrailGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.6,
      roughness: 0.25,
    });
    const ledStripMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff });

    // Central pressurized docking nodes (Unity & Harmony)
    for (const z of [-2.2, 0.9]) {
      const nodeHull = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 1.05, 24),
        hullMatBase
      );
      nodeHull.rotation.x = Math.PI / 2;
      nodeHull.position.set(0, 0, z);
      const collar1 = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.045, 10, 24), cbmRingMat);
      collar1.position.set(0, 0, z - 0.52);
      const collar2 = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.045, 10, 24), cbmRingMat);
      collar2.position.set(0, 0, z + 0.52);
      this.group.add(nodeHull, collar1, collar2);
    }

    for (const mod of ISS_MODULES) {
      const baseColor = new THREE.Color(mod.color);
      const modGroup = new THREE.Group();
      modGroup.position.set(...mod.position);

      const rackTex = createIsprRackTexture(mod.color);
      this.rackTextures.push(rackTex);
      const rackMat = new THREE.MeshStandardMaterial({
        map: rackTex,
        emissiveMap: rackTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.22,
        roughness: 0.35,
        metalness: 0.35,
      });

      const isCupola = mod.id === "cupola";
      const [w, h, d] = mod.size;
      const isAlongX = w > d;
      const radius = isCupola ? 0.68 : 0.66;
      const length = isCupola ? 0.58 : Math.max(w, d);

      // Selection Highlight Ring (clean subtle collar — never an ugly 1980s glowing box!)
      const highlightRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.14, 0.032, 12, 36),
        new THREE.MeshBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.9,
        })
      );
      if (isCupola) {
        highlightRing.rotation.x = Math.PI / 2;
      } else if (isAlongX) {
        highlightRing.rotation.y = Math.PI / 2;
      }
      modGroup.add(highlightRing);

      // Outer Machined Pressurized Hull with Open Cutaway Window (Arc opens smoothly!)
      const outerMat = hullMatBase.clone();
      let outerShell: THREE.Mesh;

      if (isCupola) {
        // REAL 7-WINDOW CUPOLA OBSERVATORY DOME (Nadir-facing!)
        const domeBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.72, 0.48, 0.48, 7, 1, true),
          cbmRingMat
        );
        outerShell = domeBody;
        outerShell.userData = { issModuleId: mod.id };
        modGroup.add(domeBody);
        this.pickables.push(domeBody);

        // 7 Trapezoidal Glowing Earth-Viewing Glass Panes + Machined Mullions
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.42,
          transparent: true,
          opacity: 0.32,
          metalness: 0.9,
          roughness: 0.06,
          side: THREE.DoubleSide,
        });
        const nadirWindow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 7), glassMat);
        nadirWindow.rotation.x = Math.PI / 2;
        nadirWindow.position.y = -0.24;
        const shutterRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.055, 8, 7), cbmRingMat);
        shutterRing.rotation.x = Math.PI / 2;
        shutterRing.position.y = -0.24;
        modGroup.add(nadirWindow, shutterRing);

        // Inside Cupola: Robotic Workstation Control Panel + Twin Camera Laptops!
        const consoleMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.45,
          metalness: 0.6,
          roughness: 0.25,
        });
        const workstation = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), consoleMat);
        workstation.position.set(0.18, 0.08, 0.14);
        workstation.rotation.y = -0.5;
        modGroup.add(workstation);
      } else {
        // REAL CYLINDRICAL PRESSURIZED MODULE WITH ARCHITECTURAL 150° CUTAWAY OPENING!
        const shellGeo = new THREE.CylinderGeometry(
          radius,
          radius,
          length,
          32,
          1,
          true,
          Math.PI * 0.45,
          Math.PI * 1.25
        );
        outerShell = new THREE.Mesh(shellGeo, outerMat);
        if (isAlongX) {
          outerShell.rotation.z = Math.PI / 2;
        } else {
          outerShell.rotation.x = Math.PI / 2;
        }
        outerShell.userData = { issModuleId: mod.id };
        modGroup.add(outerShell);
        this.pickables.push(outerShell);

        // Inner Quilted White Cabin Liner matching the open cutaway
        const linerGeo = new THREE.CylinderGeometry(
          radius * 0.95,
          radius * 0.95,
          length * 0.98,
          28,
          1,
          true,
          Math.PI * 0.45,
          Math.PI * 1.25
        );
        const liner = new THREE.Mesh(linerGeo, innerCabinMat);
        liner.rotation.copy(outerShell.rotation);
        modGroup.add(liner);

        // End Bulkhead Cones + Bolted CBM Docking Collars
        for (const endSign of [-1, 1]) {
          const collar = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.042, 10, 28),
            cbmRingMat
          );
          if (isAlongX) {
            collar.rotation.y = Math.PI / 2;
            collar.position.x = endSign * (length / 2);
          } else {
            collar.position.z = endSign * (length / 2);
          }
          modGroup.add(collar);
        }

        // Overhead 5600K LED Cabin Light Strip along module ceiling
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(isAlongX ? length * 0.82 : 0.12, 0.04, isAlongX ? 0.12 : length * 0.82),
          ledStripMat
        );
        strip.position.y = radius * 0.72;
        modGroup.add(strip);

        // Iconic Blue & Gold Astronaut Grab Handrails along deck & walls
        for (const side of [-1, 1]) {
          const rail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.014, length * 0.78, 8),
            side > 0 ? handrailBlue : handrailGold
          );
          if (isAlongX) {
            rail.rotation.z = Math.PI / 2;
            rail.position.set(0, -0.34, side * 0.36);
          } else {
            rail.rotation.x = Math.PI / 2;
            rail.position.set(side * 0.36, -0.34, 0);
          }
          modGroup.add(rail);
        }

        // Detailed Illuminated ISPR Science Racks lined neatly along back wall & floor!
        const rackCount = Math.max(3, Math.round(length / 0.58));
        for (let r = 0; r < rackCount; r++) {
          const posAlong = (r - (rackCount - 1) / 2) * ((length * 0.78) / rackCount);
          const rack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.34), rackMat);
          rack.userData = { issModuleId: mod.id };
          if (isAlongX) {
            rack.position.set(posAlong, -0.06, -0.26);
          } else {
            rack.position.set(-0.26, -0.06, posAlong);
            rack.rotation.y = Math.PI / 2;
          }
          modGroup.add(rack);
          this.pickables.push(rack);
        }

        // Hero Module-Specific Interior Hardware Props!
        if (mod.id === "destiny") {
          // Veggie Magenta LED Hydroponic Plant Chamber with 3D Green Lettuce Plants!
          const veggieBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.42, 0.48),
            new THREE.MeshStandardMaterial({
              color: 0xd946ef,
              emissive: 0xc026d3,
              emissiveIntensity: 0.75,
              transparent: true,
              opacity: 0.42,
            })
          );
          veggieBox.position.set(0.24, -0.1, -0.2);
          const plantMat = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x15803d,
            emissiveIntensity: 0.35,
          });
          for (const pz of [-0.32, -0.2, -0.08]) {
            const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.065, 0), plantMat);
            plant.position.set(0.24, -0.18, pz);
            modGroup.add(plant);
          }
          modGroup.add(veggieBox);
        } else if (mod.id === "tranquility") {
          // ECLSS Glowing Cyan/Emerald Water-Electrolysis & Sabatier CO2 Recycling Tubes
          const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x22d3ee,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.75,
            roughness: 0.15,
            metalness: 0.4,
          });
          for (const py of [-0.15, 0.05, 0.22]) {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 10), pipeMat);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, py, 0.22);
            modGroup.add(pipe);
          }
        } else if (mod.id === "kibo") {
          // JAXA External Exposed Facility ("Space Porch") extending beyond airlock
          const porch = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.65), cbmRingMat);
          porch.position.set(-length / 2 - 0.55, -0.2, 0);
          modGroup.add(porch);
        }
      }

      this.group.add(modGroup);

      // Compute tailored camera framing & "Inside Cabin" first-person viewpoint for each module
      const focusTarget = new THREE.Vector3(...mod.position);
      const cameraOffset = isCupola
        ? new THREE.Vector3(2.4, 0.85, 2.8)
        : isAlongX
        ? new THREE.Vector3(0.4, 1.25, 3.6)
        : new THREE.Vector3(3.4, 1.2, 2.4);

      // Clear unobstructed astronaut first-person POV inside Cupola or down lab corridor
      const insidePos = isCupola
        ? focusTarget.clone().add(new THREE.Vector3(0, 0.12, 0.05))
        : isAlongX
        ? focusTarget.clone().add(new THREE.Vector3(0.45, 0.06, 0.18))
        : focusTarget.clone().add(new THREE.Vector3(0.18, 0.06, 0.72));
      const insideLook = isCupola
        ? focusTarget.clone().add(new THREE.Vector3(0, -4.5, -0.8))
        : isAlongX
        ? focusTarget.clone().add(new THREE.Vector3(-0.65, -0.02, -0.12))
        : focusTarget.clone().add(new THREE.Vector3(-0.18, -0.02, -0.85));

      this.modules.set(mod.id, {
        root: modGroup,
        outerShell,
        highlightRing,
        focusTarget,
        cameraOffset,
        insidePos,
        insideLook,
        baseColor,
      });
    }
  }

  public getPickables(): THREE.Object3D[] {
    return this.pickables;
  }

  public setCutawayAmount(amount: number): void {
    this.cutawayAmount = THREE.MathUtils.clamp(amount, 0, 1);
    for (const [id, entry] of this.modules.entries()) {
      if (id === "cupola") continue;
      const mat = entry.outerShell.material as THREE.MeshStandardMaterial;
      // At 0 = solid metallic exterior, at 0.5..1 = crisp architectural cutaway / translucent x-ray
      mat.transparent = this.cutawayAmount > 0.15;
      mat.opacity = 1.0 - this.cutawayAmount * 0.72;
      mat.depthWrite = this.cutawayAmount <= 0.15;
    }
  }

  public setSelectedModule(moduleId: string): void {
    this.selectedId = moduleId;
    for (const [id, entry] of this.modules.entries()) {
      const isSelected = id === moduleId;
      entry.highlightRing.visible = isSelected;
    }
  }

  public getCameraPresetForModule(
    moduleId: string,
    insideCabin = false
  ): { pos: THREE.Vector3; target: THREE.Vector3 } {
    const entry = this.modules.get(moduleId) ?? this.modules.get("cupola");
    if (!entry) {
      return { pos: new THREE.Vector3(5.5, 4.2, 6.8), target: new THREE.Vector3(0, -0.2, 0) };
    }
    if (insideCabin) {
      return { pos: entry.insidePos.clone(), target: entry.insideLook.clone() };
    }
    return {
      pos: entry.focusTarget.clone().add(entry.cameraOffset),
      target: entry.focusTarget.clone(),
    };
  }

  public update(elapsedSec: number): void {
    if (!this.group.visible) return;

    // Animate ECLSS life-support closed-loop air & recycled water particles
    const attr = this.lifeSupportParticles.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      if (i < 120) {
        let z = attr.getZ(i) + 0.016;
        if (z > 3.6) z = -3.4;
        attr.setZ(i, z);
      } else {
        let x = attr.getX(i) + 0.014;
        if (x > 2.9) x = -2.9;
        attr.setX(i, x);
      }
    }
    attr.needsUpdate = true;

    // Gentle orbital motion of photorealistic Earth & clouds beneath the Cupola!
    this.earthBackdrop.rotation.y = elapsedSec * 0.012;
    this.cloudBackdrop.rotation.y = elapsedSec * 0.0155;

    // Pulse active module highlight collar subtly
    const active = this.modules.get(this.selectedId);
    if (active) {
      const pulse = 1 + Math.sin(elapsedSec * 3.2) * 0.035;
      active.highlightRing.scale.setScalar(pulse);
    }
  }

  public dispose(): void {
    this.hullTex.dispose();
    this.solarTex.dispose();
    this.particleTex.dispose();
    this.rackTextures.forEach((t) => t.dispose());
    this.loadedEarthTextures.forEach((t) => t.dispose());
    this.group.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => mat.dispose());
      }
    });
  }
}
