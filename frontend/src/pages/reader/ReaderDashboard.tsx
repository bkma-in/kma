import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Zap, 
  ChevronRight, 
  Bookmark, 
  FileText,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSubscription } from '../../utils/SubscriptionContext';
import { getPublishedArticles, getPdfUrl } from '../../services/article.service';

const ReaderDashboard = () => {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const res = await getPublishedArticles();
        if (res.success) {
          setArticles(res.articles);
        }
      } catch (err) {
        console.error('Failed to load published articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublished();
  }, []);

  const handleReadFull = async (articleId: string) => {
    try {
      const res = await getPdfUrl(articleId);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        console.error('Failed to retrieve PDF link');
      }
    } catch (err) {
      console.error('Error downloading article:', err);
    }
  };

  const stats = [
    { label: 'Published Papers', value: articles.length.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Saved Articles', value: isSubscribed ? '0' : '0', icon: Bookmark, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'BKMA Volume', value: 'Vol. 42', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Recent Reads', value: isSubscribed ? '0' : '0', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loading Publications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight font-['Outfit']">Reader Dashboard</h1>
          <p className="text-zinc-500 mt-1">Explore the latest research in the BKMA scholarly archive.</p>
        </div>
        
        {!isSubscribed && (
          <button 
            onClick={() => navigate('/reader/get-subscription')}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all active:scale-95 animate-pulse"
          >
            <Zap size={16} className="fill-yellow-400 text-yellow-400" />
            Upgrade (Session Only)
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-zinc-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner", stat.bg)}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content: Article Browser */}
      <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <h2 className="text-xl font-bold text-black font-['Outfit'] flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-500" />
            Latest Publications
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Filter articles..."
                className="pl-11 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none w-full md:w-64"
              />
            </div>
            <button className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors">
              <Filter size={18} className="text-zinc-600" />
            </button>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
            <AlertCircle size={40} className="text-amber-500 animate-pulse" />
            <h3 className="text-lg font-bold text-black font-sans uppercase tracking-widest">No published articles available</h3>
            <p className="text-sm text-zinc-500 max-w-sm">There are no peer-reviewed articles published in the archives yet. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((art) => (
              <div 
                key={art.id}
                className="group p-6 bg-white border border-zinc-100 rounded-2xl hover:border-zinc-300 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                      {art.tag}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{art.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-black group-hover:text-blue-600 transition-colors leading-tight">
                    {art.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-zinc-400" /> {art.author}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-zinc-400" /> {art.date}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-4">
                  {isSubscribed ? (
                    <button 
                      onClick={() => handleReadFull(art.id)}
                      className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Read Full <ChevronRight size={14} />
                    </button>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <button className="px-5 py-2.5 bg-zinc-100 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-not-allowed">
                        Locked <ChevronRight size={14} />
                      </button>
                      <span className="text-[9px] font-bold text-zinc-400 italic">Upgrade Required</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {articles.length > 0 && (
          <div className="mt-10 pt-8 border-t border-zinc-100 text-center">
            <button className="text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-[0.2em] transition-all">
              Load More Research Papers
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReaderDashboard;
