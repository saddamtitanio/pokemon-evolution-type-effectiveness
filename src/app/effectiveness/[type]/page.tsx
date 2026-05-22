"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Type color classes matching the theme
const TYPE_COLORS: Record<string, string> = {
  normal: "bg-slate-400 text-white",
  fire: "bg-orange-500 text-white",
  water: "bg-blue-500 text-white",
  grass: "bg-emerald-500 text-white",
  electric: "bg-yellow-400 text-slate-900",
  ice: "bg-cyan-400 text-slate-900",
  fighting: "bg-red-600 text-white",
  poison: "bg-purple-500 text-white",
  ground: "bg-amber-600 text-white",
  flying: "bg-indigo-400 text-white",
  psychic: "bg-pink-500 text-white",
  bug: "bg-lime-500 text-slate-900",
  rock: "bg-yellow-700 text-white",
  ghost: "bg-indigo-700 text-white",
  dragon: "bg-violet-600 text-white",
  dark: "bg-slate-700 text-white",
  steel: "bg-zinc-500 text-white",
  fairy: "bg-rose-400 text-slate-900"
};

interface EffectivenessData {
  type: string;
  offense: {
    strongAgainst: string[];
    weakAgainst: string[];
    noEffectOn: string[];
  };
  defense: {
    weakTo: string[];
    resistedBy: string[];
    immuneTo: string[];
  };
}

export default function TypeEffectivenessDetail() {
  const params = useParams();
  const typeParam = typeof params?.type === "string" ? params.type : "";

  const [data, setData] = useState<EffectivenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch type effectiveness data from the API
  useEffect(() => {
    if (!typeParam) return;

    async function fetchEffectiveness() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/effectiveness/${typeParam.toLowerCase()}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch effectiveness data");
        }
        const result: EffectivenessData = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEffectiveness();
  }, [typeParam]);

  const typeName = typeParam.charAt(0).toUpperCase() + typeParam.slice(1);
  const typeColorClass = TYPE_COLORS[typeParam.toLowerCase()] || "bg-slate-500 text-white";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-red-600 border-b-4 border-red-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center hover:scale-105 transition-transform shadow-inner">
              <div className="w-7 h-7 bg-blue-500 rounded-full shadow-md"></div>
            </Link>
            <h1 className="text-xl font-bold uppercase tracking-wide text-white">Type Analyzer</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/effectiveness" className="text-xs font-mono uppercase bg-red-750 hover:bg-red-800 border border-red-800 px-3 py-1.5 rounded text-white font-bold transition-colors">
              All Types
            </Link>
            <Link href="/" className="text-xs font-mono uppercase bg-red-700 hover:bg-red-800 border border-red-800 px-3 py-1.5 rounded text-white font-bold transition-colors">
              Hub
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-mono text-slate-400 uppercase tracking-wider animate-pulse">Running Graph query...</span>
          </div>
        ) : error ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center max-w-md mx-auto flex flex-col gap-4">
            <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-white uppercase">Analysis Error</h3>
            <p className="text-slate-400 text-sm">{error}</p>
            <Link href="/effectiveness" className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-bold uppercase text-xs transition-colors self-center">
              Choose another Type
            </Link>
          </div>
        ) : data ? (
          <div className="flex flex-col gap-6">
            {/* Banner of Active Type */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Currently Inspecting Node</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xl font-bold px-4 py-1.5 rounded uppercase tracking-widest ${typeColorClass}`}>
                    {typeName}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-xs max-w-md text-center sm:text-right font-mono">
               Hover or click connected badges to traverse.
              </p>
            </div>

            {/* Split Offensive & Defensive panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Offensive Panel */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-6 shadow-md">
                <div className="border-b border-slate-700 pb-3">
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Offensive Matchups
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Multipliers applied when a <span className="text-slate-200 font-bold">{typeName}</span>-type attack hits other types.
                  </p>
                </div>

                {/* Super Effective */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-emerald-400 font-bold uppercase">Super Effective (2.0x)</span>
                    <span className="text-slate-500">{data.offense.strongAgainst.length} types</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-900 border border-slate-750 p-2.5 rounded">
                    {data.offense.strongAgainst.length === 0 ? (
                      <span className="text-slate-500 text-xs self-center">None</span>
                    ) : (
                      data.offense.strongAgainst.map((t) => (
                        <Link
                          key={t}
                          href={`/effectiveness/${t}`}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider hover:scale-105 transition-transform ${
                            TYPE_COLORS[t.toLowerCase()] || "bg-slate-500 text-white"
                          }`}
                        >
                          {t}
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Not Very Effective */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-orange-400 font-bold uppercase">Not Very Effective (0.5x)</span>
                    <span className="text-slate-500">{data.offense.weakAgainst.length} types</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-900 border border-slate-750 p-2.5 rounded">
                    {data.offense.weakAgainst.length === 0 ? (
                      <span className="text-slate-500 text-xs self-center">None</span>
                    ) : (
                      data.offense.weakAgainst.map((t) => (
                        <Link
                          key={t}
                          href={`/effectiveness/${t}`}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider hover:scale-105 transition-transform ${
                            TYPE_COLORS[t.toLowerCase()] || "bg-slate-500 text-white"
                          }`}
                        >
                          {t}
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* No Effect */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-red-500 font-bold uppercase">No Effect (0.0x)</span>
                    <span className="text-slate-500">{data.offense.noEffectOn.length} types</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-900 border border-slate-750 p-2.5 rounded">
                    {data.offense.noEffectOn.length === 0 ? (
                      <span className="text-slate-500 text-xs self-center font-mono">None</span>
                    ) : (
                      data.offense.noEffectOn.map((t) => (
                        <Link
                          key={t}
                          href={`/effectiveness/${t}`}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider hover:scale-105 transition-transform ${
                            TYPE_COLORS[t.toLowerCase()] || "bg-slate-500 text-white"
                          }`}
                        >
                          {t}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Defensive Panel */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-6 shadow-md">
                <div className="border-b border-slate-700 pb-3">
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Defensive Matchups
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Damage multipliers received when a <span className="text-slate-200 font-bold">{typeName}</span>-type Pokémon gets attacked.
                  </p>
                </div>

                {/* Weak To */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-red-400 font-bold uppercase">Weak To (Takes 2.0x Damage)</span>
                    <span className="text-slate-500">{data.defense.weakTo.length} types</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-900 border border-slate-750 p-2.5 rounded">
                    {data.defense.weakTo.length === 0 ? (
                      <span className="text-slate-500 text-xs self-center">None</span>
                    ) : (
                      data.defense.weakTo.map((t) => (
                        <Link
                          key={t}
                          href={`/effectiveness/${t}`}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider hover:scale-105 transition-transform ${
                            TYPE_COLORS[t.toLowerCase()] || "bg-slate-500 text-white"
                          }`}
                        >
                          {t}
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Resists */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-emerald-400 font-bold uppercase">Resists (Takes 0.5x Damage)</span>
                    <span className="text-slate-500">{data.defense.resistedBy.length} types</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-900 border border-slate-750 p-2.5 rounded">
                    {data.defense.resistedBy.length === 0 ? (
                      <span className="text-slate-500 text-xs self-center">None</span>
                    ) : (
                      data.defense.resistedBy.map((t) => (
                        <Link
                          key={t}
                          href={`/effectiveness/${t}`}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider hover:scale-105 transition-transform ${
                            TYPE_COLORS[t.toLowerCase()] || "bg-slate-500 text-white"
                          }`}
                        >
                          {t}
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Immune To */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-blue-400 font-bold uppercase">Immune To (Takes 0.0x Damage)</span>
                    <span className="text-slate-500">{data.defense.immuneTo.length} types</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] bg-slate-900 border border-slate-750 p-2.5 rounded">
                    {data.defense.immuneTo.length === 0 ? (
                      <span className="text-slate-500 text-xs self-center font-mono">None</span>
                    ) : (
                      data.defense.immuneTo.map((t) => (
                        <Link
                          key={t}
                          href={`/effectiveness/${t}`}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider hover:scale-105 transition-transform ${
                            TYPE_COLORS[t.toLowerCase()] || "bg-slate-500 text-white"
                          }`}
                        >
                          {t}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}