import React from 'react';
import { useState } from 'react';
import { 
  Bookmark, 
  Search, 
  ExternalLink, 
  Trash2, 
  Clock, 
  Users
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';

interface SavedArticle {
  id: string;
  tag: string;
  title: string;
  author: string;
  date: string;
  abstract: string;
  readTime: string;
}

const ReaderSavedArticles = () => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');

  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([
    {
      id: 'ART-001',
      tag: 'Topology',
      title: 'On the Homotopy Type of Certain Spaces',
      author: 'Dr. S. Raman',
      date: 'OCT 2023',
      readTime: '12 min read',
      abstract: 'An exploration of the properties of spaces derived from complex algebraic varieties and their fundamental groups.'
    },
    {
      id: 'ART-002',
      tag: 'Number Theory',
      title: 'Prime Distribution in Arithmetic Progressions',
      author: 'M. Nair',
      date: 'SEP 2023',
      readTime: '15 min read',
      abstract: 'A deep dive into the distribution patterns of prime numbers within specific arithmetic progression sequences.'
    },
    {
      id: 'ART-003',
      tag: 'Applied Math',
      title: 'Fluid Dynamics in Porous Media',
      author: 'A. K. Menon',
      date: 'JUN 2023',
      readTime: '20 min read',
      abstract: 'Investigating the flow of viscous fluids through porous materials using non-linear differential equations.'
    },
    {
      id: 'ART-004',
      tag: 'Biomathematics',
      title: 'Neural Networks in Modern Diagnostic Medicine',
      author: 'Dr. Sarah Jenkins',
      date: 'MAR 2023',
      readTime: '18 min read',
      abstract: 'A longitudinal study on the efficacy of CNNs in detecting early-stage retinal deterioration.'
    }
  ]);

  const removeArticle = (id: string) => {
    setSavedArticles(prev => prev.filter(art => art.id !== id));
    showToast('Article removed from saved', 'info');
  };

  const filteredArticles = savedArticles.filter(art => 
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    art.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight font-['Outfit']">Saved Articles</h1>
          <p className="text-zinc-500 mt-1">Access your bookmarked research papers and scholarly work.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text"
            placeholder="Search saved work..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black w-64 focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((art) => (
          <div key={art.id} className="bg-white border border-zinc-200 rounded-3xl p-8 group hover:border-black transition-all flex flex-col shadow-sm hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 bg-zinc-100 text-black rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                {art.tag}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                <Clock size={12} /> {art.readTime}
              </div>
            </div>

            <h3 className="text-xl font-bold text-black mb-4 group-hover:text-blue-600 transition-colors leading-tight font-['Outfit']">
              {art.title}
            </h3>
            
            <p className="text-sm text-zinc-500 leading-relaxed italic mb-8 line-clamp-2">
              "{art.abstract}"
            </p>

            <div className="mt-auto space-y-6">
              <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                    <Users size={14} />
                  </div>
                  <div className="text-[10px]">
                    <p className="font-bold text-black uppercase tracking-tight">{art.author}</p>
                    <p className="text-zinc-400">{art.date}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => removeArticle(art.id)}
                  className="p-3 bg-zinc-50 text-zinc-400 hover:text-rose-600 rounded-xl transition-all border border-zinc-100 shadow-sm"
                  title="Remove from saved"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <button className="w-full py-4 bg-black text-white hover:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                <ExternalLink size={16} /> Read Full Article
              </button>
            </div>
          </div>
        ))}
        
        {filteredArticles.length === 0 && (
          <div className="md:col-span-2 py-20 text-center bg-white rounded-3xl border border-zinc-200 border-dashed">
            <div className="flex flex-col items-center gap-4 opacity-10">
              <Bookmark size={48} className="text-black" />
              <p className="text-xs font-bold uppercase tracking-widest text-black">No articles found in your collection</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReaderSavedArticles;
