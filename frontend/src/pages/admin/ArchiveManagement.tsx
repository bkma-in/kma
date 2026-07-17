import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Play,
  RotateCw,
  Loader2,
  Clock,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Eye,
  Hash,
  Activity,
  History
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import api from '../../services/api';
import { cn } from '../../utils/cn';

interface PageRange {
  id: string;
  startPage: number | '';
  endPage: number | '';
}

interface ArchiveJob {
  jobId: string;
  filename: string;
  volumeNo: string;
  issueNumber: string;
  monthYear: string;
  status: 'queued' | 'processing' | 'ocr_running' | 'metadata_extraction' | 'validating' | 'ready_for_review' | 'completed' | 'failed';
  startedAt: any;
  completedAt: any;
  importedCount: number;
  failedCount: number;
  ocrConfidenceAverage: number;
  errors: string[];
}

const ArchiveManagement = () => {
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Status lists
  const [jobs, setJobs] = useState<ArchiveJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Ingest Form States
  const [volumeNo, setVolumeNo] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [issn, setIssn] = useState('0973-2721');
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState<PageRange[]>([
    { id: '1', startPage: 1, endPage: 12 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active jobs and history
  const fetchJobs = async () => {
    try {
      const res = await api.get('/archive/jobs');
      if (res.data.success) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load digitization history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll job status updates every 4 seconds to keep dashboard live
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const lastEnd = lastRange ? (typeof lastRange.endPage === 'number' ? lastRange.endPage : 0) : 0;
    const newStart = lastEnd + 1;
    setRanges([...ranges, { id: Math.random().toString(), startPage: newStart, endPage: newStart + 10 }]);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length === 1) return;
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleUpdateRange = (id: string, field: 'startPage' | 'endPage', val: number | '') => {
    setRanges(ranges.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Helper to load PDF.js from CDN dynamically
  const loadPdfjs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js script.'));
      document.head.appendChild(script);
    });
  };

  // Render a specific page of a PDF file to a Blob image using browser Canvas
  const renderPdfPageToBlob = (pdfjs: any, fileObj: File, pageNum: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjs.getDocument({ data: typedarray }).promise;
          if (pageNum > pdf.numPages) {
            resolve(new Blob()); // fallback empty blob
            return;
          }
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({ canvasContext: context, viewport }).promise;
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Blob conversion failed.'));
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(fileObj);
    });
  };

  const handleStartDigitization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Please upload a PDF or ZIP file.', 'error');
      return;
    }
    if (!volumeNo || !issueNumber || !monthYear) {
      showToast('All issue fields are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress('Initializing PDF engine...');

    try {
      const formData = new FormData();
      formData.append('journal', file);
      formData.append('volumeNo', volumeNo);
      formData.append('issueNumber', issueNumber);
      formData.append('monthYear', monthYear);
      formData.append('issn', issn);
      formData.append('rangesJson', JSON.stringify(ranges.map(r => ({ startPage: r.startPage, endPage: r.endPage }))));

      // If it is a PDF file, compile page-1 images of all segments for cost-free server OCR
      if (file.type === 'application/pdf') {
        setSubmitProgress('Rendering page boundaries for OCR...');
        const pdfjs = await loadPdfjs();
        
        for (let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          setSubmitProgress(`Rendering segment ${i+1}/${ranges.length} page scans...`);
          try {
            const pageBlob = await renderPdfPageToBlob(pdfjs, file, range.startPage || 1);
            formData.append('segment_images', pageBlob, `segment_${i}.png`);
          } catch (err) {
            console.error(`Failed to render page ${range.startPage || 1} for OCR:`, err);
            // Append an empty file placeholder so index align doesn't break on backend
            formData.append('segment_images', new Blob(), `segment_${i}_failed.png`);
          }
        }
      } else {
        // ZIP or direct image upload does not need PDF pre-rendering
        setSubmitProgress('Uploading archive bundle...');
      }

      setSubmitProgress('Staging files to Cloudflare storage...');
      const res = await api.post('/archive/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast('Archive job enqueued successfully!', 'success');
        setFile(null);
        setVolumeNo('');
        setIssueNumber('');
        setMonthYear('');
        fetchJobs();
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Digitization request failed.', 'error');
    } finally {
      setIsSubmitting(false);
      setSubmitProgress('');
    }
  };

  const getStatusBadge = (status: ArchiveJob['status']) => {
    switch (status) {
      case 'queued':
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">Queued</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Processing</span>;
      case 'ocr_running':
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1.5"><Activity size={12} className="animate-pulse" /> OCR Running</span>;
      case 'metadata_extraction':
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5"><FileText size={12} /> Indexing</span>;
      case 'ready_for_review':
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">Review Required</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Completed</span>;
      case 'failed':
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">Failed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-zinc-50 text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-2 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-black font-['Outfit']">Archive Ingestion Manager</h1>
        <p className="text-zinc-500 mt-1.5 text-sm">Upload hard-copy or digital journals to digitize, OCR index, and review historical files completely free.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleStartDigitization} className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-2">
              <FolderOpen size={16} /> New Ingestion Job
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Volume Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 19"
                  value={volumeNo}
                  onChange={e => setVolumeNo(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-1 focus:ring-black outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Issue Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1"
                  value={issueNumber}
                  onChange={e => setIssueNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-1 focus:ring-black outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Month & Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. June 2025"
                  value={monthYear}
                  onChange={e => setMonthYear(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-1 focus:ring-black outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ISSN</label>
                <input
                  type="text"
                  placeholder="e.g. 0973-2721"
                  value={issn}
                  onChange={e => setIssn(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-1 focus:ring-black outline-none font-medium"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all hover:bg-zinc-50 flex flex-col items-center justify-center gap-3",
                file ? "border-emerald-300 bg-emerald-50/20" : "border-zinc-200"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf,application/zip,application/x-zip-compressed"
                className="hidden"
              />
              <div className={cn("p-4 rounded-full shadow-inner", file ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400")}>
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-black leading-snug">{file ? file.name : 'Upload PDF or ZIP'}</p>
                <p className="text-[9px] text-zinc-400 mt-1">PDF file or ZIP archive of page scans (max 150MB)</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4.5 bg-black hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 uppercase disabled:bg-zinc-300 cursor-pointer shadow-lg shadow-black/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {submitProgress}
                </>
              ) : (
                <>
                  <Play size={14} />
                  Start Ingestion Job
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Col: Ranges & Queues */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Article Page boundary inputs */}
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Hash size={16} /> Article Segments
              </h2>
              <button
                type="button"
                onClick={handleAddRange}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Segment
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
              {ranges.map((range, idx) => (
                <div key={range.id} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Start:</span>
                      <input
                        type="number"
                        min="1"
                        value={range.startPage}
                        onChange={e => handleUpdateRange(range.id, 'startPage', parseInt(e.target.value, 10) || '')}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">End:</span>
                      <input
                        type="number"
                        min="1"
                        value={range.endPage}
                        onChange={e => handleUpdateRange(range.id, 'endPage', parseInt(e.target.value, 10) || '')}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRange(range.id)}
                    className="text-zinc-400 hover:text-rose-500 p-1.5 bg-white rounded-lg border border-zinc-200 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Job Queue Table */}
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-4">
              <History size={16} /> Processing Queue & Logs
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <th className="pb-3">Journal Issue</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Confidence</th>
                    <th className="pb-3">Articles</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 text-xs font-medium text-zinc-600">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Loading job history...
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        No active queue jobs found.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.jobId} className="group hover:bg-zinc-50/50">
                        <td className="py-4">
                          <p className="font-bold text-black">{job.filename}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Vol. {job.volumeNo}, Issue {job.issueNumber} ({job.monthYear})</p>
                        </td>
                        <td className="py-4">{getStatusBadge(job.status)}</td>
                        <td className="py-4 font-bold text-black">
                          {job.status === 'completed' || job.status === 'ready_for_review' ? (
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px]",
                              job.ocrConfidenceAverage >= 85 ? "bg-emerald-50 text-emerald-700" :
                              job.ocrConfidenceAverage >= 70 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                            )}>
                              {job.ocrConfidenceAverage}%
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="py-4 font-bold">
                          <span className="text-emerald-600">{job.importedCount || 0} ✓</span>
                          {job.failedCount > 0 && <span className="text-rose-500 ml-1.5">{job.failedCount} ✗</span>}
                        </td>
                        <td className="py-4 text-right">
                          {job.status === 'ready_for_review' ? (
                            <button
                              onClick={() => navigate(`/admin/archive-review/${job.jobId}`)}
                              className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold text-[10px] tracking-wider uppercase inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={12} /> Review
                            </button>
                          ) : job.status === 'failed' && job.errors && job.errors.length > 0 ? (
                            <button
                              onClick={() => alert(`Error Logs:\n${job.errors.join('\n')}`)}
                              className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                              title="Show details"
                            >
                              Error Details
                            </button>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">Processing</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ArchiveManagement;
