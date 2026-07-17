import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 sm:px-6 py-4 lg:py-6 ${isScrolled
        ? "bg-white/70 backdrop-blur-lg border-b border-zinc-200 py-3 shadow-sm"
        : "bg-white border-b border-zinc-100 py-4 lg:py-6"
        }`}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 lg:gap-6 h-10 sm:h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0 flex-1 sm:flex-initial">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-4 lg:gap-5 min-w-0">
              <div className="w-9 h-9 sm:w-16 sm:h-16 bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-xl shadow-black/5 overflow-hidden border border-zinc-100 shrink-0">
                <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-['Playfair_Display'] font-black leading-[1.1] sm:leading-tight tracking-[-0.01em] [word-spacing:0.18em] text-black min-w-0">
                {/* On mobile, full name wrapped max 2 lines. On desktop, large font inline */}
                <span className="block sm:hidden text-[10px] leading-tight font-extrabold uppercase line-clamp-2 max-w-[200px] xs:max-w-xs">
                  Bulletin Of Kerala Mathematical Association
                </span>
                <span className="hidden sm:inline text-lg md:text-xl lg:text-3xl xl:text-4xl lg:whitespace-nowrap">
                  Bulletin Of Kerala Mathematical Association
                </span>
              </h1>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden shrink-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 text-black hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Desktop/Tablet Actions (Search and Auth Actions) */}
          <div className="hidden sm:flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 shrink-0">
            <div className="hidden sm:flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 focus-within:ring-2 focus-within:ring-black/5 transition-all w-36 sm:w-40 md:w-44 lg:w-48 xl:w-64 shadow-inner shrink-0">
              <Search size={20} className="text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="search..."
                className="bg-transparent border-none focus:ring-0 text-base placeholder:text-zinc-400 ml-3 w-full outline-none font-medium"
              />
            </div>

            <button 
              onClick={() => {
                if (currentUser) {
                  navigate(getDashboardByRole(currentUser.role));
                } else {
                  navigate('/auth?mode=login');
                }
              }}
              className="text-sm sm:text-base font-bold hover:text-zinc-600 transition-colors shrink-0 uppercase tracking-widest cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => {
                if (currentUser) {
                  navigate(getDashboardByRole(currentUser.role));
                } else {
                  navigate('/auth?mode=register');
                }
              }}
              className="bg-black text-white text-sm sm:text-base font-black py-4 px-10 rounded-xl shadow-2xl shadow-black/20 hover:bg-zinc-800 transition-all active:scale-95 text-center leading-normal uppercase tracking-[0.1em] shrink-0 cursor-pointer"
            >
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end sm:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300 border-l border-zinc-100">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <span className="font-['Outfit'] font-black text-xs tracking-widest uppercase text-zinc-400">Menu</span>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-zinc-500 hover:text-black rounded-lg transition-all"
                  aria-label="Close navigation menu"
                >
                  <X size={20} />
                </button>
              </div>            </div>

            {/* Auth Actions in Drawer */}
            <div className="space-y-3 pt-6">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (currentUser) {
                    navigate(getDashboardByRole(currentUser.role));
                  } else {
                    navigate('/auth?mode=login');
                  }
                }}
                className="w-full py-3.5 text-center text-xs font-bold uppercase tracking-widest border border-zinc-200 hover:border-black rounded-xl transition-all cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (currentUser) {
                    navigate(getDashboardByRole(currentUser.role));
                  } else {
                    navigate('/auth?mode=register');
                  }
                }}
                className="w-full py-3.5 text-center text-xs font-black uppercase tracking-widest bg-black text-white hover:bg-zinc-800 rounded-xl shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicHeader;
