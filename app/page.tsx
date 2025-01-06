import TopoGenerator from "./components/TopoGenerator";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-950 text-zinc-50 min-h-screen">
      <header className="flex items-center px-6 py-4 border-b border-zinc-800">
        <h1 className="text-sm font-semibold tracking-widest uppercase text-zinc-400">
          Topographic Map Generator
        </h1>
      </header>
      <div className="flex flex-1">
        <TopoGenerator />
      </div>
    </main>
  );
}
