import React from 'react';
import { Megaphone, Search, Filter } from 'lucide-react';

interface CFPHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  topics: string[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
}

export const CFPHero: React.FC<CFPHeroProps> = ({
  searchQuery,
  onSearchChange,
  topics = [],
  selectedTopic,
  onSelectTopic
}) => {
  return (
    <div className="relative bg-black text-white rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden shadow-2xl mb-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-black to-zinc-950 opacity-90" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/15 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
          <Megaphone size={14} className="text-emerald-400" />
          <span>Call for Papers</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight font-['Outfit'] leading-tight">
          Bulletin of Kerala Mathematics Association
        </h1>

        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Invite original research contributions in Pure, Applied, Interdisciplinary Mathematics, and Mathematical Physics.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative pt-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, topic, or volume..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Topic Filters */}
        {topics.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              onClick={() => onSelectTopic('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                !selectedTopic ? 'bg-white text-black font-bold' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              All Topics
            </button>
            {topics.slice(0, 8).map(topic => (
              <button
                key={topic}
                onClick={() => onSelectTopic(selectedTopic === topic ? '' : topic)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedTopic === topic ? 'bg-white text-black font-bold' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
