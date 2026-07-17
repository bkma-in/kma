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
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSubscription } from '../../utils/SubscriptionContext';
import { getPublishedArticles, getPdfUrl } from '../../services/article.service';
import AuthorProfileModal from '../../components/AuthorProfileModal';
import { getPublishedArticles } from '../../services/article.service';
import AuthorDetailsModal from '../../components/AuthorDetailsModal';
import ArticlePreviewModal from '../../components/ArticlePreviewModal';
import { getIssueDetailsString } from '../LandingPage';

const ReaderDashboard = () => {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);

  const handleOpenAuthorProfile = (name: string, id?: string | null) => {
    setSelectedAuthor(name);
    setSelectedAuthorId(id || null);
    setIsAuthorModalOpen(true);
  const [previewArticle, setPreviewArticle] = useState<any | null>(null);

  // Author Details Modal states
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [selectedLegacyAuthor, setSelectedLegacyAuthor] = useState<any>(null);
  const [activeArticleForAuthors, setActiveArticleForAuthors] = useState<any | null>(null);

  const handleAuthorClick = (art: any) => {
    const authors = art.authors || [];
    if (authors.length === 0) {
      setSelectedAuthorId('admin_ingested');
      setSelectedLegacyAuthor({ name: art.author });
      setIsAuthorModalOpen(true);
    } else if (authors.length === 1) {
      const auth = authors[0];
      setSelectedAuthorId(auth.userId);
      setSelectedLegacyAuthor(auth);
      setIsAuthorModalOpen(true);
    } else {
      setActiveArticleForAuthors(art);
    }
  };

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

  const handlePreviewAuthorClick = (author: any) => {
    setPreviewArticle(null);
    setSelectedAuthorId(author.userId || 'admin_ingested');
    setSelectedLegacyAuthor(author);
    setIsAuthorModalOpen(true);
  };

  const stats = [
    { label: 'Published Papers', value: articles.length.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Saved Articles', value: isSubscribed ? '0' : '0', icon: Bookmark, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'BKMA Volume', value: 'Vol. 42', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Recent Reads', value: isSubscribed ? '0' : '0', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const filteredArticles = articles.filter(art => 
    art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        
        {/* Search and Filter Section in the Header */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Filter articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none w-full md:w-64 shadow-sm placeholder:text-zinc-400 transition-all focus:border-zinc-300"
            />
          </div>
          <button className="p-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors flex items-center justify-center shadow-sm">
            <Filter size={18} className="text-zinc-600" />
          </button>
          
          {!isSubscribed && (
            <button 
              onClick={() => navigate('/reader/get-subscription')}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all active:scale-95 shrink-0 animate-pulse"
            >
              <Zap size={14} className="fill-yellow-400 text-yellow-400" />
              Upgrade
            </button>
          )}
        </div>
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
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
            <AlertCircle size={40} className="text-amber-500 animate-pulse" />
            <h3 className="text-lg font-bold text-black font-sans uppercase tracking-widest">No published articles available</h3>
            <p className="text-sm text-zinc-500 max-w-sm">There are no peer-reviewed articles published in the archives yet. Please check back later.</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
            <Search size={40} className="text-zinc-300 animate-pulse" />
            <h3 className="text-lg font-bold text-black font-sans uppercase tracking-widest">No matching results</h3>
            <p className="text-sm text-zinc-500 max-w-sm">We couldn't find any articles matching your search criteria. Try checking your spelling or using different keywords.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((art) => (
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
                    <button 
                      onClick={() => handleOpenAuthorProfile(art.author, art.authorId)}
                      className="flex items-center gap-1.5 hover:text-black transition-colors focus:outline-none cursor-pointer"
                      title="View Author Profile"
                    >
                      <Users size={14} className="text-zinc-400" /> {art.author}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-zinc-400" /> {art.date}
        {(() => {
          const regularArticles = articles.filter(art => !(/obituary|tribute|in memoriam/i.test(art.title || '') || /obituary|tribute/i.test(art.tag || '')));
          return regularArticles.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
              <AlertCircle size={40} className="text-amber-500 animate-pulse" />
              <h3 className="text-lg font-bold text-black font-sans uppercase tracking-widest">No published articles available</h3>
              <p className="text-sm text-zinc-500 max-w-sm">There are no peer-reviewed articles published in the archives yet. Please check back later.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {regularArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setPreviewArticle(art)}
                    className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      {art.isOld && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">Legacy Edition</span>
                      )}
                      <span className="text-zinc-500 text-[11px] font-semibold">
                        {getIssueDetailsString(art)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-4 leading-tight min-h-[3.5rem] group-hover:text-zinc-700 transition-colors">{art.title}</h3>
                    <p className="text-zinc-500 text-sm mb-8 leading-relaxed line-clamp-3 flex-1">{art.abstract}</p>
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-5 pt-5 border-t border-zinc-100">
                        <div
                          onClick={(e) => { e.stopPropagation(); handleAuthorClick(art); }}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer group/auth min-w-0"
                        >
                          <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0 group-hover/auth:bg-blue-50 group-hover/auth:text-blue-500 transition-colors">
                            <Users size={13} />
                          </div>
                          <span className="text-xs font-bold truncate group-hover/auth:underline">
                            {art.authors && art.authors.length > 0 ? art.authors.map((au: any) => au.name).join(', ') : art.author}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 shrink-0 ml-2">{art.date}</span>
                      </div>
                      <button className="w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 bg-black text-white hover:bg-zinc-800 shadow-lg shadow-black/10">
                        VIEW ARTICLE <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {regularArticles.length > 0 && (
                <div className="mt-10 pt-8 border-t border-zinc-100 text-center">
                  <button className="text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-[0.2em] transition-all">
                    Load More Research Papers
                  </button>
                </div>
              )}
            </>
          );
        })()}

      </div>

      {/* Tributes Section */}
      {(() => {
        const tributeArticles = articles.filter(art => /obituary|tribute|in memoriam/i.test(art.title || '') || /obituary|tribute/i.test(art.tag || ''));
        if (tributeArticles.length === 0) return null;
        return (
          <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <h2 className="text-xl font-bold text-black font-['Outfit'] flex items-center gap-2">
                <BookOpen size={20} className="text-purple-500" />
                Tributes & Memorials
              </h2>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tributeArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setPreviewArticle(art)}
                  className="bg-purple-50/30 p-8 rounded-[2rem] border border-purple-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Tribute
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 leading-tight min-h-[3.5rem] group-hover:text-purple-900 transition-colors">{art.title}</h3>
                  <p className="text-zinc-500 text-sm mb-8 leading-relaxed line-clamp-3 flex-1">{art.abstract}</p>
                  <div className="mt-auto">
                    <button className="w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 bg-purple-900 text-white hover:bg-purple-800 shadow-lg shadow-purple-900/10">
                      KNOW MORE <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
                    setSelectedAuthorId(auth.userId);
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
        )}
      </div>

      <AuthorProfileModal 
        isOpen={isAuthorModalOpen} 
        onClose={() => setIsAuthorModalOpen(false)} 
        authorName={selectedAuthor || ''}
        authorId={selectedAuthorId}
        </div>
      )}

      <AuthorDetailsModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        userId={selectedAuthorId}
        legacyAuthorData={selectedLegacyAuthor}
      />
    </div>
  );
};

export default ReaderDashboard;
