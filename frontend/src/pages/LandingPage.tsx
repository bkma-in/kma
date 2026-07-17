import React, { useState, useEffect } from 'react';
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
import GlobalFooter from '../components/GlobalFooter';
import EditorialBoardModal from '../components/EditorialBoardModal';
import { SkeletonArticleCard } from '../components/skeletons/SkeletonArticleCard';
import PricingModal from '../components/PricingModal';
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
  const [isEditorialBoardOpen, setIsEditorialBoardOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const res = await getPublishedArticles();
        if (res.success) setArticles(res.articles);
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
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Advancing Pure <br /> & Applied <br /> Mathematics
              </h2>
              <p className="text-gray-400 mt-6 max-w-lg text-lg leading-relaxed">
                The Kerala Mathematical Association promotes advanced mathematical research and higher education through collaboration among scholars worldwide.
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-10 w-full sm:max-w-md shadow-xl lg:w-fit">
                <div className="flex items-start gap-4">
                  <div className="bg-zinc-800 p-2.5 rounded-lg shrink-0">
                    <Info className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide mb-1 flex items-center gap-2">
                      REVIEWER NOTICE
                    </h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">
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
      <section className="py-20 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12 border-b-2 border-zinc-200 pb-6">
            <h2 className="text-4xl font-bold tracking-tight">Published Articles</h2>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-zinc-600 transition-colors">
              View All Archive <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <SkeletonArticleCard count={3} />
          ) : (() => {
            const regularArticles = articles.filter(art => !(/obituary|tribute|in memoriam/i.test(art.title || '') || /obituary|tribute/i.test(art.tag || '')));
            return regularArticles.length === 0 ? (
              <div className="text-center py-20 bg-white border border-zinc-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4">
                <BookOpen size={48} className="text-zinc-300 animate-pulse" />
                <h3 className="text-lg font-bold text-black font-sans uppercase tracking-widest">No published articles available</h3>
                <p className="text-sm text-zinc-500 max-w-sm">There are no peer-reviewed articles published in the archives yet. Please check back later.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {regularArticles.map((art, i) => (
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
                <h2 className="text-4xl font-bold tracking-tight">Tributes & Memorials</h2>
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
      <footer className="bg-black text-white py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">

            {/* Column 1: Branding */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-xl shadow-white/5 overflow-hidden">
                  <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-['Playfair_Display'] font-black text-xl tracking-[-0.02em]"> Bulletin Of Kerala Mathematical Association</h1>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed max-w-sm">
                Advancing mathematical research and higher education through global collaboration and peer-reviewed scholarly excellence.
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-4">
                <Link 
                  to="/about-us"
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-md flex items-center justify-center"
                >
                  About Us
                </Link>
                <button className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-md">Author Guidelines</button>
                <button className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-md">Reviewer Guidelines</button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Policies</h4>
              <ul className="space-y-2.5">
                {['Publication', 'Copyright', 'Privacy Policy', 'Refund/Cancellation Policy'].map(link => (
                  <li key={link}>
                    {link === 'Refund/Cancellation Policy' ? (
                      <Link to="/refund-policy" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : link === 'Privacy Policy' ? (
                      <Link to="/privacy-policy" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : link === 'Copyright' ? (
                      <Link to="/copyright" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : (
                      <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">{link}</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Access</h4>
              <ul className="space-y-2.5">
                {['Pricing', 'Service Description', 'Editorial Board', 'Terms & Conditions'].map(link => (
                  <li key={link}>
                    {link === 'Terms & Conditions' ? (
                      <Link to="/terms" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : link === 'Pricing' ? (
                      <Link to="/pricing" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : link === 'Service Description' ? (
                      <Link to="/service-description" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (link === 'Editorial Board') setIsEditorialBoardOpen(true);
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                      >
                        {link}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Support */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Support</h4>
              <ul className="space-y-2.5">
                {['Contact Us', 'Help Center', 'Report Issue'].map(link => (
                  <li key={link}>
                    {link === 'Contact Us' ? (
                      <Link to="/contact-us" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : (
                      <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">{link}</button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-white/5 mt-4">
                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-zinc-600">24/7 Research Support</p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Global Footer Component */}
          <GlobalFooter showSocials={true} showTaglines={false} />
        </div>
      </footer>

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

      <EditorialBoardModal
        isOpen={isEditorialBoardOpen}
        onClose={() => setIsEditorialBoardOpen(false)}
      />
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
