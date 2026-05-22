import Link from "next/link";

// Pokedex-themed Dashboard
export default function Home() {
  const modules = [
    {
      title: "Pokédex Database",
      description: "Search, filter, and view detailed stats, height, weight, and categories for all 898 Pokémon.",
      href: "/pokedex",
      db: "MongoDB",
      color: "bg-red-500 hover:bg-red-600",
      accentColor: "border-red-600",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" strokeWidth="2" />
          <path d="M12 2v20M2 12h20" strokeWidth="2" />
        </svg>
      )
    },
    {
      title: "Evolution Graph",
      description: "See how Pokémon evolve.",
      href: "/evolution",
      db: "Neo4j",
      color: "bg-blue-500 hover:bg-blue-600",
      accentColor: "border-blue-600",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="5" r="3" strokeWidth="2" />
          <circle cx="6" cy="18" r="3" strokeWidth="2" />
          <circle cx="18" cy="18" r="3" strokeWidth="2" />
          <path d="M12 8L7.5 15M12 8l4.5 15" strokeWidth="2" />
        </svg>
      )
    },
    {
      title: "Type Effectiveness",
      description: "Check offensive and defensive type advantages, weaknesses, resistances, and immunities.",
      href: "/effectiveness",
      db: "Neo4j",
      color: "bg-amber-500 hover:bg-amber-600",
      accentColor: "border-amber-600",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "Team Builder",
      description: "Build teams of up to 6 Pokémon and evaluate combined type weaknesses.",
      href: "/team-builder",
      db: "Neo4j & MongoDB",
      color: "bg-emerald-500 hover:bg-emerald-600",
      accentColor: "border-emerald-600",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner / Pokedex Header Design */}
      <header className="bg-red-600 border-b-8 border-red-800 shadow-xl relative overflow-hidden">
        {/* Pokedex design components */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full translate-x-24 -translate-y-24 opacity-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Blinking blue camera eye */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 bg-slate-100 rounded-full animate-ping opacity-25"></div>
              <div className="w-14 h-14 bg-slate-100 rounded-full border-4 border-slate-300 flex items-center justify-center shadow-inner">
                <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-slate-200 bg-radial-gradient shadow-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full translate-x-1 -translate-y-1 opacity-80"></div>
                </div>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-extrabold tracking-wide text-white uppercase drop-shadow-md">
                Pokedex Data Network
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center">

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
          {modules.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="group bg-slate-800 border-2 border-slate-700 rounded-xl p-6 transition-all duration-300 hover:border-slate-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-slate-200">
                  {m.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {m.description}
                </p>
              </div>
              
              <div className="mt-6 flex items-center justify-between text-sm font-semibold tracking-wide text-slate-300 group-hover:text-white">
                <span>Access Terminal</span>
                <span className="transform translate-x-0 transition-transform duration-300 group-hover:translate-x-1.5 font-bold">
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
