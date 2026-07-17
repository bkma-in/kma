import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import logo from '../assets/logo.png';

interface PublicHeaderProps {
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({
  onSearchChange,
  searchPlaceholder = 'search for research papers...',
  showSearch = true
}) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (userStr && token) {
        setIsLoggedIn(true);
        setCurrentUser(JSON.parse(userStr));
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    };

    checkAuth();
    window.addEventListener('scroll', handleScroll);
    
    // Listen for storage changes to sync auth state
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const getDashboardByRole = (role: string) => {
    switch (role) {
      case 'author': return '/author/dashboard';
      case 'reviewer': return '/reviewer/dashboard';
      case 'admin': return '/admin/dashboard';
      case 'dev': return '/dev/dashboard';
      case 'reader': return '/reader/dashboard';
      default: return '/';
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 px-3 sm:px-6 py-3 lg:py-6 ${
      isScrolled
        ? "bg-white/90 backdrop-blur-lg border-b border-zinc-200 py-2.5 shadow-sm"
        : "bg-white border-b border-zinc-100 py-3 lg:py-6"
    }`}>
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* 1. Logo & Title (Left) */}
        <Link to="/" className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 md:flex-initial group">
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center p-1 sm:p-1.5 shadow-md border border-zinc-100 shrink-0 group-hover:scale-105 transition-transform">
            <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-['Playfair_Display'] font-black text-xs sm:text-base md:text-xl lg:text-2xl xl:text-3xl leading-[1.2] tracking-tight [word-spacing:0.1em] text-black break-words min-w-0">
            Bulletin of Kerala Mathematical Association
          </h1>
        </Link>

        {/* 2. Actions (Right) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Search bar - Hidden on mobile */}
          {showSearch && (
            <div className="hidden md:flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-black/5 transition-all w-48 lg:w-64 shadow-inner">
              <Search size={16} className="text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearch}
                className="bg-transparent border-none focus:ring-0 text-xs placeholder:text-zinc-400 ml-2 w-full outline-none font-medium"
              />
            </div>
          )}

          {/* Login button */}
          <button 
            onClick={() => {
              if (isLoggedIn && currentUser) {
                navigate(getDashboardByRole(currentUser.role));
              } else {
                navigate('/auth?mode=login');
              }
            }}
            className="text-xs sm:text-sm font-bold hover:text-zinc-600 transition-colors uppercase tracking-widest cursor-pointer py-2 px-1"
          >
            {isLoggedIn ? 'Dashboard' : 'Login'}
          </button>
          
          {/* Get Started / Portal button */}
          <button 
            onClick={() => {
              if (isLoggedIn && currentUser) {
                navigate(getDashboardByRole(currentUser.role));
              } else {
                navigate('/auth?mode=register');
              }
            }}
            className="bg-black text-white text-[10px] sm:text-xs font-black py-2.5 px-3 sm:py-3.5 sm:px-6 rounded-xl shadow-md hover:bg-zinc-800 transition-all active:scale-95 text-center leading-tight uppercase tracking-wider shrink-0 cursor-pointer"
          >
            {isLoggedIn ? 'Access Portal' : 'Get Started'}
          </button>
        </div>

      </div>
    </nav>
  );
};

export default PublicHeader;
