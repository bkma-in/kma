import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Search, 
  ExternalLink, 
  Trash2, 
  Users,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import AuthorProfileModal from '../../components/AuthorProfileModal';
import ArticlePreviewModal from '../../components/ArticlePreviewModal';
import { useAuth } from '../../context/AuthContext';

export interface SavedArticleItem {
  id: string;
  articleId?: string;
  tag?: string;
  title: string;
  author: string;
  authors?: any[];
  date?: string;
  abstract?: string;
  keywords?: string;
  vol?: string;
  volume?: string;
  issueNumber?: number;
  issn?: string;
  monthYear?: string;
  savedAt?: string;
}

export const SAVED_STORAGE_KEY = 'kma_saved_articles';

export const getLocalSavedArticles = (): SavedArticleItem[] => {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read saved articles from localStorage:', err);
    return [];
  }
};

export const saveLocalArticle = (article: SavedArticleItem): boolean => {
  try {
    const current = getLocalSavedArticles();
    const targetId = article.id || article.articleId;
    if (current.some(item => (item.id || item.articleId) === targetId)) {
      return false; // Already saved
    }
    const updated = [
      {
        ...article,
        id: targetId,
        savedAt: new Date().toISOString()
      },
      ...current
    ];
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('kma_saved_articles_updated'));
    return true;
  } catch (err) {
    console.error('Failed to save article to localStorage:', err);
    return false;
  }
};

export const removeLocalSavedArticle = (articleId: string): boolean => {
  try {
    const current = getLocalSavedArticles();
    const updated = current.filter(item => (item.id || item.articleId) !== articleId);
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('kma_saved_articles_updated'));
    return true;
  } catch (err) {
    console.error('Failed to remove saved article from localStorage:', err);
    return false;
  }
};

export const isLocalArticleSaved = (articleId: string): boolean => {
  const current = getLocalSavedArticles();
  return current.some(item => (item.id || item.articleId) === articleId);
};

const ReaderSavedArticles = () => {
  const navigate = useNavigate();
  const { showToast, confirm } = useNotification();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [savedArticles, setSavedArticles] = useState<SavedArticleItem[]>([]);
  const [previewArticle, setPreviewArticle] = useState<SavedArticleItem | null>(null);

  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);

  const loadSaved = () => {
    setSavedArticles(getLocalSavedArticles());
  };

  useEffect(() => {
    loadSaved();
    const handleUpdate = () => loadSaved();
    window.addEventListener('kma_saved_articles_updated', handleUpdate);
    return () => window.removeEventListener('kma_saved_articles_updated', handleUpdate);
  }, []);

  const handleOpenAuthorProfile = (name: string, id?: string | null) => {
    setSelectedAuthor(name);
    setSelectedAuthorId(id || null);
    setIsAuthorModalOpen(true);
  };

  const handleRemoveArticle = (id: string, title: string) => {
    confirm({
      title: 'Remove Saved Article',
      message: `Are you sure you want to remove "${title}" from your saved collection?`,
      confirmText: 'Remove',
      onConfirm: () => {
        removeLocalSavedArticle(id);
        loadSaved();
        showToast('Article removed from saved collection', 'info');
      }
    });
  };

  const filteredArticles = savedArticles.filter(art => 
    (art.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (art.tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (art.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (art.abstract || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight font-['Outfit']">Saved Articles</h1>
          <p className="text-zinc-500 mt-1">Access your bookmarked research papers and scholarly work offline anytime.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text"
              placeholder="Search saved work..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black w-64 focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors flex items-center justify-center shadow-sm">
            <Filter size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((art) => (
            <div key={art.id} className="bg-white border border-zinc-200 rounded-3xl p-8 group hover:border-black transition-all flex flex-col shadow-sm hover:shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 bg-zinc-100 text-black rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                  {art.tag || 'Mathematics'}
                </span>
                {art.monthYear && (
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">{art.monthYear}</span>
                )}
              </div>

              <h3 className="text-xl font-bold text-black mb-4 group-hover:text-blue-600 transition-colors leading-tight font-['Outfit']">
                {art.title}
              </h3>
              
              <p className="text-sm text-zinc-500 leading-relaxed italic mb-8 line-clamp-3">
                "{art.abstract || 'Abstract summary unavailable.'}"
              </p>

              <div className="mt-auto space-y-6">
                <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                      <Users size={14} />
                    </div>
                    <div className="text-[10px]">
                      <button 
                        type="button"
                        onClick={() => handleOpenAuthorProfile(art.author, (art.authors && art.authors[0]?.userId) || null)}
                        className="font-bold text-black uppercase tracking-tight hover:text-blue-600 transition-colors text-left focus:outline-none cursor-pointer"
                        title="View Author Profile"
                      >
                        {art.author || 'Author'}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveArticle(art.id, art.title)}
                    className="p-3 bg-zinc-50 text-zinc-400 hover:text-rose-600 rounded-xl transition-all border border-zinc-100 shadow-sm cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <button 
                  onClick={() => setPreviewArticle(art)}
                  className="w-full py-4 bg-black text-white hover:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink size={16} /> Read Full Article
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-zinc-200 border-dashed p-8">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Bookmark size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black font-['Outfit']">No Saved Articles Yet</h3>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                You haven't bookmarked any research papers. Explore published journals from the Reader Dashboard and click the bookmark button to save them here.
              </p>
            </div>
            <button
              onClick={() => navigate('/reader/dashboard')}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold shadow-xl shadow-black/20 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Browse Reader Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Article Preview Modal */}
      {previewArticle && (
        <ArticlePreviewModal 
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
          isLoggedIn={!!currentUser}
        />
      )}

      {/* Author Profile Modal */}
      <AuthorProfileModal 
        isOpen={isAuthorModalOpen} 
        onClose={() => setIsAuthorModalOpen(false)} 
        authorName={selectedAuthor || ''}
        authorId={selectedAuthorId}
      />
    </div>
  );
};

export default ReaderSavedArticles;
