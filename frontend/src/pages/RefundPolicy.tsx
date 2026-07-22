import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const RefundPolicy: React.FC = () => {
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
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Guidelines regarding payments, cancellations, and related services offered by BKMA
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Refund &amp; Cancellation Policy</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <p className="text-sm sm:text-base text-zinc-400 mb-10">Last updated: July 2026</p>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Refund Policy</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              BKMA strives to provide quality academic and publication-related services to its members, researchers, authors, and readers. Before completing any transaction, users are encouraged to carefully review the details of the service, membership, or subscription being selected.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Payments made through the BKMA platform are treated as final upon successful processing and confirmation.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Refund Eligibility</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-5">
              BKMA does not ordinarily offer refunds for payments associated with:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-zinc-700 text-lg sm:text-xl leading-relaxed">
              <li>Membership registrations</li>
              <li>Journal subscriptions</li>
              <li>Manuscript processing or publication-related fees</li>
              <li>Event registrations</li>
              <li>Workshops, seminars, or academic programs</li>
              <li>Any other services provided through the platform</li>
            </ul>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mt-5 italic">
              Users are advised to ensure the accuracy of their payment information before confirming a transaction.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Cancellation Policy</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Users may discontinue participation in a membership, subscription, or service at their discretion. However, discontinuation of a service after payment has been completed does not create entitlement to reimbursement of fees already paid.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Where applicable, users may choose not to renew future memberships or subscriptions manually before the renewal date.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Exceptional Circumstances</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              If a transaction is affected by a duplicate payment, processing error, or other technical issue, BKMA may examine the matter and determine an appropriate resolution after verification.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Such reviews are conducted individually and should not be interpreted as an assurance of a refund. BKMA reserves the right to revise or update this policy when necessary.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Contact Information</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-5">
              For questions regarding payments, subscriptions, or related matters, users may reach out through the official contact channels provided on the BKMA website.
            </p>
            <p className="text-zinc-800 font-extrabold text-lg sm:text-xl leading-relaxed">
              By using BKMA services, users acknowledge that they have read and accepted the terms outlined in this Refund and Cancellation Policy.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default RefundPolicy;
