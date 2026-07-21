import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const TermsAndConditions: React.FC = () => {
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
              Terms &amp; Conditions
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Rules and guidelines for accessing and publishing on the BKMA platform
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Terms &amp; Conditions</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <p className="text-sm sm:text-base text-zinc-400 mb-10">Last updated: July 2026</p>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Introduction</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Welcome to <strong className="text-black">BKMA (Bulletin of Kerala Mathematical Association)</strong>. By accessing, browsing, or using this website, you agree to comply with and be bound by these Terms &amp; Conditions. If you do not agree with any part of these terms, you should discontinue use of the website.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Use of the Website</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-4">
              The BKMA website is intended to provide information related to mathematical research, publications, academic activities, memberships, and associated services.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Users agree to use the platform only for lawful purposes and in a manner that does not interfere with the operation, security, or accessibility of the website.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Privacy</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Use of the website is also governed by the BKMA Privacy Policy. By using the platform, users consent to the collection and use of information as described in the Privacy Policy.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">User Accounts</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-5">
              Certain features may require registration or account creation. Users are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-3.5 text-zinc-700 text-lg sm:text-xl leading-relaxed">
              <li>Providing accurate and up-to-date information.</li>
              <li>Maintaining the confidentiality of login credentials.</li>
              <li>Ensuring that account activities are conducted responsibly.</li>
              <li>Not sharing account access with unauthorized individuals.</li>
            </ul>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mt-5 italic">
              BKMA reserves the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Intellectual Property</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-4">
              All content published on the website, including articles, logos, graphics, designs, and text, remains the property of BKMA or the respective content owners unless otherwise stated.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Users may not reproduce, distribute, modify, or republish website content without prior authorization.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Contact Information</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-5">
              For questions regarding these Terms &amp; Conditions, users may contact BKMA through the official contact channels available on the website.
            </p>
            <p className="text-zinc-800 font-extrabold text-lg sm:text-xl leading-relaxed">
              By continuing to use the BKMA website, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default TermsAndConditions;
