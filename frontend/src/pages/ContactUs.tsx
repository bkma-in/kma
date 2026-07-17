import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, Mail, MapPin, Globe, PhoneCall } from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import PublicFooter from '../components/PublicFooter';

const ContactUs: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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
              Contact Us
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Get in touch with the Bulletin of Kerala Mathematical Association.
            </p>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Contact Us</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
          
          {/* Card: Main Contact Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-8">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <PhoneCall size={22} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                  BKMA Editorial Office
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Official Contact Details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card item: Office */}
              <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
                  <MapPin size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Address</h4>
                <p className="text-sm font-bold text-zinc-800 leading-snug">
                  Bulletin of Kerala Mathematical Association (BKMA)<br />
                  Kerala, India
                </p>
              </div>

              {/* Card item: Email */}
              <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
                  <Mail size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Email</h4>
                <a href="mailto:keralamathsasso@gmail.com" className="text-sm font-bold text-indigo-600 hover:underline">
                  keralamathsasso@gmail.com
                </a>
              </div>

              {/* Card item: Website */}
              <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
                  <Globe size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Website</h4>
                <a href="https://www.bkma.in" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:underline">
                  https://www.bkma.in
                </a>
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

export default ContactUs;
