import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, Award, CreditCard, Truck, Check, BookOpen, Star } from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';
import PublicFooter from '../components/PublicFooter';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isLoggedIn = !!currentUser;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/auth?mode=login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-black selection:bg-black selection:text-white animate-in fade-in duration-700 flex flex-col">
      <PublicHeader />

      {/* Main Content Area */}
      <main className="flex-1 pt-28 sm:pt-32 pb-20">
        
        {/* Hero Banner Section */}
        <section className="bg-black text-white py-8 sm:py-10 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl -ml-48 -mb-48" />
          
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-2.5">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Playfair_Display']">
              Subscription & Pricing
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold animate-pulse">
              Official subscription information for the Bulletin of Kerala Mathematical Association (BKMA).
            </p>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Subscription & Pricing</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16 space-y-12">
          
          {/* Centered Subscriptions Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            
            {/* Card 1: Annual Subscription */}
            <div className="bg-white rounded-[2rem] border-2 border-black shadow-xl shadow-zinc-200/40 p-8 sm:p-10 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-black text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                Featured Plan
              </div>
              
              <div>
                <div className="flex items-center gap-3.5 mb-8">
                  <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center text-white">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold font-['Outfit'] text-zinc-900">Annual Subscription</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Official BKMA Publication Access</p>
                  </div>
                </div>

                <div className="mb-8 border-y border-zinc-100 py-6">
                  <p className="text-4xl font-black text-black">₹2000 <span className="text-sm font-normal text-zinc-400">/ Per Year</span></p>
                  <p className="text-xs text-zinc-500 mt-2">All-inclusive pricing covering printing, handling, and shipping charges.</p>
                </div>

                <ul className="space-y-4">
                  {[
                    "Two Journal Issues per volume",
                    "Postage charges included",
                    "Handling charges included",
                    "Official BKMA Publication Access"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-zinc-600">
                      <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 2: Life Member Benefit */}
            <div className="bg-zinc-900 text-white rounded-[2rem] border border-zinc-800 shadow-xl p-8 sm:p-10 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-24 -mt-24" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3.5 mb-8">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/5">
                    <Award size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold font-['Outfit'] text-white">Life Member Benefit</h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Association Privilege</p>
                  </div>
                </div>

                <div className="mb-8 border-y border-white/5 py-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                    <Star size={10} className="fill-current" />
                    50% Discount for Life Members
                  </div>
                  <p className="text-4xl font-black text-white">50% Concession</p>
                  <p className="text-xs text-zinc-400 mt-2">Special discount rate on subscription charges together with applicable postal charges.</p>
                </div>

                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                  Life Members receive a 50% concession on subscription charges together with applicable postal charges, subject to BKMA membership policies.
                </p>
              </div>
            </div>

          </div>

          {/* Journal Recognition Section */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                <Star size={22} className="fill-current" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Journal Indexing & Recognition
              </h3>
            </div>
            
            <div className="space-y-4 text-zinc-600 text-sm sm:text-base leading-relaxed font-serif">
              <p>
                The <strong className="text-black">Bulletin of Kerala Mathematical Association (BKMA)</strong> is included in journal listings recognized by the <strong className="text-black">American Mathematical Society (AMS)</strong>.
              </p>
              <p>
                Research papers published in BKMA are reviewed and indexed through recognized mathematical indexing and abstracting resources, ensuring global visibility and peer citation credibility for authors' works.
              </p>
            </div>
          </div>

          {/* Details Section: Payment & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Payment Information Section */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <CreditCard size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Payment Information
                </h3>
              </div>
              <div className="space-y-4 text-zinc-600 text-sm leading-relaxed">
                <p>
                  Online subscriptions can be completed through the BKMA website using the integrated payment system.
                </p>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Supported Payment Gateways & Methods</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-bold text-zinc-700">
                    <div>✓ Razorpay</div>
                    <div>✓ UPI</div>
                    <div>✓ Credit Cards</div>
                    <div>✓ Debit Cards</div>
                    <div className="col-span-2">✓ Net Banking</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 italic">
                  Payment details section is ready for secure backend database and Razorpay gateway integration.
                </p>
              </div>
            </div>

            {/* Delivery Information Section */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Truck size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Delivery Information
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm leading-relaxed">
                <p>
                  Subscription access and publication-related services will be activated after successful payment verification.
                </p>
                <p>
                  Physical publication delivery schedules may vary depending on postal services and publication timelines.
                </p>
                <p>
                  Please ensure shipping details are correctly updated in your profile account prior to transaction completion.
                </p>
              </div>
            </div>

          </div>

        </section>
      </main>

      {/* Footer Section */}
      <PublicFooter />
    </div>
  );
};

export default PricingPage;
