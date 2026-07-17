import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, CreditCard, XCircle, AlertTriangle, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';
import GlobalFooter from '../components/GlobalFooter';

const RefundPolicy: React.FC = () => {
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
              Refund & Cancellation Policy
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Guidelines regarding payments, cancellations, and related services offered by BKMA.
            </p>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Refund & Cancellation Policy</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
          
          {/* Card: Refund Policy */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <CreditCard size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Refund Policy
              </h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-zinc-600 text-base sm:text-lg leading-relaxed font-serif">
                BKMA strives to provide quality academic and publication-related services to its members, researchers, authors, and readers. Before completing any transaction, users are encouraged to carefully review the details of the service, membership, or subscription being selected.
              </p>
              <p className="text-zinc-600 text-base sm:text-lg leading-relaxed font-serif">
                Payments made through the BKMA platform are treated as final upon successful processing and confirmation.
              </p>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                Refund Eligibility
              </h4>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                BKMA does not ordinarily offer refunds for payments associated with:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <li>Membership registrations</li>
                <li>Journal subscriptions</li>
                <li>Manuscript processing or publication-related fees</li>
                <li>Event registrations</li>
                <li>Workshops, seminars, or academic programs</li>
                <li>Any other services provided through the platform</li>
              </ul>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed italic">
                Users are advised to ensure the accuracy of their payment information before confirming a transaction.
              </p>
            </div>
          </div>

          {/* Grid Layout: Cancellation Policy & Exceptional Circumstances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card: Cancellation Policy */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <XCircle size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Cancellation Policy
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Users may discontinue participation in a membership, subscription, or service at their discretion. However, discontinuation of a service after payment has been completed does not create entitlement to reimbursement of fees already paid.
                </p>
                <p>
                  Where applicable, users may choose not to renew future memberships or subscriptions manually before the renewal date.
                </p>
              </div>
            </div>

            {/* Card: Exceptional Circumstances */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Exceptional Circumstances
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm sm:text-base leading-relaxed">
                <p>
                  If a transaction is affected by a duplicate payment, processing error, or other technical issue, BKMA may examine the matter and determine an appropriate resolution after verification.
                </p>
                <p>
                  Such reviews are conducted individually and should not be interpreted as an assurance of a refund. BKMA reserves the right to revise or update this policy when necessary.
                </p>
              </div>
            </div>

          </div>

          {/* Card: Contact Information */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <Mail size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Contact Information
              </h3>
            </div>
            <div className="space-y-4 text-zinc-600 text-sm sm:text-base leading-relaxed">
              <p>
                For questions regarding payments, subscriptions, or related matters, users may reach out through the official contact channels provided on the BKMA website.
              </p>
              <p className="font-semibold text-black">
                By using BKMA services, users acknowledge that they have read and accepted the terms outlined in this Refund and Cancellation Policy.
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

export default RefundPolicy;
