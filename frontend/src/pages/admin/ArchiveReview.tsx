import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileText,
  Bookmark,
  Users,
  Briefcase,
  Loader2,
  Sparkles,
  Search
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import api from '../../services/api';
import { cn } from '../../utils/cn';

interface Author {
  userId: string;
  name: string;
  email: string;
  affiliation: string;
  role: string;
}

interface DraftArticle {
  id: string;
  title: string;
  ocrTitle: string;
  abstract: string;
  ocrAbstract: string;
  keywords: string[];
  ocrKeywords: string[];
  subjectClassification: string;
  ocrSubjectClassification: string;
  pageRange: string;
  ocrPageRange: string;
  authors: Author[];
  ocrAuthors: any[];
  pdfKey: string;
  pdfName: string;
  confidenceScore: number;
  ocrConfidence: number;
  extractionMethod: string;
  duplicateDetected: boolean;
  matchedArticleId: string | null;
  errors: string[];
  warnings: string[];
}

const ArchiveReview = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { showToast, confirm } = useNotification();

  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [articles, setArticles] = useState<DraftArticle[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // Canvas / Image Preview States
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [canvasLoading, setCanvasLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load Job details and staged PDF
  const loadJob = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/archive/jobs/${jobId}`);
      if (res.data.success) {
        setJobDetails(res.data.job);
        setArticles(res.data.job.articles || []);
        
        // Fetch staged PDF directly as arraybuffer
        const pdfRes = await api.get(`/articles/staged/pdf?key=${encodeURIComponent(res.data.job.fileKey)}`, {
          responseType: 'arraybuffer'
        });
        const uint8 = new Uint8Array(pdfRes.data);
        setPdfData(uint8);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load archive job data.', 'error');
      navigate('/admin/archive-management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  // Handle PDF.js rendering in browser canvas
  useEffect(() => {
    if (!pdfData || articles.length === 0 || !articles[activeIdx]) return;
    
    const activeArt = articles[activeIdx];
    const range = activeArt.pageRange || activeArt.ocrPageRange;
    const firstPage = parseInt(range.split('-')[0], 10) || 1;

    let isMounted = true;
    setCanvasLoading(true);

    const renderPDFPage = async () => {
      try {
        const pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) {
          // Dynamic load if not ready
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
            script.onload = () => {
              const pjs = (window as any).pdfjsLib;
              pjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
              resolve(pjs);
            };
            document.head.appendChild(script);
          });
        }

        const loadedPdfjs = (window as any).pdfjsLib;
        const pdf = await loadedPdfjs.getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(firstPage);
        
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: zoom * 1.5 });
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
        }
      } catch (err) {
        console.error('Failed to render preview page:', err);
      } finally {
        if (isMounted) setCanvasLoading(false);
      }
    };

    renderPDFPage();

    return () => {
      isMounted = false;
    };
  }, [pdfData, activeIdx, articles, zoom]);

  // Edit Field helpers
  const handleUpdateField = (field: keyof DraftArticle, value: any) => {
    setArticles(
      articles.map((art, i) => (i === activeIdx ? { ...art, [field]: value } : art))
    );
  };

  const handleUpdateAuthor = (authIdx: number, field: keyof Author, value: string) => {
    setArticles(
      articles.map((art, i) => {
        if (i !== activeIdx) return art;
        const newAuthors = art.authors.map((auth, j) =>
          j === authIdx ? { ...auth, [field]: value } : auth
        );
        return { ...art, authors: newAuthors };
      })
    );
  };

  const handleAddAuthor = () => {
    setArticles(
      articles.map((art, i) => {
        if (i !== activeIdx) return art;
        return {
          ...art,
          authors: [...art.authors, { userId: 'admin_ingested', name: '', email: '', affiliation: '', role: 'author' }]
        };
      })
    );
  };

  const handleRemoveAuthor = (authIdx: number) => {
    setArticles(
      articles.map((art, i) => {
        if (i !== activeIdx) return art;
        if (art.authors.length === 1) {
          showToast('An article must have at least one author.', 'error');
          return art;
        }
        return { ...art, authors: art.authors.filter((_, idx) => idx !== authIdx) };
      })
    );
  };

  // Commit / publish verified array
  const handlePublishAll = () => {
    confirm({
      title: 'Commit Digitized Issue',
      message: 'Are you sure you want to verify and push all these articles to the KMA publication queue?',
      confirmText: 'Verify & Push',
      onConfirm: async () => {
        try {
          const res = await api.post(`/archive/jobs/${jobId}/publish`, {
            articles: articles.map(art => ({
              ...art,
              // Map verified data as default values
              title: art.title || art.ocrTitle,
              abstract: art.abstract || art.ocrAbstract,
              keywords: art.keywords || art.ocrKeywords,
              subjectClassification: art.subjectClassification || art.ocrSubjectClassification,
              pageRange: art.pageRange || art.ocrPageRange
            }))
          });

          if (res.data.success) {
            showToast('All articles successfully pushed to KMA Publish Queue!', 'success');
            navigate('/admin/archive-management');
          }
        } catch (err: any) {
          console.error(err);
          showToast(err.response?.data?.error || 'Failed to approve and publish issue.', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <Loader2 className="animate-spin text-zinc-400 mb-4" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Loading digitization workspace...</p>
      </div>
    );
  }

  const activeArticle = articles[activeIdx];

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">🟢 High ({confidence}%)</span>;
    } else if (confidence >= 70) {
      return <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-100">🟡 Medium ({confidence}%)</span>;
    } else {
      return <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider border border-rose-100">🔴 Low ({confidence}%)</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-zinc-50 font-['Outfit'] select-none">
      
      {/* Workspace Menu Bar */}
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/archive-management')}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-black leading-tight">Review Workspace</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Job: {jobDetails?.filename} (Vol {jobDetails?.volumeNo}, Issue {jobDetails?.issueNumber})</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Index Selector controls */}
          <div className="flex items-center bg-zinc-100 rounded-xl p-1 border border-zinc-200">
            <button
              onClick={() => setActiveIdx(prev => Math.max(0, prev - 1))}
              disabled={activeIdx === 0}
              className="p-2 text-zinc-500 hover:text-black disabled:text-zinc-300 disabled:hover:bg-transparent hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black px-4 text-black uppercase tracking-wider">
              {activeIdx + 1} / {articles.length}
            </span>
            <button
              onClick={() => setActiveIdx(prev => Math.min(articles.length - 1, prev + 1))}
              disabled={activeIdx === articles.length - 1}
              className="p-2 text-zinc-500 hover:text-black disabled:text-zinc-300 disabled:hover:bg-transparent hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={handlePublishAll}
            className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-[10px] tracking-wider uppercase shadow-md shadow-black/10 cursor-pointer"
          >
            Approve & Publish Issue
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      {activeArticle ? (
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Split Page Preview Panel */}
          <div className="w-1/2 bg-zinc-900 flex flex-col border-r border-zinc-800 relative">
            {/* Canvas Utility Bar */}
            <div className="bg-black/40 backdrop-blur-md border-b border-zinc-800 px-6 py-2.5 flex items-center justify-between text-white shrink-0 z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Page {activeArticle.pageRange.split('-')[0]} Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[10px] font-bold text-zinc-400">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <div className="w-px h-4 bg-zinc-800 mx-1" />
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Rotate Page"
                >
                  <RotateCw size={14} />
                </button>
              </div>
            </div>

            {/* Render Canvas Container */}
            <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative">
              {canvasLoading && (
                <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="animate-spin text-white mb-2" size={32} />
                </div>
              )}
              <div
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="bg-white rounded-xl shadow-2xl p-1"
              >
                <canvas ref={canvasRef} className="max-w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* RIGHT: Metadata Form Panel */}
          <div className="w-1/2 bg-white overflow-y-auto p-8 sm:p-12 space-y-8 flex flex-col justify-between">
            <div className="space-y-8">
              {/* Warnings and Status checks */}
              <div className="space-y-3">
                {activeArticle.duplicateDetected && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-800">Possible Duplicate Detected</p>
                      <p className="text-[11px] text-amber-700 leading-normal mt-0.5">
                        An article with this exact title already exists in the catalog database (Matched ID: {activeArticle.matchedArticleId}).
                      </p>
                    </div>
                  </div>
                )}

                {activeArticle.errors && activeArticle.errors.length > 0 && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-bold text-rose-800">Review Checklist Errors</p>
                      <ul className="list-disc list-inside text-[11px] text-rose-700 mt-1 leading-normal space-y-0.5">
                        {activeArticle.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Header info */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Metadata Properties</span>
                  <p className="text-xs text-zinc-500 font-bold">Processed via {activeArticle.extractionMethod}</p>
                </div>
                {getConfidenceBadge(activeArticle.ocrConfidence)}
              </div>

              {/* Form elements */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Article Title</span>
                    {activeArticle.title !== activeArticle.ocrTitle && <span className="text-blue-500 text-[8px]">Edited</span>}
                  </label>
                  <input
                    type="text"
                    value={activeArticle.title}
                    onChange={e => handleUpdateField('title', e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-1 focus:ring-black outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Abstract Text</label>
                  <textarea
                    rows={6}
                    value={activeArticle.abstract}
                    onChange={e => handleUpdateField('abstract', e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs leading-relaxed focus:ring-1 focus:ring-black outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Subject Classification (MSC)</label>
                    <input
                      type="text"
                      value={activeArticle.subjectClassification}
                      onChange={e => handleUpdateField('subjectClassification', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Keywords (Comma-separated)</label>
                    <input
                      type="text"
                      value={activeArticle.keywords.join(', ')}
                      onChange={e => handleUpdateField('keywords', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Page Numbers</label>
                    <input
                      type="text"
                      value={activeArticle.pageRange}
                      onChange={e => handleUpdateField('pageRange', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Original Filename</label>
                    <input
                      type="text"
                      disabled
                      value={activeArticle.pdfName}
                      className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 text-zinc-400 rounded-xl text-xs font-bold outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Authors Grid */}
                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Users size={14} /> Authors List
                    </h3>
                    <button
                      onClick={handleAddAuthor}
                      className="p-1 hover:bg-zinc-100 rounded-lg text-black transition-colors cursor-pointer"
                      title="Add Author"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-[220px] overflow-y-auto pr-1">
                    {activeArticle.authors.map((author, authIdx) => (
                      <div key={authIdx} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3 relative">
                        <button
                          onClick={() => handleRemoveAuthor(authIdx)}
                          className="absolute top-2 right-2 text-zinc-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Author Name</label>
                            <input
                              type="text"
                              value={author.name}
                              onChange={e => handleUpdateAuthor(authIdx, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Affiliation / Org</label>
                            <input
                              type="text"
                              value={author.affiliation}
                              onChange={e => handleUpdateAuthor(authIdx, 'affiliation', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                          <input
                            type="email"
                            value={author.email}
                            onChange={e => handleUpdateAuthor(authIdx, 'email', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom pagination / status info */}
            <div className="pt-8 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Score: {activeArticle.confidenceScore}%</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveIdx(prev => Math.max(0, prev - 1))}
                  disabled={activeIdx === 0}
                  className="px-4 py-2 border border-zinc-200 hover:border-black rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setActiveIdx(prev => Math.min(articles.length - 1, prev + 1))}
                  disabled={activeIdx === articles.length - 1}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-zinc-400">
          <p>No articles found inside this ingestion workspace.</p>
        </div>
      )}

    </div>
  );
};

export default ArchiveReview;
