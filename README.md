# Topographic Map Generator

**Live demo → [topographic-map-generator.vercel.app](https://topographic-map-generator.vercel.app/)**

A browser-based procedural topographic map generator. Generate, customize and export stunning topographic visuals across three distinct render modes — all in real time.

---

## Render modes

### Lines
Classic contour lines extracted via marching squares on a Perlin noise heightmap. Supports index lines (courbes maîtresses) with independent color and width.

### Papercut
Layered paper-cut effect — each elevation band is filled with a solid color, with pixel-accurate drop shadows between layers for a physical depth illusion.

### 3D
Interactive Three.js terrain with a full orbit camera (rotate, zoom, pan). Contour lines are projected directly onto the 3D mesh surface.

---

## Features

- **Perlin noise + fBm** — custom implementation, fully deterministic from seed
- **Marching squares** — smooth, gap-free isoline extraction
- **Index lines** — every Nth contour rendered thicker / differently colored
- **Grid overlay** — available on all three modes, fully independent config per mode
  - Configurable cells, line width, color, opacity
  - Optional alphanumeric labels (A1, B2 …) with corner placement (↖ ↗ ↙ ↘)
  - Custom origin — start at any coordinate (e.g. R4)
  - Separate label color and opacity from line color
- **PNG export** at full resolution (1200 × 800) via offscreen canvas
- **Randomize** — new seed, same everything else
- **Debounced rendering** — 40 ms for visual changes, 120 ms for structural changes
- **No resize loops** — ResizeObserver watches the wrapper div, not the canvas

---

## Tech stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) — App Router |
| UI | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| 3D | [Three.js](https://threejs.org/) + OrbitControls |
| Language | TypeScript |

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Production build
npm run build && npm start
```

---

## Project structure

```
app/
├── lib/
│   ├── noise.ts            Perlin noise + fBm
│   └── topoGenerator.ts    Heightmap, marching squares, all 2D renderers
├── components/
│   ├── TopoGenerator.tsx   Root state + mode routing
│   ├── TopoCanvas.tsx      2D canvas — debounced render + ResizeObserver
│   ├── TopoScene3D.tsx     Three.js scene, mesh, contour lines, grid
│   └── Controls.tsx        Sidebar — sliders, color pickers, grid section
└── page.tsx
```

---

## How it works

**Noise & heightmap** — Perlin noise layered with fBm produces organic terrain. Each render call builds a normalized `Float32Array` from the noise at the configured seed, scale and octave count.

**Marching squares** — For each elevation threshold, adjacent grid cells are scanned and edge crossing points are interpolated to produce smooth, continuous isolines across all 16 cell configurations.

**Papercut renderer** — Heightmap sampled at ⅓ resolution for performance. Each pixel is assigned a discrete elevation band and colored via linear interpolation. Shadow edges are detected per pixel by finding band transitions, then a gradient alpha row is written below each edge.

**3D renderer** — Heightmap applied as Y-displacement on a `PlaneGeometry`. Isolines extracted in grid space are converted to `LineSegments` at the correct world-space elevation. Color interpolates from base to peak along the threshold value.

**Performance** — Color/opacity changes are debounced 40 ms; seed/scale/octave changes 120 ms. The `ResizeObserver` targets the wrapper `div` so `canvas.width` mutations never trigger a spurious resize callback.

---

## License

MIT
