"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EvolutionNode {
  id: number;
  name: string;
  image: string;
  species: string;
  level?: number; // Calculated or assigned level
}

interface EvolutionEdge {
  from: number;
  to: number;
  level: number;
}

interface EvolutionData {
  pokemon: string;
  evolutionChain: {
    nodes: EvolutionNode[];
    edges: EvolutionEdge[];
  };
}

export default function Evolution() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("Bulbasaur");
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch evolution graph data
  useEffect(() => {
    if (!query) return;

    async function fetchEvolution() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/evolution/${query}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch evolution data");
        }
        const result: EvolutionData = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchEvolution();
  }, [query]);

  // Submit search query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setQuery(search.trim());
    }
  };

  // Group nodes by their evolution levels
  const getLevels = () => {
    if (!data) return [];

    const nodes = data.evolutionChain.nodes;
    const edges = data.evolutionChain.edges;

    // Map each node by ID for quick lookup
    const nodeMap = new Map<number, EvolutionNode>();
    nodes.forEach((n) => nodeMap.set(n.id, { ...n, level: 0 }));

    // Find nodes that have incoming edges
    const hasIncoming = new Set<number>();
    edges.forEach((e) => hasIncoming.add(e.to));

    // Nodes with no incoming edges are the base (Level 0)
    const baseNodes = nodes.filter((n) => !hasIncoming.has(n.id));

    // BFS/Queue to compute the depth of each node in the tree
    const queue: { id: number; level: number }[] = baseNodes.map((n) => ({ id: n.id, level: 0 }));
    const visited = new Set<number>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const mappedNode = nodeMap.get(current.id);
      if (mappedNode) {
        mappedNode.level = current.level;
      }

      // Find children connected from this node
      const children = edges.filter((e) => e.from === current.id);
      children.forEach((c) => {
        queue.push({ id: c.to, level: current.level + 1 });
      });
    }

    // Sort into arrays representing columns [Level 0, Level 1, Level 2...]
    const levelsMap: Record<number, EvolutionNode[]> = {};
    nodeMap.forEach((node) => {
      const lvl = node.level || 0;
      if (!levelsMap[lvl]) levelsMap[lvl] = [];
      levelsMap[lvl].push(node);
    });

    // Return sorted keys as columns
    return Object.keys(levelsMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((lvl) => levelsMap[lvl]);
  };

  const nodeColumns = getLevels();

  // Highlight selected Pokemon nodes
  const isSearchTarget = (name: string) => {
    return name.toLowerCase() === query.toLowerCase();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-red-600 border-b-4 border-red-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center hover:scale-105 transition-transform shadow-inner">
              <div className="w-7 h-7 bg-blue-500 rounded-full shadow-md"></div>
            </Link>
            <h1 className="text-xl font-bold uppercase tracking-wide text-white">Evolution Graph</h1>
          </div>
          <Link href="/" className="text-xs font-mono uppercase bg-red-700 hover:bg-red-800 border border-red-800 px-3 py-1.5 rounded text-white font-bold transition-colors">
            Back to Hub
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        {/* Search bar & Quick select */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter Pokémon name (e.g. Eevee, Ralts, Charmander)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2.5 text-slate-100 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 border border-red-700 rounded px-6 py-2.5 cursor-pointer font-bold uppercase text-xs tracking-wider transition-colors"
            >
              Analyze Chain
            </button>
          </form>

          {/* Quick links to interesting graphs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 uppercase font-bold tracking-wider mr-2">Quick Scans:</span>
            {["Eevee", "Ralts", "Charmander", "Pikachu", "Wurmple", "Tyrogue"].map((pName) => (
              <button
                key={pName}
                onClick={() => {
                  setSearch(pName);
                  setQuery(pName);
                }}
                className={`px-3 cursor-pointer py-1.5 rounded border transition-all font-semibold ${
                  query.toLowerCase() === pName.toLowerCase()
                    ? "bg-red-950 text-red-200 border-red-500"
                    : "bg-slate-900 border-slate-750 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* Display Graph Screen */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex-1 flex flex-col min-h-[450px] relative shadow-inner">
          <div className="absolute top-4 left-4 flex gap-1.5 z-10">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-150"></div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-mono text-slate-400 uppercase tracking-wider animate-pulse">Traversing evolution graph...</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-3">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-white uppercase">Scan Error</h3>
              <p className="text-slate-400 text-sm">{error}</p>
            </div>
          ) : data && nodeColumns.length > 0 ? (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 py-10">
              {nodeColumns.map((column, colIdx) => (
                <div key={colIdx} className="flex flex-col items-center gap-8 relative">
                  {/* Connect columns with arrows on desktop (rendered between columns) */}
                  {colIdx > 0 && (
                    <div className="hidden md:block absolute -left-9 top-1/2 -translate-y-1/2 text-slate-500 text-2xl font-bold">
                      ➔
                    </div>
                  )}

                  {/* Connect levels with arrows on mobile (rendered above column) */}
                  {colIdx > 0 && (
                    <div className="block md:hidden text-slate-500 text-2xl font-bold my-1">
                      ↓
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {column.map((node) => {
                      const isTarget = isSearchTarget(node.name);
                      return (
                        <div
                          key={node.id}
                          className={`flex items-center gap-4 bg-slate-900 border p-4 rounded-xl min-w-[210px] max-w-[240px] shadow-lg transition-transform hover:scale-105 ${
                            isTarget
                              ? "border-red-500 ring-2 ring-red-950"
                              : "border-slate-750"
                          }`}
                        >
                          <div className="w-14 h-14 bg-slate-950 border border-slate-800 p-1.5 rounded-lg flex items-center justify-center shadow-inner">
                            <img src={node.image} alt={node.name} className="max-h-full max-w-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono text-slate-500 block font-bold">
                              #{String(node.id).padStart(3, "0")}
                            </span>
                            <h4 className="font-bold text-white text-base truncate uppercase tracking-wide">
                              {node.name}
                            </h4>
                            <p className="text-slate-500 text-[10px] truncate leading-tight mt-0.5">
                              {node.species}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-center gap-2">
              <svg className="w-12 h-12 text-slate-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Scan Database to View Evolution Graphs</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}