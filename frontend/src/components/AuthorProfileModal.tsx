import React, { useState, useEffect } from 'react';
import { X, Mail, BookOpen, GraduationCap, Award, Compass, Loader2 } from 'lucide-react';
import api from '../services/api';

interface AuthorProfile {
  name: string;
  title: string;
  institution: string;
  email: string;
  interests: string[];
  bio: string;
  publications: string[];
  profileImage?: string | null;
}

const AUTHOR_DATA: Record<string, AuthorProfile> = {
  'Dr. S. Raman': {
    name: 'Dr. S. Raman',
    title: 'Professor & Head of Department',
    institution: 'Department of Mathematics, Kerala University',
    email: 's.raman@keralauniv.ac.in',
    interests: ['Algebraic Topology', 'Complex Manifolds', 'Homotopy Theory'],
    bio: 'Dr. S. Raman is a senior professor specializing in algebraic topology. With over 25 years of teaching and research experience, he has published extensive papers on complex manifolds and serves as an editor for various national and international journals.',
    publications: ['On the Homotopy Type of Certain Spaces', 'Homological Algebra and Applications', 'Co-homology Groups in Riemann Surfaces']
  },
  'M. Nair': {
    name: 'M. Nair',
    title: 'Associate Professor',
    institution: 'School of Mathematical Sciences, CUSAT',
    email: 'm.nair@cusat.ac.in',
    interests: ['Analytic Number Theory', 'Arithmetic Progressions', 'Modular Forms'],
    bio: 'Dr. M. Nair research focuses on analytic number theory, prime distribution, and modular forms. He is a recipient of the Ramanujan Research Fellowship and works closely with algebraic research groups across India.',
    publications: ['Prime Distribution in Arithmetic Progressions', 'On Certain Sums of Number-Theoretic Functions']
  },
  'A. K. Menon': {
    name: 'A. K. Menon',
    title: 'Assistant Professor',
    institution: 'Department of Applied Mathematics, IIT Madras',
    email: 'ak.menon@iitm.ac.in',
    interests: ['Computational Fluid Dynamics', 'Differential Equations', 'Numerical Methods'],
    bio: 'Dr. A. K. Menon works in applied mathematics, particularly computational fluid dynamics and boundary layer flows in porous media. He collaborates with engineering departments on simulated flow modeling projects.',
    publications: ['Fluid Dynamics in Porous Media', 'Non-linear Analysis of Convective Fluid Transfers']
  },
  'Dr. Sarah Jenkins': {
    name: 'Dr. Sarah Jenkins',
    title: 'Principal Research Scientist',
    institution: 'Institute of Biomathematics, Bangalore',
    email: 's.jenkins@biomath.res.in',
    interests: ['Neural Networks', 'Retinal Diagnostic Modeling', 'Mathematical Biology'],
    bio: 'Dr. Sarah Jenkins leads the biomedical modeling division at the Biomathematics Institute. Her research bridges neural network architectures and physiological diagnostic algorithms for retinal and cardiovascular diseases.',
    publications: ['Neural Networks in Modern Diagnostic Medicine', 'Stochastic Modeling of Biological Systems']
  }
};

interface AuthorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorName: string;
  authorId?: string | null;
}

const AuthorProfileModal: React.FC<AuthorProfileModalProps> = ({ isOpen, onClose, authorName, authorId }) => {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (authorId) {
      setLoading(true);
      api.get(`/users/${authorId}/public-profile`)
        .then(res => {
          if (res.data.success && res.data.profile) {
            const data = res.data.profile;
            setProfile({
              name: data.name,
              title: data.designation || 'Contributing Scholar',
              institution: data.affiliation || 'Kerala Mathematical Association (KMA)',
              email: data.email,
              interests: data.interests || ['Mathematics', 'Research'],
              bio: data.bio || `${data.name} is an active researcher and contributor to the Bulletin of Kerala Mathematical Association (BKMA).`,
              publications: data.publications || ['Scholarly contribution to BKMA Journal'],
              profileImage: data.profileImage
            });
          } else {
            useMockData();
          }
        })
        .catch(err => {
          console.error('Failed to fetch public profile, using fallback:', err);
          useMockData();
        })
        .finally(() => setLoading(false));
    } else {
      useMockData();
    }

    function useMockData() {
      const mock = AUTHOR_DATA[authorName] || {
        name: authorName,
        title: 'Contributing Scholar',
        institution: 'Kerala Mathematical Association (KMA)',
        email: 'keralamathsasso@gmail.com',
        interests: ['Mathematics', 'Research'],
        bio: `${authorName} is an active researcher and contributor to the Bulletin of Kerala Mathematical Association (BKMA).`,
        publications: ['Scholarly contribution to BKMA Journal']
      };
      setProfile(mock);
    }
  }, [isOpen, authorId, authorName]);

  if (!isOpen) return null;

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .filter(n => !n.includes('.'))
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || profile.name.slice(0, 2).toUpperCase()
    : 'AU';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-2xl h-[75vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden font-['Outfit']">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/85 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-md">
              <GraduationCap size={16} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Author Profile</h2>
              <p className="text-sm font-bold text-black mt-0.5">BKMA Scholarly Community</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-zinc-300" size={36} />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fetching Profile details...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Card Hero */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                {profile.profileImage ? (
                  <img 
                    src={profile.profileImage} 
                    alt={profile.name} 
                    className="w-16 h-16 rounded-full object-cover shadow-lg shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-black shadow-lg shrink-0">
                    {initials}
                  </div>
                )}
                <div className="text-center sm:text-left space-y-1">
                  <h3 className="text-lg font-black text-black">{profile.name}</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{profile.title}</p>
                  <p className="text-xs text-zinc-400">{profile.institution}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-zinc-500 font-medium pt-1">
                    <Mail size={12} className="text-zinc-400" />
                    <a href={`mailto:${profile.email}`} className="hover:text-black transition-colors">{profile.email}</a>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Award size={12} /> Biography
                </h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {profile.bio}
                </p>
              </div>

              {/* Research Interests */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Compass size={12} /> Research Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-medium text-zinc-700">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Publications */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <BookOpen size={12} /> Key Publications in BKMA
                </h4>
                <div className="space-y-2.5">
                  {profile.publications.map((pub, index) => (
                    <div key={index} className="p-3 bg-white border border-zinc-150 rounded-xl hover:border-zinc-300 transition-all flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                      <p className="text-xs font-bold text-zinc-800 leading-normal">{pub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 text-center shrink-0">
          <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">
            Bulletin of Kerala Mathematical Association (BKMA)
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthorProfileModal;
