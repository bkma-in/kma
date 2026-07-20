import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const PrivacyPolicy: React.FC = () => {
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
              Privacy Policy
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              BKMA Commitment to Protecting Your Personal Data and Privacy
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Privacy Policy</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <p className="text-sm sm:text-base text-zinc-400 mb-10">Last updated: July 2026</p>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Privacy Policy Statement</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              The Bulletin of Kerala Mathematical Association respects your privacy and is committed to protecting your personal information. We collect only the information necessary to manage user accounts, manuscript submissions, peer reviews, and journal publications.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Personal data is securely stored and is never sold or shared except where required for journal operations or by law. By using this website, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Data Security</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              All database and authentication interactions are encrypted in transit and securely held using Firebase Authentication and Firestore security architectures to protect user data from unauthorized access.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Non-Disclosure</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              BKMA strictly guarantees that your personal contact information, reviewer details, and manuscripts are never disclosed to third parties, ensuring double-blind integrity and editorial confidentiality.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Contact Editorial Office</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-4">
              For questions, corrections to personal records, data removal requests, or policy inquiries, please contact the BKMA Editorial Office.
            </p>
            <p className="text-zinc-800 font-extrabold text-lg sm:text-xl">
              Email:{' '}
              <a href="mailto:keralamathsasso@gmail.com" className="hover:underline underline-offset-4">
                keralamathsasso@gmail.com
              </a>
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PrivacyPolicy;
