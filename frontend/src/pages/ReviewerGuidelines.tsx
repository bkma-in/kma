import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Scale, Award, Eye, FileWarning, HelpCircle, MessageSquare, Clipboard, UserCheck } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const ReviewerGuidelines: React.FC = () => {
  const guidelines = [
    {
      title: "Confidentiality & Ethics",
      icon: ShieldCheck,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      description: "Reviewers must treat the manuscript and all related materials as confidential documents. You must not disclose, share, cite, or use any unpublished work under review for any purpose whatsoever."
    },
    {
      title: "Conflicts of Interest",
      icon: Scale,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      description: "You must declare any potential conflicts of interest (personal, professional, financial, or academic) to the editorial board immediately. If a conflict exists that would compromise your objectivity, please recuse yourself from the review."
    },
    {
      title: "Expertise & Timelines",
      icon: Award,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      description: "Only accept review invitations for manuscripts that fall squarely within your area of mathematical expertise. Ensure you can commit to returning constructive feedback within the journal's specified timeline."
    },
    {
      title: "Evaluation Criteria",
      icon: Eye,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      description: "Examine submissions carefully based on scientific rigor, mathematical accuracy, originality, relevance to the field, and clarity of exposition. Provide detailed justifications for your evaluation."
    },
    {
      title: "Plagiarism & Overlap",
      icon: FileWarning,
      color: "text-rose-500",
      bgColor: "bg-rose-50",
      description: "Immediately notify the editors if you suspect plagiarism, redundant/duplicate publication, data fabrication, or significant overlap with any previously published literature."
    },
    {
      title: "Recommendation",
      icon: HelpCircle,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      description: "Provide a clear and unambiguous recommendation (Accept, Revisions Required, or Reject) backed by detailed comments. Your recommendation should be helpful to the authors and guide the editors."
    },
    {
      title: "Communication",
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
      description: "Ensure that all critiques and feedback are written objectively, professionally, and respectfully. Constructive criticism helps authors improve their work; hostile or personal comments are strictly unacceptable."
    },
    {
      title: "Citation Integrity",
      icon: Clipboard,
      color: "text-teal-500",
      bgColor: "bg-teal-50",
      description: "Verify that all references are complete, accurate, and relevant. Do not demand that authors cite your own papers or specific journals unless there is a genuine, academically valid justification."
    },
    {
      title: "Professional Conduct",
      icon: UserCheck,
      color: "text-zinc-700",
      bgColor: "bg-zinc-100",
      description: "Act with intellectual integrity, fairness, and scientific rigor throughout the peer review process. Your reviews directly impact the quality and reputation of the Bulletin of Kerala Mathematics Association."
    }
  ];

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

        {/* Guidelines List */}
        <div className="max-w-4xl mx-auto px-6 sm:px-12 py-12 sm:py-16 space-y-12">
          <p className="text-sm sm:text-base text-zinc-500 leading-relaxed text-center max-w-xl mx-auto">
            Peer reviewers play a crucial role in maintaining the academic standards and scholarly integrity of the <strong>Bulletin of Kerala Mathematics Association</strong>. Please review and adhere to the guidelines detailed below.
          </p>

          <div className="space-y-8">
            {guidelines.map((item, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row gap-5 p-6 sm:p-8 bg-zinc-50 border border-zinc-200 rounded-3xl hover:border-black transition-all duration-300 shadow-sm"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.bgColor} flex items-center justify-center shrink-0 shadow-sm`}>
                  <item.icon className={item.color} size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-black tracking-tight">
                    {index + 1}. {item.title}
                  </h3>
                  <p className="text-zinc-650 text-sm sm:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-zinc-200 text-center">
            <p className="text-sm text-zinc-500 italic">
              Thank you for your valuable contribution to the mathematical research community and for ensuring the high quality of BKMA publications.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ReviewerGuidelines;
