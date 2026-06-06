import React from 'react';
import { X, CreditCard, Landmark, CheckCircle2 } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Pricing & Subscription</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Kerala Mathematical Association</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm text-zinc-400 leading-relaxed">
          <p className="text-zinc-300 font-medium">Subscription rate per volume (two issues) including postage and handling charges:</p>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-emerald-500" size={18} /></div>
              <div>
                <p className="font-bold text-white mb-1">Annual Subscription</p>
                <p>Rs. 1000/- each in India.</p>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5 flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-emerald-500" size={18} /></div>
              <div>
                <p className="font-bold text-white mb-1">Life Members</p>
                <p>Life members will receive a <strong className="text-emerald-400">50% concession</strong> in the subscription charges.</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-blue-950/20 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Landmark className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="font-bold text-white mb-1">Payment Method</p>
              <p className="text-xs">
                Subscription charges may be sent through Demand Draft (Bank Check/Cashier's Check as it is called in some western countries) in favour of <strong className="text-zinc-200">Bulletin of Kerala Mathematical Association</strong>, payable at Kottayam - 686 001.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-xs">
              All correspondence including subscription orders and exchange proposals should be sent to the <strong className="text-zinc-300">Executive Editor</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
