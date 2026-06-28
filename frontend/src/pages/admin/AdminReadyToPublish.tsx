import { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  UploadCloud,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getArticles, updateArticleStatus, bulkPublishArticles } from '../../services/article.service';
import { formatDate } from '../../utils/dateHelpers';

// Types
type ArticleStatus = 'Ready to Publish' | 'Published';

interface Version {
  version: number;
  uploadedBy: 'Author' | 'Reviewer';
  timestamp: string;
  fileName: string;
}

interface Article {
  id: string;
  title: string;
  author: string;
  category: string;
  abstract: string;
  status: ArticleStatus;
  assignedReviewers: string[];
  lastUpdated: string;
  versions: Version[];
}

const AdminReadyToPublish = () => {
  const { confirm, showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const articlesRes = await getArticles();

      if (articlesRes.success) {
        const backendToFrontendStatusMap: Record<string, ArticleStatus> = {
          'accepted': 'Ready to Publish',
          'published': 'Published'
        };

        const readyArticles = articlesRes.articles
          .map((a: any) => {
            const hasReviews = a.reviews && Object.keys(a.reviews).length > 0;
            let status: ArticleStatus | null = null;

            if (a.status === 'under_review' && hasReviews) {
              const latestReview = a.reviewerFeedback;
              if (latestReview && (latestReview.recommendation === 'Approved' || latestReview.recommendation === 'Accepted')) {
                status = 'Ready to Publish';
              }
            } else if (a.status === 'accepted') {
              status = 'Ready to Publish';
            } else if (a.status === 'published') {
              status = 'Published';
            }

            if (!status || status !== 'Ready to Publish') return null;

            return {
              id: a.articleId || a.id,
              title: a.title,
              author: a.authors?.find((au: any) => au.role === 'submitter')?.name || a.author || 'Author',
              category: a.category || 'Mathematics',
              abstract: a.abstract || '',
              status,
              assignedReviewers: a.assignedReviewers || [],
              lastUpdated: formatDate(a.updatedAt || a.createdAt),
              versions: (a.versions || [{ version: 1, uploadedBy: 'Author', timestamp: a.createdAt, fileName: a.pdfName || 'manuscript.pdf' }]).map((v: any) => ({
                ...v,
                timestamp: formatDate(v.timestamp || a.createdAt)
              }))
            };
          })
          .filter(Boolean) as Article[];

        setArticles(readyArticles);
        // Clear selections that might have been removed
        setSelectedIds(prev => prev.filter(id => readyArticles.some(a => a.id === id)));
      }
    } catch (error) {
      console.error('Failed to load ready-to-publish articles:', error);
      showToast('Failed to load articles.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter based on search term
  const filteredArticles = articles.filter(art =>
    art.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selection helpers
  const isAllSelected = filteredArticles.length > 0 && filteredArticles.every(a => selectedIds.includes(a.id));
  const isIndeterminate = filteredArticles.length > 0 && !isAllSelected && filteredArticles.some(a => selectedIds.includes(a.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => {
        const next = [...prev];
        filteredArticles.forEach(art => {
          if (!next.includes(art.id)) next.push(art.id);
        });
        return next;
      });
    } else {
      setSelectedIds(prev => prev.filter(id => !filteredArticles.some(art => art.id === id)));
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  // Individual publish handler (unchanged logic)
  const handlePublishIndividual = async (id: string) => {
    try {
      const response = await updateArticleStatus(id, 'published');
      if (response.success) {
        setArticles(prev => prev.filter(a => a.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        showToast('Article published successfully.', 'success');
      }
    } catch (error) {
      console.error('Failed to publish article:', error);
      showToast('Failed to publish article.', 'error');
    }
  };

  // Bulk publish handler
  const handleBulkPublish = () => {
    const selectedCount = selectedIds.length;
    confirm({
      title: 'Publish Selected Articles',
      message: `Are you sure you want to publish the ${selectedCount} selected articles on the BKMA website?`,
      confirmText: 'Publish',
      onConfirm: async () => {
        setPublishing(true);
        try {
          const response = await bulkPublishArticles(selectedIds);
          if (response.success) {
            const publishedCount = response.publishedCount || 0;
            const failures = response.failures || [];

            // Remove successfully published articles from state
            const failedIds = failures.map((f: any) => f.id);
            const successfulIds = selectedIds.filter(id => !failedIds.includes(id));

            setArticles(prev => prev.filter(a => !successfulIds.includes(a.id)));
            setSelectedIds(prev => prev.filter(id => failedIds.includes(id)));

            if (failures.length > 0) {
              showToast(`Published ${publishedCount} articles. ${failures.length} failed.`, 'info');
            } else {
              showToast(`Successfully published ${publishedCount} articles.`, 'success');
            }
          }
        } catch (error) {
          console.error('Bulk publish failed:', error);
          showToast('Failed to bulk publish selected articles.', 'error');
        } finally {
          setPublishing(false);
        }
      }
    });
  };

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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Ready to Publish</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-md font-['Outfit']">
            Publish finalized articles to the public BKMA website. There are{' '}
            <span className="font-bold text-emerald-600">{articles.length} articles</span> ready for release.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-black transition-all flex items-center justify-center gap-2 group shadow-sm disabled:cursor-not-allowed cursor-pointer"
            title="Refresh list"
            aria-label="Refresh ready to publish list"
          >
            <RefreshCw size={14} className={cn("text-zinc-500 group-hover:text-black transition-colors", refreshing && "animate-spin text-black")} />
          </button>

          {/* Bulk Publish Button */}
          <button
            onClick={handleBulkPublish}
            disabled={selectedIds.length === 0 || publishing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md disabled:cursor-not-allowed cursor-pointer"
          >
            {publishing ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Publishing...
              </>
            ) : (
              <>
                <UploadCloud size={14} />
                Publish Selected ({selectedIds.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Input & Info Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
            <FileText size={16} />
          </div>
          <h2 className="text-sm font-bold text-black uppercase tracking-widest">
            Eligible Manuscripts ({articles.length})
          </h2>
          {selectedIds.length > 0 && (
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
              {selectedIds.length} Selected
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-64 focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        {filteredArticles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500 cursor-pointer"
                      aria-label="Select all articles on this page"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Manuscript Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Author</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(article.id)}
                        onChange={(e) => handleSelectRow(article.id, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500 cursor-pointer"
                        aria-label={`Select article ${article.title}`}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 mb-1 tracking-widest">{article.id}</p>
                        <h3 className="text-sm font-bold text-black line-clamp-1">
                          {article.title}
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase mt-1">Updated {article.lastUpdated}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-zinc-600 font-bold uppercase tracking-wider">
                      {article.author}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-zinc-50 text-zinc-600 border-zinc-100">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            confirm({
                              title: 'Publish Article',
                              message: 'Are you sure you want to publish this article on the BKMA website?',
                              confirmText: 'Publish',
                              onConfirm: () => handlePublishIndividual(article.id)
                            });
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-emerald-700 transition-all uppercase cursor-pointer"
                        >
                          Publish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6 text-zinc-400">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1 font-['Outfit']">No ready-to-publish articles</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              No articles are currently ready to publish.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReadyToPublish;
