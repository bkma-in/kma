import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';
import { Info, BookOpen, Users, BadgePercent } from 'lucide-react';

const BrandingCard: React.FC = () => {
  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden md:min-h-[700px]">
      {/* Subtle Background Accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-36 -mt-36" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -ml-36 -mb-36" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-yellow-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      {/* Main Content */}
      <div className="relative z-10 space-y-6 lg:space-y-8">
        {/* Logo */}
        <div className="flex md:block">
          <Link 
            to="/" 
            className="bg-white p-2 rounded-xl inline-block shadow-xl shadow-black/20 overflow-hidden mx-auto md:mx-0 hover:scale-105 transition-transform duration-300"
          >
            <img
              src={logo}
              alt="Kerala Mathematical Association Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-[100px] lg:h-[100px] object-contain"
            />
          </Link>
        </div>

        {/* Title */}
        <div>
          <Link to="/" className="group">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-black text-white tracking-[-0.03em] leading-[1.1] text-center md:text-left group-hover:text-zinc-200 transition-colors font-['Playfair_Display']">
              Bulletin Of{' '}
              <br className="hidden md:block" />
              Kerala{' '}
              <br className="hidden md:block" />
              Mathematical{' '}
              <br className="hidden md:block" />
              Association
            </h1>
          </Link>

          <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
            <span className="w-6 h-[1px] bg-yellow-400/40 inline-block" />
            <p className="text-yellow-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs">
              Advancing Mathematical Excellence
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-zinc-400 leading-relaxed text-sm hidden md:block max-w-sm">
          The Kerala Mathematical Association promotes advanced mathematical research
          and higher education through collaboration among scholars worldwide.
        </p>

        {/* Feature Highlights */}
        <div className="space-y-3 hidden md:block">
          <div className="flex items-start gap-3 p-3 lg:p-4 bg-white/5 rounded-xl border border-white/10 transition-all hover:bg-white/10 group">
            <BookOpen className="text-zinc-300 shrink-0 mt-0.5 group-hover:text-yellow-400 transition-colors" size={16} />
            <p className="text-zinc-400 text-xs lg:text-[13px] leading-snug">
              Access peer-reviewed scholarly articles and research papers.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 lg:p-4 bg-white/5 rounded-xl border border-white/10 transition-all hover:bg-white/10 group">
            <Users className="text-zinc-300 shrink-0 mt-0.5 group-hover:text-yellow-400 transition-colors" size={16} />
            <p className="text-zinc-400 text-xs lg:text-[13px] leading-snug">
              Platform for authors and reviewers to collaborate on mathematical research.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 lg:p-4 bg-white/5 rounded-xl border border-white/10 transition-all hover:bg-white/10 group">
            <BadgePercent className="text-zinc-300 shrink-0 mt-0.5 group-hover:text-yellow-400 transition-colors" size={16} />
            <p className="text-zinc-400 text-xs lg:text-[13px] leading-snug">
              50% subscription discount for life members.
            </p>
          </div>
        </div>

        {/* Reviewer Notice */}
        <div className="hidden md:flex items-start gap-3 p-3 lg:p-4 bg-white/[0.03] rounded-xl border border-white/10">
          <Info className="text-yellow-400 shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <p className="font-bold text-[10px] lg:text-[11px] uppercase tracking-wider text-zinc-500">
              Reviewer Notice
            </p>
            <p className="text-xs lg:text-[13px] leading-snug text-zinc-400">
              Reviewer accounts require admin approval. You will be able to log in
              only after your account has been approved.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-6 lg:pt-10 hidden md:block">
        <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest text-center md:text-left">
          &copy; 2026 Bulletin Of Kerala Mathematical Association
        </p>
      </div>
    </div>
  );
};

export default BrandingCard;
