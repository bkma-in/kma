import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight, FileText, BookOpen, Users, ShieldCheck, Zap, Truck, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';
import PublicFooter from '../components/PublicFooter';

const ServiceDescription: React.FC = () => {
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
              Service Description
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Overview of publications, subscriptions, memberships, and related scholarly services provided by BKMA.
            </p>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Service Description</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
          
          {/* Card 1: Overview */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <FileText size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Overview
              </h3>
            </div>
            
            <div className="space-y-4 text-zinc-600 text-base sm:text-lg leading-relaxed font-serif">
              <p>
                The <strong className="text-black">Bulletin of Kerala Mathematical Association (BKMA)</strong> is an academic publication platform dedicated to promoting mathematical research, scholarly communication, and knowledge sharing among researchers, educators, students, and institutions.
              </p>
              <p>
                BKMA provides access to academic publications, subscription services, memberships, and related scholarly resources through its digital platform.
              </p>
            </div>
          </div>

          {/* Title header for Services Offered */}
          <div className="border-b border-zinc-200 pb-2">
            <h2 className="text-2xl font-black font-['Outfit'] text-zinc-800 uppercase tracking-wider">
              Services Offered
            </h2>
          </div>

          {/* Sub-grid 1: Journal Subscriptions & Reader Access */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
            
            {/* Card: Journal Subscriptions */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <BookOpen size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Journal Subscriptions
                </h3>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Subscribers receive access to BKMA publications and journal issues according to the selected subscription plan.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Plan Benefits</p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
                  <li>Access to published research articles</li>
                  <li>Academic and scholarly content</li>
                  <li>Current and archived journal issues</li>
                  <li>Institution and individual subscription options</li>
                </ul>
              </div>
            </div>

            {/* Card: Reader Access */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Users size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Reader Access Services
                </h3>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Registered readers gain access to custom dashboard tools designed to simplify research browsing and archiving.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dashboard Features</p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
                  <li>Browse published articles & abstracts</li>
                  <li>Access subscribed premium content</li>
                  <li>Manage subscriptions & payment profiles</li>
                  <li>Save articles for future reference</li>
                  <li>Receive email notifications for new releases</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Sub-grid 2: Membership & Author Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card: Membership Services */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Users size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Membership Services
                </h3>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">
                BKMA offers membership opportunities for individuals interested in supporting and participating in the mathematical community.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Member Perks</p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
                  <li>Reduced subscription charges (where applicable)</li>
                  <li>Access to selected member resources</li>
                  <li>Participation in academic activities and initiatives</li>
                  <li>Updates regarding BKMA events and publications</li>
                </ul>
              </div>
            </div>

            {/* Card: Author Services */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <FileText size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Author Services
                </h3>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Authors are equipped with digital submission tools to guide them through the manuscript lifecycle.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Author Platform Actions</p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
                  <li>Submit research manuscripts online</li>
                  <li>Track manuscript evaluation status</li>
                  <li>Receive consolidated reviewer feedback</li>
                  <li>Submit revised papers and corrections</li>
                  <li>Monitor publication progress and timelines</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Card: Peer Review Services */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-zinc-900">
                Peer Review Services
              </h3>
            </div>
            
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              BKMA facilitates an academic peer-review process where submitted manuscripts are evaluated by qualified reviewers before publication to guarantee scientific rigour.
            </p>
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Review Stages</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-zinc-700">
                <div className="flex items-center gap-2">1. Initial Editorial Screening</div>
                <div className="flex items-center gap-2">2. Reviewer Assignment</div>
                <div className="flex items-center gap-2">3. Revision Requests</div>
                <div className="flex items-center gap-2">4. Final Editorial Decision</div>
              </div>
            </div>
          </div>

          {/* Grid Layout: Service Activation & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card: Service Activation */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Zap size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Service Activation
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm leading-relaxed">
                <p>
                  For digital subscriptions and memberships, access is generally activated after successful payment confirmation and account verification.
                </p>
                <p>
                  Activation timelines may vary depending on the selected service and administrative review requirements.
                </p>
              </div>
            </div>

            {/* Card: Delivery of Services */}
            <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-lg shadow-zinc-200/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Truck size={18} />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-zinc-900">
                  Delivery of Services
                </h3>
              </div>
              <div className="space-y-3 text-zinc-600 text-sm leading-relaxed">
                <p>
                  BKMA primarily provides digital services through its online platform.
                </p>
                <p>
                  Where physical journal distribution is applicable, delivery timelines may vary depending on location, postal services, and publication schedules.
                </p>
              </div>
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
                For questions regarding subscriptions, memberships, payments, publications, or platform services, users may contact BKMA through the official communication channels available on the website.
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

export default ServiceDescription;
