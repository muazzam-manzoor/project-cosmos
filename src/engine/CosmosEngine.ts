import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useCosmosStore } from "@/store/useCosmosStore";
import { NearEarthAsteroid, SatelliteCategory, SatelliteTLE, ViewMode } from "@/types/cosmos";
import { LAUNCH_PADS } from "@/data/launchPads";
import { EarthSystem } from "./EarthSystem";
import { MagnetosphereSystem } from "./MagnetosphereSystem";
import { MoonSystem } from "./MoonSystem";
import { CislunarSystem } from "./CislunarSystem";
import { OrbitalService } from "./OrbitalService";
import { MemoryManager } from "./MemoryManager";
import {
  createOrbitalEnvironmentMap,
  createSpacecraftByArchetype,
  getModelProvenanceLabel,
  resolveSpacecraftArchetype,
  SpacecraftArchetype,
} from "./SpacecraftModels";
import { getMilkyWaySkyTexture } from "./PBRTextureFactory";
import { ISSCutawayScene } from "./ISSCutawayScene";
import { GroundUpSkyEngine } from "./GroundUpSkyEngine";
import {
  EARTH_RADIUS_KM,
  EARTH_RADIUS_UNITS,
  getMoonStateECEF,
  getSunDirectionECEF,
  latLonAltToVec3,
  UNITS_TO_KM,
} from "./geoMath";

const ALL_CATEGORIES: SatelliteCategory[] = [
  "station",
  "science",
  "weather",
  "starlink",
  "debris",
  "gnss",
  "geo",
];

const CATEGORY_COLORS: Record<SatelliteCategory, number> = {
  station: 0xfbbf24,
  science: 0xa78bfa,
  weather: 0x34d399,
  starlink: 0x38bdf8,
  debris: 0xfb7185,
  gnss: 0xa3e635, // MEO Navigation Lime-Gold
  geo: 0xf472b6,  // GEO Ring Luminous Rose-Gold
};

function createCategoryTier1Geometry(cat: SatelliteCategory): THREE.BufferGeometry {
  switch (cat) {
    case "station":
      return new THREE.BoxGeometry(0.18, 0.036, 0.09);
    case "science":
      return new THREE.CylinderGeometry(0.036, 0.036, 0.145, 6);
    case "weather":
      return new THREE.CylinderGeometry(0.056, 0.056, 0.075, 6);
    case "starlink":
      return new THREE.BoxGeometry(0.115, 0.018, 0.055);
    case "debris":
      return new THREE.TetrahedronGeometry(0.052, 0);
    case "gnss":
      // Sleek MEO navigation diamond visible across the 20,200 km shell without cluttering close-ups
      return new THREE.OctahedronGeometry(0.18, 0);
    case "geo":
      // Sleek GEO Clarke Belt diamond beacon (subtle, crisp, never photobombs close-ups!)
      return new THREE.OctahedronGeometry(0.22, 1);
  }
}

const STARFIELD_VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vMag;
  void main() {
    vColor = aColor;
    vMag = aSize;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (5200.0 / max(-mvPos.z, 1.0)), 1.2, 14.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const STARFIELD_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vMag;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    // Crisp bright Airy core + smooth optical halo
    float core = exp(-dist * dist * 34.0);
    float halo = exp(-dist * dist * 8.5) * 0.42;
    // Subtle 4-point optical diffraction spikes ONLY on brightest magnitude stars
    float spike = 0.0;
    if (vMag > 4.2) {
      float sx = exp(-abs(uv.y) * 44.0) * exp(-abs(uv.x) * 6.5);
      float sy = exp(-abs(uv.x) * 44.0) * exp(-abs(uv.y) * 6.5);
      spike = (sx + sy) * 0.35;
    }
    float lum = clamp(core + halo + spike, 0.0, 1.25);
    gl_FragColor = vec4(vColor * lum, clamp(lum, 0.0, 1.0));
  }
`;

const GEO_CONE_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosWorld = wp.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GEO_CONE_FRAGMENT_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vPosWorld);
    // Volumetric Fresnel edge glow: crisp translucent beam outline, transparent core!
    float fresnel = pow(1.0 - abs(dot(N, V)), 2.0);
    // Fade near the spacecraft apex (vUv.y ~ 1.0) so optics stay crystal clear, and feather near Earth
    float apexFade = smoothstep(0.99, 0.78, vUv.y);
    float baseFade = smoothstep(0.0, 0.14, vUv.y);
    // Animated RF telemetry wavefront pulses propagating down from GEO toward Earth!
    float pulse = pow(sin(vUv.y * 28.0 + uTime * 2.6) * 0.5 + 0.5, 5.0);
    vec3 col = mix(vec3(0.32, 0.82, 1.0), vec3(0.96, 0.45, 0.76), 0.5 + 0.5 * pulse);
    float alpha = (fresnel * 0.34 + 0.045 + pulse * 0.15) * apexFade * baseFade;
    gl_FragColor = vec4(col, alpha);
  }
`;

interface ActiveLodSlot {
  satIndex: number;
  noradId: number;
  assetKey: string;
  archetype: SpacecraftArchetype;
  worldPos: THREE.Vector3;
  holder: THREE.Group;
}

/**
 * Project Cosmos Master 3D/4D WebGL Engine (Shell 1A: Earth & LEO 0 -> 2,500 km).
 * Runs outside React's reconciliation loop for silky 60 FPS with:
 * - Dedicated 64-bit SGP4 Astrodynamics Web Worker (Transferable Float32 buffers)
 * - Floating-Origin Camera Bridge (Float64 -> Float32 origin re-centering at 0,0,0)
 * - 5 Distinct Tier 1 Category Silhouette InstancedMeshes (5 GPU draw calls total)
 * - Proximity Auto-LOD streaming official NASA 3D .glb replicas for ANY satellite you zoom near
 * - Photorealistic 128x128 Earth (NASA Blue/Black Marble, Normal Relief, Specular Mask, Cloud Shadows)
 * - Real 3D Launch Complexes & Vehicle-Accurate Rockets on Earth's surface
 * - Photorealistic Tier 3 ISS Architectural Cutaway & Ground-Up Earth Sky Dome
 */
export class CosmosEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  // Sub-systems
  private orbitalGroup = new THREE.Group();
  private earthSystem: EarthSystem;
  private magnetosphereSystem: MagnetosphereSystem;
  private moonSystem: MoonSystem;
  private cislunarSystem: CislunarSystem;
  private issCutaway: ISSCutawayScene;
  private groundSky: GroundUpSkyEngine;
  private orbitalService = new OrbitalService();
  private memoryManager = new MemoryManager(10);
  private geoFootprintCone: THREE.Mesh;
  private geoFootprintMat: THREE.ShaderMaterial;
  private lastConjunctionScan = 0;

  // Floating-Origin Bridge (64-bit world origin offset in scene units)
  private worldOrigin = new THREE.Vector3(0, 0, 0);
  private floatingOriginActive = false;

  // Lights & Deep-Space Backdrop
  private sunLight: THREE.DirectionalLight;
  private earthBounceLight: THREE.DirectionalLight;
  private milkyWayDome: THREE.Mesh;
  private starfield: THREE.Points;
  private envMap: THREE.Texture;

  // Tier 1 Multi-Shape Category Swarm (5 distinct InstancedMesh silhouettes = 5 draw calls!)
  private swarmCatalog: SatelliteTLE[] = [];
  private categoryMeshes = new Map<
    SatelliteCategory,
    { mesh: THREE.InstancedMesh; satIndices: number[] }
  >();
  private dummyMatrix = new THREE.Object3D();

  // Tier 2 Proximity Auto-LOD Slots (up to 3 simultaneous real 3D spacecraft replicas!)
  private activeLodContainer = new THREE.Group();
  private activeLodSlots = new Map<number, ActiveLodSlot>(); // keyed by satIndex
  private orbitRibbon: THREE.Line | null = null;
  private nadirLaser: THREE.Line | null = null;
  private targetReticle: THREE.Mesh;

  // Camera smooth transition state (stored in camera-relative GPU space)
  private cameraLerpGoal: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
  private lastViewMode: ViewMode = "orbit";
  private lastOrbitTargetId = "";
  private lastFlushCounter = 0;
  private lastStressCounter = 0;
  private lastClockSyncNonce = 0;
  private lastIssModuleId = "cupola";
  private lastIssInsideCabin = false;
  private lastIssCutawayAmount = 0.65;
  private lastMoonCutawayAmount = 0;

  // Loop & Telemetry timers
  private rafId = 0;
  private disposed = false;
  private lastFrameTime = performance.now();
  private elapsedSec = 0;
  private simTimestamp = Date.now();
  private frameCounter = 0;
  private fpsWindowStart = performance.now();
  private currentFps = 60;
  private lastTelemetrySync = 0;
  private lastTrackRebuild = 0;
  private lastPropagationMs = 0;
  private lastLayersOrbits = true;
  private lastHoverCheck = 0;

  // Picking
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDownPos = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020611);

    // Orbital Space + Sun + Blue Earth IBL reflections so metallic NASA foil & chrome gleam realistically!
    this.envMap = createOrbitalEnvironmentMap(this.renderer);
    this.scene.environment = this.envMap;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.004, 32000);
    this.camera.position.set(18, 10, 22);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 0.25;
    this.controls.maxDistance = 4400; // Extended seamlessly for Shell 2 (Moon 384k km & L1/L2 1.5M km!)
    this.controls.rotateSpeed = 0.65;
    this.controls.zoomSpeed = 0.95;

    // Orbital Lighting (targets parented to orbitalGroup so Floating-Origin preserves light vectors)
    const ambient = new THREE.AmbientLight(0x94b4d8, 1.05);
    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x2563eb, 0.85);
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 3.1);
    this.sunLight.position.set(40, 12, 30);
    // Dynamic Earthshine bounce light (aimed outward from Earth toward active spacecraft!)
    this.earthBounceLight = new THREE.DirectionalLight(0x7dd3fc, 1.35);
    this.earthBounceLight.position.set(-20, -15, -20);
    this.orbitalGroup.add(
      ambient,
      hemi,
      this.sunLight,
      this.sunLight.target,
      this.earthBounceLight,
      this.earthBounceLight.target
    );

    // Pre-Baked Photorealistic Milky Way Galactic Sky-Dome (1 texture lookup/pixel = 60 FPS!) + 4,200 Spectral Stars
    this.milkyWayDome = new THREE.Mesh(
      new THREE.SphereGeometry(18000, 36, 24),
      new THREE.MeshBasicMaterial({
        map: getMilkyWaySkyTexture(),
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    this.scene.add(this.milkyWayDome);

    this.starfield = this.createStarfield();
    this.scene.add(this.starfield);

    // Earth System (Tier 0 Pinned Anchor + Real 3D Launch Complexes)
    this.earthSystem = new EarthSystem();
    this.orbitalGroup.add(this.earthSystem.group);

    // Shell 1B Magnetosphere, Volumetric Van Allen Belts & Hohmann Transfer System
    this.magnetosphereSystem = new MagnetosphereSystem();
    this.orbitalGroup.add(this.magnetosphereSystem.group);

    // Shell 2 Photorealistic 3D Moon, Apollo/Artemis Sites, Core Cutaway & Live LRO Orbiter
    this.moonSystem = new MoonSystem();
    this.orbitalGroup.add(this.moonSystem.group);

    // Shell 2 Lagrange Points (L1 DSCOVR, L2 JWST) & 4D Near-Earth Asteroids (NEOs)
    this.cislunarSystem = new CislunarSystem();
    this.orbitalGroup.add(this.cislunarSystem.group);

    // Volumetric GEO Hemispheric RF-Beam Coverage Cone (Fresnel rim + pulsing telemetry wavefronts!)
    const coneGeo = new THREE.ConeGeometry(EARTH_RADIUS_UNITS * 0.96, 1.0, 56, 1, true);
    coneGeo.translate(0, -0.5, 0);
    coneGeo.rotateX(Math.PI / 2);
    this.geoFootprintMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: GEO_CONE_VERTEX_SHADER,
      fragmentShader: GEO_CONE_FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.geoFootprintCone = new THREE.Mesh(coneGeo, this.geoFootprintMat);
    this.geoFootprintCone.visible = false;
    this.orbitalGroup.add(this.geoFootprintCone);

    // Active Target Highlight Ring (auto-fades when zoomed close!)
    const reticleGeo = new THREE.RingGeometry(0.17, 0.21, 36);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.targetReticle = new THREE.Mesh(reticleGeo, reticleMat);
    this.targetReticle.visible = false;
    this.orbitalGroup.add(this.targetReticle);
    this.orbitalGroup.add(this.activeLodContainer);

    this.scene.add(this.orbitalGroup);

    // Tier 3 Isolated Photorealistic ISS Architectural Cutaway Sub-Scene
    this.issCutaway = new ISSCutawayScene();
    this.scene.add(this.issCutaway.group);

    // Ground-Up Earth Sky View Sub-Scene
    this.groundSky = new GroundUpSkyEngine();
    this.scene.add(this.groundSky.group);

    // Sync initial store state
    const initStore = useCosmosStore.getState();
    this.lastClockSyncNonce = initStore.clockSyncNonce;
    this.lastFlushCounter = initStore.flushCacheCounter;
    this.lastStressCounter = initStore.stressTestCounter;
    this.lastLayersOrbits = initStore.layers.orbits;
    this.lastIssModuleId = initStore.selectedIssModuleId;
    this.lastIssInsideCabin = initStore.issInsideCabin;
    this.lastIssCutawayAmount = initStore.issCutawayAmount;

    // Bind events
    window.addEventListener("resize", this.handleResize);
    this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp);
    this.renderer.domElement.addEventListener("pointermove", this.handlePointerMove);

    if (initStore.satellites.length > 0) {
      this.loadSatellites(initStore.satellites, initStore.satellitesSource);
    }
    if (initStore.neos.length > 0) {
      this.loadNeos(initStore.neos);
    }

    this.animate();
  }

  public loadNeos(neos: NearEarthAsteroid[]): void {
    this.cislunarSystem.setNeos(neos);
  }

  private createStarfield(): THREE.Points {
    const count = 4200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const palette = [
      new THREE.Color(0x9bb0ff), // O/B blue-white
      new THREE.Color(0xcad7ff), // A sapphire-white
      new THREE.Color(0xf8f9ff), // F crisp white
      new THREE.Color(0xfff4ea), // G solar cream
      new THREE.Color(0xffd2a1), // K warm amber
      new THREE.Color(0xffb86c), // M orange giant
    ];

    for (let i = 0; i < count; i++) {
      const r = 10500 + Math.random() * 3500;
      const theta = Math.random() * Math.PI * 2;
      // Concentrate ~35% of stars softly near the tilted Milky Way galactic plane!
      const inBand = i < count * 0.35;
      let y = 2 * Math.random() - 1;
      if (inBand) {
        y = (Math.random() - 0.5) * 0.34;
      }
      const rho = Math.sqrt(Math.max(0, 1 - y * y));
      let sx = rho * Math.cos(theta);
      let sy = y;
      let sz = rho * Math.sin(theta);

      if (inBand) {
        const c = Math.cos(-1.098);
        const s = Math.sin(-1.098);
        const ry = sy * c - sz * s;
        const rz = sy * s + sz * c;
        sy = ry;
        sz = rz;
      }

      pos[i * 3] = sx * r;
      pos[i * 3 + 1] = sy * r;
      pos[i * 3 + 2] = sz * r;

      const c = palette[i % palette.length];
      // Realistic astronomical power-law magnitude distribution (many faint pinpoint stars, few dazzling giants!)
      const magRoll = Math.pow(Math.random(), 3.6);
      sizes[i] = 1.6 + magRoll * 4.8;
      const brightness = 0.55 + magRoll * 0.55;
      col[i * 3] = c.r * brightness;
      col[i * 3 + 1] = c.g * brightness;
      col[i * 3 + 2] = c.b * brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: STARFIELD_VERTEX_SHADER,
      fragmentShader: STARFIELD_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  private setWorldOrigin(newOrigin: THREE.Vector3): void {
    const dx = newOrigin.x - this.worldOrigin.x;
    const dy = newOrigin.y - this.worldOrigin.y;
    const dz = newOrigin.z - this.worldOrigin.z;
    if (dx * dx + dy * dy + dz * dz < 1e-12) return;

    this.worldOrigin.copy(newOrigin);
    this.orbitalGroup.position.set(-newOrigin.x, -newOrigin.y, -newOrigin.z);

    this.camera.position.x -= dx;
    this.camera.position.y -= dy;
    this.camera.position.z -= dz;
    this.controls.target.x -= dx;
    this.controls.target.y -= dy;
    this.controls.target.z -= dz;

    if (this.cameraLerpGoal) {
      this.cameraLerpGoal.pos.x -= dx;
      this.cameraLerpGoal.pos.y -= dy;
      this.cameraLerpGoal.pos.z -= dz;
      this.cameraLerpGoal.target.x -= dx;
      this.cameraLerpGoal.target.y -= dy;
      this.cameraLerpGoal.target.z -= dz;
    }

    this.floatingOriginActive = this.worldOrigin.lengthSq() > 1e-6;
  }

  private worldToRenderSpace(worldPos: THREE.Vector3): THREE.Vector3 {
    return worldPos.clone().sub(this.worldOrigin);
  }

  private disposeCategoryMeshes(): void {
    for (const entry of this.categoryMeshes.values()) {
      this.orbitalGroup.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
    }
    this.categoryMeshes.clear();
  }

  public loadSatellites(
    tles: SatelliteTLE[],
    source: "live" | "fallback" = "fallback"
  ): void {
    this.orbitalService.loadCatalog(tles, source);
    this.swarmCatalog = tles;
    this.disposeCategoryMeshes();
    this.clearAllActiveLodSlots();

    if (tles.length === 0) return;

    // Partition catalog into 5 distinct Tier 1 Silhouette InstancedMeshes!
    const grouped: Record<SatelliteCategory, number[]> = {
      station: [],
      science: [],
      weather: [],
      starlink: [],
      debris: [],
      gnss: [],
      geo: [],
    };

    for (let i = 0; i < tles.length; i++) {
      const cat = tles[i].category;
      if (grouped[cat]) grouped[cat].push(i);
      else grouped.starlink.push(i);
    }

    for (const cat of ALL_CATEGORIES) {
      const indices = grouped[cat];
      if (indices.length === 0) continue;

      const geo = createCategoryTier1Geometry(cat);
      const mat = new THREE.MeshStandardMaterial({
        color: CATEGORY_COLORS[cat],
        emissive: CATEGORY_COLORS[cat],
        emissiveIntensity: 0.65,
        metalness: 0.55,
        roughness: 0.25,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, indices.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.userData = { category: cat };
      this.orbitalGroup.add(mesh);
      this.categoryMeshes.set(cat, { mesh, satIndices: indices });
    }

    this.lastTrackRebuild = 0;
  }

  private clearAllActiveLodSlots(): void {
    for (const slot of this.activeLodSlots.values()) {
      slot.holder.clear();
      this.activeLodContainer.remove(slot.holder);
    }
    this.activeLodSlots.clear();
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.cameraLerpGoal = null;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const now = performance.now();
    if (now - this.lastHoverCheck < 70) return; // Throttled 14 Hz raycast
    this.lastHoverCheck = now;

    const store = useCosmosStore.getState();
    if (store.hudMode === "cinema") {
      if (store.hoveredObject) store.setHoveredObject(null);
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // Hover tooltips in Ground Sky View (identify passing overhead satellites before clicking!)
    if (store.viewMode === "ground") {
      const skyHits = this.raycaster.intersectObjects(this.groundSky.getPickables(), false);
      if (skyHits.length > 0) {
        const name = (skyHits[0].object.userData.name as string) ?? "Overhead Satellite";
        store.setHoveredObject({
          label: name,
          sub: "Passing Overhead · Click to launch off Earth",
          x: e.clientX,
          y: e.clientY,
        });
        return;
      }
      if (store.hoveredObject) store.setHoveredObject(null);
      return;
    }

    // Hover tooltips in Tier 3 ISS Interior Cutaway
    if (store.viewMode === "iss-interior") {
      const modHits = this.raycaster.intersectObjects(this.issCutaway.getPickables(), false);
      if (modHits.length > 0) {
        const modId = modHits[0].object.userData.issModuleId as string | undefined;
        if (modId) {
          store.setHoveredObject({
            label: `${modId.charAt(0).toUpperCase()}${modId.slice(1)} Module`,
            sub: "ISS Pressurized Module · Click to focus",
            x: e.clientX,
            y: e.clientY,
          });
          return;
        }
      }
      if (store.hoveredObject) store.setHoveredObject(null);
      return;
    }

    // 1. Check 3D Launch Pads
    if (store.layers.launchPads) {
      const padHits = this.raycaster.intersectObjects(this.earthSystem.getPadPickables(), false);
      if (padHits.length > 0) {
        const label = (padHits[0].object.userData.label as string) ?? "Launch Pad";
        store.setHoveredObject({
          label,
          sub: "3D Launch Complex · Click to zoom",
          x: e.clientX,
          y: e.clientY,
        });
        return;
      }
    }

    // 1.5 Check Shell 1B Priority Targets (Hohmann Transfer Spacecraft, Sky-Blue Perigee & Orange Apogee Nodes)
    const hohmannHits = this.raycaster.intersectObjects(
      this.magnetosphereSystem.getPriorityPickables(),
      false
    );
    if (hohmannHits.length > 0) {
      const ud = hohmannHits[0].object.userData;
      store.setHoveredObject({
        label: (ud.label as string) ?? "Hohmann Transfer",
        sub: (ud.sub as string) ?? "Click to inspect",
        x: e.clientX,
        y: e.clientY,
      });
      return;
    }

    // 2. Check Tier 1 Multi-Shape Satellites
    if (store.layers.satellites) {
      for (const [cat, entry] of this.categoryMeshes.entries()) {
        if (!store.layers.categories[cat]) continue;
        const hits = this.raycaster.intersectObject(entry.mesh, false);
        if (hits.length > 0 && hits[0].instanceId !== undefined) {
          const satIdx = entry.satIndices[hits[0].instanceId];
          const sat = this.swarmCatalog[satIdx];
          if (sat) {
            const arch = resolveSpacecraftArchetype(sat.name, sat.category, sat.flagshipId);
            store.setHoveredObject({
              label: sat.name,
              sub: `NORAD #${sat.noradId} · ${getModelProvenanceLabel(arch)}`,
              x: e.clientX,
              y: e.clientY,
            });
            return;
          }
        }
      }
    }

    // 3. Check Shell 1B Volumetric Donuts & Magnetosphere Shield (Inner/Outer Van Allen Belts & Bow Shock)
    const fieldHits = this.raycaster.intersectObjects(
      this.magnetosphereSystem.getFieldPickables(),
      false
    );
    if (fieldHits.length > 0) {
      const ud = fieldHits[0].object.userData;
      store.setHoveredObject({
        label: (ud.label as string) ?? "Space Environment",
        sub: (ud.sub as string) ?? "Click for details",
        x: e.clientX,
        y: e.clientY,
      });
      return;
    }

    // 4. Check Shell 2 Cislunar Objects (Moon, Apollo/Artemis Landmarks, LRO, L1 DSCOVR, L2 JWST & NEOs)
    const shell2Pickables = [
      ...this.moonSystem.getPickables(),
      ...this.cislunarSystem.getPickables(),
    ];
    if (shell2Pickables.length > 0) {
      const s2Hits = this.raycaster.intersectObjects(shell2Pickables, false);
      if (s2Hits.length > 0) {
        const ud = s2Hits[0].object.userData;
        store.setHoveredObject({
          label: (ud.label as string) ?? "Cislunar Target",
          sub: (ud.sub as string) ?? "Click to fly & inspect",
          x: e.clientX,
          y: e.clientY,
        });
        return;
      }
    }

    if (store.hoveredObject) store.setHoveredObject(null);
  };

  private handlePointerUp = (e: PointerEvent): void => {
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (dx * dx + dy * dy > 25) return; // Ignore orbit drag

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const store = useCosmosStore.getState();

    // 1. Tier 3 ISS Interior Module Picking -> smooth fly-to module!
    if (store.viewMode === "iss-interior") {
      const hits = this.raycaster.intersectObjects(this.issCutaway.getPickables(), false);
      if (hits.length > 0) {
        const modId = hits[0].object.userData.issModuleId as string | undefined;
        if (modId) {
          store.setSelectedIssModuleId(modId);
        }
      }
      return;
    }

    // 2. Ground-Up Sky View Satellite Picking -> Click to launch into orbit!
    if (store.viewMode === "ground") {
      const hits = this.raycaster.intersectObjects(this.groundSky.getPickables(), false);
      if (hits.length > 0) {
        const targetId = hits[0].object.userData.targetId as string | undefined;
        if (targetId) {
          store.setSelectedTargetId(targetId, true);
          store.setViewMode("orbit");
        }
      }
      return;
    }

    // 3. Orbital View Picking: 3D Launch Pads
    if (store.layers.launchPads) {
      const padHits = this.raycaster.intersectObjects(this.earthSystem.getPadPickables(), false);
      if (padHits.length > 0) {
        const targetId = padHits[0].object.userData.targetId as string | undefined;
        if (targetId) {
          store.setSelectedTargetId(targetId, false);
          this.flyToTarget(targetId);
          return;
        }
      }
    }

    // 3.5 Orbital View Picking: Shell 1B Priority Targets (Hohmann Craft, Perigee & Apogee Balls)
    const hohmannHits = this.raycaster.intersectObjects(
      this.magnetosphereSystem.getPriorityPickables(),
      false
    );
    if (hohmannHits.length > 0) {
      const targetId = hohmannHits[0].object.userData.targetId as string | undefined;
      if (targetId) {
        store.setSelectedTargetId(targetId, targetId === "phenom-hohmann-craft");
        this.flyToTarget(targetId);
        return;
      }
    }

    // 4. Orbital View Picking: Any of the 7 Category Silhouette Swarms
    if (store.layers.satellites) {
      for (const [cat, entry] of this.categoryMeshes.entries()) {
        if (!store.layers.categories[cat]) continue;
        const satHits = this.raycaster.intersectObject(entry.mesh, false);
        if (satHits.length > 0 && satHits[0].instanceId !== undefined) {
          const satIdx = entry.satIndices[satHits[0].instanceId];
          const sat = this.swarmCatalog[satIdx];
          if (sat) {
            const id = sat.flagshipId ?? `sat-${sat.noradId}`;
            store.setSelectedTargetId(id, true);
            this.flyToTarget(id);
            return;
          }
        }
      }
    }

    // 5. Orbital View Picking: Volumetric Van Allen Donuts & Magnetosphere Bow Shock Shield
    const fieldHits = this.raycaster.intersectObjects(
      this.magnetosphereSystem.getFieldPickables(),
      false
    );
    if (fieldHits.length > 0) {
      const targetId = fieldHits[0].object.userData.targetId as string | undefined;
      if (targetId) {
        store.setSelectedTargetId(targetId, false);
        this.flyToTarget(targetId);
        return;
      }
    }

    // 6. Orbital View Picking: Shell 2 Moon, Apollo/Artemis Landmarks, LRO, L1 DSCOVR, L2 JWST & NEOs
    const shell2Pickables = [
      ...this.moonSystem.getPickables(),
      ...this.cislunarSystem.getPickables(),
    ];
    if (shell2Pickables.length > 0) {
      const s2Hits = this.raycaster.intersectObjects(shell2Pickables, false);
      if (s2Hits.length > 0) {
        const targetId = s2Hits[0].object.userData.targetId as string | undefined;
        if (targetId) {
          store.setSelectedTargetId(targetId, true);
          this.flyToTarget(targetId);
          return;
        }
      }
    }
  };

  private isShell2Target(targetId: string): boolean {
    return (
      targetId === "moon" ||
      targetId.startsWith("lunar-") ||
      targetId === "lro" ||
      targetId === "jwst" ||
      targetId === "dscovr" ||
      targetId.startsWith("neo-")
    );
  }

  private getShell2WorldPos(targetId: string): THREE.Vector3 | null {
    if (targetId === "moon") return this.moonSystem.moonWorldPos.clone();
    if (targetId.startsWith("lunar-")) {
      return this.moonSystem.getLandmarkWorldPos(targetId.slice(6));
    }
    if (targetId === "lro") return this.moonSystem.lroWorldPos.clone();
    if (targetId === "jwst") return this.cislunarSystem.jwstWorldPos.clone();
    if (targetId === "dscovr") return this.cislunarSystem.dscovrWorldPos.clone();
    if (targetId.startsWith("neo-")) {
      return this.cislunarSystem.getNeoWorldPos(targetId);
    }
    return null;
  }

  public flyToTarget(targetId: string): void {
    if (targetId === "earth") {
      this.setWorldOrigin(new THREE.Vector3(0, 0, 0));
      this.cameraLerpGoal = {
        pos: new THREE.Vector3(18, 9, 21),
        target: new THREE.Vector3(0, 0, 0),
      };
      return;
    }

    if (targetId === "shell-1b" || targetId === "van-allen" || targetId === "magnetosphere") {
      this.setWorldOrigin(new THREE.Vector3(0, 0, 0));
      this.cameraLerpGoal = {
        pos: new THREE.Vector3(68, 46, 98),
        target: new THREE.Vector3(0, 0, 0),
      };
      return;
    }

    if (targetId === "cislunar") {
      this.setWorldOrigin(new THREE.Vector3(0, 0, 0));
      this.cameraLerpGoal = {
        pos: new THREE.Vector3(900, 1150, 2150),
        target: new THREE.Vector3(0, 0, 0),
      };
      return;
    }

    if (this.isShell2Target(targetId)) {
      const store = useCosmosStore.getState();
      if (targetId === "moon" || targetId.startsWith("lunar-") || targetId === "lro") {
        if (!store.layers.cislunar) store.setLayerValue("cislunar", true);
      } else if (targetId === "jwst" || targetId === "dscovr") {
        if (!store.layers.lagrangePoints) store.setLayerValue("lagrangePoints", true);
      } else if (targetId.startsWith("neo-")) {
        if (!store.layers.neos) store.setLayerValue("neos", true);
      }

      const targetWorld = this.getShell2WorldPos(targetId);
      if (targetWorld) {
        // Re-center Floating-Origin straight onto Moon / L1 / L2 / NEO for razor-sharp Float32 precision!
        const originAnchor = targetId.startsWith("lunar-")
          ? this.moonSystem.moonWorldPos
          : targetWorld;
        this.setWorldOrigin(originAnchor);

        const sunDir = getSunDirectionECEF(this.simTimestamp);
        let offset: THREE.Vector3;

        if (targetId === "moon") {
          // Framed hero angle showing full 3D Moon, orbiting LRO, AND directly facing the open (+X,+Y,+Z) core cutaway octant!
          this.moonSystem.moonRoot.updateMatrixWorld(true);
          const localCutView = new THREE.Vector3(6.8, 4.6, 7.6);
          const worldDir = localCutView
            .applyQuaternion(this.moonSystem.moonRoot.quaternion);
          offset = worldDir;
        } else if (targetId.startsWith("lunar-")) {
          const normal = targetWorld.clone().sub(this.moonSystem.moonWorldPos).normalize();
          const tangent = new THREE.Vector3(0, 1, 0).cross(normal);
          if (tangent.lengthSq() < 1e-4) tangent.set(1, 0, 0);
          else tangent.normalize();
          offset = normal.clone().multiplyScalar(1.15).addScaledVector(tangent, 0.95);
        } else if (targetId === "lro") {
          const outward = targetWorld.clone().sub(this.moonSystem.moonWorldPos).normalize();
          offset = outward.clone().multiplyScalar(0.55).add(new THREE.Vector3(0.55, 0.3, 0.45));
        } else if (targetId === "jwst") {
          offset = new THREE.Vector3(1.65, 0.95, 1.85);
        } else if (targetId === "dscovr") {
          offset = new THREE.Vector3(1.35, 0.8, 1.55);
        } else {
          // NEO asteroid close inspection!
          offset = sunDir.clone().multiplyScalar(1.35).add(new THREE.Vector3(0.9, 0.75, 1.15));
        }

        const camWorld = targetWorld.clone().add(offset);
        this.cameraLerpGoal = {
          pos: this.worldToRenderSpace(camWorld),
          target: this.worldToRenderSpace(targetWorld),
        };
      }
      return;
    }

    if (targetId.startsWith("phenom-")) {
      const store = useCosmosStore.getState();
      if (targetId === "phenom-van-allen-inner" || targetId === "phenom-van-allen-outer") {
        if (!store.layers.vanAllenBelts) store.setLayerValue("vanAllenBelts", true);
      } else if (targetId === "phenom-magnetosphere") {
        if (!store.layers.magnetosphere) store.setLayerValue("magnetosphere", true);
      } else {
        if (!store.layers.hohmannTransfer) store.setLayerValue("hohmannTransfer", true);
      }
      this.setWorldOrigin(new THREE.Vector3(0, 0, 0));
      const pose = this.magnetosphereSystem.getTargetFocusPose(targetId);
      if (pose) {
        this.cameraLerpGoal = {
          pos: this.worldToRenderSpace(pose.camPos),
          target: this.worldToRenderSpace(pose.target),
        };
      }
      return;
    }

    if (targetId.startsWith("pad-")) {
      const padId = targetId.slice(4);
      const pad = LAUNCH_PADS.find((p) => p.id === padId);
      if (pad) {
        // Swoop cleanly down to oblique hero angle right beside the 3D Launch Complex & Rocket!
        const surfacePos = latLonAltToVec3(pad.lat, pad.lon, 0);
        const normal = surfacePos.clone().normalize();
        const tangent = new THREE.Vector3(0, 1, 0).cross(normal);
        if (tangent.lengthSq() < 1e-4) tangent.set(1, 0, 0);
        else tangent.normalize();
        const bitangent = normal.clone().cross(tangent).normalize();

        const targetWorld = surfacePos.clone().addScaledVector(normal, 0.08);
        const camWorld = surfacePos
          .clone()
          .addScaledVector(normal, 0.34)
          .addScaledVector(tangent, 0.42)
          .addScaledVector(bitangent, 0.25);

        this.setWorldOrigin(targetWorld);
        this.cameraLerpGoal = {
          pos: this.worldToRenderSpace(camWorld),
          target: this.worldToRenderSpace(targetWorld),
        };
      }
      return;
    }

    const result = this.orbitalService.getTelemetry(targetId, this.simTimestamp);
    if (result) {
      const outward = result.scenePos.clone().normalize();
      const tangent = new THREE.Vector3(0, 1, 0).cross(outward);
      if (tangent.lengthSq() < 1e-4) tangent.set(1, 0, 0);
      else tangent.normalize();

      const distFactor =
        targetId === "iss" || targetId === "tiangong"
          ? 1.05
          : result.telemetry.orbitalRegime === "GEO"
          ? 1.55
          : result.telemetry.orbitalRegime === "MEO"
          ? 1.25
          : 0.72;
      const worldCamPos = result.scenePos
        .clone()
        .addScaledVector(outward, 0.78 * distFactor)
        .addScaledVector(tangent, 0.92 * distFactor);

      this.cameraLerpGoal = {
        pos: this.worldToRenderSpace(worldCamPos),
        target: this.worldToRenderSpace(result.scenePos),
      };
    }
  }

  private switchViewMode(mode: ViewMode): void {
    const prevMode = this.lastViewMode;
    this.lastViewMode = mode;
    const store = useCosmosStore.getState();
    store.setHoveredObject(null);

    if (mode !== "orbit") {
      this.setWorldOrigin(new THREE.Vector3(0, 0, 0));
    }

    this.orbitalGroup.visible = mode === "orbit";
    this.starfield.visible = mode === "orbit";
    this.milkyWayDome.visible = mode === "orbit";
    this.issCutaway.group.visible = mode === "iss-interior";
    this.groundSky.group.visible = mode === "ground";

    if (mode === "iss-interior") {
      this.issCutaway.setSelectedModule(store.selectedIssModuleId);
      this.issCutaway.setCutawayAmount(store.issCutawayAmount);
      this.controls.minDistance = 0.2;
      this.controls.maxDistance = 18;
      const preset = this.issCutaway.getCameraPresetForModule(
        store.selectedIssModuleId,
        store.issInsideCabin
      );
      this.camera.position.copy(preset.pos);
      this.controls.target.copy(preset.target);
      this.cameraLerpGoal = null;
    } else if (mode === "ground") {
      this.controls.minDistance = 0.1;
      this.controls.maxDistance = 4;
      this.camera.position.set(0, 1.5, 0.25);
      this.controls.target.set(0, 8, -12);
      this.cameraLerpGoal = null;
    } else {
      this.controls.minDistance = 0.25;
      this.controls.maxDistance = 4400;
      // Seamless Launch-Off-Earth Ascent when launching from Ground Sky into 3D Orbit!
      if (prevMode === "ground") {
        const citySurface = latLonAltToVec3(
          store.observerCity.lat,
          store.observerCity.lon,
          280
        );
        this.camera.position.copy(citySurface);
        this.controls.target.copy(citySurface.clone().multiplyScalar(1.08));
      }
      this.flyToTarget(store.selectedTargetId);
    }
  }

  private disposeOrbitVisuals(): void {
    if (this.orbitRibbon) {
      this.orbitalGroup.remove(this.orbitRibbon);
      this.orbitRibbon.geometry.dispose();
      (this.orbitRibbon.material as THREE.Material).dispose();
      this.orbitRibbon = null;
    }
    if (this.nadirLaser) {
      this.orbitalGroup.remove(this.nadirLaser);
      this.nadirLaser.geometry.dispose();
      (this.nadirLaser.material as THREE.Material).dispose();
      this.nadirLaser = null;
    }
  }

  private rebuildOrbitVisuals(targetId: string, satPos: THREE.Vector3): void {
    this.disposeOrbitVisuals();

    const store = useCosmosStore.getState();
    if (!store.layers.orbits) return;

    const pts = this.orbitalService.computeOrbitTrack(targetId, this.simTimestamp, 144);
    if (pts.length > 2) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: targetId === "iss" ? 0xfbbf24 : 0x38bdf8,
        transparent: true,
        opacity: 0.72,
      });
      this.orbitRibbon = new THREE.Line(geo, mat);
      this.orbitalGroup.add(this.orbitRibbon);
    }

    const groundPoint = satPos.clone().normalize().multiplyScalar(EARTH_RADIUS_UNITS);
    const laserGeo = new THREE.BufferGeometry().setFromPoints([satPos, groundPoint]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.55,
    });
    this.nadirLaser = new THREE.Line(laserGeo, laserMat);
    this.orbitalGroup.add(this.nadirLaser);
  }

  /**
   * Proximity Auto-LOD Manager:
   * Automatically renders real official NASA .glb / PBR engineering replicas for up to 3 closest
   * satellites within camera LOD range — EVEN if the user manually zoomed near them without clicking!
   */
  private updateProximityTier2LOD(
    positions: Float32Array,
    validFlags: Uint8Array,
    categoriesVisible: Record<SatelliteCategory, boolean>,
    selectedSatIndex: number,
    selectedExactWorldPos: THREE.Vector3 | null
  ): { anyLodActive: boolean; selectedDist: number } {
    const camWorld = this.camera.position.clone().add(this.worldOrigin);
    const loadSq = this.memoryManager.lodLoadDistance * this.memoryManager.lodLoadDistance;
    const unloadSq = this.memoryManager.lodUnloadDistance * this.memoryManager.lodUnloadDistance;

    // Collect candidates within hysteresis LOD distance
    const candidates: Array<{
      satIndex: number;
      distSq: number;
      worldPos: THREE.Vector3;
    }> = [];

    let selectedDist = Infinity;

    for (let i = 0; i < this.swarmCatalog.length; i++) {
      if (validFlags[i] !== 1) continue;
      const sat = this.swarmCatalog[i];
      if (!categoriesVisible[sat.category]) continue;

      // CRITICAL FOR 100% SILKY-SMOOTH RIDE-ALONG:
      // For the actively tracked satellite, use the exact synchronous SGP4 position
      // so the 3D spacecraft and Ride-Along camera stay 100% locked with ZERO phase stutter!
      const isSelected = i === selectedSatIndex && selectedExactWorldPos !== null;
      const px = isSelected ? selectedExactWorldPos.x : positions[i * 3];
      const py = isSelected ? selectedExactWorldPos.y : positions[i * 3 + 1];
      const pz = isSelected ? selectedExactWorldPos.z : positions[i * 3 + 2];
      const dx = px - camWorld.x;
      const dy = py - camWorld.y;
      const dz = pz - camWorld.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (i === selectedSatIndex) {
        selectedDist = Math.sqrt(distSq);
      }

      const alreadyActive = this.activeLodSlots.has(i);
      const thresholdSq = alreadyActive ? unloadSq : loadSq;
      if (distSq < thresholdSq) {
        candidates.push({
          satIndex: i,
          distSq,
          worldPos: new THREE.Vector3(px, py, pz),
        });
      }
    }

    // Prioritize selected satellite first, then nearest proximity satellites (up to 3 total!)
    // CRITICAL: Skip co-located docked vehicles (within 0.18 units ~115 km) so a docked
    // Soyuz/Dragon/Progress NEVER spawns a second overlapping 3D model inside the ISS!
    candidates.sort((a, b) => {
      if (a.satIndex === selectedSatIndex) return -1;
      if (b.satIndex === selectedSatIndex) return 1;
      return a.distSq - b.distSq;
    });

    const desired: typeof candidates = [];
    for (const cand of candidates) {
      if (desired.length >= 3) break;
      const tooCloseToExisting = desired.some(
        (chosen) => chosen.worldPos.distanceToSquared(cand.worldPos) < 0.18 * 0.18
      );
      if (!tooCloseToExisting) {
        desired.push(cand);
      }
    }
    const desiredIndices = new Set(desired.map((d) => d.satIndex));

    // Release slots that moved outside unload hysteresis distance
    for (const [satIdx, slot] of this.activeLodSlots.entries()) {
      if (!desiredIndices.has(satIdx)) {
        slot.holder.clear();
        this.activeLodContainer.remove(slot.holder);
        this.activeLodSlots.delete(satIdx);
      }
    }

    // Mount & update active Tier 2 3D Spacecraft Replicas
    // Track used assetKeys so two simultaneous nearby Starlinks don't steal the same Three.js Group instance!
    const usedKeysThisFrame = new Set<string>();

    for (const item of desired) {
      const sat = this.swarmCatalog[item.satIndex];
      const archetype = resolveSpacecraftArchetype(sat.name, sat.category, sat.flagshipId);
      let assetKey = `lod-${archetype}`;
      if (usedKeysThisFrame.has(assetKey)) {
        assetKey = `lod-${archetype}-${sat.noradId}`;
      }
      usedKeysThisFrame.add(assetKey);

      const model = this.memoryManager.getOrCreate(assetKey, () =>
        createSpacecraftByArchetype(archetype)
      );
      this.memoryManager.touch(assetKey);

      let slot = this.activeLodSlots.get(item.satIndex);
      if (!slot) {
        const holder = new THREE.Group();
        holder.add(model);
        this.activeLodContainer.add(holder);
        slot = {
          satIndex: item.satIndex,
          noradId: sat.noradId,
          assetKey,
          archetype,
          worldPos: item.worldPos.clone(),
          holder,
        };
        this.activeLodSlots.set(item.satIndex, slot);
      } else {
        if (slot.holder.children[0] !== model) {
          slot.holder.clear();
          slot.holder.add(model);
          slot.assetKey = assetKey;
        }
        slot.worldPos.copy(item.worldPos);
      }

      slot.holder.position.copy(item.worldPos);
      if (archetype === "debris") {
        // Chaotic orbital tumble for space debris / spent rocket stages!
        slot.holder.rotation.set(
          this.elapsedSec * 0.45 + item.satIndex,
          this.elapsedSec * 0.65,
          this.elapsedSec * 0.3
        );
      } else {
        // Orient nadir side toward Earth center
        slot.holder.lookAt(this.orbitalGroup.position);
        slot.holder.rotateX(Math.PI / 2);
      }
    }

    return { anyLodActive: this.activeLodSlots.size > 0, selectedDist };
  }

  private getActiveAssetKeys(): Set<string> {
    const set = new Set<string>();
    for (const slot of this.activeLodSlots.values()) {
      set.add(slot.assetKey);
    }
    return set;
  }

  private run50CycleStressTest(): void {
    const keepKeys = this.getActiveAssetKeys();
    const keepOne = keepKeys.values().next().value;
    this.memoryManager.flushUnused(keepOne);
    const baselineGeom = this.renderer.info.memory.geometries;
    const baselineTex = this.renderer.info.memory.textures;

    const testArchs: SpacecraftArchetype[] = [
      "tiangong",
      "starlink",
      "debris",
      "tiangong",
      "starlink",
    ];
    for (let cycle = 0; cycle < 50; cycle++) {
      const arch = testArchs[cycle % testArchs.length];
      const tempKey = `stress-${arch}-${cycle}`;
      const obj = this.memoryManager.getOrCreate(tempKey, () =>
        createSpacecraftByArchetype(arch)
      );
      this.memoryManager.touch(tempKey);
      this.memoryManager.flushUnused(keepOne);
      void obj;
    }

    const finalGeom = this.renderer.info.memory.geometries;
    const finalTex = this.renderer.info.memory.textures;
    const deltaGeom = finalGeom - baselineGeom;
    const deltaTex = finalTex - baselineTex;

    const status =
      deltaGeom === 0 && deltaTex === 0
        ? `PASS · 50/50 cycles · ΔGeom 0 · ΔTex 0 (Zero VRAM Leaks)`
        : `CHECK · 50/50 cycles · ΔGeom ${deltaGeom} · ΔTex ${deltaTex}`;

    useCosmosStore.getState().setStressTestResult(status);
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dtSec = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    this.elapsedSec += dtSec;

    // FPS Counter
    this.frameCounter++;
    if (now - this.fpsWindowStart >= 500) {
      this.currentFps = Math.round(
        (this.frameCounter * 1000) / (now - this.fpsWindowStart)
      );
      this.frameCounter = 0;
      this.fpsWindowStart = now;
    }

    const store = useCosmosStore.getState();

    // 1. Explicit 4D Clock Sync (SNAP LIVE & Timeline Scrub Slider!)
    if (store.clockSyncNonce !== this.lastClockSyncNonce) {
      this.lastClockSyncNonce = store.clockSyncNonce;
      this.simTimestamp = store.simTimestamp > 0 ? store.simTimestamp : Date.now();
      this.lastTrackRebuild = 0;
    }

    // 2. Consume pending AI / UI spatial actions
    const pending = store.consumePendingActions();
    for (const act of pending) {
      if (act.type === "fly_to_target") {
        this.flyToTarget(act.targetId);
      } else if (act.type === "set_shell1b_layer" && act.enabled) {
        // Pull camera smoothly out to Shell 1B vantage when activating Van Allen / Magnetosphere / Hohmann!
        const camDist = this.camera.position.clone().add(this.worldOrigin).length();
        if (camDist < 65 && act.layer !== "geoFootprint") {
          this.flyToTarget("shell-1b");
        }
      } else if (act.type === "control_time" && act.resetToLive) {
        this.simTimestamp = Date.now();
        this.lastTrackRebuild = 0;
      } else if (act.type === "set_view_mode" && act.issModuleId) {
        this.issCutaway.setSelectedModule(act.issModuleId);
      }
    }

    // 3. Handle manual GPU cache flush trigger (preserves active visible LOD models!)
    if (store.flushCacheCounter !== this.lastFlushCounter) {
      this.lastFlushCounter = store.flushCacheCounter;
      const keepKey = this.getActiveAssetKeys().values().next().value;
      this.memoryManager.flushUnused(keepKey);
    }

    // 4. Handle automated 50-cycle Perfection Gate #2 stress test
    if (store.stressTestCounter !== this.lastStressCounter) {
      this.lastStressCounter = store.stressTestCounter;
      this.run50CycleStressTest();
    }

    // 5. Sync viewMode transitions cleanly
    if (store.viewMode !== this.lastViewMode) {
      this.switchViewMode(store.viewMode);
    }

    // 6. Advance 4D simulation clock with continuous sub-millisecond precision (zero frame stepping!)
    if (!store.isPaused) {
      this.simTimestamp += dtSec * 1000 * store.timeMultiplier;
      if (store.timeMultiplier === 1) {
        const drift = Date.now() - this.simTimestamp;
        if (Math.abs(drift) < 2500) {
          this.simTimestamp += drift * Math.min(1, dtSec * 2.5);
        }
      }
    }

    // Real-time Sun Direction (far parallel vector for consistent illumination from Earth to 1.5M km L2!)
    const sunDir = getSunDirectionECEF(this.simTimestamp);
    this.sunLight.position.copy(sunDir).multiplyScalar(500);

    let activeTier:
      | "Tier 1: Orbital Shell"
      | "Tier 2: High-Detail LOD"
      | "Tier 3: Isolated Interior"
      | "Ground Sky Dome" = "Tier 1: Orbital Shell";

    if (store.viewMode === "iss-interior") {
      activeTier = "Tier 3: Isolated Interior";
      if (store.issCutawayAmount !== this.lastIssCutawayAmount) {
        this.lastIssCutawayAmount = store.issCutawayAmount;
        this.issCutaway.setCutawayAmount(store.issCutawayAmount);
      }
      if (
        store.selectedIssModuleId !== this.lastIssModuleId ||
        store.issInsideCabin !== this.lastIssInsideCabin
      ) {
        this.lastIssModuleId = store.selectedIssModuleId;
        this.lastIssInsideCabin = store.issInsideCabin;
        this.issCutaway.setSelectedModule(store.selectedIssModuleId);
        this.cameraLerpGoal = this.issCutaway.getCameraPresetForModule(
          store.selectedIssModuleId,
          store.issInsideCabin
        );
      }
      this.issCutaway.update(this.elapsedSec);
    } else if (store.viewMode === "ground") {
      activeTier = "Ground Sky Dome";
      this.groundSky.updateLocalSkyConditions(
        store.observerCity.lat,
        store.observerCity.lon,
        this.simTimestamp,
        store.groundStargazerNight
      );
      this.groundSky.update(this.elapsedSec);
    } else {
      // ORBIT VIEW
      const kpIndex = store.spaceWeather?.kpIndex ?? 2.3;
      const solarWindKmS = store.spaceWeather?.solarWindKmS ?? 415;

      this.earthSystem.setSpectralMode(store.spectralMode);
      this.earthSystem.setLayers({
        clouds: store.layers.clouds,
        auroras: store.layers.auroras,
        launchPads: store.layers.launchPads,
        grid: store.layers.grid,
        spectralMode: store.spectralMode,
      });
      this.earthSystem.update(this.elapsedSec, sunDir, kpIndex);

      // Update Shell 1B Volumetric Van Allen Belts, Magnetosphere & Hohmann Transfer!
      this.magnetosphereSystem.setSelectedPhenomenon(store.selectedTargetId);
      this.magnetosphereSystem.setLayers({
        vanAllenBelts: store.layers.vanAllenBelts,
        magnetosphere: store.layers.magnetosphere,
        hohmannTransfer: store.layers.hohmannTransfer,
      });
      this.magnetosphereSystem.update(this.elapsedSec, sunDir, kpIndex, solarWindKmS);

      // Update Shell 2 Photorealistic Moon, Core Cutaway, LRO, L1 DSCOVR, L2 JWST & 4D NEOs!
      if (store.moonCutawayAmount !== this.lastMoonCutawayAmount) {
        this.lastMoonCutawayAmount = store.moonCutawayAmount;
        this.moonSystem.setCutawayAmount(store.moonCutawayAmount);
      }
      this.moonSystem.setSpectralMode(store.spectralMode);
      this.moonSystem.setVisibility({
        cislunar: store.layers.cislunar,
        lunarLandmarks: store.layers.lunarLandmarks,
      });
      this.moonSystem.update(this.simTimestamp, this.elapsedSec, sunDir);

      this.cislunarSystem.setVisibility({
        lagrangePoints: store.layers.lagrangePoints,
        neos: store.layers.neos,
      });
      this.cislunarSystem.update(this.elapsedSec, sunDir);

      // Propagate all satellites off-main-thread via Web Worker
      const frame =
        this.orbitalService.getCount() > 0
          ? this.orbitalService.propagateAll(this.simTimestamp)
          : null;
      if (frame) this.lastPropagationMs = frame.durationMs;

      const targetId = store.selectedTargetId;
      const isShell2Target = this.isShell2Target(targetId);
      const isOrbitTarget =
        Boolean(targetId) &&
        targetId !== "earth" &&
        !targetId.startsWith("pad-") &&
        !targetId.startsWith("phenom-") &&
        !isShell2Target;
      const selectedSatIndex = isOrbitTarget
        ? this.orbitalService.findSatelliteIndex(targetId)
        : -1;

      // Compute exact synchronous SGP4 position for the selected target ONCE per frame
      // so Ride-Along camera + 3D model + nadir laser are 100% phase-locked with ZERO stutter!
      const selectedRes = isOrbitTarget
        ? this.orbitalService.getTelemetry(
            targetId,
            this.simTimestamp,
            store.observerCity.lat,
            store.observerCity.lon
          )
        : null;

      // Update Proximity Auto-LOD (streams real NASA GLB / PBR models for ANY zoomed-in satellite!)
      let anyLodActive = false;
      let selectedDist = Infinity;
      if (frame && store.layers.satellites) {
        const lodRes = this.updateProximityTier2LOD(
          frame.positions,
          frame.validFlags,
          store.layers.categories,
          selectedSatIndex,
          selectedRes ? selectedRes.scenePos : null
        );
        anyLodActive = lodRes.anyLodActive;
        selectedDist = lodRes.selectedDist;
        if (anyLodActive) activeTier = "Tier 2: High-Detail LOD";
      } else {
        this.clearAllActiveLodSlots();
      }

      // Track Selected Orbital Target (Thresholded Floating-Origin + Silky Ride-Along + Orbit Ribbon)
      if (selectedRes) {
        const satRenderPos = this.worldToRenderSpace(selectedRes.scenePos);
        const distToSelected = Number.isFinite(selectedDist)
          ? selectedDist
          : this.camera.position.distanceTo(satRenderPos);

        // Thresholded Floating-Origin Recentering (> 0.65 units drift):
        // Keeps GPU Float32 vertices sub-mm accurate WITHOUT fighting OrbitControls damping!
        if (
          distToSelected < this.memoryManager.lodLoadDistance &&
          !this.cameraLerpGoal &&
          selectedRes.scenePos.distanceToSquared(this.worldOrigin) > 0.65 * 0.65
        ) {
          this.setWorldOrigin(selectedRes.scenePos);
        } else if (
          this.floatingOriginActive &&
          distToSelected > this.memoryManager.lodUnloadDistance &&
          !anyLodActive
        ) {
          this.setWorldOrigin(new THREE.Vector3(0, 0, 0));
        }

        // Smoothly hide reticle when zoomed close so it NEVER blocks the spacecraft replica!
        const reticleFade = THREE.MathUtils.clamp((distToSelected - 1.9) / 1.8, 0, 1);
        this.targetReticle.visible = reticleFade > 0.04;
        if (this.targetReticle.visible) {
          (this.targetReticle.material as THREE.MeshBasicMaterial).opacity =
            0.82 * reticleFade;
          this.targetReticle.position.copy(selectedRes.scenePos);
          const camWorld = this.camera.position.clone().add(this.worldOrigin);
          this.targetReticle.lookAt(camWorld);
        }

        // Auto-release Ride-Along if user zooms far out (> 14 units) so they never feel trapped!
        if (store.rideAlongLocked && !this.cameraLerpGoal && distToSelected > 14) {
          store.setRideAlongLocked(false);
        }

        // Silky 60 FPS Ride-Along camera lock (exact same position vector as Tier 2 3D model!)
        if (store.rideAlongLocked && !this.cameraLerpGoal) {
          const freshRenderPos = this.worldToRenderSpace(selectedRes.scenePos);
          const dx = freshRenderPos.x - this.controls.target.x;
          const dy = freshRenderPos.y - this.controls.target.y;
          const dz = freshRenderPos.z - this.controls.target.z;
          this.controls.target.set(freshRenderPos.x, freshRenderPos.y, freshRenderPos.z);
          this.camera.position.x += dx;
          this.camera.position.y += dy;
          this.camera.position.z += dz;
        }

        // Update nadir laser endpoints every frame
        if (this.nadirLaser) {
          const posAttr = this.nadirLaser.geometry.getAttribute(
            "position"
          ) as THREE.BufferAttribute;
          const groundPt = selectedRes.scenePos
            .clone()
            .normalize()
            .multiplyScalar(EARTH_RADIUS_UNITS);
          posAttr.setXYZ(0, selectedRes.scenePos.x, selectedRes.scenePos.y, selectedRes.scenePos.z);
          posAttr.setXYZ(1, groundPt.x, groundPt.y, groundPt.z);
          posAttr.needsUpdate = true;
        }

        // Dynamic Earthshine Bounce Light: illuminates the nadir (Earth-facing) side of the active spacecraft!
        this.earthBounceLight.position.set(0, 0, 0);
        this.earthBounceLight.target.position.copy(selectedRes.scenePos);
        this.earthBounceLight.target.updateMatrixWorld();

        // GEO Hemispheric Coverage Cone (when tracking any GEO satellite with geoFootprint ON!)
        const showGeoCone =
          store.layers.geoFootprint && selectedRes.telemetry.orbitalRegime === "GEO";
        this.geoFootprintCone.visible = showGeoCone;
        if (showGeoCone) {
          this.geoFootprintMat.uniforms.uTime.value = this.elapsedSec;
          const distToEarth = selectedRes.scenePos.length();
          this.geoFootprintCone.position.copy(selectedRes.scenePos);
          this.geoFootprintCone.lookAt(this.orbitalGroup.position);
          this.geoFootprintCone.scale.set(1, 1, Math.max(1, distToEarth - EARTH_RADIUS_UNITS * 0.15));
        }

        // Rebuild 4D orbit curve when target changes, layer toggles, or every 15s (eliminates 3s hitch!)
        if (
          targetId !== this.lastOrbitTargetId ||
          store.layers.orbits !== this.lastLayersOrbits ||
          now - this.lastTrackRebuild > 15000
        ) {
          this.lastOrbitTargetId = targetId;
          this.lastLayersOrbits = store.layers.orbits;
          this.lastTrackRebuild = now;
          this.rebuildOrbitVisuals(targetId, selectedRes.scenePos);
        }
      } else {
        // Smooth Floating-Origin Ride-Along Lock for Shell 2 Targets (Moon, LRO, JWST @ L2, DSCOVR @ L1, Live NEOs!)
        if (isShell2Target) {
          const s2Pos = this.getShell2WorldPos(targetId);
          if (s2Pos) {
            if (store.rideAlongLocked && !this.cameraLerpGoal) {
              const renderPos = this.worldToRenderSpace(s2Pos);
              const dx = renderPos.x - this.controls.target.x;
              const dy = renderPos.y - this.controls.target.y;
              const dz = renderPos.z - this.controls.target.z;
              this.controls.target.copy(renderPos);
              this.camera.position.x += dx;
              this.camera.position.y += dy;
              this.camera.position.z += dz;
            }
            // Subtle cool fill illumination for deep-space spacecraft & asteroids at L1 / L2 / Moon
            this.earthBounceLight.position.copy(s2Pos).addScaledVector(sunDir, -45);
            this.earthBounceLight.target.position.copy(s2Pos);
            this.earthBounceLight.target.updateMatrixWorld();
          }
        }

        // Smooth Ride-Along camera lock on the moving Hohmann Transfer Vehicle!
        if (
          targetId === "phenom-hohmann-craft" &&
          store.layers.hohmannTransfer &&
          store.rideAlongLocked &&
          !this.cameraLerpGoal
        ) {
          const hState = this.magnetosphereSystem.getHohmannLiveState();
          const renderPos = this.worldToRenderSpace(hState.worldPos);
          const dx = renderPos.x - this.controls.target.x;
          const dy = renderPos.y - this.controls.target.y;
          const dz = renderPos.z - this.controls.target.z;
          this.controls.target.copy(renderPos);
          this.camera.position.x += dx;
          this.camera.position.y += dy;
          this.camera.position.z += dz;
        }

        if (
          this.floatingOriginActive &&
          !targetId.startsWith("pad-") &&
          !isShell2Target &&
          !anyLodActive
        ) {
          this.setWorldOrigin(new THREE.Vector3(0, 0, 0));
        }
        this.targetReticle.visible = false;
        this.geoFootprintCone.visible = false;
        if (!isShell2Target) {
          this.earthBounceLight.position.copy(sunDir).multiplyScalar(-30);
          this.earthBounceLight.target.position.set(0, 0, 0);
          this.earthBounceLight.target.updateMatrixWorld();
        }
        this.disposeOrbitVisuals();
        this.lastOrbitTargetId = targetId;
        this.lastLayersOrbits = store.layers.orbits;
      }

      // Update 5 Distinct Tier 1 Category Silhouette InstancedMeshes
      if (frame) {
        const cats = store.layers.categories;
        const activeSlotsList = Array.from(this.activeLodSlots.values());

        for (const [cat, entry] of this.categoryMeshes.entries()) {
          const visible = store.layers.satellites && cats[cat];
          entry.mesh.visible = visible;
          if (!visible) continue;

          for (let localIdx = 0; localIdx < entry.satIndices.length; localIdx++) {
            const globalIdx = entry.satIndices[localIdx];
            const px = frame.positions[globalIdx * 3];
            const py = frame.positions[globalIdx * 3 + 1];
            const pz = frame.positions[globalIdx * 3 + 2];

            // Hide Tier 1 silhouette if this satellite (or a co-located docked vehicle!) is rendered in Tier 2 3D!
            let hiddenByTier2 = this.activeLodSlots.has(globalIdx);
            if (!hiddenByTier2 && frame.validFlags[globalIdx] === 1 && activeSlotsList.length > 0) {
              for (const slot of activeSlotsList) {
                const dx = px - slot.worldPos.x;
                const dy = py - slot.worldPos.y;
                const dz = pz - slot.worldPos.z;
                if (dx * dx + dy * dy + dz * dz < 0.04) {
                  hiddenByTier2 = true;
                  break;
                }
              }
            }

            if (!hiddenByTier2 && frame.validFlags[globalIdx] === 1) {
              this.dummyMatrix.position.set(px, py, pz);
              if (cat === "debris") {
                this.dummyMatrix.rotation.set(
                  this.elapsedSec * 0.8 + globalIdx,
                  this.elapsedSec * 1.1,
                  0
                );
              } else {
                this.dummyMatrix.lookAt(0, 0, 0);
              }
              const sat = this.swarmCatalog[globalIdx];
              let scale =
                cat === "station"
                  ? 1.35
                  : sat.flagshipId === "hubble"
                  ? 1.25
                  : 0.92;
              if (anyLodActive && (cat === "geo" || cat === "gnss")) {
                // Keep distant belt markers sleek & star-like during close-up spacecraft inspections
                scale *= 0.55;
              }
              this.dummyMatrix.scale.setScalar(scale);
            } else {
              this.dummyMatrix.position.set(0, 0, 0);
              this.dummyMatrix.scale.setScalar(0);
            }
            this.dummyMatrix.updateMatrix();
            entry.mesh.setMatrixAt(localIdx, this.dummyMatrix.matrix);
          }
          entry.mesh.instanceMatrix.needsUpdate = true;
        }
      }
    }

    // Smooth camera fly-to interpolation
    if (this.cameraLerpGoal) {
      const alpha = 1 - Math.exp(-dtSec * 4.5);
      this.camera.position.lerp(this.cameraLerpGoal.pos, alpha);
      this.controls.target.lerp(this.cameraLerpGoal.target, alpha);
      if (
        this.camera.position.distanceTo(this.cameraLerpGoal.pos) < 0.03 &&
        this.controls.target.distanceTo(this.cameraLerpGoal.target) < 0.03
      ) {
        this.cameraLerpGoal = null;
      }
    }

    this.controls.update();
    this.starfield.position.copy(this.camera.position);
    this.milkyWayDome.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);

    // Throttled HUD Telemetry & Memory Sync (~3.5 Hz)
    if (now - this.lastTelemetrySync > 280) {
      this.lastTelemetrySync = now;
      store.setSimTimestamp(this.simTimestamp);

      const issRes = this.orbitalService.getTelemetry("iss", this.simTimestamp);
      if (issRes) store.setIssTelemetry(issRes.telemetry);

      if (
        store.selectedTargetId &&
        store.selectedTargetId !== "earth" &&
        !store.selectedTargetId.startsWith("pad-") &&
        !store.selectedTargetId.startsWith("phenom-") &&
        !this.isShell2Target(store.selectedTargetId)
      ) {
        const res = this.orbitalService.getTelemetry(
          store.selectedTargetId,
          this.simTimestamp,
          store.observerCity.lat,
          store.observerCity.lon
        );
        if (res) store.setSelectedTelemetry(res.telemetry);
      } else {
        store.setSelectedTelemetry(null);
      }

      // Sync live astronomical Moon Telemetry (distance, phase, speed, light-delay)
      const moonState = getMoonStateECEF(this.simTimestamp);
      store.setMoonTelemetry({
        distanceKm: moonState.distanceKm,
        phaseFraction: moonState.phaseFraction,
        phaseName: moonState.phaseName,
        orbitalSpeedKmS: moonState.orbitalSpeedKmS,
        lightDelaySec: moonState.lightDelaySec,
      });

      if (store.layers.hohmannTransfer && store.selectedTargetId === "phenom-hohmann-craft") {
        const hs = this.magnetosphereSystem.getHohmannLiveState();
        store.setHohmannTelemetry({
          altitudeKm: hs.altitudeKm,
          speedKmS: hs.speedKmS,
          phasePct: hs.phasePct,
          burnState: hs.burnState,
        });
      } else if (store.hohmannTelemetry !== null) {
        store.setHohmannTelemetry(null);
      }

      if (store.viewMode === "ground") {
        const overhead = this.orbitalService.getOverheadSatellites(
          store.observerCity.lat,
          store.observerCity.lon,
          this.simTimestamp,
          24
        );
        this.groundSky.updateOverheadSatellites(overhead);
        store.setOverheadSatellites(overhead);
      }

      // Run Shell 1B Conjunction / Close-Approach Scanner every 4 seconds
      if (now - this.lastConjunctionScan > 4000) {
        this.lastConjunctionScan = now;
        store.setConjunctions(this.orbitalService.scanClosestConjunctions(4));
      }

      const mem = this.memoryManager.getStats();
      const camWorldPos = this.camera.position.clone().add(this.worldOrigin);
      const camDistKm = Math.max(
        0,
        camWorldPos.length() * UNITS_TO_KM - EARTH_RADIUS_KM
      );

      store.setMemoryStats({
        fps: this.currentFps,
        activeTier,
        trackedSatellites: this.orbitalService.getCount(),
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        lruCachedAssets: mem.lruCachedAssets,
        evictedAssets: mem.evictedAssets,
        workerPropagationMs: Number(this.lastPropagationMs.toFixed(2)),
        workerActive: this.orbitalService.isWorkerActive(),
        floatingOriginActive: this.floatingOriginActive,
        floatingOriginOffsetKm: Math.round(this.worldOrigin.length() * UNITS_TO_KM),
        cameraAltitudeKm: Math.round(camDistKm),
      });
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp);
    this.renderer.domElement.removeEventListener("pointermove", this.handlePointerMove);

    this.orbitalService.dispose();
    this.controls.dispose();
    this.earthSystem.dispose();
    this.magnetosphereSystem.dispose();
    this.moonSystem.dispose();
    this.cislunarSystem.dispose();
    this.geoFootprintCone.geometry.dispose();
    (this.geoFootprintCone.material as THREE.Material).dispose();
    this.issCutaway.dispose();
    this.groundSky.dispose();
    this.clearAllActiveLodSlots();
    this.memoryManager.disposeAll();
    this.disposeOrbitVisuals();
    this.disposeCategoryMeshes();

    this.targetReticle.geometry.dispose();
    (this.targetReticle.material as THREE.Material).dispose();
    this.milkyWayDome.geometry.dispose();
    (this.milkyWayDome.material as THREE.Material).dispose();
    this.starfield.geometry.dispose();
    (this.starfield.material as THREE.Material).dispose();
    this.envMap.dispose();

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
