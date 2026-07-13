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
  GraduationCap,
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
import { useProfile } from '../../hooks/useProfile';
import { useEffect } from 'react';
import ReportIssueModal from '../../components/ReportIssueModal';

const SubmitArticle = () => {
  const { showToast } = useNotification();
  const { profile } = useProfile();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
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
    allowComments: prefillData?.allowComments !== undefined ? prefillData.allowComments : true,
    termsAccepted: false,
    pdfName: prefillData?.pdfName || ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(prefillData?.id || prefillData?.articleId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Co-author state
  const [coAuthors, setCoAuthors] = useState<any[]>(prefillData?.authors?.filter((a: any) => a.role === 'coauthor') || []);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchTerm.length < 2) {
        setUserSearchResults([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const response = await api.get(`/users?search=${userSearchTerm}`);
        if (response.data.success) {
          // Filter out current user and already added co-authors
          const filtered = response.data.users.filter((u: any) => 
            u.id !== profile?.uid && !coAuthors.some(ca => ca.userId === u.id || ca.id === u.id)
          );
          setUserSearchResults(filtered);
        }
      } catch (error) {
        console.error('User search failed:', error);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm, profile?.uid, coAuthors]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefillData) {
      setFormData({
        title: prefillData.title || '',
        abstract: prefillData.abstract || '',
        keywords: prefillData.keywords || '',
        category: prefillData.category || '',
        allowComments: false,
        termsAccepted: false,
        pdfName: prefillData.pdfName || ''
      });
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
    
    // Clear error when user types/corrects
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        setFile(selectedFile);
        setFormData(prev => ({ ...prev, pdfName: selectedFile.name }));
        if (errors.pdf) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.pdf;
            return newErrors;
          });
        }
      } else {
        showToast('Please upload only .pdf files.', 'error');
      }
    }
  };


  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
        setThumbnailFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setThumbnailPreview(url);
      } else {
        showToast('Please upload an image file (JPG, PNG, WEBP).', 'error');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFormData(prev => ({ ...prev, pdfName: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Manuscript title is required';
      if (!formData.category) newErrors.category = 'Please select a research category';
      if (!formData.abstract.trim()) {
        newErrors.abstract = 'Executive abstract is required';
      } else if (formData.abstract.trim().split(/\s+/).length < 10) { 
        newErrors.abstract = 'Abstract must be at least 10 words';
      }
    }
    
    if (step === 2) {
      if (!file && !formData.pdfName) newErrors.pdf = 'Please upload your research manuscript (PDF)';
    }

    if (step === 3) {
      if (!formData.termsAccepted) newErrors.termsAccepted = 'You must agree to the submission terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      showToast('Please correct the highlighted fields', 'error');
    }
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

      if (thumbnailFile) {
        payload.append('thumbnail', thumbnailFile);
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
    
    // Validate all steps and accumulate errors
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);

    if (!step1Valid || !step2Valid || !step3Valid) {
      showToast('Form incomplete. Please check all steps.', 'error');
      
      // Re-run validation for all steps to populate 'errors' state correctly
      const allErrors: Record<string, string> = {};
      
      // Step 1 check
      if (!formData.title.trim()) allErrors.title = 'Manuscript title is required';
      if (!formData.category) allErrors.category = 'Please select a research category';
      if (!formData.abstract.trim()) {
        allErrors.abstract = 'Executive abstract is required';
      } else if (formData.abstract.trim().split(/\s+/).length < 10) {
        allErrors.abstract = 'Abstract must be at least 10 words';
      }
      
      // Step 2 check
      if (!file && !formData.pdfName) allErrors.pdf = 'Please upload your research manuscript (PDF)';
      
      // Step 3 check
      if (!formData.termsAccepted) allErrors.termsAccepted = 'You must agree to the submission terms';
      if (!formData.allowComments) allErrors.allowComments = 'Please enable internal reviews for peer processing';

      setErrors(allErrors);

      if (allErrors.title || allErrors.abstract || allErrors.category) setCurrentStep(1);
      else if (allErrors.pdf) setCurrentStep(2);
      else setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('abstract', formData.abstract);
      payload.append('category', formData.category);
      if (file) payload.append('pdf', file);
      if (thumbnailFile) payload.append('thumbnail', thumbnailFile);
      payload.append('status', 'submitted');
      
      // Add co-authors
      coAuthors.forEach(ca => {
        payload.append('inviteeUserIds[]', ca.userId || ca.id);
      });

      let response;
      if (savedDraftId) {
        response = await api.put(`/articles/${savedDraftId}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/articles', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        if (response.data.invitationsQueued) {
          showToast('Manuscript submitted. Co-author invitations queued.', 'success');
        }
        setIsSuccess(true);
        // Reset form
        setFormData({
          title: '',
          abstract: '',
          keywords: '',
          category: '',
          allowComments: false,
          termsAccepted: false,
          pdfName: ''
        });
        setFile(null);
        setCoAuthors([]);
        setSavedDraftId(null);
        setThumbnailFile(null);
        setThumbnailPreview(null);
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
          Your research has been successfully submitted to the BKMA Peer-Review Engine. You can monitor its progress in your dashboard.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setIsSuccess(false);
              setCurrentStep(1);
              setFormData({
                title: '',
                abstract: '',
                keywords: '',
                category: '',
                allowComments: false,
                termsAccepted: false,
                pdfName: ''
              });
              setCoAuthors([]);
              setSavedDraftId(null);
              setThumbnailFile(null);
              setThumbnailPreview(null);
              setErrors({});
            }}
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
        <div className="absolute top-5 left-0 w-full h-0.5 bg-zinc-100" />
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
          className="absolute top-5 left-0 h-0.5 bg-black transition-all duration-500" 
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
                  <h3 className="font-bold text-black tracking-tight font-['Outfit']">STEP 1: METADATA & AUTHORS</h3>
                </div>

                <div className="space-y-5">
                  {/* Co-author Picker */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Invite Co-authors (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={16} className="text-zinc-400" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-zinc-400"
                      />
                      {isSearchingUsers && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 size={16} className="animate-spin text-zinc-400" />
                        </div>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {userSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl z-30 py-2 animate-in slide-in-from-top-2 duration-200">
                        {userSearchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setCoAuthors([...coAuthors, { userId: user.id, name: user.name, email: user.email }]);
                              setUserSearchTerm('');
                              setUserSearchResults([]);
                            }}
                            className="w-full px-5 py-3 text-left hover:bg-zinc-50 transition-all flex items-center justify-between group"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-black">{user.name}</span>
                              <span className="text-[10px] text-zinc-400 font-medium">{user.email}</span>
                            </div>
                            <Send size={14} className="text-zinc-300 group-hover:text-black transition-all" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Co-authors Chips */}
                    {coAuthors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {coAuthors.map((ca) => (
                          <div key={ca.userId || ca.id} className="flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-xl border border-zinc-200 animate-in zoom-in duration-300">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-black leading-tight">{ca.name}</span>
                              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter">{ca.email}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setCoAuthors(coAuthors.filter(a => (a.userId || a.id) !== (ca.userId || ca.id)))}
                              className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-black transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-50 pt-4" />

                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Article Title *</label>
                    <input 
                      type="text" 
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Advanced Topology in Non-Euclidean Spaces"
                      className={cn(
                        "w-full px-5 py-4 bg-zinc-50 border rounded-2xl text-sm focus:ring-2 outline-none transition-all placeholder:text-zinc-400",
                        errors.title 
                          ? "border-rose-500 bg-rose-50/30 focus:ring-rose-200" 
                          : "border-zinc-200 focus:ring-black"
                      )}
                    />
                    {errors.title && (
                      <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5 animate-in slide-in-from-top-1">
                        <AlertCircle size={12} />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Article Thumbnail (Optional)</label>
                    <div className="flex items-center gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                      <div className="w-20 h-20 bg-white rounded-xl border border-zinc-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {thumbnailPreview ? (
                          <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="text-zinc-300" size={24} />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => thumbnailInputRef.current?.click()}
                            className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all uppercase"
                          >
                            {thumbnailFile ? 'Change Image' : 'Select Image'}
                          </button>
                          {thumbnailFile && (
                            <button 
                              type="button"
                              onClick={removeThumbnail}
                              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black tracking-widest hover:bg-rose-100 transition-all uppercase"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-zinc-400 font-medium">Recommended: 1200x630px (JPG/PNG). Max 5MB.</p>
                        <input 
                          type="file"
                          ref={thumbnailInputRef}
                          onChange={handleThumbnailChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Category *</label>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                          className={cn(
                            "w-full flex items-center justify-between px-5 py-4 bg-zinc-50 border rounded-2xl text-sm outline-none cursor-pointer transition-all hover:border-black",
                            errors.category 
                              ? "border-rose-500 bg-rose-50/30 focus:ring-2 focus:ring-rose-200" 
                              : "border-zinc-200 focus:ring-2 focus:ring-black"
                          )}
                        >
                          <span className={cn(formData.category ? "text-black font-bold" : "text-zinc-400")}>
                            {formData.category || 'Select Category'}
                          </span>
                          <ChevronDown size={18} className={cn("text-zinc-400 transition-transform duration-200", isCategoryOpen && "rotate-180")} />
                        </button>
                        {errors.category && (
                          <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5 animate-in slide-in-from-top-1">
                            <AlertCircle size={12} />
                            {errors.category}
                          </p>
                        )}

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
                                    if (errors.category) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.category;
                                        return newErrors;
                                      });
                                    }
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
                    </div>
                    <textarea 
                      name="abstract"
                      required
                      value={formData.abstract}
                      onChange={handleInputChange}
                      rows={8}
                      placeholder="Summarize your methodology, key findings, and theoretical significance..."
                      className={cn(
                        "w-full px-5 py-4 bg-zinc-50 border rounded-2xl text-sm focus:ring-2 outline-none transition-all resize-none placeholder:text-zinc-400",
                        errors.abstract 
                          ? "border-rose-500 bg-rose-50/30 focus:ring-rose-200" 
                          : "border-zinc-200 focus:ring-black"
                      )}
                    ></textarea>
                    {errors.abstract && (
                      <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5 animate-in slide-in-from-top-1">
                        <AlertCircle size={12} />
                        {errors.abstract}
                      </p>
                    )}
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

                <div className={cn(
                  "bg-zinc-50/50 border rounded-[2.5rem] p-8 transition-all",
                  errors.pdf ? "border-rose-500 bg-rose-50/30" : "border-zinc-100"
                )}>
                  {!file && !formData.pdfName ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                      <div className={cn(
                        "w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto border transition-all",
                        errors.pdf ? "border-rose-200 shadow-rose-500/10" : "border-zinc-50"
                      )}>
                        <Upload size={32} className={cn(errors.pdf ? "text-rose-400" : "text-zinc-200")} />
                      </div>
                      <div className="space-y-2">
                        <h4 className={cn("text-xl font-bold font-['Outfit'] tracking-tight", errors.pdf ? "text-rose-600" : "text-black")}>
                          {errors.pdf ? "Manuscript Required" : "Select Research Paper"}
                        </h4>
                        <p className={cn("text-[10px] uppercase font-bold tracking-[0.3em]", errors.pdf ? "text-rose-400" : "text-zinc-500")}>
                          {errors.pdf ? errors.pdf : "PDF Document Only (Max 25MB)"}
                        </p>
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

                  <div className={cn(
                    "p-6 rounded-2xl border transition-all",
                    errors.termsAccepted ? "bg-rose-50 border-rose-200" : "bg-white border-zinc-100 shadow-sm"
                  )}>
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative flex items-center pt-1">
                        <input 
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          className={cn(
                            "peer h-6 w-6 cursor-pointer appearance-none rounded-md border transition-all checked:bg-black checked:border-black outline-none",
                            errors.termsAccepted ? "border-rose-500 bg-rose-100" : "border-zinc-300 bg-white"
                          )}
                        />
                        <CheckCircle2 className="absolute h-6 w-6 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity p-1" />
                      </div>
                      <div>
                        <span className={cn("text-xs font-bold block mb-1", errors.termsAccepted ? "text-rose-700" : "text-black")}>
                          I certify that this research is original and anonymized.
                        </span>
                        <p className={cn("text-[10px] leading-relaxed", errors.termsAccepted ? "text-rose-500" : "text-zinc-500")}>
                          By checking this box, you confirm that the manuscript adheres to BKMA Peer-Review standards and has not been published elsewhere.
                        </p>
                        {errors.termsAccepted && (
                          <p className="mt-2 text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                            <AlertCircle size={10} />
                            Required Confirmation
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                  
                  {/* Submission deletion policy warning */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 shadow-sm mt-6">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Submission Deletion Policy</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed mt-0.5">
                        Once this manuscript is submitted for review, it cannot be deleted from the system logs. Please ensure all details are correct before final submission.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-zinc-100">
              <div className="grid grid-cols-2 sm:flex gap-3">
                <button 
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all",
                    currentStep === 1 ? "hidden sm:flex opacity-0 pointer-events-none" : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  <ChevronLeft size={16} />
                  BACK
                </button>

                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-[10px] tracking-widest hover:bg-zinc-200 transition-all active:scale-95 disabled:bg-zinc-50"
                >
                  {savedDraftId ? 'UPDATE DRAFT' : 'SAVE DRAFT'}
                </button>
              </div>

              {currentStep < 3 ? (
                <button 
                  type="button"
                  onClick={nextStep}
                  className="flex items-center justify-center gap-2 px-10 py-4 bg-black text-white rounded-xl font-bold text-[10px] tracking-widest hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all active:scale-95"
                >
                  NEXT STEP
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-12 py-4 bg-black text-white rounded-xl font-bold text-[10px] tracking-widest hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all active:scale-95 disabled:bg-zinc-200 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      TRANSMITTING...
                    </>
                  ) : (
                    <>
                      CONFIRM SUBMISSION
                      <Send size={16} />
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
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-zinc-100 shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                    <User size={18} />
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Author Name</p>
                  <p className="text-sm font-bold text-black">{profile?.name || localStorage.getItem('userName') || 'Author User'}</p>
                </div>
              </div>

              {profile?.designation && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Designation</p>
                    <p className="text-sm font-bold text-black">{profile.designation}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Registry Email</p>
                  <p className="text-sm font-bold text-black">{profile?.email || localStorage.getItem('userEmail') || 'research@bkma.org'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Session Verified</span>
            </div>
          </div>

          {/* Section 4: Submission Settings */}
          <div className={cn(
            "rounded-3xl p-6 border transition-all",
            !formData.allowComments ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-100"
          )}>
            <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-1", !formData.allowComments ? "text-amber-500" : "text-zinc-400")}>Options</h4>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center pt-1">
                <input 
                  type="checkbox"
                  name="allowComments"
                  checked={formData.allowComments}
                  onChange={handleInputChange}
                  className={cn(
                    "peer h-5 w-5 cursor-pointer appearance-none rounded-md border transition-all checked:bg-black checked:border-black outline-none",
                    !formData.allowComments ? "border-amber-500 bg-amber-100" : "border-zinc-300 bg-white"
                  )}
                />
                <CheckCircle2 className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity p-0.5" />
              </div>
              <div>
                <span className={cn("text-xs font-bold block mb-1", !formData.allowComments ? "text-amber-700" : "text-black")}>Allow Internal Reviews</span>
                <p className={cn("text-[10px] leading-relaxed italic", !formData.allowComments ? "text-amber-600" : "text-zinc-500")}>
                  Reviewers can embed digital annotations directly into the manuscript.
                </p>
                {!formData.allowComments && (
                  <p className="mt-2 text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle size={10} />
                    Warning: Disabling this may delay the review process
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Quick Support */}
          <div className="p-6 bg-zinc-900 text-white rounded-3xl shadow-xl space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Submission Support</h4>
            <p className="text-xs font-bold">Having trouble with your upload?</p>
            <p className="text-[10px] text-zinc-400 leading-relaxed">Our technical editorial team is available to assist with formatting issues.</p>
            <button 
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="text-[9px] font-black uppercase tracking-widest text-white border-b border-white/20 pb-0.5 hover:border-white transition-all"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      <ReportIssueModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        userRole="author"
      />
    </div>
  );
};

export default SubmitArticle;
