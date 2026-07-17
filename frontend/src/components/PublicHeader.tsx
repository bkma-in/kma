import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 sm:px-6 py-4 lg:py-6 ${isScrolled
      ? "bg-white/70 backdrop-blur-lg border-b border-zinc-200 py-3 shadow-sm"
      : "bg-white border-b border-zinc-100 py-4 lg:py-6"
      }`}>
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 lg:gap-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0">
          <Link to="/" className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0">
            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-xl shadow-black/5 overflow-hidden border border-zinc-100 shrink-0">
              <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-['Playfair_Display'] font-black leading-[1.1] sm:leading-tight tracking-[-0.01em] [word-spacing:0.18em] text-black min-w-0">
              <span className="inline sm:hidden text-sm font-extrabold uppercase">BKMA</span>
              <span className="hidden sm:inline text-lg md:text-xl lg:text-3xl xl:text-4xl lg:whitespace-nowrap">
                Bulletin Of Kerala Mathematical Association
              </span>
            </h1>
          </Link>
        </div>

        {/* Search and Auth Actions */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 shrink-0">
          <div className="hidden sm:flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 sm:py-4 focus-within:ring-2 focus-within:ring-black/5 transition-all w-36 sm:w-40 md:w-44 lg:w-48 xl:w-64 shadow-inner shrink-0">
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
            className="bg-black text-white text-sm sm:text-base font-black py-3 px-5 sm:py-4 sm:px-10 rounded-xl shadow-2xl shadow-black/20 hover:bg-zinc-800 transition-all active:scale-95 text-center leading-tight sm:leading-normal uppercase tracking-[0.1em] shrink-0 cursor-pointer"
          >
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Get <br /> Started</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PublicHeader;
