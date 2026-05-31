import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  History, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  UserPlus,
  ShieldCheck,
  Settings,
  Bell,
  Loader2,
  X,
  Search
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { NavLink } from 'react-router-dom';
import { getArticles } from '../../services/article.service';
import { getReviewers } from '../../services/user.service';
import { useProfile } from '../../hooks/useProfile';
import { formatDate } from '../../utils/dateHelpers';

const AdminDashboard = () => {
  const { profile } = useProfile();
  const [articles, setArticles] = useState<any[]>([]);
  const [reviewerRequestsCount, setReviewerRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsSearchTerm, setLogsSearchTerm] = useState('');

  useEffect(() => {
    if (isLogsOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsLogsOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLogsOpen]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, reviewersRes] = await Promise.all([
          getArticles(),
          getReviewers()
        ]);
        if (articlesRes.success) {
          setArticles(articlesRes.articles);
        }
        if (reviewersRes.success) {
          const pending = reviewersRes.reviewers.filter((r: any) => r.status === 'Pending');
          setReviewerRequestsCount(pending.length);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingAdminCount = articles.filter(a => a.status === 'submitted').length;
  const underReviewCount = articles.filter(a => a.status === 'under_review').length;

  const stats = [
    { label: 'Total Articles', value: articles.length.toString(), icon: FileText, color: 'text-zinc-600', bg: 'bg-zinc-100' },
    { label: 'Decision Required', value: pendingAdminCount.toString(), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Under Review', value: underReviewCount.toString(), icon: History, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: articles.filter(a => a.status === 'accepted' || a.status === 'published').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected', value: articles.filter(a => a.status === 'rejected' || a.status === 'desk_rejected').length.toString(), icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const activities = articles.slice(0, 4).map(a => ({
    title: a.status === 'submitted' ? 'New Article Submitted' :
           a.status === 'under_review' ? 'Reviewer Assigned' :
           a.status === 'revision_requested' ? 'Revision Requested' :
           a.status === 'accepted' ? 'Article Published' : 'Status Updated',
    detail: a.title,
    time: formatDate(a.createdAt),
    type: a.status === 'submitted' ? 'submission' :
          a.status === 'under_review' ? 'assignment' :
          a.status === 'revision_requested' ? 'revision' : 'published'
  }));

  const filteredLogs = articles
    .map(a => ({
      title: a.status === 'submitted' ? 'New Article Submitted' :
             a.status === 'under_review' ? 'Reviewer Assigned' :
             a.status === 'revision_requested' ? 'Revision Requested' :
             a.status === 'accepted' ? 'Article Published' : 'Status Updated',
      detail: a.title,
      time: formatDate(a.createdAt),
      type: a.status === 'submitted' ? 'submission' :
            a.status === 'under_review' ? 'assignment' :
            a.status === 'revision_requested' ? 'revision' : 'published'
    }))
    .filter(log => log.detail.toLowerCase().includes(logsSearchTerm.toLowerCase()) || log.title.toLowerCase().includes(logsSearchTerm.toLowerCase()));

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
          <h1 className="text-4xl font-bold tracking-tighter text-black">System Overview</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-md">Welcome back, <span className="font-bold text-black">{profile?.name || localStorage.getItem('userName') || 'Head Administrator'}</span>. Global system activity is stable with <span className="font-bold text-blue-600">{pendingAdminCount} items</span> requiring your final decision.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm">
          <ShieldCheck size={16} className="text-zinc-400" />
          <span className="text-[10px] font-black text-black tracking-widest uppercase">System Control Center</span>
        </div>
      </div>

      {/* Alert Section - Final Decision Action */}
      {pendingAdminCount > 0 && (
        <div className="mb-8 p-4 bg-zinc-900 text-white rounded-2xl flex items-center justify-between shadow-xl shadow-black/10 animate-pulse-slow">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <AlertCircle size={20} className="text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight">Final Decisions Required</h4>
              <p className="text-[10px] opacity-60 font-medium uppercase tracking-widest">You have {pendingAdminCount} manuscripts awaiting your final action (Publish/Reject/Send Back)</p>
            </div>
          </div>
          <NavLink to="/admin/articles" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all uppercase">
            Review Queue
          </NavLink>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg block group hover:border-black transition-all"
          >
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

      {/* Reviewer Onboarding Section */}
      <div className="mb-10 bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 bg-zinc-50/50 backdrop-blur-sm rounded-2xl flex items-center justify-center text-zinc-400 shadow-inner border border-white/10">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-widest">Reviewer Onboarding</h3>
            <p className="text-xs text-zinc-500 mt-1">There are <span className="font-bold text-black">{reviewerRequestsCount} pending applications</span> for expert reviewer roles.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-[10px] font-black tracking-widest transition-all uppercase">
          View Requests
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Activity & Quick Actions */}
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase mb-4 px-1">Control Hub</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NavLink to="/admin/articles" className="group p-6 bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl shadow-lg hover:border-black transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black uppercase tracking-widest">Manage Articles</h4>
                    <p className="text-[10px] text-zinc-400 font-medium">Review and assign manuscripts</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-200 group-hover:text-black transition-all" />
              </NavLink>
              <NavLink to="/admin/reviewers" className="group p-6 bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl shadow-lg hover:border-black transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black uppercase tracking-widest">Manage Reviewers</h4>
                    <p className="text-[10px] text-zinc-400 font-medium">Verify credentials and expertise</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-200 group-hover:text-black transition-all" />
              </NavLink>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-xl p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
                  <History size={16} />
                </div>
                <h3 className="text-sm font-bold text-black uppercase tracking-widest">Global Activity Feed</h3>
              </div>
              <NavLink to="/admin/articles" className="text-[10px] font-black text-zinc-400 hover:text-black transition-all uppercase tracking-widest">
                Full Audit Log
              </NavLink>
            </div>
            
            <div className="space-y-8">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-6 relative group">
                  {i !== activities.length - 1 && (
                    <div className="absolute left-3 top-10 bottom-0 w-[1px] bg-zinc-100" />
                  )}
                  <div className="relative z-10 w-6 h-6 rounded-full bg-zinc-100 border-4 border-white flex items-center justify-center mt-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      act.type === 'submission' ? 'bg-blue-500' :
                      act.type === 'assignment' ? 'bg-amber-500' :
                      act.type === 'revision' ? 'bg-rose-500' : 'bg-emerald-500'
                    )} />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-black">{act.title}</h4>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{act.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 italic">"{act.detail}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: System Status & Notifications */}
        <div className="space-y-10">
          {/* Notifications */}
          <div className="bg-zinc-900/90 backdrop-blur-lg text-white rounded-[2.5rem] p-10 shadow-2xl shadow-black/20 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <Bell size={18} className="text-zinc-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest">System Notifications</h3>
            </div>

            <div className="space-y-8 mb-10">
              <div className="group cursor-pointer">
                <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors leading-relaxed mb-1">
                  "SSL Certificate for the Global Archive domain is scheduled for renewal in 15 days."
                </p>
                <span className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">Infrastructure</span>
              </div>
              <div className="group cursor-pointer">
                <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors leading-relaxed mb-1">
                  "API rate limits for the reviewer portal reached 85% utilization in the last hour."
                </p>
                <span className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">Performance</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setIsLogsOpen(true);
                setLogsSearchTerm('');
              }}
              className="w-full py-4 bg-white/10 hover:bg-white text-zinc-300 hover:text-black rounded-2xl text-[10px] font-black tracking-widest transition-all uppercase flex items-center justify-center gap-2 group"
            >
              Global Logs
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>

      {/* Global Logs Side Panel */}
      {isLogsOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end text-left">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsLogsOpen(false)} />
          
          {/* Drawer Container */}
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title-logs"
            className="relative w-full max-w-lg bg-zinc-950 text-white h-full shadow-2xl flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="px-8 py-8 border-b border-white/10 flex items-center justify-between bg-zinc-900/40 backdrop-blur-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <History size={18} className="text-zinc-300" />
                </div>
                <div>
                  <h3 id="modal-title-logs" className="text-lg font-bold tracking-tight">System Activity Logs</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global Audit Trail</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogsOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                aria-label="Close System Activity Logs"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search filter */}
            <div className="px-8 py-5 border-b border-white/5 bg-zinc-900/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search logs by article title..."
                  value={logsSearchTerm}
                  onChange={(e) => setLogsSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-medium text-white focus:ring-1 focus:ring-white outline-none transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Scrollable logs list */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {filteredLogs.map((log, i) => (
                <div key={i} className="flex gap-4 relative group">
                  <div className="relative z-10 w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mt-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      log.type === 'submission' ? 'bg-blue-500' :
                      log.type === 'assignment' ? 'bg-amber-500' :
                      log.type === 'revision' ? 'bg-rose-500' : 'bg-emerald-500'
                    )} />
                  </div>
                  <div className="flex-1 border-b border-white/5 pb-4">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-bold text-white">{log.title}</h4>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{log.time}</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium italic">"{log.detail}"</p>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-10 text-zinc-600 text-xs">
                  No activity logs found.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-white/10 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between text-xs text-zinc-500">
              <span>Total Activity Records: {articles.length}</span>
              <button 
                onClick={() => setIsLogsOpen(false)}
                className="px-4 py-2 bg-white text-black font-bold text-[10px] rounded-lg tracking-widest hover:bg-zinc-200 transition-all uppercase"
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

export default AdminDashboard;
