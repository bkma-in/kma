import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  CheckCircle2, 
  Info, 
  Loader2, 
  FileEdit, 
  Clock, 
  User, 
  Building2, 
  Mail,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Filter,
  Send,
  Eye
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { useNotification } from '../../utils/NotificationContext';
import { useEffect } from 'react';

const SubmitArticle = () => {
  const { showToast } = useNotification();
  
  // Stepper State
  const location = useLocation();
  const prefillData = location.state?.draft;
  
  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState({
    title: prefillData?.title || '',
    abstract: prefillData?.abstract || '',
    keywords: prefillData?.keywords || '',
    category: prefillData?.category || '',
    allowComments: true,
    pdfName: prefillData?.pdfName || ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(prefillData?.id || prefillData?.articleId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefillData) {
      setFormData({
        title: prefillData.title || '',
        abstract: prefillData.abstract || '',
        keywords: prefillData.keywords || '',
        category: prefillData.category || '',
        allowComments: true,
        pdfName: prefillData.pdfName || ''
      });
      showToast('Draft loaded successfully', 'success');
    }
  }, [prefillData]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const steps = [
    { id: 1, title: 'Details', icon: <FileEdit size={18} /> },
    { id: 2, title: 'Upload', icon: <Upload size={18} /> },
    { id: 3, title: 'Review', icon: <CheckCircle2 size={18} /> }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        setFile(selectedFile);
        setFormData(prev => ({ ...prev, pdfName: selectedFile.name }));
      } else {
        showToast('Please upload only .pdf files.', 'error');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFormData(prev => ({ ...prev, pdfName: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.abstract || !formData.category) {
        showToast('Please fill all required details', 'info');
        return;
      }
    }
    if (currentStep === 2) {
      if (!file && !formData.pdfName) {
        showToast('Please upload your manuscript', 'info');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSaveDraft = async () => {
    if (!formData.title) {
      showToast('At least a title is required to save a draft', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('abstract', formData.abstract);
      payload.append('category', formData.category);
      payload.append('status', 'draft');
      if (file) {
        payload.append('pdf', file);
      } else if (formData.pdfName) {
        payload.append('pdfName', formData.pdfName);
      }

      let response;
      if (savedDraftId) {
        // Update existing draft
        response = await api.put(`/articles/${savedDraftId}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new draft
        response = await api.post('/articles', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        showToast(savedDraftId ? 'Draft version updated' : 'Draft version synchronized', 'success');
        if (response.data.article?.articleId) {
          setSavedDraftId(response.data.article.articleId);
        }
        // Don't show success screen for simple draft save, just show toast
      }
    } catch (error: any) {
      console.error('Draft save failed:', error);
      showToast('Failed to save draft', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.abstract || !formData.category || (!file && !formData.pdfName)) {
      showToast('Form incomplete. Please check all steps.', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('abstract', formData.abstract);
      payload.append('category', formData.category);
      if (file) payload.append('pdf', file);

      const response = await api.post('/articles', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setIsSuccess(true);
        // Reset form
        setFormData({
          title: '',
          abstract: '',
          keywords: '',
          category: '',
          allowComments: true,
          pdfName: ''
        });
        setFile(null);
      }
    } catch (error: any) {
      console.error('Submission failed:', error);
      showToast(error.response?.data?.error || 'Failed to submit article', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in fade-in zoom-in duration-700">
        <div className="relative mb-10">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10 relative z-10">
            <CheckCircle2 size={48} className="animate-in zoom-in duration-500 delay-200" />
          </div>
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
        </div>
        <h1 className="text-4xl font-bold text-black mb-3 tracking-tighter font-['Outfit']">Manuscript Received!</h1>
        <p className="text-zinc-500 max-w-sm mx-auto mb-10 leading-relaxed">
          Your research has been successfully submitted to the KMA Peer-Review Engine. You can monitor its progress in your dashboard.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsSuccess(false)}
            className="px-8 py-4 bg-black text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            SUBMIT ANOTHER
          </button>
          <NavLink 
            to="/author/dashboard"
            className="px-8 py-4 bg-white text-black border border-zinc-200 rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-50 transition-all active:scale-95 flex items-center justify-center shadow-sm"
          >
            VIEW DASHBOARD
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 px-4">
      {/* Header section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-black/10">
            <FileEdit size={18} className="text-white" />
          </div>
          <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">Manuscript Submission</h2>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Contribute Research</h1>
        <p className="text-zinc-500 mt-2 text-sm leading-relaxed">Submit your original mathematical research for peer review and global publication.</p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-100 -translate-y-1/2" />
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 border-4",
                currentStep >= step.id 
                  ? "bg-black text-white border-white shadow-lg shadow-black/10" 
                  : "bg-zinc-100 text-zinc-400 border-zinc-100"
              )}>
                {currentStep > step.id ? <CheckCircle2 size={18} /> : step.icon}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                currentStep >= step.id ? "text-black" : "text-zinc-400"
              )}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-black transition-all duration-500 -translate-y-1/2" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form Content */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Article Details */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-black/[0.02] border border-zinc-100 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-2 border-b border-zinc-50 pb-4">
                  <div className="w-1.5 h-6 bg-black rounded-full" />
                  <h3 className="font-bold text-black tracking-tight font-['Outfit']">STEP 1: METADATA</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Article Title *</label>
                    <input 
                      type="text" 
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Advanced Topology in Non-Euclidean Spaces"
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Category *</label>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                          className="w-full flex items-center justify-between px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none cursor-pointer transition-all hover:border-black"
                        >
                          <span className={cn(formData.category ? "text-black font-bold" : "text-zinc-400")}>
                            {formData.category || 'Select Category'}
                          </span>
                          <ChevronDown size={18} className={cn("text-zinc-400 transition-transform duration-200", isCategoryOpen && "rotate-180")} />
                        </button>

                        {isCategoryOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl z-20 py-2 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                              {['Pure Mathematics', 'Applied Mathematics', 'Statistics', 'Mathematical Physics'].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, category: cat }));
                                    setIsCategoryOpen(false);
                                  }}
                                  className={cn(
                                    "w-full px-5 py-3 text-left text-xs font-bold transition-all flex items-center gap-3",
                                    formData.category === cat ? "bg-zinc-50 text-black" : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                                  )}
                                >
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    formData.category === cat ? "bg-black" : "bg-zinc-200"
                                  )} />
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Keywords</label>
                      <input 
                        type="text" 
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleInputChange}
                        placeholder="Topology, Analysis, etc."
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Executive Abstract *</label>
                      <span className="text-[8px] font-bold text-zinc-400 tracking-wider bg-zinc-50 px-2 py-1 rounded">MIN. 200 WORDS</span>
                    </div>
                    <textarea 
                      name="abstract"
                      required
                      value={formData.abstract}
                      onChange={handleInputChange}
                      rows={8}
                      placeholder="Summarize your methodology, key findings, and theoretical significance..."
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none placeholder:text-zinc-400"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Document Upload */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-black/[0.02] border border-zinc-100 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-6 border-b border-zinc-50 pb-4">
                  <div className="w-1.5 h-6 bg-black rounded-full" />
                  <h3 className="font-bold text-black tracking-tight font-['Outfit'] uppercase">STEP 2: MANUSCRIPT UPLOAD</h3>
                </div>

                <div className="bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] p-8">
                  {!file && !formData.pdfName ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                      <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto border border-zinc-50">
                        <Upload size={32} className="text-zinc-200" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-black font-['Outfit'] tracking-tight">Select Research Paper</h4>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.3em]">PDF Document Only (Max 25MB)</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-12 py-5 bg-black text-white text-[10px] font-black rounded-2xl tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-2xl shadow-black/10 active:scale-95 uppercase mt-4"
                      >
                        CHOOSE FILE
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Document Card */}
                      <div className="w-full p-6 bg-white border border-zinc-100 rounded-3xl shadow-xl shadow-black/[0.02] flex items-center gap-6 animate-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 shrink-0">
                          <FileText size={28} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-lg font-bold text-black truncate font-['Outfit']">
                            {file?.name || formData.pdfName}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • READY` : "PREVIOUSLY UPLOADED • ARCHIVED"}
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={removeFile}
                          className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Preview Area */}
                      <div className="w-full aspect-[4/3] bg-zinc-100 rounded-[2rem] border border-dashed border-zinc-200 overflow-hidden relative group">
                        {previewUrl ? (
                          <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3 bg-zinc-50">
                            {formData.pdfName ? (
                              <>
                                <FileText size={48} className="opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Archived document preview locked</p>
                              </>
                            ) : (
                              <>
                                <Eye size={48} className="opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Generating secure preview...</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Below */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 px-8 py-4 bg-zinc-900 text-white text-[10px] font-black rounded-2xl tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 uppercase"
                        >
                          REPLACE DOCUMENT
                        </button>
                        {previewUrl && (
                          <a 
                            href={previewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-zinc-200 text-black text-[10px] font-black rounded-2xl tracking-widest hover:bg-zinc-50 transition-all shadow-sm active:scale-95 uppercase"
                          >
                            <Eye size={16} />
                            OPEN FULL PREVIEW
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
            )}

            {/* Step 3: Final Review */}
            {currentStep === 3 && (
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-black/[0.02] border border-zinc-100 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-2 border-b border-zinc-50 pb-4">
                  <div className="w-1.5 h-6 bg-black rounded-full" />
                  <h3 className="font-bold text-black tracking-tight font-['Outfit'] uppercase">STEP 3: FINAL VERIFICATION</h3>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">Category</p>
                      <p className="text-sm font-bold text-black">{formData.category}</p>
                    </div>
                    <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">Keywords</p>
                      <p className="text-sm font-bold text-black">{formData.keywords || 'None specified'}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[9px] text-zinc-400 uppercase font-bold mb-2 tracking-wider">Article Title</p>
                    <p className="text-lg font-bold text-black font-['Outfit']">{formData.title}</p>
                  </div>

                  <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <FileText size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Selected Manuscript</p>
                      <p className="text-sm font-bold">{file?.name}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                    <AlertCircle size={20} className="text-amber-500 shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 mb-1">Final Submission Disclaimer</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        By clicking "Confirm Submission", you certify that this research is original, anonymized for peer review, and has not been published elsewhere.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 rounded-xl text-xs font-black tracking-widest transition-all",
                    currentStep === 1 ? "opacity-0" : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  <ChevronLeft size={18} />
                  BACK
                </button>

                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95 disabled:bg-zinc-50"
                >
                  {savedDraftId ? 'UPDATE DRAFT' : 'SAVE DRAFT'}
                </button>
              </div>

              {currentStep < 3 ? (
                <button 
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-10 py-4 bg-black text-white rounded-xl font-bold text-xs tracking-widest hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all active:scale-95"
                >
                  NEXT STEP
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-12 py-4 bg-black text-white rounded-xl font-bold text-xs tracking-widest hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all active:scale-95 disabled:bg-zinc-200 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      TRANSMITTING...
                    </>
                  ) : (
                    <>
                      CONFIRM SUBMISSION
                      <Send size={18} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Sidebar Info (Right) */}
        <div className="space-y-6">
          {/* Section 3: Author Info */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-black/[0.02] border border-zinc-100">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 px-1">Author Identity</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Author Name</p>
                  <p className="text-sm font-bold text-black">{localStorage.getItem('userName') || 'Author'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Registry Email</p>
                  <p className="text-sm font-bold text-black">{localStorage.getItem('userEmail') || 'research@kma.org'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Academic Host</p>
                  <p className="text-sm font-bold text-black">Kerala Mathematical Inst.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Session Verified</span>
            </div>
          </div>

          {/* Section 4: Submission Settings */}
          <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-1">Options</h4>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center pt-1">
                <input 
                  type="checkbox"
                  name="allowComments"
                  checked={formData.allowComments}
                  onChange={handleInputChange}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-300 bg-white transition-all checked:bg-black checked:border-black outline-none"
                />
                <CheckCircle2 className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity p-0.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-black block mb-1">Allow Internal Reviews</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                  Reviewers can embed digital annotations directly into the manuscript.
                </p>
              </div>
            </label>
          </div>

          {/* Quick Support */}
          <div className="p-6 bg-zinc-900 text-white rounded-3xl shadow-xl space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Submission Support</h4>
            <p className="text-xs font-bold">Having trouble with your upload?</p>
            <p className="text-[10px] text-zinc-400 leading-relaxed">Our technical editorial team is available to assist with formatting issues.</p>
            <button className="text-[9px] font-black uppercase tracking-widest text-white border-b border-white/20 pb-0.5 hover:border-white transition-all">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitArticle;
