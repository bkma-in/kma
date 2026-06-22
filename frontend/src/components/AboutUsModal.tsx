import React from 'react';
import { X, Info, History, Target, Award } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-3xl h-[80vh] rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">About BKMA</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Kerala Mathematical Association</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 text-zinc-300 text-sm leading-relaxed">
          
          {/* Section: Overview */}
          <section className="space-y-3">
            <p className="text-zinc-300 text-base font-medium">
              The <strong className="text-white">Kerala Mathematical Association (BKMA)</strong> is a premier academic organization dedicated to fostering mathematical scholarship, research, and education. Established to support the mathematical community, the association connects students, educators, and active researchers across Kerala, India, and the global academic sphere.
            </p>
          </section>

          {/* Section: History */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <History size={14} /> Brief History & Growth
            </h3>
            <p>
              Founded in <strong className="text-white">1962</strong>, BKMA has spent over six decades cultivating a vibrant scientific ecosystem. What began as a regional initiative has expanded into a global network of around <strong className="text-white">1,000 members</strong>, nearly half of whom are life members, with over 300 scholars participating from outside Kerala and internationally. 
            </p>
            <p>
              A cornerstone of the association's academic tradition is the prestigious <strong className="text-white">Prof. T.A. Sarasvati Amma Memorial Lecture</strong>, established in 2002. Endowed by the renowned mathematical historian Radha Charan Gupta, the lecture stands as a tribute to groundbreaking contributions in the history of Indian mathematics.
            </p>
          </section>

          {/* Section: Mission & Objectives */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Target size={14} /> Mission & Objectives
            </h3>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
              <li><strong className="text-zinc-200">Excellence in Pedagogy:</strong> Hosting regional orientation programs to train educators in modern pedagogical methodologies and mathematical advancements.</li>
              <li><strong className="text-zinc-200">Research Promotion:</strong> Providing a peer-reviewed platform for researchers to publish original contributions in pure and applied mathematics.</li>
              <li><strong className="text-zinc-200">Scientific Collaboration:</strong> Bridging the gap between domestic scholars and the international mathematical community to foster collaborative breakthroughs.</li>
            </ul>
          </section>

          {/* Section: Contributions & Impact */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Award size={14} /> Key Contributions & Impact
            </h3>
            <p>
              BKMA remains highly active, organizing an average of <strong className="text-white">10 to 12 national and international seminars, workshops, and symposiums annually</strong>. The association publishes formal proceedings from these events to disseminate contemporary discoveries.
            </p>
            <p>
              Since 2004, the association has published its flagship international publication, the <strong className="text-white">Bulletin of Kerala Mathematical Association (BKMA)</strong>. Releasing two peer-reviewed issues annually, this journal showcases original research papers spanning mathematical theories and their real-world applications under rigorous peer review.
            </p>
          </section>

        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/20 text-center shrink-0">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
            BKMA • Est. 1962 • Kerala Mathematical Association
          </p>
        </div>

      </div>
    </div>
  );
};

export default AboutUsModal;
