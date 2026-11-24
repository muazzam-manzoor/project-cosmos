import * as THREE from "three";
import { EARTH_RADIUS_KM, KM_TO_UNITS, UNITS_TO_KM } from "./geoMath";

export interface HohmannLiveState {
  altitudeKm: number;
  speedKmS: number;
  phasePct: number;
  burnState: "PERIGEE BURN Δv₁" | "COASTING GTO" | "APOGEE BURN Δv₂";
  worldPos: THREE.Vector3;
}

const BELT_VERTEX_SHADER = `
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

const BELT_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uStormFactor; // 0.0 (quiet Kp 0-2) -> 1.0 (G4-G5 storm Kp 8-9)
  uniform vec3 uColorQuiet;
  uniform vec3 uColorHot;
  uniform vec3 uColorStorm;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vPosWorld);
    // Volumetric soft shell profile: luminous dense core + silky edge feathering
    float ndotv = abs(dot(N, V));
    float shellSoft = pow(ndotv, 0.72) * smoothstep(0.0, 0.36, ndotv);

    // Multi-scale turbulent plasma filaments spiraling along magnetic L-shells
    vec2 flowUv1 = vec2(vUv.x * 16.0 - uTime * 0.42, vUv.y * 6.0 + uTime * 0.25);
    vec2 flowUv2 = vec2(vUv.x * 32.0 + uTime * 0.22, vUv.y * 12.0 - uTime * 0.52);
    float f1 = vnoise(flowUv1);
    float f2 = vnoise(flowUv2);
    float filaments = pow(clamp(f1 * 0.65 + f2 * 0.35, 0.0, 1.0), 1.35);

    // Spiraling Alfven wave bands along torus circumference
    float spiral = sin(vUv.x * 37.699 + vUv.y * 12.566 - uTime * 1.45) * 0.5 + 0.5;
    float plasma = 0.34 + 0.66 * (filaments * 0.65 + spiral * 0.35);

    vec3 baseCol = mix(uColorQuiet, uColorHot, smoothstep(0.45, 0.92, plasma));
    vec3 col = mix(baseCol, uColorStorm, uStormFactor * 0.85);
    float alpha = shellSoft * plasma * uOpacity * (0.82 + 0.68 * uStormFactor);
    gl_FragColor = vec4(col, alpha);
  }
`;

const BOW_SHOCK_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;
  varying float vSunward;
  void main() {
    vUv = uv;
    vSunward = clamp((position.x + 25.0) / 85.0, 0.0, 1.0);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosWorld = wp.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const BOW_SHOCK_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uStormFactor;
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;
  varying float vSunward;

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vPosWorld);
    // Razor-clean Fresnel shock rim that glows at the sunward bow-shock nose!
    float fresnel = pow(1.0 - abs(dot(N, V)), 2.4);
    float ripple = sin(vSunward * 26.0 - uTime * 3.2) * 0.5 + 0.5;
    float noseGlow = pow(vSunward, 1.65);

    vec3 quietCol = mix(vec3(0.08, 0.48, 0.95), vec3(0.45, 0.88, 1.0), noseGlow);
    vec3 stormCol = mix(vec3(0.95, 0.35, 0.45), vec3(1.0, 0.78, 0.25), noseGlow);
    vec3 col = mix(quietCol, stormCol, uStormFactor);

    float tailFade = smoothstep(0.0, 0.38, vSunward);
    float alpha = (fresnel * 0.38 + noseGlow * 0.08 + ripple * 0.04 * noseGlow) * tailFade * (0.78 + 0.55 * uStormFactor);
    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * Shell 1B Engine Subsystem (2,500 -> 40,000 km):
 * 1. NASA SVS-Grade Volumetric Inner (Proton) & Outer (Relativistic Electron) Van Allen Belts
 *    + 320 live spiraling trapped particles bouncing along geomagnetic L-shells
 * 2. Dynamic 3D Earth Magnetosphere: Vertex-Colored Dipole Field Lines + Sunward Bow-Shock Shell
 *    + Deflecting Solar Wind Plasma Stream reacting live to NOAA SWPC Kp storms
 * 3. Interactive Keplerian Hohmann Transfer Visualizer (LEO 400 km -> GTO -> GEO 35,786 km)
 *    with 3D transfer vehicle, animated Perigee/Apogee thruster burns, and pulsing burn nodes
 */
export class MagnetosphereSystem {
  public readonly group = new THREE.Group();

  // Sub-groups for independent layer toggles
  private vanAllenGroup = new THREE.Group();
  private magnetosphereGroup = new THREE.Group();
  private hohmannGroup = new THREE.Group();

  // Van Allen shaders, pickable torus meshes & live trapped bounce-drift particles
  private innerBeltMat: THREE.ShaderMaterial;
  private outerBeltMat: THREE.ShaderMaterial;
  private innerBeltMesh: THREE.Mesh;
  private outerBeltMesh: THREE.Mesh;
  private trappedPoints: THREE.Points;
  private trappedMeta: Array<{
    isInner: boolean;
    L: number;
    phi0: number;
    phase: number;
    driftSpeed: number;
    bounceSpeed: number;
  }> = [];

  // Magnetosphere dynamic line material, Bow Shock shell & solar wind particles
  private fieldLineMat: THREE.LineBasicMaterial;
  private bowShockMat: THREE.ShaderMaterial;
  private bowShockMesh: THREE.Mesh;
  private solarWindPoints: THREE.Points;
  private particleGlowTex: THREE.CanvasTexture;

  // Hohmann transfer 3D vehicle, thruster plume, burn rings & invisible generous click hit-spheres
  private transferCraftGroup = new THREE.Group();
  private transferPlume: THREE.Mesh;
  private transferCraftHit: THREE.Mesh;
  private burn1Hit: THREE.Mesh;
  private burn2Hit: THREE.Mesh;
  private burn1Ring: THREE.Mesh;
  private burn2Ring: THREE.Mesh;
  private rLeo: number;
  private rGeo: number;
  private hohmannA: number;
  private hohmannE: number;
  private hohmannC: number;
  private selectedPhenomId = "";
  private latestHohmannState: HohmannLiveState = {
    altitudeKm: 400,
    speedKmS: 10.14,
    phasePct: 0,
    burnState: "PERIGEE BURN Δv₁",
    worldPos: new THREE.Vector3(),
  };

  constructor() {
    // Shared soft circular plasma particle sprite
    const pc = document.createElement("canvas");
    pc.width = 48;
    pc.height = 48;
    const ctx = pc.getContext("2d")!;
    const grad = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.32, "rgba(224,242,254,0.85)");
    grad.addColorStop(0.7, "rgba(56,189,248,0.22)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 48, 48);
    this.particleGlowTex = new THREE.CanvasTexture(pc);

    // 1. VOLUMETRIC 3D VAN ALLEN RADIATION BELTS (tilted ~11 deg geomagnetic dipole axis)
    this.vanAllenGroup.rotation.z = 0.19;
    this.vanAllenGroup.rotation.x = 0.08;
    this.vanAllenGroup.visible = false;

    this.innerBeltMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStormFactor: { value: 0.15 },
        uColorQuiet: { value: new THREE.Color(0xa21caf) }, // Deep Energetic Proton Violet
        uColorHot: { value: new THREE.Color(0xf472b6) },   // Hot Proton Filament Pink
        uColorStorm: { value: new THREE.Color(0xf43f5e) }, // Storm Crimson
        uOpacity: { value: 0.42 },
      },
      vertexShader: BELT_VERTEX_SHADER,
      fragmentShader: BELT_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.outerBeltMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStormFactor: { value: 0.15 },
        uColorQuiet: { value: new THREE.Color(0x0284c7) }, // Relativistic Electron Cobalt
        uColorHot: { value: new THREE.Color(0x67e8f9) },   // Bright Electric Cyan Plasma
        uColorStorm: { value: new THREE.Color(0xf59e0b) }, // Geomagnetic Storm Gold
        uOpacity: { value: 0.36 },
      },
      vertexShader: BELT_VERTEX_SHADER,
      fragmentShader: BELT_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    // Inner Proton Belt (~1,500 -> 7,500 km altitude) — Clickable & Hover-Labeled!
    const innerGeo = new THREE.TorusGeometry(15.6, 3.6, 24, 72);
    innerGeo.rotateX(Math.PI / 2);
    innerGeo.scale(1, 1.38, 1);
    this.innerBeltMesh = new THREE.Mesh(innerGeo, this.innerBeltMat);
    this.innerBeltMesh.userData = {
      targetId: "phenom-van-allen-inner",
      label: "Inner Van Allen Belt (Proton Donut)",
      sub: "Trapped Protons · 1,500–7,500 km · Click for full science",
    };
    this.vanAllenGroup.add(this.innerBeltMesh);

    // Outer Relativistic Electron Belt (~14,000 -> 34,000 km) — Clickable & Hover-Labeled!
    const outerGeo = new THREE.TorusGeometry(38.5, 9.2, 24, 80);
    outerGeo.rotateX(Math.PI / 2);
    outerGeo.scale(1, 1.28, 1);
    this.outerBeltMesh = new THREE.Mesh(outerGeo, this.outerBeltMat);
    this.outerBeltMesh.userData = {
      targetId: "phenom-van-allen-outer",
      label: "Outer Van Allen Belt (Electron Donut)",
      sub: "Relativistic Electrons · 14,000–34,000 km · Click for full science",
    };
    this.vanAllenGroup.add(this.outerBeltMesh);

    // 320 Live Spiraling Trapped Protons & Electrons bouncing between North/South magnetic mirror points!
    this.trappedPoints = this.buildTrappedParticles();
    this.vanAllenGroup.add(this.trappedPoints);
    this.group.add(this.vanAllenGroup);

    // 2. DYNAMIC 3D EARTH MAGNETOSPHERE: VERTEX-COLORED DIPOLE LINES + BOW SHOCK + SOLAR WIND
    this.magnetosphereGroup.visible = false;
    this.fieldLineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.buildMagnetosphereFieldLines();

    // Sunward Paraboloid Bow-Shock / Magnetopause Shield Shell (+X faces Sun!) — Clickable!
    this.bowShockMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStormFactor: { value: 0.15 },
      },
      vertexShader: BOW_SHOCK_VERTEX_SHADER,
      fragmentShader: BOW_SHOCK_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    this.bowShockMesh = this.buildBowShockShell();
    this.bowShockMesh.userData = {
      targetId: "phenom-magnetosphere",
      label: "Earth Magnetosphere & Solar Wind Shield",
      sub: "Bow Shock & Dipole Field · Deflecting 400+ km/s Solar Wind · Click for details",
    };
    this.magnetosphereGroup.add(this.bowShockMesh);

    // Streaming Solar Wind Particles deflecting around Earth's Bow Shock
    const swCount = 260;
    const swPos = new Float32Array(swCount * 3);
    for (let i = 0; i < swCount; i++) {
      swPos[i * 3] = 105 - Math.random() * 210;
      const ang = Math.random() * Math.PI * 2;
      const rad = 16 + Math.random() * 54;
      swPos[i * 3 + 1] = Math.sin(ang) * rad;
      swPos[i * 3 + 2] = Math.cos(ang) * rad;
    }
    const swGeo = new THREE.BufferGeometry();
    swGeo.setAttribute("position", new THREE.BufferAttribute(swPos, 3));
    const swMat = new THREE.PointsMaterial({
      color: 0xfde68a,
      map: this.particleGlowTex,
      size: 1.9,
      transparent: true,
      opacity: 0.78,
      alphaTest: 0.02,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.solarWindPoints = new THREE.Points(swGeo, swMat);
    this.magnetosphereGroup.add(this.solarWindPoints);
    this.group.add(this.magnetosphereGroup);

    // 3. INTERACTIVE KEPLERIAN HOHMANN TRANSFER VISUALIZER (LEO 400 km -> GTO -> GEO 35,786 km)
    this.hohmannGroup.visible = false;
    this.rLeo = (EARTH_RADIUS_KM + 400) * KM_TO_UNITS;
    this.rGeo = (EARTH_RADIUS_KM + 35786) * KM_TO_UNITS;
    this.hohmannA = (this.rLeo + this.rGeo) / 2;
    this.hohmannC = (this.rGeo - this.rLeo) / 2;
    this.hohmannE = this.hohmannC / this.hohmannA;

    const { burn1Ring, burn2Ring, burn1Hit, burn2Hit } = this.buildHohmannTransferVisuals(
      this.rLeo,
      this.rGeo
    );
    this.burn1Ring = burn1Ring;
    this.burn2Ring = burn2Ring;
    this.burn1Hit = burn1Hit;
    this.burn2Hit = burn2Hit;

    // 3D Transfer Vehicle (metallic bus + mini solar wings + animated emerald/amber thruster plume!)
    const craftBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.55, 1.35, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0x451a03,
        emissiveIntensity: 0.35,
        metalness: 0.72,
        roughness: 0.28,
      })
    );
    craftBody.rotation.x = Math.PI / 2;
    const craftWings = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.08, 0.72),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0c4a6e,
        emissiveIntensity: 0.45,
        metalness: 0.65,
        roughness: 0.25,
      })
    );
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.transferPlume = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.8, 12), plumeMat);
    this.transferPlume.rotation.x = -Math.PI / 2;
    this.transferPlume.position.z = -1.95;

    // Invisible generous click/hover hit sphere so even the fast-moving craft is effortless to click!
    const invisibleHitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.transferCraftHit = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 10), invisibleHitMat);
    this.transferCraftHit.userData = {
      targetId: "phenom-hohmann-craft",
      label: "Hohmann Transfer Vehicle (GTO)",
      sub: "LEO 400 km → GEO 35,786 km · Click to track & inspect live speed!",
    };

    this.transferCraftGroup.add(craftBody, craftWings, this.transferPlume, this.transferCraftHit);
    this.hohmannGroup.add(this.transferCraftGroup);
    this.group.add(this.hohmannGroup);
  }

  private buildTrappedParticles(): THREE.Points {
    const count = 320;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const innerCol = new THREE.Color(0xf472b6);
    const outerCol = new THREE.Color(0x67e8f9);

    for (let i = 0; i < count; i++) {
      const isInner = i < 120;
      const L = isInner ? 13.5 + Math.random() * 5.2 : 30.5 + Math.random() * 17.5;
      const phi0 = Math.random() * Math.PI * 2;
      const phase = Math.random() * Math.PI * 2;
      // Protons drift westward (+), relativistic electrons drift eastward (-)
      const driftSpeed = isInner ? 0.24 + Math.random() * 0.2 : -(0.16 + Math.random() * 0.16);
      const bounceSpeed = isInner ? 1.8 + Math.random() * 1.1 : 1.1 + Math.random() * 0.8;

      this.trappedMeta.push({ isInner, L, phi0, phase, driftSpeed, bounceSpeed });

      const c = isInner ? innerCol : outerCol;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.45,
      map: this.particleGlowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      alphaTest: 0.02,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  private buildBowShockShell(): THREE.Mesh {
    // Paraboloid of revolution around +X (Sunward axis): x = xNose - k * r^2
    const profilePts: THREE.Vector2[] = [];
    const xNose = 62;
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      const r = t * 72;
      const x = xNose - 0.0175 * r * r;
      profilePts.push(new THREE.Vector2(Math.max(r, 0.05), x));
    }
    const geo = new THREE.LatheGeometry(profilePts, 48);
    // Lathe rotates around +Y; rotate -90 deg around Z so nose points along +X (Sunward!)
    geo.rotateZ(-Math.PI / 2);
    return new THREE.Mesh(geo, this.bowShockMat);
  }

  private buildMagnetosphereFieldLines(): void {
    const shells = [
      { L: 25, count: 12 },
      { L: 46, count: 14 },
      { L: 72, count: 14 },
    ];
    const verts: number[] = [];
    const colors: number[] = [];
    const poleCol = new THREE.Color(0x67e8f9);
    const eqDayCol = new THREE.Color(0x38bdf8);
    const eqTailCol = new THREE.Color(0x6366f1);
    const tmp = new THREE.Color();

    for (const shell of shells) {
      for (let m = 0; m < shell.count; m++) {
        const phi = (m / shell.count) * Math.PI * 2;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        // Compress dayside (+X) under solar wind bow shock, stretch nightside (-X) into magnetotail!
        const asymScale = cosPhi > 0 ? 1 - cosPhi * 0.3 : 1 + Math.abs(cosPhi) * 0.62;
        const steps = 48;

        for (let s = 0; s < steps; s++) {
          const lat1 = -Math.PI * 0.43 + (s / steps) * (Math.PI * 0.86);
          const lat2 = -Math.PI * 0.43 + ((s + 1) / steps) * (Math.PI * 0.86);

          const r1 = shell.L * Math.cos(lat1) * Math.cos(lat1) * asymScale;
          const r2 = shell.L * Math.cos(lat2) * Math.cos(lat2) * asymScale;
          if (r1 < 9.5 && r2 < 9.5) continue;

          verts.push(
            r1 * Math.cos(lat1) * cosPhi,
            r1 * Math.sin(lat1),
            r1 * Math.cos(lat1) * sinPhi,
            r2 * Math.cos(lat2) * cosPhi,
            r2 * Math.sin(lat2),
            r2 * Math.cos(lat2) * sinPhi
          );

          const tailMix = THREE.MathUtils.clamp((-cosPhi + 1) * 0.5, 0, 1);
          const latWeight1 = Math.abs(Math.sin(lat1));
          const latWeight2 = Math.abs(Math.sin(lat2));

          tmp.copy(eqDayCol).lerp(eqTailCol, tailMix).lerp(poleCol, latWeight1 * 0.75);
          colors.push(tmp.r, tmp.g, tmp.b);
          tmp.copy(eqDayCol).lerp(eqTailCol, tailMix).lerp(poleCol, latWeight2 * 0.75);
          colors.push(tmp.r, tmp.g, tmp.b);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    this.magnetosphereGroup.add(new THREE.LineSegments(geo, this.fieldLineMat));
  }

  private buildHohmannTransferVisuals(rLeo: number, rGeo: number) {
    const makeRing = (radius: number, color: number, opacity: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 144; i++) {
        const a = (i / 144) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geo, mat);
    };

    // LEO Parking Orbit (400 km) & GEO Target Orbit (35,786 km)
    this.hohmannGroup.add(makeRing(rLeo, 0x38bdf8, 0.58));
    this.hohmannGroup.add(makeRing(rGeo, 0xfbbf24, 0.62));

    // Glowing Hohmann Transfer Ascent Ellipse (0 -> PI: Perigee Burn 1 -> Apogee Burn 2)
    const b = this.hohmannA * Math.sqrt(1 - this.hohmannE * this.hohmannE);
    const ascentPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 112; i++) {
      const E = (i / 112) * Math.PI;
      ascentPts.push(new THREE.Vector3(this.hohmannA * Math.cos(E) - this.hohmannC, 0, b * Math.sin(E)));
    }
    const ascentGeo = new THREE.BufferGeometry().setFromPoints(ascentPts);
    const ascentMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.95,
    });
    this.hohmannGroup.add(new THREE.Line(ascentGeo, ascentMat));

    // Faint return half of transfer ellipse for full orbital geometry clarity
    const returnPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const E = Math.PI + (i / 72) * Math.PI;
      returnPts.push(new THREE.Vector3(this.hohmannA * Math.cos(E) - this.hohmannC, 0, b * Math.sin(E)));
    }
    this.hohmannGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(returnPts),
        new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.22 })
      )
    );

    // Perigee Burn 1 Node (+rLeo, 0, 0) & Apogee Burn 2 Node (-rGeo, 0, 0) with Pulsing Rings
    const burn1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    burn1.position.set(rLeo, 0, 0);
    const burn1Ring = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.55, 28),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    burn1Ring.rotation.x = -Math.PI / 2;
    burn1Ring.position.set(rLeo, 0, 0);

    const burn2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    burn2.position.set(-rGeo, 0, 0);
    const burn2Ring = new THREE.Mesh(
      new THREE.RingGeometry(1.7, 2.25, 28),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    burn2Ring.rotation.x = -Math.PI / 2;
    burn2Ring.position.set(-rGeo, 0, 0);

    const invisibleHitMat1 = new THREE.MeshBasicMaterial({ visible: false });
    const burn1Hit = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), invisibleHitMat1);
    burn1Hit.position.set(rLeo, 0, 0);
    burn1Hit.userData = {
      targetId: "phenom-perigee-burn",
      label: "Perigee Burn 1 (Sky-Blue Node)",
      sub: "400 km LEO Injection · Δv₁ = +2.44 km/s · Click for details",
    };

    const invisibleHitMat2 = new THREE.MeshBasicMaterial({ visible: false });
    const burn2Hit = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 10), invisibleHitMat2);
    burn2Hit.position.set(-rGeo, 0, 0);
    burn2Hit.userData = {
      targetId: "phenom-apogee-burn",
      label: "Apogee Burn 2 (Orange/Gold Node)",
      sub: "35,786 km GEO Circularization · Δv₂ = +1.47 km/s · Click for details",
    };

    this.hohmannGroup.add(burn1, burn1Ring, burn1Hit, burn2, burn2Ring, burn2Hit);
    return { burn1Ring, burn2Ring, burn1Hit, burn2Hit };
  }

  public setSelectedPhenomenon(targetId: string): void {
    this.selectedPhenomId = targetId;
  }

  /**
   * Priority 1 interactive targets (moving Hohmann spacecraft & Perigee/Apogee burn balls)
   * — checked before background satellites so they are effortless to click!
   */
  public getPriorityPickables(): THREE.Object3D[] {
    if (!this.hohmannGroup.visible) return [];
    return [this.transferCraftHit, this.burn1Hit, this.burn2Hit];
  }

  /**
   * Priority 2 volumetric Shell 1B structures (Inner Proton Donut, Outer Electron Donut,
   * Magnetosphere Bow Shock Shield) — checked right after satellites so individual craft stay clickable!
   */
  public getFieldPickables(): THREE.Object3D[] {
    const list: THREE.Object3D[] = [];
    if (this.vanAllenGroup.visible) {
      list.push(this.innerBeltMesh, this.outerBeltMesh);
    }
    if (this.magnetosphereGroup.visible) {
      list.push(this.bowShockMesh);
    }
    return list;
  }

  public getHohmannLiveState(): HohmannLiveState {
    return this.latestHohmannState;
  }

  public getTargetFocusPose(
    targetId: string
  ): { target: THREE.Vector3; camPos: THREE.Vector3 } | null {
    if (targetId === "phenom-hohmann-craft") {
      const p = this.transferCraftGroup.position.clone();
      const outward = p.lengthSq() > 0.1 ? p.clone().normalize() : new THREE.Vector3(1, 0, 0);
      return {
        target: p,
        camPos: p.clone().addScaledVector(outward, 8.5).add(new THREE.Vector3(0, 6.2, 7.5)),
      };
    }
    if (targetId === "phenom-perigee-burn") {
      const p = new THREE.Vector3(this.rLeo, 0, 0);
      return {
        target: p,
        camPos: new THREE.Vector3(this.rLeo + 11, 8.5, 13),
      };
    }
    if (targetId === "phenom-apogee-burn") {
      const p = new THREE.Vector3(-this.rGeo, 0, 0);
      return {
        target: p,
        camPos: new THREE.Vector3(-this.rGeo - 16, 14, 24),
      };
    }
    if (targetId === "phenom-van-allen-inner") {
      return {
        target: new THREE.Vector3(0, 0, 0),
        camPos: new THREE.Vector3(28, 18, 38),
      };
    }
    if (targetId === "phenom-van-allen-outer") {
      return {
        target: new THREE.Vector3(0, 0, 0),
        camPos: new THREE.Vector3(58, 36, 82),
      };
    }
    if (targetId === "phenom-magnetosphere") {
      return {
        target: new THREE.Vector3(0, 0, 0),
        camPos: new THREE.Vector3(82, 54, 118),
      };
    }
    return null;
  }

  public setLayers(opts: {
    vanAllenBelts: boolean;
    magnetosphere: boolean;
    hohmannTransfer: boolean;
  }): void {
    this.vanAllenGroup.visible = opts.vanAllenBelts;
    this.magnetosphereGroup.visible = opts.magnetosphere;
    this.hohmannGroup.visible = opts.hohmannTransfer;
  }

  public update(
    elapsedSec: number,
    sunDir: THREE.Vector3,
    kpIndex = 2.3,
    solarWindKmS = 415
  ): void {
    const stormFactor = THREE.MathUtils.clamp((kpIndex - 1.5) / 6.5, 0, 1);

    if (this.vanAllenGroup.visible) {
      this.innerBeltMat.uniforms.uTime.value = elapsedSec;
      this.innerBeltMat.uniforms.uStormFactor.value = stormFactor;
      this.outerBeltMat.uniforms.uTime.value = elapsedSec;
      this.outerBeltMat.uniforms.uStormFactor.value = stormFactor;

      // Tactile visual highlight when user clicks Inner or Outer Van Allen Donut!
      this.innerBeltMat.uniforms.uOpacity.value =
        this.selectedPhenomId === "phenom-van-allen-inner"
          ? 0.66
          : this.selectedPhenomId === "phenom-van-allen-outer"
          ? 0.24
          : 0.42;
      this.outerBeltMat.uniforms.uOpacity.value =
        this.selectedPhenomId === "phenom-van-allen-outer"
          ? 0.58
          : this.selectedPhenomId === "phenom-van-allen-inner"
          ? 0.22
          : 0.36;

      // Animate 320 trapped protons & electrons bouncing north-to-south & drifting along magnetic L-shells!
      const posAttr = this.trappedPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
      const rateScale = 1 + stormFactor * 0.9;
      for (let i = 0; i < this.trappedMeta.length; i++) {
        const m = this.trappedMeta[i];
        const phi = m.phi0 + elapsedSec * m.driftSpeed * rateScale;
        const lat = Math.sin(elapsedSec * m.bounceSpeed * rateScale + m.phase) * 0.62;
        const cosLat = Math.cos(lat);
        const r = m.L * cosLat * cosLat;
        posAttr.setXYZ(
          i,
          r * cosLat * Math.cos(phi),
          r * Math.sin(lat) * 1.28,
          r * cosLat * Math.sin(phi)
        );
      }
      posAttr.needsUpdate = true;
    }

    if (this.magnetosphereGroup.visible) {
      // Align +X axis smoothly toward live Sun direction!
      const sunFlat = new THREE.Vector3(sunDir.x, sunDir.y, sunDir.z).normalize();
      this.magnetosphereGroup.quaternion.setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        sunFlat
      );

      this.bowShockMat.uniforms.uTime.value = elapsedSec;
      this.bowShockMat.uniforms.uStormFactor.value = stormFactor;
      const magBoost = this.selectedPhenomId === "phenom-magnetosphere" ? 0.22 : 0;
      this.fieldLineMat.opacity = 0.34 + stormFactor * 0.34 + magBoost;

      // Animate streaming solar wind particles deflecting around Earth's Bow Shock!
      const windRate = 0.48 + (solarWindKmS / 500) * 0.68;
      const attr = this.solarWindPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < attr.count; i++) {
        let x = attr.getX(i) - windRate;
        const y = attr.getY(i);
        const z = attr.getZ(i);
        const rYz = Math.hypot(y, z);
        if (x < 60 && x > -30 && rYz < 38) {
          const push = 0.32 * (1 - rYz / 42);
          attr.setY(i, y + (y / Math.max(rYz, 0.1)) * push);
          attr.setZ(i, z + (z / Math.max(rYz, 0.1)) * push);
        }
        if (x < -105) {
          x = 105;
          const ang = (i * 2.39996 + elapsedSec) % (Math.PI * 2);
          const rad = 12 + (i % 48);
          attr.setY(i, Math.sin(ang) * rad);
          attr.setZ(i, Math.cos(ang) * rad);
        }
        attr.setX(i, x);
      }
      attr.needsUpdate = true;
    }

    if (this.hohmannGroup.visible) {
      // Solve Kepler's Equation M = E - e sin(E) for authentic fast perigee -> slow apogee transfer!
      const phase = (elapsedSec * 0.34) % 1;
      const M = phase * Math.PI;
      let E = M;
      for (let iter = 0; iter < 4; iter++) {
        E = E - (E - this.hohmannE * Math.sin(E) - M) / (1 - this.hohmannE * Math.cos(E));
      }
      const b = this.hohmannA * Math.sqrt(1 - this.hohmannE * this.hohmannE);
      const px = this.hohmannA * Math.cos(E) - this.hohmannC;
      const pz = b * Math.sin(E);
      this.transferCraftGroup.position.set(px, 0, pz);

      // Align spacecraft prograde along orbital velocity tangent!
      const tx = -this.hohmannA * Math.sin(E);
      const tz = b * Math.cos(E);
      this.transferCraftGroup.lookAt(px + tx, 0, pz + tz);

      // Flare thruster plume brightly during Perigee Burn (phase < 0.16) & Apogee Circularization (phase > 0.84)!
      const burn1Flare = Math.exp(-Math.pow(phase / 0.12, 2));
      const burn2Flare = Math.exp(-Math.pow((1 - phase) / 0.12, 2));
      const flare = Math.max(burn1Flare, burn2Flare);
      this.transferPlume.scale.set(0.6 + flare * 0.9, 0.6 + flare * 0.9, 0.4 + flare * 1.4);
      const pMat = this.transferPlume.material as THREE.MeshBasicMaterial;
      pMat.color.setHex(burn2Flare > burn1Flare ? 0xfbbf24 : 0x34d399);
      pMat.opacity = 0.32 + flare * 0.65;

      // Subtle breathing pulse on Perigee/Apogee burn beacons (extra prominent when selected!)
      const p1Scale = this.selectedPhenomId === "phenom-perigee-burn" ? 1.55 : 1.0;
      const p2Scale = this.selectedPhenomId === "phenom-apogee-burn" ? 1.55 : 1.0;
      const pulse = 1 + Math.sin(elapsedSec * 3.5) * 0.18;
      this.burn1Ring.scale.setScalar(pulse * p1Scale);
      this.burn2Ring.scale.setScalar((1 + Math.cos(elapsedSec * 3.5) * 0.18) * p2Scale);

      // Update live real-time Vis-Viva telemetry for the Hohmann Transfer Vehicle!
      const rUnits = Math.hypot(px, pz);
      const rKm = Math.max(EARTH_RADIUS_KM + 400, rUnits * UNITS_TO_KM);
      const aKm = this.hohmannA * UNITS_TO_KM;
      const speedKmS = Math.sqrt(Math.max(0.1, 398600.4418 * (2 / rKm - 1 / aKm)));
      const burnState: HohmannLiveState["burnState"] =
        phase < 0.14
          ? "PERIGEE BURN Δv₁"
          : phase > 0.86
          ? "APOGEE BURN Δv₂"
          : "COASTING GTO";
      this.latestHohmannState.altitudeKm = Math.round(rKm - EARTH_RADIUS_KM);
      this.latestHohmannState.speedKmS = Number(speedKmS.toFixed(2));
      this.latestHohmannState.phasePct = Math.round(phase * 100);
      this.latestHohmannState.burnState = burnState;
      this.latestHohmannState.worldPos.set(px, 0, pz);
    }
  }

  public dispose(): void {
    this.particleGlowTex.dispose();
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
