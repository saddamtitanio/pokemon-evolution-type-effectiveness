"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PokemonSummary {
  id: number;
  slug: string;
  name: string;
  imageUrl: string;
  types: string[];
}

interface PokemonDetails {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  height: string;
  weight: string;
  gender: string[];
  imageUrl: string;
  types: string[];
  weaknesses: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
}

// Map Pokemon types to styling colors
export const TYPE_COLORS: Record<string, string> = {
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

export default function Pokedex() {
  const [pokemonList, setPokemonList] = useState<PokemonSummary[]>([]);
  const [filteredList, setFilteredList] = useState<PokemonSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch complete pokemon list on mount
  useEffect(() => {
    async function fetchList() {
      try {
        const res = await fetch("/api/pokemon");
        if (!res.ok) throw new Error("Failed to fetch Pokemon list");
        const data = await res.json();
        setPokemonList(data);
        setFilteredList(data);
        
        // Auto-select first pokemon if list is not empty
        if (data.length > 0) {
          setSelectedSlug(data[0].slug);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingList(false);
      }
    }
    fetchList();
  }, []);

  // Filter pokemon list on search changes
  useEffect(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      setFilteredList(pokemonList);
      return;
    }

    const filtered = pokemonList.filter(
      (p) => p.name.toLowerCase().includes(query) || p.id.toString() === query
    );
    setFilteredList(filtered);
  }, [search, pokemonList]);

  // Fetch details when selected pokemon changes
  useEffect(() => {
    if (!selectedSlug) return;

    async function fetchDetails() {
      setLoadingDetails(true);
      try {
        const res = await fetch(`/api/pokemon/${selectedSlug}`);
        if (!res.ok) throw new Error("Failed to fetch details");
        const data = await res.json();
        setDetails(data);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchDetails();
  }, [selectedSlug]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-red-600 border-b-4 border-red-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center hover:scale-105 transition-transform shadow-inner">
              <div className="w-7 h-7 bg-blue-500 rounded-full shadow-md"></div>
            </Link>
            <h1 className="text-xl font-bold uppercase tracking-wide text-white">Pokédex Archives</h1>
          </div>
          <Link href="/" className="text-xs font-mono uppercase bg-red-700 hover:bg-red-800 border border-red-800 px-3 py-1.5 rounded text-white font-bold transition-colors">
            Back to Hub
          </Link>
        </div>
      </header>

      {/* Main Workspace split panel */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left Side: Search & Scrolling List */}
        <div className="w-full md:w-5/12 lg:w-4/12 flex flex-col gap-4 bg-slate-800 border border-slate-700 p-4 rounded-lg h-[calc(100vh-160px)]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or number..."
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

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 text-xs p-3 rounded">
              {error}
            </div>
          )}

          {loadingList ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
              {filteredList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No Pokémon matches found.</div>
              ) : (
                filteredList.map((p) => {
                  const isSelected = p.slug === selectedSlug;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedSlug(p.slug)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-slate-750 border-red-500/80 shadow-md"
                          : "bg-slate-900 border-slate-750 hover:bg-slate-750 hover:border-slate-600"
                      }`}
                    >
                      <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-md p-1 flex items-center justify-center">
                        <img src={p.imageUrl} alt={p.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-mono text-slate-500 font-semibold">
                          #{String(p.id).padStart(3, "0")}
                        </span>
                        <h3 className="font-bold text-white leading-tight text-sm md:text-base">{p.name}</h3>
                      </div>
                      <div className="flex flex-col gap-1">
                        {p.types.map((type) => {
                          const typeLower = type.toLowerCase();
                          return (
                            <span
                              key={type}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded text-center uppercase tracking-wider ${
                                TYPE_COLORS[typeLower] || "bg-slate-500 text-white"
                              }`}
                            >
                              {type}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Side: Scan details Screen */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col justify-between h-[calc(100vh-160px)] overflow-y-auto">
          {loadingDetails ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : details ? (
            <div className="flex flex-col gap-6">
              {/* Header and Basic info */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start border-b border-slate-700 pb-6">
                {/* Large Screen Frame */}
                <div className="w-44 h-44 bg-slate-950 border-4 border-slate-750 rounded-lg p-3 flex items-center justify-center relative shadow-inner">
                  <div className="absolute top-2 left-2 flex gap-1">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  </div>
                  <img src={details.imageUrl} alt={details.name} className="max-h-full max-w-full object-contain" />
                </div>
                
                {/* Text details */}
                <div className="flex-1 flex flex-col gap-3 text-center sm:text-left">
                  <div>
                    <span className="text-sm font-mono text-slate-500 font-bold">
                      INDEX #{String(details.id).padStart(3, "0")}
                    </span>
                    <h2 className="text-3xl font-extrabold text-white leading-tight uppercase tracking-wide">
                      {details.name}
                    </h2>
                    <p className="text-slate-400 text-xs font-semibold italic uppercase mt-1">
                      {details.category}
                    </p>
                  </div>

                  {/* Types list */}
                  <div className="flex gap-2 justify-center sm:justify-start">
                    {details.types.map((type) => {
                      const typeLower = type.toLowerCase();
                      return (
                        <span
                          key={type}
                          className={`text-xs font-bold px-3 py-1 rounded uppercase tracking-wider ${
                            TYPE_COLORS[typeLower] || "bg-slate-500"
                          }`}
                        >
                          {type}
                        </span>
                      );
                    })}
                  </div>

                  {/* Height & Weight */}
                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto sm:mx-0 bg-slate-900 border border-slate-750 p-2.5 rounded text-xs font-mono text-center">
                    <div>
                      <span className="text-slate-500 block">HEIGHT</span>
                      <span className="text-white font-bold">{details.height}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">WEIGHT</span>
                      <span className="text-white font-bold">{details.weight}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid split: Stats and Weaknesses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats Panel */}
                <div className="bg-slate-900 border border-slate-750 p-4 rounded-lg flex flex-col gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-750 pb-2 text-slate-300">
                    Base Performance Stats
                  </h3>
                  
                  <div className="flex flex-col gap-2.5 text-xs">
                    {/* HP stat */}
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>HP</span>
                        <span className="font-bold text-white">{details.stats.hp}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (details.stats.hp / 255) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Attack stat */}
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>ATTACK</span>
                        <span className="font-bold text-white">{details.stats.attack}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (details.stats.attack / 190) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Defense stat */}
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>DEFENSE</span>
                        <span className="font-bold text-white">{details.stats.defense}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (details.stats.defense / 230) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Sp Atk stat */}
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>SP. ATTACK</span>
                        <span className="font-bold text-white">{details.stats.special_attack}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (details.stats.special_attack / 194) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Sp Def stat */}
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>SP. DEFENSE</span>
                        <span className="font-bold text-white">{details.stats.special_defense}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (details.stats.special_defense / 230) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Speed stat */}
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>SPEED</span>
                        <span className="font-bold text-white">{details.stats.speed}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div
                          className="bg-pink-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (details.stats.speed / 180) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weaknesses and Description Panel */}
                <div className="flex flex-col gap-6">
                  {/* Description Box */}
                  <div className="bg-slate-900 border border-slate-750 p-4 rounded-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-750 pb-2 text-slate-300 mb-2">
                      Database Description
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-mono">
                      {details.description}
                    </p>
                  </div>

                  {/* Weaknesses Box */}
                  <div className="bg-slate-900 border border-slate-750 p-4 rounded-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-750 pb-2 text-slate-300 mb-3">
                      Defensive Vulnerabilities (Take 2x+ Damage)
                    </h3>
                    {details.weaknesses.length === 0 ? (
                      <p className="text-slate-500 text-xs">No specific defensive weaknesses detected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {details.weaknesses.map((weakness) => {
                          const wLower = weakness.toLowerCase();
                          return (
                            <span
                              key={weakness}
                              className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                TYPE_COLORS[wLower] || "bg-slate-700 text-white"
                              }`}
                            >
                              {weakness}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-center gap-2">
              <svg className="w-12 h-12 text-slate-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Scan Database to View Pokémon Details</span>
            </div>
          )}

          <div className="border-t border-slate-700 mt-6 pt-3 flex justify-between text-[10px] font-mono text-slate-500">
          </div>
        </div>
      </div>
    </div>
  );
}