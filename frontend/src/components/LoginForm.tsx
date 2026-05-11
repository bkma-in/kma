import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { login } from '../services/auth.service';

interface LoginFormProps {
  prefilledEmail?: string;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ prefilledEmail = '', onSwitchToRegister }) => {
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await login(email, password);
      if (response.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('role', response.user.role);
        localStorage.setItem('userName', response.user.name);
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('is_temp_password', 'false'); 
        
        if (response.user.role === 'reviewer') {
          window.location.replace('/reviewer-dashboard');
        } else if (response.user.role === 'admin') {
          window.location.replace('/admin-dashboard');
        } else if (response.user.role === 'developer') {
          window.location.replace('/developer-dashboard');
        } else {
          window.location.replace('/author/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 lg:p-12 bg-white">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <header className="mb-8 sm:mb-10 text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">Welcome Back</h2>
          <p className="text-zinc-500 text-sm">Log in to your KMA account</p>
        </header>

        <form className="space-y-6" onSubmit={handleLogin}>
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
            <div className="flex justify-between items-center">
              <label className="form-label mb-0" htmlFor="login-password">Password</label>
              <button type="button" className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-wider transition-colors">
                Forgot?
              </button>
            </div>
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
      </div>
    </div>
  );
};

export default LoginForm;
