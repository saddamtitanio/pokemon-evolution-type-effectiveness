"use client";

import { useState } from "react";
import Link from "next/link";

// Color mapping for Pokemon types
const TYPE_COLORS: Record<string, string> = {
  normal: "bg-slate-400 border-slate-500 hover:bg-slate-500 text-white",
  fire: "bg-orange-500 border-orange-600 hover:bg-orange-600 text-white",
  water: "bg-blue-500 border-blue-600 hover:bg-blue-600 text-white",
  grass: "bg-emerald-500 border-emerald-600 hover:bg-emerald-600 text-white",
  electric: "bg-yellow-400 border-yellow-500 hover:bg-yellow-500 text-slate-900",
  ice: "bg-cyan-400 border-cyan-500 hover:bg-cyan-500 text-slate-900",
  fighting: "bg-red-600 border-red-755 hover:bg-red-700 text-white",
  poison: "bg-purple-500 border-purple-600 hover:bg-purple-600 text-white",
  ground: "bg-amber-600 border-amber-700 hover:bg-amber-700 text-white",
  flying: "bg-indigo-400 border-indigo-500 hover:bg-indigo-500 text-white",
  psychic: "bg-pink-500 border-pink-600 hover:bg-pink-600 text-white",
  bug: "bg-lime-500 border-lime-600 hover:bg-lime-600 text-slate-900",
  rock: "bg-yellow-700 border-yellow-800 hover:bg-yellow-800 text-white",
  ghost: "bg-indigo-700 border-indigo-800 hover:bg-indigo-800 text-white",
  dragon: "bg-violet-600 border-violet-700 hover:bg-violet-700 text-white",
  dark: "bg-slate-700 border-slate-800 hover:bg-slate-800 text-white",
  steel: "bg-zinc-500 border-zinc-600 hover:bg-zinc-600 text-white",
  fairy: "bg-rose-400 border-rose-500 hover:bg-rose-500 text-slate-900"
};

const TYPES_LIST = Object.keys(TYPE_COLORS);

export default function TypeEffectivenessSearch() {
  const [search, setSearch] = useState("");

  // Filter types based on query
  const filteredTypes = TYPES_LIST.filter((type) =>
    type.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-red-600 border-b-4 border-red-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center hover:scale-105 transition-transform shadow-inner">
              <div className="w-7 h-7 bg-blue-500 rounded-full shadow-md"></div>
            </Link>
            <h1 className="text-xl font-bold uppercase tracking-wide text-white">Type effectiveness</h1>
          </div>
          <Link href="/" className="text-xs font-mono uppercase bg-red-700 hover:bg-red-800 border border-red-800 px-3 py-1.5 rounded text-white font-bold transition-colors">
            Back to Hub
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        {/* Search bar and description */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold uppercase text-white tracking-wider">Select Type to Analyze</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Select a Pokémon type below to view its complete offensive damage multipliers against other types and defensive damage multipliers when receiving hits.
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="Search type (e.g. Fire, Water, Dragon)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Grid of types */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex-1 shadow-inner relative">
          <div className="absolute top-4 left-4 flex gap-1">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse delay-75"></div>
          </div>
          <span className="absolute top-4 right-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            18 elemental categories detected
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
            {filteredTypes.map((type) => {
              const capitalized = type.charAt(0).toUpperCase() + type.slice(1);
              return (
                <Link
                  key={type}
                  href={`/effectiveness/${type}`}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${TYPE_COLORS[type]}`}
                >
                  <span className="text-sm font-bold uppercase tracking-wider">{capitalized}</span>
                </Link>
              );
            })}

            {filteredTypes.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 font-mono text-sm">
                No matching Pokémon types found.
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 mt-8 pt-3 flex justify-between text-[10px] font-mono text-slate-500">
          </div>
        </div>
      </main>
    </div>
  );
}