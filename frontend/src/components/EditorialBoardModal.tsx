import React from 'react';
import { X, Users, BookOpen, User, Book, Settings, ShieldCheck } from 'lucide-react';

interface EditorialBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditorialBoardModal: React.FC<EditorialBoardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Editorial Board & Policy</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Kerala Mathematical Association</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          {/* Section: Core Editors */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <User size={14} /> Core Editorial Team
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-1">Advisory Editor</h4>
                <p className="text-xs text-zinc-300 font-semibold mb-2">Thrivikraman T.</p>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>Thekkedathu Mana,</p>
                  <p>Perole-Palakkattu Link Road,</p>
                  <p>Nileshwar 671314, Kasaragod District, Kerala, India</p>
                  <p className="text-blue-400 pt-1">thekkedathumana@gmail.com</p>
                </div>
              </div>

              <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-1">Chief Editor</h4>
                <p className="text-xs text-zinc-300 font-semibold mb-2">Krishnamoorthy A.</p>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>Department of Mathematics,</p>
                  <p>Cochin University of Science & Technology,</p>
                  <p>Cochin - 682 022, Kerala, India</p>
                  <p className="text-blue-400 pt-1">akc@cusat.ac.in, akcusat@yahoo.com</p>
                </div>
              </div>

              <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-1">Executive Editor</h4>
                <p className="text-xs text-zinc-300 font-semibold mb-2">Samuel M.S.</p>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>Mattathil, 15/64, Powath Road, Muttambalm,</p>
                  <p>Kottayam - 686 004, Kerala, India</p>
                  <p className="text-blue-400 pt-1">ktmsamuelms@gmail.com</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Academic Editors */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <BookOpen size={14} /> Academic Editors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <p className="text-xs text-zinc-300 font-semibold mb-2">Manigalambalam N.R.</p>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>Department of Mathematics,</p>
                  <p>St. Joseph's College, Irinjalakuda - 680 121,</p>
                  <p>Kerala, India</p>
                  <p className="text-blue-400 pt-1">thottuvai@sancharnet.in</p>
                </div>
              </div>
              <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5">
                <p className="text-xs text-zinc-300 font-semibold mb-2">Vinod Kumar P.B.</p>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>Department of Mathematics,</p>
                  <p>Rajagiri School of Engineering & Technology,</p>
                  <p>Rajagiri Valley, Kakkanad, Cochin - 682 039</p>
                  <p className="text-blue-400 pt-1">vinod_kumar@rajagiritech.ac.in</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Associate Editors */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <Users size={14} /> Associate Editors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: 'K.T. Arasu',
                  details: 'Department of Mathematics and Statistics, Wright State University, Dayton, OH 45435, U.S.A.',
                  email: 'karasu@wright.edu',
                  areas: 'Combinatorics, Graph Theory, Number Theory'
                },
                {
                  name: 'Bagheri Mohammad',
                  details: 'P.O. Box 13145-1785, Tehran, Iran.',
                  email: 'mohammad_bagheri2006@gmail.com',
                  areas: 'History of Mathematics'
                },
                {
                  name: 'Bapat R.B.',
                  details: 'Indian Statistical Institute, 7, SJS Marg, New Delhi - 110016, India.',
                  email: 'rbb@isid.ac.in',
                  areas: 'Non-negative Matrices, Generalized Inverses, Matrices and Graphs'
                },
                {
                  name: 'Choudum S.A.',
                  details: 'Department of Mathematics, IIT Madras, Chennai - 600036, Tamil Nadu, India.',
                  email: 'sac@iitm.ac.in',
                  areas: 'Graph Theory, Combinatorics, Discrete Mathematics'
                },
                {
                  name: 'Comfort W.W.',
                  details: 'Department of Mathematics, Wesleyan University, Middletown, CT 06459, U.S.A.',
                  email: 'wcomfort@wesleyan.edu',
                  areas: 'Set Theoretic Topology, Topological Groups'
                },
                {
                  name: 'Gupta R.C.',
                  details: 'R-20, Ras Bahar Colony, Jhansi - 284003, Uttar Pradesh, India.',
                  email: null,
                  areas: 'History of Mathematics'
                },
                {
                  name: 'Jinnah M.I.',
                  details: 'F2, Lavanya Flats, 4th Cross Street, Andal Nagar, Adambakkam, Chennai - 600088.',
                  email: 'jinnahmi@yahoo.co.in, jinnahmi@hotmail.com',
                  areas: 'Commutative Algebra, Graph Theory'
                },
                {
                  name: 'Kaimal M.R.',
                  details: 'Chairman, Department of Computer Science, Amrita Vishwa Vidyapeetham, Amritapuri, Kollam - 690525, Kerala, India.',
                  email: 'mrkaimal@yahoo.com',
                  areas: 'Computing Science, AI, Fuzzy Logic, Digital Image Processing, Algorithm Design, Software Metrics'
                },
                {
                  name: 'Kannan D.',
                  details: 'Department of Mathematics, University of Georgia, Athens, Georgia 30602, U.S.A.',
                  email: 'kannan@uga.edu',
                  areas: 'Stochastic Equations, Bio-informatics, Engineering and Finances'
                },
                {
                  name: 'Kannan V.',
                  details: 'Department of Mathematics & Statistics, University of Hyderabad, Hyderabad - 500046, Andhra Pradesh, India.',
                  email: 'vksm@uohyd.ernet.in',
                  areas: 'Analysis, Topology, Discrete Dynamical Systems'
                },
                {
                  name: 'Kesavan S.',
                  details: 'The Institute of Mathematical Sciences, CIT Campus, Taramani, Chennai - 600113, Tamil Nadu, India.',
                  email: 'kesh@imsc.res.in',
                  areas: 'Analysis, Functional Analysis, Partial Differential Equations'
                },
                {
                  name: 'Nagabhushan P.',
                  details: 'Bangalore Educational Society for Technology Advancement, Kodati, Off Sarjapur Road, Bengaluru, Karnataka, India.',
                  email: 'pnagabhushan@hotmail.com',
                  areas: 'Pattern Recognition, Image Processing, Remote Sensing, AI, Computer Vision'
                },
                {
                  name: 'Nambooripad K.S.S.',
                  details: 'Komana, Thripadapuram, Kulathur, Thiruvananthapuram - 695583, Kerala, India.',
                  email: 'kssn@tug.org.in',
                  areas: 'Theory of Semigroups - Algebraic/Analytic, Semigroup Operators'
                },
                {
                  name: 'Rajagopalan M.',
                  details: '10035, Woodland Grove Drive, Lakeland (TN) 38002, USA.',
                  email: 'mrajagopalan@juno.com',
                  areas: 'Topology, Functional Analysis'
                },
                {
                  name: 'Roychoudhury Rajkumar',
                  details: 'Physics & Applied Mathematics Unit, ISI, Kolkata - 700108, West Bengal, India.',
                  email: 'raj@isical.ac.in',
                  areas: 'Quantum Mechanics, Solitary Waves, Non-linear Differential Equations, Theoretical Plasma Physics'
                },
                {
                  name: 'Srivastava A.K.',
                  details: 'Department of Mathematics, Banaras Hindu University, Varanasi - 221005, Uttar Pradesh, India.',
                  email: 'aks@banaras.ernet.in, rekhasri@bhu.ac.in',
                  areas: 'Category Theory, Fuzzy Topology'
                },
                {
                  name: 'Stephen Watson',
                  details: 'York University, Department of Mathematics & Statistics, 4700 Keele Street, Toronto, Ontario, Canada M3J1P3.',
                  email: 'mathstat@yorku.ca',
                  areas: 'Topology'
                }
              ].map((editor, idx) => (
                <div key={idx} className="p-4 bg-zinc-900/30 rounded-xl border border-white/5 hover:bg-zinc-900/80 transition-colors">
                  <p className="text-xs text-white font-bold mb-1">{editor.name}</p>
                  <p className="text-[10px] text-zinc-500 mb-1 leading-relaxed">{editor.details}</p>
                  {editor.email && <p className="text-[10px] text-blue-400 mb-2 truncate">{editor.email}</p>}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Areas of Interest</p>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{editor.areas}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Editorial Policy */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <ShieldCheck size={14} /> Editorial Policy & Guidelines
            </h3>
            
            <div className="space-y-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-emerald-950/20 border border-emerald-500/10 p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-white mb-2">Editorial Policy</h4>
                <p>The objective of the Bulletin is to publish original high quality and state of the art papers (in English language) in any area of Mathematical Sciences. Survey/Review articles are also welcome.</p>
              </div>

              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-2">Periodicity</h4>
                <p>The journal will have one volume per year, with two issues published half-yearly. Also some special issues are brought out occasionally.</p>
              </div>

              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-2">Submission of Papers</h4>
                <p className="mb-3">Authors are encouraged to submit papers electronically - preferably in LaTeX to any of the Associate Editors in their area or to the Advisory Editor or to the Chief Editor or to any of the Academic Editors.</p>
                <p className="mb-3">If electronic submission is not possible, authors may submit three copies of the manuscript to the Advisory Editor. Manuscript should not normally exceed 20 pages of A4 size paper in one-and-a-half line spacing with wide margins, printed on one side of the paper only.</p>
                <p className="font-semibold text-zinc-300 mb-2 mt-4">The papers should be prepared in the following order:</p>
                <p className="mb-4">Title, Author(s), Affiliation, Brief Abstract, AMS2000 Subject Classification, Keywords, Main Text, Acknowledgements and References. References should be listed alphabetically (on first author's surname) in the following format:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4 text-zinc-500">
                  <li>L. Gillman and M. Jerison, Rings of Continuous Functions, Van Nostrand, Princeton, 1960.</li>
                  <li>L.A. Zadeh, Fuzzy Sets, Information and Control, 8 (1965) 338-358.</li>
                </ul>
                <p className="mb-3">Photo-ready copies of figures and tables should be inserted in the main text at the appropriate places. Sections within the paper should be decimally numbered.</p>
                <p className="mb-3">One copy of the particular issue of the Bulletin containing the paper and soft copy of the paper will be supplied to the author(s) free of charge.</p>
                <p className="italic text-emerald-400">Copyright of the published papers is vested with the Kerala Mathematical Association.</p>
              </div>

              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-2">Subscription</h4>
                <p className="mb-2">Subscription rate per volume (two issues) including postage and handling charges:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4 text-zinc-500">
                  <li>Annual Subscription: Rs. 1000/- each for the year 2011 in India.</li>
                  <li>Life members will receive 50% concession in the subscription charges.</li>
                </ul>
                <p className="mb-3">Subscription charges may be sent through Demand Draft (Bank Check/Cashier's Check as it is called in some western countries) in favour of Bulletin of Kerala Mathematical Association, payable at Kottayam - 686 001.</p>
                <p className="text-emerald-400">All correspondence including subscription orders and exchange proposals should be sent to the Executive Editor.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default EditorialBoardModal;
