// --- Types & Imports ---
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Mail, MapPin } from 'lucide-react';
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
            <div className="space-y-4 text-center flex flex-col items-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 border border-white/10 shrink-0">
                  <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-['Playfair_Display'] font-black text-base leading-tight tracking-[-0.02em] text-white text-left">
                  Bulletin of Kerala Mathematics Association
                </h1>
              </div>
              <p className="text-zinc-400 text-[10px] leading-relaxed max-w-sm text-center mx-auto">
                Advancing mathematical research and higher education through global collaboration and peer-reviewed scholarly excellence.
              </p>
              
              {/* Guidelines/About buttons styled outline on mobile */}
              <div className="flex flex-col items-center gap-2.5 pt-1 w-full max-w-sm">
                <div className="flex gap-2.5 w-full">
                  <Link 
                    to="/about-us" 
                    className="flex-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-350 hover:text-white transition-colors border border-zinc-800 px-3 py-2.5 rounded-lg bg-zinc-950/20"
                  >
                    ABOUT US
                  </Link>
                  <Link 
                    to="/author-guidelines" 
                    className="flex-1 text-center text-[10px] font-black uppercase tracking-widest text-zinc-350 hover:text-white transition-colors border border-zinc-800 px-3 py-2.5 rounded-lg bg-zinc-950/20"
                  >
                    AUTHOR GUIDELINES
                  </Link>
                </div>
                <Link 
                  to="/reviewer-guidelines" 
                  className="w-full text-center text-[10px] font-black uppercase tracking-widest text-zinc-350 hover:text-white transition-colors border border-zinc-800 px-3 py-2.5 rounded-lg bg-zinc-950/20"
                >
                  REVIEWER GUIDELINES
                </Link>
              </div>
            </div>

            {/* Responsive Grid for Links */}
            <div className="grid grid-cols-3 gap-x-2 gap-y-5 pt-5 border-t border-zinc-900">
              {/* Policies */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Policies</h4>
                <ul className="space-y-2">
                  <li><button className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors text-left focus:outline-none">Publication</button></li>
                  <li><Link to="/copyright" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">Copyright</Link></li>
                  <li><Link to="/privacy-policy" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/refund-policy" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">Refund Policy</Link></li>
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Support</h4>
                <ul className="space-y-2">
                  <li><Link to="/contact-us" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><button className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors text-left focus:outline-none">Help Center</button></li>
                  <li><button className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors text-left focus:outline-none">Report Issue</button></li>
                </ul>
              </div>

              {/* Access */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Access</h4>
                <ul className="space-y-2">
                  <li><Link to="/pricing" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link to="/service-description" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">Service Description</Link></li>
                  <li><Link to="/about-us" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors text-left">Editorial Board</Link></li>
                  <li><Link to="/terms" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-900 my-6" />

            {/* Bottom Contact & Developer Info Section */}
            <div className="flex items-center justify-between gap-4 py-2">
              {/* Left Contact Details */}
              <div className="flex flex-col gap-3 text-left">
                <a
                  href="mailto:keralamathsasso@gmail.com"
                  className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  <Mail size={12} className="text-zinc-500 shrink-0" />
                  keralamathsasso@gmail.com
                </a>
                <span className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                  <MapPin size={12} className="text-zinc-500 shrink-0" />
                  Kerala, India
                </span>
              </div>

              {/* Vertical Divider */}
              <div className="w-[1px] self-stretch bg-zinc-900" />

              {/* Right Developer Details */}
              <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                <span className="text-[9px] font-bold tracking-wider uppercase text-zinc-500">
                  Design and developed by
                </span>
                <a
                  href="https://chetanbschool.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-2.5 xs:px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-bold text-zinc-300 tracking-tight transition-colors hover:bg-zinc-800 whitespace-nowrap"
                >
                  Chetan Business School <span className="text-zinc-500 font-normal px-1">|</span> Hubballi-580031
                </a>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 mt-0.5">
                  <span>Nandeesh MN</span>
                  <span className="text-zinc-600 font-normal">•</span>
                  <span>Shivanand VN</span>
                </div>
              </div>
            </div>

            {/* Bottom Copyright centered */}
            <div className="flex flex-col items-center justify-center text-center pt-4 border-t border-zinc-900 mt-4">
              <p className="text-[10px] text-zinc-500 font-bold tracking-wide">
                © {new Date().getFullYear()} Kerala Mathematical Association.
              </p>
              <p className="text-[9px] text-zinc-600 font-bold tracking-wide mt-0.5">
                All Rights Reserved.
              </p>
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
                <h1 className="font-['Playfair_Display'] font-black text-xl tracking-[-0.02em]"> Bulletin of Kerala Mathematics Association</h1>
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
                <Link to="/author-guidelines" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-md flex items-center justify-center">Author Guidelines</Link>
                <Link to="/reviewer-guidelines" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-md">Reviewer Guidelines</Link>
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
          <div className="hidden md:block">
            <GlobalFooter showSocials={false} showTaglines={false} showContactDetails={true} />
          </div>
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
