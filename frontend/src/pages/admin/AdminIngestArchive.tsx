import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Brain,
  CheckCircle,
  Loader2,
  ArrowRight,
  BookOpen,
  User,
  Users,
  Hash,
  Sparkles,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import api from '../../services/api';
import { cn } from '../../utils/cn';

interface PageRange {
  id: string;
  startPage: number | '';
  endPage: number | '';
  category: string;
}

interface ExtractedArticle {
  startPage: number;
  endPage: number;
  title: string;
  abstract: string;
  category: string;
  subjectClassification: string;
  keywords: string[];
  authors: Array<{
    name: string;
    email: string;
    affiliation: string;
  }>;
}

const AdminIngestArchive = () => {
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Ingestion States
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Form States (Step 1)
  const [volumeNo, setVolumeNo] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [issn, setIssn] = useState('0973-2721');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState<PageRange[]>([
    { id: '1', startPage: 1, endPage: 12, category: 'Mathematics' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted Data (Step 2)
  const [articles, setArticles] = useState<ExtractedArticle[]>([]);

  // Demo Autofill Helper
  const handleLoadDemo = () => {
    setVolumeNo('19');
    setIssueNumber('1');
    setMonthYear('June 2025');
    setIssn('0973-2721');
    setRanges([
      { id: '1', startPage: 1, endPage: 12, category: 'Mathematics' },
      { id: '2', startPage: 17, endPage: 31, category: 'Mathematics' },
      { id: '3', startPage: 33, endPage: 43, category: 'Mathematics' },
      { id: '4', startPage: 45, endPage: 56, category: 'Mathematics' },
      { id: '5', startPage: 57, endPage: 62, category: 'Mathematics' },
      { id: '6', startPage: 65, endPage: 68, category: 'Obituary' }
    ]);
    showToast('Loaded demo parameters for June 2025 Issue!', 'success');
  };

  // Range Helpers
  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const lastEnd = lastRange ? (typeof lastRange.endPage === 'number' ? lastRange.endPage : 0) : 0;
    const newStart = lastEnd + 1;
    setRanges([
      ...ranges,
      {
        id: Math.random().toString(),
        startPage: newStart,
        endPage: newStart + 10,
        category: 'Mathematics'
      }
    ]);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length === 1) {
      showToast('At least one page range is required.', 'error');
      return;
    }
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleUpdateRange = (id: string, field: keyof PageRange, value: any) => {
    setRanges(
      ranges.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        showToast('Please upload a valid PDF file.', 'error');
        return;
      }
      setPdfFile(file);
    }
  };

  // Step 1 Submit: Parse PDF & Call Gemini Metadata Extraction
  const handleExtractMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      showToast('Please upload the journal PDF file.', 'error');
      return;
    }
    if (!volumeNo || !issueNumber || !monthYear) {
      showToast('Please fill in all issue details.', 'error');
      return;
    }

    setLoading(true);
    setLoadingMessage('Extracting text and analyzing PDF page headers via Gemini...');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append(
        'ranges',
        JSON.stringify(
          ranges.map(r => ({ startPage: r.startPage, endPage: r.endPage }))
        )
      );

      const res = await api.post('/articles/import-extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        // Map extracted results back with their categories
        const mappedArticles = res.data.extracted.map((ext: any, idx: number) => ({
          ...ext,
          category: ranges[idx].category
        }));
        setArticles(mappedArticles);
        setStep(2);
        showToast('Gemini successfully extracted article metadata!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Metadata extraction failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Article Edit Helpers (Step 2)
  const handleUpdateArticleField = (idx: number, field: keyof ExtractedArticle, value: any) => {
    setArticles(
      articles.map((art, i) => (i === idx ? { ...art, [field]: value } : art))
    );
  };

  const handleUpdateAuthorField = (artIdx: number, authIdx: number, field: string, value: string) => {
    setArticles(
      articles.map((art, i) => {
        if (i !== artIdx) return art;
        const newAuthors = art.authors.map((auth, j) =>
          j === authIdx ? { ...auth, [field]: value } : auth
        );
        return { ...art, authors: newAuthors };
      })
    );
  };

  const handleAddAuthor = (artIdx: number) => {
    setArticles(
      articles.map((art, i) => {
        if (i !== artIdx) return art;
        return {
          ...art,
          authors: [...art.authors, { name: '', email: '', affiliation: '' }]
        };
      })
    );
  };

  const handleRemoveAuthor = (artIdx: number, authIdx: number) => {
    setArticles(
      articles.map((art, i) => {
        if (i !== artIdx) return art;
        if (art.authors.length === 1) {
          showToast('An article must have at least one author.', 'error');
          return art;
        }
        return {
          ...art,
          authors: art.authors.filter((_, idx) => idx !== authIdx)
        };
      })
    );
  };

  // Step 2 Submit: Split PDFs & Save to Firestore
  const handleImportSplit = async () => {
    setLoading(true);
    setLoadingMessage('Splitting PDFs, uploading to R2 storage, and saving Firestore publications...');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile!);
      formData.append('volumeNo', volumeNo);
      formData.append('monthYear', monthYear);
      formData.append('issueNumber', issueNumber);
      formData.append('issn', issn);
      formData.append('articlesJson', JSON.stringify(articles));

      const res = await api.post('/articles/import-split', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setStep(3);
        showToast('Archive issue published successfully!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to split and import issue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="animate-spin text-emerald-600 relative" size={64} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-black font-['Outfit'] mb-2">Ingestion In Progress</h2>
        <p className="text-zinc-500 text-sm max-w-md font-medium leading-relaxed">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black font-['Outfit']">Archive Ingestor</h1>
          <p className="text-zinc-500 text-sm mt-1">Split full issue PDFs and auto-extract metadata via Gemini AI.</p>
        </div>

        {step === 1 && (
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Sparkles size={14} className="animate-pulse" />
            Load Demo Issue (June 2025)
          </button>
        )}
      </div>

      {/* STEP 1: Upload & Define Page Ranges */}
      {step === 1 && (
        <form onSubmit={handleExtractMetadata} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Issue Settings & File Upload */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-2">
                <Hash size={14} /> Issue Metadata
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Volume Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 19"
                  value={volumeNo}
                  onChange={e => setVolumeNo(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Issue Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1"
                  value={issueNumber}
                  onChange={e => setIssueNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Month & Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. June 2025"
                  value={monthYear}
                  onChange={e => setMonthYear(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">ISSN (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 0973-2721"
                  value={issn}
                  onChange={e => setIssn(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none font-medium"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all hover:bg-zinc-50 flex flex-col items-center justify-center gap-3",
                pdfFile ? "border-emerald-300 bg-emerald-50/20" : "border-zinc-200"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              <div className={cn("p-4 rounded-full shadow-inner", pdfFile ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400")}>
                <UploadCloud size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-black">{pdfFile ? pdfFile.name : 'Upload Issue PDF'}</p>
                <p className="text-xs text-zinc-400 mt-1">Drag & drop or click to upload the full volume</p>
              </div>
            </div>
          </div>

          {/* Page Ranges Selector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <FileText size={14} /> Article Page Segments
                </h2>
                <button
                  type="button"
                  onClick={handleAddRange}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Segment
                </button>
              </div>

              <div className="space-y-3">
                {ranges.map((range, idx) => (
                  <div key={range.id} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Start Page</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={range.startPage}
                          onChange={e => handleUpdateRange(range.id, 'startPage', parseInt(e.target.value, 10) || '')}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">End Page</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={range.endPage}
                          onChange={e => handleUpdateRange(range.id, 'endPage', parseInt(e.target.value, 10) || '')}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Category</label>
                        <select
                          value={range.category}
                          onChange={e => handleUpdateRange(range.id, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none appearance-none cursor-pointer"
                        >
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                          <option value="Obituary">Obituary</option>
                          <option value="Special Article">Special Article</option>
                          <option value="Review Article">Review Article</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRange(range.id)}
                      className="p-2.5 text-zinc-400 hover:text-rose-600 transition-colors bg-white rounded-lg border border-zinc-200 hover:border-rose-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-black text-white hover:bg-zinc-800 transition-all font-bold text-sm tracking-[0.2em] rounded-3xl flex items-center justify-center gap-3 uppercase shadow-lg shadow-black/10 cursor-pointer"
            >
              <Brain size={18} className="animate-pulse" />
              Analyze & Extract Metadata
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Verify & Edit Extracted Metadata */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 max-w-3xl">
            <Sparkles className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-bold text-amber-800">Auto-Extraction Successful</p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                Gemini has parsed the first page of each article range. Please verify the titles, abstracts, and author details below before committing to the database.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {articles.map((art, idx) => (
              <div key={idx} className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-6">
                {/* Article Info Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Segment: Pages {art.startPage} - {art.endPage}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                    {art.category}
                  </span>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Metadata inputs */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Article Title</label>
                      <input
                        type="text"
                        value={art.title}
                        onChange={e => handleUpdateArticleField(idx, 'title', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Abstract Summary</label>
                      <textarea
                        rows={6}
                        value={art.abstract}
                        onChange={e => handleUpdateArticleField(idx, 'abstract', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm leading-relaxed focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase">Subject Classification</label>
                        <input
                          type="text"
                          value={art.subjectClassification}
                          onChange={e => handleUpdateArticleField(idx, 'subjectClassification', e.target.value)}
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-black outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase">Keywords (Comma-separated)</label>
                        <input
                          type="text"
                          value={art.keywords.join(', ')}
                          onChange={e => handleUpdateArticleField(idx, 'keywords', e.target.value.split(',').map(s => s.trim()))}
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-black outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Authors Section */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                        <Users size={14} /> Authors List
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleAddAuthor(idx)}
                        className="p-1 hover:bg-zinc-100 rounded-md text-black transition-colors"
                        title="Add Author"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {art.authors.map((author, authIdx) => (
                        <div key={authIdx} className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-2 relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveAuthor(idx, authIdx)}
                            className="absolute top-2 right-2 text-zinc-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase">Full Name</label>
                            <input
                              type="text"
                              value={author.name}
                              onChange={e => handleUpdateAuthorField(idx, authIdx, 'name', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-md text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase">Affiliation</label>
                            <input
                              type="text"
                              value={author.affiliation}
                              onChange={e => handleUpdateAuthorField(idx, authIdx, 'affiliation', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-md text-[10px] font-medium focus:ring-1 focus:ring-black outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 uppercase">Email (Optional)</label>
                            <input
                              type="email"
                              value={author.email}
                              onChange={e => handleUpdateAuthorField(idx, authIdx, 'email', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-md text-[10px] font-medium focus:ring-1 focus:ring-black outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Process Import Triggers */}
          <div className="flex items-center gap-4 pt-6 border-t border-zinc-100">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-4 border border-zinc-200 hover:border-black rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              Back to Segment Upload
            </button>
            <button
              onClick={handleImportSplit}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 uppercase shadow-lg shadow-emerald-600/10 cursor-pointer"
            >
              <FolderPlus size={16} />
              Import & Publish Archive Issue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Success Confirmation */}
      {step === 3 && (
        <div className="max-w-md mx-auto text-center py-20 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-black font-['Outfit'] mb-2">Import Completed!</h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8">
            The archive volume has been successfully split, uploaded to Cloudflare R2, and published as **Volume {volumeNo}, Issue {issueNumber} ({monthYear})** to the public portal.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setStep(1);
                setVolumeNo('');
                setIssueNumber('');
                setMonthYear('');
                setPdfFile(null);
                setRanges([{ id: '1', startPage: 1, endPage: 12, category: 'Mathematics' }]);
              }}
              className="w-full py-3 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
            >
              Import Another Issue
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider cursor-pointer"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIngestArchive;
