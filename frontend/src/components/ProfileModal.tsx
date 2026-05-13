import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Edit3, 
  Save, 
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useNotification } from '../utils/NotificationContext';
import type { UserProfile } from '../hooks/useProfile';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (newData: UserProfile, imageFile?: File | null) => Promise<{ success: boolean; error?: string }>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const { showToast } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setPreviewImage(profile.profileImage);
    }
  }, [profile, isOpen]);

  if (!isOpen || !formData) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      setSelectedFile(file);
      setImageRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and Email are required', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (formData.phone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        showToast('Phone number must be 10 digits and start with 6, 7, 8, or 9', 'error');
        return;
      }
    }

    setIsSaving(true);
    const result = await onSave(formData, imageRemoved ? null : selectedFile);
    setIsSaving(false);

    if (result.success) {
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
      setSelectedFile(null);
      setImageRemoved(false);
    } else {
      showToast(result.error || 'Failed to update profile', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={cn(
        "relative w-full max-w-lg bg-zinc-900 text-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10",
        "h-full sm:h-auto sm:rounded-3xl"
      )}>
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/40 to-transparent z-0" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-20 p-2 hover:bg-white/10 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 p-8 pt-12 flex flex-col items-center">
          {/* Profile Image Section */}
          <div className="relative group mb-6">
            <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-zinc-600" />
              )}
            </div>
            
            {isEditing && (
              <div className="absolute -bottom-2 flex flex-col items-center gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-90 border-4 border-zinc-900"
                  title="Upload New Photo"
                >
                  <Camera size={18} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* New Explicit Remove Button as requested */}
          {isEditing && previewImage && (
            <button 
              type="button"
              onClick={() => {
                setPreviewImage(null);
                setSelectedFile(null);
                setImageRemoved(true);
              }}
              className="flex items-center gap-3 text-rose-500 hover:text-rose-400 transition-colors py-2 group mb-4"
            >
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium tracking-tight">Remove current picture</span>
            </button>
          )}

          <h2 className="text-2xl font-bold tracking-tight mb-1">{formData.name}</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-white/5 mb-8">
            <Shield size={12} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">{formData.role}</span>
          </div>

          {/* Form / Details Section */}
          <form onSubmit={handleSave} className="w-full space-y-6">
            <div className="grid gap-5">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Full Name
                </label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium bg-white/5 border border-white/5 rounded-xl px-4 py-3">{formData.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} /> Email Address
                </label>
                {isEditing ? (
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium bg-white/5 border border-white/5 rounded-xl px-4 py-3">{formData.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} /> Phone Number
                </label>
                {isEditing ? (
                  <input 
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      if (value.length > 0 && !['6', '7', '8', '9'].includes(value[0])) {
                        return;
                      }
                      setFormData({ ...formData, phone: value });
                    }}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                    {formData.phone || <span className="opacity-40 italic">No phone number provided</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-4">
              {isEditing ? (
                <>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile);
                      setPreviewImage(profile?.profileImage || null);
                    }}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
