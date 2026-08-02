import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const ReviewerGuidelines: React.FC = () => {
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
              Reviewer Guidelines
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Peer review standards and ethical codes for BKMA journal evaluators
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">Reviewer Guidelines</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          <p className="text-sm sm:text-base text-zinc-400 mb-10">Last updated: July 2026</p>

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Introduction</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Peer reviewers play a crucial role in maintaining the academic standards and scholarly integrity of the <strong className="text-black">Bulletin of Kerala Mathematics Association</strong>. Reviewers are expected to provide objective, constructive, and timely evaluations of submitted mathematical manuscripts. Please read and adhere to the guidelines detailed below during the review process.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">1. Confidentiality &amp; Ethics</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Reviewers must treat the manuscript and all related materials as confidential documents. You must not disclose, share, cite, or use any unpublished work under review for any purpose whatsoever.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">2. Conflicts of Interest</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              You must declare any potential conflicts of interest (personal, professional, financial, or academic) to the editorial board immediately. If a conflict exists that would compromise your objectivity, please recuse yourself from the review.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">3. Expertise &amp; Timelines</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Only accept review invitations for manuscripts that fall squarely within your area of mathematical expertise. Ensure you can commit to returning constructive feedback within the journal's specified timeline.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">4. Evaluation Criteria</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Examine submissions carefully based on scientific rigor, mathematical accuracy, originality, relevance to the field, and clarity of exposition. Provide detailed justifications for your evaluation.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">5. Plagiarism &amp; Overlap</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Immediately notify the editors if you suspect plagiarism, redundant/duplicate publication, data fabrication, or significant overlap with any previously published literature.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">6. Recommendation</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Provide a clear and unambiguous recommendation (Accept, Revisions Required, or Reject) backed by detailed comments. Your recommendation should be helpful to the authors and guide the editors.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">7. Communication</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Ensure that all critiques and feedback are written objectively, professionally, and respectfully. Constructive criticism helps authors improve their work; hostile or personal comments are strictly unacceptable.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">8. Citation Integrity</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Verify that all references are complete, accurate, and relevant. Do not demand that authors cite your own papers or specific journals unless there is a genuine, academically valid justification.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">9. Professional Conduct</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Act with intellectual integrity, fairness, and scientific rigor throughout the peer review process. Your reviews directly impact the quality and reputation of the Bulletin of Kerala Mathematics Association.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed italic">
              Thank you for your valuable contribution to the mathematical research community and for ensuring the high quality of BKMA publications.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ReviewerGuidelines;
