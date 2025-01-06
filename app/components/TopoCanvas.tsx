"use client";

import { useEffect, useRef } from "react";
import { generateTopoMap, TopoConfig } from "../lib/topoGenerator";

// Clés qui nécessitent un recalcul complet du heightmap (coûteux)
const HEAVY_KEYS: (keyof TopoConfig)[] = [
  "seed", "scale", "octaves", "lineCount", "renderMode",
  "terrain3dScale", "terrain3dOctaves", "terrain3dLineCount",
  "terrainGridX", "terrainGridY",
];

function isHeavyChange(prev: TopoConfig, next: TopoConfig) {
  return HEAVY_KEYS.some((k) => prev[k] !== next[k]);
}

interface Props {
  config: TopoConfig;
}

export default function TopoCanvas({ config }: Props) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const configRef    = useRef(config);
  const prevConfig   = useRef(config);
  const sizeRef      = useRef({ w: 0, h: 0 });
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  configRef.current = config;

  const render = (cfg: TopoConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    generateTopoMap(canvas, { ...cfg, width: w, height: h });
  };

  useEffect(() => {
    const prev = prevConfig.current;
    prevConfig.current = config;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (isHeavyChange(prev, config)) {
      // Changement structurel (seed, scale…) — debounce 120ms
      timerRef.current = setTimeout(() => render(configRef.current), 120);
    } else {
      // Changement léger (couleur, opacité…) — debounce court 40ms
      timerRef.current = setTimeout(() => render(configRef.current), 40);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [config]);

  // ResizeObserver sur le wrapper — pas affecté par canvas.width/height
  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const dpr = window.devicePixelRatio || 1;
      const w   = Math.round(entry.contentRect.width  * dpr);
      const h   = Math.round(entry.contentRect.height * dpr);
      if (w === 0 || h === 0) return;
      sizeRef.current = { w, h };
      generateTopoMap(canvas, { ...configRef.current, width: w, height: h });
    });

    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
