import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  Award,
  ArrowRight,
  CreditCard,
  Loader2,
  Crown,
  KeyRound,
  Mail,
  Sparkles,
  AlertCircle,
  X,
  RefreshCw,
  Check
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { 
  createSubscriptionOrder, 
  openRazorpayModal, 
  verifyRazorpayPayment,
  requestLifeMemberOtp 
} from '../../services/razorpay.service';

const GetSubscription = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { refreshSubscriptionStatus } = useSubscription();
  const { currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [membershipId, setMembershipId] = useState((currentUser as any)?.membershipNumber || '');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifiedUniqueId, setVerifiedUniqueId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend timer countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const features = [
    'Unlimited access to all peer-reviewed research articles',
    'High-resolution PDF downloads and offline reading',
    'Real-time email notifications for newly published issues',
    'Official Bulletin of Kerala Mathematics Association publications',
    'Verified researcher reading badge & account certificate',
    '24/7 technical and reader assistance'
  ];

  // Request Life Member OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!membershipId.trim()) {
      showToast('Please enter your Unique Life Member ID (e.g. LM-1042)', 'error');
      return;
    }

    setIsRequestingOtp(true);
    try {
      const res = await requestLifeMemberOtp(membershipId.trim());
      if (res.success) {
        setMaskedEmail(res.maskedEmail || currentUser?.email || 'your registered email');
        setVerifiedUniqueId(res.uniqueId || membershipId.trim().toUpperCase());
        setIsOtpModalOpen(true);
        setResendCooldown(60);
        showToast(res.message || 'OTP verification code sent to your email!', 'success');
      } else {
        showToast(res.error || 'Verification request failed', 'error');
      }
    } catch (error: any) {
      console.error('Request OTP error:', error);
      showToast(error?.response?.data?.error || error.message || 'Could not verify Life Member ID.', 'error');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Standard checkout (₹2,000 / year)
  const handleStandardSubscribe = async () => {
    setIsLoading(true);
    try {
      const orderData = await createSubscriptionOrder({ plan: 'annual', applyLifeMemberDiscount: false });

      if (!orderData.success || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create Razorpay order');
      }

      await openRazorpayModal({
        orderId: orderData.orderId,
        keyId: orderData.keyId,
        amount: orderData.amount,
        name: 'BKMA Annual Pass',
        description: 'Standard Annual Research Subscription',
        userEmail: currentUser?.email || '',
        userName: currentUser?.name || '',
        onSuccess: async (paymentResponse) => {
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.success) {
              await refreshSubscriptionStatus();
              showToast('Annual Subscription activated successfully! Receipt sent.', 'success');
              navigate('/reader/payments');
            } else {
              showToast(verifyRes.error || 'Payment verification failed', 'error');
            }
          } catch (err: any) {
            showToast(err?.response?.data?.error || 'Payment verification failed', 'error');
          } finally {
            setIsLoading(false);
          }
        },
        onDismiss: () => {
          setIsLoading(false);
          showToast('Payment checkout cancelled', 'info');
        },
        onFailure: (error: any) => {
          setIsLoading(false);
          showToast(`Payment failed: ${error?.description || error?.reason || 'Transaction could not be completed'}`, 'error');
        }
      });
    } catch (error: any) {
      console.error('Razorpay subscription error:', error);
      showToast(error?.response?.data?.error || error.message || 'Failed to initiate payment', 'error');
      setIsLoading(false);
    }
  };

  // Life Member concession checkout (₹1,000 / year with verified OTP)
  const handleLifeMemberSubscribeWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      showToast('Please enter the valid 6-digit OTP sent to your email.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = await createSubscriptionOrder({
        plan: 'annual',
        applyLifeMemberDiscount: true,
        uniqueId: verifiedUniqueId || membershipId.trim(),
        otp: otp.trim()
      });

      if (!orderData.success || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to verify OTP or create concession order');
      }

      setIsOtpModalOpen(false);

      await openRazorpayModal({
        orderId: orderData.orderId,
        keyId: orderData.keyId,
        amount: orderData.amount,
        name: 'BKMA Life Member Pass',
        description: `KMA Life Member 50% Concession Pass (${verifiedUniqueId})`,
        userEmail: currentUser?.email || '',
        userName: currentUser?.name || '',
        onSuccess: async (paymentResponse) => {
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.success) {
              await refreshSubscriptionStatus();
              showToast('Life Member Subscription activated at 50% concession! Receipt sent.', 'success');
              navigate('/reader/payments');
            } else {
              showToast(verifyRes.error || 'Payment verification failed', 'error');
            }
          } catch (err: any) {
            showToast(err?.response?.data?.error || 'Payment verification failed', 'error');
          } finally {
            setIsLoading(false);
          }
        },
        onDismiss: () => {
          setIsLoading(false);
          showToast('Payment checkout cancelled', 'info');
        },
        onFailure: (error: any) => {
          setIsLoading(false);
          showToast(`Payment failed: ${error?.description || error?.reason || 'Transaction could not be completed'}`, 'error');
        }
      });

    } catch (error: any) {
      console.error('Concession subscription error:', error);
      showToast(error?.response?.data?.error || error.message || 'OTP verification failed.', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 font-['Outfit'] pb-12">
      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 mb-4 shadow-sm">
          <ShieldCheck size={12} className="text-emerald-600" /> Official BKMA Research Pass
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight mb-3">
          Annual Research Subscription
        </h1>
        <p className="text-zinc-500 text-base max-w-xl mx-auto leading-relaxed">
          Access the complete archive of peer-reviewed mathematical research papers. Standard annual subscription is <strong className="text-black font-semibold">₹2,000 / year</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start mb-16">
        {/* Left: Main Standard Pass Card (7 Cols) */}
        <div className="md:col-span-7 bg-white border-2 border-black rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="px-3 py-1 bg-zinc-100 text-zinc-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                Full Journal Access
              </span>
              <h2 className="text-3xl font-bold text-black tracking-tight mt-2">Annual Pass</h2>
              <p className="text-xs text-zinc-400 mt-0.5">1-Year Full Platform Access</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-4xl font-black text-black">₹2,000</span>
                <span className="text-zinc-400 text-xs font-medium">/ year</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">Standard Reader Rate</span>
            </div>
          </div>

          <hr className="border-zinc-100 mb-6" />

          {/* Included Features */}
          <ul className="space-y-3.5 mb-8">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                  <Check size={12} />
                </div>
                <span className="text-zinc-600 text-xs sm:text-sm leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Subscribe Button (Standard ₹2,000) */}
          <button
            onClick={handleStandardSubscribe}
            disabled={isLoading}
            className="w-full py-4.5 bg-black hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 uppercase cursor-pointer shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <CreditCard size={18} />
                <span>Subscribe Standard Pass (₹2,000)</span>
              </>
            )}
          </button>
        </div>

        {/* Right: KMA Life Member 50% Concession Section (5 Cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-300 rounded-[2.5rem] p-8 shadow-lg shadow-amber-500/5 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Crown size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">
                Exclusive Concession
              </span>
              <h3 className="text-xl font-bold text-black">KMA Life Members</h3>
            </div>
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/80 mb-6 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-zinc-700">Concession Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-700">₹1,000</span>
                <span className="text-zinc-400 text-xs">/ year</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Official Life Members receive a <strong className="text-black">50% discount</strong> on annual subscriptions verified using your registered Unique Member ID and email OTP.
            </p>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-1.5">
                Enter Your Unique Membership ID
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                <input
                  type="text"
                  required
                  placeholder="e.g. LM-1042"
                  value={membershipId}
                  onChange={(e) => setMembershipId(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Must match the email of your active login account: <strong className="text-zinc-600">{currentUser?.email}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={isRequestingOtp || !membershipId.trim()}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              {isRequestingOtp ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Verify &amp; Claim 50% Concession (₹1,000)</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-amber-200/50 flex items-center gap-2 text-[10px] text-zinc-500">
            <ShieldCheck size={14} className="text-amber-600 shrink-0" />
            <span>2-Factor Email OTP verification required at checkout</span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {[
          { icon: ShieldCheck, text: "Secure Razorpay Gateway", desc: "Encrypted Transactions" },
          { icon: Clock, text: "Instant Activation", desc: "Immediate Journal Access" },
          { icon: Award, text: "Peer-Reviewed Content", desc: "Official BKMA Volume" },
          { icon: Crown, text: "Life Member Benefits", desc: "50% Concession Pass" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-600 mb-2 border border-zinc-100">
              <item.icon size={20} />
            </div>
            <span className="text-xs font-bold text-zinc-800">{item.text}</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* ==================================================== */}
      {/* OTP CONFIRMATION MODAL                               */}
      {/* ==================================================== */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <KeyRound size={24} />
              </div>
              <h3 className="text-xl font-bold text-black">Confirm Life Member OTP</h3>
              <p className="text-xs text-zinc-500 mt-1">
                A 6-digit confirmation code was sent to: <br />
                <strong className="text-black font-semibold">{maskedEmail}</strong>
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold mt-2">
                <Crown size={12} /> ID: {verifiedUniqueId} (50% Concession)
              </div>
            </div>

            <form onSubmit={handleLifeMemberSubscribeWithOtp} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block text-center mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center tracking-[0.4em] text-2xl font-mono font-bold py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <span>Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isRequestingOtp}
                  onClick={() => handleRequestOtp()}
                  className="font-bold text-black hover:underline cursor-pointer disabled:text-zinc-400 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-4 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 cursor-pointer disabled:opacity-50 active:scale-95 mt-4"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm OTP &amp; Pay ₹1,000</span>
                  </>
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
