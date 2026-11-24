import { FlagshipProfile, ISSModuleSpec } from "@/types/cosmos";

export const FLAGSHIP_PROFILES: Record<string, FlagshipProfile> = {
  earth: {
    id: "earth",
    name: "Earth",
    subtitle: "Terrestrial Biosphere · Shell 1A Anchor (R = 6,371 km)",
    category: "planet",
    provenance: "LIVE_TELEMETRY",
    provenanceDetail: "Real-time UTC solar terminator, axial rotation (GMST), and live LEO orbital shell.",
    has3DModel: true,
    overview: {
      explorer:
        "Our home world—a dynamic ocean planet wrapped in a paper-thin blue atmosphere and an invisible magnetic shield that deflects deadly solar radiation while hosting thousands of spacecraft in Low Earth Orbit.",
      student:
        "Earth orbits the Sun at ~29.78 km/s and rotates once every 23h 56m 4s (sidereal day). Its liquid iron-nickel outer core generates a protective magnetosphere, while Rayleigh scattering in its nitrogen-oxygen atmosphere turns the daytime sky blue.",
      teacher:
        "Teaching Anchor: Use Earth as the reference baseline for gravity (1g = 9.81 m/s²), atmospheric pressure (101.3 kPa), and orbital mechanics. Switch to Ground Sky View to show students how Earth's rotation moves satellites across their local horizon.",
      scientist:
        "WGS-84 Oblate Spheroid (a = 6378.137 km, f = 1/298.257223563, μ = 398,600.4418 km³/s², J₂ = 1.08262668×10⁻³). Dipole magnetic moment ~7.7×10²² A·m² tilted ~11° from rotational axis; thermosphere density modulates LEO drag.",
    },
    quickFacts: [
      { label: "Mean Radius", value: "6,371.0 km" },
      { label: "Escape Velocity", value: "11.186 km/s" },
      { label: "Surface Gravity", value: "9.807 m/s²" },
      { label: "LEO Shell Range", value: "160 – 2,500 km" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Earth's gravity pulls everything downward, so satellites must race sideways at ~27,600 km/h to keep falling around the curve of the planet.",
          student: "Circular orbital velocity obeys v = √(GM/r). Higher altitude means larger r and slower orbital velocity, while Earth's equatorial bulge (J₂) slowly precesses tilted orbits.",
          teacher: "Demonstrate Newton's cannonball by toggling Time Scrubber to 60x and observing how lower-altitude satellites (ISS, 420 km) lap higher ones (Hubble, 535 km).",
          scientist: "Geopotential dominated by GM/r with primary oblateness perturbation J₂ causing nodal regression dΩ/dt = −(3/2) n J₂ (Rₑ/p)² cos(i), leveraged for Sun-synchronous orbits.",
        },
        equations: [
          { label: "Gravitational Parameter (μ)", formula: "μ = G · M⊕", value: "3.9860044 × 10⁵ km³/s²" },
          { label: "Circular Orbit Velocity", formula: "v = √(μ / (R⊕ + h))", value: "7.66 km/s @ 420 km" },
          { label: "Escape Velocity", formula: "vₑ = √(2μ / R⊕)", value: "11.186 km/s" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Earth's breathable air is mostly nitrogen and oxygen, with a razor-thin ozone layer high above that absorbs burning ultraviolet rays from the Sun.",
          student: "Dry air is 78.08% N₂, 20.95% O₂, 0.93% Ar, and ~0.042% CO₂. Above 100 km (thermosphere), UV photolysis splits O₂ into reactive atomic oxygen (O), which chemically erodes spacecraft coatings.",
          teacher: "Highlight chemical stratification: troposphere weather chemistry, stratospheric ozone (O₃) UV cycle, and atomic oxygen erosion of LEO satellite polymers.",
          scientist: "Homosphere (<100 km) transitions at the turbopause into diffusive separation in the heterosphere; atomic oxygen flux at 400 km (~10¹⁴–10¹⁵ atoms/cm²·s) drives spacecraft surface oxidation.",
        },
        compounds: [
          { name: "Molecular Nitrogen", formula: "N₂ (78.08%)", role: "Inert atmospheric buffer & auroral violet emission" },
          { name: "Molecular Oxygen", formula: "O₂ (20.95%)", role: "Aerobic respiration & green 557.7 nm auroras" },
          { name: "Stratospheric Ozone", formula: "O₃ (~0.0006%)", role: "Absorbs UV-B / UV-C (200–315 nm)" },
          { name: "Atomic Oxygen (LEO)", formula: "O (Thermosphere)", role: "Reactive oxidant eroding exposed spacecraft Kapton" },
        ],
      },
      biology: {
        summary: {
          explorer: "Earth is the only known living world—its liquid water, protective atmosphere, and magnetic field shelter trillions of organisms from deep-space radiation.",
          student: "Liquid water stability (0–100°C at 1 atm), carbon-based biochemistry, and magnetospheric shielding against galactic cosmic rays define Earth's habitability template.",
          teacher: "Connect Earth's biosphere directly to astrobiology: studying how life adapts inside the ISS teaches us whether humans can survive journeys to Mars.",
          scientist: "Biosphere spans >10 km depth-to-stratosphere; ionizing radiation dose at sea level (~2.4 mSv/yr) jumps ~100× in LEO (~150–250 mSv/yr) despite magnetospheric rigidity cutoff.",
        },
        highlights: [
          "Magnetosphere + atmosphere reduce cosmic radiation >99% at surface",
          "Photosynthetic O₂ biosphere drives thermodynamic disequilibrium detectable from light-years away",
          "Reference 1g baseline for all orbital microgravity physiology studies",
        ],
      },
      engineering: {
        summary: {
          explorer: "Launching from Earth's surface takes massive multistage rockets because you must punch through thick air and accelerate to nearly 28,000 km/h.",
          student: "The Tsiolkovsky rocket equation (Δv = vₑ ln(m₀/m_f)) explains why reaching LEO (~9.3 km/s total Δv including drag and gravity losses) requires ~85–90% propellant by mass.",
          teacher: "Compare equatorial launch pads (Kourou, Cape Canaveral) that gain up to +465 m/s eastward boost from Earth's spin versus polar pads (Vandenberg).",
          scientist: "Surface eastward velocity v = ωR⊕ cos(φ) reduces required launch Δv for prograde inclinations; Shell 1A tracks global launch infrastructure and live SGP4 orbital traffic.",
        },
        specs: [
          { label: "Equatorial Spin Boost", value: "465.1 m/s eastward" },
          { label: "Kármán Line", value: "100 km altitude" },
          { label: "Typical LEO Δv Budget", value: "9.3 – 9.8 km/s" },
          { label: "Sidereal Rotation", value: "23h 56m 4.09s" },
        ],
      },
    },
  },

  iss: {
    id: "iss",
    noradId: 25544,
    name: "International Space Station (ISS)",
    subtitle: "Crewed Orbital Research Laboratory · NORAD 25544",
    category: "station",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Real-time 64-bit SGP4 orbital propagation from CelesTrak TLE + Live Earth-Viewing Video Feed.",
    has3DModel: true,
    hasInterior: true,
    hasLiveCam: true,
    overview: {
      explorer:
        "Humanity's permanent home in space! As wide as a football field, the ISS zooms around Earth 16 times every single day—meaning astronauts watch 16 sunrises and sunsets every 24 hours while floating weightlessly.",
      student:
        "Orbiting at ~415–425 km altitude at 7.66 km/s, the ISS is in continuous free-fall around Earth (microgravity, ~89% of surface gravity is still present!). Enter Interior Cutaway mode to inspect its chemistry and biology labs.",
      teacher:
        "Classroom Favorite: Debunk the 'zero gravity' myth—Earth's gravity at 420 km is still ~8.65 m/s²! Astronauts float because both they and the station fall around Earth at the exact same orbital velocity.",
      scientist:
        "NORAD 25544 (1998-067A). Pressurized volume ~916 m³, mass ~420 metric tons, 51.6° inclination enabling Soyuz/Baikonur and KSC access. Continuous microgravity (~10⁻⁶ g residual) platform requiring ~2 km/month atmospheric drag reboosts.",
    },
    quickFacts: [
      { label: "Orbital Speed", value: "7.66 km/s (27,576 km/h)" },
      { label: "Altitude", value: "~415 – 425 km" },
      { label: "Orbits / Day", value: "15.54 (92.9 min each)" },
      { label: "Dimensions", value: "109 m × 73 m (~420 t)" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Astronauts aren't floating because gravity stopped—they're falling around Earth so fast sideways that the ground curves away beneath them!",
          student: "At h = 420 km, g(h) = g₀(Rₑ/(Rₑ+h))² ≈ 8.64 m/s² (88% of Earth surface gravity). Residual atmospheric drag decelerates the station, causing ~50–100 m altitude loss per day.",
          teacher: "Use the ISS Interior Cutaway and 4D Time Scrubber to visualize orbital period (92.9 min) and explain why thermal radiators are vital in vacuum (no convection—only Stefan-Boltzmann radiation!).",
          scientist: "Free-molecular thermospheric drag F_d = −½ ρ C_d A v² requires periodic Δv burns via Zvezda/Progress/Cygnus. Thermal rejection uses dual-loop ammonia radiators governed by P = ε σ A T⁴.",
        },
        equations: [
          { label: "Local Gravity @ 420 km", formula: "g = μ / (R⊕ + 420)²", value: "8.64 m/s² (88% of g₀)" },
          { label: "Orbital Period", formula: "T = 2π √(a³ / μ)", value: "92.9 minutes" },
          { label: "Thermal Radiation", formula: "P = ε · σ · A · T⁴", value: "~70 kW rejected" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "The ISS is a flying chemistry lab that turns astronauts' breath and recycled water back into fresh breathable oxygen and drinking water!",
          student: "Life support runs on closed-loop electrochemistry: solar power splits water into oxygen (2H₂O → 2H₂ + O₂), while the Sabatier reactor combines exhaled CO₂ with hydrogen to recover water (CO₂ + 4H₂ → CH₄ + 2H₂O).",
          teacher: "Open the Zvezda & Tranquility ECLSS modules inside the ISS Interior Cutaway to teach stoichiometry, electrolysis, and conservation of mass in a closed habitat.",
          scientist: "ECLSS achieves ~98% water recovery via Vapor Compression Distillation + catalytic oxidation; OGS uses proton-exchange membrane (PEM) electrolysis paired with zeolite CDRA CO₂ adsorption and Sabatier methanation.",
        },
        compounds: [
          { name: "Water Electrolysis (OGS)", formula: "2H₂O → 2H₂ + O₂", role: "Generates breathable O₂ from reclaimed water" },
          { name: "Sabatier Reaction", formula: "CO₂ + 4H₂ → CH₄ + 2H₂O", role: "Recovers water from exhaled CO₂ + waste H₂" },
          { name: "Anhydrous Ammonia", formula: "NH₃ (External Loop)", role: "High-heat-capacity exterior thermal coolant" },
          { name: "Cabin Atmosphere", formula: "79% N₂ / 21% O₂ @ 101.3 kPa", role: "Sea-level pressure artificial biosphere" },
        ],
      },
      biology: {
        summary: {
          explorer: "Living in weightlessness changes the human body—bones soften, fluids shift to the head, and astronauts even grow space lettuce under glowing pink LED lights!",
          student: "Without gravity loading the skeleton, astronauts lose ~1–1.5% bone mineral density per month without daily resistive exercise, experience cephalad fluid shifts (SANS), and study plant phototropism in the Veggie chamber.",
          teacher: "Click Columbus & Tranquility inside the ISS Cutaway to show students real microgravity cell biology, cardiovascular adaptation, and hydroponic agriculture.",
          scientist: "Microgravity induces osteoclastic bone resorption, Type I/II skeletal muscle atrophy, Spaceflight-Associated Neuro-ocular Syndrome (SANS), altered microbial biofilm virulence, and epigenetic telomere shifts.",
        },
        highlights: [
          "~1–1.5% monthly bone density loss countered by 2 hrs/day ARED resistive exercise",
          "Veggie & Advanced Plant Habitat grow lettuce, zinnias, and chile peppers in microgravity",
          "Space-grown protein crystals form with far fewer defects for pharmaceutical research",
        ],
      },
      engineering: {
        summary: {
          explorer: "Built piece-by-piece in orbit by 15 nations over 40+ spaceflights, powered by 8 massive golden solar wings plus upgraded roll-out solar arrays.",
          student: "Eight solar wings + iROSA upgrades generate up to ~240 kW peak electrical power, stored in lithium-ion batteries for the 35-minute eclipse half of every orbit.",
          teacher: "Inspect the truss, solar arrays, white ammonia radiators, and pressurized modules directly in the 3D exterior + cutaway views.",
          scientist: "120–160 VDC primary power bus regulated to 124 VDC secondary; 4 Control Moment Gyroscopes (CMGs) provide propellantless attitude control (4,760 N·m·s angular momentum each).",
        },
        specs: [
          { label: "Solar Power Output", value: "120 – 240 kW (with iROSA)" },
          { label: "Pressurized Volume", value: "916 m³ (16 modules)" },
          { label: "Water Recycling", value: "~98% closed-loop" },
          { label: "Attitude Control", value: "4 Control Moment Gyros" },
        ],
      },
    },
  },

  hubble: {
    id: "hubble",
    noradId: 20580,
    name: "Hubble Space Telescope",
    subtitle: "Orbital UV / Optical / Near-IR Observatory · NORAD 20580",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Real-time SGP4 propagation from CelesTrak orbital elements; optical + UV/IR spectral observatory.",
    has3DModel: true,
    overview: {
      explorer:
        "Floating high above Earth's blurry clouds since 1990, Hubble is humanity's sharp-eyed cosmic camera—able to spot a firefly from 11,000 km away and photograph galaxies born over 13 billion years ago.",
      student:
        "Hubble orbits at ~520–535 km altitude above atmospheric distortion and ozone UV absorption. Its 2.4-meter mirror collects ultraviolet, visible, and near-infrared light with 0.05 arcsecond resolution.",
      teacher:
        "Compare Hubble (530 km LEO, UV + Visible + Near-IR, serviceable by astronauts) with James Webb (coming in Shell 2 at L2, Deep Infrared).",
      scientist:
        "NORAD 20580 (1990-037B), 28.5° inclination. 2.4 m Ritchey-Chrétien hyperbolic reflector coated in Al + MgF₂ for Lyman-α UV reflectance; pointing stability <0.007 arcsec via Fine Guidance Sensors & reaction wheels.",
    },
    quickFacts: [
      { label: "Primary Mirror", value: "2.4 m (f/24 Ritchey-Chrétien)" },
      { label: "Spectral Band", value: "115 nm (UV) – 2,500 nm (NIR)" },
      { label: "Altitude", value: "~525 km (28.5° incl.)" },
      { label: "Pointing Precision", value: "0.007 arcseconds" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Without Earth's twinkling air in the way, Hubble's mirror captures razor-sharp starlight and measures how fast the universe is expanding.",
          student: "Diffraction limit θ ≈ 1.22 λ/D yields ~0.05 arcsec at 500 nm. Hubble's precision Cepheid measurements pinned down the Hubble Constant (H₀) and cosmic expansion rate.",
          teacher: "Explain conservation of angular momentum: Hubble never uses rocket thrusters to turn—it spins internal reaction wheels instead!",
          scientist: "Diffraction-limited at λ = 500 nm (θ = 0.052″); reaction wheels exchange angular momentum internally while magnetorquers dump accumulated momentum against Earth's geomagnetic field.",
        },
        equations: [
          { label: "Rayleigh Diffraction", formula: "θ = 1.22 · λ / D", value: "0.052″ @ 500 nm" },
          { label: "Hubble-Lemaître Law", formula: "v = H₀ · d", value: "~73 km/s/Mpc (SH0ES)" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Hubble reads the 'rainbow barcodes' of starlight to discover what alien planet atmospheres and giant cosmic clouds are made of.",
          student: "Using ultraviolet and optical absorption spectroscopy (COS & STIS), Hubble detects water vapor, sodium, hydrogen, and carbon in exoplanet atmospheres during transits.",
          teacher: "Connect mirror coatings (aluminum + magnesium fluoride MgF₂) to reflectance chemistry—pure aluminum oxidizes in air, while MgF₂ preserves far-UV reflectivity.",
          scientist: "Primary mirror: ultra-low-expansion (ULE) titania-silicate glass with 65 nm Al + 25 nm MgF₂ overcoat enabling far-UV spectroscopy down to 115 nm (Lyman-α & metal resonance lines).",
        },
        compounds: [
          { name: "Mirror Overcoat", formula: "Al + MgF₂", role: "Reflects far-UV (115 nm) through near-IR" },
          { name: "Exoplanet Transit Markers", formula: "H₂O, Na, H, C, O", role: "Detected via transmission spectroscopy" },
        ],
      },
      biology: {
        summary: {
          explorer: "Hubble searches for water vapor on distant exoplanets and plumes erupting from Jupiter's icy moon Europa—key ingredients for alien life.",
          student: "By detecting ultraviolet aurora-lit water plumes on Europa and water-vapor signatures on habitable-zone exoplanets (like K2-18b), Hubble guides astrobiology targets.",
          teacher: "Show how space telescopes indirectly hunt for habitability via biosignature precursors like H₂O and O₃.",
          scientist: "UV transit observations constrain stellar flare EUV/FUV photoevaporation rates that govern volatile retention and prebiotic chemistry on M-dwarf exoplanets.",
        },
        highlights: [
          "Detected water vapor plumes above Europa's subsurface ocean",
          "First atmospheric spectra of exoplanets (HD 209458b, WASP-39b, K2-18b)",
          "Maps star-forming regions where heavy elements for life are forged",
        ],
      },
      engineering: {
        summary: {
          explorer: "Shaped like a school bus wrapped in shiny thermal foil, Hubble was upgraded five times in space by spacewalking astronauts!",
          student: "Multi-layer insulation (MLI) shields optical alignment from ±100°C orbital day/night temperature swings.",
          teacher: "Point out its dual rigid solar wings, open aperture door, and modular bay architecture designed for orbital servicing.",
          scientist: "11,110 kg dry mass, 2.8 kW average power from GaAs solar arrays + NiH₂ batteries; operating in reduced-gyro mode using Fine Guidance Sensors & star trackers.",
        },
        specs: [
          { label: "Launch Mass", value: "11,110 kg" },
          { label: "Length × Diameter", value: "13.2 m × 4.2 m" },
          { label: "Power", value: "2.8 kW (GaAs arrays)" },
          { label: "Operational Since", value: "April 24, 1990" },
        ],
      },
    },
  },

  tiangong: {
    id: "tiangong",
    noradId: 48274,
    name: "Tiangong Space Station (CSS)",
    subtitle: "Modular Orbital Laboratory · NORAD 48274",
    category: "station",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Real-time SGP4 propagation from CelesTrak TLE; 3-module T-shaped crewed station.",
    has3DModel: true,
    overview: {
      explorer:
        "China's sleek T-shaped 'Heavenly Palace' orbiting ~390 km above Earth—permanently crewed by taikonauts conducting space science, robotics, and ultra-efficient ion-thruster orbit maintenance.",
      student:
        "Completed in 2022 from three pressurized modules (Tianhe core, Wentian, and Mengtian labs), Tiangong is the first human space station to use electric Hall-effect ion thrusters to counteract atmospheric drag.",
      teacher:
        "Great comparison with the ISS: lighter (~100 t vs 420 t), lower inclination (41.5° vs 51.6°), modern flexible solar wings, and electric xenon propulsion.",
      scientist:
        "NORAD 48274 (2021-035A), ~390 km altitude, 41.47° inclination. Equipped with 4 × 80 mN Hall-effect ion thrusters (LHT-100) using ionized xenon propellant for high-Isp orbital station-keeping.",
    },
    quickFacts: [
      { label: "Configuration", value: "T-Shaped (3 Core Modules)" },
      { label: "Altitude", value: "~385 – 400 km" },
      { label: "Inclination", value: "41.5°" },
      { label: "Propulsion", value: "4× Hall-Effect Ion Thrusters" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Instead of only burning rocket fuel, Tiangong gently pushes itself higher using glowing electric plasma beams!",
          student: "Hall-effect thrusters accelerate xenon ions using crossed electric and magnetic fields (E × B), achieving ~5–10× higher specific impulse (exhaust velocity) than chemical thrusters.",
          teacher: "Use Tiangong to compare chemical propulsion (high thrust, low Isp) vs. electric plasma propulsion (gentle thrust, ultra-high fuel efficiency).",
          scientist: "LHT-100 Hall thrusters achieve Isp > 1,500 s at ~1.35 kW each; lower 41.5° inclination optimizes payload mass from Wenchang and Jiuquan launch sites.",
        },
        equations: [
          { label: "Hall Ion Exhaust Speed", formula: "vₑ = √(2 q V / m_Xe)", value: "~15–20 km/s" },
          { label: "Lorentz Force", formula: "F = q(E + v × B)", value: "Plasma confinement" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Uses noble gas xenon for electric thrusters and closed-loop recycling to convert wastewater and CO₂ back into breathable air.",
          student: "Xenon (Xe, atomic mass 131.3 u) is ideal for ion engines because it is heavy (more momentum per ion), inert, and easily ionized by electron bombardment.",
          teacher: "Highlight why heavy noble gases (Xe, Kr, Ar) dominate modern space propulsion chemistry.",
          scientist: "Xenon ionization energy (12.13 eV) + high atomic mass maximizes thrust-to-power ratio; regenerative ECLSS recovers >90% water and scrubs CO₂ via solid amine beds.",
        },
        compounds: [
          { name: "Xenon Propellant", formula: "Xe → Xe⁺ + e⁻", role: "Heavy noble-gas plasma propellant" },
          { name: "Sabatier / Electrolysis", formula: "H₂O / O₂ / CO₂", role: "Closed-loop crew life support" },
        ],
      },
      biology: {
        summary: {
          explorer: "Hosts space-grown rice seeds, fruit flies, zebrafish, and human physiology experiments testing long-term life in orbit.",
          student: "Wentian's life-ecology cabinets successfully grew rice from seed-to-seed in microgravity and maintained aquatic ecosystems with zebrafish and hornwort algae.",
          teacher: "Compare closed ecological life support (fish + algae O₂/CO₂ balance) with mechanical chemical life support.",
          scientist: "Wentian Biotechnology & Ecology racks investigate closed aquatic bioregenerative loops (Danio rerio + Ceratophyllum), osteoblast mechanotransduction, and stem cell differentiation.",
        },
        highlights: [
          "Completed full seed-to-seed rice lifecycle in microgravity",
          "Maintained aquatic zebrafish + algae closed ecosystem in orbit",
          "Features 10-meter robotic arm for extravehicular module relocation",
        ],
      },
      engineering: {
        summary: {
          explorer: "Features huge ultra-thin roll-out flexible solar wings and a 10-meter robotic arm that can crawl along the outside of the station like an inchworm.",
          student: "Triple-junction flexible GaAs solar arrays deliver ~100 kW of power at a fraction of the mass of older rigid panels.",
          teacher: "Observe Tiangong's distinctive T-shaped geometry in 3D LOD mode.",
          scientist: "~100 metric tons total mass, ~110 m³ habitable volume, two articulated robotic manipulators (10 m + 5 m) capable of end-to-end inchworm locomotion.",
        },
        specs: [
          { label: "Power", value: "~100 kW (Flexible GaAs)" },
          { label: "Habitable Volume", value: "~110 m³" },
          { label: "Mass", value: "~100 metric tons" },
          { label: "Crew Capacity", value: "3 (6 during handover)" },
        ],
      },
    },
  },

  starlink: {
    id: "starlink",
    name: "Starlink LEO Constellation",
    subtitle: "Low-Latency Laser-Mesh Broadband Shell · ~550 km",
    category: "starlink",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Real-time SGP4 propagation of live Starlink orbital shells (representative LEO swarm).",
    has3DModel: true,
    overview: {
      explorer:
        "Thousands of flat, shark-fin satellites racing in organized orbital shells ~550 km overhead, beaming high-speed internet to ships, planes, and remote villages using space lasers!",
      student:
        "Operating at ~540–570 km instead of 35,786 km geostationary orbit slashes radio light-travel round-trip latency from ~600 ms down to ~25–40 ms.",
      teacher:
        "Discuss both the physics triumph (low-latency optical inter-satellite links in vacuum, where light travels 47% faster than in glass fiber!) and the astronomy challenge (satellite streaks in telescopes).",
      scientist:
        "Multi-shell Walker-Delta constellation (53°, 43°, 70°, 97.6° inclinations). Ku/Ka/E-band phased-array user/gateway links + 100 Gbps optical inter-satellite laser links (OISLs) with autonomous conjunction avoidance.",
    },
    quickFacts: [
      { label: "Shell Altitude", value: "~540 – 570 km" },
      { label: "Round-Trip Latency", value: "25 – 45 ms" },
      { label: "Propulsion", value: "Argon / Krypton Hall Thrusters" },
      { label: "Inter-Sat Link", value: "Space Lasers (c = 3×10⁸ m/s)" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Light travels ~47% faster through empty space than through undersea glass fiber cables, letting space lasers beat ocean cables across continents!",
          student: "Speed of light in silica fiber is c/n ≈ 2.04×10⁸ m/s (n ≈ 1.47), while vacuum optical laser links run at full c = 3.00×10⁸ m/s.",
          teacher: "Have students calculate minimum round-trip light delay: 2 × 550 km / c ≈ 3.7 ms propagation time vs. 2 × 35,786 km / c ≈ 239 ms for GEO satellites.",
          scientist: "Free-space optical (FSO) links exploit vacuum n = 1.000; autonomous collision avoidance executes micro-Δv burns when Pc > 10⁻⁵; low altitude ensures passive atmospheric deorbit within <5 years upon failure.",
        },
        equations: [
          { label: "Vacuum vs Fiber Speed", formula: "v_fiber = c / 1.47", value: "47% faster in vacuum" },
          { label: "Nadir Round-Trip Light", formula: "Δt = 2h / c", value: "3.67 ms @ 550 km" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Runs on cheap argon or krypton gas thrusters—and is engineered to burn up completely into tiny vaporized dust when retired.",
          student: "Switching from rare xenon to abundant krypton and argon (1% of Earth's air!) dramatically cuts propellant cost while maintaining efficient plasma thrust.",
          teacher: "Highlight atmospheric reentry ablation chemistry: aluminum-alloy vaporization in the mesosphere is an active area of upper-atmosphere chemistry research.",
          scientist: "Argon/Krypton Hall-effect ionization trades slightly higher ionization potential (15.76 eV Ar) for >100× propellant cost reduction; full demisability design avoids ground casualty risk while injecting Al₂O₃ aerosol into the mesosphere.",
        },
        compounds: [
          { name: "Argon / Krypton Plasma", formula: "Ar⁺ / Kr⁺", role: "Low-cost noble-gas Hall thruster propellant" },
          { name: "Reentry Ablation", formula: "Al → Al₂O₃", role: "Complete thermal demise in upper atmosphere" },
        ],
      },
      biology: {
        summary: {
          explorer: "Connects remote field biologists, ocean research vessels, and emergency telemedicine clinics far beyond cell towers.",
          student: "High-bandwidth connectivity from LEO enables real-time remote wildlife telemetry, Arctic climate stations, and telemedicine in isolated regions.",
          teacher: "Balance benefits (global education & emergency connectivity) with dark-sky ecological & astronomical preservation.",
          scientist: "Enables real-time remote environmental genomics & oceanographic buoy telemetry; dark dielectric mirror films reduce optical magnitude to mitigate interference with wide-field sky surveys.",
        },
        highlights: [
          "Passive orbital decay guarantees natural burn-up within ~5 years if propulsion fails",
          "Dark anti-reflective coatings engineered to reduce night-sky brightness",
          "Powers real-time remote ocean, polar, and wildlife research stations",
        ],
      },
      engineering: {
        summary: {
          explorer: "Flat-packed like a stack of pizzas inside a Falcon 9 fairing, each satellite unfolds a single vertical solar fin once deployed in space.",
          student: "Mass-produced flat-panel chassis integrates phased-array antennas, star trackers, reaction wheels, and laser terminals into a single low-profile frame.",
          teacher: "Point out the 'Starlink Train' deployment pattern right after launch before satellites climb to their operational 550 km shell.",
          scientist: "V2 Mini mass ~730–800 kg, dual/single articulated solar arrays, solid-state electronically steered phased arrays tracking moving ground terminals across 40°+ off-nadir cones.",
        },
        specs: [
          { label: "Chassis Mass (V2 Mini)", value: "~750 kg" },
          { label: "Design Lifetime", value: "~5 years (fully demisable)" },
          { label: "Link Spectrum", value: "Ku / Ka / E-Band + Optical" },
          { label: "Orbit Control", value: "Autonomous Conjunction Avoidance" },
        ],
      },
    },
  },

  landsat: {
    id: "landsat",
    name: "Landsat 8 / 9 Earth Observatory",
    subtitle: "NASA / USGS Sun-Synchronous Multispectral Imager · ~705 km",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "64-bit SGP4 propagation of live Sun-Synchronous LEO orbital elements.",
    has3DModel: true,
    overview: {
      explorer:
        "Earth's sharpest continuous space photographer! Every 16 days, Landsat scans every forest, river, glacier, and city on the planet in 11 visible and thermal colors.",
      student:
        "Flies in a 98.2° sun-synchronous polar orbit at 705 km—meaning Earth's equatorial bulge precesses its orbit by ~0.986°/day so it crosses every city at the exact same local solar time (10:00 AM).",
      teacher:
        "Highlight the 50+ year continuous Landsat data archive: compare deforestation, glacier retreat, and urban heat islands using optical + thermal infrared bands.",
      scientist:
        "98.2° inclination J₂-precessed SSO (185 km swath, 16-day repeat cycle). Carries OLI-2 (9 spectral bands, 14-bit quantization, 30 m GSD / 15 m pan) and TIRS-2 (10.8 & 12.0 μm thermal IR).",
    },
    quickFacts: [
      { label: "Orbit Type", value: "98.2° Sun-Synchronous" },
      { label: "Spatial Resolution", value: "15 m Pan / 30 m Multi" },
      { label: "Spectral Bands", value: "11 (Coastal → Thermal IR)" },
      { label: "Repeat Cycle", value: "16 days (8d with L8+L9)" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Uses Earth's slight equatorial bulge like a cosmic gyroscope so the Sun always lights up the ground at the same angle!",
          student: "Earth's oblateness (J₂ perturbation) applies a torque to a 98.2° retrograde orbit, rotating the orbital plane 360° per year in lockstep with Earth's orbit around the Sun.",
          teacher: "Use Landsat to teach Nodal Precession (dΩ/dt) and why Sun-Synchronous Orbits are slightly retrograde (>90°).",
          scientist: "dΩ/dt = −(3/2) J₂ (R_E / p)² n cos(i) = +1.991×10⁻⁷ rad/s. Push-broom focal plane arrays eliminate mechanical scan-mirror wear.",
        },
        equations: [
          { label: "Nodal Precession", formula: "dΩ/dt = +0.9856° / day", value: "Locked to Earth's year" },
          { label: "Thermal IR Bands", formula: "λ = 10.8 μm & 12.0 μm", value: "Land Surface Temp" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Detects invisible chemical fingerprints of healthy chlorophyll in leaves, minerals in rocks, and algae blooms in lakes.",
          student: "Short-Wave Infrared (SWIR) bands detect leaf water content, burn scars, and iron-oxide/clay mineral absorption features.",
          teacher: "Explain NDVI = (NIR − Red) / (NIR + Red) to link plant biochemistry directly to orbital remote sensing.",
          scientist: "OLI-2 SWIR (1.57–1.65 μm & 2.11–2.29 μm) discriminates hydroxyl-bearing clay minerals, carbonate rocks, and foliar moisture via vibrational overtone absorption.",
        },
        compounds: [
          { name: "Chlorophyll-a Reflectance", formula: "NIR 0.86 μm", role: "Global biosphere & crop health mapping" },
          { name: "Water & Clay Absorption", formula: "SWIR 2.2 μm", role: "Mineralogy & wildfire severity detection" },
        ],
      },
      biology: {
        summary: {
          explorer: "Tracks Amazon rainforest recovery, coral reef bleaching, agricultural irrigation, and wildfire impacts from space.",
          student: "Measures evapotranspiration (crop water usage) via thermal IR so farmers and hydrologists can conserve freshwater basins.",
          teacher: "Connects ecology, hydrology, and climate biology at planetary scale.",
          scientist: "Quantifies global primary productivity, phenology shifts, coastal chlorophyll-a blooms, and ecosystem evapotranspiration via split-window thermal algorithms.",
        },
        highlights: [
          "Monitors global deforestation, wildfire recovery & glacier retreat",
          "Maps crop evapotranspiration and drought stress in 100 m thermal IR",
          "Open public archive spanning 50+ years of planetary biosphere history",
        ],
      },
      engineering: {
        summary: {
          explorer: "Powered by a single massive wing-like solar array on one side while its two precision space cameras point straight down at Earth.",
          student: "Cryocooled quantum-well infrared photodetectors (QWIPs) inside TIRS-2 stay at 43 K (-230°C) to measure tiny ground temperature differences.",
          teacher: "Point out Landsat's real NASA 3D replica silhouette: octagonal spacecraft bus, nadir optical baffles, and asymmetric solar array.",
          scientist: "LEOStar-3 bus (~2,711 kg launch mass), 43 K closed-cycle cryocooler for TIRS-2 QWIPs, X-band 384 Mbps science downlink, hydrazine attitude/orbit maintenance.",
        },
        specs: [
          { label: "Primary Payloads", value: "OLI-2 + TIRS-2" },
          { label: "Detector Cooling", value: "43 K (-230°C) Cryocooler" },
          { label: "Swath Width", value: "185 km" },
          { label: "Data Downlink", value: "X-Band (384 Mbps)" },
        ],
      },
    },
  },

  terra: {
    id: "terra",
    name: "Terra / Aqua Earth Observing System",
    subtitle: "NASA Flagship Climate, Ocean & Atmospheric Chemistry Satellites · ~705 km",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "64-bit SGP4 propagation of NASA EOS Sun-Synchronous constellation.",
    has3DModel: true,
    overview: {
      explorer:
        "NASA's flying climate laboratories! Carrying 5–6 super-instruments at once, Terra and Aqua measure Earth's energy budget, wildfire smoke, ocean temperatures, and global carbon cycle.",
      student:
        "Terra crosses the equator at 10:30 AM (morning clouds) while sister craft Aqua crosses at 1:30 PM (afternoon warming), giving scientists a synchronized view of Earth's daily energy & water cycles.",
      teacher:
        "Use Terra & Aqua to teach Earth's Radiative Energy Budget (incoming solar vs outgoing thermal IR measured by CERES).",
      scientist:
        "Multi-instrument EOS flagships (MODIS 36-band spectroradiometer, CERES broadband radiation budget, ASTER/AIRS/AMSR-E) quantifying aerosol radiative forcing, CO plumes, and cryosphere albedo.",
    },
    quickFacts: [
      { label: "Primary Sensor", value: "MODIS (36 Spectral Bands)" },
      { label: "Orbit", value: "705 km Sun-Synchronous" },
      { label: "Mission Focus", value: "Carbon, Water & Energy Cycles" },
      { label: "Launch Mass", value: "~4,864 kg (Terra)" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Measures how much sunlight Earth absorbs vs. how much heat it radiates back into dark space!",
          student: "CERES instruments measure Earth's net radiative imbalance in W/m² across reflected shortwave solar and emitted longwave infrared spectra.",
          teacher: "Connect Stefan-Boltzmann radiation (P = εσAT⁴) directly to CERES outgoing longwave measurements.",
          scientist: "CERES tracks TOA radiative flux (0.3–100 μm) while MISR captures multi-angle aerosol scattering phase functions across 9 viewing cameras.",
        },
        equations: [
          { label: "Stefan-Boltzmann", formula: "F = ε σ T⁴", value: "Outgoing Longwave IR" },
          { label: "MODIS Spectrum", formula: "0.4 μm → 14.4 μm", value: "36 calibrated bands" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Sniffs invisible carbon monoxide plumes from mega-wildfires and tracks atmospheric water vapor and ozone worldwide.",
          student: "MOPITT and AIRS use infrared gas-correlation spectroscopy to map tropospheric CO, CH₄, CO₂, and atmospheric humidity profiles.",
          teacher: "Show how molecular vibrational absorption lines allow satellites to measure air pollution from 705 km above Earth.",
          scientist: "AIRS (2,378 IR channels) retrieves vertical temperature/H₂O/O₃/CO/CH₄ profiles; MOPITT measures 4.7 μm thermal and 2.3 μm solar CO absorption bands.",
        },
        compounds: [
          { name: "Carbon Monoxide", formula: "CO (4.7 μm)", role: "Wildfire & biomass burning plume tracer" },
          { name: "Atmospheric Water", formula: "H₂O Vapor", role: "Global hydrological & greenhouse feedback" },
        ],
      },
      biology: {
        summary: {
          explorer: "Watches the entire planet 'breathe' every season—tracking ocean phytoplankton blooms and spring green-up across continents.",
          student: "MODIS ocean-color bands detect microscopic marine phytoplankton chlorophyll, which produces roughly half of Earth's oxygen.",
          teacher: "Demonstrate seasonal biosphere respiration and marine food-web productivity from orbit.",
          scientist: "Quantifies global terrestrial GPP/NPP, marine chlorophyll-a fluorescence, and coral reef thermal stress anomalies.",
        },
        highlights: [
          "Maps global marine phytoplankton blooms producing ~50% of Earth's O₂",
          "Tracks daily active wildfires and transcontinental smoke plumes",
          "Measures polar sea-ice albedo feedback and glacier mass balance",
        ],
      },
      engineering: {
        summary: {
          explorer: "School-bus-sized flagship spacecraft built with gold thermal blankets and a giant unfolding solar sail wing.",
          student: "Active thermal louvers, capillary-pumped heat pipes, and multi-layer Kapton insulation keep sensitive optics stable across extreme day/night swings.",
          teacher: "Inspect Terra/Aqua's authentic multi-instrument NASA 3D replica in orbital close-up!",
          scientist: "Graphite-epoxy bus structure, 2.5 kW GaAs solar array, solid-state recorder (140 Gb), S/X-band TDRSS & direct broadcast downlinks.",
        },
        specs: [
          { label: "Instruments", value: "MODIS · CERES · ASTER · MISR · MOPITT" },
          { label: "Power Array", value: "2.5 kW GaAs Solar Wing" },
          { label: "Mass", value: "~4,864 kg" },
          { label: "Design Life", value: "6 yr (25+ yr operational!)" },
        ],
      },
    },
  },

  weather: {
    id: "weather",
    name: "NOAA JPSS / Suomi Polar Weather",
    subtitle: "NOAA / NASA Polar-Orbiting Numerical Weather Prediction · ~824 km",
    category: "weather",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "64-bit SGP4 propagation of live NOAA/JPSS polar meteorological orbit.",
    has3DModel: true,
    overview: {
      explorer:
        "The backbone of every 3-to-7 day weather forecast on Earth! Flying over both poles 14 times a day, these satellites slice through hurricanes with microwave radar and night-vision cameras.",
      student:
        "Provides ~85% of the atmospheric temperature and moisture profile data fed into global supercomputer weather prediction models.",
      teacher:
        "Compare polar-orbiting LEO weather satellites (~824 km, high-res global slices) with GEO weather satellites (35,786 km, constant hemispheric watch in Shell 1B).",
      scientist:
        "824 km SSO (98.7° incl., 13:30 LTAN). Carries VIIRS (22-band imager + Day/Night Band), CrIS (hyperspectral IR sounder), ATMS (22-channel microwave sounder), and OMPS ozone profiler.",
    },
    quickFacts: [
      { label: "Altitude", value: "~824 km (Polar SSO)" },
      { label: "Forecast Impact", value: "~85% of Global NWP Data" },
      { label: "Night Vision", value: "VIIRS Day/Night Band" },
      { label: "Cloud Penetrator", value: "ATMS 22-Ch Microwave" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Uses microwaves to see straight through thick hurricane clouds and measure the storm's warm inner eye!",
          student: "ATMS passive microwave radiometers detect oxygen (50–60 GHz) and water-vapor (183 GHz) thermal emission right through opaque cloud decks.",
          teacher: "Show how electromagnetic wavelength determines cloud penetration: optical sees cloud tops, microwave probes storm cores.",
          scientist: "Radiative transfer inversion of CrIS (2,211 IR channels) + ATMS (23.8–183.3 GHz) yields 3D atmospheric temperature/humidity profiles at ~1 K accuracy.",
        },
        equations: [
          { label: "O₂ Microwave Band", formula: "ν = 50 – 60 GHz", value: "3D temp sounding" },
          { label: "Orbit Swath", formula: "3,000 km wide", value: "Full Earth 2× daily" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Monitors Earth's protective ozone layer, volcanic sulfur dioxide clouds, and city air quality day and night.",
          student: "OMPS measures ultraviolet backscatter to map stratospheric ozone (O₃) thickness and tracks volcanic SO₂ plumes hazardous to aircraft.",
          teacher: "Connect atmospheric ozone chemistry (Chapman cycle) to live orbital UV spectroscopy.",
          scientist: "OMPS Nadir/Limb UV-Vis spectrometers (250–1000 nm) quantify total column O₃ and vertical stratospheric ozone profiles; VIIRS detects nocturnal gas flaring & biomass combustion.",
        },
        compounds: [
          { name: "Stratospheric Ozone", formula: "O₃ (UV 300 nm)", role: "UV shield & polar ozone-hole monitoring" },
          { name: "Volcanic Sulfur", formula: "SO₂", role: "Aviation ash & volcanic plume tracking" },
        ],
      },
      biology: {
        summary: {
          explorer: "Maps sea-surface temperatures for fisheries, coral reef bleaching alerts, and wildfire danger across ecosystems.",
          student: "High-resolution sea surface temperature (SST) maps reveal El Niño / La Niña shifts that reshape global marine ecosystems and rainfall.",
          teacher: "Link ocean thermodynamics directly to coral bleaching and extreme weather preparedness.",
          scientist: "VIIRS 375 m I-band thermal anomalies detect early wildfire ignition; ocean chlorophyll & SST products feed marine ecosystem & hurricane intensity models.",
        },
        highlights: [
          "Feeds ~85% of global 3-to-7 day weather & hurricane track forecasts",
          "VIIRS Day/Night Band captures city blackouts, auroras & fishing fleets",
          "OMPS tracks global stratospheric ozone layer recovery daily",
        ],
      },
      engineering: {
        summary: {
          explorer: "Carries a massive multi-instrument optical & microwave deck with a single canted high-efficiency solar wing.",
          student: "Continuous Ka-band & X-band direct broadcast beams live weather imagery down to ground stations worldwide in real time.",
          teacher: "Inspect the official NASA/NOAA Suomi NPP / JPSS 3D replica up close!",
          scientist: "BCP-2000 / LEOStar-3 class bus (~2,540 kg), 4-axis reaction wheels, star trackers, Ka-band 300 Mbps stored mission data downlink to Svalbard & McMurdo polar stations.",
        },
        specs: [
          { label: "Instrument Suite", value: "VIIRS · CrIS · ATMS · OMPS · CERES" },
          { label: "Orbit Period", value: "~101.4 minutes" },
          { label: "Downlink", value: "Ka-Band (300 Mbps) + HRD" },
          { label: "Launch Mass", value: "~2,540 kg" },
        ],
      },
    },
  },

  fermi: {
    id: "fermi",
    name: "High-Energy Space Observatory",
    subtitle: "NASA Gamma-Ray & X-Ray Astrophysics Telescope · ~535 km",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "64-bit SGP4 propagation of low-inclination LEO astrophysics orbit.",
    has3DModel: true,
    overview: {
      explorer:
        "Hunts the most violent explosions in the entire cosmos—supermassive black hole jets, colliding neutron stars, and gamma-ray bursts—from safely above Earth's gamma-blocking atmosphere!",
      student:
        "Gamma rays are too energetic to bounce off mirrors; instead, Fermi converts each gamma-ray photon into an electron-positron pair (E = mc²) inside tungsten foils to trace its cosmic origin!",
      teacher:
        "A brilliant classroom bridge between Einstein's E = mc² pair production and orbital astrophysics.",
      scientist:
        "Low-inclination LEO (~25.6°, 535 km) minimizes South Atlantic Anomaly trapped-proton background. LAT detects 20 MeV – >300 GeV photons via tungsten-silicon pair-conversion tracker + CsI calorimeter.",
    },
    quickFacts: [
      { label: "Energy Range", value: "8 keV → >300 GeV" },
      { label: "Detection Physics", value: "γ → e⁻ + e⁺ (E = mc²)" },
      { label: "Field of View", value: "2.4 sr (~20% of Sky)" },
      { label: "Inclination", value: "~25.6° (Low Radiation)" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Turns pure invisible gamma-ray light directly into matter and antimatter particles to photograph black holes and pulsars!",
          student: "Pair production converts a high-energy gamma photon (>1.022 MeV) into an electron + positron pair whose tracks pinpoint the distant galaxy or neutron star.",
          teacher: "Demonstrate why Earth's atmosphere blocks gamma rays (protecting life) and why we must put gamma-ray telescopes in LEO.",
          scientist: "Pair-conversion tracking achieves <0.15° angular resolution above 10 GeV; GBM triggers on sub-second Gamma-Ray Bursts (GRBs) and kilonova counterparts to gravitational waves (e.g. GW170817).",
        },
        equations: [
          { label: "Pair Production", formula: "γ → e⁻ + e⁺ (E ≥ 2mₑc²)", value: "1.022 MeV threshold" },
          { label: "Photon Energy", formula: "E = h ν", value: "10⁷× visible light energy" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Uses ultra-dense tungsten foil sheets and glowing cesium-iodide crystals to catch cosmic gamma rays.",
          student: "High-atomic-number tungsten (Z = 74) maximizes pair-production probability, while thallium-doped CsI(Tl) scintillator crystals measure total photon energy.",
          teacher: "Connect periodic-table atomic number (Z) to high-energy radiation interaction cross-sections.",
          scientist: "16-tower silicon-strip tracker interleaved with W converter foils (Z = 74), backed by 1,536 CsI(Tl) hodoscopic calorimeter crystals and plastic scintillator anticoincidence shield.",
        },
        compounds: [
          { name: "Tungsten Foils", formula: "W (Z = 74)", role: "Gamma-to-e⁻e⁺ pair-conversion layers" },
          { name: "Cesium Iodide", formula: "CsI(Tl)", role: "Scintillation calorimeter energy readout" },
        ],
      },
      biology: {
        summary: {
          explorer: "Studies lethal cosmic gamma-ray bursts and solar flares—showing how vital Earth's atmosphere is for shielding all life below!",
          student: "Understanding cosmic gamma-ray bursts and galactic cosmic rays helps astrobiologists evaluate planetary habitability across the Milky Way.",
          teacher: "Link high-energy radiation biology to Earth's atmospheric shielding and exoplanet biosignature survival.",
          scientist: "Characterizes high-energy ionizing environments around pulsars, magnetars, and active galactic nuclei relevant to galactic habitable zone constraints and terrestrial atmospheric ozone depletion events.",
        },
        highlights: [
          "Detected gamma-ray flash from colliding neutron stars (GW170817)",
          "Discovered giant 50,000-light-year 'Fermi Bubbles' erupting from Milky Way core",
          "Even detects Terrestrial Gamma-ray Flashes (antimatter!) from Earth lightning",
        ],
      },
      engineering: {
        summary: {
          explorer: "Sweeps the entire sky every 3 hours by gently rocking back and forth in orbit while its twin solar wings track the Sun.",
          student: "Plastic anticoincidence dome rejects >99.97% of charged cosmic rays so only true cosmic gamma rays are recorded.",
          teacher: "Inspect NASA's official Fermi / Swift 3D spacecraft models directly in orbital view!",
          scientist: "4,303 kg mass, 1.75 kW dual articulating solar arrays, autonomous fast-slew repointing for bright GRB targets of opportunity, Ku-band TDRSS telemetry.",
        },
        specs: [
          { label: "Primary Detectors", value: "LAT + 14× GBM Scintillators" },
          { label: "Full-Sky Survey", value: "Every 3 Hours (2 Orbits)" },
          { label: "Cosmic-Ray Rejection", value: ">99.97% Anticoincidence" },
          { label: "Mass", value: "~4,303 kg" },
        ],
      },
    },
  },

  debris: {
    id: "debris",
    name: "Tracked Orbital Debris Fragment",
    subtitle: "Uncontrolled Hypervelocity LEO Fragment / Spent Stage · Collision Watch",
    category: "debris",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "64-bit SGP4 propagation of U.S. Space Surveillance Network radar-tracked debris catalog.",
    has3DModel: true,
    overview: {
      explorer:
        "A tumbling piece of space junk—either a spent rocket stage or a shattered satellite fragment—screaming around Earth faster than a rifle bullet! Even a 1 cm bolt carries the punch of a bowling ball at 100 km/h.",
      student:
        "At ~7.5 km/s orbital speed, kinetic energy (½mv²) is enormous: a 10-gram aluminum fragment carries ~280 kJ—comparable to a compact car crashing at highway speed!",
      teacher:
        "Introduce Kessler Syndrome: a cascading chain reaction where orbital collisions generate exponentially more debris fragments if orbits aren't actively managed.",
      scientist:
        "Radar-tracked (>10 cm) uncontrolled object exhibiting non-conservative area-to-mass atmospheric drag decay and chaotic gravity-gradient / eddy-current tumble. Monitored continuously for conjunction screening (Pc thresholds).",
    },
    quickFacts: [
      { label: "Impact Velocity", value: "7.5 – 14.5 km/s (Relative)" },
      { label: "Tracked Objects", value: ">35,000 (>10 cm)" },
      { label: "Cascade Risk", value: "Kessler Syndrome" },
      { label: "Natural Cleanup", value: "Thermospheric Drag Decay" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Because two crossing orbits can collide head-on at 14 km/s (50,000 km/h), tiny paint flecks can crack spacecraft windows!",
          student: "Specific kinetic energy at 10 km/s impact is 50 MJ/kg—more than 10× the chemical explosive energy of TNT (4.18 MJ/kg)!",
          teacher: "Have students calculate E_k = ½mv² for a 5 g bolt at 10 km/s and compare it to everyday moving objects.",
          scientist: "Hypervelocity impacts (>3 km/s) exceed material sound speeds, generating shockwaves that vaporize both projectile and target; Whipple bumper shields disperse impactors into an expanding vapor cloud.",
        },
        equations: [
          { label: "Impact Energy", formula: "E_k = ½ m v_rel²", value: "~50 MJ/kg @ 10 km/s" },
          { label: "Drag Deceleration", formula: "a_D = −½ ρ v² (C_D A / m)", value: "Drives orbital decay" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Atomic oxygen and harsh solar UV slowly brittle old thermal blankets and paint until atmospheric friction vaporizes the fragment on reentry.",
          student: "Unshielded atomic oxygen (O) in LEO erodes polymer Kapton coatings and paint binders, flaking off microscopic paint-chip debris.",
          teacher: "Connect materials degradation in space to why modern spacecraft use atomic-oxygen-resistant coatings.",
          scientist: "Hyperthermal atomic oxygen (4.5 eV) oxidizes Kapton/Mylar polymers; solar UV embrittles surface coatings; high-altitude reentry oxidizes Al/Ti alloys into mesospheric aerosols.",
        },
        compounds: [
          { name: "Atomic Oxygen Erosion", formula: "O(³P) + Polymer", role: "Embrittles thermal foil & paint layers" },
          { name: "Aluminum-Lithium Alloy", formula: "Al-Li / Ti", role: "Primary structural rocket & hull fragments" },
        ],
      },
      biology: {
        summary: {
          explorer: "Forces ISS and Tiangong astronauts to perform Debris Avoidance Maneuvers (DAMs) or shelter briefly inside their crew capsules if a fragment passes too close.",
          student: "Protecting crewed stations requires continuous radar tracking and pre-planned orbital thruster boosts whenever collision probability exceeds 1 in 10,000.",
          teacher: "Discuss sustainable space stewardship so future generations can safely launch and explore space.",
          scientist: "NASA/ESA conjunction assessment mandates ISS PDAM thruster burns when Pc > 10⁻⁴ (red threshold) within the 4×50×50 km pizza-box screening volume.",
        },
        highlights: [
          "ISS has executed 35+ Debris Avoidance Maneuvers since 1999",
          "Whipple multi-layer shields protect crew hulls against <1 cm particles",
          "Active Debris Removal (ADR) missions test nets, harpoons & robotic capture",
        ],
      },
      engineering: {
        summary: {
          explorer: "Tumbles uncontrollably with no working thrusters—slowly spiraling lower as thin upper-air molecules brake it over years.",
          student: "Modern 5-year post-mission disposal rules require new satellites to actively deorbit or passivate batteries and propellant tanks.",
          teacher: "Show how our 3D engine renders tumbling scorched debris fragments distinctly from active attitude-stabilized satellites!",
          scientist: "High area-to-mass ratio (HAMR) MLI shards suffer strong solar radiation pressure (SRP) eccentricity perturbations; passive drag sails & electrodynamic tethers accelerate deorbit.",
        },
        specs: [
          { label: "Attitude State", value: "Uncontrolled 3-Axis Tumble" },
          { label: "Tracking Method", value: "Phased-Array Radar & Optical" },
          { label: "Mitigation Rule", value: "5-Year LEO Deorbit Standard" },
          { label: "Shielding Tech", value: "Stuffed Whipple / Nextel-Kevlar" },
        ],
      },
    },
  },

  gps: {
    id: "gps",
    name: "MEO Global Navigation (GPS / Galileo)",
    subtitle: "Medium Earth Orbit Atomic-Clock Trilateration · ~20,200 – 23,222 km",
    category: "gnss",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "64-bit SGP4 propagation of live MEO GNSS constellations (GPS, Galileo, GLONASS, BeiDou).",
    has3DModel: true,
    overview: {
      explorer:
        "Space's ultra-precise lighthouse network! Orbiting halfway out inside the outer Van Allen radiation belt, GPS and Galileo beam nanosecond atomic-clock radio timestamps so every phone, plane, and ship knows its exact position to within meters.",
      student:
        "Cruises in 12-hour Medium Earth Orbit (~20,200 km) where Einstein's General & Special Relativity shift onboard atomic clocks by +38.6 microseconds every day—without relativistic software compensation, GPS would drift by ~11.4 km every 24 hours!",
      teacher:
        "Use GPS/Galileo to prove Einstein's Relativity in everyday life: show how weaker gravity at 20,200 km speeds clocks up (+45.9 μs/day) more than orbital velocity slows them down (−7.2 μs/day).",
      scientist:
        "6-plane 55° Walker constellation (GPS: a = 26,560 km, T = 11h 58m; Galileo: 29,600 km, 56°). Broadcasts CDMA L1/L2/L5 spread-spectrum navigation signals synchronized to rubidium/cesium/passive-hydrogen-maser frequency standards (~10⁻¹⁴ stability).",
    },
    quickFacts: [
      { label: "MEO Altitude", value: "20,200 – 23,222 km" },
      { label: "Einstein Clock Shift", value: "+38.6 μs / day (Net GR+SR)" },
      { label: "Orbital Period", value: "~11h 58m – 14h 05m" },
      { label: "Radiation Zone", value: "Outer Van Allen Belt" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Time literally ticks faster up here than on Earth's surface—because Earth's gravity is weaker at 20,200 km!",
          student: "General Relativity speeds GPS clocks by +45.9 μs/day (weaker gravitational potential), while Special Relativity slows them by −7.2 μs/day (3.87 km/s orbital speed), yielding +38.6 μs/day net drift.",
          teacher: "Demonstrate 4-satellite 3D trilateration (x, y, z, Δt) and why 1 nanosecond of timing error equals ~30 cm of position error (c × 1 ns = 0.2998 m).",
          scientist: "Δτ/τ = (GM/c²)(1/R_E − 1/r) − v²/(2c²) ≈ +4.465×10⁻¹⁰. Onboard synthesizers factory-offset base oscillator from 10.23 MHz down to 10.22999999543 MHz prior to launch.",
        },
        equations: [
          { label: "Net Relativity Shift", formula: "Δt_GR + Δt_SR = +38.6 μs/d", value: "~11.4 km/day if uncorrected" },
          { label: "Light Distance / ns", formula: "Δd = c · 1 ns", value: "29.98 cm per nanosecond" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Inside the gold thermal box sit tiny vapor cells of pure rubidium and cesium atoms ticking billions of times per second!",
          student: "Rubidium-87 (6.83 GHz) and Cesium-133 (9.19 GHz) hyperfine electron spin transitions provide rock-steady atomic oscillation frequencies.",
          teacher: "Connect quantum electron hyperfine transitions in alkali metals (Rb, Cs) directly to global navigation timing.",
          scientist: "Space-qualified Rb-87 gas-cell clocks and Galileo Passive Hydrogen Masers (1.420 GHz) maintain Allan deviation < 10⁻¹⁴ over 10⁴ s; rad-hard SiGe & GaAs electronics survive >100 krad total ionizing dose.",
        },
        compounds: [
          { name: "Rubidium-87 Vapor", formula: "⁸⁷Rb (6.83 GHz)", role: "Primary GPS III atomic clock oscillator" },
          { name: "Hydrogen Maser", formula: "¹H (1.42 GHz)", role: "Galileo ultra-stable quantum timing reference" },
        ],
      },
      biology: {
        summary: {
          explorer: "Unshielded astronauts could not live at this altitude—it sits right inside Earth's outer Van Allen electron radiation belt!",
          student: "High-energy relativistic electrons (MeV) trapped in the outer Van Allen belt deliver severe ionizing radiation doses, which is why human space stations stay below 500 km in LEO.",
          teacher: "Compare radiation dose rates between ISS LEO (~0.5 mSv/day) and the Van Allen belts (tens of mSv/hour) during Apollo lunar transits.",
          scientist: "Trapped outer-belt electrons (0.5–10 MeV) induce deep-dielectric charging and bremsstrahlung X-rays inside spacecraft walls, requiring graded-Z aluminum/tantalum shielding for avionics.",
        },
        highlights: [
          "Orbits inside the Outer Van Allen Relativistic Electron Belt",
          "Too hazardous for long-term human habitation (crewed stations stay in LEO)",
          "Enables precision wildlife migration tagging, rescue beacons & global aviation",
        ],
      },
      engineering: {
        summary: {
          explorer: "Wrapped in crinkled gold Kapton blankets with a distinctive circular cluster of spiral helical antennas pointed straight down at Earth.",
          student: "12-element L-band helical phased antenna array shapes radio power evenly from nadir to Earth's limb so horizon receivers still lock cleanly.",
          teacher: "Inspect our MEO GPS III / Galileo 3D replica and toggle the Van Allen Belts layer to see GNSS flying right through the outer belt!",
          scientist: "GPS III (LM2100 bus, ~3,880 kg launch mass, 15-year design life) features radiation-hardened avionics, L1C/L2C/L5 civil signals, and 3× higher anti-jam broadcast power.",
        },
        specs: [
          { label: "Atomic Standards", value: "3× Rubidium / Passive H-Maser" },
          { label: "Broadcast Bands", value: "L1 (1575 MHz) · L2 · L5" },
          { label: "Design Life", value: "15 Years (Rad-Hardened)" },
          { label: "Orbital Speed", value: "~3.87 km/s (13,940 km/h)" },
        ],
      },
    },
  },

  goes: {
    id: "goes",
    name: "Geostationary Belt (GOES / GEO Ring)",
    subtitle: "35,786 km Equatorial Sidereal Lock · Continuous Hemispheric Watch",
    category: "geo",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "64-bit SGP4 propagation of live Geostationary Equatorial Belt (~35,786 km).",
    has3DModel: true,
    overview: {
      explorer:
        "Hovering motionless like a fixed star 35,786 km above the equator! Because one orbit takes exactly one Earth rotation (23h 56m), satellites like GOES-18 watch entire continents and hurricanes non-stop 24/7.",
      student:
        "At exactly 35,786 km altitude (r = 42,164 km from Earth's center), orbital velocity drops to 3.07 km/s—matching Earth's sidereal spin so ground satellite dishes never need to move!",
      teacher:
        "Toggle the GEO Coverage Cone & Hohmann Transfer layers to show how just 3 GEO satellites see nearly the entire globe, and why reaching GEO requires a two-burn Hohmann transfer (Δv ≈ 3.91 km/s from LEO)!",
      scientist:
        "Clarke Belt (a = 42,164.17 km, i ≈ 0°, T = 86,164.1 s sidereal day). GOES-R carries ABI (16-band imager), GLM (optical lightning mapper), SUVI/EXIS solar EUV/X-ray monitors, and MAG magnetometers.",
    },
    quickFacts: [
      { label: "Clarke Belt Altitude", value: "35,786 km (Equatorial)" },
      { label: "Orbital Period", value: "23h 56m 04s (Sidereal)" },
      { label: "Orbital Speed", value: "3.075 km/s" },
      { label: "Earth Visibility", value: "~42% of Earth per Craft" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Arthur C. Clarke proved in 1945 that just 3 satellites spaced evenly around this 35,786 km ring can link the entire planet!",
          student: "Solving Kepler's 3rd Law T = 2π√(r³/μ) for T = 86,164 s yields r = 42,164 km (altitude 35,786 km). Reaching GEO from 400 km LEO via Hohmann transfer requires Δv₁ = 2.44 km/s + Δv₂ = 1.47 km/s.",
          teacher: "Use the live Hohmann Transfer layer to demonstrate Kepler's 2nd Law (fast perigee pass, slow apogee climb) and orbital energy conservation!",
          scientist: "North-South station-keeping counters lunar/solar third-body inclination drift (~0.85°/yr), while East-West burns counter Earth's triaxial equatorial ellipticity (J₂₂ gravity wells at 75°E & 105°W).",
        },
        equations: [
          { label: "Geostationary Radius", formula: "r = (μ T² / 4π²)^(1/3)", value: "42,164 km (h = 35,786 km)" },
          { label: "Hohmann LEO→GEO Δv", formula: "Δv_tot = Δv₁ + Δv₂", value: "2.44 + 1.47 = 3.91 km/s" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Monitors wildfire smoke, volcanic ash, lightning chemistry, and real-time solar storms slamming into Earth's magnetic field.",
          student: "GOES ABI's 16 infrared and visible channels detect atmospheric water vapor bands (6.2–7.3 μm), ozone, dust, SO₂ volcanic plumes, and cloud-top ice crystal phase.",
          teacher: "Explain why GEO satellites never burn up in Earth's atmosphere—at end-of-life they fire thrusters to climb 300 km higher into the 'Graveyard Orbit'!",
          scientist: "Hydrazine / bi-propellant NTO-MMH or xenon electric propulsion handles 15-year station-keeping; end-of-life disposal mandates ≥235 km super-synchronous graveyard boost + passivation.",
        },
        compounds: [
          { name: "Water Vapor IR", formula: "H₂O (6.2 – 7.3 μm)", role: "Upper/mid-tropospheric jet stream imaging" },
          { name: "Xenon / MMH-NTO", formula: "Xe⁺ / N₂O₄", role: "15-year station-keeping & graveyard boost" },
        ],
      },
      biology: {
        summary: {
          explorer: "Tracks Category 5 hurricanes, tornado supercells, and mega-wildfires every 30 seconds to save millions of lives on the ground!",
          student: "Continuous Geostationary Lightning Mapper (GLM) and rapid-scan severe-storm imaging provide early tornado, flash-flood, and cyclone warnings across entire hemispheres.",
          teacher: "Connect orbital mechanics directly to human safety, climate resilience, and real-time disaster response.",
          scientist: "Sits near the outer edge of the Outer Van Allen Belt / magnetopause boundary; during extreme G4–G5 geomagnetic storms, the dayside magnetopause can compress INSIDE GEO (6.6 R_E), exposing GEO craft directly to solar wind plasma!",
        },
        highlights: [
          "Watches hurricanes, wildfires & lightning continuously every 30–60 seconds",
          "During severe G4–G5 storms, solar wind can compress magnetopause inside GEO!",
          "Retired GEO craft boost +300 km into the permanent Graveyard Orbit",
        ],
      },
      engineering: {
        summary: {
          explorer: "Massive spacecraft with huge golden parabolic dishes and giant solar wings—plus a long solar-sail boom to balance gentle sunlight pressure!",
          student: "Sunlight photons push subtly on giant asymmetric solar arrays; GEO satellites deploy a counter-balancing solar sail trim tab to avoid wasting thruster fuel.",
          teacher: "Look at the twin gold-mesh parabolic dishes and GEO Hemispheric Coverage Cone down to Earth in our 3D view!",
          scientist: "Lockheed Martin A2100 / Eurostar-class platform (~5,192 kg wet mass), ~4 kW solar power, 16-band ABI + GLM + space weather suite, Ka/X/L-band continuous broadcast.",
        },
        specs: [
          { label: "Coverage Footprint", value: "Full Hemisphere (~1/3 Globe)" },
          { label: "Signal Round-Trip", value: "~240 ms (Speed of Light)" },
          { label: "End-of-Life Orbit", value: "+300 km Graveyard Boost" },
          { label: "Solar Pressure Trim", value: "Passive Solar Sail Boom" },
        ],
      },
    },
  },

  "phenom-hohmann-craft": {
    id: "phenom-hohmann-craft",
    name: "Hohmann Transfer Vehicle (GTO)",
    subtitle: "Keplerian LEO (400 km) → GEO (35,786 km) Transfer Craft",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Solved live via Kepler's Equation (M = E − e sin E) and the Vis-Viva energy equation.",
    has3DModel: true,
    overview: {
      explorer:
        "This winged spacecraft is climbing from Low Earth Orbit all the way to Geostationary Orbit using the most fuel-efficient slingshot path in spaceflight! Notice how it whips fast past the sky-blue LEO ball (~10.1 km/s) and slows way down (~1.6 km/s) as it climbs to the orange GEO ball.",
      student:
        "A Hohmann Transfer Orbit is an elliptical bridge (e ≈ 0.72) tangent to two circular orbits. By Kepler's Second Law (conservation of angular momentum, r × v = const), the spacecraft accelerates dramatically at perigee (400 km) and coasts slowly over apogee (35,786 km).",
      teacher:
        "Classic Orbital Mechanics Demo: Point out why the craft doesn't fly straight up from Earth—rockets curve sideways at the sky-blue Perigee node, coast 5.25 hours up the green ellipse, then fire again at the orange Apogee node!",
      scientist:
        "Semi-major axis a = (r₁ + r₂)/2 = 24,464 km, eccentricity e = 0.723, transfer half-period T/2 = π√(a³/μ) = 5.258 hours. Vis-Viva speeds: v_p = 10.14 km/s (Δv₁ = +2.44 km/s), v_a = 1.60 km/s (Δv₂ = +1.47 km/s); total Δv = 3.91 km/s.",
    },
    quickFacts: [
      { label: "Perigee Speed (LEO)", value: "10.14 km/s (Fastest!)" },
      { label: "Apogee Speed (GEO)", value: "1.60 km/s (Slowest!)" },
      { label: "Transfer Climb Time", value: "5h 15m (Half-Orbit)" },
      { label: "Total Δv Needed", value: "3.91 km/s (2 Burns)" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Just like throwing a ball upward—it flies fastest right after leaving your hand (sky-blue ball) and slows to a crawl right at the top of its arc (orange ball)!",
          student: "The Vis-Viva equation v² = μ(2/r − 1/a) proves why orbital velocity drops by more than 6× between perigee (400 km) and apogee (35,786 km).",
          teacher: "Have students watch the thruster plume: it fires emerald at Perigee (Burn 1) and golden-amber at Apogee (Burn 2), while coasting engine-off in between!",
          scientist: "Minimum-energy two-impulse coplanar transfer for r₂/r₁ < 11.94 (here r₂/r₁ = 6.23, well below the bi-elliptic crossover threshold).",
        },
        equations: [
          { label: "Vis-Viva Orbital Speed", formula: "v = √(μ · (2/r − 1/a))", value: "10.14 → 1.60 km/s" },
          { label: "Kepler's Equation", formula: "M = E − e · sin(E)", value: "e = 0.723 (GTO)" },
          { label: "Transfer Time (T/2)", formula: "t = π · √(a³ / μ)", value: "5.26 hours" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Upper-stage rocket engines burn liquid oxygen and kerosene, hydrogen, or methane—or hypergolic propellants that ignite instantly on contact!",
          student: "Perigee injection (Δv₁) typically uses high-thrust LOX/RP-1 or LOX/LH₂ upper stages (Isp ~348–465 s), while apogee circularization (Δv₂) uses storable MMH/N₂O₄ or high-efficiency Xenon electric thrusters.",
          teacher: "Compare chemical bipropellant burns (5.25 hours to GEO) with all-electric Xenon Hall-thruster spirals (4–6 months, using 80% less propellant mass!).",
          scientist: "Hypergolic monomethylhydrazine (CH₆N₂) + dinitrogen tetroxide (N₂O₄) achieves reliable multi-restart vacuum ignition (Isp ~320 s) for apogee kick motors.",
        },
        compounds: [
          { name: "Liquid Hydrogen / LOX", formula: "2H₂ + O₂ → 2H₂O", role: "High-Isp upper-stage Perigee Burn (450+ s)" },
          { name: "Hypergolic Apogee Fuel", formula: "MMH + N₂O₄", role: "Restartable Apogee Kick Motor at 35,786 km" },
        ],
      },
      biology: {
        summary: {
          explorer: "Because a GTO transfer punches straight through BOTH Van Allen radiation donuts, astronauts rarely take slow spiral routes—Apollo zipped through quickly to limit radiation dose.",
          student: "Crossing the inner proton belt (~2,500 km) and outer electron belt (~22,000 km) exposes spacecraft electronics to peak ionizing radiation during every transfer pass.",
          teacher: "Ask students why human-rated missions spend as little time as possible inside the pink and cyan donuts!",
          scientist: "Total ionizing dose (TID) during electric-propulsion GTO raising (120–180 days) can exceed 50–100 krad(Si), demanding rad-hardened avionics and thick coverglass.",
        },
        highlights: [
          "Crosses both the Inner Proton and Outer Electron Van Allen Belts",
          "Fast chemical GTO takes 5.25 hours vs. 4–6 months for electric spirals",
          "Engine fires ONLY at Perigee and Apogee—zero fuel spent while coasting!",
        ],
      },
      engineering: {
        summary: {
          explorer: "Named after German engineer Walter Hohmann who discovered this fuel-saving route in 1925—over 30 years before the first satellite ever launched!",
          student: "Two short prograde burns (Oberth Effect at perigee) minimize propellant mass fraction via the Tsiolkovsky rocket equation.",
          teacher: "Highlight the Oberth Effect: burning fuel while already moving fast at 400 km gives far more orbital energy per kilogram of fuel than burning at high altitude!",
          scientist: "GTO inclination plane-change (e.g. 28.5° from KSC → 0° equatorial GEO) is combined into Δv₂ at apogee where velocity is lowest (1.6 km/s), saving ~1.8 km/s.",
        },
        specs: [
          { label: "Perigee Burn (Δv₁)", value: "+2.44 km/s @ 400 km" },
          { label: "Apogee Burn (Δv₂)", value: "+1.47 km/s @ 35,786 km" },
          { label: "Eccentricity (e)", value: "0.723 (Elongated Oval)" },
          { label: "Discovered By", value: "Walter Hohmann (1925)" },
        ],
      },
    },
  },

  "phenom-perigee-burn": {
    id: "phenom-perigee-burn",
    name: "Perigee Burn 1 Node (Δv₁)",
    subtitle: "Sky-Blue Injection Point · 400 km Low Earth Orbit",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "LEO-to-GTO prograde injection burn exploiting the Oberth Effect at r₁ = 6,771 km.",
    has3DModel: true,
    overview: {
      explorer:
        "This glowing sky-blue ball marks the exact launchpad-in-space where a spacecraft hits the gas! At 400 km above Earth, a rocket upper stage fires its main engine to rocket from 7.67 km/s up to 10.14 km/s—flinging the satellite 35,786 km out into space.",
      student:
        "Perigee is the closest point of an orbit to Earth. Adding Δv₁ = +2.44 km/s strictly forward (prograde) here stretches the opposite side of the orbit all the way up to Geostationary altitude.",
      teacher:
        "Key Concept — The Oberth Effect: Because kinetic energy scales with v², firing an engine while racing fast at low altitude extracts maximum mechanical work from every kilogram of rocket fuel.",
      scientist:
        "Circular LEO parking velocity v_c1 = √(μ/r₁) = 7.669 km/s; GTO perigee velocity v_p = √(μ(2/r₁ − 1/a)) = 10.11 km/s; required prograde impulse Δv₁ = +2.44 km/s.",
    },
    quickFacts: [
      { label: "Altitude", value: "400 km (LEO Ring)" },
      { label: "Speed Boost (Δv₁)", value: "+2.44 km/s Prograde" },
      { label: "Entry → Exit Speed", value: "7.67 → 10.14 km/s" },
      { label: "Key Physics Law", value: "Oberth Effect" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Adding speed on THIS side of Earth pushes the OTHER side of the orbit way out into deep space!",
          student: "Specific orbital energy ε = v²/2 − μ/r jumps instantaneously during the burn, raising the semi-major axis from 6,771 km to 24,464 km.",
          teacher: "Point out how the green transfer ellipse touches the blue LEO ring at this single tangent point.",
          scientist: "ΔE = v · Δv + ½(Δv)² demonstrates why high initial v maximizes specific orbital energy gain per unit Δv.",
        },
        equations: [
          { label: "Perigee Burn Δv₁", formula: "Δv₁ = √(μ/r₁) · (√(2r₂/(r₁+r₂)) − 1)", value: "+2.44 km/s" },
          { label: "Specific Energy Jump", formula: "Δε = −μ/(2a_t) + μ/(2r₁)", value: "+21.3 MJ/kg" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Cryogenic rocket propellants like super-cold Liquid Oxygen and Methane/Hydrogen deliver huge bursts of thrust right at this point.",
          student: "Upper stages like Falcon 9 MVac (LOX/RP-1) or Centaur V (LOX/LH₂) execute a ~60–90 second vacuum burn right over the equator.",
          teacher: "Connect chemical bond energy in rocket fuel directly to orbital kinetic energy.",
          scientist: "Vacuum nozzle expansion ratios (80:1 to 165:1) maximize exhaust velocity v_e = g₀·Isp in near-zero ambient pressure.",
        },
        compounds: [
          { name: "LOX / RP-1 (MVac)", formula: "O₂(l) + C₁₂H₂₆", role: "Falcon 9 second-stage GTO injection" },
          { name: "LOX / LH₂ (Centaur)", formula: "O₂(l) + 2H₂(l)", role: "High-energy hydrolox GTO burn" },
        ],
      },
      biology: {
        summary: {
          explorer: "Right here at 400 km, astronauts are still sheltered inside Earth's protective magnetic bubble—the same altitude where the ISS orbits!",
          student: "Above 400 km, the spacecraft immediately begins ascending into the radiation-intense Inner Van Allen Proton Belt.",
          teacher: "Contrast the safe 400 km LEO parking zone with the high-radiation belts just beyond it.",
          scientist: "Peak burn acceleration (1.5–4.5 g) is well within human tolerance; Apollo Trans-Lunar Injection (TLI) used an analogous perigee burn (+3.15 km/s).",
        },
        highlights: [
          "Same altitude as the International Space Station (~400 km)",
          "Single biggest engine burn of the entire trip to GEO",
          "Uses Earth's gravity well to supercharge fuel efficiency (Oberth Effect)",
        ],
      },
      engineering: {
        summary: {
          explorer: "Rockets time this exact burn down to the millisecond—even a 1% error would send the satellite thousands of kilometers off target!",
          student: "Inertial Measurement Units (IMUs) and star trackers hold attitude within 0.05° during the high-thrust perigee injection burn.",
          teacher: "Explain why rockets launch near the equator (Cape Canaveral, Kourou): it minimizes the extra fuel needed to align with the equatorial GEO belt.",
          scientist: "Finite-burn gravity losses are minimized by centering the burn symmetrically around true anomaly ν = 0°.",
        },
        specs: [
          { label: "Radius (r₁)", value: "6,771 km from Earth center" },
          { label: "Typical Burn Duration", value: "60 – 120 seconds" },
          { label: "Orbital Regime", value: "LEO → GTO Injection" },
          { label: "Visual Marker", value: "Sky-Blue Pulsing Node" },
        ],
      },
    },
  },

  "phenom-apogee-burn": {
    id: "phenom-apogee-burn",
    name: "Apogee Burn 2 Node (Δv₂)",
    subtitle: "Orange/Gold Circularization Point · 35,786 km GEO Belt",
    category: "geo",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "GEO circularization & inclination plane-change burn at apogee r₂ = 42,157 km.",
    has3DModel: true,
    overview: {
      explorer:
        "This glowing orange-gold ball is the finish line at 35,786 km! When the spacecraft reaches the top of its giant climb, it is moving too slowly (1.60 km/s) to stay up there—if it doesn't fire its engine again, it would fall right back down to Earth. Firing Burn 2 locks it permanently into the Geostationary Ring!",
      student:
        "Apogee is the highest, slowest point of the transfer ellipse. Firing Δv₂ = +1.47 km/s raises the opposite side (perigee) from 400 km all the way up to 35,786 km, transforming the oval GTO into a circular 24-hour GEO orbit.",
      teacher:
        "Bonus Orbital Trick: Because the satellite is moving slowest here (1.60 km/s), mission planners ALSO tilt the orbit flat onto Earth's equator during this exact burn—saving massive amounts of fuel!",
      scientist:
        "GTO apogee velocity v_a = 1.60 km/s vs. circular GEO velocity v_c2 = 3.075 km/s → coplanar circularization Δv₂ = +1.47 km/s; combined with 28.5° inclination removal from KSC, Δv₂ rises to ~1.83 km/s.",
    },
    quickFacts: [
      { label: "Altitude", value: "35,786 km (GEO Belt)" },
      { label: "Speed Boost (Δv₂)", value: "+1.47 km/s Circularize" },
      { label: "Entry → Exit Speed", value: "1.60 → 3.075 km/s" },
      { label: "Plane Change Bonus", value: "Cheapest Place to Steer!" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Without this second push at the orange ball, gravity would pull the satellite all the way back down to 400 km five hours later!",
          student: "Matching the circular velocity v = √(μ/r₂) = 3.075 km/s synchronizes the orbital period to exactly 1 sidereal day (23h 56m 4s).",
          teacher: "Show how the green ellipse kisses the golden outer GEO ring right at this orange node.",
          scientist: "Plane-change Δv = 2v sin(Δi/2) is proportional to instantaneous speed v, making apogee (~1.6 km/s) >6× cheaper for inclination correction than perigee (~10.1 km/s).",
        },
        equations: [
          { label: "Apogee Burn Δv₂", formula: "Δv₂ = √(μ/r₂) · (1 − √(2r₁/(r₁+r₂)))", value: "+1.47 km/s" },
          { label: "Final GEO Velocity", formula: "v_GEO = √(μ / 42,157 km)", value: "3.075 km/s" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Unlike the giant launch rocket, this burn is performed by the satellite's OWN built-in Apogee Kick Engine using long-term storable fuel or glowing xenon plasma!",
          student: "Liquid Apogee Engines (LAE) burn storable hydrazine/MMH + N₂O₄ across 3–5 successive apogee passes to gently settle the satellite into its assigned longitude slot.",
          teacher: "Explain why satellites carry over half their launch weight purely as fuel for THIS apogee burn!",
          scientist: "Modern GEO buses (e.g. Boeing 702SP, Airbus Eurostar Neo) replace 2,000 kg of chemical bipropellant with ~300 kg of Xenon Hall-effect propellant (Isp ~1,800–3,000 s).",
        },
        compounds: [
          { name: "Xenon Ion Propellant", formula: "Xe → Xe⁺ + e⁻", role: "Ultra-high-efficiency electric orbit raising" },
          { name: "Storable Bipropellant", formula: "MMH + N₂O₄", role: "Classic Liquid Apogee Engine (400–500 N)" },
        ],
      },
      biology: {
        summary: {
          explorer: "Once locked into the GEO ring here, weather satellites like GOES-18 hover motionless above hurricanes, wildfires, and storms to protect billions of people!",
          student: "At 35,786 km, spacecraft sit near the outer edge of the Outer Van Allen Belt—far outside the breathable atmosphere and near the solar-wind boundary.",
          teacher: "Connect this orange circularization node directly to live GOES-18 weather satellites hovering along the same golden ring!",
          scientist: "Deep dielectric charging from relativistic electrons (>1 MeV) peaks in this region during high-speed solar wind streams.",
        },
        highlights: [
          "Turns a 5-hour oval transfer into a permanent 24-hour hover above Earth",
          "Best location to tilt a satellite's orbit flat onto the equator",
          "Over 500 live weather, TV, and relay satellites share this exact altitude!",
        ],
      },
      engineering: {
        summary: {
          explorer: "Every satellite parked at this altitude is assigned a strict orbital parking slot by the International Telecommunication Union (ITU) so radio beams don't collide!",
          student: "Satellites perform fine north-south and east-west thruster pulses every few weeks to resist lunar/solar gravitational tug and Earth's triaxial bulge.",
          teacher: "Click any nearby pink GEO satellite on the golden ring to inspect live GOES-18 telemetry and its hemispheric RF beam!",
          scientist: "Station-keeping budget at GEO is ~45–55 m/s per year, dominated by luni-solar inclination drift (~0.85°/yr).",
        },
        specs: [
          { label: "Radius (r₂)", value: "42,157 km (6.61 R⊕)" },
          { label: "Target Orbit Period", value: "23h 56m 04s (Sidereal)" },
          { label: "Parking Slot Width", value: "±0.05° (~73 km box)" },
          { label: "Visual Marker", value: "Orange-Gold Pulsing Node" },
        ],
      },
    },
  },

  "phenom-van-allen-inner": {
    id: "phenom-van-allen-inner",
    name: "Inner Van Allen Radiation Belt",
    subtitle: "Magenta Trapped-Proton Donut · 1,500 – 7,500 km Altitude",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Tilted 11° geomagnetic dipole L-shell (L ≈ 1.2–2.2 R⊕) with live NOAA Kp storm reactivity.",
    has3DModel: true,
    overview: {
      explorer:
        "The glowing pink/magenta donut hugging closest to Earth! Earth's magnetic field acts like an invisible cosmic bottle, trapping super-fast protons (10–100+ MeV) that bounce furiously between the North and South poles while drifting westward around the planet.",
      student:
        "Discovered in 1958 by James Van Allen using Explorer 1's Geiger counter, the Inner Belt consists mainly of high-energy trapped protons created by Cosmic Ray Albedo Neutron Decay (CRAND) and intense solar energetic particle events.",
      teacher:
        "Great Classroom Visual: Point out why this pink donut is tilted ~11° compared to Earth's spin axis—Earth's magnetic poles don't line up with its geographic North/South poles! That tilt creates the famous South Atlantic Anomaly (SAA)!",
      scientist:
        "L-shell 1.2–2.4 R⊕. Populated by 10 MeV–1 GeV trapped protons obeying three adiabatic invariants (gyration, magnetic-mirror bounce, and westward curvature-gradient drift). Dips to ~200 km over Brazil (SAA), triggering single-event upsets on LEO craft like Hubble & ISS.",
    },
    quickFacts: [
      { label: "Altitude Range", value: "1,500 – 7,500 km" },
      { label: "Dominant Particles", value: "High-Energy Protons (H⁺)" },
      { label: "Drift Direction", value: "Westward + Pole Bounce" },
      { label: "Radiation Hazard", value: "Up to 10+ mSv/hr Peak!" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Those glowing pink dots bouncing up and down inside the donut are trapped protons spiraling around Earth's magnetic field lines like beads on an invisible wire!",
          student: "Because Earth's magnetic field gets stronger near the poles, approaching protons experience a repulsive Lorentz mirror force that bounces them back toward the opposite hemisphere hundreds of times per minute.",
          teacher: "Compare the pink Inner Proton Donut with the much wider cyan Outer Electron Donut—and note the safe 'Slot Region' gap in between them!",
          scientist: "Magnetic moment μ_m = ½ m v_⊥² / B is conserved; mirror point occurs at B_m = B_eq / sin²(α_eq). Westward gradient-curvature drift velocity scales linearly with particle kinetic energy.",
        },
        equations: [
          { label: "Dipole Field Shell", formula: "r = L · R⊕ · cos²(λ)", value: "L ≈ 1.2 – 2.2 R⊕" },
          { label: "Lorentz Force", formula: "F = q · (v × B)", value: "Helical Trapping" },
          { label: "Proton Energies", formula: "E_p = 10 – 400 MeV", value: "Relativistic H⁺" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Fast trapped protons are bare hydrogen nuclei—when they smash into silicon computer chips or solar panels, they knock atoms right out of place!",
          student: "Energetic protons cause both Total Ionizing Dose (trapped oxide charge in MOSFETs) and Displacement Damage (knocking Si/GaAs lattice atoms out of solar cells).",
          teacher: "Explain why satellites passing through the South Atlantic Anomaly (where this pink donut dips closest to Earth) turn off sensitive cameras like Hubble!",
          scientist: "Cosmic Ray Albedo Neutron Decay (CRAND): galactic cosmic rays spallate atmospheric N/O nuclei → upward neutrons decay (n → p⁺ + e⁻ + ν̄_e, τ ≈ 880 s) directly into trapped inner-belt protons.",
        },
        compounds: [
          { name: "Trapped Protons", formula: "H⁺ (10–400 MeV)", role: "Primary inner-belt ionizing radiation flux" },
          { name: "CRAND Neutron Decay", formula: "n → p⁺ + e⁻ + ν̄", role: "Primary natural source of inner belt protons" },
        ],
      },
      biology: {
        summary: {
          explorer: "Too radioactive for long-term human living! That's why the ISS stays safely BELOW this pink donut at 420 km—and Apollo astronauts zipped straight through it in under an hour.",
          student: "Unshielded exposure inside the core of the inner proton belt could deliver a dangerous radiation dose in days; aluminum spacecraft hulls and rapid transit protect crews.",
          teacher: "Debunk the Apollo moon-landing myth with real math: Apollo's fast trajectory crossed the thinner edges of the belts in ~1 hour, keeping total crew dose below ~11 mSv (about one CT scan).",
          scientist: "High-LET proton interactions produce secondary neutrons inside spacecraft shielding; polyethylene (high hydrogen density) outperforms heavy metals per unit mass for crew shielding.",
        },
        highlights: [
          "Discovered in 1958 by Explorer 1—America's very first satellite!",
          "Dips lowest over South America, creating the South Atlantic Anomaly (SAA)",
          "ISS orbits safely below it (420 km); GPS orbits safely above it (20,200 km)",
        ],
      },
      engineering: {
        summary: {
          explorer: "Engineers almost never park satellites inside this pink donut—instead they stay underneath in LEO (Starlink/ISS) or climb above it into MEO/GEO!",
          student: "Spacecraft forced to cross the inner belt use triple-redundant radiation-hardened CPUs, error-correcting memory (ECC), and thick fused-silica solar cell coverglass.",
          teacher: "Look at our live satellite swarm: you can literally see the empty radiation gap between LEO satellites hugging Earth and MEO GPS satellites outside!",
          scientist: "NASA's twin Van Allen Probes (RBSP, 2012–2019) mapped inner-belt stability and discovered an impenetrable ultra-relativistic electron barrier near L ≈ 2.8.",
        },
        specs: [
          { label: "Geomagnetic Tilt", value: "~11° off Earth Spin Axis" },
          { label: "Peak Flux Core", value: "~3,000 – 4,500 km alt" },
          { label: "Stability", value: "Very Stable (Years)" },
          { label: "Visual Marker", value: "Inner Magenta/Pink Donut" },
        ],
      },
    },
  },

  "phenom-van-allen-outer": {
    id: "phenom-van-allen-outer",
    name: "Outer Van Allen Radiation Belt",
    subtitle: "Electric-Cyan Relativistic Electron Donut · 14,000 – 34,000 km",
    category: "science",
    provenance: "LIVE_TELEMETRY",
    provenanceDetail: "Driven live by NOAA SWPC Planetary Kp index — brightens & shifts golden-amber during geomagnetic storms!",
    has3DModel: true,
    overview: {
      explorer:
        "The giant glowing cyan-blue donut wrapping far around Earth! Packed with 'killer electrons' zipping at nearly the speed of light, this huge radiation ring breathes in and out dynamically whenever solar storms hit Earth—and GPS satellites orbit right through its heart!",
      student:
        "Spanning roughly 14,000 to 34,000 km altitude (L ≈ 3–7 R⊕), the Outer Belt consists primarily of relativistic electrons (0.1–10 MeV) accelerated by electromagnetic chorus waves during geomagnetic storms.",
      teacher:
        "Live Space Weather Tie-In: Watch this cyan donut react to our real-time NOAA Kp badge at the top! During quiet weather (Kp 1–3) it glows electric cyan; during a severe solar storm (Kp 6–9) it surges with storm amber-gold energy!",
      scientist:
        "L-shell 3.2–6.8 R⊕. Relativistic electron flux varies by 3–5 orders of magnitude on timescales of hours via whistler-mode chorus gyro-resonant acceleration, radial diffusion (ULF waves), and magnetopause shadowing loss.",
    },
    quickFacts: [
      { label: "Altitude Range", value: "14,000 – 34,000 km" },
      { label: "Dominant Particles", value: "Relativistic Electrons (e⁻)" },
      { label: "Drift Direction", value: "Eastward (Near Light Speed)" },
      { label: "Resident Satellites", value: "GPS, Galileo, GLONASS" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Those glowing cyan particles circling eastward inside the big outer donut are electrons accelerated up to 99% the speed of light by Earth's own magnetic waves!",
          student: "Unlike positively charged inner-belt protons that drift westward, negatively charged outer-belt electrons drift eastward around Earth, creating a vast electric Ring Current.",
          teacher: "Point out the yellow-green MEO GPS satellites orbiting right inside this outer cyan donut—that's why GPS satellites are built like armored tanks!",
          scientist: "Whistler-mode chorus waves ('Earth's dawn chorus' radio emissions) accelerate seed 10–100 keV electrons to multi-MeV energies right inside the outer belt.",
        },
        equations: [
          { label: "Dipole L-Shell", formula: "r = L · R⊕ · cos²(λ)", value: "L ≈ 3.2 – 6.8 R⊕" },
          { label: "Relativistic Lorentz γ", formula: "γ = 1 / √(1 − v²/c²)", value: "γ ≈ 3 – 20 (1–10 MeV)" },
          { label: "Electron Speed", formula: "v_e ≈ 0.94c – 0.998c", value: "Near Speed of Light" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Super-fast 'killer electrons' bury themselves deep inside satellite circuit boards and insulation, building up static electricity until a tiny lightning bolt zaps the spacecraft!",
          student: "Deep Dielectric Charging (internal electrostatic discharge / ESD) occurs when MeV electrons penetrate aluminum walls and accumulate inside polymer cables and PCB substrates.",
          teacher: "Compare static shock on a carpet to an orbital mega-volt electron discharge inside a $500M navigation satellite!",
          scientist: "Spacecraft surface charging (keV plasma sheet) + internal charging (MeV electrons) require conductive indium-tin-oxide (ITO) coatings, grounded Kapton MLI, and Faraday shielding.",
        },
        compounds: [
          { name: "Relativistic Electrons", formula: "e⁻ (0.5 – 10 MeV)", role: "Deep dielectric spacecraft charging hazard" },
          { name: "Conductive ITO Coating", formula: "In₂O₃ · SnO₂", role: "Bleeds off static charge on solar coverglass" },
        ],
      },
      biology: {
        summary: {
          explorer: "When geomagnetic storms shake this outer donut, trapped electrons spill down into Earth's upper atmosphere at the poles—lighting up dazzling green and purple Northern & Southern Lights!",
          student: "Wave-particle scattering pushes outer-belt electrons into the atmospheric 'loss cone', where they collide with upper-atmosphere oxygen and nitrogen to create auroras.",
          teacher: "Connect the cyan Outer Donut directly to Earth's glowing polar auroral ovals right at the North and South poles!",
          scientist: "Bremsstrahlung X-rays generated when relativistic electrons impact high-Z shielding pose a significant secondary biological hazard for future deep-space crewed transits.",
        },
        highlights: [
          "Electrons inside zip at up to 99.8% of the speed of light!",
          "Can briefly split into a THIRD temporary radiation belt during giant solar storms",
          "Spilling electrons feed Earth's shimmering polar auroras!",
        ],
      },
      engineering: {
        summary: {
          explorer: "GPS III, Galileo, and weather satellites must survive 15 years inside this hostile electron storm using gold Kapton grounding blankets and radiation-hardened computers!",
          student: "NOAA SWPC monitors outer-belt electron flux >2 MeV continuously via GOES-18 to alert satellite operators before electrostatic discharges occur.",
          teacher: "Click any GPS III satellite inside this donut to read its real-time estimated radiation dose rate in mSv/hr!",
          scientist: "NASA's Van Allen Probes discovered a transient 3rd storage ring in Sept 2012 lasting 4 weeks before an interplanetary shock wiped it out.",
        },
        specs: [
          { label: "Electron Energy", value: "0.1 – 10 MeV ('Killer e⁻')" },
          { label: "Dynamic Variability", value: "10,000× Swing in Storms!" },
          { label: "NOAA Live Driver", value: "Planetary Kp & Solar Wind" },
          { label: "Visual Marker", value: "Outer Electric-Cyan Donut" },
        ],
      },
    },
  },

  "phenom-magnetosphere": {
    id: "phenom-magnetosphere",
    name: "Earth Magnetosphere & Solar Wind Shield",
    subtitle: "Dynamic Magnetic Shield, Bow Shock & 400+ km/s Solar Wind",
    category: "science",
    provenance: "LIVE_TELEMETRY",
    provenanceDetail: "Oriented live toward real-time UTC Sun direction & scaled by live NOAA DSCOVR solar wind + Kp index.",
    has3DModel: true,
    overview: {
      explorer:
        "Earth's invisible superhero force field! Those fast golden particles flying from the Sun are the supersonic Solar Wind (~400–800 km/s). When they slam into the glowing curved Bow Shock shield and arching blue field lines, Earth's magnetic field deflects the deadly solar plasma safely around our planet!",
      student:
        "Generated by swirling liquid iron in Earth's outer core (geodynamo), the magnetosphere extends ~65,000 km toward the Sun (compressed by solar wind ram pressure) and stretches millions of kilometers backward into a comet-like Magnetotail.",
      teacher:
        "Compare Earth to Mars! Mars lost its global magnetic field ~4 billion years ago, allowing this exact same Solar Wind to strip away its thick atmosphere and turn it into a frozen desert.",
      scientist:
        "Subsolar magnetopause standoff distance R_mp ≈ (B₀² / (2 μ₀ ρ_sw v_sw²))^(1/6) · R⊕ ≈ 10 R⊕ (~64,000 km) under nominal 400 km/s, 5 p/cm³ solar wind. Southward IMF B_z < 0 triggers Dungey-cycle dayside magnetic reconnection, driving geomagnetic storms & substorms.",
    },
    quickFacts: [
      { label: "Solar Wind Speed", value: "~350 – 800 km/s (Live NOAA)" },
      { label: "Sunward Bow Shock", value: "~65,000 – 90,000 km" },
      { label: "Nightside Tail Length", value: "> 6,000,000 km (Past Moon!)" },
      { label: "Field Source", value: "Liquid Iron Core Geodynamo" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Notice how the magnetic field arches are squished flat on the sunny side facing the Sun and stretched way out like a windsock on the dark night side!",
          student: "Supersonic solar wind plasma hits Earth's magnetic obstacle faster than the magnetosonic wave speed, forming a standing collisionless Bow Shock just like a sonic boom ahead of a supersonic jet.",
          teacher: "Rotate around Earth to show students the live Sun direction—our 3D Magnetosphere and Bow Shock automatically rotate every frame to face the real-time Sun!",
          scientist: "Pressure balance P_ram = n m_p v_sw² = B_mp² / (2 μ₀) sets the magnetopause boundary; during extreme Coronal Mass Ejections (CMEs), R_mp can compress inside GEO (6.6 R⊕)!",
        },
        equations: [
          { label: "Solar Wind Ram Pressure", formula: "P_sw = ρ_sw · v_sw²", value: "~1.5 – 20 nPa" },
          { label: "Magnetic Pressure", formula: "P_B = B² / (2 μ₀)", value: "Balances Solar Wind" },
          { label: "Magnetopause Standoff", formula: "R_mp ∝ (ρ v²)^(-1/6)", value: "~10 R⊕ (~64,000 km)" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "The fast golden particles streaming from the Sun are pure ionized hydrogen and helium plasma ripped straight off the Sun's million-degree corona!",
          student: "Solar wind plasma is ~95% protons (H⁺), ~4% alpha particles (He²⁺), ~1% heavy ions (O⁶⁺, Fe¹⁰⁺), and equal electrons carrying the Interplanetary Magnetic Field (IMF).",
          teacher: "Highlight how magnetic reconnection lets a tiny fraction of this solar plasma funnel down the polar cusps to excite atmospheric oxygen (green) and nitrogen (purple)!",
          scientist: "Southward IMF B_z anti-parallel to Earth's northward dayside dipole enables Sweet-Parker/Petschek magnetic reconnection, transferring ~10¹¹–10¹² W of electromagnetic power into the magnetosphere-ionosphere system.",
        },
        compounds: [
          { name: "Solar Wind Plasma", formula: "95% H⁺ · 4% He²⁺ · e⁻", role: "Supersonic coronal outflow (400–800 km/s)" },
          { name: "Geodynamo Core", formula: "Liquid Fe – Ni Alloy", role: "Convecting conductor generating Earth's dipole" },
        ],
      },
      biology: {
        summary: {
          explorer: "Without this magnetic shield deflecting the solar wind, our oceans and breathable air would have slowly eroded into space—and birds, sea turtles, and whales even use Earth's magnetic lines to navigate!",
          student: "Magnetoreception (cryptochrome proteins & magnetite crystals) enables migratory birds, sea turtles, and salmon to sense magnetic inclination along these dipole field lines.",
          teacher: "Bridge geophysics and biology: the very same magnetic lines protecting our atmosphere also serve as a built-in GPS for migrating wildlife!",
          scientist: "Shields Earth's biosphere from both low-energy solar wind sputtering and multi-GeV solar energetic particles (SEPs), preserving atmospheric O₂/H₂O over gigayear timescales.",
        },
        highlights: [
          "Deflects ~1 million tons of solar plasma rushing past Earth every second!",
          "Stretches past the Moon's orbit on the nightside (Magnetotail)",
          "Protects Earth's atmosphere from suffering Mars's fate",
        ],
      },
      engineering: {
        summary: {
          explorer: "When a giant solar flare rattles Earth's magnetosphere, it can disrupt GPS signals, blackout polar radio flights, increase drag on Starlink satellites, and even trip power grids!",
          student: "NOAA's DSCOVR spacecraft sits 1.5 million km sunward (at L1) to taste the incoming Solar Wind ~30–60 minutes before it slams into our Bow Shock!",
          teacher: "Check the live NOAA Space Weather box in the Left Navigator to read today's real solar wind speed, proton density, and IMF Bz!",
          scientist: "Geomagnetically Induced Currents (GICs) from rapid dB/dt electrojet surges threaten high-voltage transformers; live Kp/Bz forecasting mitigates both grid and spacecraft anomalies.",
        },
        specs: [
          { label: "Sunward Standoff", value: "~10 R⊕ (~64,000 km)" },
          { label: "Early Warning Buoy", value: "NOAA DSCOVR @ Sun-Earth L1" },
          { label: "Storm Index", value: "Live NOAA Planetary Kp (0–9)" },
          { label: "Visual Marker", value: "Bow Shock + Dipole Field + Gold Wind" },
        ],
      },
    },
  },

  moon: {
    id: "moon",
    name: "The Moon (Luna)",
    subtitle: "Earth's Natural Satellite · Shell 2 Cislunar Anchor (384,400 km)",
    category: "planet",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Real-time Meeus lunar ephemeris (true 1:1 distance & phase), NASA LRO albedo/relief & interactive GRAIL core cutaway.",
    has3DModel: true,
    overview: {
      explorer:
        "Our nearest cosmic neighbor and the only other world humans have ever walked on! Because the Moon is tidally locked, it always shows the same cratered face to Earth—and right now you can slice open its crust to see its glowing iron core or click Apollo 11 & Artemis South Pole!",
      student:
        "Orbiting Earth at a mean distance of 384,400 km (1.28 light-seconds) at ~1.02 km/s, the Moon stabilizes Earth's 23.4° axial tilt, drives ocean tides, and preserves a 4.5-billion-year impact record with zero atmosphere or rain erosion.",
      teacher:
        "Classroom Highlight: Slide the 'Moon Core Cutaway' control to reveal the anorthositic crust, olivine mantle, molten boundary, and solid iron core—then switch Spectral Mode to Thermal IR to contrast +120°C sunlit noon with −130°C lunar night!",
      scientist:
        "R = 1,737.4 km, μ = 4,902.8 km³/s², surface g = 1.622 m/s² (0.165 g), orbital eccentricity e = 0.0549, inclination 5.145° to ecliptic. Secular tidal acceleration recedes the lunar semi-major axis by +3.82 cm/yr (verified by Apollo LLR).",
    },
    quickFacts: [
      { label: "Mean Distance", value: "384,400 km (1.28 lt-sec)" },
      { label: "Surface Gravity", value: "1.622 m/s² (16.5% Earth)" },
      { label: "Temp Swing", value: "−173°C to +127°C" },
      { label: "Tidal Drift", value: "+3.82 cm / year away" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Earth's gravity tugs so hard on the Moon that it slowed the Moon's spin until one rotation equals one orbit—that's why we always see the same side!",
          student: "Gravitational tidal bulges on Earth lead the Moon slightly due to Earth's faster 24-hour spin, transferring angular momentum that slows Earth's day by ~1.7 ms/century while pushing the Moon outward +3.8 cm/yr.",
          teacher: "Compare the Moon's low escape velocity (2.38 km/s) to Earth's (11.19 km/s): launching from the Moon takes ~22× less energy!",
          scientist: "Giant-Impact Hypothesis (Theia, ~4.51 Ga) explains the Earth–Moon system's high angular momentum, identical oxygen isotope ratios (Δ¹⁷O), and small lunar iron core (~20% radius vs. Earth's ~55%).",
        },
        equations: [
          { label: "Lunar Surface Gravity", formula: "g = G·M_☽ / R_☽²", value: "1.622 m/s² (1/6 g)" },
          { label: "Lunar Escape Velocity", formula: "v_e = √(2μ_☽ / R_☽)", value: "2.38 km/s" },
          { label: "Synodic Phase Cycle", formula: "T_syn = 29.53 days", value: "New → Full → New" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Bright lunar highlands are made of pale white anorthosite rock, while the dark 'seas' (maria) are frozen oceans of iron-rich volcanic basalt lava—and deep South Pole craters hide ancient water ice!",
          student: "Lunar regolith is ~43% oxygen chemically bound inside silicate/oxide minerals (SiO₂, Al₂O₃, FeO, TiO₂). Molten regolith electrolysis can extract breathable O₂ and rocket oxidizer directly from Moon dust!",
          teacher: "Connect Artemis III's South Pole target (Shackleton Crater) to ISRU chemistry: cracking frozen H₂O ice into H₂ + O₂ rocket propellant!",
          scientist: "Highlands: ferroan anorthosite (CaAl₂Si₂O₈); Maria: high-Ti/low-Ti flood basalts with ilmenite (FeTiO₃). Solar-wind implanted Helium-3 (³He) and cold-trapped polar volatiles (H₂O, CO, NH₃) verified by LCROSS/LRO.",
        },
        compounds: [
          { name: "Anorthosite Highlands", formula: "CaAl₂Si₂O₈", role: "Ancient primordial magma-ocean crust" },
          { name: "Mare Basalt / Ilmenite", formula: "FeTiO₃ + Silicates", role: "Dark volcanic plains & O₂ extraction feedstock" },
          { name: "Polar Cold-Trap Ice", formula: "H₂O(s) @ −230°C", role: "Artemis life support & LH₂/LOX rocket fuel" },
        ],
      },
      biology: {
        summary: {
          explorer: "With zero air, liquid water, or global magnetic field, astronauts need pressurized habitats—and sharp glass-like Moon dust clings electrostatically to spacesuits!",
          student: "Living at 1/6th Earth gravity (0.165 g) for months presents unknown long-term physiological effects between microgravity (ISS) and full 1g Earth.",
          teacher: "Discuss why Artemis bases plan to use 3D-printed lunar regolith bricks or underground lava tubes to shield astronauts from galactic cosmic rays and solar flares!",
          scientist: "Unshielded lunar surface radiation averages ~1.36 mSv/day (~2.6× ISS dose, measured by Chang'e-4 LND); electrostatic angular agglutinate dust (<20 μm) poses severe pulmonary/seal hazards.",
        },
        highlights: [
          "Only extraterrestrial body ever visited by human beings (12 Apollo astronauts)",
          "South Pole permanently shadowed craters trap billions of tons of H₂O ice",
          "Sharp microscopic regolith dust requires electrostatic dust-mitigation suits",
        ],
      },
      engineering: {
        summary: {
          explorer: "NASA's Artemis program and international partners are returning humans to the lunar South Pole to build a sustainable Moon base and test technology for Mars!",
          student: "Surviving the 14-Earth-day lunar night (−173°C) is one of space engineering's toughest challenges, solved via South Pole 'Peaks of Eternal Light' solar towers or compact fission reactors.",
          teacher: "Click the Apollo 11 pin on the Moon to see our 3D NASA Apollo Lunar Module Eagle sitting right at Tranquility Base!",
          scientist: "Lunar Gateway will occupy a Near-Rectilinear Halo Orbit (NRHO, 6.5-day period) around Earth–Moon L2, enabling continuous Earth communication and low-Δv South Pole descent access.",
        },
        specs: [
          { label: "Mean Radius", value: "1,737.4 km (27% Earth)" },
          { label: "Inner Solid Core", value: "~240 km Iron Radius" },
          { label: "Sidereal Orbit", value: "27.32 Earth Days" },
          { label: "Active Orbiter", value: "NASA LRO (50 km Polar)" },
        ],
      },
    },
  },

  lro: {
    id: "lro",
    name: "Lunar Reconnaissance Orbiter (LRO)",
    subtitle: "Official NASA 3D CAD · 50 km Polar Lunar Mapping Orbiter",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Official NASA LRO 3D CAD (lro.glb) orbiting our 3D Moon in a 113-minute polar reconnaissance orbit.",
    has3DModel: true,
    overview: {
      explorer:
        "NASA's ultra-sharp spy camera circling the Moon since 2009! Flying just 50 km above lunar mountains, LRO has photographed the actual Apollo footprints, lunar rovers, and mapped every single crater in 3D with its green laser beams!",
      student:
        "LRO's Lunar Orbiter Laser Altimeter (LOLA) fires 28 laser pulses per second to measure lunar elevation to 10 cm accuracy, while LROC captures 0.5-meter/pixel images used to pick safe Artemis III landing zones.",
      teacher:
        "Watch LRO's green LOLA laser beam sweeping across our 3D Moon's surface—that's how scientists built the high-resolution topographic maps used in this very simulator!",
      scientist:
        "Launched June 18, 2009; 1,916 kg launch mass; polar elliptical/frozen orbit (~30–160 km). Payload: LROC (NAC/WAC), LOLA, Diviner Lunar Radiometer (measured 26 K in Hermite Crater!), LAMP UV, LEND neutron spectrometer, CRaTER dosimeter.",
    },
    quickFacts: [
      { label: "Orbit Altitude", value: "~50 km Polar Lunar Orbit" },
      { label: "Camera Resolution", value: "0.5 m / pixel (Sees Apollo!)" },
      { label: "Coldest Temp Found", value: "26 K (−247°C!) by Diviner" },
      { label: "Active Since", value: "June 2009 (15+ Years!)" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Lumpy heavy pockets buried beneath lunar basins ('mascons') tug on LRO every orbit, pulling its path slightly off-course unless controllers adjust it!",
          student: "Moon's uneven mass concentrations (mascons beneath Mare Imbrium, Serenitatis, Crisium) destabilize most low lunar orbits within months—requiring carefully chosen 'frozen' polar orbits.",
          teacher: "Contrast Earth's smooth gravity with the Moon's lumpy 'mascon' gravity field.",
          scientist: "Orbital period ~113 min at ~1.65 km/s; Diviner thermal radiometry proved polar permanently shadowed regions are colder than Pluto's surface (<30 K).",
        },
        equations: [
          { label: "Lunar Circular Speed", formula: "v = √(μ_☽ / (R_☽ + 50 km))", value: "1.65 km/s" },
          { label: "LOLA Laser Ranging", formula: "d = c · Δt / 2", value: "±10 cm Vertical Precision" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "LRO's neutron detector sniffs hydrogen locked inside dark South Pole craters—confirming frozen water ice waiting for future astronauts!",
          student: "LEND measures epithermal neutron suppression caused by hydrogen nuclei moderating cosmic-ray-induced lunar neutrons, pinpointing subsurface H₂O ice deposits.",
          teacher: "Explain how remote neutron spectroscopy discovers hidden underground ice without ever digging a shovel!",
          scientist: "LAMP Lyman-alpha UV reflectance + LEND collimated neutron flux detect 1–2 wt% surface water frost in Shackleton, Shoemaker, and Faustini permanently shadowed regions.",
        },
        compounds: [
          { name: "Polar Water Frost", formula: "H₂O(s) (1–2 wt%)", role: "Detected via LAMP UV & LEND neutron flux" },
          { name: "Hydrazine Thrusters", formula: "N₂H₄", role: "15+ years of lunar orbit maintenance" },
        ],
      },
      biology: {
        summary: {
          explorer: "LRO carries a special tissue-equivalent plastic detector (CRaTER) that mimics human flesh to measure how much deep-space radiation future Moon explorers will face!",
          student: "CRaTER measures Linear Energy Transfer (LET) of galactic cosmic rays and solar proton storms through tissue-equivalent plastic (TEP) to validate Artemis crew shielding.",
          teacher: "Show how robotic precursors like LRO protect human astronauts years before launch.",
          scientist: "CRaTER confirmed that lunar albedo protons bouncing back up from the soil add ~10% extra biological radiation dose on the Moon's surface.",
        },
        highlights: [
          "Photographed Apollo 11, 12, 14, 15, 16 & 17 descent stages and astronaut tracks",
          "CRaTER tissue-equivalent plastic sensor measures astronaut radiation risk",
          "Mapped >98% of the entire lunar surface in ultra-high-resolution 3D",
        ],
      },
      engineering: {
        summary: {
          explorer: "Designed for a 1-year mission, LRO's rock-solid NASA Goddard engineering has kept it thriving for over 15 years in harsh lunar thermal extremes!",
          student: "A single 2-axis gimbaled solar array tracks the Sun while a high-gain Ka-band dish beams up to 100 Mbps of raw lunar imagery back to Earth.",
          teacher: "Notice LRO's compact gold-foil bus and high-gain dish in our official NASA 3D model.",
          scientist: "Built at NASA GSFC; >1.4 petabytes of lunar science data returned—more than all prior planetary missions combined.",
        },
        specs: [
          { label: "Data Returned", value: "> 1.4 Petabytes" },
          { label: "Laser Rate", value: "28 Hz (5-Beam LOLA)" },
          { label: "Orbital Period", value: "113 Minutes" },
          { label: "3D Asset", value: "Official NASA LRO CAD" },
        ],
      },
    },
  },

  jwst: {
    id: "jwst",
    name: "James Webb Space Telescope (JWST)",
    subtitle: "Sun–Earth L2 Halo Orbit · 1,500,000 km · Cryogenic Infrared Observatory",
    category: "science",
    provenance: "PHYSICS_PROPAGATED",
    provenanceDetail: "Official NASA JWST 3D CAD (jwst.glb) in Sun–Earth L2 Halo Orbit (1.5M km anti-sunward) with thermal gradient physics.",
    has3DModel: true,
    overview: {
      explorer:
        "Humanity's most powerful time machine! Parked 1.5 million km behind Earth at Sun–Earth L2, Webb unfolds 18 gold-plated hexagonal mirrors behind a tennis-court-sized 5-layer sunshield—staying freezing cold (−233°C!) so it can photograph the very first galaxies born after the Big Bang!",
      student:
        "Because cosmic expansion stretches ultraviolet/visible starlight from the early universe into infrared wavelengths (cosmological redshift z > 10), JWST must stay below 40 K (−233°C) so its own heat doesn't blind its infrared cameras.",
      teacher:
        "Engineering Marvel: Point out the extreme thermal gradient across Webb's 5-layer Kapton sunshield: +85°C (hot enough to boil water!) on the Sun-facing bottom layer vs. −233°C (cold enough to freeze nitrogen solid!) on the golden mirror side just meters away!",
      scientist:
        "6.5 m gold-coated beryllium segmented primary mirror (25.4 m² collecting area), operating 0.6–28.5 μm (NIRCam, NIRSpec, NIRISS, MIRI actively cryocooled to 6.7 K). Quasi-periodic L2 Halo orbit (~250,000–832,000 km amplitude, ~6-month period) keeps Earth, Sun, and Moon perpetually behind the sunshield.",
    },
    quickFacts: [
      { label: "Location", value: "Sun–Earth L2 (1.5M km)" },
      { label: "Mirror Diameter", value: "6.5 m (18 Gold Hexagons)" },
      { label: "Hot vs Cold Side", value: "+85°C Sun / −233°C Mirror" },
      { label: "Deepest Lookback", value: "> 13.5 Billion Years Ago!" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "At Lagrange Point L2, Earth and the Sun pull together so JWST orbits the Sun in exact lockstep with Earth—never drifting away and always keeping the Sun, Earth, and Moon safely behind its giant umbrella!",
          student: "At L2 (~1.5M km anti-sunward), Earth's extra inward gravity compensates for the larger orbital radius so JWST's orbital period around the Sun equals exactly 1.00 Earth year.",
          teacher: "Use Stefan–Boltzmann radiation (P = εσAT⁴) to explain how 5 vacuum-separated Kapton layers cut ~300,000 W of incoming solar heat down to less than 1 Watt!",
          scientist: "Restricted 3-body collinear equilibrium L2 is saddle-unstable (e-folding time ~23 days), requiring tiny ~2 m/s/yr hydrazine station-keeping burns every ~21 days; Ariane 5's pinpoint injection doubled mission fuel life to >20 years!",
        },
        equations: [
          { label: "Cosmological Redshift", formula: "λ_obs = λ_emit · (1 + z)", value: "z > 14 (First Galaxies)" },
          { label: "Wien Peak Cooling", formula: "λ_max = 2898 / T (μm)", value: "MIRI @ 6.7 K → 28 μm" },
          { label: "L2 Distance (Hill)", formula: "r_L2 ≈ R · (M⊕ / 3M☉)^(1/3)", value: "~1,500,000 km" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Webb doesn't just take pretty pictures—it splits starlight filtering through distant exoplanet skies to sniff out water vapor, carbon dioxide, methane, and potential signs of alien life!",
          student: "18 lightweight beryllium (Be) mirror segments stay rigid at 40 K without warping, coated with a microscopically thin 100-nanometer layer of pure gold (Au)—only ~48 grams total—for 98% infrared reflectivity!",
          teacher: "Ask students why JWST's mirrors are GOLD instead of silver/aluminum like Hubble: gold reflects infrared light far better than aluminum!",
          scientist: "Transmission & emission spectroscopy (NIRSpec/MIRI) resolves ro-vibrational absorption bands of H₂O, CO₂ (4.3 μm), CH₄, SO₂ (photochemistry on WASP-39b), and PAHs in protoplanetary disks.",
        },
        compounds: [
          { name: "Gold-Coated Beryllium", formula: "Be + 100 nm Au", role: "Cryogenically rigid 98% IR-reflective mirrors" },
          { name: "Silicon-Doped Kapton", formula: "Al / Si-Kapton (5 Layers)", role: "Passive 300,000× solar heat attenuation" },
          { name: "Exoplanet Biosignatures", formula: "H₂O · CO₂ · CH₄ · DMS", role: "Mid/Near-IR atmospheric transmission spectra" },
        ],
      },
      biology: {
        summary: {
          explorer: "JWST is actively scanning rocky Earth-sized exoplanets like the TRAPPIST-1 system to discover whether habitable atmospheres and life-supporting water oceans exist beyond our Solar System!",
          student: "By measuring chemical disequilibrium (such as simultaneous methane + carbon dioxide) in temperate exoplanet atmospheres, JWST pioneers real-world astrobiology across light-years.",
          teacher: "Connect Webb's infrared chemistry directly to the search for life in Shell 4 (Exoplanets)!",
          scientist: "Also studies prebiotic ice chemistry (H₂O, CO, CO₂, CH₃OH, NH₃) inside cold molecular clouds where new solar systems and organic building blocks form.",
        },
        highlights: [
          "All 18 giant mirrors use only ~48 grams of pure gold (about one golf ball!)",
          "Discovered galaxies shining less than 300 million years after the Big Bang",
          "Detects CO₂, water vapor & methane in exoplanet atmospheres light-years away",
        ],
      },
      engineering: {
        summary: {
          explorer: "Too huge for any rocket fairing, Webb folded up like $10 billion space origami and executed 344 single-point-of-failure deployments flawlessly a million miles from any astronaut!",
          student: "132 nanometer-precision cryogenic actuators behind the 18 mirror hexagons align all segments to within 1/10,000th the thickness of a human hair!",
          teacher: "Notice how JWST's sunshield always faces Earth and the Sun while its telescope gazes effortlessly into deep space.",
          scientist: "Joint NASA / ESA / CSA mission launched Dec 25, 2021 on Ariane 5 VA256; closed-cycle pulse-tube helium cryocooler chills MIRI Si:As detectors to 6.7 K.",
        },
        specs: [
          { label: "Mirror Alignment", value: "~10 nm Precision (132 Motors)" },
          { label: "Sunshield Size", value: "21.2 m × 14.2 m (5 Layers)" },
          { label: "Active Cryocooler", value: "6.7 K (−266.5°C) MIRI" },
          { label: "3D Asset", value: "Official NASA JWST CAD" },
        ],
      },
    },
  },

  dscovr: {
    id: "dscovr",
    name: "DSCOVR & SOHO (Sun–Earth L1)",
    subtitle: "Sun–Earth L1 Halo Orbit · +1,500,000 km Sunward · Space Weather Buoy",
    category: "weather",
    provenance: "LIVE_TELEMETRY",
    provenanceDetail: "Official NASA DSCOVR 3D CAD (dscovr.glb) + live NOAA DSCOVR solar wind & NASA EPIC full-disc Earth feed.",
    has3DModel: true,
    overview: {
      explorer:
        "Earth's solar storm early-warning lighthouse! Floating 1.5 million km straight toward the Sun at Lagrange Point L1, DSCOVR tastes incoming solar storms 30 to 60 minutes before they slam into Earth—while its EPIC camera snaps gorgeous full-circle photos of sunlit Earth every single day!",
      student:
        "Parked at the Sun–Earth L1 gravitational balance point, DSCOVR continuously sees the ENTIRE sunlit face of Earth (never a crescent!) while measuring solar wind speed, proton density, and magnetic polarity (IMF Bz) in real time.",
      teacher:
        "Live Data Connection: Every single solar wind number you see in Project Cosmos's live NOAA Space Weather HUD (`415 km/s`, `IMF Bz`) is actually measured RIGHT HERE at L1 by DSCOVR!",
      scientist:
        "NOAA/NASA Deep Space Climate Observatory (launched Feb 2015, Lissajous orbit around L1 ~1.5M km sunward). Instruments: PlasMag (Faraday cup + fluxgate magnetometer feeding live SWPC alerts), EPIC 10-channel UV-NIR Earth imager, NISTAR radiometer. Shared neighborhood with ESA/NASA SOHO coronagraph.",
    },
    quickFacts: [
      { label: "Location", value: "Sun–Earth L1 (+1.5M km)" },
      { label: "Storm Warning Time", value: "15 – 60 Minutes Early!" },
      { label: "Earth View", value: "100% Sunlit Full-Disc 24/7" },
      { label: "Live Telemetry", value: "Feeds Our NOAA HUD!" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "At L1, the Sun's forward pull and Earth's backward pull balance out just right so DSCOVR cruises forever straight between Earth and the Sun!",
          student: "Normally an inner orbit closer to the Sun moves faster than Earth; at L1, Earth's backward gravitational pull reduces the net inward force so DSCOVR orbits in exactly 365.25 days.",
          teacher: "Calculate the warning time right in class: at 1,500,000 km, a 500 km/s solar wind takes 1,500,000 / 500 = 3,000 seconds (~50 minutes) to reach Earth's Bow Shock!",
          scientist: "PlasMag measures interplanetary magnetic field vector B = (Bx, By, Bz) at 1 Hz; sustained southward Bz < −10 nT combined with v_sw > 600 km/s forecasts G3–G5 geomagnetic storms.",
        },
        equations: [
          { label: "Storm Warning Lead Time", formula: "Δt = 1.5×10⁶ km / v_sw", value: "~15 – 60 min" },
          { label: "Light Travel to Earth", formula: "t_c = d_L1 / c", value: "5.0 seconds" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "DSCOVR's EPIC camera uses 10 rainbow & ultraviolet filters to map Earth's protective ozone layer, desert dust storms, volcanic ash, and global cloud chemistry from a million miles out!",
          student: "EPIC's UV channels (317.5–388 nm) measure total column atmospheric ozone (O₃) and UV-absorbing aerosols, while O₂ A/B bands (688 & 764 nm) measure global cloud-top heights.",
          teacher: "Compare EPIC's whole-planet climate view from L1 with GOES-18's regional weather view from GEO!",
          scientist: "Faraday cup resolves solar-wind proton (H⁺) and alpha-particle (He²⁺) velocity distribution functions; NISTAR tracks Earth's absolute broadband radiative energy balance.",
        },
        compounds: [
          { name: "Global Ozone Map", formula: "O₃ (317–340 nm UV)", role: "Full-disc sunlit hemisphere ozone tracking" },
          { name: "Solar Wind Ions", formula: "H⁺ / He²⁺ Plasma", role: "Real-time Faraday Cup storm warning" },
        ],
      },
      biology: {
        summary: {
          explorer: "EPIC measures Earth's global plant health (chlorophyll vegetation index) across entire continents in one snapshot—and even catches rare 'Earth glints' reflecting off ice crystals high in our clouds!",
          student: "Red/Near-IR vegetation bands (680 & 780 nm) quantify global Leaf Area Index (LAI) and photosynthetic activity from sunlit sunrise-to-sunset across the whole planet.",
          teacher: "Ask students what an alien astronomer looking at Earth from light-years away would see: DSCOVR EPIC is literally our 'Earth-as-an-exoplanet' simulator!",
          scientist: "Protects critical terrestrial infrastructure (power grids, aviation polar HF comms, GNSS agriculture/aviation) by delivering real-time CME arrival warnings.",
        },
        highlights: [
          "Captures the famous 'Moon Photobomb' crossing in front of Earth's full sunlit disc!",
          "Measures global ozone, clouds, volcanic ash & continent-wide plant health",
          "Gives power-grid and satellite operators up to 60 minutes notice of solar storms",
        ],
      },
      engineering: {
        summary: {
          explorer: "Orbits in a gentle looping 'Lissajous' figure-eight around L1 so it never sits directly in front of the blinding radio noise of the Sun when beaming data home!",
          student: "If DSCOVR sat dead-center at L1, the Sun's intense radio hiss would drown out its downlink signal to Earth; orbiting 4°–15° off the Sun-Earth line keeps radio contact crystal clear.",
          teacher: "Highlight why BOTH L1 (DSCOVR/SOHO) and L2 (JWST) fly wide Halo/Lissajous orbits rather than sitting at the exact point!",
          scientist: "SMEX-Lite bus (~570 kg dry mass) launched on SpaceX Falcon 9 (first deep-space Falcon 9 launch, Feb 11, 2015); continuous real-time S-band beacon to global NOAA RTSW dish network.",
        },
        specs: [
          { label: "Distance Sunward", value: "~1,500,000 km (L1)" },
          { label: "EPIC Aperture", value: "30.5 cm Cassegrain (10 Bands)" },
          { label: "Partner at L1", value: "ESA/NASA SOHO Coronagraph" },
          { label: "3D Asset", value: "Official NASA DSCOVR CAD" },
        ],
      },
    },
  },

  "neo-bennu": {
    id: "neo-bennu",
    name: "101955 Bennu (OSIRIS-REx Target)",
    subtitle: "B-Type Carbonaceous Near-Earth Asteroid · Official NASA 3D Radar/LiDAR Model",
    category: "science",
    provenance: "SPECTRAL_DATA",
    provenanceDetail: "Official NASA OSIRIS-REx radar & LiDAR 3D shape model (bennu.glb) + JPL Horizons close-approach catalog.",
    has3DModel: true,
    overview: {
      explorer:
        "A spinning, diamond-shaped pile of ancient cosmic rubble as wide as the Empire State Building! NASA's OSIRIS-REx spacecraft flew all the way to Bennu, scooped up 121.6 grams of pitch-black 4.5-billion-year-old asteroid dirt, and parachuted it back to Utah in 2023!",
      student:
        "Bennu (~490 m diameter) is a loosely bound carbonaceous 'rubble pile' asteroid with a tiny gravity (0.00008 m/s²). Sunlight heating its spinning surface creates a subtle thermal push (the Yarkovsky Effect) that slowly shifts its orbit every century.",
      teacher:
        "Astrobiology Treasure Chest: Scientists analyzing NASA's real Bennu sample discovered carbon-rich organic molecules, water-bearing clays, and phosphorus—essential chemical ingredients for life!",
      scientist:
        "Apollo-group PHA (a = 1.126 AU, e = 0.204, i = 6.03°, rotation period 4.296 hr, bulk density 1,190 kg/m³ indicating ~40% macroporosity). Cumulative Earth impact probability ~1 in 1,750 between 2178–2290 (peak Sept 24, 2182).",
    },
    quickFacts: [
      { label: "Diameter", value: "~490 m (Empire State Bldg)" },
      { label: "Composition", value: "B-Type Carbon & Clay Rubble" },
      { label: "NASA Sample", value: "121.6 g Returned (2023!)" },
      { label: "Kinetic Energy", value: "~1,200 Megatons TNT" },
    ],
    science: {
      physics: {
        summary: {
          explorer: "Bennu is barely held together by its own feather-light gravity—if you jumped on Bennu, you'd gently float right off into interplanetary space!",
          student: "Bennu's escape velocity is just ~0.2 m/s (less than a slow walking pace!). Its spinning top shape comes from sunlight slightly accelerating its spin (YORP effect) so boulders slide toward the equator.",
          teacher: "Use Bennu to teach the Yarkovsky Effect: uneven infrared heat radiating off a spinning asteroid acts like a tiny invisible thruster shifting its path by ~285 m/year!",
          scientist: "OSIRIS-REx radio tracking pinned down the Yarkovsky semi-major axis drift da/dt = −19.0 × 10⁻⁴ AU/Myr, drastically narrowing Bennu's 2182 keyhole uncertainty.",
        },
        equations: [
          { label: "Impact Kinetic Energy", formula: "E_k = ½ · m · v²", value: "~1,200 Mt TNT" },
          { label: "Surface Escape Speed", formula: "v_e = √(2GM / R)", value: "~0.20 m/s!" },
        ],
      },
      chemistry: {
        summary: {
          explorer: "Bennu is a frozen time capsule from before Earth existed—dark as charcoal (~4% reflectivity) and packed with hydrated clay minerals, carbonates, and carbon-rich organic chemistry!",
          student: "Laboratory analysis of OSIRIS-REx's 121.6 g sample confirmed ~4.7% carbon by weight, magnesium-sodium phosphates, and water-altered phyllosilicates formed inside an ancient wet parent planetesimal.",
          teacher: "Connect Bennu's hydrated clays and organics directly to how early asteroids may have seeded young Earth with oceans and prebiotic chemistry!",
          scientist: "CI-chondrite-like mineralogy: serpentine/saponite phyllosilicates, magnetite, sulfides, carbonates, and soluble organic compounds including nucleobase precursors & amino acids.",
        },
        compounds: [
          { name: "Hydrated Phyllosilicates", formula: "(Mg,Fe)₃Si₂O₅(OH)₄", role: "Proof of ancient liquid water on parent body" },
          { name: "Prebiotic Organics", formula: "C, H, O, N, P Compounds", role: "Organic building blocks of life delivered to Earth" },
        ],
      },
      biology: {
        summary: {
          explorer: "Asteroids like Bennu play a dramatic double role for life: early impacts delivered water and organic building blocks to newborn Earth, while large modern impacts require planetary defense!",
          student: "NASA's 2022 DART mission proved humanity can deflect a hazardous asteroid by smashing a kinetic impactor into it—changing asteroid Dimorphos's orbit by 33 minutes!",
          teacher: "Discuss Planetary Defense: tracking every Near-Earth Asteroid early (decades in advance) means even a tiny 1 cm/s nudge shifts an asteroid completely clear of Earth!",
          scientist: "Discovery of magnesium-sodium phosphate evaporites in Bennu samples parallels ocean-world Enceladus chemistry, linking carbonaceous asteroids to prebiotic phosphorylation.",
        },
        highlights: [
          "OSIRIS-REx sample (121.6 g) contains water-bearing clays & organic carbon!",
          "Escape velocity is so tiny (~20 cm/s) OSIRIS-REx sank right into the fluffy rubble!",
          "Tracked decades ahead by NASA CNEOS & upcoming NEO Surveyor IR telescope",
        ],
      },
      engineering: {
        summary: {
          explorer: "Instead of landing on Bennu, OSIRIS-REx performed a high-five 'TAG' (Touch-And-Go), blasting nitrogen gas to stir up rocks into its sample collector before flying home!",
          student: "Our 3D model is NASA's actual radar + laser-altimeter shape reconstruction of Bennu, clearly showing its equatorial ridge and boulder-strewn silhouette.",
          teacher: "Click any other Near-Earth Asteroid in the Left Navigator to compare live NASA NeoWs flyby speeds, sizes, and miss distances!",
          scientist: "OSIRIS-REx (now OSIRIS-APEX) is currently en route to rendezvous with 99942 Apophis right after Apophis's historic April 13, 2029 inside-GEO Earth flyby!",
        },
        specs: [
          { label: "Rotation Period", value: "4.296 Hours" },
          { label: "Bulk Density", value: "1,190 kg/m³ (Rubble Pile)" },
          { label: "Sample Mission", value: "NASA OSIRIS-REx (2016–2023)" },
          { label: "3D Asset", value: "Official NASA Radar/LiDAR GLB" },
        ],
      },
    },
  },
};

export const ISS_MODULES: ISSModuleSpec[] = [
  {
    id: "cupola",
    name: "Cupola Observatory",
    agency: "ESA / NASA",
    role: "360° Earth Observation & Robotic Arm Control Dome",
    position: [0, -1.65, 0.35],
    size: [1.35, 0.85, 1.35],
    color: "#38bdf8",
    overview: {
      explorer: "The most famous window in the universe! Seven thick crystal-clear panes let astronauts look straight down at Earth's glowing blue horizon, hurricanes, and auroras.",
      student: "Built with 4-layer fused-silica and borosilicate glass panes (up to 10 cm thick total) plus exterior micrometeoroid shutters, the Cupola houses the Robotic Workstation for Canadarm2.",
      teacher: "Show students the thin blue atmospheric limb visible from the Cupola—Earth's breathable troposphere is only ~12 km thick compared to its 6,371 km radius!",
      scientist: "2.95 m diameter forged Al-2219 dome with 80 cm nadir optical window; optical-grade fused silica minimizes chromatic aberration for Earth remote sensing and astronaut photography.",
    },
    chemistry: "Fused silica (SiO₂) optical glass coated with anti-reflective and infrared-blocking metallic oxide films to shield crew from intense unfiltered solar UV/IR radiation.",
    biology: "Crucial psychological anchor ('Overview Effect') reducing crew stress, sleep disruption, and isolation fatigue during 6–12 month orbital missions.",
    physics: "Withstands 101.3 kPa internal cabin pressure against hard space vacuum (~10⁻⁷ Pa) while armored shutters guard against 10+ km/s hypervelocity micrometeoroid impacts.",
    keySystems: ["7 Fused-Silica Optical Windows", "Canadarm2 Robotic Workstation", "External Micrometeoroid Shutters"],
  },
  {
    id: "destiny",
    name: "Destiny Laboratory",
    agency: "NASA (USA)",
    role: "Primary U.S. Physics, Materials & Cold Atom Science Lab",
    position: [0, 0, -1.55],
    size: [2.1, 1.55, 2.9],
    color: "#60a5fa",
    overview: {
      explorer: "The science powerhouse of the station—inside these racks, scientists freeze atoms to near absolute zero and watch flames burn in weird floating spheres!",
      student: "Destiny holds 24 International Standard Payload Racks (ISPRs) including the Cold Atom Lab (Bose-Einstein condensates) and Microgravity Science Glovebox for combustion and fluid physics.",
      teacher: "Great example of why microgravity unlocks new physics: without buoyancy or convection, hot gases don't rise, so flames form cool blue spheres!",
      scientist: "8.53 m × 4.27 m Al-2219 cylinder hosting CAL (pK-regime Bose-Einstein condensates with multi-second free-fall interrogation times), CIR combustion chamber, and Window Observational Research Facility.",
    },
    chemistry: "Cool-flame combustion experiments (FLEX) reveal chemical reaction pathways (heptane/octane oxidation) hidden by gravity-driven convection on Earth, aiding cleaner engine chemistry.",
    biology: "Houses life-support atmosphere revitalization backups and medical ultrasound/telemetry racks monitoring crew cardiovascular health.",
    physics: "Cold Atom Lab uses laser cooling + magnetic traps to chill rubidium/potassium atoms to <100 picokelvin—the coldest known point in the universe!",
    keySystems: ["Cold Atom Lab (Bose-Einstein Condensates)", "Microgravity Science Glovebox", "24 Modular Science Racks"],
  },
  {
    id: "tranquility",
    name: "Tranquility & ECLSS Hub",
    agency: "NASA / ESA",
    role: "Closed-Loop Water, Oxygen, Exercise & Space Farming",
    position: [0, -0.55, 0.35],
    size: [1.85, 1.35, 1.85],
    color: "#34d399",
    overview: {
      explorer: "The station's recycling heart and gym! Here, astronauts turn sweat and breath back into ultra-pure drinking water and lift weights with vacuum pistons to keep their bones strong.",
      student: "Contains the Environmental Control and Life Support System (ECLSS)—Water Recovery System (98% recycling), Oxygen Generation System (electrolysis), Sabatier reactor, and ARED gym.",
      teacher: "Perfect chemistry + biology crossover module: water purification stoichiometry + human musculoskeletal adaptation to weightlessness.",
      scientist: "Integrates WRS (rotary Vapor Compression Distillation + multifiltration + catalytic oxidizer), PEM Oxygen Generation Assembly (2–9 kg O₂/day), CDRA zeolite CO₂ scrubber, and ARED resistive load device.",
    },
    chemistry: "Runs two iconic reactions continuously: Electrolysis (2H₂O → 2H₂ + O₂) for breathable oxygen, and Sabatier methanation (CO₂ + 4H₂ → CH₄ + 2H₂O) recovering precious water from exhaled CO₂.",
    biology: "Houses the ARED exercise machine (simulating up to 270 kg deadlifts in weightlessness via vacuum cylinders) and supports Veggie hydroponic plant-growth chambers.",
    physics: "Centrifugal Vapor Compression Distillation spins urine/condensate to create artificial gravity so liquid and vapor separate cleanly without buoyancy.",
    keySystems: ["98% Closed-Loop Water Recovery", "PEM Oxygen Electrolysis & Sabatier", "ARED Bone-Preserving Gym"],
  },
  {
    id: "columbus",
    name: "Columbus Bio-Science Lab",
    agency: "ESA (Europe)",
    role: "Human Physiology, Biolab & Astrobiology Research",
    position: [2.25, 0, -2.2],
    size: [2.5, 1.45, 1.5],
    color: "#a78bfa",
    overview: {
      explorer: "Europe's high-tech biology lab where scientists study how human cells, microbes, and even tiny space-hardy water bears (tardigrades) survive the harsh environment of orbit.",
      student: "Columbus features Biolab (with micro-centrifuges to compare 0g vs 1g cells side by side), Fluid Science Lab, and external Expose astrobiology platforms.",
      teacher: "Highlight the onboard centrifuge trick: spinning a sample to 1g inside Columbus isolates microgravity as the ONLY variable vs. space radiation!",
      scientist: "6.87 m × 4.48 m pressurized lab housing Biolab (0.001g–2g programmable centrifuges), European Physiology Modules (neurovestibular/bone remodeling), and Bartolomeo external astrobiology deck.",
    },
    chemistry: "External EXPOSE experiments test how organic amino acids, DNA, and polycyclic aromatic hydrocarbons (PAHs) degrade under raw solar vacuum UV.",
    biology: "Proves extremophiles (lichens, bacterial spores, tardigrades) can survive direct vacuum and cosmic radiation, directly informing planetary protection and panspermia research.",
    physics: "Fluid Science Laboratory uses optical interferometry to measure Marangoni thermocapillary convection free from gravitational buoyancy.",
    keySystems: ["Biolab (Variable-g Micro-Centrifuge)", "European Physiology Modules", "External Astrobiology Deck"],
  },
  {
    id: "kibo",
    name: "Kibo (JEM) Science Complex",
    agency: "JAXA (Japan)",
    role: "Largest Lab Module · Airlock, Protein Crystals & Exposed Porch",
    position: [-2.55, 0, -2.2],
    size: [3.1, 1.55, 1.6],
    color: "#fbbf24",
    overview: {
      explorer: "The biggest room on the ISS! Kibo even has its own miniature airlock and outdoor 'back porch' where robots slide experiments straight into the vacuum of space.",
      student: "Includes the Pressurized Module, Logistics Module, dedicated Robotic Arm, Experiment Airlock (which launches CubeSats!), and Exposed Facility for space-radiation science.",
      teacher: "Explain how microgravity grows ultra-pure protein crystals inside Kibo—helping medical researchers map diseases like Duchenne muscular dystrophy.",
      scientist: "11.19 m × 4.39 m module with dedicated airlock, Small Satellite Orbital Deployer (J-SSOD), Electrostatic Levitation Furnace (containerless >2000°C melt thermophysics), and MAXI X-ray sky monitor.",
    },
    chemistry: "Electrostatic Levitation Furnace melts metals and oxides suspended in mid-air without a crucible—preventing chemical contamination at >2,000°C.",
    biology: "Microgravity eliminates sedimentation, allowing large, ultra-ordered protein crystals to form for high-resolution X-ray diffraction drug design.",
    physics: "Exterior MAXI & CALET detectors measure cosmic X-rays, black hole flares, and high-energy TeV cosmic-ray electrons directly from LEO.",
    keySystems: ["CubeSat Airlock & Exposed Porch", "Electrostatic Levitation Furnace", "Protein Crystal Growth & X-Ray Monitors"],
  },
  {
    id: "zvezda",
    name: "Zvezda Service & Propulsion",
    agency: "Roscosmos (Russia)",
    role: "Living Quarters, Elektron O₂ Generator & Orbital Reboost Engines",
    position: [0, 0, 2.85],
    size: [1.95, 1.55, 3.1],
    color: "#fb7185",
    overview: {
      explorer: "The station's engine room and living quarters—equipped with crew sleep cabins, kitchen galley, and powerful rocket engines that lift the entire 420-ton station back up whenever thin air slows it down!",
      student: "Zvezda provides attitude control thrusters, main orbital reboost engines, crew quarters, the Vozdukh CO₂ scrubber, and the Elektron oxygen electrolysis unit.",
      teacher: "Ask students: if space is a vacuum, why does Zvezda need rocket engines? Because tenuous thermosphere air at 420 km creates tiny continuous drag!",
      scientist: "13.1 m core service module housing dual 3.0 kN hypergolic main engines (UDMH / N₂O₄), 32 attitude thrusters, Elektron-VM KOH electrolyte O₂ generator, and Vozdukh regenerable CO₂ absorber.",
    },
    chemistry: "Hypergolic propellant pair—unsymmetrical dimethylhydrazine (UDMH) + dinitrogen tetroxide (N₂O₄)—ignites spontaneously on contact without spark plugs for ultra-reliable orbital reboosts.",
    biology: "Houses crew sleep stations, acoustic-dampened rest quarters, and circadian LED lighting schedules helping astronauts maintain 24-hour sleep cycles despite 16 sunrises/day.",
    physics: "Periodic prograde Δv burns (~0.5–1.5 m/s) raise semi-major axis via Vis-Viva relation (v² = μ(2/r − 1/a)), counteracting ~50–100 m/day atmospheric drag decay.",
    keySystems: ["Main Hypergolic Reboost Engines", "Elektron O₂ & Vozdukh CO₂ Scrubbers", "Crew Quarters & Galley"],
  },
];
