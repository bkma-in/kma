import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getPublishedArticles } from '../../services/article.service';
import { getIssueDetailsString, parseMonthYear } from '../LandingPage';
import ArticlePreviewModal from '../../components/ArticlePreviewModal';
import AuthorDetailsModal from '../../components/AuthorDetailsModal';
import { SkeletonArticleCard } from '../../components/skeletons/SkeletonArticleCard';

const AdminPublishedArticles: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewArticle, setPreviewArticle] = useState<any | null>(null);

  // Author details modal state
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [selectedLegacyAuthor, setSelectedLegacyAuthor] = useState<any>(null);
  const [activeArticleForAuthors, setActiveArticleForAuthors] = useState<any | null>(null);

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const res = await getPublishedArticles();
        if (res.success) {
          // Sort newest published first for new articles, and chronologically for legacy articles
          const sorted = [...(res.articles || [])].sort((a: any, b: any) => {
            if (a.isOld && b.isOld) {
              const timeA = parseMonthYear(a.monthYear);
              const timeB = parseMonthYear(b.monthYear);
              if (timeA !== timeB) {
                return timeB - timeA; // Descending order: latest first
              }
              return (a.title || '').localeCompare(b.title || '');
            }
            if (a.isOld) return 1;
            if (b.isOld) return -1;

            const getTime = (art: any): number => {
              const raw = art.publishedAt || art.date;
              if (!raw) return 0;
              if (typeof raw?.toDate === 'function') return raw.toDate().getTime();
              if (raw?._seconds) return raw._seconds * 1000;
              if (raw?.seconds) return raw.seconds * 1000;
              const d = new Date(raw);
              return isNaN(d.getTime()) ? 0 : d.getTime();
            };
            return getTime(b) - getTime(a);
          });
          setArticles(sorted);
        }
      } catch (err) {
        console.error('Failed to load published articles in Admin:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublished();
  }, []);

  const handleAuthorClick = (art: any) => {
    const authors = art.authors || [];
    if (authors.length === 0) {
      setSelectedAuthorId('admin_ingested');
      setSelectedLegacyAuthor({ name: art.author });
      setIsAuthorModalOpen(true);
    } else if (authors.length === 1) {
      const auth = authors[0];
      setSelectedAuthorId(auth.userId || '');
      setSelectedLegacyAuthor(auth);
      setIsAuthorModalOpen(true);
    } else {
      setActiveArticleForAuthors(art);
    }
  };

  const handlePreviewAuthorClick = (author: any) => {
    setSelectedAuthorId(author.userId || '');
    setSelectedLegacyAuthor(author);
    setIsAuthorModalOpen(true);
  };

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const queryStr = searchQuery.trim().toLowerCase();
    return articles.filter((art) => {
      const kwStr = typeof art.keywords === 'string'
        ? art.keywords
        : Array.isArray(art.keywords)
          ? art.keywords.join(', ')
          : '';
      return (
        (art.title || '').toLowerCase().includes(queryStr) ||
        (art.abstract || '').toLowerCase().includes(queryStr) ||
        (art.author || '').toLowerCase().includes(queryStr) ||
        (art.authors || []).some((au: any) => (au.name || '').toLowerCase().includes(queryStr)) ||
        kwStr.toLowerCase().includes(queryStr) ||
        (art.tag || '').toLowerCase().includes(queryStr) ||
        (art.monthYear || '').toLowerCase().includes(queryStr) ||
        (art.id || '').toLowerCase().includes(queryStr)
      );
    });
  }, [articles, searchQuery]);

  const stats = useMemo(() => {
    const total = articles.length;
    const legacyCount = articles.filter(a => a.isOld).length;
    const recentCount = total - legacyCount;

    return [
      { label: 'Published Papers', value: total.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Recent Submissions', value: recentCount.toString(), icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Legacy Archives', value: legacyCount.toString(), icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' }
    ];
  }, [articles]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="h-8 skeleton-box rounded w-48" />
            <div className="h-4 skeleton-box rounded w-64" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 skeleton-box rounded-xl w-64" />
          </div>
        </div>
        <SkeletonArticleCard count={6} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">Public Record</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Published Articles</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-xl leading-relaxed">
            Inspect all peer-reviewed published manuscripts and historical archive entries in the BKMA journal.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search published articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-64 md:w-80 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-zinc-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner", stat.bg)}>
              <stat.icon size={22} className={stat.color} />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between gap-6 mb-8 border-b border-zinc-100 pb-6">
          <h2 className="text-xl font-bold text-black font-['Outfit'] flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            All Published Manuscripts
          </h2>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'} Found
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
            {searchQuery.trim() ? (
              <>
                <Search size={40} className="text-zinc-300 animate-pulse" />
                <h3 className="text-lg font-bold text-black uppercase tracking-widest font-['Outfit']">No matching articles</h3>
                <p className="text-sm text-zinc-500 max-w-sm">No published articles matched "{searchQuery}". Try searching with different keywords.</p>
              </>
            ) : (
              <>
                <AlertCircle size={40} className="text-amber-500 animate-pulse" />
                <h3 className="text-lg font-bold text-black uppercase tracking-widest font-['Outfit']">No published articles yet</h3>
                <p className="text-sm text-zinc-500 max-w-sm">There are no articles published in the journal system yet.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => setPreviewArticle(art)}
                className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {art.isOld ? (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Legacy Archive
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Published
                    </span>
                  )}
                  <span className="text-zinc-500 text-[11px] font-semibold">
                    {getIssueDetailsString(art)}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-4 leading-tight min-h-[3.5rem] group-hover:text-blue-600 transition-colors font-['Outfit']">
                  {art.title}
                </h3>

                <p className="text-zinc-500 text-sm mb-8 leading-relaxed line-clamp-3 flex-1">
                  {art.abstract || 'No abstract preview available.'}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-5 pt-5 border-t border-zinc-100">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAuthorClick(art);
                      }}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer group/auth min-w-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0 group-hover/auth:bg-blue-50 group-hover/auth:text-blue-500 transition-colors">
                        <Users size={13} />
                      </div>
                      <span className="text-xs font-bold truncate group-hover/auth:underline">
                        {art.authors && art.authors.length > 0
                          ? art.authors.map((au: any) => au.name).join(', ')
                          : art.author || 'Author'}
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 bg-black text-white hover:bg-zinc-800 shadow-lg shadow-black/10">
                    VIEW ARTICLE <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article Preview Modal */}
      <ArticlePreviewModal
        article={previewArticle}
        onClose={() => setPreviewArticle(null)}
        isLoggedIn={true}
        onAuthorClick={handlePreviewAuthorClick}
      />

      {/* Multiple Authors Selection Modal */}
      {activeArticleForAuthors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-950 text-white rounded-[2rem] border border-zinc-800 p-8 w-full max-w-sm relative shadow-2xl">
            <button
              onClick={() => setActiveArticleForAuthors(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> Authors of this Paper
            </h3>
            <div className="space-y-3">
              {activeArticleForAuthors.authors.map((auth: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedAuthorId(auth.userId || '');
                    setSelectedLegacyAuthor(auth);
                    setActiveArticleForAuthors(null);
                    setIsAuthorModalOpen(true);
                  }}
                  className="w-full text-left p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800/80 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-bold group-hover:text-blue-400 transition-colors">{auth.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{auth.affiliation || 'Department of Mathematics'}</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Author Details Modal */}
      <AuthorDetailsModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        userId={selectedAuthorId}
        legacyAuthorData={selectedLegacyAuthor}
      />
    </div>
  );
};

export default AdminPublishedArticles;
