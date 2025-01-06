"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import TopoCanvas from "./TopoCanvas";
import Controls from "./Controls";
import { DEFAULT_CONFIG, TopoConfig, generateTopoMap } from "../lib/topoGenerator";

// Three.js doit être importé côté client uniquement
const TopoScene3D = dynamic(() => import("./TopoScene3D"), { ssr: false });

export default function TopoGenerator() {
  const [config, setConfig] = useState<TopoConfig>(DEFAULT_CONFIG);

  const handleRandomize = useCallback(() => {
    setConfig((c) => ({ ...c, seed: Math.floor(Math.random() * 10000) }));
  }, []);

  const handleExport = useCallback(() => {
    if (config.renderMode === "3d") return; // export non supporté en 3D
    const offscreen = document.createElement("canvas");
    generateTopoMap(offscreen, config);
    const link = document.createElement("a");
    link.download = `topo-${config.seed}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
  }, [config]);

  return (
    <div className="flex gap-6 w-full h-full p-6">
      <div className="flex-1 min-w-0 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
        {config.renderMode === "3d" ? (
          <TopoScene3D config={config} />
        ) : (
          <TopoCanvas config={config} />
        )}
      </div>
      <Controls
        config={config}
        onChange={setConfig}
        onExport={handleExport}
        onRandomize={handleRandomize}
      />
    </div>
  );
}
