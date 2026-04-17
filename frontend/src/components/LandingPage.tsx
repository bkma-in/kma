import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogIn, ChevronRight, BookOpen, Users, BadgePercent, Info, Mail, Phone, Globe } from 'lucide-react';
import logo from '../assets/logo.png';
import hero from '../assets/hero.png';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 sm:px-6 py-3 ${
        isScrolled 
          ? "bg-white/70 backdrop-blur-lg border-b border-zinc-200 py-2 shadow-sm" 
          : "bg-white border-b border-zinc-100 py-3"
      }`}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1 shadow-md shadow-black/5 overflow-hidden">
              <img src={logo} alt="KMA Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-bold text-[11px] sm:text-lg leading-[1.1] sm:leading-tight tracking-tight flex flex-col sm:block">
              <span className="sm:inline">Kerala</span>
              <span className="sm:inline"> Mathematical</span>
              <span className="sm:inline"> Association</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center bg-zinc-50 border border-zinc-200 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-black/5 transition-all w-48 lg:w-64">
              <Search size={16} className="text-zinc-400 shrink-0" />
              <input 
                type="text" 
                placeholder="search for article" 
                className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-zinc-400 ml-2 w-full outline-none"
              />
            </div>

            <button 
              onClick={() => navigate('/auth')}
              className="text-[11px] sm:text-sm font-bold hover:text-zinc-600 transition-colors shrink-0"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-black text-white text-[11px] sm:text-sm font-bold py-2 px-3 sm:py-2.5 sm:px-6 rounded-md shadow-lg shadow-black/20 hover:bg-zinc-800 transition-all active:scale-95 text-center leading-tight sm:leading-normal"
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Get <br /> Started</span>
            </button>
          </div>
        </div>
      </nav>
      {/* Hero Section - Redesigned per Reference */}
      <section className="bg-black text-white w-full overflow-hidden min-h-[85vh] flex items-center pt-24 pb-20 sm:pt-32 sm:pb-32">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">
            
            {/* Left Section (Text Content) */}
            <div className="flex flex-col text-left">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Advancing Pure <br /> & Applied <br /> Mathematics
              </h2>
              <p className="text-gray-400 mt-6 max-w-lg text-lg leading-relaxed">
                The Kerala Mathematical Association promotes advanced mathematical research and higher education through collaboration among scholars worldwide.
              </p>

              {/* Reviewer Notice Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-10 w-full sm:max-w-md shadow-xl lg:w-fit">
                <div className="flex items-start gap-4">
                  <div className="bg-zinc-800 p-2.5 rounded-lg shrink-0">
                    <Info className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide mb-1 flex items-center gap-2">
                       REVIEWER NOTICE
                    </h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      Reviewer accounts require admin approval. You will be able to log in only after your account has been approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section (Membership Card) */}
            <div className="w-full flex justify-center lg:justify-end">
              <div className="bg-white text-black rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md lg:max-w-lg space-y-6">
                <h3 className="text-3xl font-bold tracking-tight border-b border-zinc-100 pb-5">Membership Benefits</h3>
                <div className="space-y-6">
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
                      <BookOpen className="text-white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1.5">Scholarly Access</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">Access peer-reviewed scholarly articles and research papers from leading global institutions.</p>
                    </div>
                  </div>

                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="text-black" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1.5">Global Collaboration</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">Platform for authors and reviewers to collaborate on cutting-edge mathematical research.</p>
                    </div>
                  </div>

                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                      <BadgePercent className="text-black" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1.5">Life Member Perks</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">50% subscription discount for life members on all premium publications.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* Published Articles Section */}
      <section className="py-20 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12 border-b-2 border-zinc-200 pb-6">
            <h2 className="text-4xl font-bold tracking-tight">Published Articles</h2>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-zinc-600 transition-colors">
              View All Archive <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tag: 'Topology',
                vol: '42',
                title: 'On the Homotopy Type of Certain Spaces',
                author: 'Dr. S. Raman',
                date: 'OCT 2023'
              },
              {
                tag: 'Number Theory',
                vol: '42',
                title: 'Prime Distribution in Arithmetic Progressions',
                author: 'M. Nair',
                date: 'SEP 2023'
              },
              {
                tag: 'Applied Math',
                vol: '41',
                title: 'Fluid Dynamics in Porous Media',
                author: 'A. K. Menon',
                date: 'JUN 2023'
              }
            ].map((art, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex gap-3 mb-6">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{art.tag}</span>
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest pt-1">VOL. {art.vol}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 leading-tight min-h-[4rem]">{art.title}</h3>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                  An exploration of the properties of spaces derived from complex algebraic varieties and their fundamental groups.
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                      <Users size={14} />
                    </div>
                    <span className="text-sm font-bold">{art.author}</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">{art.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-xl shadow-white/5 overflow-hidden">
                <img src={logo} alt="KMA Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-bold text-lg tracking-tight">Kerala Mathematical Association</h1>
            </div>
            
            <div className="flex gap-8">
              <button className="text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors">Submission Guidelines</button>
              <button className="text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors">Privacy Policy</button>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              {[
                {
                  name: "Nandeesh MN",
                  url: "https://nandeeshmn.vercel.app/",
                  desc: "Web Developer"
                },
                {
                  name: "Shivanand VN",
                  url: "https://shivanandvn.vercel.app/",
                  desc: "Full Stack & Python Developer"
                }
              ].map((dev, i) => (
                <div key={i} className="bg-zinc-900/50 p-6 rounded-[1.5rem] shadow-2xl border border-white/10 w-full max-w-[260px] relative overflow-hidden group hover:border-white/30 transition-all duration-500 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-white/10 transition-colors" />
                  
                  <div className="relative z-10 space-y-4">
                    <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em]">
                      Technical Partner
                    </p>
                    
                    <div>
                      <h4 className="text-xl font-bold text-white tracking-tight leading-tight mb-1">
                        {dev.name}
                      </h4>
                      <p className="text-zinc-400 text-[10px] leading-relaxed max-w-[180px]">
                        {dev.desc}
                      </p>
                    </div>

                    <div className="flex gap-2.5">
                      {[Mail, Phone, Globe].map((Icon, idx) => (
                        <a 
                          key={idx}
                          href={dev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-black border border-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:bg-white hover:text-black hover:border-white transition-all duration-300"
                        >
                          <Icon size={14} />
                        </a>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Active Partner</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center pt-6 border-t border-white/5">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              © 2024 Kerala Mathematical Association. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
