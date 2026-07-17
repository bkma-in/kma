import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, Info, History, Target, Award, BookOpen, Users } from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import PublicFooter from '../components/PublicFooter';

const AboutUs: React.FC = () => {
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
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Playfair_Display']">
              About BKMA
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Kerala Mathematical Association
            </p>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">About Us</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
          
          {/* Card: About Us / Organization Overview */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <Info size={22} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900 leading-tight">
                  Advancing Mathematical Research Through Knowledge and Collaboration
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">Kerala Mathematical Association (KMA)</p>
              </div>
            </div>
            <div className="space-y-4 text-zinc-600 text-base sm:text-lg leading-relaxed font-serif">
              <p>
                The <strong className="text-black">Bulletin of Kerala Mathematical Association (BKMA)</strong> is the official academic publication of the Kerala Mathematical Association (KMA). Established with the vision of promoting excellence in mathematical sciences, BKMA serves as a trusted platform for researchers, academicians, educators, and students to publish and share high-quality mathematical research.
              </p>
              <p>
                Our journal is dedicated to fostering innovation, encouraging scholarly collaboration, and supporting the global exchange of mathematical knowledge across diverse disciplines.
              </p>
            </div>
          </div>

          {/* Grid Layout: Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card: Mission */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Target size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Our Mission
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Our mission is to promote the advancement of mathematics by providing a transparent, ethical, and peer-reviewed publication platform that encourages original research, critical thinking, and academic excellence.
                </p>
                <p>
                  We strive to create opportunities for researchers worldwide to contribute meaningful work that strengthens the mathematical community.
                </p>
              </div>
            </div>

            {/* Card: Vision */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5 flex flex-col">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <BookOpen size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Our Vision
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm sm:text-base leading-relaxed flex-1">
                <p>
                  To become a globally recognized mathematical journal that inspires research, encourages innovation, and contributes to the advancement of mathematical sciences through quality publications and international collaboration.
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

export default AboutUs;
