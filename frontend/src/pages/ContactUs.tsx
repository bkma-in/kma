import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const ContactUs: React.FC = () => {
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
              Contact Us
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Get in touch with the Bulletin of Kerala Mathematical Association
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Contact Us</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-8 leading-tight">BKMA Editorial Office</h2>
            <div className="space-y-6 text-lg sm:text-xl text-zinc-700 leading-relaxed">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">Address</p>
                <p className="text-zinc-800 font-semibold">Bulletin of Kerala Mathematical Association (BKMA)<br />Kerala, India</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">Email</p>
                <a href="mailto:keralamathsasso@gmail.com" className="text-black font-extrabold hover:underline underline-offset-4">
                  keralamathsasso@gmail.com
                </a>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">Website</p>
                <a href="https://www.bkma.in" target="_blank" rel="noopener noreferrer" className="text-black font-extrabold hover:underline underline-offset-4">
                  https://www.bkma.in
                </a>
              </div>
            </div>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              For manuscript submission queries, subscription-related matters, or general editorial correspondence, please reach out via email. Our editorial team endeavors to respond within 3–5 working days.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ContactUs;
