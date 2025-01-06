import { PerlinNoise } from "./noise";

export type RenderMode = "lines" | "papercut" | "3d";

export interface TopoConfig {
  width: number;
  height: number;
  seed: number;
  scale: number;
  octaves: number;
  lineCount: number;
  renderMode: RenderMode;
  // Lines mode
  lineWidth: number;
  lineColor: string;
  bgColor: string;
  opacity: number;
  indexInterval: number;
  indexColor: string;
  indexWidth: number;
  indexOpacity: number;
  // Papercut mode
  paperBgColor: string;
  paperLayerColor: string;
  paperShadowColor: string;
  paperShadowBlur: number;
  paperShadowOffset: number;
  // 3D mode
  terrainBgColor: string;
  terrainLineColor: string;
  terrainHighColor: string;
  terrainAltitude: number;   // vertical exaggeration
  terrainTilt: number;       // camera tilt 0–1
  terrainGridX: number;
  terrainGridY: number;
  terrain3dScale: number;
  terrain3dOctaves: number;
  terrain3dLineCount: number;
  // Grid — Lines mode
  linesGridEnabled: boolean;
  linesGridCells: number;
  linesGridLineWidth: number;
  linesGridLineColor: string;
  linesGridLineOpacity: number;
  linesGridLabels: boolean;
  linesGridLabelColor: string;
  linesGridLabelOpacity: number;
  linesGridLabelCorner: "tl" | "tr" | "bl" | "br";
  linesGridOriginCol: number;
  linesGridOriginRow: number;
  // Grid — Papercut mode
  paperGridEnabled: boolean;
  paperGridCells: number;
  paperGridLineWidth: number;
  paperGridLineColor: string;
  paperGridLineOpacity: number;
  paperGridLabels: boolean;
  paperGridLabelColor: string;
  paperGridLabelOpacity: number;
  paperGridLabelCorner: "tl" | "tr" | "bl" | "br";
  paperGridOriginCol: number;
  paperGridOriginRow: number;
  // Grid — 3D mode
  grid3dEnabled: boolean;
  grid3dCells: number;
  grid3dLineColor: string;
  grid3dLabels: boolean;
  grid3dLabelColor: string;
  grid3dLabelOpacity: number;
  grid3dLabelCorner: "tl" | "tr" | "bl" | "br";
  grid3dOriginCol: number;
  grid3dOriginRow: number;
}

export const DEFAULT_CONFIG: TopoConfig = {
  width: 1200,
  height: 800,
  seed: 42,
  scale: 2,
  octaves: 2,
  lineCount: 11,
  renderMode: "lines",
  lineWidth: 1.2,
  lineColor: "#ffffff",
  bgColor: "#1a1a1a",
  opacity: 0.6,
  indexInterval: 5,
  indexColor: "#ffffff",
  indexWidth: 2.5,
  indexOpacity: 1,
  paperBgColor: "#0d0d0d",
  paperLayerColor: "#3a3a3a",
  paperShadowColor: "#000000",
  paperShadowBlur: 12,
  paperShadowOffset: 6,
  terrainBgColor: "#000000",
  terrainLineColor: "#00ff66",
  terrainHighColor: "#afffcf",
  terrainAltitude: 0.3,
  terrainTilt: 0.5,
  terrainGridX: 120,
  terrainGridY: 80,
  terrain3dScale: 3.5,
  terrain3dOctaves: 3,
  terrain3dLineCount: 17,
  linesGridEnabled: false,
  linesGridCells: 8,
  linesGridLineWidth: 0.5,
  linesGridLineColor: "#ffffff",
  linesGridLineOpacity: 0.15,
  linesGridLabels: false,
  linesGridLabelColor: "#ffffff",
  linesGridLabelOpacity: 0.4,
  linesGridLabelCorner: "tl",
  linesGridOriginCol: 0,
  linesGridOriginRow: 1,
  paperGridEnabled: false,
  paperGridCells: 8,
  paperGridLineWidth: 0.5,
  paperGridLineColor: "#ffffff",
  paperGridLineOpacity: 0.15,
  paperGridLabels: false,
  paperGridLabelColor: "#ffffff",
  paperGridLabelOpacity: 0.4,
  paperGridLabelCorner: "tl",
  paperGridOriginCol: 0,
  paperGridOriginRow: 1,
  grid3dEnabled: false,
  grid3dCells: 8,
  grid3dLineColor: "#ffffff",
  grid3dLabels: false,
  grid3dLabelColor: "#ffffff",
  grid3dLabelOpacity: 0.4,
  grid3dLabelCorner: "tl",
  grid3dOriginCol: 0,
  grid3dOriginRow: 1,
};

export function generateTopoMap(canvas: HTMLCanvasElement, config: TopoConfig) {
  if (config.renderMode === "papercut") {
    generatePapercut(canvas, config);
    if (config.paperGridEnabled) drawGrid2D(canvas.getContext("2d")!, config, "papercut");
    return;
  }
  if (config.renderMode === "3d") return; // handled by TopoScene3D (Three.js)
  const ctx = canvas.getContext("2d")!;
  const {
    width, height, seed, scale, octaves, lineCount,
    lineWidth, lineColor, bgColor, opacity,
    indexInterval, indexColor, indexWidth, indexOpacity,
  } = config;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const noise = new PerlinNoise(seed);

  const heightmap: number[][] = [];
  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < height; y++) {
    heightmap[y] = [];
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * scale;
      const ny = (y / height) * scale;
      const v = noise.fbm(nx, ny, octaves);
      heightmap[y][x] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const range = max - min;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      heightmap[y][x] = (heightmap[y][x] - min) / range;
    }
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw regular lines first, then index lines on top
  for (let i = 1; i < lineCount; i++) {
    const isIndex = indexInterval > 0 && i % indexInterval === 0;
    if (isIndex) continue; // drawn in second pass

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = opacity;
    const threshold = i / lineCount;
    marchingSquares(ctx, heightmap, width, height, threshold);
  }

  if (indexInterval > 0) {
    for (let i = indexInterval; i < lineCount; i += indexInterval) {
      ctx.strokeStyle = indexColor;
      ctx.lineWidth = indexWidth;
      ctx.globalAlpha = indexOpacity;
      const threshold = i / lineCount;
      marchingSquares(ctx, heightmap, width, height, threshold);
    }
  }

  ctx.globalAlpha = 1;

  if (config.linesGridEnabled) drawGrid2D(ctx, config, "lines");
}

function marchingSquares(
  ctx: CanvasRenderingContext2D,
  heightmap: number[][],
  width: number,
  height: number,
  threshold: number
) {
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const tl = heightmap[y][x];
      const tr = heightmap[y][x + 1];
      const bl = heightmap[y + 1][x];
      const br = heightmap[y + 1][x + 1];

      const idx =
        (tl >= threshold ? 8 : 0) |
        (tr >= threshold ? 4 : 0) |
        (br >= threshold ? 2 : 0) |
        (bl >= threshold ? 1 : 0);

      if (idx === 0 || idx === 15) continue;

      // Interpolated edge midpoints
      const top = interp(x, y, x + 1, y, tl, tr, threshold);
      const right = interp(x + 1, y, x + 1, y + 1, tr, br, threshold);
      const bottom = interp(x, y + 1, x + 1, y + 1, bl, br, threshold);
      const left = interp(x, y, x, y + 1, tl, bl, threshold);

      ctx.beginPath();
      drawCase(ctx, idx, top, right, bottom, left);
      ctx.stroke();
    }
  }
}

function interp(
  x1: number, y1: number,
  x2: number, y2: number,
  v1: number, v2: number,
  threshold: number
) {
  const t = v2 === v1 ? 0.5 : (threshold - v1) / (v2 - v1);
  return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
}

type Point = { x: number; y: number };

function drawCase(
  ctx: CanvasRenderingContext2D,
  idx: number,
  top: Point, right: Point, bottom: Point, left: Point
) {
  const lines: [Point, Point][] = [];

  switch (idx) {
    case 1: case 14: lines.push([bottom, left]); break;
    case 2: case 13: lines.push([right, bottom]); break;
    case 3: case 12: lines.push([right, left]); break;
    case 4: case 11: lines.push([top, right]); break;
    case 5: lines.push([top, left], [right, bottom]); break;
    case 6: case 9: lines.push([top, bottom]); break;
    case 7: case 8: lines.push([top, left]); break;
    case 10: lines.push([top, right], [bottom, left]); break;
  }

  for (const [a, b] of lines) {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
}

// ---------------------------------------------------------------------------
// Papercut renderer
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpCh(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function generatePapercut(canvas: HTMLCanvasElement, config: TopoConfig) {
  const { width, height, seed, scale, octaves, lineCount } = config;
  const paperBgColor    = config.paperBgColor    ?? "#111111";
  const paperLayerColor = config.paperLayerColor ?? "#2a2a2a";
  const paperShadowColor = config.paperShadowColor ?? "#000000";
  const shadowOffset = config.paperShadowOffset ?? 6;

  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const bgRgb    = hexToRgb(paperBgColor);
  const layerRgb = hexToRgb(paperLayerColor);

  // Build heightmap at 1/3 resolution — noise is smooth so this is fine
  const S = 3;
  const W = Math.ceil(width  / S);
  const H = Math.ceil(height / S);

  const noise = new PerlinNoise(seed);
  const hmap = new Float32Array(W * H);
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = noise.fbm((x / W) * scale, (y / H) * scale, octaves);
      hmap[y * W + x] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  const span = hi - lo || 1;
  for (let i = 0; i < hmap.length; i++) hmap[i] = (hmap[i] - lo) / span;

  // ── Step 1: paint the flat layer colors directly into pixels ──────────────
  // Each pixel gets the color of its discrete layer band.
  // We write into a small ImageData then upscale via drawImage.
  const baseCanvas = document.createElement("canvas");
  baseCanvas.width  = W;
  baseCanvas.height = H;
  const bCtx = baseCanvas.getContext("2d")!;
  const imgData = bCtx.createImageData(W, H);
  const d = imgData.data;

  for (let i = 0; i < hmap.length; i++) {
    const band = Math.min(Math.floor(hmap[i] * lineCount), lineCount - 1);
    // t=0 → bgColor (fond, sombre), t=1 → layerColor (surface, clair)
    const t = band / (lineCount - 1);
    d[i * 4 + 0] = lerpCh(bgRgb[0], layerRgb[0], t);
    d[i * 4 + 1] = lerpCh(bgRgb[1], layerRgb[1], t);
    d[i * 4 + 2] = lerpCh(bgRgb[2], layerRgb[2], t);
    d[i * 4 + 3] = 255;
  }
  bCtx.putImageData(imgData, 0, 0);

  // Draw base (upscaled, browser bilinear smooths the staircase naturally)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(baseCanvas, 0, 0, width, height);

  // ── Step 2: shadow pass ────────────────────────────────────────────────────
  // For each contour edge pixel (transition below→above threshold),
  // paint shadowOffset rows below it with a dark semi-transparent color.
  const [sr, sg, sb] = hexToRgb(paperShadowColor);
  const shadowData = bCtx.createImageData(W, H);
  const sd = shadowData.data;

  for (let i = 1; i < lineCount; i++) {
    const threshold = i / lineCount;
    for (let y = 0; y < H - 1; y++) {
      for (let x = 0; x < W; x++) {
        const above = hmap[y * W + x] >= threshold;
        const belowNext = hmap[(y + 1) * W + x] < threshold;
        if (above && belowNext) {
          // edge: paint shadowOffset rows below
          for (let dy = 1; dy <= shadowOffset && y + dy < H; dy++) {
            const alpha = Math.round(180 * (1 - dy / (shadowOffset + 1)));
            const idx = ((y + dy) * W + x) * 4;
            // blend over existing shadow (take max alpha)
            if (alpha > sd[idx + 3]) {
              sd[idx + 0] = sr;
              sd[idx + 1] = sg;
              sd[idx + 2] = sb;
              sd[idx + 3] = alpha;
            }
          }
        }
      }
    }
  }

  bCtx.putImageData(shadowData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(baseCanvas, 0, 0, width, height);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Grid overlay — 2D modes
// ---------------------------------------------------------------------------

function drawGrid2D(ctx: CanvasRenderingContext2D, config: TopoConfig, mode: "lines" | "papercut") {
  const p = mode === "lines" ? {
    cells:        config.linesGridCells,
    lineWidth:    config.linesGridLineWidth,
    lineColor:    config.linesGridLineColor,
    lineOpacity:  config.linesGridLineOpacity,
    labels:       config.linesGridLabels,
    labelColor:   config.linesGridLabelColor,
    labelOpacity: config.linesGridLabelOpacity,
    corner:       config.linesGridLabelCorner,
    originCol:    config.linesGridOriginCol,
    originRow:    config.linesGridOriginRow,
  } : {
    cells:        config.paperGridCells,
    lineWidth:    config.paperGridLineWidth,
    lineColor:    config.paperGridLineColor,
    lineOpacity:  config.paperGridLineOpacity,
    labels:       config.paperGridLabels,
    labelColor:   config.paperGridLabelColor,
    labelOpacity: config.paperGridLabelOpacity,
    corner:       config.paperGridLabelCorner,
    originCol:    config.paperGridOriginCol,
    originRow:    config.paperGridOriginRow,
  };

  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  ctx.save();

  // — Trait du quadrillage —
  ctx.globalAlpha = p.lineOpacity;
  ctx.strokeStyle = p.lineColor;
  ctx.lineWidth = p.lineWidth;
  ctx.setLineDash([]);

  for (let i = 0; i <= p.cells; i++) {
    const x = i === p.cells ? W : Math.floor((i / p.cells) * W) + 0.5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let j = 0; j <= p.cells; j++) {
    const y = j === p.cells ? H : Math.floor((j / p.cells) * H) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // — Labels —
  if (p.labels) {
    const cellW = W / p.cells;
    const cellH = H / p.cells;
    const fontSize = Math.max(9, Math.round(Math.min(cellW, cellH) * 0.1));
    const pad = Math.round(fontSize * 0.6);

    // Alignement selon le coin choisi
    const alignH = p.corner === "tr" || p.corner === "br" ? "right"  : "left";
    const alignV = p.corner === "bl" || p.corner === "br" ? "bottom" : "top";

    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign    = alignH as CanvasTextAlign;
    ctx.textBaseline = alignV as CanvasTextBaseline;
    ctx.globalAlpha  = p.labelOpacity;
    ctx.fillStyle    = p.labelColor;

    for (let j = 0; j < p.cells; j++) {
      for (let i = 0; i < p.cells; i++) {
        const label = `${ALPHA[(p.originCol + i) % 26]}${p.originRow + j}`;
        // Position X : bord gauche ou droit de la cellule + padding
        const cellX = Math.floor((i / p.cells) * W);
        const cellY = Math.floor((j / p.cells) * H);
        const x = alignH === "left"   ? cellX + pad            : cellX + cellW - pad;
        const y = alignV === "top"    ? cellY + pad            : cellY + cellH - pad;
        ctx.fillText(label, x, y);
      }
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 3D renderer — perspective terrain with contour lines
