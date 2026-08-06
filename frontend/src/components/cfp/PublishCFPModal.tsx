import React, { useState, useEffect } from 'react';
import { X, Send, Bell, Mail, Users, Loader2, AlertCircle } from 'lucide-react';
import type { CallForPaper } from '../../types/cfp';
import { estimateRecipients, publishCFP } from '../../services/cfp.service';

interface PublishCFPModalProps {
  isOpen: boolean;
  onClose: () => void;
  cfp: CallForPaper | null;
  onSuccess: (result: any) => void;
}

export const PublishCFPModal: React.FC<PublishCFPModalProps> = ({
  isOpen,
  onClose,
  cfp,
  onSuccess
}) => {
  const [sendInApp, setSendInApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [recipients, setRecipients] = useState({
    authors: true,
    readers: true,
    reviewers: false,
    subscribers: true
  });

  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  const hasAnyRecipient = recipients.authors || recipients.readers || recipients.reviewers || recipients.subscribers;
  const hasAnyChannel = sendInApp || sendEmail;

  useEffect(() => {
    if (!isOpen || !cfp) return;

    if (!hasAnyRecipient) {
      setEstimatedTotal(0);
      setLoadingEstimate(false);
      return;
    }

    const fetchEstimate = async () => {
      setLoadingEstimate(true);
      try {
        const res = await estimateRecipients(recipients);
        if (res.success) {
          setEstimatedTotal(res.totalEstimated);
        } else {
          setEstimatedTotal(0);
        }
      } catch (err) {
        console.error('Failed to estimate recipients:', err);
        setEstimatedTotal(0);
      } finally {
        setLoadingEstimate(false);
      }
    };

    fetchEstimate();
  }, [isOpen, cfp, recipients, hasAnyRecipient]);

  if (!isOpen || !cfp) return null;

  const handleToggleRecipient = (key: keyof typeof recipients) => {
    setRecipients(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePublish = async () => {
    if (isSubmitting || !hasAnyRecipient || !hasAnyChannel) return;

    setIsSubmitting(true);
    try {
      const res = await publishCFP(cfp.id, {
        sendInAppNotification: sendInApp,
        sendEmailNotification: sendEmail,
        recipients
      });

      if (res.success) {
        onSuccess(res);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to publish CFP:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-100 relative animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed) */}
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 border-b border-zinc-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black font-['Outfit']">Publish Call for Papers</h3>
              <p className="text-xs text-zinc-500 font-medium">Vol {cfp.volume} • Issue {cfp.issue}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-black p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options Body (Scrollable with min-h-0) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Notification Type Toggles */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInApp}
                onChange={(e) => setSendInApp(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black"
              />
              <span className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                <Bell size={16} className="text-zinc-500" />
                Send In-App Notification
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black"
              />
              <span className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                <Mail size={16} className="text-zinc-500" />
                Send Email Notification
              </span>
            </label>
          </div>

          {/* Recipients Category Section */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recipients:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'authors', label: 'Authors' },
                { key: 'readers', label: 'Readers' },
                { key: 'reviewers', label: 'Reviewers' },
                { key: 'subscribers', label: 'Subscribers' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={recipients[key as keyof typeof recipients]}
                    onChange={() => handleToggleRecipient(key as keyof typeof recipients)}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black"
                  />
                  <span className="text-xs font-bold text-zinc-800">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Estimated Recipients Calculation */}
          <div className="bg-zinc-100 p-4 rounded-2xl flex items-center justify-between border border-zinc-200/80">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Estimated recipients:</span>
            <span className="text-lg font-black text-black">
              {loadingEstimate ? <Loader2 size={16} className="animate-spin text-zinc-500" /> : estimatedTotal}
            </span>
          </div>

          {/* Validation Warning */}
          {(!hasAnyRecipient || !hasAnyChannel) && (
            <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5">
              <AlertCircle size={13} />
              {!hasAnyChannel ? 'Please select at least one notification channel (In-App or Email).' : 'Please select at least one recipient group.'}
            </p>
          )}

          {/* Email Policy Statement */}
          {sendEmail && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                Email sending policy:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-amber-900 font-medium">
                <li>Maximum 100 emails will be sent per day.</li>
                <li>If the selected recipients exceed 100, the remaining emails should be queued automatically and sent over the following days (100/day) until the queue is completed.</li>
                <li>In-app notifications should still be delivered immediately to all selected recipients.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Actions (Fixed Footer) */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 sm:px-8 border-t border-zinc-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-black hover:bg-zinc-100 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting || !hasAnyRecipient || !hasAnyChannel}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-black text-white hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Publish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
