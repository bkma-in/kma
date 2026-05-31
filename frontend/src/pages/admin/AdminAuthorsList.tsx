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
  Briefcase
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getAuthors } from '../../services/user.service';

interface Author {
  id: string;
  name: string;
  email: string;
  affiliation: string;
  regDate: string;
}

const AdminAuthorsList = () => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);
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
    fetchAuthorsList();
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div 
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title-author"
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20"
          >
            {/* Modal Header */}
            <div className="px-8 py-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 id="modal-title-author" className="text-xl font-bold text-black tracking-tight font-['Outfit']">{selectedAuthor.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{selectedAuthor.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black transition-all animate-focus"
                aria-label="Close Author Details Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  <Mail size={12} />
                  Verified Email
                </div>
                <p className="text-sm font-bold text-black">{selectedAuthor.email}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  <Calendar size={12} />
                  Registration Timestamp
                </div>
                <p className="text-sm font-bold text-black">
                  {new Date(selectedAuthor.regDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(selectedAuthor.regDate).toLocaleTimeString()}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <Briefcase size={14} />
                  Academic Affiliation
                </div>
                <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm font-medium text-zinc-700">
                  {selectedAuthor.affiliation}
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all uppercase mt-4"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuthorsList;
