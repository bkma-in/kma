import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Zap,
  ShieldCheck,
  Clock,
  Award,
  ArrowRight,
  CreditCard,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { useSubscription } from '../../utils/SubscriptionContext';

const GetSubscription = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { subscribe } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'lifetime'>('annual');

  const plans = [
    {
      id: 'annual',
      name: 'Annual Pass',
      price: '₹2000',
      period: 'per year',
      features: [
        'Unlock all research articles',
        'Save articles for offline reading',
        'Email notifications for new issues',
        'Standard member profile',
        'Basic research support'
      ],
      recommended: true
    },
    {
      id: 'lifetime',
      name: 'Life Member',
      price: '₹1000',
      period: 'one-time',
      features: [
        'Lifetime unlimited access',
        'Physical copies of annual journals',
        'Priority peer-review processing',
        'Premium member badge',
        '24/7 dedicated support',
        'Exclusive association events'
      ],
      recommended: false
    }
  ];

  const handleSubscribe = () => {
    setIsLoading(true);

    // Simulate payment gateway
    setTimeout(() => {
      // Temporary session-only activation
      subscribe();
      setIsLoading(false);
      showToast('Subscription activated temporarily for this session!', 'success');
      navigate('/reader/dashboard');
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 mb-4">
          <Clock size={12} /> Temporary Demo Mode
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight font-['Outfit'] mb-4">
          Upgrade Your Research Access
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
          Choose a membership plan to unlock full articles. <br />
          <span className="text-rose-500 font-bold text-sm">Note: For demo purposes, access resets on page refresh.</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id as 'annual' | 'lifetime')}
            className={cn(
              "relative bg-white border-2 rounded-[2.5rem] p-10 transition-all cursor-pointer group",
              selectedPlan === plan.id
                ? "border-black shadow-2xl scale-[1.02]"
                : "border-zinc-100 hover:border-zinc-300 shadow-sm"
            )}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Zap size={12} className="fill-current text-yellow-400" />
                Most Popular
              </div>
            )}

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-bold text-black mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-black">{plan.price}</span>
                  <span className="text-zinc-400 text-sm font-medium">{plan.period}</span>
                </div>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                selectedPlan === plan.id ? "border-black bg-black text-white" : "border-zinc-200"
              )}>
                {selectedPlan === plan.id && <CheckCircle2 size={16} />}
              </div>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className={cn(
                    "shrink-0 mt-0.5",
                    selectedPlan === plan.id ? "text-emerald-500" : "text-zinc-300"
                  )} />
                  <span className="text-zinc-600 text-sm leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubscribe();
              }}
              disabled={isLoading}
              className={cn(
                "w-full py-5 rounded-2xl font-bold text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3 uppercase",
                selectedPlan === plan.id
                  ? "bg-black text-white shadow-xl shadow-black/20 hover:bg-zinc-800"
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
              )}
            >
              {isLoading && selectedPlan === plan.id ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <CreditCard size={18} />
                  Subscribe Now
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
        {[
          { icon: ShieldCheck, text: "Secure Payments" },
          { icon: Clock, text: "Instant Access" },
          { icon: Award, text: "Verified Research" },
          { icon: ArrowRight, text: "No Hidden Costs" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 text-center p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <item.icon size={24} className="text-zinc-400 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GetSubscription;
