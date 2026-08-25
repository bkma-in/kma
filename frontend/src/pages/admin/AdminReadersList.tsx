import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Users, 
  Calendar, 
  CheckCircle2,
  Award,
  Crown,
  BookOpen,
  ArrowUpDown,
  Filter,
  X,
  User,
  Shield,
  Mail,
  Phone,
  Clock,
  Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getReaders } from '../../services/user.service';
import { SkeletonTable } from '../../components/skeletons/SkeletonTable';

interface Reader {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  designation?: string;
  profileImage?: string | null;
  regDate: string;
  isLifeMember: boolean;
  isSubscribed: boolean;
  subscriptionPlan?: 'lifetime' | 'annual' | string | null;
  subscriptionStatus?: 'active' | 'inactive';
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
}

type FilterTab = 'subscribers' | 'all' | 'lifetime' | 'non_subscribers';
type SortOption = 'subscribers_first' | 'newest' | 'oldest' | 'name_asc' | 'name_desc';

const AdminReadersList = () => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('subscribers');
  const [sortBy, setSortBy] = useState<SortOption>('subscribers_first');
  const [readers, setReaders] = useState<Reader[]>([]);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchReaders = async () => {
      try {
        const response = await getReaders();
        if (response.success && Array.isArray(response.readers)) {
          setReaders(response.readers);
        } else {
          setReaders([]);
        }
      } catch (error) {
        console.error('Failed to load readers:', error);
        showToast('Failed to load readers list.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReaders();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector('button') as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 50);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isModalOpen]);

  // Metric counts
  const totalCount = readers.length;
  const subscriberCount = readers.filter(r => r.isSubscribed || r.isLifeMember).length;
  const lifeMemberCount = readers.filter(r => r.isLifeMember).length;
  const nonSubscriberCount = readers.filter(r => !r.isSubscribed && !r.isLifeMember).length;

  // Filter and Sort Readers
  const filteredAndSortedReaders = readers
    .filter(reader => {
      // 1. Tab Filter
      if (filterTab === 'subscribers') {
        if (!reader.isSubscribed && !reader.isLifeMember) return false;
      } else if (filterTab === 'lifetime') {
        if (!reader.isLifeMember) return false;
      } else if (filterTab === 'non_subscribers') {
        if (reader.isSubscribed || reader.isLifeMember) return false;
      }

      // 2. Search Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = (reader.name || '').toLowerCase().includes(query);
        const matchesEmail = (reader.email || '').toLowerCase().includes(query);
        const matchesPlan = (reader.subscriptionPlan || '').toLowerCase().includes(query);
        const matchesId = (reader.id || '').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPlan && !matchesId) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'subscribers_first') {
        const aSub = (a.isSubscribed || a.isLifeMember) ? 1 : 0;
        const bSub = (b.isSubscribed || b.isLifeMember) ? 1 : 0;
        if (aSub !== bSub) {
          return bSub - aSub; // Subscribers first
        }
        // Secondary sort: newest first
        const aDate = new Date(a.regDate || 0).getTime();
        const bDate = new Date(b.regDate || 0).getTime();
        return bDate - aDate;
      }

      if (sortBy === 'newest') {
        const aDate = new Date(a.regDate || 0).getTime();
        const bDate = new Date(b.regDate || 0).getTime();
        return bDate - aDate;
      }

      if (sortBy === 'oldest') {
        const aDate = new Date(a.regDate || 0).getTime();
        const bDate = new Date(b.regDate || 0).getTime();
        return aDate - bDate;
      }

      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }

      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }

      return 0;
    });

  const formatDate = (regDate: any) => {
    if (!regDate) return 'N/A';
    const dateObj = new Date(regDate);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const openDetails = (reader: Reader) => {
    setSelectedReader(reader);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 animate-fade-in font-['Outfit']">
        <div className="flex justify-between items-end gap-6 mb-6">
          <div className="space-y-2">
            <div className="h-8 skeleton-box rounded w-48" />
            <div className="h-4 skeleton-box rounded w-64" />
          </div>
          <div className="h-10 skeleton-box rounded-xl w-64" />
        </div>
        <SkeletonTable rowsCount={6} colsCount={5} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4 font-['Outfit']">
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <BookOpen size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Archive Management</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Readers & Subscribers</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-xl leading-relaxed">
            Monitor all registered users and readers across the BKMA system. Sort and inspect subscription passes, lifetime memberships, and access records.
          </p>
        </div>

        {/* Search and Sort controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, email, or pass..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-full sm:w-64 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-9 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm text-zinc-700 w-full"
            >
              <option value="subscribers_first">Sort: Subscribers First</option>
              <option value="newest">Sort: Newest Registered</option>
              <option value="oldest">Sort: Oldest Registered</option>
              <option value="name_asc">Sort: Name (A - Z)</option>
              <option value="name_desc">Sort: Name (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div 
          onClick={() => setFilterTab('subscribers')}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer shadow-sm",
            filterTab === 'subscribers' 
              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20" 
              : "bg-white border-zinc-200 hover:border-zinc-300"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Sparkles size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
              Default View
            </span>
          </div>
          <h3 className="text-3xl font-bold text-black tracking-tighter mb-1">{subscriberCount}</h3>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Subscribers</p>
        </div>

        <div 
          onClick={() => setFilterTab('all')}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer shadow-sm",
            filterTab === 'all' 
              ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20" 
              : "bg-white border-zinc-200 hover:border-zinc-300"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase">
              All Users
            </span>
          </div>
          <h3 className="text-3xl font-bold text-black tracking-tighter mb-1">{totalCount}</h3>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Registered</p>
        </div>

        <div 
          onClick={() => setFilterTab('lifetime')}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer shadow-sm",
            filterTab === 'lifetime' 
              ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20" 
              : "bg-white border-zinc-200 hover:border-zinc-300"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Crown size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 uppercase">
              Lifetime
            </span>
          </div>
          <h3 className="text-3xl font-bold text-black tracking-tighter mb-1">{lifeMemberCount}</h3>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Life Members</p>
        </div>

        <div 
          onClick={() => setFilterTab('non_subscribers')}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer shadow-sm",
            filterTab === 'non_subscribers' 
              ? "bg-zinc-100 border-zinc-400 ring-2 ring-black/10" 
              : "bg-white border-zinc-200 hover:border-zinc-300"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
              <User size={20} />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">
              Non-Subscribers
            </span>
          </div>
          <h3 className="text-3xl font-bold text-black tracking-tighter mb-1">{nonSubscriberCount}</h3>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Non-Subscribers</p>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setFilterTab('subscribers')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
              filterTab === 'subscribers'
                ? "bg-black text-white shadow-md shadow-black/10"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            )}
          >
            <Sparkles size={14} className={filterTab === 'subscribers' ? "text-emerald-400" : "text-zinc-400"} />
            <span>Subscribers</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-black",
              filterTab === 'subscribers' ? "bg-emerald-500 text-black" : "bg-zinc-100 text-zinc-600"
            )}>
              {subscriberCount}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
              filterTab === 'all'
                ? "bg-black text-white shadow-md shadow-black/10"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            )}
          >
            <Users size={14} />
            <span>All Users</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-black",
              filterTab === 'all' ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
            )}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('lifetime')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
              filterTab === 'lifetime'
                ? "bg-black text-white shadow-md shadow-black/10"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            )}
          >
            <Crown size={14} className={filterTab === 'lifetime' ? "text-amber-400" : "text-zinc-400"} />
            <span>Life Members</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-black",
              filterTab === 'lifetime' ? "bg-amber-400 text-black" : "bg-zinc-100 text-zinc-600"
            )}>
              {lifeMemberCount}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('non_subscribers')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
              filterTab === 'non_subscribers'
                ? "bg-black text-white shadow-md shadow-black/10"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            )}
          >
            <User size={14} />
            <span>Non-Subscribers</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-black",
              filterTab === 'non_subscribers' ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
            )}>
              {nonSubscriberCount}
            </span>
          </button>
        </div>

        <p className="text-xs text-zinc-400 hidden sm:block shrink-0">
          Showing <span className="font-bold text-black">{filteredAndSortedReaders.length}</span> of {totalCount} users
        </p>
      </div>

      {/* Table Section */}
      {filteredAndSortedReaders.length > 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-black/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Subscription Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Plan / Pass Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Registered</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAndSortedReaders.map((reader) => {
                  const isSubscriber = reader.isSubscribed || reader.isLifeMember;
                  const isLifetime = reader.isLifeMember || reader.subscriptionPlan === 'lifetime';

                  return (
                    <tr 
                      key={reader.id} 
                      className={cn(
                        "group transition-colors",
                        isLifetime ? "hover:bg-amber-50/20" : isSubscriber ? "hover:bg-emerald-50/20" : "hover:bg-zinc-50/50"
                      )}
                    >
                      {/* User Profile Cell */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm overflow-hidden shrink-0",
                            reader.profileImage 
                              ? "bg-zinc-100" 
                              : isLifetime 
                                ? "bg-amber-100 text-amber-800" 
                                : isSubscriber 
                                  ? "bg-emerald-100 text-emerald-800" 
                                  : "bg-zinc-100 text-zinc-600"
                          )}>
                            {reader.profileImage ? (
                              <img src={reader.profileImage} alt={reader.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{getInitials(reader.name)}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-zinc-900 group-hover:text-black transition-colors">
                                {reader.name || 'Anonymous User'}
                              </span>
                              {isLifetime && (
                                <span title="Life Member" className="inline-flex items-center">
                                  <Crown size={13} className="text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 font-medium lowercase tracking-wide">
                              {reader.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Subscription Status Cell */}
                      <td className="px-6 py-4">
                        {isLifetime ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold tracking-wider uppercase">
                            <Crown size={11} className="text-amber-600" />
                            Life Member
                          </span>
                        ) : isSubscriber ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold tracking-wider uppercase">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Active Subscriber
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px] font-bold tracking-wider uppercase">
                            <Clock size={11} className="text-zinc-400" />
                            Non-Subscribed
                          </span>
                        )}
                      </td>

                      {/* Plan / Pass Type Cell */}
                      <td className="px-6 py-4">
                        {isLifetime ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-800">Lifetime Pass</span>
                            <span className="text-[10px] text-amber-600 font-semibold">Unlimited Access</span>
                          </div>
                        ) : isSubscriber ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-800">
                              {reader.subscriptionPlan === 'annual' ? 'Annual Pass' : 'Subscriber Pass'}
                            </span>
                            {reader.subscriptionExpiresAt ? (
                              <span className="text-[10px] text-zinc-400 font-medium">
                                Expires {formatDate(reader.subscriptionExpiresAt)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-medium">Active</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Free Tier</span>
                        )}
                      </td>

                      {/* Registered Date Cell */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                          <Calendar size={13} className="text-zinc-400" />
                          <span>{formatDate(reader.regDate)}</span>
                        </div>
                      </td>

                      {/* Actions Cell */}
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openDetails(reader)}
                          className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-[10px] font-black tracking-widest transition-all uppercase cursor-pointer shadow-sm active:scale-95"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">No Users Found</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mt-1">
              {searchTerm.trim() !== ''
                ? `No user records matched your search query "${searchTerm}".`
                : filterTab === 'subscribers'
                  ? 'No active subscribers found in the archive system.'
                  : 'No user accounts match the selected filter criteria.'}
            </p>
          </div>
          {filterTab !== 'all' && (
            <button
              onClick={() => {
                setFilterTab('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
            >
              View All Registered Users
            </button>
          )}
        </div>
      )}

      {/* Reader Profile Details Modal */}
      {isModalOpen && selectedReader && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          <div 
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title-reader"
            className="relative w-full max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-white/10 overflow-hidden"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/40 to-transparent z-0 h-40" />

            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-20 p-2 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white"
              aria-label="Close Reader Details Modal"
            >
              <X size={20} />
            </button>

            {/* Modal Content */}
            <div className="relative z-10 flex flex-col overflow-y-auto flex-1 min-h-0 p-6 sm:p-10 space-y-6 custom-scrollbar">
              {/* Top User Profile Header */}
              <div className="bg-zinc-900/50 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center relative">
                    {selectedReader.profileImage ? (
                      <img src={selectedReader.profileImage} alt={selectedReader.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* User Details */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <h2 id="modal-title-reader" className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {selectedReader.name || 'Anonymous User'}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                    {selectedReader.isLifeMember ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 text-amber-400 border border-amber-800/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Crown size={12} />
                        <span>Life Member</span>
                      </div>
                    ) : selectedReader.isSubscribed ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle2 size={12} />
                        <span>Active Subscriber</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-400 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <User size={12} />
                        <span>Standard Reader</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-zinc-400 text-xs">
                      <Calendar size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Joined {formatDate(selectedReader.regDate)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                    USER ID: {selectedReader.id}
                  </p>
                </div>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Information */}
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-zinc-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white">Contact Info</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                        Email Address
                      </span>
                      <span className="text-white font-medium break-all">{selectedReader.email || 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                        Phone Number
                      </span>
                      <span className="text-white font-medium">{selectedReader.phone || 'Not provided'}</span>
                    </div>

                    {selectedReader.designation && (
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                          Designation / Role
                        </span>
                        <span className="text-white font-medium">{selectedReader.designation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscription & Pass Information */}
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-zinc-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white">Subscription Pass</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                        Membership Tier
                      </span>
                      <span className="text-white font-bold">
                        {selectedReader.isLifeMember 
                          ? 'BKMA Life Membership' 
                          : selectedReader.isSubscribed 
                            ? (selectedReader.subscriptionPlan === 'annual' ? 'BKMA Annual Pass' : 'Active Subscription Pass')
                            : 'Standard Reader (Unsubscribed)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                        Validity & Expiration
                      </span>
                      <span className="text-white font-medium">
                        {selectedReader.isLifeMember 
                          ? 'Permanent / Lifetime Validity' 
                          : selectedReader.subscriptionExpiresAt 
                            ? `Valid until ${formatDate(selectedReader.subscriptionExpiresAt)}`
                            : selectedReader.isSubscribed ? 'Active' : 'No active pass'}
                      </span>
                    </div>

                    {selectedReader.subscriptionStartedAt && (
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                          Activated On
                        </span>
                        <span className="text-zinc-400 font-medium">
                          {formatDate(selectedReader.subscriptionStartedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio / Notes */}
              {selectedReader.bio && (
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                    Reader Biography
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    "{selectedReader.bio}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-white/10 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl tracking-wider uppercase transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReadersList;
