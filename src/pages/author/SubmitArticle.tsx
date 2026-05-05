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
  AlertCircle
} from 'lucide-react';


const SubmitArticle = () => {
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    category: '',
    allowComments: true
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'doc' || extension === 'docx') {
        setFile(selectedFile);
      } else {
        alert('Please upload only .doc or .docx files.');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.abstract || !formData.category || !file) {
      alert('Please fill all required fields and upload a manuscript.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSuccess(true);
      // Reset form after success
      setFormData({
        title: '',
        abstract: '',
        keywords: '',
        category: '',
        allowComments: true
      });
      setFile(null);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-bold text-black mb-2 tracking-tight">Manuscript Submitted!</h1>
        <p className="text-zinc-500 max-w-md mx-auto mb-8">
          Your article has been successfully uploaded to the KMA Archive. You can track its status in the "My Articles" section.
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="px-8 py-3 bg-black text-white rounded-xl font-bold text-sm tracking-widest hover:bg-zinc-800 transition-all"
        >
          SUBMIT ANOTHER
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <FileEdit size={18} className="text-white" />
          </div>
          <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Manuscript Submission</h2>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter text-black">Contribute Research</h1>
        <p className="text-zinc-500 mt-2 text-sm">Submit your original mathematical research for peer review and publication.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Article Details */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-zinc-100 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-zinc-50 pb-4">
              <div className="w-1.5 h-6 bg-black rounded-full" />
              <h3 className="font-bold text-black tracking-tight">ARTICLE DETAILS</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Article Title *</label>
                <input 
                  type="text" 
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Advanced Topology in Non-Euclidean Spaces"
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Category *</label>
                  <select 
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    <option value="Pure Mathematics">Pure Mathematics</option>
                    <option value="Applied Mathematics">Applied Mathematics</option>
                    <option value="Statistics">Statistics</option>
                    <option value="Mathematical Physics">Mathematical Physics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Keywords</label>
                  <input 
                    type="text" 
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="Topology, Analysis, etc."
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Abstract / Description *</label>
                  <span className="text-[8px] font-bold text-zinc-400 tracking-wider bg-zinc-50 px-2 py-1 rounded">MIN. 200 WORDS</span>
                </div>
                <textarea 
                  name="abstract"
                  required
                  value={formData.abstract}
                  onChange={handleInputChange}
                  rows={8}
                  placeholder="Summarize your methodology, key findings, and theoretical significance..."
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none placeholder:text-zinc-400"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Document Upload */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-2 mb-6 border-b border-zinc-50 pb-4">
              <div className="w-1.5 h-6 bg-black rounded-full" />
              <h3 className="font-bold text-black tracking-tight uppercase">Document Upload</h3>
            </div>

            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-zinc-200 hover:border-black rounded-2xl p-12 transition-all flex flex-col items-center justify-center cursor-pointer bg-zinc-50/50 hover:bg-zinc-50"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload size={24} className="text-zinc-400 group-hover:text-black transition-colors" />
                </div>
                <h4 className="text-sm font-bold text-black mb-1">Upload Manuscript</h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Accepts .doc and .docx only</p>
                <div className="px-4 py-2 bg-black text-white text-[10px] font-bold rounded-lg tracking-widest">SELECT FILE</div>
                
                <div className="mt-8 flex items-start gap-2 max-w-sm text-center">
                  <Info size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                    Upload editable document so reviewers can add comments directly within the text for precise feedback.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-5 bg-zinc-900 text-white rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{file.name}</p>
                  <p className="text-[10px] text-zinc-400 font-bold tracking-wider">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    title="Replace File"
                  >
                    <Upload size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={removeFile}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                    title="Remove File"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".doc,.docx"
              className="hidden"
            />
          </div>
        </div>

        {/* Sidebar Info (Right) */}
        <div className="space-y-6">
          {/* Section 3: Author Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Author Identity</h4>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Full Name</p>
                  <p className="text-sm font-bold text-black">Dr. Aris Thorne</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Email Address</p>
                  <p className="text-sm font-bold text-black">aris.thorne@kma.edu</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Institution</p>
                  <p className="text-sm font-bold text-black">Kerala Mathematical Inst.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verified Profile</span>
            </div>
          </div>

          {/* Section 4: Submission Settings */}
          <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Settings</h4>
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
                <span className="text-xs font-bold text-black block mb-1">Allow Internal Comments</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Allow reviewers to add comments inside the document for collaborative peer-review.
                </p>
              </div>
            </label>
          </div>

          {/* Section 5: Action Buttons */}
          <div className="space-y-3 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm tracking-widest hover:bg-zinc-800 disabled:bg-zinc-200 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  SUBMITTING...
                </>
              ) : (
                "SUBMIT ARTICLE"
              )}
            </button>
            <button 
              type="button"
              className="w-full py-4 bg-white text-black border border-zinc-200 rounded-xl font-bold text-sm tracking-widest hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Clock size={18} />
              SAVE AS DRAFT
            </button>
          </div>

          {/* Guidelines Reminder */}
          <div className="p-4 bg-amber-50 rounded-xl flex gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
              Ensure your manuscript is anonymized and follows the KMA Journal formatting guidelines before final submission.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitArticle;
