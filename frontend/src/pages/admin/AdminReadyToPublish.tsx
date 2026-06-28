import { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  UploadCloud,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { getArticles, updateArticleStatus, bulkPublishArticles } from '../../services/article.service';
import { formatDate } from '../../utils/dateHelpers';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

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

  // Metadata Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [volumeNo, setVolumeNo] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [issn, setIssn] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Close modal on Esc keypress
  useEffect(() => {
    if (isModalOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !publishing) {
          setIsModalOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen, publishing]);

  // Load ISSN automatically when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const fetchIssnSetting = async () => {
        try {
          const docRef = doc(db, 'settings', 'journal');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().issn) {
            setIssn(docSnap.data().issn);
          } else {
            setIssn('0973-2721'); // default fallback
          }
        } catch (err) {
          setIssn('0973-2721'); // default fallback
        }
      };
      fetchIssnSetting();
    }
  }, [isModalOpen]);

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

  // Client-side validations
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!volumeNo) {
      errors.volumeNo = 'Volume Number is required';
    } else if (volumeNo.length > 20) {
      errors.volumeNo = 'Volume Number cannot exceed 20 characters';
    }

    if (!monthYear) {
      errors.monthYear = 'Month & Year is required';
    }

    if (!issueNumber) {
      errors.issueNumber = 'Issue Number is required';
    } else {
      const num = parseInt(issueNumber, 10);
      if (isNaN(num) || num <= 0 || !/^\d+$/.test(issueNumber)) {
        errors.issueNumber = 'Issue Number must be a positive integer';
      }
    }

    if (issn && !/^\d{4}-\d{4}$/.test(issn)) {
      errors.issn = 'ISSN must be in XXXX-XXXX format';
    }

    return errors;
  };

  // Check duplicate combination client-side
  const checkDuplicateIssue = async (vol: string, my: string, issueNum: number) => {
    try {
      const q = query(
        collection(db, 'issues'),
        where('volume', '==', vol),
        where('monthYear', '==', my),
        where('issueNumber', '==', issueNum)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (err) {
      console.error('Error checking duplicate issue:', err);
      return false;
    }
  };

  // Validation status
  const errors = validateForm();
  const isFormValid = Object.keys(errors).length === 0;

  // Bulk publish metadata submit handler
  const handleOpenPublishModal = () => {
    setVolumeNo('');
    setMonthYear('');
    setIssueNumber('');
    setIssn('');
    setValidationErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const parsedIssueNum = parseInt(issueNumber, 10);

    setPublishing(true);
    try {
      // 1. Verify duplicate issue combination client-side
      const isDuplicate = await checkDuplicateIssue(volumeNo, monthYear, parsedIssueNum);
      if (isDuplicate) {
        setSubmitError('This publication issue already exists. Please use a different Volume or Issue Number.');
        setPublishing(false);
        return;
      }

      // 2. Open final confirmation dialog
      setPublishing(false); // release state temporarily for confirmation dialog block
      confirm({
        title: 'Publish Articles',
        message: `Publish ${selectedIds.length} selected article(s)?\n\nVolume No.: ${volumeNo}\nMonth & Year: ${monthYear}\nIssue Number: ${parsedIssueNum}\nISSN: ${issn || 'None'}\n\nThis action cannot be undone.`,
        confirmText: 'Publish',
        onConfirm: async () => {
          setPublishing(true);
          try {
            const response = await bulkPublishArticles(selectedIds, {
              volumeNo,
              monthYear,
              issueNumber: parsedIssueNum,
              issn: issn || undefined
            });

            if (response.success) {
              const failures = response.failures || [];
              const failedIds = failures.map((f: any) => f.id);
              const successfulIds = selectedIds.filter(id => !failedIds.includes(id));

              // Remove successfully published articles immediately
              setArticles(prev => prev.filter(a => !successfulIds.includes(a.id)));
              setSelectedIds(prev => prev.filter(id => failedIds.includes(id)));

              // Close the modal
              setIsModalOpen(false);

              // Show success toast
              showToast(
                `Successfully published ${successfulIds.length} article(s) to Volume ${volumeNo}, Issue ${parsedIssueNum}, Month & Year ${monthYear}`,
                'success'
              );

              // Reload Ready to Publish page data silently
              loadData(true);
            }
          } catch (error: any) {
            console.error('Bulk publish failed:', error);
            const errMsg = error.response?.data?.error || 'Failed to bulk publish selected articles.';
            showToast(errMsg, 'error');
            setSubmitError(errMsg);
          } finally {
            setPublishing(false);
          }
        }
      });
    } catch (err: any) {
      console.error('Submission validation failed:', err);
      setPublishing(false);
      showToast('Validation check failed.', 'error');
    }
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

          {/* Bulk Publish Trigger */}
          <button
            onClick={handleOpenPublishModal}
            disabled={selectedIds.length === 0 || publishing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md disabled:cursor-not-allowed cursor-pointer"
          >
            <UploadCloud size={14} />
            Publish Selected ({selectedIds.length})
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

      {/* Publication Metadata Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-zinc-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider">Publish Articles</h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Enter publication metadata for {selectedIds.length} article(s)</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={publishing}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close Publish Articles Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleMetadataSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {submitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-600 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Volume Number */}
              <div>
                <label htmlFor="volumeNo" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 px-1">
                  Volume No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="volumeNo"
                  placeholder="e.g. 23"
                  maxLength={20}
                  value={volumeNo}
                  onChange={(e) => {
                    setVolumeNo(e.target.value);
                    if (validationErrors.volumeNo) {
                      setValidationErrors(prev => ({ ...prev, volumeNo: '' }));
                    }
                  }}
                  disabled={publishing}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {validationErrors.volumeNo && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.volumeNo}</p>
                )}
              </div>

              {/* Month & Year */}
              <div>
                <label htmlFor="monthYear" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 px-1">
                  Month & Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="month"
                  id="monthYear"
                  value={monthYear}
                  onChange={(e) => {
                    setMonthYear(e.target.value);
                    if (validationErrors.monthYear) {
                      setValidationErrors(prev => ({ ...prev, monthYear: '' }));
                    }
                  }}
                  disabled={publishing}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {validationErrors.monthYear && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.monthYear}</p>
                )}
              </div>

              {/* Issue Number */}
              <div>
                <label htmlFor="issueNumber" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 px-1">
                  Issue Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="issueNumber"
                  min="1"
                  step="1"
                  placeholder="e.g. 2"
                  value={issueNumber}
                  onChange={(e) => {
                    setIssueNumber(e.target.value);
                    if (validationErrors.issueNumber) {
                      setValidationErrors(prev => ({ ...prev, issueNumber: '' }));
                    }
                  }}
                  disabled={publishing}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {validationErrors.issueNumber && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.issueNumber}</p>
                )}
              </div>

              {/* ISSN Number */}
              <div>
                <label htmlFor="issn" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 px-1">
                  ISSN Number (Optional)
                </label>
                <input
                  type="text"
                  id="issn"
                  placeholder="e.g. 0973-2721"
                  value={issn}
                  onChange={(e) => {
                    setIssn(e.target.value);
                    if (validationErrors.issn) {
                      setValidationErrors(prev => ({ ...prev, issn: '' }));
                    }
                  }}
                  disabled={publishing}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-black outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {validationErrors.issn && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.issn}</p>
                )}
              </div>

              {/* Live Preview Section */}
              <div className="mt-6 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Publication Details</h4>
                <div className="space-y-2 text-xs font-bold text-zinc-800">
                  <div className="flex justify-between border-b border-zinc-100/50 pb-1.5">
                    <span className="opacity-50 font-normal">Volume:</span>
                    <span>{volumeNo || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100/50 pb-1.5">
                    <span className="opacity-50 font-normal">Month & Year:</span>
                    <span>{monthYear || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100/50 pb-1.5">
                    <span className="opacity-50 font-normal">Issue No.:</span>
                    <span>{issueNumber || '--'}</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="opacity-50 font-normal">ISSN:</span>
                    <span>{issn || '--'}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 bg-white no-print">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={publishing}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-black transition-all bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || publishing}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:cursor-not-allowed cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      Publish Articles
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReadyToPublish;
