import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronUp, 
  ChevronDown, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  BookOpen, 
  Lock, 
  Check,
  Loader2,
  Code2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../utils/validation';

interface RoleOption {
  id: string;
  role: Role;
  readerStatus?: 'active' | 'inactive';
  title: string;
  route: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'dev',
    role: 'dev',
    title: 'Developer',
    route: '/dev/dashboard',
    icon: Code2,
    color: 'text-indigo-400'
  },
  {
    id: 'admin',
    role: 'admin',
    title: 'Administrator',
    route: '/admin/dashboard',
    icon: ShieldCheck,
    color: 'text-rose-400'
  },
  {
    id: 'author',
    role: 'author',
    title: 'Author',
    route: '/author/dashboard',
    icon: FileText,
    color: 'text-blue-400'
  },
  {
    id: 'reviewer',
    role: 'reviewer',
    title: 'Peer Reviewer',
    route: '/reviewer/dashboard',
    icon: CheckCircle2,
    color: 'text-purple-400'
  },
  {
    id: 'reader-active',
    role: 'reader',
    readerStatus: 'active',
    title: 'Reader (Active)',
    route: '/reader/dashboard',
    icon: BookOpen,
    color: 'text-emerald-400'
  },
  {
    id: 'reader-inactive',
    role: 'reader',
    readerStatus: 'inactive',
    title: 'Reader (Inactive)',
    route: '/reader/dashboard',
    icon: Lock,
    color: 'text-amber-400'
  }
];

export const DemoRoleSwitcherWidget: React.FC = () => {
  const { currentUser, isDemoUser, demoReaderStatus, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Render ONLY for demo master account
  if (!isDemoUser && currentUser?.email !== 'demo788197@gmail.com') {
    return null;
  }

  const role = currentUser?.role || 'dev';
  const roleDisplay = 
    role === 'reader'
      ? (demoReaderStatus === 'active' ? 'Reader (Active)' : 'Reader (Inactive)')
      : role === 'dev'
      ? 'Developer'
      : role.charAt(0).toUpperCase() + role.slice(1);

  const handleSelectRole = async (opt: RoleOption) => {
    if (switchingId) return;
    setSwitchingId(opt.id);
    try {
      await switchDemoRole(opt.role, opt.readerStatus || 'active');
      setIsOpen(false);
      navigate(opt.route, { replace: true });
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-40">
      <div className="relative">
        {/* Upward Popover Menu listing different roles */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2.5 w-56 bg-zinc-950/95 text-white rounded-2xl shadow-2xl border border-zinc-700/80 p-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 mb-1 flex items-center justify-between">
              <span>Switch Role</span>
              <span className="text-[10px] text-zinc-500 font-normal">Select portal</span>
            </div>

            <div className="space-y-1">
              {ROLES.map((opt) => {
                const Icon = opt.icon;
                const isCurrent =
                  opt.role === role &&
                  (opt.role !== 'reader' || opt.readerStatus === demoReaderStatus);
                const isProcessing = switchingId === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectRole(opt)}
                    disabled={Boolean(switchingId)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isCurrent
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className={opt.color} />
                      <span>{opt.title}</span>
                    </div>
                    <div>
                      {isProcessing ? (
                        <Loader2 size={13} className="animate-spin text-zinc-300" />
                      ) : isCurrent ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Short Pill Button: Displays Current Role + Up Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-zinc-950/90 hover:bg-black text-white px-3 py-1.5 rounded-full shadow-2xl border border-zinc-700/80 backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer group active:scale-95"
          title={isOpen ? "Close roles menu" : "Switch role"}
          aria-expanded={isOpen}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-zinc-100 tracking-tight">
            {roleDisplay}
          </span>
          <div className="p-0.5 rounded-full bg-white/10 group-hover:bg-white/20 text-zinc-300 transition-colors ml-0.5">
            {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </div>
        </button>
      </div>
    </div>
  );
};

export default DemoRoleSwitcherWidget;
