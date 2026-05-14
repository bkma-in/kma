import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  User, 
  Loader2, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../utils/NotificationContext';
import { auth } from '../config/firebase';
import { cn } from '../utils/cn';

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [article, setArticle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const queryParams = new URLSearchParams(window.location.search);
  const articleIdFromUrl = queryParams.get('articleId');

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await api.get(`/articles/invitations/${token}${articleIdFromUrl ? `?articleId=${articleIdFromUrl}` : ''}`);
        if (response.data.success) {
          setInvitation(response.data.invitation);
          setArticle(response.data.article);
        }
      } catch (err: any) {
        console.error('Fetch invitation error:', err);
        setError(err.response?.data?.error || 'Failed to fetch invitation details');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchInvitation();
  }, [token, articleIdFromUrl]);

  const handleAccept = async () => {
    if (!currentUser) {
      showToast('Please login to accept the invitation', 'info');
      navigate('/auth', { state: { from: window.location.pathname + window.location.search } });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post(`/articles/invitations/${token}/accept${articleIdFromUrl ? `?articleId=${articleIdFromUrl}` : ''}`);
      if (response.data.success) {
        showToast('You are now a co-author of this article!', 'success');
        navigate('/author/articles');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to accept invitation', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason || rejectReason.length < 10) {
      showToast('Please provide a reason (min 10 characters)', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post(`/articles/invitations/${token}/reject${articleIdFromUrl ? `?articleId=${articleIdFromUrl}` : ''}`, { reason: rejectReason });
      if (response.data.success) {
        showToast('Invitation declined', 'info');
        navigate('/author/dashboard');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to decline invitation', 'error');
    } finally {
      setIsProcessing(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <AlertCircle size={64} className="text-rose-500 mb-6" />
        <h1 className="text-2xl font-bold text-black mb-2">Invitation Error</h1>
        <p className="text-zinc-500 max-w-md mb-8">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-black text-white rounded-xl font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all"
        >
          BACK TO HOME
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-20 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-zinc-100 shadow-2xl shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="p-10 border-b border-zinc-50 text-center bg-gradient-to-b from-zinc-50/50 to-white">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10">
            <User size={32} />
          </div>
          <h2 className="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase mb-2">Co-author Invitation</h2>
          <h1 className="text-3xl font-bold tracking-tight text-black font-['Outfit']">Collaborate on Research</h1>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                <User size={20} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Invited By</p>
                <p className="text-sm font-bold text-black">{article.authorName}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                <FileText size={20} className="text-zinc-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Article Title</p>
                <p className="text-lg font-bold text-black font-['Outfit'] leading-snug">{article.title}</p>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Executive Abstract</p>
              <p className="text-sm text-zinc-500 leading-relaxed line-clamp-4 italic">
                "{article.abstract}"
              </p>
            </div>
          </div>

          {!currentUser && (
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Authentication Required</p>
                <p className="text-xs text-amber-700">You need to sign in to your KMA account to accept this invitation.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 px-8 py-5 bg-black text-white rounded-2xl font-black text-[10px] tracking-[0.3em] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 uppercase"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Accept Invitation
            </button>
            <button 
              onClick={() => setShowRejectModal(true)}
              disabled={isProcessing}
              className="px-8 py-5 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] tracking-[0.3em] hover:bg-rose-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 uppercase"
            >
              <XCircle size={18} />
              Decline
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-xl font-bold text-black font-['Outfit']">Reason for Declining</h3>
            </div>
            
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Please provide a brief reason why you are declining this co-author invitation. This helps the primary author understand your decision.
            </p>

            <textarea 
              autoFocus
              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-200 outline-none transition-all resize-none mb-6 placeholder:text-zinc-400"
              rows={4}
              placeholder="e.g. I am unable to commit to this research project at this time..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-xl font-black text-[10px] tracking-widest hover:bg-zinc-200 transition-all uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={isProcessing || rejectReason.length < 10}
                className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-black text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 uppercase"
              >
                Submit & Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptInvitation;
