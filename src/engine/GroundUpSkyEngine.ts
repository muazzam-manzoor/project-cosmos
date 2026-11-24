import * as THREE from "three";
import { SatelliteCategory, SatelliteTelemetry } from "@/types/cosmos";
import {
  computeObserverLookAngles,
  DEG2RAD,
  getSunDirectionECEF,
  RAD2DEG,
} from "./geoMath";

function createSoftFlareTexture(innerHex: string, outerRgba: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0.0, "#ffffff");
  g.addColorStop(0.22, innerHex);
  g.addColorStop(0.55, outerRgba);
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHorizonLandscapeTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);

  // Far misty mountain ridge silhouette (seamless 360-deg periodic harmonics)
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) {
    const a = (x / w) * Math.PI * 2;
    const ridge =
      h * 0.56 -
      Math.sin(a * 3 + 0.4) * 28 -
      Math.sin(a * 7 + 1.8) * 16 -
      Math.cos(a * 13 + 0.9) * 9 -
      Math.sin(a * 23) * 4;
    ctx.lineTo(x, ridge);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = "rgba(8, 16, 32, 0.85)";
  ctx.fill();

  // Closer dark foothill & tree-line silhouette
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 3) {
    const a = (x / w) * Math.PI * 2;
    const hill =
      h * 0.7 -
      Math.sin(a * 5 + 2.1) * 18 -
      Math.cos(a * 11 + 0.3) * 11 -
      Math.sin(a * 31) * 3.5;
    ctx.lineTo(x, hill);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = "#030711";
  ctx.fill();

  // Warm twinkling distant city lights along valley edge
  for (let i = 0; i < 190; i++) {
    const x = (i * 173.7) % w;
    const y = h * 0.72 + (i % 19);
    const size = i % 5 === 0 ? 2.4 : 1.3;
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 220, 145, 0.85)" : "rgba(255, 185, 95, 0.55)";
    ctx.fillRect(x, y, size, size);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

const REAL_SKY_VERTEX = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const REAL_SKY_FRAGMENT = `
  uniform vec3 uSunDir;
  uniform float uDayFactor;
  uniform float uTwilightFactor;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y, 0.0, 1.0);

    // Night sky palette (deep obsidian zenith -> subtle city-lit indigo horizon)
    vec3 nightZenith = vec3(0.008, 0.014, 0.038);
    vec3 nightHorizon = vec3(0.055, 0.09, 0.165);
    vec3 nightCol = mix(nightHorizon, nightZenith, pow(h, 0.55));

    // Luminous Milky Way diagonal galactic band visible at night!
    vec3 mwAxis = normalize(vec3(0.55, 0.42, -0.72));
    float mwPlane = exp(-pow(dot(dir, mwAxis) * 4.2, 2.0));
    float mwDetail = fbm(dir.xz * 5.5 + vec2(dir.y * 3.0, 1.2));
    float mwDust = fbm(dir.xz * 12.0 - vec2(0.5, dir.y * 4.0));
    vec3 milkyWay = vec3(0.18, 0.24, 0.40) * mwPlane * smoothstep(0.28, 0.78, mwDetail) * (1.0 - mwDust * 0.45) * smoothstep(0.04, 0.25, h);
    nightCol += milkyWay * (1.0 - uDayFactor);

    // Subtle warm city horizon airglow at night
    nightCol += vec3(0.16, 0.09, 0.04) * exp(-h * 11.0) * (1.0 - uDayFactor) * 0.55;

    // Daytime Rayleigh scattering blue sky
    vec3 dayZenith = vec3(0.08, 0.26, 0.62);
    vec3 dayHorizon = vec3(0.54, 0.75, 0.93);
    vec3 dayCol = mix(dayHorizon, dayZenith, pow(h, 0.52));

    // Twilight golden-amber & violet horizon band
    vec3 sunHorizDir = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
    float sunAzAlign = max(dot(normalize(vec3(dir.x, 0.0, dir.z)), sunHorizDir), 0.0);
    vec3 twilightGlow = mix(vec3(0.14, 0.12, 0.28), vec3(0.98, 0.44, 0.14), pow(sunAzAlign, 2.0)) * exp(-h * 4.5);

    vec3 col = mix(nightCol, dayCol, uDayFactor);
    col += twilightGlow * uTwilightFactor * 0.9;

    // Physical Sun Mie Halo & Disc when above horizon
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    float sunGlow = pow(sunDot, 16.0) * 0.35 + pow(sunDot, 220.0) * 1.4;
    float sunAbove = smoothstep(-0.08, 0.06, uSunDir.y);
    col += vec3(1.0, 0.92, 0.72) * sunGlow * sunAbove * (0.35 + 0.65 * uDayFactor);

    // Subtle high-altitude cirrus clouds (lit warmly at twilight, softly dark at night)
    if (h > 0.03) {
      vec2 cloudUv = dir.xz / (h + 0.22) * 1.15 + vec2(uTime * 0.008, uTime * 0.004);
      float c = smoothstep(0.52, 0.84, fbm(cloudUv)) * smoothstep(0.03, 0.2, h) * (1.0 - smoothstep(0.75, 1.0, h) * 0.4);
      vec3 cloudCol = mix(vec3(0.05, 0.08, 0.14), vec3(0.95, 0.97, 1.0), uDayFactor);
      cloudCol += vec3(0.95, 0.46, 0.2) * uTwilightFactor * 0.65;
      col = mix(col, cloudCol, c * (0.28 + 0.32 * uDayFactor));
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

function createMinimalCompassLabel(text: string, color: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.font = "600 30px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.72, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(2.0, 2.0, 1);
  return sp;
}

/**
 * Photorealistic Ground-Up Earth Sky View Engine.
 * Gives the user the real visceral feeling of standing outdoors at any city on Earth,
 * looking up at the live local atmospheric sky (Daylight / Golden Twilight / Starry Milky Way Night),
 * surrounded by a 360° silhouetted mountain landscape, watching sunlit satellites streak overhead,
 * and launching straight upward off Earth into 3D orbit!
 */
export class GroundUpSkyEngine {
  public readonly group = new THREE.Group();
  private satGroup = new THREE.Group();
  private pickables: THREE.Object3D[] = [];
  private domeRadius = 46;
  private skyMat: THREE.ShaderMaterial;
  private starField: THREE.Points;
  private starMat: THREE.PointsMaterial;
  private starTexture: THREE.CanvasTexture;
  private landscapeTex: THREE.CanvasTexture;
  private moonSprite: THREE.Sprite;
  private moonTex: THREE.CanvasTexture;

  // Pooled satellite flare sprites + streak trails (zero GPU churn!)
  private satFlareTex: THREE.CanvasTexture;
  private satPool: Array<{
    sprite: THREE.Sprite;
    hitCollider: THREE.Mesh;
    trail: THREE.Line;
  }> = [];
  private sharedHitGeo: THREE.SphereGeometry;
  private sharedHitMat: THREE.MeshBasicMaterial;

  constructor() {
    this.group.visible = false;

    // 1. Physical Rayleigh + Mie + Milky Way Atmospheric Sky Dome
    const domeGeo = new THREE.SphereGeometry(this.domeRadius, 64, 36, 0, Math.PI * 2, 0, Math.PI * 0.56);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: new THREE.Vector3(0.3, -0.35, -0.85).normalize() },
        uDayFactor: { value: 0.0 },
        uTwilightFactor: { value: 0.15 },
        uTime: { value: 0 },
      },
      vertexShader: REAL_SKY_VERTEX,
      fragmentShader: REAL_SKY_FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.group.add(new THREE.Mesh(domeGeo, this.skyMat));

    // 2. Dark Natural Ground Plane + 360° Mountain & Distant City-Lights Horizon Silhouette!
    const groundGeo = new THREE.CircleGeometry(this.domeRadius * 1.02, 64);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x030711, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    this.group.add(ground);

    this.landscapeTex = createHorizonLandscapeTexture();
    const horizonRingGeo = new THREE.CylinderGeometry(
      this.domeRadius * 0.94,
      this.domeRadius * 0.94,
      9.2,
      72,
      1,
      true
    );
    const horizonRingMat = new THREE.MeshBasicMaterial({
      map: this.landscapeTex,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const horizonRing = new THREE.Mesh(horizonRingGeo, horizonRingMat);
    horizonRing.position.y = 3.2;
    this.group.add(horizonRing);

    // Subtle minimal compass markers right along horizon
    for (const c of [
      { label: "N", az: 0, col: "#34d399" },
      { label: "E", az: 90, col: "#94a3b8" },
      { label: "S", az: 180, col: "#94a3b8" },
      { label: "W", az: 270, col: "#94a3b8" },
    ]) {
      const a = c.az * DEG2RAD;
      const sp = createMinimalCompassLabel(c.label, c.col);
      sp.position.set(
        (this.domeRadius - 5.5) * Math.sin(a),
        1.1,
        -(this.domeRadius - 5.5) * Math.cos(a)
      );
      this.group.add(sp);
    }

    // 3. Glowing Lunar Disc in the Night Sky
    this.moonTex = createSoftFlareTexture("#f8fafc", "rgba(226,232,240,0.35)");
    this.moonSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.moonTex,
        color: 0xf1f5f9,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
    );
    this.moonSprite.scale.set(3.2, 3.2, 1);
    this.moonSprite.position.set(-18, 26, -24);
    this.group.add(this.moonSprite);

    // 4. Crisp Twinkling Celestial Starfield (fades naturally during bright daylight!)
    this.starTexture = createSoftFlareTexture("#e0f2fe", "rgba(125,211,252,0.22)");
    const starCount = 2200;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color(0x9bb0ff),
      new THREE.Color(0xcad7ff),
      new THREE.Color(0xffffff),
      new THREE.Color(0xfff4ea),
      new THREE.Color(0xffd2a1),
    ];
    for (let i = 0; i < starCount; i++) {
      const az = Math.random() * Math.PI * 2;
      const el = Math.asin(Math.random());
      const r = this.domeRadius * 0.95;
      starPos[i * 3] = r * Math.cos(el) * Math.sin(az);
      starPos[i * 3 + 1] = r * Math.sin(el) + 1.2;
      starPos[i * 3 + 2] = -r * Math.cos(el) * Math.cos(az);
      const col = palette[i % palette.length];
      const mag = 0.55 + Math.pow(Math.random(), 2.2) * 0.65;
      starCol[i * 3] = col.r * mag;
      starCol[i * 3 + 1] = col.g * mag;
      starCol[i * 3 + 2] = col.b * mag;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
    this.starMat = new THREE.PointsMaterial({
      size: 0.95,
      map: this.starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      alphaTest: 0.02,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.starField = new THREE.Points(starGeo, this.starMat);
    this.group.add(this.starField);

    // 5. Pre-allocated Pool of Luminous Moving Satellite Star-Flares + Orbital Streak Trails!
    this.satFlareTex = createSoftFlareTexture("#fde68a", "rgba(56,189,248,0.45)");
    this.sharedHitGeo = new THREE.SphereGeometry(1.15, 8, 8);
    this.sharedHitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });

    const maxPool = 36;
    for (let i = 0; i < maxPool; i++) {
      const spMat = new THREE.SpriteMaterial({
        map: this.satFlareTex,
        color: 0x38bdf8,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spMat);
      sprite.visible = false;

      const hitCollider = new THREE.Mesh(this.sharedHitGeo, this.sharedHitMat);
      hitCollider.visible = false;

      const trailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      const trailMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.55,
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      trail.visible = false;

      this.satGroup.add(sprite, hitCollider, trail);
      this.satPool.push({ sprite, hitCollider, trail });
    }
    this.group.add(this.satGroup);
  }

  /**
   * Computes real local Sun position for (obsLat, obsLon, timestampMs) to render
   * realistic daytime blue sky, golden sunset twilight, or Milky Way night sky!
   */
  public updateLocalSkyConditions(
    obsLat: number,
    obsLon: number,
    timestampMs: number,
    forceStargazerNight = false
  ): void {
    const sunEcef = getSunDirectionECEF(timestampMs);
    const sunLat = Math.asin(THREE.MathUtils.clamp(sunEcef.y, -1, 1)) * RAD2DEG;
    const sunLon = (Math.atan2(sunEcef.z, -sunEcef.x) * RAD2DEG) - 180;
    const wrappedLon = ((sunLon + 540) % 360) - 180;

    const look = computeObserverLookAngles(obsLat, obsLon, sunLat, wrappedLon, 149_600_000);
    const sunElev = forceStargazerNight ? -22 : look.elevationDeg;
    const azRad = look.azimuthDeg * DEG2RAD;
    const elRad = sunElev * DEG2RAD;

    this.skyMat.uniforms.uSunDir.value
      .set(Math.cos(elRad) * Math.sin(azRad), Math.sin(elRad), -Math.cos(elRad) * Math.cos(azRad))
      .normalize();

    const dayFactor = THREE.MathUtils.smoothstep(sunElev, -4, 14);
    const twilightFactor = Math.exp(-Math.pow((sunElev + 1) / 9, 2));
    this.skyMat.uniforms.uDayFactor.value = dayFactor;
    this.skyMat.uniforms.uTwilightFactor.value = twilightFactor;

    // Fade stars & Moon naturally in bright daylight
    this.starMat.opacity = Math.max(0.04, (1 - dayFactor * 0.94) * 0.94);
    (this.moonSprite.material as THREE.SpriteMaterial).opacity = Math.max(0.18, 1 - dayFactor * 0.72);
  }

  public updateOverheadSatellites(overhead: SatelliteTelemetry[]): void {
    this.pickables = [];
    const count = Math.min(overhead.length, this.satPool.length);

    for (let i = 0; i < this.satPool.length; i++) {
      const slot = this.satPool[i];
      if (i >= count) {
        slot.sprite.visible = false;
        slot.hitCollider.visible = false;
        slot.trail.visible = false;
        continue;
      }

      const sat = overhead[i];
      if (sat.azimuthDeg === undefined || sat.elevationDeg === undefined) {
        slot.sprite.visible = false;
        slot.hitCollider.visible = false;
        slot.trail.visible = false;
        continue;
      }

      const az = sat.azimuthDeg * DEG2RAD;
      const el = sat.elevationDeg * DEG2RAD;
      const r = this.domeRadius * 0.86;
      const x = r * Math.cos(el) * Math.sin(az);
      const y = r * Math.sin(el);
      const z = -r * Math.cos(el) * Math.cos(az);

      const cat: SatelliteCategory = sat.category === "planet" ? "starlink" : sat.category;
      const color =
        cat === "station"
          ? 0xfbbf24
          : cat === "science"
          ? 0xc4b5fd
          : cat === "weather"
          ? 0x34d399
          : cat === "debris"
          ? 0xfb7185
          : 0x7dd3fc;

      slot.sprite.position.set(x, y, z);
      (slot.sprite.material as THREE.SpriteMaterial).color.setHex(color);
      const flareScale = cat === "station" ? 3.1 : sat.inSunlight ? 1.9 : 1.35;
      slot.sprite.scale.set(flareScale, flareScale, 1);
      slot.sprite.visible = true;

      slot.hitCollider.position.set(x, y, z);
      slot.hitCollider.userData = { targetId: sat.id, name: sat.name };
      slot.hitCollider.visible = true;
      this.pickables.push(slot.hitCollider);

      // Subtle glowing orbital motion streak across the sky dome!
      const prevAz = (sat.azimuthDeg - 5.5) * DEG2RAD;
      const prevEl = Math.max(0.05, (sat.elevationDeg - 2.2) * DEG2RAD);
      const attr = slot.trail.geometry.getAttribute("position") as THREE.BufferAttribute;
      attr.setXYZ(0, x, y, z);
      attr.setXYZ(
        1,
        r * Math.cos(prevEl) * Math.sin(prevAz),
        r * Math.sin(prevEl),
        -r * Math.cos(prevEl) * Math.cos(prevAz)
      );
      attr.needsUpdate = true;
      (slot.trail.material as THREE.LineBasicMaterial).color.setHex(color);
      slot.trail.visible = true;
    }
  }

  public getPickables(): THREE.Object3D[] {
    return this.pickables;
  }

  public update(elapsedSec: number): void {
    if (!this.group.visible) return;
    this.skyMat.uniforms.uTime.value = elapsedSec;
    this.starField.rotation.y = elapsedSec * 0.0012;
  }

  public dispose(): void {
    this.starTexture.dispose();
    this.landscapeTex.dispose();
    this.moonTex.dispose();
    this.satFlareTex.dispose();
    this.sharedHitGeo.dispose();
    this.sharedHitMat.dispose();
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Sprite) {
        obj.material.map?.dispose();
        obj.material.dispose();
        return;
      }
      const m = obj as THREE.Mesh;
      if (m.geometry && m.geometry !== this.sharedHitGeo) m.geometry.dispose();
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => {
          if (mat !== this.sharedHitMat) mat.dispose();
        });
      }
    });
  }
}
