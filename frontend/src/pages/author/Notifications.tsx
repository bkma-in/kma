
import { CheckCircle2, FileEdit, MessageSquare, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

const Notifications = () => {
  const notifications = [
    {
      id: 1,
      type: 'approved',
      title: 'Article Approved',
      time: '2H AGO',
      unread: true,
      icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      content: 'Your submission "Topological Manifolds in Higher-Order Dimensions" has been formally approved by the Editorial Board for publication in Volume 12, Issue 4.',
      action: 'VIEW STATUS'
    },
    {
      id: 2,
      type: 'revision',
      title: 'Revision Requested',
      time: 'YESTERDAY',
      unread: true,
      icon: FileEdit,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      content: 'Reviewer #3 has submitted feedback regarding Section 4.2 of your draft. Minor structural adjustments are required before final typesetting can begin.',
      action: 'EDIT DRAFT',
      secondaryAction: 'READ COMMENTS'
    },
    {
      id: 3,
      type: 'review',
      title: 'Peer Review Completed',
      time: 'OCT 24',
      unread: false,
      icon: MessageSquare,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      content: 'The double-blind peer review for "Stochastic Modeling in Neural Networks" is now complete. Summary reports are available in your author dashboard.',
      action: 'DOWNLOAD REPORT'
    },
    {
      id: 4,
      type: 'info',
      title: 'Volume 12 Guidelines Updated',
      time: 'OCT 20',
      unread: false,
      icon: Info,
      iconBg: 'bg-zinc-100',
      iconColor: 'text-zinc-500',
      content: 'The KMA Archive has updated its citation formatting guidelines for the upcoming annual print edition. Please review the updated TeX template.',
      action: 'VIEW GUIDELINES'
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-2">NOTIFICATIONS</h1>
        <p className="text-zinc-500 text-sm uppercase tracking-wider font-medium">
          STATUS UPDATES AND PORTAL ACTIVITY FOR VOLUME 12
        </p>
      </div>

      <div className="flex items-center gap-8 border-b border-zinc-200 mb-8">
        {['ALL', 'UNREAD', 'ARCHIVED'].map((tab, i) => (
          <button 
            key={tab}
            className={cn(
              "pb-4 text-xs font-bold uppercase tracking-wider relative",
              i === 0 ? "text-black" : "text-zinc-400 hover:text-black transition-colors"
            )}
          >
            {tab}
            {i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm relative group">
            {notification.unread && (
              <div className="absolute right-8 top-10 w-2 h-2 rounded-full bg-black"></div>
            )}
            
            <div className="flex gap-6">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", notification.iconBg)}>
                <notification.icon size={20} className={notification.iconColor} />
              </div>
              
              <div className="flex-1 pr-12">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-black">{notification.title}</h3>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-100 px-3 py-1 rounded-full">
                    {notification.time}
                  </span>
                </div>
                
                <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                  {notification.content}
                </p>
                
                <div className="flex items-center gap-6">
                  <button className="text-[10px] font-bold text-black uppercase tracking-wider hover:underline underline-offset-4">
                    {notification.action}
                  </button>
                  {notification.secondaryAction && (
                    <button className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-black transition-colors">
                      {notification.secondaryAction}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <button className="bg-black text-white text-xs font-bold px-8 py-4 rounded-md uppercase tracking-wider hover:bg-zinc-800 transition-colors">
          LOAD PREVIOUS ALERTS
        </button>
      </div>
    </div>
  );
};

export default Notifications;
