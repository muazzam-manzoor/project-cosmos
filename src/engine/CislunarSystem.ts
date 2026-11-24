import * as THREE from "three";
import { NearEarthAsteroid } from "@/types/cosmos";
import { getSharedGltfLoader } from "./sharedGltfLoader";
import { DEG2RAD, KM_TO_UNITS, L1_L2_DISTANCE_KM } from "./geoMath";
import {
  getGoldKaptonMaps,
  getSolarArrayMaps,
  getSpacecraftHullMaps,
} from "./PBRTextureFactory";

const sharedCislunarLoader = getSharedGltfLoader();
const L1_L2_UNITS = L1_L2_DISTANCE_KM * KM_TO_UNITS; // ~2,354.4 scene units (true 1:1 scale!)

interface NeoRuntimeEntry {
  neo: NearEarthAsteroid;
  holder: THREE.Group;
  bodyMesh: THREE.Object3D;
  hitMesh: THREE.Mesh;
  arcLine: THREE.Line;
  baseRadiusUnits: number;
  inclinationRad: number;
  azimuthRad: number;
  speedScale: number;
  worldPos: THREE.Vector3;
}

/**
 * Generates a unique, realistic sculpted 3D irregular asteroid mesh (spherical harmonics + crater dimples)
 * colored by spectral class (C/B-Type dark carbonaceous, S-Type stony silicate, M-Type metallic iron-nickel).
 */
function createProceduralAsteroidMesh(neo: NearEarthAsteroid): THREE.Mesh {
  const seed = Number(neo.neoReferenceId.replace(/\D/g, "")) || 1337;
  const isBiLobed = neo.id === "neo-apophis" || seed % 3 === 0;
  const geo = new THREE.IcosahedronGeometry(0.45, 3);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    // Multi-frequency rocky harmonic displacement
    let r =
      1.0 +
      0.22 * Math.sin(dir.x * 3.1 + seed * 0.13) * Math.cos(dir.y * 2.7) +
      0.14 * Math.cos(dir.z * 5.2 + seed * 0.37) +
      0.08 * Math.sin((dir.x + dir.y + dir.z) * 9.0 + seed);
    if (isBiLobed) {
      // Peanut / bi-lobed contact-binary silhouette (like Apophis & Itokawa!)
      r *= 0.82 + 0.36 * Math.abs(dir.x);
      v.set(dir.x * r * 1.38, dir.y * r * 0.78, dir.z * r * 0.85);
    } else {
      v.copy(dir).multiplyScalar(r * 0.45);
    }
    if (isBiLobed) v.multiplyScalar(0.45);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  const spec = neo.spectralType.toLowerCase();
  const color = spec.includes("m-type")
    ? 0x9ca3af
    : spec.includes("s-type") || spec.includes("sq-type")
    ? 0xa89b8c
    : 0x57534e; // Dark carbonaceous C/B-type
  const metalness = spec.includes("m-type") ? 0.65 : 0.14;
  const roughness = spec.includes("m-type") ? 0.42 : 0.88;

  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    flatShading: false,
  });
  return new THREE.Mesh(geo, mat);
}

/**
 * Shell 2 Cislunar & Earth Neighborhood System (40,000 km -> 1.5 Million km):
 * 1. Sun–Earth L1 (+1.5M km Sunward): Official NASA DSCOVR 3D CAD + Halo Orbit + Solar Wind Buoy
 * 2. Sun–Earth L2 (-1.5M km Anti-Sunward): Official NASA JWST 3D CAD + 5-Layer Kapton Thermal Gradient + Halo Orbit
 * 3. Live 4D Near-Earth Asteroids (NEOs): Official NASA Bennu 3D GLB + Procedural Spectral Reconstructions
 *    propagated along real close-approach flyby arcs around Earth-Moon space!
 */
export class CislunarSystem {
  public readonly group = new THREE.Group();

  // Lagrange Points Sub-Group (rotated dynamically along live Earth-Sun line!)
  private lagrangeRoot = new THREE.Group();
  private l1Anchor = new THREE.Group();
  private l2Anchor = new THREE.Group();

  private dscovrHolder = new THREE.Group();
  private dscovrHit: THREE.Mesh;
  private jwstHolder = new THREE.Group();
  private jwstHit: THREE.Mesh;
  private thermalGlowRing: THREE.Mesh;

  // Live world positions for Floating-Origin focus & Ride-Along tracking
  public l1WorldPos = new THREE.Vector3(L1_L2_UNITS, 0, 0);
  public l2WorldPos = new THREE.Vector3(-L1_L2_UNITS, 0, 0);
  public dscovrWorldPos = new THREE.Vector3(L1_L2_UNITS, 0, 0);
  public jwstWorldPos = new THREE.Vector3(-L1_L2_UNITS, 0, 0);

  // Near-Earth Asteroids Sub-Group
  private neoGroup = new THREE.Group();
  private neoEntries: NeoRuntimeEntry[] = [];
  private disposed = false;

  constructor() {
    // 1. LAGRANGE L1 & L2 AXIS + HALO ORBITS (+X = Sunward L1, -X = Anti-Sunward L2)
    this.buildLagrangeGeometry();
    const { dscovrHit, jwstHit, thermalRing } = this.buildLagrangeSpacecraft();
    this.dscovrHit = dscovrHit;
    this.jwstHit = jwstHit;
    this.thermalGlowRing = thermalRing;

    this.group.add(this.lagrangeRoot);
    this.group.add(this.neoGroup);
  }

  private buildLagrangeGeometry(): void {
    // Subtle Sun-Earth L1 <-> Earth <-> L2 gravitational axis line
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-L1_L2_UNITS * 1.06, 0, 0),
      new THREE.Vector3(L1_L2_UNITS * 1.06, 0, 0),
    ]);
    const axisLine = new THREE.Line(
      axisGeo,
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
      })
    );
    this.lagrangeRoot.add(axisLine);

    // L1 Anchor (+X = +1,500,000 km Sunward)
    this.l1Anchor.position.set(L1_L2_UNITS, 0, 0);
    const l1HaloPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      l1HaloPts.push(new THREE.Vector3(Math.sin(a) * 18, Math.sin(a) * 46, Math.cos(a) * 78));
    }
    this.l1Anchor.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(l1HaloPts),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42 })
      )
    );
    const l1Saddle = new THREE.Mesh(
      new THREE.RingGeometry(10, 14, 32),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    l1Saddle.rotation.y = Math.PI / 2;
    this.l1Anchor.add(l1Saddle);
    this.lagrangeRoot.add(this.l1Anchor);

    // L2 Anchor (-X = -1,500,000 km Anti-Sunward)
    this.l2Anchor.position.set(-L1_L2_UNITS, 0, 0);
    const l2HaloPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      l2HaloPts.push(new THREE.Vector3(Math.sin(a) * 24, Math.sin(a) * 62, Math.cos(a) * 105));
    }
    this.l2Anchor.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(l2HaloPts),
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.46 })
      )
    );
    const l2Saddle = new THREE.Mesh(
      new THREE.RingGeometry(12, 16.5, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    l2Saddle.rotation.y = Math.PI / 2;
    this.l2Anchor.add(l2Saddle);
    this.lagrangeRoot.add(this.l2Anchor);
  }

  private buildLagrangeSpacecraft() {
    const kapton = getGoldKaptonMaps();
    const solar = getSolarArrayMaps("blue-gaas");
    const hull = getSpacecraftHullMaps();

    // --- 1. DSCOVR (L1) ---
    const dscovrSeed = new THREE.Group();
    const dBus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.34, 8),
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        bumpMap: kapton.bumpMap,
        color: 0xfbbf24,
        metalness: 0.68,
        roughness: 0.3,
      })
    );
    const dWings = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.01, 0.22),
      new THREE.MeshStandardMaterial({
        map: solar.map,
        color: 0xdbeafe,
        metalness: 0.55,
        roughness: 0.22,
        side: THREE.DoubleSide,
      })
    );
    dscovrSeed.add(dBus, dWings);
    this.dscovrHolder.add(dscovrSeed);

    sharedCislunarLoader.load(
      "/models/dscovr.glb",
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const scale = 1.05 / Math.max(size.x, size.y, size.z, 1e-4);
        model.position.copy(center).multiplyScalar(-scale);
        model.scale.setScalar(scale);

        model.traverse((n) => {
          const m = n as THREE.Mesh;
          if (!m.isMesh || !m.material) return;
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          const hasUV = Boolean(m.geometry?.attributes?.uv);
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMapIntensity = 2.0;
              const name = `${m.name} ${mat.name}`.toLowerCase();
              if (!mat.map && hasUV) {
                if (name.includes("solar") || name.includes("panel")) {
                  mat.map = solar.map;
                  mat.color.setHex(0xcfe8ff);
                } else if (name.includes("gold") || name.includes("foil")) {
                  mat.map = kapton.map;
                  mat.bumpMap = kapton.bumpMap;
                  mat.color.setHex(0xfbbf24);
                } else if (mat.color.r < 0.22 && mat.color.g < 0.22 && mat.color.b < 0.22) {
                  mat.map = hull.map;
                  mat.color.setHex(0xe2e8f0);
                }
              }
              mat.needsUpdate = true;
            }
          }
        });
        this.dscovrHolder.remove(dscovrSeed);
        this.dscovrHolder.add(model);
      },
      undefined,
      () => {}
    );

    const dscovrHit = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 12, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    dscovrHit.userData = {
      targetId: "dscovr",
      label: "DSCOVR & SOHO (Sun–Earth L1)",
      sub: "Official NASA 3D GLB · +1.5M km Sunward · Live Solar Wind & EPIC Earth",
    };
    this.dscovrHolder.add(dscovrHit);
    this.l1Anchor.add(this.dscovrHolder);

    // --- 2. JAMES WEBB SPACE TELESCOPE (L2) ---
    const jwstSeed = new THREE.Group();
    // Iconic 5-Layer Diamond Kapton Sunshield + 18-Segment Golden Hexagonal Mirror Seed
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 0.55);
    shieldShape.lineTo(0.32, 0);
    shieldShape.lineTo(0, -0.55);
    shieldShape.lineTo(-0.32, 0);
    shieldShape.closePath();
    const shieldGeo = new THREE.ShapeGeometry(shieldShape);
    shieldGeo.rotateX(-Math.PI / 2);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe,
      emissive: 0x3b0764,
      emissiveIntensity: 0.2,
      metalness: 0.82,
      roughness: 0.22,
      side: THREE.DoubleSide,
    });
    for (let l = 0; l < 5; l++) {
      const layer = new THREE.Mesh(shieldGeo, shieldMat);
      layer.position.y = -0.06 + l * 0.022;
      layer.scale.setScalar(1 - l * 0.04);
      jwstSeed.add(layer);
    }
    const mirror = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.03, 6),
      new THREE.MeshStandardMaterial({
        map: kapton.map,
        color: 0xfacc15,
        emissive: 0x713f12,
        emissiveIntensity: 0.25,
        metalness: 0.88,
        roughness: 0.14,
      })
    );
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(0, 0.26, -0.05);
    jwstSeed.add(mirror);
    this.jwstHolder.add(jwstSeed);

    // Stream Official NASA James Webb Space Telescope 3D CAD (jwst.glb — 36 materials!)
    sharedCislunarLoader.load(
      "/models/jwst.glb",
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const scale = 1.45 / Math.max(size.x, size.y, size.z, 1e-4);
        model.position.copy(center).multiplyScalar(-scale);
        model.scale.setScalar(scale);

        model.traverse((n) => {
          const m = n as THREE.Mesh;
          if (!m.isMesh || !m.material) return;
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          const hasUV = Boolean(m.geometry?.attributes?.uv);
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMapIntensity = 2.15;
              const name = `${m.name} ${mat.name}`.toLowerCase();
              const isGold = mat.color.r > 0.55 && mat.color.g > 0.35 && mat.color.b < 0.25;
              if (!mat.map) {
                if (name.includes("mirror") || name.includes("gold") || isGold) {
                  mat.color.setHex(0xfacc15);
                  mat.metalness = 0.85;
                  mat.roughness = 0.15;
                  mat.emissive.setHex(0x523004);
                  mat.emissiveIntensity = 0.18;
                } else if (name.includes("shield") || name.includes("kapton") || name.includes("layer")) {
                  mat.color.setHex(0xe2d4f0);
                  mat.metalness = 0.72;
                  mat.roughness = 0.26;
                  mat.emissive.setHex(0x2e1065);
                  mat.emissiveIntensity = 0.12;
                } else if (mat.color.r < 0.22 && mat.color.g < 0.22 && mat.color.b < 0.22) {
                  if (hasUV) mat.map = hull.map;
                  mat.color.setHex(0x94a3b8);
                  mat.metalness = 0.55;
                  mat.roughness = 0.35;
                }
              }
              mat.needsUpdate = true;
            }
          }
        });
        this.jwstHolder.remove(jwstSeed);
        this.jwstHolder.add(model);
      },
      undefined,
      () => {}
    );

    // Subtle Heatshield Thermal Isolation Aura (Amber +85°C sunward vs. Cryogenic Blue -233°C deep space!)
    const thermalRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.86, 36),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    thermalRing.rotation.x = Math.PI / 2;
    thermalRing.position.y = -0.18;
    this.jwstHolder.add(thermalRing);

    const jwstHit = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 12, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    jwstHit.userData = {
      targetId: "jwst",
      label: "James Webb Space Telescope (JWST · L2)",
      sub: "Official NASA 3D GLB · −1.5M km · Cryogenic 40 K Infrared Observatory",
    };
    this.jwstHolder.add(jwstHit);
    this.l2Anchor.add(this.jwstHolder);

    return { dscovrHit, jwstHit, thermalRing };
  }

  /**
   * Builds 4D Keplerian close-approach flyby arcs & 3D asteroid bodies for live NASA NeoWs catalog.
   */
  public setNeos(neos: NearEarthAsteroid[]): void {
    this.disposeNeos();

    for (const neo of neos) {
      const holder = new THREE.Group();

      // Map real miss distance into Shell 2 Cislunar neighborhood while preserving relative ordering!
      // e.g. 0.08 LD (Apophis 31,600 km) -> ~210 units (just outside GEO), 1.5 LD (Bennu) -> ~850 units, 10+ LD -> ~2050 units
      const clampedLD = THREE.MathUtils.clamp(neo.missDistanceLD, 0.32, 6.0);
      const baseRadiusUnits =
        neo.id === "neo-apophis"
          ? 165 // Iconic 2029 close flyby near GEO / Inner Cislunar!
          : 260 + clampedLD * 290;

      const inclinationRad = neo.inclinationDeg * DEG2RAD;
      const azimuthRad = neo.orbitalAngleDeg * DEG2RAD;
      const speedScale = 0.028 + (neo.velocityKmS / 35) * 0.04;

      // Build glowing hyperbolic/Keplerian flyby trajectory arc around Earth-Moon space!
      const arcPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 72; i++) {
        const u = (i / 72 - 0.5) * 2.2; // -1.1 .. +1.1 around closest approach
        const xLocal = baseRadiusUnits * Math.cosh(u * 0.65);
        const zLocal = baseRadiusUnits * Math.sinh(u * 0.85) * 1.15;
        const yLocal = Math.sin(u * 1.1) * baseRadiusUnits * Math.sin(inclinationRad);
        const pt = new THREE.Vector3(xLocal, yLocal, zLocal).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          azimuthRad
        );
        arcPts.push(pt);
      }
      const arcColor = neo.isHazardous ? 0xf43f5e : 0x34d399;
      const arcLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(arcPts),
        new THREE.LineBasicMaterial({
          color: arcColor,
          transparent: true,
          opacity: neo.isHazardous ? 0.52 : 0.34,
        })
      );
      this.neoGroup.add(arcLine);

      // Build 3D Asteroid Body (Official NASA OSIRIS-REx bennu.glb for Bennu; unique spectral sculpted mesh for others!)
      const bodyHolder = new THREE.Group();
      const procMesh = createProceduralAsteroidMesh(neo);
      bodyHolder.add(procMesh);

      if (neo.hasOfficialGlb) {
        sharedCislunarLoader.load(
          "/models/bennu.glb",
          (gltf) => {
            if (this.disposed) return;
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            const scale = 1.05 / Math.max(size.x, size.y, size.z, 1e-4);
            model.position.copy(center).multiplyScalar(-scale);
            model.scale.setScalar(scale);
            model.traverse((n) => {
              const m = n as THREE.Mesh;
              if (m.isMesh && m.material instanceof THREE.MeshStandardMaterial) {
                m.material.color.setHex(0x78716c);
                m.material.roughness = 0.86;
                m.material.metalness = 0.14;
                m.material.envMapIntensity = 1.3;
                m.material.needsUpdate = true;
              }
            });
            bodyHolder.remove(procMesh);
            procMesh.geometry.dispose();
            (procMesh.material as THREE.Material).dispose();
            bodyHolder.add(model);
          },
          undefined,
          () => {}
        );
      }

      // Beacon ring visible from wide Cislunar Overview so every NEO stands out cleanly!
      const beaconRing = new THREE.Mesh(
        new THREE.RingGeometry(1.1, 1.45, 24),
        new THREE.MeshBasicMaterial({
          color: arcColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      beaconRing.rotation.x = Math.PI / 2;
      holder.add(bodyHolder, beaconRing);

      // Generous invisible click/hover hit sphere
      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(8.5, 10, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.userData = {
        targetId: neo.id,
        label: neo.name,
        sub: `${neo.isHazardous ? "PHA · " : ""}${neo.missDistanceLD} LD (${neo.velocityKmS} km/s) · Click to fly & inspect`,
      };
      holder.add(hitMesh);
      this.neoGroup.add(holder);

      this.neoEntries.push({
        neo,
        holder,
        bodyMesh: bodyHolder,
        hitMesh,
        arcLine,
        baseRadiusUnits,
        inclinationRad,
        azimuthRad,
        speedScale,
        worldPos: new THREE.Vector3(),
      });
    }
  }

  public setVisibility(opts: { lagrangePoints: boolean; neos: boolean }): void {
    this.lagrangeRoot.visible = opts.lagrangePoints;
    this.neoGroup.visible = opts.neos;
  }

  public getPickables(): THREE.Object3D[] {
    const list: THREE.Object3D[] = [];
    if (this.lagrangeRoot.visible) {
      list.push(this.dscovrHit, this.jwstHit);
    }
    if (this.neoGroup.visible) {
      for (const e of this.neoEntries) list.push(e.hitMesh);
    }
    return list;
  }

  public getNeoWorldPos(neoId: string): THREE.Vector3 | null {
    const found = this.neoEntries.find((e) => e.neo.id === neoId);
    return found ? found.worldPos.clone() : null;
  }

  public update(elapsedSec: number, sunDir: THREE.Vector3): void {
    // 1. Align Sun–Earth L1 (+X) and L2 (-X) dynamically along the real-time UTC Sun direction!
    const sunNorm = sunDir.clone().normalize();
    this.lagrangeRoot.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), sunNorm);

    // Animate DSCOVR smoothly along its L1 Halo Orbit
    const l1Phase = elapsedSec * 0.14;
    this.dscovrHolder.position.set(
      Math.sin(l1Phase) * 18,
      Math.sin(l1Phase) * 46,
      Math.cos(l1Phase) * 78
    );
    // Point DSCOVR EPIC telescope back toward sunlit Earth (-X in lagrangeRoot space)
    this.dscovrHolder.lookAt(0, 0, 0);

    // Animate JWST smoothly along its L2 Halo Orbit (keeping sunshield facing +X toward Sun & Earth!)
    const l2Phase = elapsedSec * 0.11 + 1.2;
    this.jwstHolder.position.set(
      Math.sin(l2Phase) * 24,
      Math.sin(l2Phase) * 62,
      Math.cos(l2Phase) * 105
    );
    this.jwstHolder.rotation.set(0.18, Math.PI * 0.5, 0.12);
    this.thermalGlowRing.scale.setScalar(1 + Math.sin(elapsedSec * 2.2) * 0.06);

    // Compute positions in orbitalGroup-local space (NEVER getWorldPosition(), which includes -worldOrigin!)
    this.lagrangeRoot.updateMatrix();
    this.l1WorldPos.copy(this.l1Anchor.position).applyMatrix4(this.lagrangeRoot.matrix);
    this.l2WorldPos.copy(this.l2Anchor.position).applyMatrix4(this.lagrangeRoot.matrix);
    this.dscovrWorldPos
      .copy(this.dscovrHolder.position)
      .add(this.l1Anchor.position)
      .applyMatrix4(this.lagrangeRoot.matrix);
    this.jwstWorldPos
      .copy(this.jwstHolder.position)
      .add(this.l2Anchor.position)
      .applyMatrix4(this.lagrangeRoot.matrix);

    // 2. Propagate all Near-Earth Asteroids along their 4D flyby arcs with natural tumbling rotation!
    if (this.neoGroup.visible) {
      for (let i = 0; i < this.neoEntries.length; i++) {
        const e = this.neoEntries[i];
        const u = Math.sin(elapsedSec * e.speedScale + i * 1.35) * 0.92;
        const xLocal = e.baseRadiusUnits * Math.cosh(u * 0.65);
        const zLocal = e.baseRadiusUnits * Math.sinh(u * 0.85) * 1.15;
        const yLocal = Math.sin(u * 1.1) * e.baseRadiusUnits * Math.sin(e.inclinationRad);
        e.worldPos
          .set(xLocal, yLocal, zLocal)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), e.azimuthRad);

        e.holder.position.copy(e.worldPos);
        e.bodyMesh.rotation.set(
          elapsedSec * 0.25 + i,
          elapsedSec * 0.42 + i * 0.7,
          elapsedSec * 0.18
        );
      }
    }
  }

  private disposeNeos(): void {
    for (const e of this.neoEntries) {
      this.neoGroup.remove(e.holder);
      this.neoGroup.remove(e.arcLine);
      e.arcLine.geometry.dispose();
      (e.arcLine.material as THREE.Material).dispose();
      e.holder.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
    }
    this.neoEntries = [];
  }

  public dispose(): void {
    this.disposed = true;
    this.disposeNeos();
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
