# Project Cosmos — Shell 1A (`0 → 2,500 km` Earth & Low Earth Orbit)

An outer-space **God's Eye** real-time 3D/4D cosmic intelligence, orbital telemetry, and multi-disciplinary learning platform built shell-by-shell.

## What's Inside Shell 1A
- **Photorealistic 3D Earth** with real-time UTC solar terminator, night city lights, Rayleigh atmospheric scattering, animated clouds, polar auroras, and **Spectral Sensor Modes** (`Optical`, `Thermal IR / FLIR`, `Radar Hologram`).
- **4-Tier Spatial Memory & Multi-Scale Engine**: Logarithmic depth buffer, single-draw-call `InstancedMesh` LEO swarm, hysteresis LOD spacecraft streaming (`ISS`, `Hubble`, `Tiangong`, `Starlink`), LRU VRAM cache with explicit `.dispose()`, and isolated Tier 3 sub-scenes.
- **ISS Full Experience**: Detailed 3D exterior, interactive **3D Interior Module Cutaway** (Cupola, Destiny, Tranquility/ECLSS, Columbus, Kibo, Zvezda) with microgravity biology & closed-loop chemistry, plus **Live ISS Earth-Viewing Feed**.
- **Ground-Up Earth Sky View**: Pick any city (or real GPS), look up at live overhead satellites in real Azimuth/Elevation, and click any target to launch straight into orbit.
- **4 Adaptive User Modes**: `Explorer`, `Student`, `Teacher`, and `Scientist` (equations, chemistry, astrobiology, raw TLEs).
- **Dual UI Mode**: Instant toggle between **Tactical Command HUD** and **Clean Cinema Mode** (shortcut: `C`).
- **4D Time Engine**: Scrub past/future orbits (`-300x` to `+300x`, `Space` to pause, `L` to snap to `1x LIVE`).
- **Live Launches & Space News**: Global launch pads mapped in 3D, upcoming T-minus countdowns, and live Spaceflight News feed.
- **AI Spatial Mission Commander**: Powered by `@google/genai` (`gemini-4-hydrogen`) with live 3D steering tool-calling + an instant local command engine if `GEMINI_API_KEY` is not yet set.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: Enable Full Gemini 4 AI Commander
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey) (Free Tier requires no credit card).
2. Paste it into `.env.local`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
3. Restart `npm run dev`.
