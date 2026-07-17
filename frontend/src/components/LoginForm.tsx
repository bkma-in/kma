import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowLeft, CheckCircle2, Check, X } from 'lucide-react';
import { login, sendOtp, verifyOtp, resetPassword } from '../services/auth.service';
import { getDashboardByRole } from '../utils/auth';

interface LoginFormProps {
  prefilledEmail?: string;
  onSwitchToRegister: () => void;
  isAuthLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ prefilledEmail = '', onSwitchToRegister, isAuthLoading }) => {
  const [view, setView] = useState<'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset'>('login');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password flow states
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await login(email, password);
      if (response.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('role', response.user.role);
        localStorage.setItem('userName', response.user.name);
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('is_temp_password', response.user.mustChangePassword ? 'true' : 'false'); 
        
        console.log('[LoginForm] Login successful. Navigating to dashboard for role:', response.user.role);
        navigate(getDashboardByRole(response.user.role), { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendOtp(forgotEmail);
      setView('forgot-otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await verifyOtp(forgotEmail, otpCode);
      if (response.success && response.resetToken) {
        setResetToken(response.resetToken);
        setView('forgot-reset');
      } else {
        throw new Error('Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pw: string) => {
    const minLength = pw.length >= 8;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(pw);

    return {
      minLength,
      hasUpper,
      hasLower,
      hasDigit,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasDigit && hasSpecial
    };
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError('Password does not meet security requirements.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(forgotEmail, resetToken, newPassword);
      setSuccess('Your password has been reset successfully! You can now log in.');
      setEmail(forgotEmail);
      setPassword('');
      // Clear forms
      setForgotEmail('');
      setOtpCode('');
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
      setView('login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem('registration_in_progress');
  }, []);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const passwordCheck = validatePassword(newPassword);

  if (isAuthLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 bg-white animate-pulse">
        <div className="max-w-md mx-auto w-full space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center md:text-left">
            <div className="h-8 bg-zinc-200 rounded w-1/2 mx-auto md:mx-0" />
            <div className="h-4 bg-zinc-200 rounded w-2/3 mx-auto md:mx-0" />
          </div>

          <div className="space-y-4">
            {/* Input 1 */}
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-12" />
              <div className="h-11 bg-zinc-100 rounded-xl w-full" />
            </div>

            {/* Input 2 */}
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-16" />
              <div className="h-11 bg-zinc-100 rounded-xl w-full" />
            </div>

            {/* Button */}
            <div className="h-12 bg-zinc-200 rounded-xl w-full" />

            {/* Links */}
            <div className="h-3 bg-zinc-200 rounded w-24 mx-auto" />
            <div className="h-4 bg-zinc-200 rounded w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 bg-white">
      <div className="max-w-md mx-auto w-full">
        {view === 'login' && (
          <>
            {/* Header */}
            <header className="mb-4 sm:mb-6 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">Welcome Back</h2>
              <p className="text-zinc-500 text-sm">Log in to your BKMA account</p>
            </header>

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 shadow-sm mb-6 animate-in fade-in duration-300">
                <CheckCircle2 size={16} className="shrink-0" />
                <p className="text-xs font-semibold leading-relaxed">{success}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="login-email">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="login-email"
                    type="email"
                    className="input-field pl-11 !border-zinc-200"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field pl-11 pr-11 !border-none !bg-zinc-50"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <AlertCircle size={16} />
                  </div>
                  <p className="text-xs font-bold tracking-tight">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center pt-1">
                <button 
                  type="button" 
                  onClick={() => { setView('forgot-email'); setError(''); setSuccess(''); }}
                  className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-wider transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Register Link */}
              <p className="text-center text-zinc-500 text-sm pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-black font-bold hover:underline"
                >
                  Register
                </button>
              </p>
            </form>
          </>
        )}

        {view === 'forgot-email' && (
          <>
            {/* Header */}
            <header className="mb-8 sm:mb-10 text-center md:text-left">
              <button 
                type="button" 
                onClick={() => { setView('login'); setError(''); }} 
                className="flex items-center gap-2 text-zinc-400 hover:text-black font-bold text-xs uppercase tracking-wider mb-4 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">Forgot Password</h2>
              <p className="text-zinc-500 text-sm">Enter your registered email address to receive a verification OTP.</p>
            </header>

            <form className="space-y-6" onSubmit={handleSendOtp}>
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="forgot-email-input">Registered Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="forgot-email-input"
                    type="email"
                    className="input-field pl-11 !border-zinc-200"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm animate-in fade-in duration-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-bold tracking-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoading ? 'Sending OTP...' : 'Send Verification OTP'}
              </button>
            </form>
          </>
        )}

        {view === 'forgot-otp' && (
          <>
            {/* Header */}
            <header className="mb-8 sm:mb-10 text-center md:text-left">
              <button 
                type="button" 
                onClick={() => { setView('forgot-email'); setError(''); }} 
                className="flex items-center gap-2 text-zinc-400 hover:text-black font-bold text-xs uppercase tracking-wider mb-4 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">Verification Code</h2>
              <p className="text-zinc-500 text-sm">We have sent a 6-digit OTP to <strong className="text-black font-semibold">{forgotEmail}</strong>. It expires in 5 minutes.</p>
            </header>

            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {/* OTP Code */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="otp-input">6-Digit OTP</label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  pattern="\d{6}"
                  className="input-field text-center font-mono text-xl tracking-[0.5em] !border-zinc-200"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm animate-in fade-in duration-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-bold tracking-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="text-xs font-bold text-zinc-400 hover:text-black uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </>
        )}

        {view === 'forgot-reset' && (
          <>
            {/* Header */}
            <header className="mb-8 sm:mb-10 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">Reset Password</h2>
              <p className="text-zinc-500 text-sm">Enter a new secure password for your account.</p>
            </header>

            <form className="space-y-6" onSubmit={handleResetPassword}>
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field pl-11 pr-11 !border-zinc-200"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="confirm-new-password">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-field pl-11 pr-11 !border-zinc-200"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password checklist visualizer */}
              {newPassword && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 space-y-2.5 animate-in fade-in duration-300">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Password Requirements</p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    {passwordCheck.minLength ? (
                      <Check className="text-emerald-500 shrink-0" size={14} />
                    ) : (
                      <X className="text-zinc-300 shrink-0" size={14} />
                    )}
                    <span className={passwordCheck.minLength ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      At least 8 characters long
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {passwordCheck.hasUpper ? (
                      <Check className="text-emerald-500 shrink-0" size={14} />
                    ) : (
                      <X className="text-zinc-300 shrink-0" size={14} />
                    )}
                    <span className={passwordCheck.hasUpper ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      At least one uppercase letter (capital)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {passwordCheck.hasLower ? (
                      <Check className="text-emerald-500 shrink-0" size={14} />
                    ) : (
                      <X className="text-zinc-300 shrink-0" size={14} />
                    )}
                    <span className={passwordCheck.hasLower ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      At least one lowercase letter (small)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {passwordCheck.hasDigit ? (
                      <Check className="text-emerald-500 shrink-0" size={14} />
                    ) : (
                      <X className="text-zinc-300 shrink-0" size={14} />
                    )}
                    <span className={passwordCheck.hasDigit ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      At least one number (0-9)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {passwordCheck.hasSpecial ? (
                      <Check className="text-emerald-500 shrink-0" size={14} />
                    ) : (
                      <X className="text-zinc-300 shrink-0" size={14} />
                    )}
                    <span className={passwordCheck.hasSpecial ? 'text-emerald-700 font-medium' : 'text-zinc-500'}>
                      At least one special character (!@#...)
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm animate-in fade-in duration-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-bold tracking-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !passwordCheck.isValid || newPassword !== confirmNewPassword}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoading ? 'Resetting password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginForm;
