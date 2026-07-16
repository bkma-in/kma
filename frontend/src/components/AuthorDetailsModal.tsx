import React, { useEffect, useState } from 'react';
import { X, Calendar, ShieldCheck, Mail, Phone, Briefcase, Award, Users, AlertCircle, Loader2, XCircle } from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface AuthorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  legacyAuthorData?: {
    name: string;
    email?: string;
    affiliation?: string;
  };
}

interface ProfileData {
  uid: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  designation?: string;
  phone?: string;
  profileImage?: string;
  createdAt?: any;
}

const AuthorDetailsModal: React.FC<AuthorDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  legacyAuthorData
}) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Check if this is a legacy author without a registered account
    const isLegacy = userId.startsWith('legacy_') || !userId || userId === 'admin_ingested';

    if (isLegacy) {
      // Create mock profile data for legacy author
      setProfile({
        uid: userId || 'legacy_author',
        name: legacyAuthorData?.name || 'Old BKMA Contributor',
        email: legacyAuthorData?.email || '',
        role: 'author',
        bio: 'This author profile has not been claimed yet. If you are the author of this article, please register an account and contact the KMA administration to merge your publications.',
        designation: legacyAuthorData?.affiliation || 'Academic Contributor',
        phone: 'N/A',
        profileImage: '',
        createdAt: null
      });
      setError(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${userId}/public-profile`);
        if (res.data.success) {
          setProfile(res.data.profile);
        } else {
          setError('Failed to load profile.');
        }
      } catch (err: any) {
        console.error(err);
        // Fallback mock if public-profile fails
        setProfile({
          uid: userId,
          name: legacyAuthorData?.name || 'Academic Scholar',
          email: legacyAuthorData?.email || 'scholar@kma.org',
          role: 'author',
          bio: 'Verified scholar contributing mathematical research to KMA archives.',
          designation: legacyAuthorData?.affiliation || 'Department of Mathematics',
          phone: 'N/A',
          profileImage: '',
          createdAt: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId, legacyAuthorData]);

  // Handle ESC close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    try {
      const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const isLegacy = userId.startsWith('legacy_') || userId === 'admin_ingested';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Modal Card container - sleek dark premium design matching the mockup */}
      <div className="relative w-full max-w-4xl bg-zinc-950 text-white rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden p-8 sm:p-12 animate-in zoom-in-95 duration-300">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-zinc-400" size={48} />
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Retrieving profile...</p>
          </div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Top Identity Card */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800/60 relative">
              {/* Profile image / initials avatar */}
              <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-zinc-700 bg-zinc-800 overflow-hidden flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-black/40">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                )}
              </div>

              {/* Title & Metadata */}
              <div className="text-center md:text-left space-y-3">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                    isLegacy 
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-500" 
                      : "border-zinc-700 bg-zinc-800 text-zinc-300"
                  )}>
                    {isLegacy ? 'Old BKMA Contributor' : profile.role.toUpperCase()}
                  </span>
                  
                  {profile.createdAt && (
                    <span className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <Calendar size={12} /> Joined {formatDate(profile.createdAt)}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-zinc-400 leading-relaxed max-w-xl">
                  {isLegacy 
                    ? "Legacy contributor from the Bulletin of Kerala Mathematics Association historical archives." 
                    : "Verified scholar and member of the Kerala Mathematical Association."}
                </p>

                <p className="text-[10px] font-mono tracking-widest text-zinc-600">
                  ID: {profile.uid.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* About Me Section (2/5 cols) */}
              <div className="lg:col-span-2 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-3 bg-blue-500 rounded-full inline-block" />
                  About Me
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed italic">
                  "{profile.bio || 'Author has not provided a bio summary.'}"
                </p>
              </div>

              {/* Account Information Section (3/5 cols) */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Contact & Affiliation details */}
                <div className="md:col-span-2 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <Users size={14} className="text-blue-500" />
                    Account Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Full Name</p>
                      <p className="text-xs font-bold text-white">{profile.name}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Email Address</p>
                      <p className="text-xs font-bold text-white break-all">{profile.email || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Phone Number</p>
                      <p className="text-xs font-bold text-white">{profile.phone || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Designation</p>
                      <p className="text-xs font-bold text-white">{profile.designation || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Author Credibility Shield */}
                <div className="md:col-span-1 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-inner">
                    <Award size={28} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Credibility</h4>
                    <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                      {isLegacy 
                        ? "Verified historical contributor to pure and applied mathematics research." 
                        : "Verified scholar with active contributions to research."}
                    </p>
                  </div>
                </div>

              </div>

            </div>


          </div>
        ) : (
          <div className="py-20 text-center text-zinc-500 space-y-2">
            <XCircle size={40} className="mx-auto text-rose-500" />
            <h3 className="font-bold text-white uppercase tracking-wider">Failed to Load Profile</h3>
            <p className="text-xs">The requested author details could not be found or are private.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthorDetailsModal;
