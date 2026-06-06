import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Eye, 
  Users, 
  Calendar, 
  Mail, 
  BookOpen, 
  Loader2,
  X,
  Briefcase,
  Phone,
  FileText,
  Award,
  Shield,
  User
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getAuthors } from '../../services/user.service';
import { getArticles } from '../../services/article.service';

interface Author {
  id: string;
  name: string;
  email: string;
  affiliation: string;
  regDate: string;
  phone?: string;
  designation?: string;
  bio?: string;
  profileImage?: string | null;
}

const AdminAuthorsList = () => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchAuthorsList = async () => {
      try {
        const response = await getAuthors();
        if (response.success) {
          setAuthors(response.authors);
        }
      } catch (error) {
        console.error('Failed to load authors:', error);
        showToast('Failed to load authors list.', 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchArticlesList = async () => {
      try {
        const response = await getArticles();
        if (response.success) {
          setArticles(response.articles);
        }
      } catch (error) {
        console.error('Failed to load articles:', error);
      }
    };

    fetchAuthorsList();
    fetchArticlesList();
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

      // Focus first focusable element (close button)
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'draft':
      case 'Draft': return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      case 'submitted':
      case 'Submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'under_review':
      case 'Under Review': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'revision_requested':
      case 'Needs Revision': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'accepted':
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rejected':
      case 'Rejected': return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
  };

  const authorArticles = selectedAuthor 
    ? articles.filter(art => 
        (art.authorId === selectedAuthor.id || 
         art.authors?.some((a: any) => a.userId === selectedAuthor.id)) &&
        art.status?.toLowerCase() !== 'draft'
      )
    : [];

  const filteredAuthors = authors.filter(auth => {
    return auth.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           auth.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           auth.affiliation.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openDetails = (author: Author) => {
    setSelectedAuthor(author);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <Users size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">User Directory</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Author Directory</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-xl leading-relaxed">Browse researchers, audit academic affiliations, and inspect active submitting contributors.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, email, or affiliation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-64 md:w-80 focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl shadow-black/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Author Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Academic Affiliation</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Registered</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredAuthors.map((author) => (
                <tr key={author.id} className="group hover:bg-zinc-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-black font-['Outfit']">{author.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{author.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-zinc-600 font-medium line-clamp-1 max-w-[250px]">
                      {author.affiliation}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs text-zinc-500 font-medium text-center">
                    {new Date(author.regDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openDetails(author)}
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-all"
                        title="View Detailed Profile"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAuthors.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-zinc-400 text-sm">
                    {searchTerm.trim() !== "" ? "No authors match your search query." : "No authors registered in the association yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Author Details Modal */}
      {isModalOpen && selectedAuthor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          <div 
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title-author"
            className="relative w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[95vh] sm:rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-white/10 overflow-hidden"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/40 to-transparent z-0 h-48" />

            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-20 p-2 hover:bg-white/10 rounded-full transition-all"
              aria-label="Close Author Details Modal"
            >
              <X size={20} />
            </button>

            {/* Modal Content */}
            <div className="relative z-10 flex flex-col overflow-y-auto flex-1 min-h-0 p-6 sm:p-10 space-y-8 custom-scrollbar">
              {/* Top Banner Section */}
              <div className="bg-zinc-900/50 backdrop-blur-md rounded-[2rem] border border-white/5 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-50" />
                
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center relative">
                    {selectedAuthor.profileImage ? (
                      <img src={selectedAuthor.profileImage} alt={selectedAuthor.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-zinc-600" />
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left relative z-10">
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">{selectedAuthor.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800/80 rounded-full border border-white/10">
                      <Shield size={14} className="text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">AUTHOR</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        JOINED {new Date(selectedAuthor.regDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs italic mb-2">Verified member of the Kerala Mathematical Association</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">ID: {selectedAuthor.id}</p>
                </div>

                {/* About Me Section */}
                <div className="w-full md:w-72 shrink-0">
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 h-full relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">About Me</h3>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                      {selectedAuthor.bio || "I am an author of KMA"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Cards Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5">
                  <div className="flex items-center gap-3 mb-8">
                    <Users size={18} className="text-zinc-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Account Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Full Name</label>
                      <p className="text-sm font-bold text-white">{selectedAuthor.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
                      <p className="text-sm font-bold text-white">{selectedAuthor.email}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Phone Number</label>
                      <p className={cn("text-sm font-bold", selectedAuthor.phone ? "text-white" : "text-zinc-600 italic")}>
                        {selectedAuthor.phone || "Not provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Designation</label>
                      <p className={cn("text-sm font-bold", selectedAuthor.designation ? "text-white" : "text-zinc-600 italic")}>
                        {selectedAuthor.designation || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credibility Card */}
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                    <Award size={32} />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Author Credibility</h3>
                  <p className="text-[11px] text-zinc-500 max-w-[240px] leading-relaxed">
                    Verified scholar with high-impact research contributions.
                  </p>
                </div>
              </div>

              {/* Submitted Manuscripts Section */}
              <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-zinc-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Submitted Manuscripts ({authorArticles.length})</h3>
                </div>
                
                {authorArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {authorArticles.map((art) => (
                      <div 
                        key={art.articleId} 
                        className="p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                            {art.title}
                          </h4>
                          <span className={cn(
                            "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                            getStatusStyles(art.status)
                          )}>
                            {art.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                          <span>ID: {art.articleId}</span>
                          <span>
                            {art.createdAt && new Date(art.createdAt?._seconds ? art.createdAt._seconds * 1000 : art.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-8 text-center bg-white/5 border border-white/5 rounded-2xl">
                    No manuscripts submitted yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuthorsList;
