import React, { useState } from 'react';
import { X, User, Mail, GraduationCap, Briefcase, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { addReviewer, resendReviewerCredentials } from '../../services/user.service';
import { useNotification } from '../../utils/NotificationContext';

interface AddReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reviewer: any) => void;
}

const AddReviewerModal: React.FC<AddReviewerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    qualification: '',
    experience: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [createdReviewerId, setCreatedReviewerId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await addReviewer(formData);
      if (response.success) {
        setCreatedReviewerId(response.reviewer.id);
        setEmailSent(!!response.emailSent);
        setIsSuccess(true);
        onSuccess(response.reviewer);
      }
    } catch (err: any) {
      console.error('Failed to create reviewer:', err);
      const msg = err.response?.data?.error || 'Failed to create reviewer user.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setEmailSent(true);
    setCreatedReviewerId('');
    setError('');
    setFormData({ name: '', email: '', qualification: '', experience: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={handleClose} 
      />
      
      <div className={cn(
        "relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform",
        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-bold text-black tracking-tight">Add New Reviewer</h3>
            <p className="text-xs text-zinc-500 font-medium">Create a new reviewer account and send onboarding email.</p>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 flex items-start gap-2 animate-shake">
                  <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={12} /> Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="jane.smith@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Academic Qualification */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap size={12} /> Academic Qualification
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ph.D. in Computer Science"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Professional Experience */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={12} /> Professional Experience
                  </label>
                  <textarea
                    required
                    placeholder="Briefly describe relevant research or industry experience..."
                    rows={3}
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                >
                  CANCEL
                </button>
                <button
                  disabled={isLoading}
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      ADDING...
                    </>
                  ) : (
                    'ADD REVIEWER'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 space-y-6">
              {emailSent ? (
                <>
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-black font-['Outfit']">Reviewer added successfully.</h4>
                    <p className="text-sm text-zinc-500 font-medium">
                      Login credentials have been sent to the reviewer's registered email address.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer mt-4"
                  >
                    DONE
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertCircle size={40} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-black font-['Outfit']">Reviewer created successfully.</h4>
                    <p className="text-sm text-zinc-600 font-semibold">
                      Unable to deliver login credentials via email.
                    </p>
                    <p className="text-xs text-zinc-400">
                      Please click "Resend Credentials".
                    </p>
                  </div>
                  
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer"
                    >
                      CLOSE
                    </button>
                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const response = await resendReviewerCredentials(createdReviewerId);
                          if (response.success) {
                            showToast('Credentials have been sent successfully.', 'success');
                            setEmailSent(true);
                          }
                        } catch (err: any) {
                          console.error(err);
                          const msg = err.response?.data?.error || 'Failed to resend credentials.';
                          showToast(msg, 'error');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          SENDING...
                        </>
                      ) : (
                        'RESEND CREDENTIALS'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddReviewerModal;
