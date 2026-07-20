// --- Types & Imports ---
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import logo from '../assets/logo.png';
import GlobalFooter from './GlobalFooter';
import PricingModal from './PricingModal';

const PublicFooter: React.FC = () => {
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  return (
    <>
      <footer className="bg-black text-white py-6 md:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Footer Redesign (max-width: 768px) */}
          <div className="block md:hidden space-y-6">
            {/* Branding */}
            <div className="space-y-3 text-center sm:text-left flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 border border-white/10 shrink-0">
                  <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-['Playfair_Display'] font-black text-base tracking-[-0.02em]">
                  Bulletin Of Kerala Mathematical Association
                </h1>
              </div>
              <p className="text-zinc-500 text-[10px] leading-relaxed max-w-sm">
                Advancing mathematical research and higher education through global collaboration and peer-reviewed scholarly excellence.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                <Link to="/about-us" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-2.5 py-1 rounded-md">About Us</Link>
                <button className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-2.5 py-1 rounded-md">Author Guidelines</button>
                <button className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-2.5 py-1 rounded-md">Reviewer Guidelines</button>
              </div>
            </div>

            {/* Responsive Two-Column Grid for Links */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-4 border-t border-white/5">
              {/* Policies & Support */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Policies</h4>
                <ul className="space-y-2">
                  <li><button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors text-left">Publication</button></li>
                  <li><Link to="/copyright" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Copyright</Link></li>
                  <li><Link to="/privacy-policy" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/refund-policy" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Refund Policy</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Support</h4>
                <ul className="space-y-2">
                  <li><Link to="/contact-us" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors text-left">Help Center</button></li>
                  <li><button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors text-left">Report Issue</button></li>
                </ul>
              </div>

              {/* Access & About */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Access</h4>
                <ul className="space-y-2">
                  <li><Link to="/pricing" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link to="/service-description" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Service Description</Link></li>
                  <li><Link to="/about-us" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors text-left">Editorial Board</Link></li>
                  <li><Link to="/terms" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">About</h4>
                <ul className="space-y-2">
                  <li><Link to="/about-us" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">About KMA</Link></li>
                  <li><button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors text-left">Guidelines</button></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Footer (md:grid) */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
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

            {/* Column 2: Policies */}
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

            {/* Column 3: Access */}
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
                    ) : link === 'Editorial Board' ? (
                      <Link to="/about-us" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    ) : (
                      <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">{link}</button>
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
            </div>
          </div>

          {/* Bottom Row: Global Footer Component */}
          <GlobalFooter showSocials={false} showTaglines={false} showContactDetails={true} />
        </div>
      </footer>

      {/* Shared Modals */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </>
  );
};

export default PublicFooter;
