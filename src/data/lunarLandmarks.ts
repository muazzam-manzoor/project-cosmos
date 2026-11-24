import { LunarLandmark } from "@/types/cosmos";

export const LUNAR_LANDMARKS: LunarLandmark[] = [
  {
    id: "apollo11",
    name: "Apollo 11 — Tranquility Base",
    shortName: "Apollo 11",
    type: "apollo",
    lat: 0.674,
    lon: 23.473,
    missionYear: "July 20, 1969",
    agency: "NASA (USA)",
    description:
      "First crewed landing on another world! Neil Armstrong and Buzz Aldrin touched down Lunar Module Eagle on the smooth basalt plain of Mare Tranquillitatis, returning 21.55 kg of lunar rock and deploying a laser retroreflector still used today.",
    geology:
      "High-titanium mare basalt (~3.7 billion years old) rich in ilmenite (FeTiO₃), plagioclase, and pyroxene formed by ancient lunar volcanic flooding.",
    highlight: "Laser retroreflector here measures the Moon drifting +3.8 cm/year away from Earth!",
    hasLunarModule: true,
  },
  {
    id: "artemis3",
    name: "Artemis III — Shackleton Crater (South Pole)",
    shortName: "Artemis South Pole",
    type: "artemis",
    lat: -89.54,
    lon: 129.78,
    missionYear: "Artemis Campaign",
    agency: "NASA / ESA / CSA / JAXA",
    description:
      "Target region for humanity's return to the Moon! Shackleton's rim receives near-continuous 'Peaks of Eternal Light' for solar power, while its permanently shadowed floor (~−230°C) traps billions of tons of ancient water ice (H₂O).",
    geology:
      "Impact-excavated highlands anorthosite (CaAl₂Si₂O₈) with cold-trapped volatile water ice, CO₂, and NH₃ verified by NASA LCROSS & LRO neutron/laser instruments.",
    highlight: "Water ice here can be electrolyzed into breathable O₂ and liquid H₂/O₂ rocket fuel!",
  },
  {
    id: "apollo15",
    name: "Apollo 15 — Hadley-Apennine",
    shortName: "Apollo 15",
    type: "apollo",
    lat: 26.132,
    lon: 3.634,
    missionYear: "July 30, 1971",
    agency: "NASA (USA)",
    description:
      "First 'J-Mission' featuring the Lunar Roving Vehicle! Dave Scott and Jim Irwin drove 27.9 km beside Mons Hadley and the winding Hadley Rille lava channel, recovering the 4.1-billion-year-old 'Genesis Rock'.",
    geology:
      "Ancient primordial anorthosite highland crust uplifted by the Imbrium impact beside sinuous volcanic basalt rilles.",
    highlight: "Famously tested Galileo's law of gravity live on TV by dropping a hammer and falcon feather in vacuum!",
  },
  {
    id: "tycho",
    name: "Tycho Crater",
    shortName: "Tycho Crater",
    type: "crater",
    lat: -43.31,
    lon: -11.36,
    description:
      "The Moon's most dramatic young impact crater (85 km wide, 4.8 km deep), blasted out ~108 million years ago during the Cretaceous era. Its bright ejecta rays stretch over 1,500 km across the lunar nearside!",
    geology:
      "Fresh unweathered plagioclase-rich impact melt sheets and a towering 2 km central rebound peak formed in seconds during hypervelocity impact.",
    highlight: "Visible even with binoculars from Earth thanks to its dazzling bright ejecta ray network.",
  },
  {
    id: "imbrium",
    name: "Mare Imbrium (Sea of Showers)",
    shortName: "Mare Imbrium",
    type: "mare",
    lat: 32.8,
    lon: -15.6,
    description:
      "A colossal 1,145 km volcanic plain forming the right eye of the 'Man in the Moon'. Created ~3.85 billion years ago when a protoplanet ~250 km wide slammed into the young Moon and flooded the basin with dark basalt lava.",
    geology:
      "Dense iron- and magnesium-rich flood basalts creating a strong positive gravity anomaly ('mascon') that subtly tugs on low-flying lunar orbiters.",
    highlight: "Home to the first Soviet Lunokhod 1 rover (1970) and China's Chang'e-3 Yutu rover (2013).",
  },
  {
    id: "spa-basin",
    name: "South Pole–Aitken Basin (Far Side)",
    shortName: "Far Side SPA Basin",
    type: "basin",
    lat: -53.0,
    lon: -169.0,
    description:
      "One of the largest known impact craters in the entire Solar System — 2,500 km wide and up to 8 km deep on the lunar Far Side! Excised so deeply that it exposed rocks from the Moon's lower crust and upper mantle.",
    geology:
      "Rich in iron, thorium, and olivine-pyroxene mantle minerals; sampled for the first time in human history by China's Chang'e-6 sample-return mission in 2024.",
    highlight: "Radio-quiet sanctuary shielded from Earth's radio noise—ideal for future cosmic-dawn radio telescopes!",
  },
];
