"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PokemonSummary {
  id: number;
  slug: string;
  name: string;
  imageUrl: string;
  image?: string;
  types: string[];
}

interface SavedTeam {
  id: string;
  name: string;
  pokemon: PokemonSummary[];
}

interface WeaknessReport {
  type: string;
  count: number;
  severity: "danger" | "warning" | "minor";
}

interface ValidationResponse {
  valid: boolean;
  teamSize: number;
  duplicates: string[];
  invalidPokemon: string[];
  weaknesses: WeaknessReport[];
}

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

export default function TeamBuilder() {
  const [pokemonList, setPokemonList] = useState<PokemonSummary[]>([]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [searchTeamsQuery, setSearchTeamsQuery] = useState("");
  
  // Workstation state
  const [teamName, setTeamName] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<(PokemonSummary | null)[]>([
    null, null, null, null, null, null
  ]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [modalSearch, setModalSearch] = useState("");

  // Validation report state
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch full list of pokemon and saved teams
  useEffect(() => {
    async function initData() {
      try {
        const [pokemonRes, teamsRes] = await Promise.all([
          fetch("/api/pokemon"),
          fetch("/api/team-builder")
        ]);

        if (pokemonRes.ok) {
          const pData = await pokemonRes.json();
          setPokemonList(pData);
        }
        if (teamsRes.ok) {
          const tData = await teamsRes.json();
          setSavedTeams(tData);
        }
      } catch (error) {
        console.error("Failed to initialize team builder data:", error);
      }
    }
    initData();
  }, []);

  // Run validation whenever selected slots change
  useEffect(() => {
    const activePokemon = selectedSlots.filter((p): p is PokemonSummary => p !== null);
    
    if (activePokemon.length === 0) {
      setValidation(null);
      return;
    }

    async function runValidation() {
      setLoadingValidation(true);
      try {
        const res = await fetch("/api/team-builder/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team: activePokemon.map((p) => p.name)
          })
        });

        if (res.ok) {
          const report = await res.json();
          setValidation(report);
        }
      } catch (error) {
        console.error("Failed to run team validation:", error);
      } finally {
        setLoadingValidation(false);
      }
    }

    const timer = setTimeout(() => {
      runValidation();
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedSlots]);

  // Open selection modal for a specific slot
  const openSelectionModal = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    setModalSearch("");
    setIsModalOpen(true);
  };

  // Add pokemon to the active slot
  const handleSelectPokemon = (pokemon: PokemonSummary) => {
    if (activeSlot === null) return;
    
    // Check if duplicate is selected
    const isDuplicate = selectedSlots.some(
      (slot, idx) => idx !== activeSlot && slot?.name.toLowerCase() === pokemon.name.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMsg("Duplicate Pokemon are not allowed on the same team");
      setIsModalOpen(false);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const updated = [...selectedSlots];
    updated[activeSlot] = pokemon;
    setSelectedSlots(updated);
    setIsModalOpen(false);
    setActiveSlot(null);
  };

  // Remove pokemon from slot
  const handleRemoveSlot = (index: number) => {
    const updated = [...selectedSlots];
    updated[index] = null;
    setSelectedSlots(updated);
  };

  // Clear workspace back to empty default
  const handleResetWorkspace = () => {
    setTeamName("");
    setSelectedSlots([null, null, null, null, null, null]);
    setEditingTeamId(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Save/Update team submission handler
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = teamName.trim();
    if (!name) {
      setErrorMsg("Please enter a team name");
      return;
    }

    const members = selectedSlots.filter((p): p is PokemonSummary => p !== null);
    if (members.length === 0) {
      setErrorMsg("Team must contain at least 1 Pokemon");
      return;
    }

    try {
      const url = editingTeamId ? `/api/team-builder/${editingTeamId}` : "/api/team-builder";
      const method = editingTeamId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          pokemon: members.map((m) => m.name)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save team");
      }

      setSuccessMsg(editingTeamId ? "Team updated successfully" : "Team created successfully");
      handleResetWorkspace();
      
      // Refresh saved teams list
      const listRes = await fetch("/api/team-builder");
      if (listRes.ok) {
        const listData = await listRes.json();
        setSavedTeams(listData);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  };

  // Edit saved team (load into workspace)
  const handleEditTeam = (team: SavedTeam) => {
    setTeamName(team.name);
    setEditingTeamId(team.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Map saved pokemon to workspaces slots (pad with nulls to size of 6)
    const newSlots = [...selectedSlots];
    for (let i = 0; i < 6; i++) {
      newSlots[i] = team.pokemon[i] || null;
    }
    setSelectedSlots(newSlots);

    // Scroll user back to workstation editing area
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete saved team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      const res = await fetch(`/api/team-builder/${teamId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete team");
      }

      // If currently editing this team, reset workspace
      if (editingTeamId === teamId) {
        handleResetWorkspace();
      }

      setSuccessMsg("Team deleted successfully");
      setTimeout(() => setSuccessMsg(null), 3000);

      // Refresh saved teams list
      setSavedTeams(savedTeams.filter((t) => t.id !== teamId));
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  };

  // Filter saved teams based on query
  const filteredTeams = savedTeams.filter((team) => {
    const q = searchTeamsQuery.toLowerCase().trim();
    if (!q) return true;
    
    const matchesName = team.name.toLowerCase().includes(q);
    const matchesPokemon = team.pokemon.some((p) => p.name.toLowerCase().includes(q));
    return matchesName || matchesPokemon;
  });

  // Filter selection modal pokemon list
  const filteredModalPokemon = pokemonList.filter((p) => {
    const q = modalSearch.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || String(p.id) === q;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-red-600 border-b-4 border-red-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center hover:scale-105 transition-transform shadow-inner">
              <div className="w-7 h-7 bg-blue-500 rounded-full shadow-md"></div>
            </Link>
            <h1 className="text-xl font-bold uppercase tracking-wide text-white">Team Builder</h1>
          </div>
          <Link href="/" className="text-xs font-mono uppercase bg-red-700 hover:bg-red-800 border border-red-800 px-3 py-1.5 rounded text-white font-bold transition-colors">
            Back to Hub
          </Link>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Area (Workspace Editor & Weakness analysis): Columns 1-8 */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Workspace Editor */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h2 className="text-lg font-bold uppercase text-white tracking-wider">
                {editingTeamId ? "Edit Saved Team" : "Create New Team"}
              </h2>
              {editingTeamId && (
                <button
                  onClick={handleResetWorkspace}
                  className="text-xs bg-slate-700 hover:bg-slate-650 text-slate-300 border border-slate-600 px-2 py-1 rounded transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTeam} className="flex flex-col gap-6">
              {/* Name Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-bold uppercase text-slate-400">Team name</label>
                <input
                  type="text"
                  placeholder="Enter custom team name (e.g. Kanto Champions)..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Members Slots Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-bold uppercase text-slate-400">Team members (maximum 6)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {selectedSlots.map((pokemon, idx) => (
                    <div
                      key={idx}
                      className={`h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center relative p-3 transition-all ${
                        pokemon
                          ? "bg-slate-900 border-slate-750"
                          : "border-slate-700 bg-slate-950/45 hover:bg-slate-950/75 hover:border-slate-550 cursor-pointer"
                      }`}
                      onClick={() => !pokemon && openSelectionModal(idx)}
                    >
                      {pokemon ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSlot(idx);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center text-xs shadow-md border border-red-750 z-10"
                          >
                            ×
                          </button>
                          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded p-1 flex items-center justify-center shadow-inner">
                            <img src={pokemon.imageUrl} alt={pokemon.name} className="max-h-full max-w-full object-contain" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 mt-2 font-bold">
                            #{String(pokemon.id).padStart(3, "0")}
                          </span>
                          <h4 className="font-bold text-white text-xs text-center truncate w-full mt-0.5 uppercase tracking-wide">
                            {pokemon.name}
                          </h4>
                          <div className="flex gap-1 mt-1 overflow-hidden">
                            {pokemon.types.map((t) => (
                              <span
                                key={t}
                                className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                                  TYPE_COLORS[t.toLowerCase()] || "bg-slate-500"
                                }`}
                              >
                                {t.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-3xl text-slate-600 font-light">+</span>
                          <span className="text-[10px] font-mono uppercase text-slate-500">Slot {idx + 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-col gap-3 pt-2">
                {errorMsg && (
                  <div className="bg-red-900/30 border border-red-500 text-red-200 text-xs p-3 rounded font-mono">
                    ERROR: {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-green-900/30 border border-green-500 text-green-200 text-xs p-3 rounded font-mono">
                    SUCCESS: {successMsg}
                  </div>
                )}

                <div className="flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetWorkspace}
                    className="bg-slate-950 border border-slate-700 hover:bg-slate-900 rounded px-5 py-2.5 text-xs font-mono uppercase text-slate-400 transition-colors"
                  >
                    Clear Workspace
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 cursor-pointer border border-red-700 rounded px-6 py-2.5 font-bold uppercase text-xs tracking-wider transition-colors shadow-md text-white"
                  >
                    {editingTeamId ? "Update Team" : "Save Team"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Dynamic Weakness Report panel */}
          {validation && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col gap-4">
              <div className="border-b border-slate-700 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Team Weakness Analysis
                  </h3>
                </div>
                {loadingValidation && (
                  <span className="text-[10px] font-mono text-red-400 uppercase animate-pulse">Recalculating...</span>
                )}
              </div>

              {/* Type Weaknesses Grid */}
              <div>

                {validation.weaknesses.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-mono">
                    NO WEAKNESS ANALYSIS AVAILABLE. FILL SLOTS TO COMPUTE.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {validation.weaknesses.map((w) => {
                      const capitalized = w.type.charAt(0).toUpperCase() + w.type.slice(1);
                      const typeColor = TYPE_COLORS[w.type.toLowerCase()] || "bg-slate-500 text-white";
                      
                      // Map severity to border and background colors
                      let severityBadge = "";
                      let borderClass = "";
                      if (w.severity === "danger") {
                        severityBadge = "bg-red-950 text-red-200 border-red-800";
                        borderClass = "border-red-900 bg-red-950/20";
                      } else if (w.severity === "warning") {
                        severityBadge = "bg-yellow-950 text-yellow-200 border-yellow-800";
                        borderClass = "border-yellow-900 bg-yellow-950/20";
                      } else {
                        severityBadge = "bg-slate-900 text-slate-400 border-slate-800";
                        borderClass = "border-slate-800 bg-slate-900/40";
                      }

                      return (
                        <div
                          key={w.type}
                          className={`flex items-center justify-between p-3 rounded-lg border text-xs ${borderClass}`}
                        >
                          <span className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${typeColor}`}>
                            {capitalized}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono ${severityBadge}`}>
                            {w.count} members weak
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700 mt-2 pt-3 text-[10px] font-mono text-slate-500 leading-normal">
                NOTE: Danger severity triggers when 3 or more members are weak to a type. Warning severity triggers when 2 members are weak. Review team compositions to minimize shared vulnerabilities.
              </div>
            </div>
          )}
        </div>

        {/* Right Area (Saved Teams List panel): Columns 9-12 */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 flex flex-col gap-4 h-[calc(100vh-160px)] overflow-hidden">
            <div className="border-b border-slate-700 pb-3">
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Saved Team Nodes</h2>
            </div>

            {/* Teams search */}
            <input
              type="text"
              placeholder="Search saved teams..."
              value={searchTeamsQuery}
              onChange={(e) => setSearchTeamsQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {filteredTeams.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  {savedTeams.length === 0 ? "No saved teams found" : "No matching teams"}
                </div>
              ) : (
                filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-slate-900 border border-slate-750 p-3.5 rounded-lg flex flex-col gap-3 transition-colors hover:border-slate-600"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-white text-sm uppercase truncate flex-1 leading-snug">
                        {team.name}
                      </h4>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="text-[10px] font-mono text-blue-400 hover:text-blue-300 font-bold uppercase transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-slate-700 text-[10px]">|</span>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="text-[10px] font-mono text-red-500 hover:text-red-400 font-bold uppercase transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Member grid */}
                    <div className="grid grid-cols-6 gap-1 bg-slate-950/70 border border-slate-800 p-2 rounded-md">
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const m = team.pokemon[idx];
                        return (
                          <div
                            key={idx}
                            className="aspect-square bg-slate-900 border border-slate-800 rounded p-0.5 flex items-center justify-center shadow-inner relative group"
                            title={m ? m.name : "Empty"}
                          >
                            {m ? (
                              <img src={m.image || m.imageUrl} alt={m.name} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-[10px] text-slate-700 font-light">+</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-700 pt-2 flex justify-between text-[9px] font-mono text-slate-500 uppercase">
              <span>Saved records: {savedTeams.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pokemon Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-red-600 border-b border-red-750 px-5 py-4 flex items-center justify-between text-white">
              <h3 className="font-extrabold uppercase tracking-wide text-sm sm:text-base">
                Select Pokemon for Slot {activeSlot !== null ? activeSlot + 1 : ""}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setActiveSlot(null);
                }}
                className="text-white hover:text-slate-200 text-xl font-bold font-mono"
              >
                ×
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-4 border-b border-slate-700 bg-slate-850">
              <input
                type="text"
                placeholder="Search by name or national number..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredModalPokemon.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPokemon(p)}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-700/60 bg-slate-900 hover:bg-slate-750 hover:border-slate-550 cursor-pointer transition-all duration-200"
                >
                  <div className="w-11 h-11 bg-slate-950 border border-slate-800 rounded p-1 flex items-center justify-center shadow-inner">
                    <img src={p.imageUrl} alt={p.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono text-slate-500 block font-bold leading-none mb-0.5">
                      #{String(p.id).padStart(3, "0")}
                    </span>
                    <h4 className="font-bold text-white text-xs truncate uppercase tracking-wide">
                      {p.name}
                    </h4>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {p.types.map((t) => (
                      <span
                        key={t}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-center uppercase tracking-wide leading-none ${
                          TYPE_COLORS[t.toLowerCase()] || "bg-slate-500"
                        }`}
                      >
                        {t.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {filteredModalPokemon.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 font-mono text-xs">
                  No matching Pokémon detected in database.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 px-5 py-3 border-t border-slate-700 flex justify-between text-[10px] font-mono text-slate-500 uppercase">
              <span>National dex count: {pokemonList.length}</span>
              <span>Tap selection to confirm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}