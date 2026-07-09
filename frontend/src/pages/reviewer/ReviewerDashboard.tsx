import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  ArrowRight, 
  ChevronRight,
  TrendingUp,
  FileText,
  Bell,
  Star,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { NavLink } from 'react-router-dom';
import { getArticles } from '../../services/article.service';
import { useProfile } from '../../hooks/useProfile';
import { formatDate } from '../../utils/dateHelpers';

const ReviewerDashboard = () => {
  const { profile } = useProfile();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await getArticles();
        if (response.success) {
          setArticles(response.articles);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const pendingReviewsCount = articles.filter(a => a.status === 'under_review').length;
  const completedReviewsCount = articles.filter(a => ['accepted', 'rejected', 'revision_requested'].includes(a.status)).length;

  const stats = [
    { label: 'Assigned Articles', value: articles.length.toString(), icon: BookOpen, color: 'text-zinc-600', bg: 'bg-zinc-100' },
    { label: 'Pending Reviews', value: pendingReviewsCount.toString().padStart(2, '0'), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Reviews', value: completedReviewsCount.toString().padStart(2, '0'), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const activities = articles.slice(0, 3).map(a => ({
    title: a.status === 'under_review' ? 'New Article Assigned' :
           a.status === 'accepted' ? 'Review Submitted' : 'Status Updated',
    detail: a.title,
    time: formatDate(a.createdAt),
    icon: a.status === 'accepted' ? CheckCircle2 : FileText,
    iconColor: a.status === 'accepted' ? 'text-emerald-500' : 'text-blue-500',
    bgColor: a.status === 'accepted' ? 'bg-emerald-50' : 'bg-blue-50'
  }));

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Reviewer Overview</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-md">Welcome back, <span className="font-bold text-black">{profile?.name || localStorage.getItem('userName') || "Portal User"}</span>. You have <span className="font-bold text-amber-600">{pendingReviewsCount} pending reviews</span> that require your expertise.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm">
          <Star size={16} className="text-zinc-400" />
          <span className="text-[10px] font-black text-black tracking-widest uppercase">Senior Expert Reviewer</span>
        </div>
      </div>

      {/* Pending Alert Banner */}
      {pendingReviewsCount > 0 && (
        <div className="mb-8 p-4 bg-amber-500/90 backdrop-blur-md text-white rounded-2xl flex items-center justify-between shadow-xl shadow-amber-500/10 animate-in slide-in-from-top-4 duration-500 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight">Pending Tasks</h4>
              <p className="text-[10px] opacity-80 font-medium uppercase tracking-widest">You have {pendingReviewsCount} manuscripts awaiting your assessment</p>
            </div>
          </div>
          <NavLink to="/reviewer/articles" className="px-6 py-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-amber-600 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase border border-white/20">
            Start Reviewing
          </NavLink>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-lg group hover:border-black transition-all cursor-default">
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <TrendingUp size={18} className="text-zinc-200" />
            </div>
            <h3 className="text-4xl font-bold text-black tracking-tighter mb-1">{stat.value}</h3>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-lg">
                  <History size={16} />
                </div>
                <h3 className="text-sm font-bold text-black uppercase tracking-widest">Recent Activity</h3>
              </div>
              <NavLink to="/reviewer/articles" className="text-[10px] font-black text-zinc-400 hover:text-black transition-all uppercase tracking-widest flex items-center gap-1">
                View All <ChevronRight size={14} />
              </NavLink>
            </div>
            
            <div className="space-y-6">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-5 relative group">
                  {i !== activities.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-[1px] bg-zinc-100/50" />
                  )}
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 border border-white/10", act.bgColor, act.iconColor)}>
                    <act.icon size={20} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-black">{act.title}</h4>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{act.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 italic">"{act.detail}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Helpful Info */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-zinc-900/90 backdrop-blur-lg text-white rounded-[2.5rem] p-8 shadow-2xl shadow-black/10 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-zinc-500 relative z-10">Navigation</h3>
            <div className="space-y-3 relative z-10">
              <NavLink 
                to="/reviewer/articles" 
                className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase flex items-center justify-center gap-3 active:scale-95 border border-white/5 shadow-lg"
              >
                <BookOpen size={18} />
                View Assigned Articles
              </NavLink>
              <NavLink 
                to="/reviewer/notifications" 
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase flex items-center justify-center gap-3 active:scale-95 border border-white/5"
              >
                <Bell size={18} />
                Notifications
              </NavLink>
            </div>
          </div>

          {/* Peer Review Guidelines */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl p-8">
            <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-6">Expert Resources</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/60 transition-all border border-white/10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-black border border-white/50">
                    <Star size={16} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Reviewer Handbook</span>
                </div>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-black" />
              </div>
              <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/60 transition-all border border-white/10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-black border border-white/50">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quality Standards</span>
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

export default ReviewerDashboard;
