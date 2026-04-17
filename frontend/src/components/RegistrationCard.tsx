import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import logo from '../assets/logo.png';
import {
  validateName,
  validateEmail,
  validatePassword,
  getPasswordStrength,
  type Role
} from '../utils/validation';

const RegistrationForm: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as Role,
    password: '',
    confirmPassword: ''
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Derived State
  const passwordStrength = getPasswordStrength(formData.password);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const nameV = validateName(formData.name);
    if (!nameV.isValid) newErrors.name = nameV.message!;

    const emailV = validateEmail(formData.email);
    if (!emailV.isValid) newErrors.email = emailV.message!;

    const passV = validatePassword(formData.password);
    if (!passV.isValid) newErrors.password = passV.message!;

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (formData.role === 'reviewer') {
        setSuccessMsg("Registration submitted! You will be able to log in once your account is approved by the admin.");
      } else {
        setSuccessMsg("Registration successful! Please log in to continue.");
      }
    }, 1500);
  };

  return (
    <div className="min-h-[800px] w-full max-w-5xl bg-white rounded-[2.5rem] shadow-kma-card overflow-hidden flex flex-col md:flex-row border border-zinc-100">

      {/* Left Decoration / Branding Side */}
      <div className="w-full md:w-2/5 bg-black p-12 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Geometric Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10">
          <div className="bg-white p-2 rounded-xl inline-block mb-8 shadow-2xl overflow-hidden">
            <img src={logo} alt="KMA Logo" className="w-[100px] h-[100px] object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight leading-[1.1]">
            Kerala <br />
            Mathematical <br />
            Association
          </h1>
          <p className="text-zinc-400 font-medium tracking-wide uppercase text-sm mb-12">
            Advancing Mathematical Excellence
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                <CheckCircle2 size={20} className="text-zinc-300" />
              </div>
              <span className="text-zinc-300 font-medium">Publish Research Articles</span>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                <CheckCircle2 size={20} className="text-zinc-300" />
              </div>
              <span className="text-zinc-300 font-medium">Peer-Reviewed Content</span>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                <CheckCircle2 size={20} className="text-zinc-300" />
              </div>
              <span className="text-zinc-300 font-medium">Access Scholarly Papers</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-12">
          <p className="text-zinc-500 text-sm leading-relaxed">
            Joining the KMA provides a platform for authors, reviewers, and members to collaborate and access high-quality scholarly articles.
          </p>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="w-full md:w-3/5 p-8 md:p-12 bg-white flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <header className="mb-10">
            <h2 className="text-3xl font-bold text-black mb-2">Create an Account</h2>
            <p className="text-zinc-500">Enter your details to join the association</p>
          </header>

          <AnimatePresence mode="wait">
            {successMsg ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-zinc-800 font-medium leading-relaxed">{successMsg}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary w-full mt-4"
                >
                  Continue to Login
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      id="name"
                      type="text"
                      className={cn("input-field pl-12", errors.name && "border-red-500")}
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      id="email"
                      type="email"
                      className={cn("input-field pl-12", errors.email && "border-red-500")}
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="form-label">Role Selection</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['user', 'author', 'reviewer'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={cn(
                          "py-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2",
                          formData.role === r
                            ? "bg-black text-white border-black shadow-lg shadow-black/20"
                            : "bg-white text-zinc-500 border-zinc-200 hover:border-black/30"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {formData.role === 'reviewer' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex gap-3 overflow-hidden"
                    >
                      <AlertCircle size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-zinc-600 leading-normal">
                        <strong>Reviewer</strong> accounts require admin approval. You will be able to log in only after your account is approved.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={cn("input-field pl-12 pr-12", errors.password && "border-red-500")}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Strength Indicator */}
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-500",
                          passwordStrength >= i * 25 ? "bg-black" : "bg-zinc-100"
                        )}
                      />
                    ))}
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={cn("input-field pl-12 pr-12", errors.confirmPassword && "border-red-500")}
                      placeholder="Enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Register
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <p className="text-center text-zinc-500 text-sm">
                  Already have an account?{' '}
                  <a href="/login" className="text-black font-bold hover:underline transition-all">Login</a>
                </p>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
