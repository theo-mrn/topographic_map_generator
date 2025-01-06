"use client";

import { TopoConfig, RenderMode } from "../lib/topoGenerator";

interface Props {
  config: TopoConfig;
  onChange: (config: TopoConfig) => void;
  onExport: () => void;
  onRandomize: () => void;
}

function Slider({
  label, value, min, max, step = 1,
  onChange,
}: {
  label: string; value: number | undefined; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white h-1 cursor-pointer"
      />
    </div>
  );
}

function ColorPicker({
  label, value, onChange,
}: {
  label: string; value: string | undefined; onChange: (v: string) => void;
}) {
  const safe = value ?? "#000000";
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 tabular-nums">{safe}</span>
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
        />
      </div>
    </div>
  );
}

const COLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CORNERS = [
  { value: "tl", label: "↖" },
  { value: "tr", label: "↗" },
  { value: "bl", label: "↙" },
  { value: "br", label: "↘" },
] as const;

type Corner = "tl" | "tr" | "bl" | "br";

function GridSection({
  enabled, onToggle,
  cells, onCells,
  lineWidth, onLineWidth,
  lineColor, onLineColor,
  lineOpacity, onLineOpacity,
  labels, onLabels,
  labelColor, onLabelColor,
  labelOpacity, onLabelOpacity,
  corner, onCorner,
  originCol, onOriginCol,
  originRow, onOriginRow,
  showLineOpacity = true,
}: {
  enabled: boolean;      onToggle: () => void;
  cells: number;         onCells: (v: number) => void;
  lineWidth: number;     onLineWidth: (v: number) => void;
  lineColor: string;     onLineColor: (v: string) => void;
  lineOpacity: number;   onLineOpacity: (v: number) => void;
  labels: boolean;       onLabels: () => void;
  labelColor: string;    onLabelColor: (v: string) => void;
  labelOpacity: number;  onLabelOpacity: (v: number) => void;
  corner: Corner;        onCorner: (v: Corner) => void;
  originCol: number;     onOriginCol: (v: number) => void;
  originRow: number;     onOriginRow: (v: number) => void;
  showLineOpacity?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Grid</p>
        <button onClick={onToggle} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${enabled ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-500"}`}>
          {enabled ? "ON" : "OFF"}
        </button>
      </div>

      {enabled && <>
        {/* Trait */}
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Lines</p>
        <Slider label="Cells" value={cells} min={2} max={20} onChange={onCells} />
        <Slider label="Width" value={lineWidth} min={0.5} max={4} step={0.5} onChange={onLineWidth} />
        {showLineOpacity && <Slider label="Opacity" value={lineOpacity} min={0.02} max={1} step={0.02} onChange={onLineOpacity} />}
        <ColorPicker label="Color" value={lineColor} onChange={onLineColor} />

        {/* Labels */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Labels</p>
          <button onClick={onLabels} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${labels ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-500"}`}>
            {labels ? "ON" : "OFF"}
          </button>
        </div>

        {labels && <>
          {/* Coin */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400">Corner</span>
            <div className="flex gap-1">
              {CORNERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onCorner(value)}
                  className={`flex-1 py-1 rounded text-sm transition-colors ${corner === value ? "bg-zinc-600 text-zinc-100" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Slider label="Opacity" value={labelOpacity} min={0.05} max={1} step={0.05} onChange={onLabelOpacity} />
          <ColorPicker label="Color" value={labelColor} onChange={onLabelColor} />

          {/* Origine */}
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Origin</p>
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] text-zinc-400">Col</span>
              <select
                value={originCol}
                onChange={(e) => onOriginCol(Number(e.target.value))}
                className="bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1.5 border border-zinc-700 cursor-pointer"
              >
                {Array.from({ length: 26 }, (_, i) => (
                  <option key={i} value={i}>{COLS[i]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] text-zinc-400">Row</span>
              <input
                type="number" min={1} max={999} value={originRow}
                onChange={(e) => onOriginRow(Math.max(1, Number(e.target.value)))}
                className="bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1.5 border border-zinc-700 w-full tabular-nums"
              />
            </div>
            <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-1.5 rounded border border-zinc-700 mb-0">
              {COLS[originCol]}{originRow}
            </span>
          </div>
        </>}
      </>}
    </div>
  );
}

export default function Controls({ config, onChange, onExport, onRandomize }: Props) {
  const set = <K extends keyof TopoConfig>(key: K, value: TopoConfig[K]) =>
    onChange({ ...config, [key]: value });

  const isLines = config.renderMode === "lines";

  return (
    <aside className="flex flex-col gap-6 w-72 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-y-auto">
      <h2 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">Parameters</h2>

      {/* Mode switcher */}
      <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-xs font-medium">
        {(["lines", "papercut", "3d"] as RenderMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => set("renderMode", mode)}
            className={`flex-1 py-2 transition-colors capitalize ${
              config.renderMode === mode
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Terrain</p>
        {config.renderMode !== "3d" && <>
          <Slider label="Scale" value={config.scale} min={1} max={10} step={0.1} onChange={(v) => set("scale", v)} />
          <Slider label="Octaves" value={config.octaves} min={1} max={8} onChange={(v) => set("octaves", v)} />
          <Slider label="Layer count" value={config.lineCount} min={5} max={60} onChange={(v) => set("lineCount", v)} />
        </>}
        <Slider label="Seed" value={config.seed} min={0} max={9999} onChange={(v) => set("seed", v)} />
      </div>

      {isLines ? (
        <>
          <div className="flex flex-col gap-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Lines</p>
            <Slider label="Line width" value={config.lineWidth} min={0.5} max={4} step={0.1} onChange={(v) => set("lineWidth", v)} />
            <Slider label="Opacity" value={config.opacity} min={0.1} max={1} step={0.05} onChange={(v) => set("opacity", v)} />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Colors</p>
            <ColorPicker label="Background" value={config.bgColor} onChange={(v) => set("bgColor", v)} />
            <ColorPicker label="Lines" value={config.lineColor} onChange={(v) => set("lineColor", v)} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Index lines</p>
              <button
                onClick={() => set("indexInterval", config.indexInterval === 0 ? 5 : 0)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  config.indexInterval > 0 ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {config.indexInterval > 0 ? "ON" : "OFF"}
              </button>
            </div>
            {config.indexInterval > 0 && (
              <>
                <Slider label="Every N lines" value={config.indexInterval} min={2} max={10} onChange={(v) => set("indexInterval", v)} />
                <Slider label="Width" value={config.indexWidth} min={0.5} max={6} step={0.1} onChange={(v) => set("indexWidth", v)} />
                <Slider label="Opacity" value={config.indexOpacity} min={0.1} max={1} step={0.05} onChange={(v) => set("indexOpacity", v)} />
                <ColorPicker label="Color" value={config.indexColor} onChange={(v) => set("indexColor", v)} />
              </>
            )}
          </div>
        </>
      ) : config.renderMode === "papercut" ? (
        <div className="flex flex-col gap-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Papercut</p>
          <ColorPicker label="Background" value={config.paperBgColor} onChange={(v) => set("paperBgColor", v)} />
          <ColorPicker label="Layer color" value={config.paperLayerColor} onChange={(v) => set("paperLayerColor", v)} />
          <ColorPicker label="Shadow color" value={config.paperShadowColor} onChange={(v) => set("paperShadowColor", v)} />
          <Slider label="Shadow offset" value={config.paperShadowOffset} min={0} max={20} onChange={(v) => set("paperShadowOffset", v)} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">3D Terrain</p>
          <ColorPicker label="Background" value={config.terrainBgColor} onChange={(v) => set("terrainBgColor", v)} />
          <ColorPicker label="Line color" value={config.terrainLineColor} onChange={(v) => set("terrainLineColor", v)} />
          <ColorPicker label="Peak color" value={config.terrainHighColor} onChange={(v) => set("terrainHighColor", v)} />
          <Slider label="Scale" value={config.terrain3dScale} min={1} max={10} step={0.1} onChange={(v) => set("terrain3dScale", v)} />
          <Slider label="Octaves" value={config.terrain3dOctaves} min={1} max={8} onChange={(v) => set("terrain3dOctaves", v)} />
          <Slider label="Layer count" value={config.terrain3dLineCount} min={5} max={60} onChange={(v) => set("terrain3dLineCount", v)} />
          <Slider label="Altitude" value={config.terrainAltitude} min={0.1} max={3} step={0.1} onChange={(v) => set("terrainAltitude", v)} />
          <Slider label="Grid X" value={config.terrainGridX} min={40} max={200} onChange={(v) => set("terrainGridX", v)} />
          <Slider label="Grid Y" value={config.terrainGridY} min={30} max={150} onChange={(v) => set("terrainGridY", v)} />
        </div>
      )}

      {/* Grid section — séparé selon le mode */}
      {config.renderMode === "lines" ? (
        <GridSection
          enabled={config.linesGridEnabled}           onToggle={() => set("linesGridEnabled", !config.linesGridEnabled)}
          cells={config.linesGridCells}               onCells={(v: number) => set("linesGridCells", v)}
          lineWidth={config.linesGridLineWidth}       onLineWidth={(v: number) => set("linesGridLineWidth", v)}
          lineColor={config.linesGridLineColor}       onLineColor={(v: string) => set("linesGridLineColor", v)}
          lineOpacity={config.linesGridLineOpacity}   onLineOpacity={(v: number) => set("linesGridLineOpacity", v)}
          labels={config.linesGridLabels}             onLabels={() => set("linesGridLabels", !config.linesGridLabels)}
          labelColor={config.linesGridLabelColor}     onLabelColor={(v: string) => set("linesGridLabelColor", v)}
          labelOpacity={config.linesGridLabelOpacity} onLabelOpacity={(v: number) => set("linesGridLabelOpacity", v)}
          corner={config.linesGridLabelCorner}        onCorner={(v: Corner) => set("linesGridLabelCorner", v)}
          originCol={config.linesGridOriginCol}       onOriginCol={(v: number) => set("linesGridOriginCol", v)}
          originRow={config.linesGridOriginRow}       onOriginRow={(v: number) => set("linesGridOriginRow", v)}
        />
      ) : config.renderMode === "papercut" ? (
        <GridSection
          enabled={config.paperGridEnabled}           onToggle={() => set("paperGridEnabled", !config.paperGridEnabled)}
          cells={config.paperGridCells}               onCells={(v: number) => set("paperGridCells", v)}
          lineWidth={config.paperGridLineWidth}       onLineWidth={(v: number) => set("paperGridLineWidth", v)}
          lineColor={config.paperGridLineColor}       onLineColor={(v: string) => set("paperGridLineColor", v)}
          lineOpacity={config.paperGridLineOpacity}   onLineOpacity={(v: number) => set("paperGridLineOpacity", v)}
          labels={config.paperGridLabels}             onLabels={() => set("paperGridLabels", !config.paperGridLabels)}
          labelColor={config.paperGridLabelColor}     onLabelColor={(v: string) => set("paperGridLabelColor", v)}
          labelOpacity={config.paperGridLabelOpacity} onLabelOpacity={(v: number) => set("paperGridLabelOpacity", v)}
          corner={config.paperGridLabelCorner}        onCorner={(v: Corner) => set("paperGridLabelCorner", v)}
          originCol={config.paperGridOriginCol}       onOriginCol={(v: number) => set("paperGridOriginCol", v)}
          originRow={config.paperGridOriginRow}       onOriginRow={(v: number) => set("paperGridOriginRow", v)}
        />
      ) : (
        <GridSection
          enabled={config.grid3dEnabled}           onToggle={() => set("grid3dEnabled", !config.grid3dEnabled)}
          cells={config.grid3dCells}               onCells={(v: number) => set("grid3dCells", v)}
          lineWidth={1}                            onLineWidth={() => {}}
          lineColor={config.grid3dLineColor}       onLineColor={(v: string) => set("grid3dLineColor", v)}
          lineOpacity={0.2}                        onLineOpacity={() => {}}
          labels={config.grid3dLabels}             onLabels={() => set("grid3dLabels", !config.grid3dLabels)}
          labelColor={config.grid3dLabelColor}     onLabelColor={(v: string) => set("grid3dLabelColor", v)}
          labelOpacity={config.grid3dLabelOpacity} onLabelOpacity={(v: number) => set("grid3dLabelOpacity", v)}
          corner={config.grid3dLabelCorner}        onCorner={(v: Corner) => set("grid3dLabelCorner", v)}
          originCol={config.grid3dOriginCol}       onOriginCol={(v: number) => set("grid3dOriginCol", v)}
          originRow={config.grid3dOriginRow}       onOriginRow={(v: number) => set("grid3dOriginRow", v)}
          showLineOpacity={false}
        />
      )}

      <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-zinc-800">
        <button
          onClick={onRandomize}
          className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 transition-colors"
        >
          Randomize
        </button>
        <button
          onClick={onExport}
          className="w-full py-2 rounded-lg bg-white hover:bg-zinc-100 text-sm text-zinc-900 font-medium transition-colors"
        >
          Export PNG
        </button>
      </div>
    </aside>
  );
}
