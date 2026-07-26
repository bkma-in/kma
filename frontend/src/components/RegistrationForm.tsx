import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ChevronRight, Loader2, CheckCircle2, GraduationCap, Briefcase, AlertCircle, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import {
  validateName,
  validateEmail,
  type Role
} from '../utils/validation';
import { register, sendVerificationCode, verifyEmailCode } from '../services/auth.service';
import { register, sendRegistrationOtp, verifyRegistrationOtp } from '../services/auth.service';

interface RegistrationFormProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
  isAuthLoading?: boolean;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, onSwitchToLogin, isAuthLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'author' as Role,
    password: '',
    confirmPassword: '',
    qualification: '',
    experience: ''
  });

  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showOtp, setShowOtp] = useState(false);

  // Countdown timer for Get OTP resend
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleGetOtp = async () => {
    const emailV = validateEmail(formData.email);
    if (!emailV.isValid) {
      setErrors((prev) => ({ ...prev, email: emailV.message! }));
      return;
    }
    // Clear email and OTP errors if valid
    setErrors((prev) => {
      const { email, otp: _, ...rest } = prev;
      return rest;
    });

    setIsSendingOtp(true);
    try {
      await sendRegistrationOtp(formData.email);
      setCountdown(60);
      setErrors((prev) => {
        const { otp: _, ...rest } = prev;
        return rest;
      });
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, otp: err.message || 'Failed to send OTP.' }));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);

    if (val.length === 6) {
      setIsVerifyingOtp(true);
      setErrors((prev) => {
        const { otp: _, ...rest } = prev;
        return rest;
      });
      try {
        await verifyRegistrationOtp(formData.email, val);
        setOtpVerified(true);
      } catch (err: any) {
        setErrors((prev) => ({ ...prev, otp: err.message || 'Invalid OTP. Please try again.' }));
      } finally {
        setIsVerifyingOtp(false);
      }
    }
  };

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const isFormReady = 
    formData.name.length > 0 && 
    formData.email.length > 0 && 
    otpVerified &&
    formData.password.length >= 8 && 
    passwordsMatch &&
    (formData.role !== 'reviewer' || (formData.qualification.length > 0 && formData.experience.length > 0));

  const maskEmail = (emailStr: string) => {
    if (!emailStr || !emailStr.includes('@')) return emailStr;
    const [local, domain] = emailStr.split('@');
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
  };

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const nameV = validateName(formData.name);
    if (!nameV.isValid) newErrors.name = nameV.message!;
    const emailV = validateEmail(formData.email);
    if (!emailV.isValid) newErrors.email = emailV.message!;
    if (!otpVerified) newErrors.otp = 'Email verification is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isFormReady;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    localStorage.setItem('registration_in_progress', 'true');

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        qualification: formData.qualification,
        experience: formData.experience
      });

      setStep('verify');
      setResendCooldown(60);
    } catch (err: any) {
      localStorage.removeItem('registration_in_progress');
      setErrors({ form: err.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6 || isVerifying) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      await verifyEmailCode(verificationCode, formData.email);
      
      let msg = "Email verified successfully! Flipping to login...";
      if (formData.role === 'reviewer') {
        msg = "Email verified! Your reviewer account is under admin approval. You can log in after approval.";
      }
      setSuccessMsg(msg);
      setStep('success');

      setTimeout(() => {
        onSuccess(formData.email);
      }, 2500);
    } catch (err: any) {
      setVerifyError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setVerifyError(null);
    try {
      await sendVerificationCode(formData.email);
      setResendCooldown(60);
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 bg-white animate-pulse">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="h-8 bg-zinc-200 rounded w-1/2 mx-auto md:mx-0" />
            <div className="h-4 bg-zinc-200 rounded w-2/3 mx-auto md:mx-0" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-12" />
              <div className="h-11 bg-zinc-100 rounded-xl w-full" />
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-12" />
              <div className="h-11 bg-zinc-100 rounded-xl w-full" />
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-12" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-zinc-100 rounded-xl" />
                <div className="h-10 bg-zinc-100 rounded-xl" />
                <div className="h-10 bg-zinc-100 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-16" />
              <div className="h-11 bg-zinc-100 rounded-xl w-full" />
            </div>

            <div className="h-12 bg-zinc-200 rounded-xl w-full" />

            <div className="h-4 bg-zinc-200 rounded w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-white">
      <div className="max-w-md mx-auto w-full py-1 sm:py-2">
        <header className="mb-3 sm:mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">
            {step === 'verify' ? 'Verify Email' : step === 'success' ? 'Verified!' : 'Create Account'}
          </h2>
          <p className="text-zinc-500 text-sm">
            {step === 'verify'
              ? `Verification code sent to ${maskEmail(formData.email)}`
              : step === 'success'
              ? 'Your account is ready.'
              : 'Join the Kerala Mathematical Association'}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {step === 'verify' && (
            <motion.form
              key="verify-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyCode}
              className="space-y-5"
            >
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-900">Check your inbox</p>
                  <p className="text-zinc-500">We sent a 6-digit code to <strong className="text-black font-semibold">{maskEmail(formData.email)}</strong>. Code expires in 10 minutes.</p>
                </div>
              </div>

              {verifyError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-bold tracking-tight">{verifyError}</p>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="form-label" htmlFor="verification-code-input">6-Digit Verification Code</label>
                <input
                  id="verification-code-input"
                  type="text"
                  maxLength={6}
                  pattern="\d{6}"
                  className="input-field text-center font-mono text-xl tracking-[0.5em] !border-zinc-200"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={isVerifying}
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-black uppercase tracking-wider transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isResending ? 'animate-spin' : ''} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </motion.form>
          )}

          {step === 'success' && (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 sm:p-8 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shadow-black/20">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <p className="text-black font-bold text-lg">Verification Complete</p>
                <p className="text-zinc-600 text-sm leading-relaxed">{successMsg}</p>
              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <AlertCircle size={16} />
                  </div>
                  <p className="text-xs font-bold tracking-tight">{errors.form}</p>
                </motion.div>
              )}
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-name">Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-name"
                    type="text"
                    className={cn("input-field pl-11 !border-zinc-200 transition-none", errors.name && "!border-red-500")}
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-email"
                    type="email"
                    className={cn("input-field pl-11 !border-zinc-200 transition-none", errors.email && "!border-red-500")}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={otpVerified || isLoading}
                  />
                </div>
              </div>

              {/* Email OTP Verification */}
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <label className="form-label" htmlFor="reg-otp">
                  Email OTP <span className="text-[10px] text-zinc-400 font-normal lowercase ml-1.5">(only 3 attempts per day)</span>
                </label>
                <div className="flex items-center gap-3">
                  {/* Modern 6-slot OTP Input Wrapper */}
                  <div className="relative flex-1 group">
                    <input
                      id="reg-otp"
                      type={showOtp ? "text" : "password"}
                      maxLength={6}
                      pattern="\d{6}"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20 disabled:cursor-not-allowed"
                      value={otp}
                      onChange={handleOtpChange}
                      disabled={otpVerified || isSendingOtp || isVerifyingOtp || isLoading || !formData.name.trim() || !formData.email.trim()}
                    />
                    
                    {/* Visual slots representation */}
                    <div className="grid grid-cols-6 gap-2 w-full">
                      {Array.from({ length: 6 }).map((_, index) => {
                        const digit = otp[index] || "";
                        const isActive = index === otp.length && !otpVerified && formData.name.trim() && formData.email.trim();
                        
                        return (
                          <div
                            key={index}
                            className={cn(
                              "h-11 rounded-xl border flex items-center justify-center text-sm font-black transition-all duration-200 select-none bg-zinc-50/50",
                              otpVerified
                                ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                                : errors.otp
                                  ? "border-red-500 text-red-600 bg-red-50/10"
                                  : isActive
                                    ? "border-black bg-white ring-2 ring-black/5 shadow-sm"
                                    : "border-zinc-200 text-zinc-800"
                            )}
                          >
                            {digit ? (
                              showOtp ? (
                                digit
                              ) : (
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-in zoom-in duration-100" />
                              )
                            ) : (
                              isActive && (
                                <span className="w-[1.5px] h-4 bg-black animate-[reg-otp-blink_1s_infinite] rounded-full" />
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Eye Toggle Action */}
                  {otp.length > 0 && !otpVerified && (
                    <button
                      type="button"
                      onClick={() => setShowOtp(!showOtp)}
                      className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:border-black/30 text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      disabled={isSendingOtp || isVerifyingOtp || isLoading}
                    >
                      {showOtp ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}

                  {/* Get OTP Button */}
                  <button
                    type="button"
                    onClick={handleGetOtp}
                    disabled={countdown > 0 || isSendingOtp || otpVerified || isLoading || !formData.name.trim() || !formData.email.trim()}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border h-11 flex items-center justify-center",
                      (countdown > 0 || otpVerified || !formData.name.trim() || !formData.email.trim())
                        ? "bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed"
                        : "bg-black text-white border-black hover:bg-zinc-800"
                    )}
                  >
                    {isSendingOtp ? (
                      <Loader2 className="animate-spin h-4 w-4 mx-auto" />
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      "Get OTP"
                    )}
                  </button>
                </div>
                {errors.otp && (
                  <p className="text-[11px] text-red-500 font-bold mt-0.5">{errors.otp}</p>
                )}
                {otpVerified && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                    ✓ Email Verified
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="form-label">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['author', 'reader', 'reviewer'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={cn(
                        "py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest",
                        formData.role === r
                          ? "bg-black text-white border-black shadow-lg shadow-black/20"
                          : "bg-white text-zinc-400 border-zinc-200 hover:border-black/30"
                      )}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Reviewer Fields */}
              <AnimatePresence>
                {formData.role === 'reviewer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label className="form-label">Academic Qualification</label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                        <input
                          type="text"
                          className="input-field pl-11 !border-zinc-200"
                          placeholder="e.g. Ph.D. in Mathematics"
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label">Professional Experience</label>
                      <div className="relative group">
                        <Briefcase className="absolute left-3.5 top-4 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                        <textarea
                          className="input-field pl-11 py-3 min-h-[100px] !border-zinc-200 resize-none"
                          placeholder="Briefly describe your research and editorial background..."
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-password">Password (8 characters)</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field pl-11 pr-11 !border-none !ring-0 !bg-zinc-50"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                <div className="flex gap-1.5 mt-2 h-1">
                  {[1, 2, 3, 4].map((i) => {
                    const strength = formData.password.length;
                    let color = "bg-zinc-100";
                    
                    if (strength > 0) {
                      if (i === 1) {
                        if (strength <= 3) color = "bg-red-500";
                        else if (strength <= 5) color = "bg-amber-500";
                        else color = "bg-green-500";
                      } else if (i === 2 && strength >= 4) {
                        if (strength <= 5) color = "bg-amber-500";
                        else color = "bg-green-500";
                      } else if (i === 3 && strength >= 6) {
                        color = "bg-green-500";
                      } else if (i === 4 && strength >= 8) {
                        color = "bg-green-500";
                      }
                    }

                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "flex-1 rounded-full transition-all duration-500",
                          color
                        )} 
                      />
                    );
                  })}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-field pl-11 pr-11 !border-none !ring-0 !bg-zinc-50"
                    placeholder="Enter your password again"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Underline */}
                <div className={cn(
                  "h-0.5 w-full transition-colors duration-300", 
                  formData.confirmPassword.length === 0 
                    ? "bg-zinc-100" 
                    : formData.password === formData.confirmPassword 
                      ? "bg-green-500" 
                      : "bg-red-500"
                )} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "btn-primary w-full flex items-center justify-center gap-2 group mt-4",
                  !isFormReady && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>Register</span>
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Login Link */}
              <p className="text-center text-zinc-500 text-sm pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-black font-bold hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </AnimatePresence>
      </div>
      {/* Caret Blinking Style */}
      <style>{`
        @keyframes reg-otp-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RegistrationForm;
