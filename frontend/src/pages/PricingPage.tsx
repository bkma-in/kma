import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white flex flex-col">
      <PublicHeader />

      <main className="flex-1 pt-28 sm:pt-32 pb-20">

        {/* Hero Banner */}
        <section className="bg-black text-white py-8 sm:py-10 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl -ml-48 -mb-48" />
          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-2.5">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Playfair_Display']">
              Subscription &amp; Pricing
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Official subscription information for the Bulletin of Kerala Mathematical Association
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Subscription &amp; Pricing</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Annual Subscription</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              BKMA offers an annual subscription plan for individuals and institutions seeking access to its official publications.
            </p>
            <div className="border border-zinc-200 rounded-xl p-8 max-w-2xl">
              <p className="text-4xl font-black text-black mb-2">₹2,000 <span className="text-lg font-normal text-zinc-400">/ Per Year</span></p>
              <p className="text-base text-zinc-500 mb-6">All-inclusive pricing covering printing, handling, and shipping charges.</p>
              <ul className="space-y-4">
                {[
                  'Two Journal Issues per volume',
                  'Postage charges included',
                  'Handling charges included',
                  'Official BKMA Publication Access',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3.5 text-base sm:text-lg text-zinc-600">
                    <Check size={20} className="text-black shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Life Member Benefit</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Life Members of the Kerala Mathematical Association receive a <strong className="text-black">50% concession</strong> on subscription charges together with applicable postal charges, subject to BKMA membership policies.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Journal Indexing &amp; Recognition</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              The <strong className="text-black">Bulletin of Kerala Mathematical Association (BKMA)</strong> is included in journal listings recognized by the <strong className="text-black">American Mathematical Society (AMS)</strong>.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Research papers published in BKMA are reviewed and indexed through recognized mathematical indexing and abstracting resources, ensuring global visibility and peer citation credibility for authors' works.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Payment Information</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Online subscriptions can be completed through the BKMA website using the integrated payment system.
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3.5">Supported Payment Methods</p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 text-base sm:text-lg">
              <li>Razorpay</li>
              <li>UPI</li>
              <li>Credit Cards</li>
              <li>Debit Cards</li>
              <li>Net Banking</li>
            </ul>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Delivery Information</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Subscription access and publication-related services will be activated after successful payment verification.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Physical publication delivery schedules may vary depending on postal services and publication timelines.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Please ensure shipping details are correctly updated in your profile account prior to transaction completion.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PricingPage;
