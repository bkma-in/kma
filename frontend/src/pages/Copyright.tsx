import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, Copyright as CopyIcon, FileText, Lock, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import PublicFooter from '../components/PublicFooter';

const Copyright: React.FC = () => {
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

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-2.5">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Playfair_Display']">
              Copyright Policy
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Intellectual Property Rights and Publishing Agreements with BKMA.
            </p>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Copyright Policy</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">

          {/* Card: Main Copyright statement */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <CopyIcon size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Copyright Policy & Terms
              </h3>
            </div>

            <div className="space-y-6">
              <p className="text-zinc-600 text-base sm:text-lg leading-relaxed font-serif">
                All content published by the Bulletin of Kerala Mathematical Association (BKMA) is protected under applicable copyright laws. Authors retain copyright to their original work while granting BKMA the right to publish and archive accepted manuscripts.
              </p>
              <p className="text-zinc-600 text-base sm:text-lg leading-relaxed font-serif">
                Published articles may be used for educational and non-commercial purposes with proper attribution. Unauthorized reproduction, distribution, or commercial use without prior written permission is prohibited. BKMA is committed to protecting intellectual property and maintaining the highest standards of academic publishing.
              </p>
            </div>
          </div>

          {/* Grid Layout: Authors & Readers Rights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Card: Authors Rights */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <FileText size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Author Rights
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Authors retain moral rights and copy-ownership of their papers. By publishing with BKMA, authors grant the association a non-exclusive license to format, distribute, index, and archive the work globally in print and digital databases.
                </p>
              </div>
            </div>

            {/* Card: Permissions & Usage */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Lock size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Usage & Restrictions
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Any reuse of figures, tables, or text excerpts for commercial purposes requires explicit prior written consent from both BKMA and the authors. Proper citation attribution must always be visible when using articles for educational purposes.
                </p>
              </div>
            </div>

          </div>

          {/* Card: Contact Editorial Board */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <Mail size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Permission Enquiries
              </h3>
            </div>
            <div className="space-y-4 text-zinc-600 text-sm sm:text-base leading-relaxed">
              <p>
                To request permissions for translation, reproduction, or republication of materials, please send a written request to the BKMA Editorial Board.
              </p>
              <p className="font-semibold text-black">
                Email: keralamathsasso@gmail.com
              </p>
            </div>
          </div>

        </section>
      </main>

      {/* Footer Section */}
      <PublicFooter />
    </div>
  );
};

export default Copyright;
