import * as THREE from "three";
import { SpectralMode } from "@/types/cosmos";
import { LAUNCH_PADS } from "@/data/launchPads";
import { EARTH_RADIUS_UNITS, latLonAltToVec3 } from "./geoMath";
import {
  createProceduralEarthTextures,
  createSunCoronaTexture,
  EarthTextureBundle,
  loadLocalHighResEarthTextures,
} from "./ProceduralTextures";
import { createLaunchComplexModel, LaunchComplexAsset } from "./LaunchComplexModels";

const EARTH_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPositionWorld;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionWorld = worldPos.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const EARTH_FRAGMENT_SHADER = `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uNormalMap;
  uniform sampler2D uSpecularMap;
  uniform sampler2D uCloudMap;
  uniform vec3 uSunDir;
  uniform int uSpectralMode; // 0 = optical, 1 = infrared, 2 = radar
  uniform float uTime;
  uniform float uCloudOffset;
  uniform float uCloudsEnabled;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPositionWorld;

  vec3 thermalPalette(float t) {
    vec3 c0 = vec3(0.03, 0.02, 0.16);
    vec3 c1 = vec3(0.48, 0.04, 0.56);
    vec3 c2 = vec3(0.96, 0.36, 0.08);
    vec3 c3 = vec3(1.00, 0.96, 0.74);
    if (t < 0.33) return mix(c0, c1, t / 0.33);
    if (t < 0.66) return mix(c1, c2, (t - 0.33) / 0.33);
    return mix(c2, c3, (t - 0.66) / 0.34);
  }

  void main() {
    vec3 geomN = normalize(vNormalWorld);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vPositionWorld);

    // Analytic spherical tangent basis for real topographic normal-map mountain relief!
    vec3 T = vec3(geomN.z, 0.0, -geomN.x);
    float tLen = length(T);
    T = tLen > 0.001 ? T / tLen : vec3(1.0, 0.0, 0.0);
    vec3 B = normalize(cross(geomN, T));

    vec3 mapN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
    // Enhanced topographic normal relief so Himalayas/Andes/Rockies catch razor-crisp grazing terminator light
    vec3 N = normalize(T * (mapN.x * 1.42) + B * (mapN.y * 1.42) + geomN * mapN.z);

    float ndotlGeom = dot(geomN, L);
    float ndotlRelief = dot(N, L);
    float dayFactor = smoothstep(-0.14, 0.18, ndotlGeom);
    float twilight = exp(-pow(ndotlGeom * 5.6, 2.0));

    vec3 dayColor = texture2D(uDayMap, vUv).rgb;
    vec3 nightColor = texture2D(uNightMap, vUv).rgb;
    float oceanMask = texture2D(uSpecularMap, vUv).r;

    float fresnel = pow(1.0 - max(dot(geomN, V), 0.0), 3.0);

    if (uSpectralMode == 1) {
      // Thermal Infrared (FLIR)
      float landHeat = clamp(1.0 - oceanMask * 0.75, 0.0, 1.0);
      float latHeat = 1.0 - abs(vUv.y - 0.5) * 1.85;
      float temp = clamp(0.16 + latHeat * 0.38 + landHeat * 0.24 + max(ndotlRelief, 0.0) * 0.32, 0.0, 1.0);
      vec3 ir = thermalPalette(temp);
      ir += nightColor * vec3(1.0, 0.85, 0.45) * 0.65;
      ir += vec3(0.95, 0.3, 0.65) * fresnel * 0.45;
      gl_FragColor = vec4(ir, 1.0);
      return;
    }

    if (uSpectralMode == 2) {
      // Tactical SAR Radar Hologram with Topographic Relief
      float luma = dot(dayColor, vec3(0.299, 0.587, 0.114));
      float relief = clamp(dot(N, normalize(V + vec3(0.2, 0.3, 0.2))), 0.2, 1.0);
      float latGrid = smoothstep(0.965, 1.0, abs(sin(vUv.y * 3.14159 * 18.0)));
      float lonGrid = smoothstep(0.965, 1.0, abs(sin(vUv.x * 3.14159 * 36.0)));
      float scan = smoothstep(0.92, 1.0, sin(vUv.y * 90.0 - uTime * 2.5));
      vec3 base = vec3(0.01, 0.08, 0.15) + vec3(0.06, 0.48, 0.7) * luma * relief * 1.1;
      base += vec3(0.15, 0.88, 1.0) * max(latGrid, lonGrid) * 0.32;
      base += vec3(0.2, 0.95, 0.85) * scan * 0.14;
      base += vec3(0.22, 0.82, 1.0) * fresnel * 0.78;
      gl_FragColor = vec4(base, 1.0);
      return;
    }

    // Optical Photorealistic True-Color Earth
    // Sample cloud ALPHA channel (earth_clouds_1024.png stores smooth opacity in .a!)
    vec2 shadowUv = vec2(fract(vUv.x + uCloudOffset - 0.0028), clamp(vUv.y - 0.002, 0.0, 1.0));
    float cloudShadow = smoothstep(0.05, 0.88, texture2D(uCloudMap, shadowUv).a) * uCloudsEnabled * 0.38 * dayFactor;

    float diffuse = max(ndotlRelief, 0.0) * 1.28 + 0.048;
    // Deepen natural contrast slightly so oceans feel rich sapphire and deserts/forests pop realistically
    vec3 vividDay = pow(max(dayColor, vec3(0.001)), vec3(1.05)) * 1.06;
    vec3 litDay = vividDay * diffuse * (1.0 - cloudShadow);

    // Exact Specular Sun-Glint ONLY on oceans & lakes (using NASA Specular Water Mask!)
    vec3 H = normalize(L + V);
    float specWide = pow(max(dot(geomN, H), 0.0), 18.0) * 0.22;
    float specSharp = pow(max(dot(geomN, H), 0.0), 128.0) * 0.85;
    litDay += vec3(1.0, 0.96, 0.88) * (specWide + specSharp) * oceanMask * dayFactor * (1.0 - cloudShadow);

    // Real NASA Black Marble Night Lights (warm golden-amber urban networks with crisp metro cores)
    float nightMask = smoothstep(0.11, -0.22, ndotlGeom);
    float cloudCoverHere = smoothstep(0.05, 0.9, texture2D(uCloudMap, vec2(fract(vUv.x + uCloudOffset), vUv.y)).a) * uCloudsEnabled;
    vec3 cityCore = pow(max(nightColor, vec3(0.0)), vec3(1.3)) * vec3(1.4, 1.05, 0.65);
    vec3 cityGlow = (nightColor * vec3(1.18, 0.86, 0.52) * 1.75 + cityCore * 0.85) * nightMask * (1.0 - cloudCoverHere * 0.52);
    vec3 litNight = dayColor * 0.022 + cityGlow;

    vec3 color = mix(litNight, litDay, dayFactor);

    // Physical Mie golden-crimson twilight band right along the solar terminator
    color += vec3(1.0, 0.42, 0.12) * twilight * 0.21;

    // Blue Rayleigh atmospheric horizon limb scatter (brighter sunlit crescent limb!)
    color += vec3(0.22, 0.62, 1.0) * fresnel * (0.16 + 0.78 * dayFactor);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const CLOUD_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  void main() {
    vUv = uv;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CLOUD_FRAGMENT_SHADER = `
  uniform sampler2D uCloudMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalWorld;

  void main() {
    vec4 tex = texture2D(uCloudMap, vUv);
    // earth_clouds_1024.png encodes smooth cloud opacity in alpha channel
    float c = smoothstep(0.04, 0.9, tex.a);
    if (c < 0.01) discard;

    // Subtle procedural cumulus bump lighting from neighboring texel gradient
    float cSun = texture2D(uCloudMap, vec2(fract(vUv.x + 0.0018), clamp(vUv.y + 0.0012, 0.0, 1.0))).a;
    float relief = clamp(0.88 + (c - cSun) * 0.45, 0.65, 1.18);

    vec3 N = normalize(vNormalWorld);
    vec3 L = normalize(uSunDir);
    float ndotl = dot(N, L);
    float dayFactor = smoothstep(-0.16, 0.22, ndotl);
    float twilight = exp(-pow(ndotl * 5.2, 2.0));

    vec3 dayCloud = vec3(0.98, 0.995, 1.0) * (0.28 + 0.84 * max(ndotl, 0.0)) * relief;
    vec3 nightCloud = vec3(0.045, 0.085, 0.17);
    vec3 col = mix(nightCloud, dayCloud, dayFactor);
    // Warm golden-coral sunset blush on high-altitude cloud tops along terminator!
    col += vec3(1.0, 0.46, 0.16) * twilight * 0.42;

    gl_FragColor = vec4(col, c * 0.78);
  }
`;

const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormalWorld;
  varying vec3 vPositionWorld;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionWorld = worldPos.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  uniform vec3 uSunDir;
  uniform int uSpectralMode;
  varying vec3 vNormalWorld;
  varying vec3 vPositionWorld;

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vPositionWorld);
    vec3 L = normalize(uSunDir);

    float rim = pow(clamp(1.0 + dot(N, V), 0.0, 1.0), 3.4);
    float sunAlign = dot(-N, L);
    float sunLit = smoothstep(-0.35, 0.5, sunAlign);
    float sunsetBand = exp(-pow((sunAlign + 0.05) * 4.5, 2.0));

    vec3 glowColor = mix(vec3(0.18, 0.56, 1.0), vec3(0.45, 0.80, 1.0), sunLit);
    glowColor = mix(glowColor, vec3(1.0, 0.52, 0.22), sunsetBand * 0.42);

    if (uSpectralMode == 1) glowColor = vec3(1.0, 0.35, 0.65);
    if (uSpectralMode == 2) glowColor = vec3(0.15, 0.95, 0.9);

    float alpha = rim * (0.14 + 0.78 * sunLit);
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

const AURORA_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uKpIntensity;
  varying vec2 vUv;

  void main() {
    // Shimmering vertical auroral ray curtains (557.7 nm O-green base -> 630 nm N2/O-crimson upper edge)
    float ray1 = sin(vUv.x * 37.699 + uTime * (0.8 + uKpIntensity * 0.7)) * 0.5 + 0.5;
    float ray2 = sin(vUv.x * 87.964 - uTime * 1.55 + vUv.y * 2.5) * 0.5 + 0.5;
    float ray3 = sin(vUv.x * 18.849 + uTime * 0.42) * 0.5 + 0.5;
    float curtains = pow(ray1 * 0.48 + ray2 * 0.34 + ray3 * 0.18, 1.85);
    float bottomSharp = smoothstep(0.0, 0.18, vUv.y);
    float topFeather = pow(1.0 - vUv.y, 1.35);
    float verticalEnv = bottomSharp * topFeather * 2.4;

    vec3 quietCol = mix(vec3(0.05, 0.98, 0.56), vec3(0.42, 0.25, 0.98), smoothstep(0.25, 0.9, vUv.y));
    vec3 stormCol = mix(vec3(0.16, 1.0, 0.64), vec3(0.98, 0.2, 0.56), smoothstep(0.2, 0.85, vUv.y));
    vec3 col = mix(quietCol, stormCol, uKpIntensity);
    float alpha = curtains * verticalEnv * (0.48 + 0.48 * uKpIntensity);
    gl_FragColor = vec4(col, alpha);
  }
`;

export class EarthSystem {
  public readonly group = new THREE.Group();
  private earthMesh: THREE.Mesh;
  private earthMaterial: THREE.ShaderMaterial;
  private atmosphereMesh: THREE.Mesh;
  private atmosphereMaterial: THREE.ShaderMaterial;
  private cloudMesh: THREE.Mesh;
  private cloudMaterial: THREE.ShaderMaterial;
  private auroraGroup = new THREE.Group();
  private auroraMaterial: THREE.ShaderMaterial;
  private gridMesh: THREE.LineSegments;
  private launchPadGroup = new THREE.Group();
  private launchComplexes: Array<{ id: string; asset: LaunchComplexAsset }> = [];
  private sunSprite: THREE.Sprite;
  private sunCoronaTex: THREE.CanvasTexture;
  private textures: EarthTextureBundle;

  constructor() {
    this.textures = createProceduralEarthTextures();

    // 1. High-Resolution 128x128 Photorealistic Earth Sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS_UNITS, 128, 96);
    this.earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDayMap: { value: this.textures.dayMap },
        uNightMap: { value: this.textures.nightMap },
        uNormalMap: { value: this.textures.normalMap },
        uSpecularMap: { value: this.textures.specularMap },
        uCloudMap: { value: this.textures.cloudMap },
        uSunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
        uSpectralMode: { value: 0 },
        uTime: { value: 0 },
        uCloudOffset: { value: 0 },
        uCloudsEnabled: { value: 1.0 },
      },
      vertexShader: EARTH_VERTEX_SHADER,
      fragmentShader: EARTH_FRAGMENT_SHADER,
    });
    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMaterial);
    this.earthMesh.name = "earth";
    this.group.add(this.earthMesh);

    // 2. Sunlit Animated Global Cloud Layer with Twilight Terminator Reddening
    const cloudGeo = new THREE.SphereGeometry(EARTH_RADIUS_UNITS * 1.0085, 80, 64);
    this.cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCloudMap: { value: this.textures.cloudMap },
        uSunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
      },
      vertexShader: CLOUD_VERTEX_SHADER,
      fragmentShader: CLOUD_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMaterial);
    this.group.add(this.cloudMesh);

    // 3. Physical Rayleigh + Mie Atmosphere Halo
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS_UNITS * 1.055, 72, 56);
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
        uSpectralMode: { value: 0 },
      },
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.atmosphereMesh = new THREE.Mesh(atmoGeo, this.atmosphereMaterial);
    this.group.add(this.atmosphereMesh);

    // 4. Polar Auroral Ovals (North + South geomagnetic poles — reactive to live NOAA Kp!)
    this.auroraMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uKpIntensity: { value: 0.2 } },
      vertexShader: AURORA_VERTEX_SHADER,
      fragmentShader: AURORA_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const auroraRadius = EARTH_RADIUS_UNITS * 0.34;
    const auroraGeo = new THREE.CylinderGeometry(
      auroraRadius * 1.08,
      auroraRadius * 0.94,
      0.52,
      72,
      1,
      true
    );
    const northAurora = new THREE.Mesh(auroraGeo, this.auroraMaterial);
    northAurora.position.set(0.35, EARTH_RADIUS_UNITS * 0.945, -0.2);
    northAurora.rotation.z = -0.14;
    const southAurora = new THREE.Mesh(auroraGeo, this.auroraMaterial);
    southAurora.position.set(-0.3, -EARTH_RADIUS_UNITS * 0.945, 0.2);
    southAurora.rotation.z = 0.14;
    this.auroraGroup.add(northAurora, southAurora);
    this.group.add(this.auroraGroup);

    // 5. Lat/Lon Tactical Graticule Grid
    this.gridMesh = this.buildLatLonGrid(EARTH_RADIUS_UNITS * 1.005);
    this.gridMesh.visible = false;
    this.group.add(this.gridMesh);

    // 6. Real 3D Launch Complexes & Vehicle-Accurate Rockets on Earth's Surface!
    this.buildLaunchComplexes();
    this.group.add(this.launchPadGroup);

    // 7. Visible Glowing Sun & Optical Corona Flare in Deep Space
    this.sunCoronaTex = createSunCoronaTexture();
    const sunMat = new THREE.SpriteMaterial({
      map: this.sunCoronaTex,
      color: 0xfff8e7,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sunSprite = new THREE.Sprite(sunMat);
    this.sunSprite.scale.set(22, 22, 1);
    this.group.add(this.sunSprite);

    // Instant local load of 2048px NASA Blue Marble, Black Marble, Normal Relief, Specular & Clouds
    loadLocalHighResEarthTextures((upgraded) => {
      if (upgraded.dayMap) {
        const old = this.textures.dayMap;
        this.textures.dayMap = upgraded.dayMap;
        this.earthMaterial.uniforms.uDayMap.value = upgraded.dayMap;
        old.dispose();
      }
      if (upgraded.nightMap) {
        const old = this.textures.nightMap;
        this.textures.nightMap = upgraded.nightMap;
        this.earthMaterial.uniforms.uNightMap.value = upgraded.nightMap;
        old.dispose();
      }
      if (upgraded.normalMap) {
        const old = this.textures.normalMap;
        this.textures.normalMap = upgraded.normalMap;
        this.earthMaterial.uniforms.uNormalMap.value = upgraded.normalMap;
        old.dispose();
      }
      if (upgraded.specularMap) {
        const old = this.textures.specularMap;
        this.textures.specularMap = upgraded.specularMap;
        this.earthMaterial.uniforms.uSpecularMap.value = upgraded.specularMap;
        old.dispose();
      }
      if (upgraded.cloudMap) {
        const old = this.textures.cloudMap;
        this.textures.cloudMap = upgraded.cloudMap;
        this.earthMaterial.uniforms.uCloudMap.value = upgraded.cloudMap;
        this.cloudMaterial.uniforms.uCloudMap.value = upgraded.cloudMap;
        old.dispose();
      }
    });
  }

  private buildLatLonGrid(radius: number): THREE.LineSegments {
    const verts: number[] = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lon = -180; lon < 180; lon += 6) {
        const p1 = latLonAltToVec3(lat, lon, 0).normalize().multiplyScalar(radius);
        const p2 = latLonAltToVec3(lat, lon + 6, 0).normalize().multiplyScalar(radius);
        verts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    for (let lon = -180; lon < 180; lon += 15) {
      for (let lat = -84; lat < 84; lat += 6) {
        const p1 = latLonAltToVec3(lat, lon, 0).normalize().multiplyScalar(radius);
        const p2 = latLonAltToVec3(lat + 6, lon, 0).normalize().multiplyScalar(radius);
        verts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
    });
    return new THREE.LineSegments(geo, mat);
  }

  private buildLaunchComplexes(): void {
    const up = new THREE.Vector3(0, 1, 0);
    for (const pad of LAUNCH_PADS) {
      const surfacePos = latLonAltToVec3(pad.lat, pad.lon, 0);
      const normal = surfacePos.clone().normalize();

      const complex = createLaunchComplexModel(pad.id, pad.shortName);
      complex.group.position.copy(surfacePos);
      complex.group.quaternion.setFromUnitVectors(up, normal);

      this.launchPadGroup.add(complex.group);
      this.launchComplexes.push({ id: pad.id, asset: complex });
    }
  }

  public getPadPickables(): THREE.Object3D[] {
    return this.launchComplexes.map((p) => p.asset.pickTarget);
  }

  public setSpectralMode(mode: SpectralMode): void {
    const idx = mode === "infrared" ? 1 : mode === "radar" ? 2 : 0;
    this.earthMaterial.uniforms.uSpectralMode.value = idx;
    this.atmosphereMaterial.uniforms.uSpectralMode.value = idx;
    this.cloudMesh.visible = mode === "optical";
  }

  public setLayers(opts: {
    clouds: boolean;
    auroras: boolean;
    launchPads: boolean;
    grid: boolean;
    spectralMode: SpectralMode;
  }): void {
    const cloudsOn = opts.clouds && opts.spectralMode === "optical";
    this.cloudMesh.visible = cloudsOn;
    this.earthMaterial.uniforms.uCloudsEnabled.value = cloudsOn ? 1.0 : 0.0;
    this.auroraGroup.visible = opts.auroras;
    this.launchPadGroup.visible = opts.launchPads;
    this.gridMesh.visible = opts.grid || opts.spectralMode === "radar";
  }

  public update(elapsedSec: number, sunDir: THREE.Vector3, kpIndex = 2.3): void {
    this.earthMaterial.uniforms.uSunDir.value.copy(sunDir);
    this.earthMaterial.uniforms.uTime.value = elapsedSec;
    const cloudRot = elapsedSec * 0.0035;
    this.cloudMesh.rotation.y = cloudRot;
    this.earthMaterial.uniforms.uCloudOffset.value = -(cloudRot / (Math.PI * 2));

    this.cloudMaterial.uniforms.uSunDir.value.copy(sunDir);
    this.atmosphereMaterial.uniforms.uSunDir.value.copy(sunDir);
    this.auroraMaterial.uniforms.uTime.value = elapsedSec;
    const kpFactor = THREE.MathUtils.clamp((kpIndex - 1) / 7, 0, 1);
    this.auroraMaterial.uniforms.uKpIntensity.value = kpFactor;
    this.auroraGroup.scale.setScalar(1.0 + kpFactor * 0.09);
    this.sunSprite.position.copy(sunDir).multiplyScalar(220);

    // Gentle radar pulse on launch complex rings & cryogenic LOX steam drift
    const pulse = 1 + Math.sin(elapsedSec * 2.8) * 0.18;
    for (const item of this.launchComplexes) {
      item.asset.beaconRing.scale.setScalar(pulse);
      const posAttr = item.asset.ventPlume.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let x = posAttr.getX(i) - 0.00055;
        let y = posAttr.getY(i) + 0.00035;
        if (x < -0.078) {
          x = -0.012;
          y = 0.08 + (i % 5) * 0.004;
        }
        posAttr.setXYZ(i, x, y, posAttr.getZ(i));
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.textures.dayMap.dispose();
    this.textures.nightMap.dispose();
    this.textures.normalMap.dispose();
    this.textures.specularMap.dispose();
    this.textures.cloudMap.dispose();
    this.sunCoronaTex.dispose();
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Sprite) {
        obj.material.dispose();
        return;
      }
      const m = obj as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => mat.dispose());
      }
    });
  }
}
