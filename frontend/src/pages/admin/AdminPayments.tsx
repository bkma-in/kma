import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Filter,
  ShieldAlert,
  ExternalLink,
  QrCode,
  Upload
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import {
  getAdminPendingPayments,
  approvePayment,
  rejectPayment,
  uploadAdminQrCode
} from '../../services/payment.service';
import type { AdminPendingSubmission } from '../../services/payment.service';
import { CustomSelect } from '../../components/common/CustomSelect';

type PaymentFilterStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'All';

const AdminPayments = () => {
  const { showToast } = useNotification();
  const [submissions, setSubmissions] = useState<AdminPendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentFilterStatus>('All');

  // Modals state
  const [selectedProof, setSelectedProof] = useState<AdminPendingSubmission | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const [approveItem, setApproveItem] = useState<AdminPendingSubmission | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isProcessingApprove, setIsProcessingApprove] = useState(false);

  const [rejectItem, setRejectItem] = useState<AdminPendingSubmission | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getAdminPendingPayments();
      setSubmissions(data);
    } catch (err: any) {
      console.error('Failed to fetch admin payment submissions:', err);
      showToast('Failed to load payment verification queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProof = (sub: AdminPendingSubmission) => {
    if (!sub.proofUrl) {
      showToast('Payment proof URL unavailable or expired', 'error');
      return;
    }
    setSelectedProof(sub);
    setIsProofModalOpen(true);
  };

  const handleOpenApproveModal = (sub: AdminPendingSubmission) => {
    setApproveItem(sub);
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!approveItem) return;
    setIsProcessingApprove(true);
    try {
      const res = await approvePayment(approveItem.id);
      if (res.success) {
        showToast(`Payment approved! ${approveItem.userName}'s subscription is now active.`, 'success');
        setIsApproveModalOpen(false);
        setApproveItem(null);
        await fetchSubmissions();
      } else {
        showToast(res.error || 'Failed to approve payment', 'error');
      }
    } catch (err: any) {
      console.error('Approve error:', err);
      showToast(err?.response?.data?.error || err.message || 'Failed to approve payment.', 'error');
    } finally {
      setIsProcessingApprove(false);
    }
  };

  const handleOpenRejectModal = (sub: AdminPendingSubmission) => {
    setRejectItem(sub);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectItem) return;
    if (!rejectionReason.trim()) {
      showToast('A mandatory rejection reason is required.', 'error');
      return;
    }

    setIsProcessingReject(true);
    try {
      const res = await rejectPayment(rejectItem.id, rejectionReason.trim());
      if (res.success) {
        showToast(`Payment rejected. Rejection notification sent to ${rejectItem.userName}.`, 'info');
        setIsRejectModalOpen(false);
        setRejectItem(null);
        setRejectionReason('');
        await fetchSubmissions();
      } else {
        showToast(res.error || 'Failed to reject payment', 'error');
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      showToast(err?.response?.data?.error || err.message || 'Failed to reject payment.', 'error');
    } finally {
      setIsProcessingReject(false);
    }
  };

  const pendingSubmissions = submissions.filter((sub) => {
    if (sub.status !== 'PENDING_VERIFICATION') return false;
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      sub.userName.toLowerCase().includes(searchLower) ||
      sub.userEmail.toLowerCase().includes(searchLower) ||
      sub.transactionRef.toLowerCase().includes(searchLower) ||
      sub.id.toLowerCase().includes(searchLower)
    );
  });

  const historySubmissions = submissions.filter((sub) => {
    if (sub.status === 'PENDING_VERIFICATION') return false;
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      sub.userName.toLowerCase().includes(searchLower) ||
      sub.userEmail.toLowerCase().includes(searchLower) ||
      sub.transactionRef.toLowerCase().includes(searchLower) ||
      sub.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Outfit'] pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 mb-2 shadow-sm">
            <ShieldAlert size={12} className="text-amber-600" /> Pending Payment Verification Queue
          </div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Payment Verification</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Review submitted bank transfers against actual BKMA bank account records before approving subscription access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search member, email, UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black w-64 focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Submissions Pending Queue Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
            <Clock size={14} className="text-amber-600" /> Pending Approval Queue ({pendingSubmissions.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Member Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Membership Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Expected Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction UTR</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payment Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pendingSubmissions.map((sub) => (
                <tr key={sub.id} className="group hover:bg-zinc-50 transition-colors">
                  {/* Member details */}
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-black">{sub.userName}</p>
                    <p className="text-[10px] text-zinc-400">{sub.userEmail}</p>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">Submitted: {sub.submissionDate}</span>
                  </td>

                  {/* Membership Type */}
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                      sub.membershipType === 'lifetime' ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-zinc-100 text-zinc-700 border-zinc-200"
                    )}>
                      {sub.membershipType === 'lifetime' ? 'Verified Life Member (50% Off)' : 'Standard Annual Pass'}
                    </span>
                  </td>

                  {/* Expected Amount */}
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-emerald-700 font-mono">₹{sub.expectedAmount.toLocaleString()}</span>
                  </td>

                  {/* Transaction UTR */}
                  <td className="px-6 py-5">
                    <span className="text-xs font-mono font-bold text-black block bg-zinc-100 px-2 py-1 rounded w-fit">
                      {sub.transactionRef}
                    </span>
                    {sub.remarks && (
                      <p className="text-[10px] text-zinc-400 italic mt-1 max-w-[180px] truncate" title={sub.remarks}>
                        "{sub.remarks}"
                      </p>
                    )}
                  </td>

                  {/* Payment Date */}
                  <td className="px-6 py-5 text-xs text-zinc-600 font-medium">
                    {sub.paymentDate}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100">
                        <Clock size={10} /> PENDING VERIFICATION
                      </span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenProof(sub)}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="View uploaded payment receipt proof"
                      >
                        <Eye size={14} /> View Proof
                      </button>

                      <button
                        onClick={() => handleOpenApproveModal(sub)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Approve payment and activate subscription"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(sub)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Reject payment submission"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <Loader2 size={28} className="animate-spin text-black" />
                      <p className="text-xs font-bold uppercase tracking-widest">Loading payment verification queue...</p>
                    </div>
                  </td>
                </tr>
              ) : pendingSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm font-bold text-black">No Pending Payment Verifications</p>
                      <p className="text-xs text-zinc-500 max-w-sm text-center">
                        All submitted bank transfer payments have been reviewed. Any new payment proof submissions will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORICAL PAYMENT VERIFICATION AUDIT TRAIL */}
      {submissions.filter(s => s.status !== 'PENDING_VERIFICATION').length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden mt-12">
          <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50">
            <div>
              <span className="px-2.5 py-0.5 bg-zinc-200 text-zinc-800 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 inline-block">
                Historical Audit Log
              </span>
              <h2 className="text-xl font-bold text-black tracking-tight">Payment Verification History</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Audit log of all verified, approved, and rejected manual bank transfer payment submissions.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-zinc-500">
                Verified Records: {submissions.filter(s => s.status !== 'PENDING_VERIFICATION').length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <th className="py-3.5 px-6">Member</th>
                  <th className="py-3.5 px-6">Plan &amp; Amount</th>
                  <th className="py-3.5 px-6">Transaction UTR</th>
                  <th className="py-3.5 px-6">Dates</th>
                  <th className="py-3.5 px-6">Verification Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {historySubmissions.map((sub) => (
                    <tr key={`hist_${sub.id}`} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Member */}
                      <td className="py-4 px-6">
                        <p className="font-bold text-black">{sub.userName}</p>
                        <p className="text-[11px] text-zinc-500">{sub.userEmail}</p>
                      </td>

                      {/* Plan & Amount */}
                      <td className="py-4 px-6">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-1",
                          sub.membershipType === 'lifetime' ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-zinc-100 text-zinc-700 border-zinc-200"
                        )}>
                          {sub.membershipType === 'lifetime' ? 'Life Member' : 'Standard'}
                        </span>
                        <p className="font-mono font-bold text-emerald-700">₹{sub.expectedAmount.toLocaleString()}</p>
                      </td>

                      {/* Transaction UTR */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-black bg-zinc-100 px-2 py-1 rounded text-xs inline-block">
                          {sub.transactionRef}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6 space-y-0.5 text-[11px]">
                        <p className="text-zinc-600"><span className="text-zinc-400">Transfer:</span> {sub.paymentDate}</p>
                        <p className="text-zinc-600"><span className="text-zinc-400">Submitted:</span> {sub.submissionDate}</p>
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-6">
                        {sub.status === 'APPROVED' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                              <CheckCircle2 size={11} /> APPROVED
                            </span>
                            {sub.verifiedByName && (
                              <p className="text-[10px] text-zinc-400">By {sub.verifiedByName}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-200">
                              <XCircle size={11} /> REJECTED
                            </span>
                            {sub.rejectionReason && (
                              <p className="text-[10px] text-rose-600 font-medium max-w-[180px] truncate" title={sub.rejectionReason}>
                                {sub.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {sub.proofUrl && (
                          <button
                            onClick={() => {
                              setSelectedProof(sub);
                              setIsProofModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} /> View Proof
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                {historySubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
                      No payment verification history records found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW PROOF MODAL */}
      {isProofModalOpen && selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-sm font-bold text-black uppercase tracking-wider">Payment Proof Preview</h3>
                <p className="text-xs text-zinc-500 font-medium">
                  {selectedProof.userName} ({selectedProof.userEmail}) — UTR: <strong className="font-mono text-black">{selectedProof.transactionRef}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 flex items-center justify-center min-h-[350px]">
              {selectedProof.proofUrl ? (
                selectedProof.proofFileName?.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full text-center space-y-4 py-8">
                    <FileText size={56} className="mx-auto text-zinc-400" />
                    <p className="text-xs font-bold text-black">{selectedProof.proofFileName}</p>
                    <a
                      href={selectedProof.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
                    >
                      <ExternalLink size={16} /> Open PDF Receipt in New Tab
                    </a>
                  </div>
                ) : (
                  <img
                    src={selectedProof.proofUrl}
                    alt="Payment Proof Receipt"
                    className="max-h-[60vh] max-w-full object-contain rounded-2xl border border-zinc-200 shadow-md"
                  />
                )
              ) : (
                <p className="text-xs text-zinc-500 font-bold">Proof file unavailable.</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="px-5 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE PAYMENT CONFIRMATION WARNING MODAL */}
      {isApproveModalOpen && approveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 font-['Outfit']">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-zinc-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
              Admin Verification Action
            </span>

            <h3 className="text-2xl font-bold text-black tracking-tight mb-2">
              Approve Payment Submission?
            </h3>

            {/* MANDATORY WARNING TEXT */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 text-xs text-amber-950 leading-relaxed font-medium">
              <p className="font-bold text-amber-900 mb-1">WARNING:</p>
              "Approving this payment will activate the user's subscription for 1 Year (365 days) from today and grant access to paid journal content. Please verify the payment proof, transaction reference number, payment amount, and membership status before approving."
            </div>

            <div className="space-y-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-400">Member:</span>
                <span className="font-bold text-black">{approveItem.userName} ({approveItem.userEmail})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-400">Verified Amount:</span>
                <span className="font-bold text-emerald-700 font-mono">₹{approveItem.expectedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-400">Transaction UTR:</span>
                <span className="font-mono font-bold text-black">{approveItem.transactionRef}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Subscription Duration:</span>
                <span className="font-bold text-emerald-800">1 Year (365 Days)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                disabled={isProcessingApprove}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={isProcessingApprove}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessingApprove ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Approving & Activating...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Approve Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT MODAL (MANDATORY REJECTION REASON) */}
      {isRejectModalOpen && rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 font-['Outfit']">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-zinc-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>

            <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
              Mandatory Rejection Reason
            </span>

            <h3 className="text-2xl font-bold text-black tracking-tight mb-2">
              Reject Payment Submission
            </h3>
            <p className="text-zinc-500 text-xs mb-4">
              Please state the exact reason why payment verification was unsuccessful. This reason will be emailed to <strong className="text-black">{rejectItem.userName}</strong>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Transaction UTR reference number not found in bank statement, amount mismatch, or illegible receipt."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-2xl text-xs font-medium text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isProcessingReject}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessingReject || !rejectionReason.trim()}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessingReject ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X size={16} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
