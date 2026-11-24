import * as THREE from "three";
import { SpectralMode } from "@/types/cosmos";
import { getSharedGltfLoader } from "./sharedGltfLoader";
import { LUNAR_LANDMARKS } from "@/data/lunarLandmarks";
import {
  DEG2RAD,
  getMoonStateECEF,
  KM_TO_UNITS,
  MOON_MEAN_DISTANCE_KM,
  MOON_RADIUS_UNITS,
} from "./geoMath";
import {
  getGoldKaptonMaps,
  getSolarArrayMaps,
  getSpacecraftHullMaps,
} from "./PBRTextureFactory";

const MOON_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosWorld = wp.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const MOON_FRAGMENT_SHADER = `
  uniform sampler2D uAlbedoMap;
  uniform vec3 uSunDir;
  uniform vec3 uEarthDir;
  uniform int uSpectralMode; // 0 = optical, 1 = thermal IR, 2 = LRO radar altimetry
  uniform float uCutaway;    // 0.0 (intact) -> 1.0 (full octant cutaway revealing core!)
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;
  varying vec3 vLocalPos;

  vec3 thermalPalette(float t) {
    vec3 c0 = vec3(0.03, 0.02, 0.18); // -130 C lunar night shadow
    vec3 c1 = vec3(0.45, 0.04, 0.56);
    vec3 c2 = vec3(0.95, 0.34, 0.06);
    vec3 c3 = vec3(1.00, 0.96, 0.72); // +120 C sunlit lunar noon
    if (t < 0.33) return mix(c0, c1, t / 0.33);
    if (t < 0.66) return mix(c1, c2, (t - 0.33) / 0.33);
    return mix(c2, c3, (t - 0.66) / 0.34);
  }

  void main() {
    // Interactive Internal Core Cutaway Wedge (carves open camera-facing front-upper octant smoothly!)
    if (uCutaway > 0.02) {
      vec3 lp = normalize(vLocalPos);
      // Local +Z faces Earth (nearside), +X is lunar east, +Y is lunar north
      float cutThreshold = mix(0.95, -0.04, uCutaway);
      if (lp.x > cutThreshold && lp.y > cutThreshold * 0.65 && lp.z > cutThreshold) {
        discard;
      }
    }

    vec3 geomN = normalize(vNormalWorld);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vPosWorld);

    // Sample real NASA LRO Moon albedo + compute finite-difference crater relief normal!
    vec3 albedo = texture2D(uAlbedoMap, vUv).rgb;
    float hC = dot(albedo, vec3(0.333));
    float hR = dot(texture2D(uAlbedoMap, vec2(fract(vUv.x + 0.0018), vUv.y)).rgb, vec3(0.333));
    float hU = dot(texture2D(uAlbedoMap, vec2(vUv.x, clamp(vUv.y + 0.0018, 0.0, 1.0))).rgb, vec3(0.333));

    vec3 T = vec3(geomN.z, 0.0, -geomN.x);
    float tLen = length(T);
    T = tLen > 0.001 ? T / tLen : vec3(1.0, 0.0, 0.0);
    vec3 B = normalize(cross(geomN, T));
    vec3 N = normalize(geomN + T * ((hC - hR) * 3.2) + B * ((hC - hU) * 3.2));

    float ndotlGeom = dot(geomN, L);
    float ndotlRelief = dot(N, L);
    float terminatorMask = smoothstep(-0.08, 0.14, ndotlGeom);

    if (uSpectralMode == 1) {
      // Lunar Thermal Infrared (-130 C night -> +120 C sunlit noon!)
      float temp = clamp(0.08 + max(ndotlRelief, 0.0) * 0.86 + (1.0 - hC) * 0.12, 0.0, 1.0);
      gl_FragColor = vec4(thermalPalette(temp), 1.0);
      return;
    }

    if (uSpectralMode == 2) {
      // LRO LOLA Laser Altimetry / SAR Radar Hypsometric Coloring
      float scan = smoothstep(0.92, 1.0, sin(vUv.y * 95.0 - uTime * 2.2));
      vec3 lowBasin = vec3(0.08, 0.25, 0.72);
      vec3 midPlain = vec3(0.12, 0.76, 0.62);
      vec3 highland = vec3(0.96, 0.56, 0.18);
      vec3 hypso = hC < 0.45
        ? mix(lowBasin, midPlain, hC / 0.45)
        : mix(midPlain, highland, (hC - 0.45) / 0.55);
      hypso *= 0.55 + 0.55 * max(dot(N, normalize(V + vec3(0.3, 0.3, 0.2))), 0.2);
      hypso += vec3(0.3, 0.95, 1.0) * scan * 0.18;
      gl_FragColor = vec4(hypso, 1.0);
      return;
    }

    // Photorealistic Lommel-Seeliger Regolith Shading (sharp lunar craters, zero air haze!)
    float ndotv = max(dot(N, V), 0.08);
    float lommel = max(ndotlRelief, 0.0) / (max(ndotlRelief, 0.0) + ndotv * 0.52 + 0.05);
    vec3 sunlit = albedo * (0.2 + lommel * 1.45) * terminatorMask;

    // Subtle cool-blue Earthshine glow illuminating the lunar nightside facing Earth!
    float earthFacing = max(dot(geomN, normalize(uEarthDir)), 0.0);
    vec3 earthshine = albedo * vec3(0.11, 0.16, 0.25) * (0.35 + 0.65 * earthFacing);

    gl_FragColor = vec4(sunlit + earthshine, 1.0);
  }
`;

function lunarLatLonToLocalVec3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = (90 - latDeg) * DEG2RAD;
  const theta = (lonDeg + 180) * DEG2RAD;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    -radius * sinPhi * Math.cos(theta),
    radius * Math.cos(phi),
    radius * sinPhi * Math.sin(theta)
  );
}

function createProceduralMoonFallbackTex(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#8a8d91";
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 320; i++) {
    const x = (i * 97) % 512;
    const y = (i * 53) % 256;
    const r = 3 + (i % 24);
    ctx.fillStyle = i % 3 === 0 ? "rgba(65,68,72,0.55)" : "rgba(180,184,188,0.45)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const sharedMoonLoader = getSharedGltfLoader();

/**
 * Shell 2 Photorealistic 3D Moon System:
 * - True 1:1 physical distance (~384,400 km = ~603.4 units) & radius (1,737.4 km = 2.727 units)
 * - NASA LRO albedo + finite-difference crater relief + Lommel-Seeliger regolith & Earthshine shader
 * - Interactive Internal Core Cutaway (Crust -> Silicate Mantle -> Molten Boundary -> Liquid & Solid Iron Core!)
 * - 6 Clickable Lunar Landmarks (Apollo 11 + NASA Apollo Lunar Module Eagle, Artemis III Shackleton, Tycho, Mare Imbrium, SPA Basin)
 * - Live Polar-Orbiting Official NASA Lunar Reconnaissance Orbiter (lro.glb) with LOLA laser altimeter beam
 */
export class MoonSystem {
  public readonly group = new THREE.Group();
  public readonly moonRoot = new THREE.Group();

  private moonMesh: THREE.Mesh;
  private moonMat: THREE.ShaderMaterial;
  private moonTex: THREE.Texture;
  private fallbackTex: THREE.CanvasTexture;

  // Internal Core Cutaway Geology Group (visible when moonCutawayAmount > 0.02!)
  private coreGroup = new THREE.Group();
  private cutawayAmount = 0;

  // Clickable Lunar Landmark pins & Apollo 11 Lunar Module
  private landmarksGroup = new THREE.Group();
  private landmarkPickables: THREE.Object3D[] = [];

  // Live Orbiting NASA LRO Spacecraft + Polar Track + LOLA Laser Beam
  private lroOrbitGroup = new THREE.Group();
  private lroHolder = new THREE.Group();
  private lroHitMesh: THREE.Mesh;
  private lroLaser: THREE.Line;
  private lroOrbitRadius = MOON_RADIUS_UNITS + 0.56;

  // Earth–Moon Orbital Track Ring around Earth
  private earthMoonOrbitRing: THREE.Line;

  // Latest live telemetry cache
  public moonWorldPos = new THREE.Vector3(603, 0, 0);
  public lroWorldPos = new THREE.Vector3(603, 3.3, 0);
  private disposed = false;

  constructor() {
    this.fallbackTex = createProceduralMoonFallbackTex();
    this.moonTex = this.fallbackTex;

    // 1. High-Resolution 96x72 Photorealistic Moon Sphere
    const moonGeo = new THREE.SphereGeometry(MOON_RADIUS_UNITS, 96, 72);
    this.moonMat = new THREE.ShaderMaterial({
      uniforms: {
        uAlbedoMap: { value: this.moonTex },
        uSunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
        uEarthDir: { value: new THREE.Vector3(-1, 0, 0) },
        uSpectralMode: { value: 0 },
        uCutaway: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: MOON_VERTEX_SHADER,
      fragmentShader: MOON_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, this.moonMat);
    this.moonMesh.name = "moon-surface";
    this.moonMesh.userData = {
      targetId: "moon",
      label: "The Moon (Luna)",
      sub: "384,400 km · Click to inspect craters, Apollo/Artemis & core cutaway",
    };
    this.moonRoot.add(this.moonMesh);

    // Load real NASA LRO 1024px Lunar Albedo Texture cleanly
    new THREE.TextureLoader().load("/textures/moon_1024.jpg", (loaded) => {
      if (this.disposed) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      this.moonTex = loaded;
      this.moonMat.uniforms.uAlbedoMap.value = loaded;
      this.moonMat.needsUpdate = true;
    });

    // 2. Internal Lunar Geology Cutaway Layers (NASA GRAIL / Apollo Seismology!)
    this.buildInternalCoreLayers();
    this.coreGroup.visible = false;
    this.moonRoot.add(this.coreGroup);

    // 3. Clickable Lunar Landmarks (Apollo 11 + NASA Eagle LM, Artemis III South Pole, Tycho, etc.)
    this.buildLunarLandmarks();
    this.moonRoot.add(this.landmarksGroup);

    // 4. Live Polar-Orbiting NASA Lunar Reconnaissance Orbiter (lro.glb) + LOLA Laser Altimeter
    const { hitMesh, laser } = this.buildLroOrbiter();
    this.lroHitMesh = hitMesh;
    this.lroLaser = laser;
    this.moonRoot.add(this.lroOrbitGroup);

    this.group.add(this.moonRoot);

    // 5. Subtle Earth–Moon Orbital Track Ring around Earth (5.145 deg inclined)
    this.earthMoonOrbitRing = this.buildEarthMoonOrbitRing();
    this.group.add(this.earthMoonOrbitRing);
  }

  private buildInternalCoreLayers(): void {
    // Create a crisp concentric geological cross-section CanvasTexture for the 3 octant cutaway walls!
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    // Quarter-disc centered at (0, 512) -> radial distance from corner = 0..512
    const cx = 0;
    const cy = 512;
    const maxR = 512;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0.0, "#fffbeb");  // Incandescent Solid Inner Iron Core (~240 km)
    grad.addColorStop(0.14, "#fde047"); // Solid Inner Iron Core edge
    grad.addColorStop(0.22, "#f59e0b"); // Liquid Outer Iron Core (~330 km)
    grad.addColorStop(0.32, "#ea580c"); // Partially Molten Lower Mantle Boundary (~480 km)
    grad.addColorStop(0.38, "#7c2d12"); // Deep heated silicate transition
    grad.addColorStop(0.58, "#57534e"); // Olivine-Pyroxene Silicate Mantle
    grad.addColorStop(0.93, "#44403c"); // Upper Mantle
    grad.addColorStop(0.955, "#cbd5e1"); // Thin Pale Anorthositic Lunar Crust (~40 km)
    grad.addColorStop(1.0, "#94a3b8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle concentric dashed seismic boundary rings
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2;
    for (const frac of [0.14, 0.22, 0.32, 0.94]) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * frac, -Math.PI / 2, 0);
      ctx.stroke();
    }
    const sliceTex = new THREE.CanvasTexture(c);
    sliceTex.colorSpace = THREE.SRGBColorSpace;
    const sliceMat = new THREE.MeshBasicMaterial({
      map: sliceTex,
      side: THREE.DoubleSide,
    });

    // Helper: 90-deg quarter circle disc in XY plane (+X, +Y quadrant) with UVs mapped from (0,0) center!
    const makeQuarterDisc = (radius: number) => {
      const geo = new THREE.CircleGeometry(radius, 48, 0, Math.PI / 2);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Canvas origin (0, 512) corresponds to UV (0, 0) in Three.js!
        uv.setXY(i, x / radius, y / radius);
      }
      uv.needsUpdate = true;
      return geo;
    };

    const r = MOON_RADIUS_UNITS * 0.996;
    // 1. XY face (at z = 0, spans +X, +Y)
    const wallXY = new THREE.Mesh(makeQuarterDisc(r), sliceMat);
    // 2. ZY face (at x = 0, spans +Z, +Y)
    const wallZY = new THREE.Mesh(makeQuarterDisc(r), sliceMat);
    wallZY.rotation.y = -Math.PI / 2;
    // 3. XZ floor face (at y = 0, spans +X, +Z)
    const wallXZ = new THREE.Mesh(makeQuarterDisc(r), sliceMat);
    wallXZ.rotation.x = Math.PI / 2;

    // 4. Protruding Glowing 3D Iron Core Spheres right at the center of the open octant!
    const moltenHalo = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS_UNITS * 0.33, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0xea580c,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const outerCore = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS_UNITS * 0.22, 32, 24),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 1.1,
        roughness: 0.25,
        metalness: 0.55,
      })
    );
    const innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS_UNITS * 0.145, 28, 20),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    );

    this.coreGroup.add(wallXY, wallZY, wallXZ, moltenHalo, outerCore, innerCore);
  }

  private buildLunarLandmarks(): void {
    const colorMap = {
      apollo: 0xfbbf24,
      artemis: 0x38bdf8,
      crater: 0xf472b6,
      mare: 0xa78bfa,
      basin: 0x34d399,
    };

    for (const lm of LUNAR_LANDMARKS) {
      const pos = lunarLatLonToLocalVec3(lm.lat, lm.lon, MOON_RADIUS_UNITS * 1.006);
      const normal = pos.clone().normalize();
      const col = colorMap[lm.type];

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pos);
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Glowing Surface Ring Beacon
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.055, 0.088, 24),
        new THREE.MeshBasicMaterial({
          color: col,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.012;

      // Vertical Marker Mast + Tip
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.14, 8),
        new THREE.MeshBasicMaterial({ color: col })
      );
      mast.position.y = 0.07;

      const tip = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.036, 0),
        new THREE.MeshBasicMaterial({ color: col })
      );
      tip.position.y = 0.15;

      // Generous invisible click sphere
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.y = 0.08;
      hit.userData = {
        targetId: `lunar-${lm.id}`,
        label: lm.name,
        sub: `${lm.type.toUpperCase()} · ${lm.lat.toFixed(1)}°, ${lm.lon.toFixed(1)}° · Click for details`,
      };
      this.landmarkPickables.push(hit);

      pinGroup.add(ring, mast, tip, hit);

      // Mount Official NASA Apollo Lunar Module Eagle right at Tranquility Base!
      if (lm.hasLunarModule) {
        const lmHolder = new THREE.Group();
        lmHolder.position.set(0.05, 0.04, 0.02);
        sharedMoonLoader.load(
          "/models/apollo_lm.glb",
          (gltf) => {
            if (this.disposed) return;
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            const scale = 0.15 / Math.max(size.x, size.y, size.z, 1e-4);
            model.position.copy(center).multiplyScalar(-scale);
            model.scale.setScalar(scale);
            lmHolder.add(model);
          },
          undefined,
          () => {}
        );
        pinGroup.add(lmHolder);
      }

      this.landmarksGroup.add(pinGroup);
    }
  }

  private buildLroOrbiter() {
    // Polar 90-degree orbital ring around the Moon
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * this.lroOrbitRadius * 0.25,
          Math.sin(a) * this.lroOrbitRadius,
          Math.cos(a) * this.lroOrbitRadius * 0.968
        )
      );
    }
    const orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: 0xa78bfa,
        transparent: true,
        opacity: 0.45,
      })
    );
    this.lroOrbitGroup.add(orbitLine);

    // Crisp PBR placeholder seed while Official NASA lro.glb streams in
    const kapton = getGoldKaptonMaps();
    const solar = getSolarArrayMaps("blue-gaas");
    const hull = getSpacecraftHullMaps();
    const seed = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.14, 0.11),
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        bumpScale: 0.02,
        color: 0xfbbf24,
        metalness: 0.65,
        roughness: 0.3,
      })
    );
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.008, 0.1),
      new THREE.MeshStandardMaterial({
        map: solar.map,
        color: 0xdbeafe,
        metalness: 0.55,
        roughness: 0.22,
        side: THREE.DoubleSide,
      })
    );
    wing.position.set(0.2, 0, 0);
    seed.add(body, wing);
    this.lroHolder.add(seed);

    // Stream Official NASA Lunar Reconnaissance Orbiter 3D CAD (lro.glb)
    sharedMoonLoader.load(
      "/models/lro.glb",
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const scale = 0.38 / Math.max(size.x, size.y, size.z, 1e-4);
        model.position.copy(center).multiplyScalar(-scale);
        model.scale.setScalar(scale);

        model.traverse((node) => {
          const m = node as THREE.Mesh;
          if (!m.isMesh || !m.material) return;
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          const hasUV = Boolean(m.geometry?.attributes?.uv);
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMapIntensity = 1.9;
              if (!mat.map && hasUV) {
                const name = `${m.name} ${mat.name}`.toLowerCase();
                if (name.includes("solar") || name.includes("panel")) {
                  mat.map = solar.map;
                  mat.color.setHex(0xcfe8ff);
                } else if (name.includes("gold") || name.includes("foil")) {
                  mat.map = kapton.map;
                  mat.bumpMap = kapton.bumpMap;
                  mat.color.setHex(0xfbbf24);
                } else if (mat.color.r < 0.2 && mat.color.g < 0.2 && mat.color.b < 0.2) {
                  mat.map = hull.map;
                  mat.color.setHex(0xe2e8f0);
                }
              }
              mat.needsUpdate = true;
            }
          }
        });

        this.lroHolder.remove(seed);
        this.lroHolder.add(model);
      },
      undefined,
      () => {}
    );

    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.userData = {
      targetId: "lro",
      label: "Lunar Reconnaissance Orbiter (LRO)",
      sub: "Official NASA 3D GLB · 50 km Polar Lunar Orbit · Click to track",
    };
    this.lroHolder.add(hitMesh);
    this.lroOrbitGroup.add(this.lroHolder);

    // LOLA Laser Altimeter Scan Beam from LRO straight down to lunar surface!
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -1, 0),
    ]);
    const laser = new THREE.Line(
      laserGeo,
      new THREE.LineBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.72,
      })
    );
    this.lroOrbitGroup.add(laser);

    return { hitMesh, laser };
  }

  private buildEarthMoonOrbitRing(): THREE.Line {
    const r = MOON_MEAN_DISTANCE_KM * KM_TO_UNITS; // ~603.4 units
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.24,
      })
    );
    line.rotation.z = 5.145 * DEG2RAD;
    return line;
  }

  public setSpectralMode(mode: SpectralMode): void {
    this.moonMat.uniforms.uSpectralMode.value =
      mode === "optical" ? 0 : mode === "infrared" ? 1 : 2;
  }

  public setCutawayAmount(amount: number): void {
    this.cutawayAmount = THREE.MathUtils.clamp(amount, 0, 1);
    this.moonMat.uniforms.uCutaway.value = this.cutawayAmount;
    this.coreGroup.visible = this.cutawayAmount > 0.02;
  }

  public setVisibility(opts: { cislunar: boolean; lunarLandmarks: boolean }): void {
    this.group.visible = opts.cislunar;
    this.landmarksGroup.visible = opts.cislunar && opts.lunarLandmarks;
  }

  public getPickables(): THREE.Object3D[] {
    if (!this.group.visible) return [];
    const list: THREE.Object3D[] = [this.lroHitMesh];
    if (this.landmarksGroup.visible) {
      list.push(...this.landmarkPickables);
    }
    list.push(this.moonMesh);
    return list;
  }

  public getLandmarkWorldPos(landmarkId: string): THREE.Vector3 | null {
    const lm = LUNAR_LANDMARKS.find((l) => l.id === landmarkId);
    if (!lm) return null;
    const localPos = lunarLatLonToLocalVec3(lm.lat, lm.lon, MOON_RADIUS_UNITS);
    // Compute in orbitalGroup-local space (excludes Floating-Origin offset on orbitalGroup!)
    this.moonRoot.updateMatrix();
    return localPos.applyMatrix4(this.moonRoot.matrix);
  }

  public update(
    simTimestampMs: number,
    elapsedSec: number,
    sunDir: THREE.Vector3
  ) {
    const state = getMoonStateECEF(simTimestampMs);
    this.moonWorldPos.copy(state.position);
    this.moonRoot.position.copy(state.position);

    // Tidally lock the Moon's nearside (Mare Imbrium / Apollo 11) facing Earth (0,0,0)!
    this.moonRoot.lookAt(0, 0, 0);
    // Align sphere equirectangular longitude 0° (nearside center) toward Earth
    this.moonRoot.rotateY(-Math.PI / 2);

    this.moonMat.uniforms.uSunDir.value.copy(sunDir);
    this.moonMat.uniforms.uEarthDir.value.copy(state.position).negate().normalize();
    this.moonMat.uniforms.uTime.value = elapsedSec;

    // Advance Lunar Reconnaissance Orbiter along its 113-minute polar orbit
    const lroAngle = (simTimestampMs / (113 * 60 * 1000)) * Math.PI * 2 + elapsedSec * 0.08;
    const lx = Math.cos(lroAngle) * this.lroOrbitRadius * 0.25;
    const ly = Math.sin(lroAngle) * this.lroOrbitRadius;
    const lz = Math.cos(lroAngle) * this.lroOrbitRadius * 0.968;
    this.lroHolder.position.set(lx, ly, lz);
    this.lroHolder.lookAt(0, 0, 0);

    // Update LOLA laser beam from LRO to lunar surface nadir point
    const lPosAttr = this.lroLaser.geometry.getAttribute("position") as THREE.BufferAttribute;
    const nadirDir = this.lroHolder.position.clone().normalize().multiplyScalar(MOON_RADIUS_UNITS);
    lPosAttr.setXYZ(0, lx, ly, lz);
    lPosAttr.setXYZ(1, nadirDir.x, nadirDir.y, nadirDir.z);
    lPosAttr.needsUpdate = true;

    // Compute LRO position in orbitalGroup-local space (NEVER getWorldPosition(), which includes -worldOrigin!)
    this.moonRoot.updateMatrix();
    this.lroWorldPos.copy(this.lroHolder.position).applyMatrix4(this.moonRoot.matrix);

    return state;
  }

  public dispose(): void {
    this.disposed = true;
    this.fallbackTex.dispose();
    if (this.moonTex !== this.fallbackTex) this.moonTex.dispose();
    this.group.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          const std = mat as THREE.MeshStandardMaterial;
          if (std.map && !std.map.userData?.sharedTexture) std.map.dispose();
          if (std.bumpMap && !std.bumpMap.userData?.sharedTexture) std.bumpMap.dispose();
          mat.dispose();
        }
      }
    });
  }
}
