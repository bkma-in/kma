import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const Copyright: React.FC = () => {
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
              Copyright Policy
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Intellectual Property Rights and Publishing Agreements with BKMA
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Copyright Policy</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <p className="text-sm sm:text-base text-zinc-400 mb-10">Last updated: July 2026</p>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Copyright Policy &amp; Terms</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              All content published by the Bulletin of Kerala Mathematical Association (BKMA) is protected under applicable copyright laws. Authors retain copyright to their original work while granting BKMA the right to publish and archive accepted manuscripts.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Published articles may be used for educational and non-commercial purposes with proper attribution. Unauthorized reproduction, distribution, or commercial use without prior written permission is prohibited. BKMA is committed to protecting intellectual property and maintaining the highest standards of academic publishing.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Author Rights</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Authors retain moral rights and copy-ownership of their papers. By publishing with BKMA, authors grant the association a non-exclusive license to format, distribute, index, and archive the work globally in print and digital databases.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Usage &amp; Restrictions</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Any reuse of figures, tables, or text excerpts for commercial purposes requires explicit prior written consent from both BKMA and the authors. Proper citation attribution must always be visible when using articles for educational purposes.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Permission Enquiries</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-4">
              To request permissions for translation, reproduction, or republication of materials, please send a written request to the BKMA Editorial Board.
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

export default Copyright;
