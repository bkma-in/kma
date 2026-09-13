import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileEdit, 
  CheckCircle2, 
  BookOpen, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  X,
  Loader2,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../utils/validation';

interface DemoRoleModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

interface RoleOption {
  id: string;
  role: Role;
  readerStatus?: 'active' | 'inactive';
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  route: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  borderHover: string;
  bgLight: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'admin',
    role: 'admin',
    title: 'Administrator',
    badge: 'Full Oversight',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Editorial triage, reviewer assignments, publication approvals, call for papers, and payment verification.',
    route: '/admin/dashboard',
    icon: ShieldCheck,
    color: 'text-rose-600',
    borderHover: 'hover:border-rose-400 hover:shadow-rose-100/50',
    bgLight: 'bg-rose-50/60'
  },
  {
    id: 'author',
    role: 'author',
    title: 'Author',
    badge: 'Research & Drafts',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Manuscript submission portal, live review status tracking, revision requests, drafts, and author notifications.',
    route: '/author/dashboard',
    icon: FileEdit,
    color: 'text-blue-600',
    borderHover: 'hover:border-blue-400 hover:shadow-blue-100/50',
    bgLight: 'bg-blue-50/60'
  },
  {
    id: 'reviewer',
    role: 'reviewer',
    title: 'Peer Reviewer',
    badge: 'Review Queue',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Assigned manuscript queue, double-blind peer-review forms, evaluation rubrics, and feedback submission.',
    route: '/reviewer/dashboard',
    icon: CheckCircle2,
    color: 'text-purple-600',
    borderHover: 'hover:border-purple-400 hover:shadow-purple-100/50',
    bgLight: 'bg-purple-50/60'
  },
  {
    id: 'reader-active',
    role: 'reader',
    readerStatus: 'active',
    title: 'Reader (Active Subscription)',
    badge: 'Unlimited Access',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Full mathematical archive access, unlocked full-text articles, and instant high-resolution PDF downloads.',
    route: '/reader/dashboard',
    icon: BookOpen,
    color: 'text-emerald-600',
    borderHover: 'hover:border-emerald-400 hover:shadow-emerald-100/50',
    bgLight: 'bg-emerald-50/60'
  },
  {
    id: 'reader-inactive',
    role: 'reader',
    readerStatus: 'inactive',
    title: 'Reader (Inactive / Unsubscribed)',
    badge: 'Paywall & Preview',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Digital archive browsing, article abstract previews, bookmarking, and subscription checkout paywall prompts.',
    route: '/reader/dashboard',
    icon: Lock,
    color: 'text-amber-600',
    borderHover: 'hover:border-amber-400 hover:shadow-amber-100/50',
    bgLight: 'bg-amber-50/60'
  }
];

export const DemoRoleModal: React.FC<DemoRoleModalProps> = ({ isOpen, onClose, canClose = true }) => {
  const { currentUser, switchDemoRole, demoReaderStatus } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const currentRole = currentUser?.role;

  const handleSelectRole = async (opt: RoleOption) => {
    setSelectedId(opt.id);
    setIsSwitching(true);
    try {
      await switchDemoRole(opt.role, opt.readerStatus || 'active');
      if (onClose) onClose();
      navigate(opt.route, { replace: true });
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-zinc-900 to-black text-white relative flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm w-fit border border-white/10">
              <Sparkles size={13} className="text-amber-300" />
              <span>Portal Role Switcher</span>
            </div>
            {canClose && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Select Portal Role & Dashboard</h2>
          <p className="text-zinc-300 text-sm mt-1">
            Choose which role you want to explore. You can switch roles at any time from inside any dashboard.
          </p>
        </div>

        {/* Roles List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isCurrent = 
              opt.role === currentRole && 
              (opt.role !== 'reader' || opt.readerStatus === demoReaderStatus);
            const isProcessing = isSwitching && selectedId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => !isSwitching && handleSelectRole(opt)}
                className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                  isCurrent 
                    ? 'border-zinc-900 bg-zinc-50/90 shadow-md ring-2 ring-black/5' 
                    : `border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50/50 shadow-sm ${opt.borderHover}`
                }`}
              >
                <div className={`p-3 rounded-xl ${opt.bgLight} ${opt.color} flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                  <Icon size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-black">
                      {opt.title}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-black bg-zinc-200/80 px-2 py-0.5 rounded-full">
                        <BadgeCheck size={12} className="text-black" />
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div className="flex items-center self-center pl-2 flex-shrink-0">
                  {isProcessing ? (
                    <Loader2 size={18} className="animate-spin text-zinc-800" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center transition-colors text-zinc-500">
                      <ArrowRight size={15} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 flex-shrink-0">
          <span>Switch roles at any time to access different portal dashboards.</span>
        </div>
      </div>
    </div>
  );
};

export default DemoRoleModal;
