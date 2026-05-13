
import React, { useState, useEffect } from 'react';
import { CheckCircle2, FileEdit, MessageSquare, Info, Clock, AlertCircle, Loader2, Archive, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getArticles } from '../../services/article.service';
import { useNavigate, NavLink } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('archivedNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [readIds, setReadIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('readNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('UNREAD');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await getArticles();
        if (response.success) {
          setArticles(response.articles);
        }
      } catch (error) {
        console.error('Failed to fetch articles for notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'RECENTLY';
    const seconds = createdAt._seconds || (typeof createdAt === 'number' ? createdAt / 1000 : null);
    if (!seconds) return 'RECENTLY';
    
    const date = new Date(seconds * 1000);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'JUST NOW';
    if (diffInHours < 24) return `${diffInHours}H AGO`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const getDynamicNotifications = () => {
    return articles.map((article, index) => {
      const status = article.status;
      let config = {
        title: 'Article Submitted',
        icon: Clock,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        content: `Your manuscript "${article.title}" has been successfully received and is entering initial screening.`,
        action: 'TRACK PROGRESS'
      };

      if (status === 'revision_requested') {
        config = {
          title: 'Revision Requested',
          icon: FileEdit,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          content: `The Editorial Board has requested minor adjustments to "${article.title}" to align with Volume 12 standards.`,
          action: 'EDIT MANUSCRIPT'
        };
      } else if (status === 'accepted') {
        config = {
          title: 'Article Approved',
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          content: `Congratulations! "${article.title}" has been formally approved for publication.`,
          action: 'VIEW PUBLICATION'
        };
      } else if (status === 'rejected') {
        config = {
          title: 'Review Decision',
          icon: AlertCircle,
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-600',
          content: `The review process for "${article.title}" has concluded. Please see detailed feedback in the portal.`,
          action: 'VIEW FEEDBACK'
        };
      } else if (status === 'under_review') {
        config = {
          title: 'Peer Review Started',
          icon: MessageSquare,
          iconBg: 'bg-zinc-100',
          iconColor: 'text-zinc-600',
          content: `Your article "${article.title}" has been assigned to peer reviewers for assessment.`,
          action: 'VIEW DETAILS'
        };
      }

      return {
        id: article.articleId || index,
        ...config,
        time: formatTime(article.createdAt),
        unread: !readIds.includes(article.articleId),
      };
    }).sort((a, b) => {
      const timeA = a.time === 'JUST NOW' ? Infinity : parseInt(a.time) || 0;
      const timeB = b.time === 'JUST NOW' ? Infinity : parseInt(b.time) || 0;
      return timeB - timeA;
    });
  };

  const handleArchive = (id: string) => {
    const newArchived = [...archivedIds, id];
    setArchivedIds(newArchived);
    localStorage.setItem('archivedNotifications', JSON.stringify(newArchived));
  };

  const handleUnarchive = (id: string) => {
    const newArchived = archivedIds.filter(i => i !== id);
    setArchivedIds(newArchived);
    localStorage.setItem('archivedNotifications', JSON.stringify(newArchived));
  };

  const handleMarkAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const newRead = [...readIds, id];
      setReadIds(newRead);
      localStorage.setItem('readNotifications', JSON.stringify(newRead));
    }
  };

  const handleAction = (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    handleMarkAsRead(notification.id);

    const articleId = notification.id;
    
    switch (notification.title) {
      case 'Article Submitted':
      case 'Peer Review Started':
      case 'Article Approved':
      case 'Review Decision':
        navigate('/author/articles', { state: { highlightId: articleId } });
        break;
      case 'Revision Requested':
        navigate('/author/submit', { state: { draft: articles.find(a => a.articleId === articleId) } });
        break;
      default:
        navigate('/author/dashboard');
    }
  };

  const notifications = getDynamicNotifications();
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return n.unread && !archivedIds.includes(n.id);
    if (activeTab === 'ALL') return !archivedIds.includes(n.id);
    return archivedIds.includes(n.id);
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-2">NOTIFICATIONS</h1>
        <p className="text-zinc-500 text-sm uppercase tracking-wider font-medium">
          STATUS UPDATES AND PORTAL ACTIVITY FOR YOUR RESEARCH
        </p>
      </div>

      <div className="flex items-center gap-8 border-b border-zinc-200 mb-8">
        {['UNREAD', 'ALL', 'ARCHIVED'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-4 text-xs font-bold uppercase tracking-wider relative transition-all",
              activeTab === tab ? "text-black" : "text-zinc-400 hover:text-black"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black animate-in slide-in-from-left-2 duration-300"></div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredNotifications.length > 0 ? filteredNotifications.map((notification) => (
          <div 
            key={notification.id} 
            onClick={() => handleMarkAsRead(notification.id)}
            className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm relative group hover:border-black transition-all cursor-default overflow-hidden"
          >
            {notification.unread && activeTab !== 'ARCHIVED' && (
              <div className="absolute right-8 top-10 w-2 h-2 rounded-full bg-black"></div>
            )}
            
            <div className="flex gap-6">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", notification.iconBg)}>
                <notification.icon size={20} className={notification.iconColor} />
              </div>
              
              <div className="flex-1 pr-12">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-black font-['Outfit']">{notification.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full">
                      {notification.time}
                    </span>
                    {activeTab === 'ARCHIVED' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUnarchive(notification.id); }}
                        className="p-1.5 text-zinc-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2"
                        title="Restore Notification"
                      >
                        <RotateCcw size={14} />
                        <span className="text-[8px] font-black uppercase">Restore</span>
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleArchive(notification.id); }}
                        className="p-1.5 text-zinc-300 hover:text-black hover:bg-zinc-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Archive Notification"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-zinc-500 leading-relaxed mb-6 font-medium">
                  {notification.content}
                </p>
                
                <div className="flex items-center gap-6">
                  {notification.action === 'EDIT MANUSCRIPT' ? (
                    <button 
                      onClick={(e) => handleAction(e, notification)}
                      className="text-[10px] font-black text-black uppercase tracking-widest hover:underline underline-offset-8 transition-all"
                    >
                      {notification.action}
                    </button>
                  ) : (
                    <NavLink 
                      to="/author/articles"
                      state={{ highlightId: notification.id }}
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-[10px] font-black text-black uppercase tracking-widest hover:underline underline-offset-8 transition-all"
                    >
                      {notification.action}
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <Info className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No notifications to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
