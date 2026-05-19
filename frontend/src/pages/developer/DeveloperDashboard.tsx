import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Activity,
  ArrowUpRight,
  Code2,
  Bug,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getReportedIssues } from '../../services/user.service';
import type { Issue } from '../../types/issue';

const DeveloperDashboard = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const response = await getReportedIssues();
        if (response.success) {
          setIssues(response.issues);
        }
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const stats = [
    { 
      label: 'Total Reports', 
      value: issues.length, 
      icon: Activity, 
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-400/5' 
    },
    { 
      label: 'Open Status', 
      value: issues.filter(i => i.status === 'Open').length, 
      icon: AlertCircle, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/5' 
    },
    { 
      label: 'In Progress', 
      value: issues.filter(i => i.status === 'In Progress').length, 
      icon: Clock, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/5' 
    },
    { 
      label: 'Resolved', 
      value: issues.filter(i => i.status === 'Resolved').length, 
      icon: CheckCircle2, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/5' 
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Code2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Engineering Overview</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Console Dashboard</h1>
          <p className="text-zinc-500 text-sm max-w-md">Real-time telemetry and incident reports across the KMA publishing platform.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className="group bg-white border border-zinc-200 p-6 rounded-2xl hover:border-black/10 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", stat.color.replace('text-', 'bg-'))} />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn("p-2.5 rounded-xl border border-zinc-100", stat.bgColor, stat.color)}>
                <stat.icon size={20} />
              </div>
              <ArrowUpRight size={16} className="text-zinc-300 group-hover:text-black transition-colors" />
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-black tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Issues List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
              <Bug size={20} className="text-zinc-400" />
              Latest Incidents
            </h3>
            <button className="text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-widest transition-colors">
              View All Logs
            </button>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            {issues.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {issues.slice(0, 5).map((issue) => (
                  <div key={issue.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        issue.status === 'Open' ? 'bg-amber-500' : 
                        issue.status === 'In Progress' ? 'bg-blue-500' : 'bg-emerald-500'
                      )} />
                      <div>
                        <h4 className="text-sm font-bold text-black group-hover:text-zinc-700 transition-colors">{issue.type}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{issue.id} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="hidden md:block text-[10px] text-zinc-500 font-medium italic truncate max-w-[200px]">
                        {issue.description}
                      </span>
                      <div className={cn(
                        "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border",
                        issue.status === 'Open' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        issue.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      )}>
                        {issue.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center flex flex-col items-center gap-4 opacity-20">
                <Bug size={48} className="text-zinc-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Zero Active Incidents</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health / Quick Actions */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
            <Zap size={20} className="text-zinc-400" />
            System Health
          </h3>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Storage API</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">99.9% Uptime</p>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[99%]" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Incident Response</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">1.4h AVG</p>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[75%]" />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button className="w-full py-3 px-4 bg-black text-white rounded-xl text-xs font-black tracking-widest hover:bg-zinc-800 transition-all active:scale-95 uppercase">
                System Diagnostics
              </button>
              <button className="w-full py-3 px-4 bg-zinc-100 text-zinc-500 rounded-xl text-xs font-black tracking-widest hover:text-black transition-all active:scale-95 uppercase border border-zinc-200">
                Review Build Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
