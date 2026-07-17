import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  BookOpen,
  Users,
  BadgePercent,
  Info,
  Loader2
} from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { cn } from '../utils/cn';
import { SkeletonArticleCard } from '../components/skeletons/SkeletonArticleCard';
import PublicFooter from '../components/PublicFooter';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';
import { getPublishedArticles, getPdfUrl } from '../services/article.service';
import AuthorDetailsModal from '../components/AuthorDetailsModal';
import ArticlePreviewModal from '../components/ArticlePreviewModal';

// --- Types ---
interface Article {
  id: string;
  tag: string;
  vol: string;
  volume?: number;
  monthYear?: string;
  issueNumber?: number;
  issn?: string;
  title: string;
  author: string;
  authors?: any[];
  isOld?: boolean;
  date: string;
  abstract: string;
  fullContent?: string;
  pdfAvailable?: boolean;
}

export const getIssueDetailsString = (art: any) => {
  const parts = [];
  if (art.monthYear) {
    parts.push(art.monthYear);
  }
  const volVal = art.vol || art.volume;
  if (volVal) {
    const volText = `Vol. No. ${volVal}`;
    const issueText = art.issueNumber ? `, Issue No. ${art.issueNumber}` : '';
    const issnText = art.issn ? ` ISSN ${art.issn}` : '';
    parts.push(`${volText}${issueText}${issnText}`);
  } else if (art.issn) {
    parts.push(`ISSN ${art.issn}`);
  }
  return parts.join(' | ');
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isLoggedIn = !!currentUser;

  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const articlesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const res = await getPublishedArticles();
        if (res.success) {
          // Sort newest published first
          const sorted = [...(res.articles || [])].sort((a: any, b: any) => {
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
        console.error('Failed to load published articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublished();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [articles]);

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

  const handlePreviewAuthorClick = (author: any) => {
    setPreviewArticle(null);
    setSelectedAuthorId(author.userId || 'admin_ingested');
    setSelectedLegacyAuthor(author);
    setIsAuthorModalOpen(true);
  };

  // --- Render Components ---



  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white animate-in fade-in duration-700">
      {/* Navigation */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="bg-black text-white w-full overflow-hidden min-h-[85vh] flex items-center pt-24 pb-20 sm:pt-32 sm:pb-32">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">
            <div className="flex flex-col text-left">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Advancing Pure <br /> & Applied <br /> Mathematics
              </h2>
              <p className="text-gray-400 mt-4 sm:mt-6 max-w-lg text-sm sm:text-lg leading-relaxed">
                The Kerala Mathematical Association promotes advanced mathematical research and higher education through collaboration among scholars worldwide.
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-6 sm:mt-10 w-full sm:max-w-md shadow-xl lg:w-fit">
                <div className="flex items-start gap-4">
                  <div className="bg-zinc-800 p-2.5 rounded-lg shrink-0">
                    <Info className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide mb-1 flex items-center gap-2">
                      REVIEWER NOTICE
                    </h4>
                    <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
                      Reviewer accounts require admin approval. You will be able to log in only after your account has been approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full flex justify-center lg:justify-end">
              <div className="bg-white text-black rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md lg:max-w-lg space-y-6">
                <h3 className="text-3xl font-bold tracking-tight border-b border-zinc-100 pb-5">Membership Benefits</h3>
                <div className="space-y-6">
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
                      <BookOpen className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1.5">Scholarly Access</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">Access peer-reviewed scholarly articles and research papers from leading global institutions.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="text-black" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1.5">Global Collaboration</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">Platform for authors and reviewers to collaborate on cutting-edge mathematical research.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                      <BadgePercent className="text-black" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1.5">Life Member Perks</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">50% subscription discount for life members on all premium publications.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Published Articles Section */}
      <section ref={articlesSectionRef} className="py-20 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 border-b-2 border-zinc-200 pb-6">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Published Articles</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonArticleCard count={3} />
          ) : (() => {
            const regularArticles = articles.filter(art => {
              const isTribute = /obituary|tribute|in memoriam/i.test(art.title || '') || /obituary|tribute/i.test(art.tag || '');
              if (isTribute) return false;
              if (!searchQuery.trim()) return true;
              const queryStr = searchQuery.toLowerCase();
              return (art.title || '').toLowerCase().includes(queryStr) || 
                     (art.abstract || '').toLowerCase().includes(queryStr) ||
                     (art.author || '').toLowerCase().includes(queryStr) ||
                     (art.authors || []).some((au: any) => (au.name || '').toLowerCase().includes(queryStr));
            });
            
            const totalPages = Math.ceil(regularArticles.length / 9);
            const activePage = Math.min(currentPage, Math.max(1, totalPages));
            const startIndex = (activePage - 1) * 9;
            const paginatedArticles = regularArticles.slice(startIndex, startIndex + 9);

            const handlePageChange = (page: number) => {
              setCurrentPage(page);
              articlesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            };

            const getPageNumbers = () => {
              const pages = [];
              const maxVisible = 5;
              if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                if (activePage <= 3) {
                  pages.push(1, 2, 3, 4, '...', totalPages);
                } else if (activePage >= totalPages - 2) {
                  pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages);
                }
              }
              return pages;
            };

            return regularArticles.length === 0 ? (
              <div className="text-center py-20 bg-white border border-zinc-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4">
                <BookOpen size={48} className="text-zinc-300 animate-pulse" />
                <h3 className="text-lg font-bold text-black font-sans uppercase tracking-widest">No published articles available</h3>
                <p className="text-sm text-zinc-500 max-w-sm">There are no peer-reviewed articles published in the archives yet. Please check back later.</p>
              </div>
            ) : (
              <>
                {/* Mobile horizontal scroll rows */}
                <div className="md:hidden space-y-8 overflow-hidden">
                  <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                    .no-scrollbar {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                  {(() => {
                    const chunkArticles = (arr: any[], size: number) => {
                      const chunks = [];
                      for (let i = 0; i < arr.length; i += size) {
                        chunks.push(arr.slice(i, i + size));
                      }
                      return chunks;
                    };
                    const rows = chunkArticles(paginatedArticles, 3);
                    return rows.map((rowArticles, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar scroll-smooth px-1"
                      >
                        {rowArticles.map((art, i) => (
                          <div
                            key={i}
                            onClick={() => setPreviewArticle(art)}
                            className="w-[280px] shrink-0 snap-start bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all flex flex-col cursor-pointer group"
                          >
                            {/* Issue info */}
                            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                              {art.isOld && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                                  Legacy Edition
                                </span>
                              )}
                              <span className="text-zinc-500 text-[10px] font-semibold">
                                {getIssueDetailsString(art)}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold mb-1.5 leading-snug line-clamp-2 group-hover:text-zinc-700 transition-colors">{art.title}</h3>
                            <p className="text-zinc-500 text-[11px] mb-4 leading-relaxed line-clamp-2">
                              {art.abstract}
                            </p>
                            <div className="mt-auto">
                              <div className="flex items-center justify-between mb-3.5 pt-3.5 border-t border-zinc-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                    <Users size={12} />
                                  </div>
                                  <span className="text-[11px] font-bold text-black truncate max-w-[140px]">
                                    {art.authors && art.authors.length > 0
                                      ? art.authors.map((au: any) => au.name).join(', ')
                                      : art.author}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold text-zinc-400">{art.date}</span>
                              </div>

                              <button
                                className="w-full py-2 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 bg-black text-white hover:bg-zinc-800 shadow-lg shadow-black/10"
                              >
                                VIEW ARTICLE <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>

                {/* Desktop/Tablet view */}
                <div className="hidden md:grid md:grid-cols-3 gap-8">
                  {paginatedArticles.map((art, i) => (
                    <div
                      key={i}
                      onClick={() => setPreviewArticle(art)}
                      className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col cursor-pointer group"
                    >
                      {/* Issue info */}
                      <div className="flex items-center gap-2 mb-5 flex-wrap">
                        {art.isOld && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Legacy Edition
                          </span>
                        )}
                        <span className="text-zinc-500 text-[11px] font-semibold">
                          {getIssueDetailsString(art)}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-4 leading-tight min-h-[4rem] group-hover:text-zinc-700 transition-colors">{art.title}</h3>
                      <p className="text-zinc-500 text-sm mb-8 leading-relaxed line-clamp-3">
                        {art.abstract}
                      </p>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-6 pt-6 border-t border-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                              <Users size={14} />
                            </div>
                            <span className="text-sm font-bold">
                              {art.authors && art.authors.length > 0
                                ? art.authors.map((au: any) => au.name).join(', ')
                                : art.author}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400">{art.date}</span>
                        </div>

                        <button
                          className="w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 bg-black text-white hover:bg-zinc-800 shadow-lg shadow-black/10"
                        >
                          VIEW ARTICLE <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 sm:gap-4 pt-12 mt-12 border-t border-zinc-200">
                    <button
                      onClick={() => handlePageChange(activePage - 1)}
                      disabled={activePage === 1}
                      className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black disabled:text-zinc-300 disabled:pointer-events-none transition-colors px-3 py-2 cursor-pointer"
                    >
                      ← Previous
                    </button>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getPageNumbers().map((page, idx) => {
                        if (page === '...') {
                          return (
                            <span key={idx} className="px-2 py-2 text-zinc-400 text-xs font-bold">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => handlePageChange(page as number)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                              activePage === page
                                ? 'bg-black text-white shadow-md'
                                : 'text-zinc-500 hover:bg-zinc-200/50 hover:text-black'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(activePage + 1)}
                      disabled={activePage === totalPages}
                      className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black disabled:text-zinc-300 disabled:pointer-events-none transition-colors px-3 py-2 cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* Tributes Section */}
      {(() => {
        const tributeArticles = articles.filter(art => /obituary|tribute|in memoriam/i.test(art.title || '') || /obituary|tribute/i.test(art.tag || ''));
        if (tributeArticles.length === 0) return null;
        return (
          <section className="py-20 px-6 bg-white border-b border-zinc-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-12 border-b-2 border-zinc-200 pb-6">
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Tributes & Memorials</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {tributeArticles.map((art, i) => (
                  <div
                    key={i}
                    onClick={() => setPreviewArticle(art)}
                    className="bg-purple-50/30 p-8 rounded-[2rem] border border-purple-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Tribute
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 leading-tight min-h-[4rem] group-hover:text-purple-900 transition-colors">{art.title}</h3>
                    <p className="text-zinc-500 text-sm mb-8 leading-relaxed line-clamp-3">
                      {art.abstract}
                    </p>
                    <div className="mt-auto">
                      <button
                        className="w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 bg-purple-900 text-white hover:bg-purple-800 shadow-lg shadow-purple-900/10"
                      >
                        KNOW MORE <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Footer */}
      <PublicFooter />

      {/* Article Preview Modal */}
      <ArticlePreviewModal
        article={previewArticle}
        onClose={() => setPreviewArticle(null)}
        isLoggedIn={isLoggedIn}
        onLoginRequired={() => { setPreviewArticle(null); navigate('/auth'); }}
        onAuthorClick={handlePreviewAuthorClick}
      />

      <AuthorDetailsModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        userId={selectedAuthorId}
        legacyAuthorData={selectedLegacyAuthor}
      />
    </div>
  );
};

export default LandingPage;
