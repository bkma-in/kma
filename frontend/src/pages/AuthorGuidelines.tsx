import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Download, ExternalLink } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const AuthorGuidelines: React.FC = () => {
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
              Author Guidelines
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Submission standards, manuscript preparation, and copyright policies for BKMA authors
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Author Guidelines</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <p className="text-sm sm:text-base text-zinc-400 mb-10">Last updated: August 2026</p>

          {/* Submission Section */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Manuscript Submission</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Please submit your manuscript to the <strong className="text-black">Bulletin of Kerala Mathematics Association (BKMA)</strong> as a PDF file here:
            </p>
            <Link
              to="/author/submit"
              className="inline-flex items-center gap-3 bg-black text-white px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 cursor-pointer"
            >
              <FileText size={18} />
              <span>Go to Submission Page</span>
              <ChevronRight size={16} />
            </Link>
          </section>

          <hr className="border-zinc-200 mb-12" />

          {/* Preparation of Manuscripts */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Preparation of Manuscripts</h2>
            
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Manuscripts for publication must be written in English. We welcome manuscripts written in TeX, LaTeX or AMS-TeX, preferably in LaTeX2e.
            </p>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-black text-base sm:text-lg mb-1">BKMA LaTeX2e Class File</h3>
                <p className="text-zinc-600 text-sm">Download the official class file for formatting your manuscript.</p>
              </div>
              <a
                href="https://www.mathsoc.jp/publication/JMSJ/jmsj-classfile.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors shrink-0"
              >
                <Download size={14} />
                <span>Download Class File (.zip)</span>
              </a>
            </div>

            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              If the title is long, a shortened version of the title (no more than 60 characters, including spaces) should be given as a running head. Authors are requested that all papers include a short and informative Abstract, Key Words and Phrases, and the 2020 Mathematics Subject Classification Numbers (
              <a
                href="https://mathscinet.ams.org/mathscinet/msc/msc2020.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black font-semibold underline hover:text-zinc-600 transition-colors inline-flex items-center gap-1"
              >
                <span>2020MSC</span>
                <ExternalLink size={14} />
              </a>
              ) representing primary and secondary subjects of the article.
            </p>

            <div className="bg-zinc-900 text-zinc-100 font-mono text-sm sm:text-base rounded-2xl p-6 mb-6 space-y-2 overflow-x-auto border border-zinc-800 shadow-inner">
              <p><span className="text-amber-400 font-bold">2020 Mathematics Subject Classification.</span> Primary 17B35; Secondary 22E46, 16S32.</p>
              <p><span className="text-amber-400 font-bold">Key Words and Phrases.</span> harmonics, Capelli identity, invariant theory.</p>
            </div>

            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Manuscripts containing coloured figures will be published in grayscale. Their electronic version could remain in the original colour.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          {/* Copyright */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Copyright</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Authors of papers which have been accepted for publication will be asked to sign an agreement.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          {/* Green Open Access */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Green Open Access</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Green Open Access, also known as self-archiving, enables authors to deposit a copy of their accepted manuscript in an institutional repository. BKMA allows authors to upload accepted manuscripts to an institutional repository based on the following policy.
            </p>

            <h3 className="text-xl sm:text-2xl font-bold text-black mb-4">Policy toward institutional repositories:</h3>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-4">
              Research institutions such as universities can deposit their researchers' final peer-reviewed versions or the publisher versions in their repository under the following conditions:
            </p>

            <ol className="list-decimal list-inside text-zinc-700 text-lg sm:text-xl leading-relaxed space-y-2 mb-6 ml-4">
              <li>Depositing is for academic purposes only.</li>
              <li>Papers should be clearly marked as published in the Bulletin of Kerala Mathematics Association.</li>
              <li>Publisher versions cannot be deposited before three years of publication.</li>
            </ol>

            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              In other cases, permission from the Kerala Mathematical Association is required.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          {/* About BKMA & Indexing */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">About BKMA &amp; Indexing</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              The Bulletin of Kerala Mathematics Association (BKMA) was founded in 2004 and is published half yearly by the Kerala Mathematical Association (KMA). It covers a wide range of pure and applied mathematical sciences and the applications. The research articles in the journal are selected by the editorial board with the aid of distinguished international referees.
            </p>

            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              We provide free access to back issues three years after publication (available also at the{' '}
              <a
                href="https://www.mathsoc.jp/publication/JMSJ/onlineindex/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black font-semibold underline hover:text-zinc-600 transition-colors inline-flex items-center gap-1"
              >
                <span>Online Index</span>
                <ExternalLink size={14} />
              </a>
              ).
            </p>

            <h3 className="text-xl sm:text-2xl font-bold text-black mb-4">BKMA is indexed/reviewed in:</h3>
            <ul className="space-y-3 ml-4">
              <li>
                <a
                  href="http://www.ams.org/mr-database"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black text-lg font-bold underline hover:text-zinc-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Mathematical Reviews</span>
                  <ExternalLink size={16} />
                </a>
              </li>
              <li>
                <a
                  href="http://www.zentralblatt-math.org/zmath/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black text-lg font-bold underline hover:text-zinc-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Zentralblatt MATH</span>
                  <ExternalLink size={16} />
                </a>
              </li>
            </ul>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed italic">
              Thank you for contributing your mathematical research to the Bulletin of Kerala Mathematics Association.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default AuthorGuidelines;
