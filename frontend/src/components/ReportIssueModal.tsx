import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

// Global error capture
let lastFrontendError: string | null = null;
window.onerror = (message) => {
  lastFrontendError = String(message);
};

import { reportIssue } from '../services/user.service';

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, userRole }) => {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form on close after animation
      const timer = setTimeout(() => {
        setIssueType('');
        setDescription('');
        setScreenshot(null);
        setScreenshotPreview(null);
        setIsSuccess(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType || !description) return;

    setIsSubmitting(true);

    // Auto-captured data
    const metadata = {
      url: window.location.href,
      role: userRole,
      user: localStorage.getItem('userEmail') || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      lastError: lastFrontendError
    };

    try {
      const formData = new FormData();
      formData.append('type', issueType);
      formData.append('description', description);
      formData.append('metadata', JSON.stringify(metadata));
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const response = await reportIssue(formData);

      if (response.success) {
        setIsSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        throw new Error(response.error || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Failed to report issue:', error);
      alert('Failed to report issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isSuccess) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={cn(
        "relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 border border-white/20",
        "h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden",
        isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
      )}>
        {isSuccess ? (
          <div className="p-12 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-green-600/10">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-black font-['Outfit']">Issue Reported Successfully</h3>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">Thank you for your feedback. Our development team has been notified.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-zinc-600" />
                <h3 className="font-bold text-black tracking-tight uppercase text-sm font-['Outfit']">Report an Issue</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Issue Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Issue Type</label>
                <select 
                  required
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select the type of issue</option>
                  <option value="Bug / Error">Bug / Error</option>
                  <option value="UI Problem">UI Problem</option>
                  <option value="Submission Issue">Submission Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what went wrong..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Screenshot (Optional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                    screenshotPreview ? "border-green-500 bg-green-50/10" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300"
                  )}
                >
                  {screenshotPreview ? (
                    <div className="relative w-full h-full p-2">
                      <img src={screenshotPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <p className="text-white text-xs font-bold">Change Image</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Upload size={20} className="text-zinc-400" />
                      </div>
                      <p className="text-xs text-zinc-500">Click to upload or drag & drop</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!issueType || !description || isSubmitting}
                className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm tracking-widest hover:bg-zinc-800 disabled:bg-zinc-200 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-black/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    SUBMITTING...
                  </>
                ) : (
                  "SUBMIT REPORT"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportIssueModal;
