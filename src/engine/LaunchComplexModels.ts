import * as THREE from "three";

export interface LaunchComplexAsset {
  group: THREE.Group;
  ventPlume: THREE.Points;
  beaconRing: THREE.Mesh;
  pickTarget: THREE.Mesh;
}

/**
 * Builds a realistic 3D Orbital Launch Complex standing flush on Earth's surface:
 * - Concrete pad apron & flame trench
 * - Vehicle-specific 3D rocket (Falcon 9, Starship Super Heavy, Soyuz, Ariane 6, LVM3, Long March 5)
 * - Umbilical service tower / Starbase Mechazilla catch arms + lightning arrestor masts
 * - Spherical cryogenic LOX / CH4 propellant tank farm + animated LOX boil-off steam plume
 */
export function createLaunchComplexModel(
  padId: string,
  shortName: string
): LaunchComplexAsset {
  const group = new THREE.Group();
  group.name = `launch-complex-${padId}`;

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
    metalness: 0.1,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.82,
    roughness: 0.32,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.35,
  });
  const whiteRocketMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.25,
    roughness: 0.28,
  });
  const stainlessMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.94,
    roughness: 0.16,
  });
  const orangeAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    metalness: 0.3,
    roughness: 0.45,
  });
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.35,
    roughness: 0.3,
  });
  const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

  // 1. Concrete Pad Base + Elevated Launch Mount + Flame Trench
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.125, 0.014, 16), concreteMat);
  apron.position.y = 0.007;
  group.add(apron);

  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.022, 0.055), darkSteelMat);
  mount.position.y = 0.022;
  group.add(mount);

  // 2. Invisible/Subtle Generous Picking Collider (easy clicking from orbit!)
  const pickTarget = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.24, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
  );
  pickTarget.position.y = 0.12;
  pickTarget.userData = {
    targetId: `pad-${padId}`,
    label: shortName,
    kind: "pad",
  };
  group.add(pickTarget);

  // 3. Glowing Orbital Tactical Beacon Ring around complex
  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(0.13, 0.165, 28),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    })
  );
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.y = 0.016;
  group.add(beaconRing);

  // 4. Propellant Tank Farm (2 Cryogenic LOX/CH4 Spheres + Pipe Bridge)
  for (const offset of [
    [-0.072, 0.026, 0.045],
    [-0.072, 0.026, -0.02],
  ] as const) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 10), tankMat);
    sphere.position.set(offset[0], offset[1], offset[2]);
    group.add(sphere);
  }

  // 5. Four Corner Lightning Arrestor Towers with Aviation Warning Lights
  for (const [lx, lz] of [
    [0.08, 0.08],
    [-0.08, 0.08],
    [0.08, -0.08],
    [-0.08, -0.08],
  ] as const) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.004, 0.15, 6), steelMat);
    mast.position.set(lx, 0.082, lz);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 6, 6), redBeaconMat);
    tip.position.set(lx, 0.158, lz);
    group.add(mast, tip);
  }

  // 6. Launch Service Tower (Mechazilla at Starbase, Fixed Service Structure elsewhere)
  const isStarbase = padId === "starbase";
  const towerHeight = isStarbase ? 0.22 : 0.18;
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, towerHeight, 0.026),
    isStarbase ? steelMat : darkSteelMat
  );
  tower.position.set(0.046, 0.014 + towerHeight / 2, 0);
  group.add(tower);

  if (isStarbase) {
    // Iconic Mechazilla "Chopstick" Catch Arms embracing Super Heavy
    for (const sign of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.008, 0.008), steelMat);
      arm.position.set(0.015, 0.165, sign * 0.024);
      group.add(arm);
    }
  } else {
    // Crew Access Arm / Umbilical Swing Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.009, 0.011), whiteRocketMat);
    arm.position.set(0.022, 0.148, 0);
    group.add(arm);
  }

  // 7. Vehicle-Accurate 3D Rocket standing on the launch mount!
  const rocket = new THREE.Group();
  rocket.position.y = 0.033;

  if (isStarbase) {
    // STARSHIP + SUPER HEAVY (Stainless Steel + Black Thermal Shield + Aero Flaps)
    const booster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.105, 16),
      stainlessMat
    );
    booster.position.y = 0.0525;
    const hotStage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0175, 0.0175, 0.008, 16),
      darkSteelMat
    );
    hotStage.position.y = 0.107;
    const shipBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.062, 16),
      stainlessMat
    );
    shipBody.position.y = 0.142;
    const shipNose = new THREE.Mesh(
      new THREE.ConeGeometry(0.017, 0.036, 16),
      stainlessMat
    );
    shipNose.position.y = 0.191;
    // Aft & Forward Flaps
    for (const sign of [-1, 1]) {
      const aftFlap = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.022, 0.003), darkSteelMat);
      aftFlap.position.set(sign * 0.02, 0.125, 0);
      const fwdFlap = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.014, 0.003), darkSteelMat);
      fwdFlap.position.set(sign * 0.016, 0.184, 0);
      rocket.add(aftFlap, fwdFlap);
    }
    rocket.add(booster, hotStage, shipBody, shipNose);
  } else if (padId === "baikonur") {
    // SOYUZ 2.1a (Olive-grey + bright orange interstage + 4 tapered side boosters + LES spire)
    const oliveMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.45,
      roughness: 0.45,
    });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.135, 14), oliveMat);
    core.position.y = 0.068;
    const orangeBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0105, 0.0105, 0.016, 14),
      orangeAccentMat
    );
    orangeBand.position.y = 0.105;
    const fairing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.032, 14),
      whiteRocketMat
    );
    fairing.position.y = 0.148;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.022, 14), whiteRocketMat);
    nose.position.y = 0.175;
    const les = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.003, 0.022, 8), whiteRocketMat);
    les.position.y = 0.194;
    rocket.add(core, orangeBand, fairing, nose, les);

    // 4 Tapered Iconic Soyuz Side Boosters
    for (let b = 0; b < 4; b++) {
      const ang = (b * Math.PI) / 2;
      const booster = new THREE.Mesh(new THREE.ConeGeometry(0.0095, 0.075, 10), oliveMat);
      booster.position.set(Math.cos(ang) * 0.014, 0.0375, Math.sin(ang) * 0.014);
      rocket.add(booster);
    }
  } else if (padId === "sriharikota" || padId === "kourou" || padId === "wenchang") {
    // HEAVY LIFT WITH STRAP-ON BOOSTERS (ISRO LVM3 / Ariane 6 / Long March 5)
    const coreMat = padId === "sriharikota" ? orangeAccentMat : whiteRocketMat;
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.13, 16), coreMat);
    core.position.y = 0.065;
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.014, 0.038, 16), whiteRocketMat);
    upper.position.y = 0.145;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.028, 16), whiteRocketMat);
    nose.position.y = 0.178;
    rocket.add(core, upper, nose);

    const boosterCount = padId === "wenchang" ? 4 : 2;
    for (let b = 0; b < boosterCount; b++) {
      const ang = (b * Math.PI * 2) / boosterCount;
      const bBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 0.092, 12),
        whiteRocketMat
      );
      bBody.position.set(Math.cos(ang) * 0.022, 0.046, Math.sin(ang) * 0.022);
      const bCone = new THREE.Mesh(new THREE.ConeGeometry(0.0085, 0.018, 12), whiteRocketMat);
      bCone.position.set(Math.cos(ang) * 0.022, 0.101, Math.sin(ang) * 0.022);
      rocket.add(bBody, bCone);
    }
  } else {
    // FALCON 9 + CREW DRAGON / FAIRING (KSC LC-39A & Vandenberg)
    const stage1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.11, 16),
      whiteRocketMat
    );
    stage1.position.y = 0.055;
    const interstage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0112, 0.0112, 0.018, 16),
      darkSteelMat
    );
    interstage.position.y = 0.119;
    const stage2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.028, 16),
      whiteRocketMat
    );
    stage2.position.y = 0.142;
    const dragon = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.028, 16),
      whiteRocketMat
    );
    dragon.position.y = 0.17;
    // 4 Folded Carbon-Fiber Landing Legs
    for (let l = 0; l < 4; l++) {
      const ang = (l * Math.PI) / 2;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.032, 0.006), darkSteelMat);
      leg.position.set(Math.cos(ang) * 0.012, 0.018, Math.sin(ang) * 0.012);
      leg.rotation.y = -ang;
      rocket.add(leg);
    }
    rocket.add(stage1, interstage, stage2, dragon);
  }

  group.add(rocket);

  // 8. Cryogenic LOX Boil-Off Steam Plume Particles
  const pCount = 18;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const t = i / pCount;
    pPos[i * 3] = -0.012 - t * 0.055;
    pPos[i * 3 + 1] = 0.08 + t * 0.045 + Math.sin(i * 1.7) * 0.008;
    pPos[i * 3 + 2] = Math.cos(i * 2.1) * 0.014;
  }
  const ventGeo = new THREE.BufferGeometry();
  ventGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const ventMat = new THREE.PointsMaterial({
    color: 0xe0f2fe,
    size: 0.024,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const ventPlume = new THREE.Points(ventGeo, ventMat);
  group.add(ventPlume);

  return { group, ventPlume, beaconRing, pickTarget };
}
