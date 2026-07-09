import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';
import { Sigma, Triangle, Hash, Cpu, BarChart3, Atom } from 'lucide-react';

const BrandingCard: React.FC = () => {
  const researchAreas = [
    { name: 'Algebra', icon: Sigma },
    { name: 'Geometry', icon: Triangle },
    { name: 'Number Theory', icon: Hash },
    { name: 'Applied Mathematics', icon: Cpu },
    { name: 'Statistics', icon: BarChart3 },
    { name: 'Mathematical Physics', icon: Atom }
  ];

  return (
    <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-start relative overflow-hidden md:min-h-[500px]">
      {/* Subtle Background Accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-36 -mt-36" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -ml-36 -mb-36" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-yellow-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      {/* Main Container Flow: Grouped Logo, Title, Slogan, Description, and Research Areas */}
      <div className="relative z-10 space-y-5">
        {/* Logo */}
        <div className="flex md:block">
          <Link 
            to="/" 
            className="bg-white p-2 rounded-2xl inline-block shadow-xl shadow-black/20 overflow-hidden mx-auto md:mx-0 hover:scale-105 transition-transform duration-300"
          >
            <img
              src={logo}
              alt="Kerala Mathematical Association Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 lg:w-[65px] lg:h-[65px] object-contain"
            />
          </Link>
        </div>

        {/* Title & Slogan */}
        <div>
          <Link to="/" className="group">
            <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-white tracking-[-0.03em] leading-[1.15] text-center md:text-left group-hover:text-zinc-200 transition-colors font-['Playfair_Display']">
              Bulletin Of{' '}
              <br className="hidden md:block" />
              Kerala{' '}
              <br className="hidden md:block" />
              Mathematical{' '}
              <br className="hidden md:block" />
              Association
            </h1>
          </Link>

          <div 
            className="flex items-center gap-3 justify-center md:justify-start mt-7"
            style={{ marginTop: '28px' }}
          >
            <span className="w-8 h-[2px] bg-yellow-400/60 inline-block" />
            <p className="text-yellow-400 font-black tracking-[0.15em] uppercase text-[9px] sm:text-[10px]">
              Advancing Mathematical Excellence
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-zinc-400 leading-relaxed text-xs md:text-sm hidden md:block max-w-sm">
          The Kerala Mathematical Association promotes advanced mathematical research
          and higher education through collaboration among scholars worldwide.
        </p>

        {/* Research Areas Section */}
        <div className="hidden md:block pt-4 border-t border-white/10 space-y-3">
          <div>
            <h3 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-white">Research Areas</h3>
            <p className="text-[11px] text-[#B3B3B3] leading-relaxed mt-0.5 max-w-sm">
              Explore the major fields of mathematical research published in the Bulletin of Kerala Mathematical Association.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-w-sm">
            {researchAreas.map((area, idx) => {
              const Icon = area.icon;
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1F1F1F] border border-[#3A3A3A] rounded-xl text-white transition-all duration-300 hover:border-zinc-500 hover:bg-[#2A2A2A] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25 cursor-default group"
                >
                  <Icon size={14} className="text-zinc-400 group-hover:text-yellow-400 transition-colors" />
                  <span className="text-[10px] lg:text-[11px] font-medium tracking-wide">{area.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingCard;
