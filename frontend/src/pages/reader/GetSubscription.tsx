import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  Crown,
  KeyRound,
  Mail,
  Sparkles,
  AlertCircle,
  X,
  Upload,
  Building2,
  QrCode,
  FileCheck,
  AlertTriangle,
  Receipt,
  FileText,
  CreditCard,
  Eye,
  Printer,
  ExternalLink,
  XCircle,
  Loader2,
  Copy,
  Smartphone
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { ReceiptTemplate, formatReceiptNo } from '../../components/ReceiptTemplate';
import {
  getBankDetails,
  requestLifeMemberOtp,
  verifyLifeMemberOtp,
  submitPaymentProof,
  getPaymentHistory,
  getPaymentProofUrl
} from '../../services/payment.service';
import type { BankDetails, PaymentAttemptItem } from '../../services/payment.service';

const GetSubscription = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { refreshSubscriptionStatus } = useSubscription();
  const { currentUser } = useAuth();

  const [bankInfo, setBankInfo] = useState<BankDetails | null>(null);
  const [isLoadingBankInfo, setIsLoadingBankInfo] = useState(true);
  const [bankServiceError, setBankServiceError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipId, setMembershipId] = useState((currentUser as any)?.membershipNumber || '');
  const [idError, setIdError] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpModalError, setOtpModalError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(Boolean((currentUser as any)?.isLifeMember));
  const [verifiedUniqueId, setVerifiedUniqueId] = useState((currentUser as any)?.membershipNumber || '');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form State for Manual Bank Transfer Proof Submission
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Recent Submissions & History State
  const [recentAttempt, setRecentAttempt] = useState<PaymentAttemptItem | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentAttemptItem[]>([]);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<PaymentAttemptItem | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isProofPreviewModalOpen, setIsProofPreviewModalOpen] = useState(false);
  const [previewingFileName, setPreviewingFileName] = useState('');
  const [isLoadingProofUrl, setIsLoadingProofUrl] = useState(false);

  // Tab State for Payment Options (QR Code, UPI ID, Bank Account)
  const [paymentMethodTab, setPaymentMethodTab] = useState<'qr' | 'upi' | 'bank'>('qr');

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  useEffect(() => {
    loadBankDetailsData();
    loadRecentAttempt();
  }, []);

  const loadBankDetailsData = async () => {
    setIsLoadingBankInfo(true);
    setBankServiceError(null);
    try {
      const details = await getBankDetails();
      if (!details || !details.accountNumber || !details.accountName) {
        setBankServiceError('Payment service is temporarily out of order. Bank transfer configuration is missing.');
        setBankInfo(null);
      } else {
        setBankInfo(details);
      }
    } catch (err: any) {
      console.warn('Could not fetch bank details:', err);
      setBankServiceError(err?.message || 'Payment service is temporarily out of order.');
      setBankInfo(null);
    } finally {
      setIsLoadingBankInfo(false);
    }
  };

  const loadRecentAttempt = async () => {
    try {
      const attempts = await getPaymentHistory();
      if (attempts && attempts.length > 0) {
        setPaymentHistory(attempts);
        setRecentAttempt(attempts[0]);
      }
    } catch (err) {
      console.warn('Could not fetch payment history:', err);
    }
  };

  const handleViewReceipt = (payment: PaymentAttemptItem) => {
    if (payment.status !== 'APPROVED') {
      showToast('Official receipts are issued exclusively for successful, approved payments.', 'info');
      return;
    }
    setSelectedReceiptPayment(payment);
    setIsReceiptModalOpen(true);
  };

  const handleViewProof = async (payment: PaymentAttemptItem) => {
    if (!payment.proofStorageKey) {
      showToast('Payment proof file unavailable.', 'error');
      return;
    }
    setIsLoadingProofUrl(true);
    try {
      const url = await getPaymentProofUrl(payment.proofStorageKey);
      setProofPreviewUrl(url);
      setPreviewingFileName(payment.proofFileName || 'Payment Proof');
      setIsProofPreviewModalOpen(true);
    } catch (err: any) {
      console.error('Failed to load proof preview URL:', err);
      showToast('Failed to load payment proof file preview', 'error');
    } finally {
      setIsLoadingProofUrl(false);
    }
  };

  // Helper to format date YYYY-MM-DD to DD/MM/YYYY
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  // Helper to convert number to Indian words
  const numberToWords = (num: number): string => {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const helper = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
      return '';
    };

    if (num === 0) return 'Zero';
    if (num === 1) return 'One Rupee Only';
    return `${helper(num)} Rupees Only`;
  };

  // Resend timer countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const isTestUser = (currentUser?.email || '').toLowerCase().trim() === 'reader1@gmail.com';
  const payableAmount = isTestUser ? 10 : (isOtpVerified ? 1000 : 2000);
  const membershipTitle = isTestUser ? 'Payment Testing Account' : (isOtpVerified ? 'Verified KMA Life Member' : 'Regular Member');

  // Request Life Member OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIdError(null);
    if (!membershipId.trim()) {
      const msg = 'Please enter your Unique Life Member ID (e.g. LM-1042)';
      setIdError(msg);
      showToast(msg, 'error');
      return;
    }

    setIsRequestingOtp(true);
    try {
      const res = await requestLifeMemberOtp(membershipId.trim());
      if (res.success) {
        setMaskedEmail(res.maskedEmail || currentUser?.email || 'your registered email');
        setVerifiedUniqueId(res.uniqueId || membershipId.trim().toUpperCase());
        setIsOtpModalOpen(true);
        setOtpModalError(null);
        setOtp('');
        setResendCooldown(60);
        showToast(res.message || 'OTP verification code sent to your email!', 'success');
      } else {
        const errMsg = res.error || 'Verification request failed';
        setIdError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (error: any) {
      console.error('Request OTP error:', error);
      const errMsg = error?.response?.data?.error || error.message || 'Could not verify Life Member ID.';
      setIdError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Verify OTP via server API
  const handleVerifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setOtpModalError('Please enter the complete 6-digit OTP code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpModalError(null);
    try {
      const res = await verifyLifeMemberOtp(verifiedUniqueId || membershipId.trim(), otp.trim());
      if (res.success) {
        setIsOtpVerified(true);
        setIsOtpModalOpen(false);
        setOtpModalError(null);
        setIdError(null);
        showToast(res.message || 'Life Member ID verified! 50% Concession rate applied (₹1,000).', 'success');
      } else {
        setOtpModalError(res.error || 'Invalid OTP code.');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      const errMsg = error?.response?.data?.error || error.message || 'Invalid OTP verification code.';
      setOtpModalError(errMsg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds maximum limit of 5MB.', 'error');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  // Submit Payment Proof
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast('Please select and upload your payment proof receipt (JPG, PNG, or PDF).', 'error');
      return;
    }

    if (!paymentDate.trim()) {
      showToast('Please select the date payment was transferred.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('proof', selectedFile);
      formData.append('transactionRef', transactionRef.trim() || 'N/A');
      formData.append('paymentDate', paymentDate.trim());
      if (remarks.trim()) formData.append('remarks', remarks.trim());
      if (isOtpVerified && verifiedUniqueId) {
        formData.append('uniqueId', verifiedUniqueId);
        formData.append('otp', otp.trim());
      }

      const res = await submitPaymentProof(formData);

      if (res.success) {
        showToast('Payment proof submitted successfully! Pending administrator verification.', 'success');
        await loadRecentAttempt();
        await refreshSubscriptionStatus();
      } else {
        showToast(res.error || 'Submission failed', 'error');
      }
    } catch (error: any) {
      console.error('Submit proof error:', error);
      showToast(error?.response?.data?.error || error.message || 'Failed to submit payment proof.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Official NPCI Direct Account + IFSC UPI QR Payload
  const rawVpa = bankInfo?.upiId && bankInfo.upiId.trim()
    ? bankInfo.upiId.trim()
    : bankInfo ? `${(bankInfo.accountNumber || '').trim()}@${(bankInfo.ifsc || '').trim().toUpperCase()}.ifsc.npci` : '';
  const npciQrPayload = bankInfo ? `upi://pay?pa=${encodeURIComponent(rawVpa)}&pn=${encodeURIComponent(bankInfo.accountName || '')}&am=${payableAmount}&cu=INR` : '';
  const accountIfscQrImageSrc = bankInfo ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(npciQrPayload)}` : '';

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 font-['Outfit'] pb-16">
      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 mb-4 shadow-sm">
          <ShieldCheck size={12} className="text-emerald-600" /> Manual Bank Transfer Payment System
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight mb-3">
          Annual Research Subscription
        </h1>
        <p className="text-zinc-500 text-base max-w-xl mx-auto leading-relaxed">
          Access the complete archive of peer-reviewed mathematical research papers via manual bank transfer verification.
        </p>
      </div>

      {/* PENDING VERIFICATION ALERT BANNER */}
      {recentAttempt && recentAttempt.status === 'PENDING_VERIFICATION' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 mb-10 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={24} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-amber-200/60 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                Verification Pending
              </span>
              <h3 className="text-xl font-bold text-amber-950 mb-1">
                Your Payment Proof is Awaiting Administrator Verification
              </h3>
              <p className="text-amber-800/90 text-sm leading-relaxed mb-4">
                We have received your payment proof and UTR reference (<strong className="font-mono text-amber-950">{recentAttempt.transactionRef}</strong>) submitted on {recentAttempt.date}. Access will be activated automatically once an administrator verifies the transfer with our bank account.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 border-t border-amber-200/80">
                <div className="text-xs text-amber-900">
                  <span className="text-amber-700">Submitted Amount:</span> <strong>{recentAttempt.amount}</strong>
                </div>
                <div className="text-xs text-amber-900">
                  <span className="text-amber-700">Payment Date:</span> <strong>{recentAttempt.paymentDate}</strong>
                </div>
                {recentAttempt.proofUrl && (
                  <a
                    href={recentAttempt.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-800 underline hover:text-amber-950 font-medium inline-flex items-center gap-1 ml-auto"
                  >
                    <FileText size={12} /> View Uploaded Proof
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTED ALERT BANNER */}
      {recentAttempt && recentAttempt.status === 'REJECTED' && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-8 mb-10 shadow-lg shadow-rose-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-rose-200/80 text-rose-900 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                Verification Unsuccessful
              </span>
              <h3 className="text-xl font-bold text-rose-950 mb-1">
                Your Previous Payment Proof Could Not Be Verified
              </h3>
              <p className="text-rose-900 text-sm leading-relaxed mb-3">
                Reason given by administrator: <strong className="bg-rose-100 px-2 py-1 rounded text-rose-950 block mt-1 font-mono text-xs">{recentAttempt.rejectionReason || 'Transaction could not be verified in bank records.'}</strong>
              </p>
              <p className="text-xs text-rose-800 font-medium">
                Please double-check your bank UTR transaction number and submit a clear, fresh payment proof below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* APPROVED ALERT BANNER */}
      {recentAttempt && recentAttempt.status === 'APPROVED' && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 mb-10 shadow-lg shadow-emerald-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                Active Subscription
              </span>
              <h3 className="text-xl font-bold text-emerald-950 mb-1">
                Your Subscription is Active & Fully Verified
              </h3>
              <p className="text-emerald-800 text-sm leading-relaxed mb-3">
                Your payment of {recentAttempt.amount} has been verified by an administrator. You have full access to all research papers.
              </p>
              <button
                onClick={() => navigate('/reader/payments')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Receipt size={14} /> View Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-12 gap-8 lg:items-stretch items-start mb-16">
        
        {/* Left Column: Bank Details & QR (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Life Member Concession Unlock Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Crown size={12} className="text-amber-400" /> {isTestUser ? 'Test Account Mode' : 'KMA Life Member'}
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {isTestUser ? '₹10 Test Rate' : '50% Concession'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isTestUser ? 'Payment Testing Enabled' : 'Are you a KMA Life Member?'}
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4">
              {isTestUser
                ? 'Test user account (reader1@gmail.com) is configured with testing subscription price of ₹10.'
                : 'Enter your Unique Life Member ID to receive a 50% concession (₹1,000 / year).'}
            </p>

            {isTestUser ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3">
                <Sparkles size={18} className="text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-300">Test Account Active (reader1@gmail.com)</p>
                  <p className="text-[10px] text-blue-400/80">Subscription fee set to ₹10 for payment testing</p>
                </div>
              </div>
            ) : isOtpVerified ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">Life Member ID Verified ({verifiedUniqueId})</p>
                  <p className="text-[10px] text-emerald-400/80">Concession rate of ₹1,000 unlocked</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <form onSubmit={handleRequestOtp} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={membershipId}
                      onChange={(e) => {
                        setMembershipId(e.target.value);
                        if (idError) setIdError(null);
                      }}
                      placeholder="Enter ID (e.g. LM-1042)"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isRequestingOtp}
                      className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isRequestingOtp ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Verify</span>
                      )}
                    </button>
                  </div>
                </form>

                {idError && (
                  <div className="bg-rose-950/80 border border-rose-500/60 rounded-xl p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg shadow-rose-950/30">
                    <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-rose-200 leading-snug">{idError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bank Details Card */}
          {isLoadingBankInfo ? (
            <div className="bg-white border-2 border-black rounded-[2.5rem] p-6 shadow-xl text-center py-12 flex flex-col justify-center items-center flex-1">
              <Loader2 size={24} className="animate-spin text-black mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-medium">Loading bank transfer information...</p>
            </div>
          ) : bankServiceError || !bankInfo ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-[2.5rem] p-6 text-center shadow-lg flex flex-col justify-center items-center flex-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-bold text-amber-950 mb-1">Payment Service Temporarily Out of Order</h3>
              <p className="text-xs text-amber-900/90 leading-relaxed max-w-xs mx-auto mb-4 font-medium">
                {bankServiceError || 'Online bank transfer details are currently unavailable in the system environment configuration. Please contact support.'}
              </p>
              <span className="inline-block px-3 py-1 bg-amber-200/80 text-amber-950 rounded-full text-[10px] font-black uppercase tracking-wider">
                Service Unavailable
              </span>
            </div>
          ) : (
            <div className="bg-white border-2 border-black rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-black/5 flex-1 flex flex-col justify-between space-y-5">
              {/* Step 1 Header */}
              <div className="pb-3.5 border-b border-zinc-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                    STEP 1: MAKE PAYMENT
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    ₹{payableAmount.toLocaleString()} INR
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-black text-base leading-tight">BKMA Payment Options</h3>
                    <p className="text-zinc-400 text-xs">Transfer payable amount using any option below</p>
                  </div>
                </div>
              </div>

              {/* 1. BANK DETAILS AT TOP */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
                  <Building2 size={14} className="text-black shrink-0" /> 1. DIRECT BANK TRANSFER (NEFT / IMPS)
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-0.5 text-xs">
                  <div className="grid grid-cols-12 items-center py-1.5 border-b border-zinc-200/60">
                    <span className="col-span-5 text-zinc-500 font-medium">Account Name:</span>
                    <span className="col-span-7 font-bold text-black text-right">{bankInfo.accountName}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center py-1.5 border-b border-zinc-200/60">
                    <span className="col-span-5 text-zinc-500 font-medium">Bank Name:</span>
                    <span className="col-span-7 font-bold text-black text-right">{bankInfo.bankName}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center py-1.5 border-b border-zinc-200/60">
                    <span className="col-span-5 text-zinc-500 font-medium">Account Number:</span>
                    <div className="col-span-7 flex items-center justify-end gap-1.5 font-mono font-bold text-black">
                      <span>{bankInfo.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(bankInfo.accountNumber, 'Account Number')}
                        className="p-1 hover:bg-zinc-200 rounded text-zinc-600 transition-colors"
                        title="Copy Account Number"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center py-1.5 border-b border-zinc-200/60">
                    <span className="col-span-5 text-zinc-500 font-medium">IFSC Code:</span>
                    <div className="col-span-7 flex items-center justify-end gap-1.5 font-mono font-bold text-black">
                      <span>{bankInfo.ifsc}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(bankInfo.ifsc, 'IFSC Code')}
                        className="p-1 hover:bg-zinc-200 rounded text-zinc-600 transition-colors"
                        title="Copy IFSC Code"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-start py-1.5">
                    <span className="col-span-4 text-zinc-500 font-medium pt-0.5">Branch:</span>
                    <span className="col-span-8 font-bold text-black text-right leading-snug">{bankInfo.branch}</span>
                  </div>
                </div>
              </div>

              {/* 2. UPI ID IN MIDDLE (BEFORE QR) */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-black shrink-0" /> 2. OFFICIAL UPI VPA ADDRESS
                </div>
                <div className="p-3.5 bg-zinc-50 border-2 border-black rounded-2xl flex items-center justify-between gap-3">
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-0.5">BKMA UPI VPA</span>
                    <span className="font-mono font-bold text-black text-xs sm:text-sm select-all truncate block">
                      {bankInfo.upiId || rawVpa}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(bankInfo.upiId || rawVpa, 'UPI ID')}
                    className="px-3.5 py-1.5 bg-black text-white hover:bg-zinc-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>

              {/* 3. QR CODE AT LAST (BOTTOM) */}
              <div className="pt-3 border-t border-zinc-100 text-center space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-zinc-600 flex items-center justify-center gap-1.5">
                  <QrCode size={14} className="text-black shrink-0" /> 3. SCAN QR CODE TO PAY
                </div>
                <div className="p-2 bg-white border-2 border-black rounded-2xl inline-block shadow-md">
                  <img
                    src={bankInfo.qrCodeUrl || accountIfscQrImageSrc}
                    alt="BKMA Payment QR Code"
                    className="w-32 h-32 mx-auto object-contain rounded-lg"
                  />
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Scan using GPay, PhonePe, Paytm, BHIM, or any UPI app
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Payment Proof Upload Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-black rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-black/5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-zinc-100">
            <div>
              <span className="px-3 py-1 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Step 2: Submit Proof
              </span>
              <h2 className="text-2xl font-bold text-black tracking-tight mt-2">Payment Verification Form</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400 block font-medium">Payable Amount</span>
              <span className="text-3xl font-black text-black">₹{payableAmount.toLocaleString()}</span>
              {(isTestUser || isOtpVerified) && (
                <span className="text-[10px] font-bold text-emerald-700 block uppercase tracking-wider">{membershipTitle}</span>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-600 shrink-0" /> Important Payment Instruction:
            </p>
            "Please transfer exactly the displayed amount (<strong>₹{payableAmount.toLocaleString()}</strong>) to the BKMA bank account shown. Your access will be activated only after the payment is verified and approved by an administrator."
          </div>

          <form onSubmit={handleSubmitProof} className="space-y-5 flex-1 flex flex-col justify-between">
            {/* Membership & Rate Read-Only Summary */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs">
              {isTestUser || isOtpVerified ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Membership Status</label>
                    <input
                      type="text"
                      readOnly
                      value={membershipTitle}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 font-bold text-black text-xs cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Fixed Payable Amount</label>
                    <input
                      type="text"
                      readOnly
                      value={`₹${payableAmount.toLocaleString()} INR`}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 font-bold text-emerald-700 text-xs cursor-not-allowed font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Fixed Payable Amount</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${payableAmount.toLocaleString()} INR`}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 font-bold text-emerald-700 text-xs cursor-not-allowed font-mono"
                  />
                </div>
              )}
            </div>

            {/* Payment Transfer Date */}
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium text-black focus:outline-none focus:border-black focus:bg-white transition-all"
              />
            </div>

            {/* Transaction / UTR Number (Optional) */}
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                Transaction / UTR / Reference Number <span className="text-zinc-400 font-normal lowercase">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 423910582910 or UPI Reference ID (Optional)"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-medium text-black placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all uppercase"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Optional: Provide bank reference number if shown on your transfer receipt.</p>
            </div>

            {/* Upload Payment Proof File */}
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                Upload Payment Proof Receipt <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-zinc-300 hover:border-black rounded-2xl p-6 text-center transition-all bg-zinc-50/50 hover:bg-white">
                <input
                  type="file"
                  id="proof-file-input"
                  required
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="proof-file-input" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-3">
                    <Upload size={20} />
                  </div>
                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                        <FileCheck size={14} /> {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-black mb-1">Click to browse or drop file here</p>
                      <p className="text-[10px] text-zinc-400">Supported Formats: JPG, JPEG, PNG, PDF (Max 5 MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Optional Remarks */}
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1.5">
                Remarks (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Any additional information regarding your bank transfer..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            {bankServiceError || !bankInfo ? (
              <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs font-bold text-amber-900 mt-4 lg:mt-auto">
                Payment submission is disabled while payment service is out of order.
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-black hover:bg-zinc-800 text-white rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 mt-4 lg:mt-auto cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying &amp; Uploading Proof...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Submit Payment Proof for Verification</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* PAYMENT SUBMISSIONS & VERIFICATION HISTORY SECTION */}
      {paymentHistory.length > 0 && (
        <div className="mt-16 bg-white border border-zinc-200 rounded-[2.5rem] p-8 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
            <div>
              <span className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                Submission Records
              </span>
              <h2 className="text-2xl font-bold text-black tracking-tight">
                Payment Submissions &amp; Verification History
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                Track status of your submitted bank transfers, preview proof receipts, and access official BKMA receipts once verified.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold text-zinc-400">Total Submissions: {paymentHistory.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Submission Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Membership Plan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction Ref / UTR</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Verification Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paymentHistory.map((item, idx) => (
                  <tr key={item.id} className="group hover:bg-zinc-50 transition-colors">
                    {/* Submission Date */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-black">{item.date || item.paymentDate}</p>
                      <span className="text-[10px] text-zinc-400 block font-mono mt-0.5">Receipt No: {formatReceiptNo(item.receiptNo || item.id, item.date || item.paymentDate, idx)}</span>
                    </td>

                    {/* Membership Plan */}
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        item.plan === 'lifetime' ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      )}>
                        {item.plan === 'lifetime' ? 'Verified Life Member (₹1,000)' : 'Standard Pass (₹2,000)'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-emerald-700">₹{(item.amountRaw || item.amount).toLocaleString()}</span>
                    </td>

                    {/* Transaction Ref / UTR */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-black bg-zinc-100 px-2 py-1 rounded w-fit inline-block">
                        {item.transactionRef || 'N/A'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          item.status === 'PENDING_VERIFICATION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        )}>
                          {item.status === 'APPROVED' ? <CheckCircle2 size={10} /> :
                           item.status === 'PENDING_VERIFICATION' ? <Clock size={10} /> :
                           <XCircle size={10} />}
                          {item.status === 'APPROVED' ? 'APPROVED' :
                           item.status === 'PENDING_VERIFICATION' ? 'PENDING VERIFICATION' : 'REJECTED'}
                        </span>
                        {item.status === 'REJECTED' && item.rejectionReason && (
                          <p className="text-[10px] text-rose-500 font-medium mt-1 max-w-[200px] truncate" title={item.rejectionReason}>
                            Reason: {item.rejectionReason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.proofStorageKey && (
                          <button
                            onClick={() => handleViewProof(item)}
                            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            title="View uploaded proof receipt"
                          >
                            <Eye size={13} /> View Proof
                          </button>
                        )}

                        {item.status === 'APPROVED' && (
                          <button
                            onClick={() => handleViewReceipt(item)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            title="View official BKMA payment receipt"
                          >
                            <Receipt size={13} /> Official Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROOF PREVIEW MODAL */}
      {isProofPreviewModalOpen && proofPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-sm font-bold text-black uppercase tracking-wider">Payment Proof Preview</h3>
                <p className="text-xs text-zinc-500 font-medium">{previewingFileName}</p>
              </div>
              <button
                onClick={() => setIsProofPreviewModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 flex items-center justify-center min-h-[350px]">
              {previewingFileName.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full text-center space-y-4 py-8">
                  <FileText size={56} className="mx-auto text-zinc-400" />
                  <p className="text-xs font-bold text-black">{previewingFileName}</p>
                  <a
                    href={proofPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
                  >
                    <ExternalLink size={16} /> Open PDF Receipt in New Tab
                  </a>
                </div>
              ) : (
                <img
                  src={proofPreviewUrl}
                  alt="Payment Proof Receipt"
                  className="max-h-[60vh] max-w-full object-contain rounded-2xl border border-zinc-200 shadow-md"
                />
              )}
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setIsProofPreviewModalOpen(false)}
                className="px-5 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL RECEIPT MODAL */}
      {isReceiptModalOpen && selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm receipt-modal-backdrop animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-zinc-200 receipt-modal-card">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 no-print">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider">Official Payment Receipt Preview</h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                  Transaction UTR / Ref: {selectedReceiptPayment.transactionRef || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-zinc-100/50 flex justify-center">
              <ReceiptTemplate
                receiptNumber={formatReceiptNo(selectedReceiptPayment.id)}
                date={formatDateString(selectedReceiptPayment.paymentDate || selectedReceiptPayment.date)}
                memberName={currentUser?.name || localStorage.getItem('userName') || 'Member'}
                amount={(selectedReceiptPayment.amountRaw || selectedReceiptPayment.amount).toString().replace('₹', '')}
                amountInWords={numberToWords(parseInt((selectedReceiptPayment.amountRaw || selectedReceiptPayment.amount).toString().replace(/[^\d]/g, '')) || 1000)}
                membershipType={selectedReceiptPayment.plan === 'lifetime' ? 'Life Membership Pass' : 'Annual Pass Subscription'}
                journalYear={(selectedReceiptPayment.date || new Date().toISOString()).substring(0, 4)}
                paymentMethod="Manual Bank Transfer (UPI / NEFT / IMPS)"
                transactionId={selectedReceiptPayment.transactionRef || 'N/A'}
                status="PAID"
              />
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3 receipt-modal-actions no-print">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Printer size={16} /> Print Official Receipt
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-black rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal for Life Member Concession */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border-2 border-black rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <KeyRound size={24} />
            </div>

            <h3 className="text-2xl font-bold text-black tracking-tight mb-2">
              Enter 6-Digit Code
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-6">
              A 6-digit verification OTP code has been sent to your registered email (<strong className="text-black font-semibold">{maskedEmail}</strong>) for Life Member ID <strong className="text-black">{verifiedUniqueId}</strong>.
            </p>

            <form onSubmit={handleVerifyOtpCode} className="space-y-4">
              {otpModalError && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-rose-900 leading-snug flex-1">
                    {otpModalError}
                  </p>
                </div>
              )}

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (otpModalError) setOtpModalError(null);
                  }}
                  placeholder="6-Digit OTP"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold px-4 py-3 bg-zinc-50 border-2 border-zinc-300 rounded-2xl focus:outline-none focus:border-black transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full py-3.5 bg-black hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify &amp; Apply 50% Concession Rate</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetSubscription;
