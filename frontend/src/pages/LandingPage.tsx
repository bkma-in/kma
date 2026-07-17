import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  BookOpen,
  Users,
  BadgePercent,
  Info,
  Mail,
  Globe,
  Lock,
  CheckCircle2,
  Download,
  X,
  CreditCard,
  Loader2
} from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { cn } from '../utils/cn';
import GlobalFooter from '../components/GlobalFooter';
import EditorialBoardModal from '../components/EditorialBoardModal';
import PricingModal from '../components/PricingModal';
import { useAuth } from '../context/AuthContext';
import { getPublishedArticles, getPdfUrl } from '../services/article.service';

// --- Types ---
interface Article {
  id: string;
  tag: string;
  vol: string;
  title: string;
  author: string;
  date: string;
  abstract: string;
  fullContent?: string;
  pdfAvailable?: boolean;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isLoggedIn = !!currentUser;
  const handleDownloadPdf = async (articleId: string) => {
    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }
    try {
      const res = await getPdfUrl(articleId);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        alert('Failed to retrieve PDF link. Please ensure you have an active subscription for this issue.');
      }
    } catch (err: any) {
      alert('Download error: ' + (err.response?.data?.error || err.message || err));
    }
  };
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'paywall' | 'full'>('landing');
  const [purchasedArticles, setPurchasedArticles] = useState<string[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [isEditorialBoardOpen, setIsEditorialBoardOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const [articles, setArticles] = useState<Article[]>([]);
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Check purchases
    const purchases = JSON.parse(localStorage.getItem('purchased_articles') || '[]');
    setPurchasedArticles(purchases);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleReadFull = (article: Article) => {
    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }

    const hasPurchased = purchasedArticles.includes(article.id);
    setActiveArticle(article);

    if (hasPurchased) {
      setViewState('full');
    } else {
      setViewState('paywall');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const simulatePayment = () => {
    if (!activeArticle) return;
    setIsPaying(true);

    // Simulate payment gateway delay
    setTimeout(() => {
      const newPurchases = [...purchasedArticles, activeArticle.id];
      setPurchasedArticles(newPurchases);
      localStorage.setItem('purchased_articles', JSON.stringify(newPurchases));
      setIsPaying(false);
      setViewState('full');
    }, 2000);
  };



  // --- Render Components ---

  const PaywallScreen = ({ article }: { article: Article }) => (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setViewState('landing')}
          className="flex items-center gap-2 text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-widest mb-10 transition-colors"
        >
          <X size={14} /> Back to Archive
        </button>

        <div className="bg-zinc-50 rounded-[2.5rem] p-10 sm:p-16 border border-zinc-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                <Lock size={24} />
              </div>
              <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Premium Research Access</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-6 tracking-tighter leading-tight">{article.title}</h2>

            <div className="space-y-4 mb-12">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Executive Summary</h4>
              <p className="text-zinc-600 text-lg leading-relaxed italic border-l-4 border-zinc-200 pl-6 py-2">
                "{article.abstract}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2">Access Fee</p>
                <p className="text-3xl font-black text-black">₹499.00</p>
                <p className="text-xs text-zinc-500 mt-1">One-time payment for lifetime access</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex flex-col justify-center">
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2">Publication</p>
                <p className="text-sm font-bold text-black">BKMA Archive Vol. {article.vol}</p>
                <p className="text-xs text-zinc-500 mt-1">{article.date}</p>
              </div>
            </div>

            <button
              onClick={simulatePayment}
              disabled={isPaying}
              className="w-full py-5 bg-black text-white rounded-[1.25rem] font-bold text-sm tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-2xl shadow-black/20 active:scale-[0.98] flex items-center justify-center gap-4 disabled:bg-zinc-400"
            >
              {isPaying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  UNLOCK FULL ARTICLE
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-6">
              Secure payment via Razorpay / UPI
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const FullArticleView = ({ article }: { article: Article }) => (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 animate-in fade-in duration-1000">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => setViewState('landing')}
            className="flex items-center gap-2 text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-widest transition-colors"
          >
            <X size={14} /> Close Reader
          </button>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
              <CheckCircle2 size={12} /> Purchased
            </span>
            {article.pdfAvailable && (
              <button 
                onClick={() => handleDownloadPdf(article.id)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-black hover:text-white rounded-lg text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer"
              >
                <Download size={14} /> PDF
              </button>
            )}
          </div>
        </div>

        <header className="mb-16">
          <div className="flex gap-3 mb-6">
            <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{article.tag}</span>
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest pt-1">VOL. {article.vol}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-black mb-8 tracking-tighter leading-[1.1]">{article.title}</h1>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-black">{article.author}</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{article.date} • PEER REVIEWED</p>
            </div>
          </div>
        </header>

        <div className="prose prose-zinc max-w-none">
          <div className="bg-zinc-50 p-8 sm:p-12 rounded-[2.5rem] mb-16 border border-zinc-100">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Abstract</h3>
            <p className="text-xl text-zinc-800 leading-relaxed font-serif italic">
              {article.abstract}
            </p>
          </div>

          <div className="space-y-8 text-lg leading-relaxed text-zinc-700 font-serif">
            <h3 className="text-2xl font-bold text-black font-sans uppercase tracking-widest">1. Introduction</h3>
            <p>{article.fullContent}</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>

            <div className="py-12 flex justify-center">
              <div className="w-24 h-1 bg-zinc-100 rounded-full" />
            </div>

            <h3 className="text-2xl font-bold text-black font-sans uppercase tracking-widest">2. Methodology</h3>
            <p>The methodology employed in this study follows the standardized BKMA protocol for topological analysis. Data was collected over a 12-month period across multiple mathematical models.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (viewState === 'paywall' && activeArticle) return <PaywallScreen article={activeArticle} />;
  if (viewState === 'full' && activeArticle) return <FullArticleView article={activeArticle} />;

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
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-white border border-zinc-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4">
              <BookOpen size={48} className="text-zinc-300 animate-pulse" />
              <h3 className="text-lg font-bold text-black font-sans uppercase tracking-widest">No published articles available</h3>
              <p className="text-sm text-zinc-500 max-w-sm">There are no peer-reviewed articles published in the archives yet. Please check back later.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {articles.map((art, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                  <div className="flex gap-3 mb-6">
                    <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{art.tag}</span>
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest pt-1">VOL. {art.vol}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 leading-tight min-h-[4rem]">{art.title}</h3>
                  <p className="text-zinc-500 text-sm mb-8 leading-relaxed line-clamp-3">
                    {art.abstract}
                  </p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-6 pt-6 border-t border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                          <Users size={14} />
                        </div>
                        <span className="text-sm font-bold">{art.author}</span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400">{art.date}</span>
                    </div>

                    <button
                      onClick={() => handleReadFull(art)}
                      className={cn(
                        "w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 group",
                        purchasedArticles.includes(art.id)
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                          : "bg-black text-white hover:bg-zinc-800 shadow-lg shadow-black/10"
                      )}
                    >
                      {purchasedArticles.includes(art.id) ? (
                        <>READ FULL ARTICLE <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
                      ) : (
                        <>UNLOCK ARTICLE <Lock size={12} /></>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
