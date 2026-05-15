import React from 'react';
import { Layout, Construction, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
}

export const ComingSoonPage: React.FC<ComingSoonProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-2xl shadow-black/5 border border-zinc-100 text-center">
        <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-black/20">
          <Construction size={40} className="animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-bold text-black mb-4 tracking-tight">{title}</h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-10">
          We're currently building this dashboard. The frontend team is working on bringing you a premium experience soon.
        </p>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-widest transition-all mx-auto"
        >
          <ChevronLeft size={14} /> Go Back
        </button>
      </div>
    </div>
  );
};

export const ReaderPlaceholder = () => <ComingSoonPage title="Reader Dashboard" />;
export const DevPlaceholder = () => <ComingSoonPage title="Developer Dashboard" />;
