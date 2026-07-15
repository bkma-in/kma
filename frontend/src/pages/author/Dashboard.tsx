import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  BookOpen, 
  Clock, 
  History, 
  Bell, 
  ArrowRight, 
  ChevronRight,
  TrendingUp,
  FileEdit,
  Inbox,
  Loader2,
  XCircle,
  UserPlus
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { NavLink } from 'react-router-dom';
import { getArticles } from '../../services/article.service';
import { useProfile } from '../../hooks/useProfile';

const Dashboard = () => {
  const { profile } = useProfile();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await getArticles();
        if (response.success) {
          // Filter articles based on visibility rules
          const filteredArticles = response.articles.filter((a: any) => {
            // 1. Submitter (C): Always sees the article
            if (!profile?.uid) return false;
            if (a.authorId === profile?.uid) return true;
            
            // Find user in authors array
            const authorData = a.authors?.find((author: any) => author.userId === profile?.uid);
            if (!authorData) return false; // If not primary and not a co-author, hide it
            
            // 2. Rejected (B): Hide if rejected
            if (authorData.status === 'rejected') return false;
            
            // 5. Accepted: Always visible
            if (authorData.accepted === true) return true;
            
            // At this point, the user's invitation is pending (accepted === false and not rejected)
            
            // 3 & 4. Pending: Visible only if the article is still a Draft
            // If the article is no longer a draft (e.g. submitted), it is too late and should be hidden.
            if (a.status !== 'draft') return false;
            
            return true;
          });
          
          filteredArticles.sort((a: any, b: any) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeB - timeA;
          });

          setArticles(filteredArticles);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.uid) {
      fetchArticles();
    }
  }, [profile?.uid]);

  // Calculate dynamic stats
  const stats = [
    { 
      label: 'Total Articles', 
      value: articles.filter(a => !(a.status === 'draft' && a.authorId === profile?.uid && (!a.participantIds || a.participantIds.length <= 1))).length.toString().padStart(2, '0'), 
      icon: FileText, 
      color: 'text-zinc-600', 
      bg: 'bg-zinc-100' 
    },
    { 
      label: 'Under Review', 
      value: articles.filter(a => a.status === 'under_review' || a.status === 'submitted').length.toString().padStart(2, '0'), 
      icon: History, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Needs Revision', 
      value: articles.filter(a => a.status === 'revision_requested').length.toString().padStart(2, '0'), 
      icon: AlertCircle, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50' 
    },
    { 
      label: 'Approved', 
      value: articles.filter(a => a.status === 'accepted').length.toString().padStart(2, '0'), 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Rejected', 
      value: articles.filter(a => a.status === 'rejected').length.toString().padStart(2, '0'), 
      icon: XCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
    { 
      label: 'Drafts', 
      value: articles.filter(a => a.status === 'draft' && a.authorId === profile?.uid && (!a.participantIds || a.participantIds.length <= 1)).length.toString().padStart(2, '0'), 
      icon: Inbox, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    },
  ];

  const revisionArticles = articles.filter(a => a.status === 'revision_requested');
  const pendingInvitations = articles.filter(a => {
    const authorData = a.authors?.find((author: any) => author.userId === profile?.uid);
    // An invitation is pending if the user is in the authors list but hasn't accepted yet
    return authorData && authorData.accepted === false && authorData.status !== 'rejected';
  });

  const activities = articles.slice(0, 3).map(a => ({
    title: a.status === 'accepted' ? 'Article Approved' : 
           a.status === 'rejected' ? 'Article Rejected' :
           a.status === 'revision_requested' ? 'Revision Requested' : 'Article Submitted',
    detail: a.title,
    time: new Date(a.createdAt).toLocaleDateString(),
    icon: a.status === 'accepted' ? CheckCircle2 : 
          a.status === 'revision_requested' ? AlertCircle : SendIcon,
    iconColor: a.status === 'accepted' ? 'text-emerald-500' : 
               a.status === 'revision_requested' ? 'text-rose-500' : 'text-blue-500',
    bgColor: a.status === 'accepted' ? 'bg-emerald-50' : 
             a.status === 'revision_requested' ? 'bg-rose-50' : 'bg-blue-50'
  }));

  const notifications = [
    { message: 'Welcome to the BKMA Author Portal!', time: 'Now' }
  ];

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Author Overview</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-md">Welcome back, <span className="font-bold text-black">{profile?.name || localStorage.getItem('userName') || 'Author User'}</span>. Here is the latest activity across your research portfolio.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm">
          <Clock size={16} className="text-zinc-400" />
          <span className="text-[10px] font-black text-black tracking-widest uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 mb-4" />
              <div className="h-8 w-12 bg-zinc-100 rounded-lg mb-2" />
              <div className="h-3 w-16 bg-zinc-50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Alert Section - Revision Required */}
          {revisionArticles.map((article) => (
            <div key={article.articleId} className="mb-6 p-4 bg-rose-600/90 backdrop-blur-md text-white rounded-2xl flex items-center justify-between shadow-xl shadow-rose-600/10 animate-pulse-slow border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">Revision Required</h4>
                  <p className="text-[10px] opacity-80 font-medium uppercase tracking-widest">{article.title} needs your attention</p>
                </div>
              </div>
              <NavLink to={`/author/articles`} className="px-6 py-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-rose-600 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase border border-white/20 text-center">
                Review Comments
              </NavLink>
            </div>
          ))}

          {/* Alert Section - Co-author Invitations */}
          {pendingInvitations.map((article) => {
            const inviter = article.authors?.find((au: any) => au.role === 'submitter')?.name || 'Another Author';
            return (
              <div key={article.articleId} className="mb-6 p-4 bg-indigo-600/90 backdrop-blur-md text-white rounded-2xl flex items-center justify-between shadow-xl shadow-indigo-600/10 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-tight">Co-author Invitation</h4>
                    <p className="text-[10px] opacity-80 font-medium uppercase tracking-widest">
                      {inviter} invited you to co-author: {article.title}
                    </p>
                  </div>
                </div>
                <NavLink to="/author/articles" className="px-6 py-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-indigo-600 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase border border-white/20 text-center">
                  View Invitation
                </NavLink>
              </div>
            );
          })}

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm group hover:border-black transition-all cursor-default">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                    <stat.icon size={20} />
                  </div>
                  <TrendingUp size={16} className="text-zinc-200" />
                </div>
                <h3 className="text-3xl font-bold text-black tracking-tighter mb-1">{stat.value}</h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <NavLink to="/author/submit" className="flex items-center gap-4 p-4 bg-zinc-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 group border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl -mr-10 -mt-10" />
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center relative z-10">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-bold tracking-widest relative z-10">SUBMIT NEW</span>
              </NavLink>
              <NavLink to="/author/articles" className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl shadow-lg hover:border-black transition-all active:scale-95 group">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-black transition-all shadow-sm">
                  <BookOpen size={20} />
                </div>
                <span className="text-xs font-bold tracking-widest text-black">MY ARTICLES</span>
              </NavLink>
              <NavLink to="/author/drafts" className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl shadow-lg hover:border-black transition-all active:scale-95 group">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-black transition-all shadow-sm">
                  <Inbox size={20} />
                </div>
                <span className="text-xs font-bold tracking-widest text-black">DRAFTS</span>
              </NavLink>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <History size={18} className="text-zinc-400" />
                <h3 className="text-sm font-bold text-black uppercase tracking-widest">Recent Activity</h3>
              </div>
              <NavLink to="/author/articles" className="text-[10px] font-black text-zinc-400 hover:text-black transition-all uppercase tracking-widest flex items-center gap-1">
                View Timeline <ChevronRight size={14} />
              </NavLink>
            </div>
            
            <div className="space-y-6">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== activities.length - 1 && (
                    <div className="absolute left-6 top-10 bottom-0 w-[1px] bg-zinc-100" />
                  )}
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", act.bgColor, act.iconColor)}>
                    <act.icon size={20} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-black">{act.title}</h4>
                      <span className="text-[10px] text-zinc-400 font-medium">{act.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1">{act.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Archive Focus */}
        <div className="space-y-8">
          {/* Categories / Helpful Info */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
            <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-6">Archive Focus</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/60 transition-all border border-white/10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-black border border-white/50">
                    <FileEdit size={16} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Formatting Guide</span>
                </div>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-black" />
              </div>
              <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/60 transition-all border border-white/10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-black border border-white/50">
                    <ArchiveIcon size={16} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Journal Ethics</span>
                </div>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Send Icon helper
const SendIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const ArchiveIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="21 8 21 21 3 21 3 8"></polyline>
    <rect x="1" y="3" width="22" height="5"></rect>
    <line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
);

export default Dashboard;
