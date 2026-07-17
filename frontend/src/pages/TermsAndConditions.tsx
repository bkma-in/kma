import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, FileText, Globe, Eye, UserCheck, Shield, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';
import GlobalFooter from '../components/GlobalFooter';

const TermsAndConditions: React.FC = () => {
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
              Terms & Conditions
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Rules and guidelines for accessing and publishing on the BKMA platform.
            </p>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Terms & Conditions</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
          
          {/* Card: Introduction */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <FileText size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Introduction
              </h3>
            </div>
            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed font-serif">
              Welcome to <strong className="text-black">BKMA (Bulletin of Kerala Mathematical Association)</strong>. By accessing, browsing, or using this website, you agree to comply with and be bound by these Terms & Conditions. If you do not agree with any part of these terms, you should discontinue use of the website.
            </p>
          </div>

          {/* Grid Layout: Use of Website & Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card: Use of the Website */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Globe size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Use of the Website
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <p>
                  The BKMA website is intended to provide information related to mathematical research, publications, academic activities, memberships, and associated services.
                </p>
                <p>
                  Users agree to use the platform only for lawful purposes and in a manner that does not interfere with the operation, security, or accessibility of the website.
                </p>
              </div>
            </div>

            {/* Card: Privacy */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Eye size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Privacy
                </h3>
              </div>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                Use of the website is also governed by the BKMA Privacy Policy. By using the platform, users consent to the collection and use of information as described in the Privacy Policy.
              </p>
            </div>

          </div>

          {/* Card: User Accounts */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <UserCheck size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                User Accounts
              </h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                Certain features may require registration or account creation. Users are responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <li>Providing accurate and up-to-date information.</li>
                <li>Maintaining the confidentiality of login credentials.</li>
                <li>Ensuring that account activities are conducted responsibly.</li>
                <li>Not sharing account access with unauthorized individuals.</li>
              </ul>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed italic">
                BKMA reserves the right to suspend or terminate accounts that violate these terms.
              </p>
            </div>
          </div>

          {/* Card: Intellectual Property */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                <Shield size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Intellectual Property
              </h3>
            </div>
            <div className="space-y-4 text-zinc-600 text-sm sm:text-base leading-relaxed">
              <p>
                All content published on the website, including articles, logos, graphics, designs, and text, remains the property of BKMA or the respective content owners unless otherwise stated.
              </p>
              <p>
                Users may not reproduce, distribute, modify, or republish website content without prior authorization.
              </p>
            </div>
          </div>

          {/* Card: Contact Information */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50/80 border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm shrink-0">
                <Mail size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Contact Information
              </h3>
            </div>
            <div className="space-y-4 text-zinc-600 text-sm sm:text-base leading-relaxed">
              <p>
                For questions regarding these Terms & Conditions, users may contact BKMA through the official contact channels available on the website.
              </p>
              <p className="font-semibold text-black">
                By continuing to use the BKMA website, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
              </p>
            </div>
          </div>

        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-black text-white w-full py-16 px-4 sm:px-6 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
            {/* Column 1: Branding */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg p-1.5 overflow-hidden border border-white/10 shrink-0">
                  <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-['Playfair_Display'] font-black text-xl tracking-[-0.02em]">Bulletin Of Kerala Mathematical Association</h1>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed max-w-sm">
                Advancing mathematical research and higher education through global collaboration and peer-reviewed scholarly excellence.
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-4">
                <Link to="/about-us" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-md">About Us</Link>
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
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer">{link}</span>
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
    </div>
  );
};

export default TermsAndConditions;
