import React, { useState, useEffect } from 'react';
import { X, Users, BookOpen, User, ShieldCheck } from 'lucide-react';
import { getEditorialBoard } from '../services/editorial.service';
import type { EditorMember, EditorialPolicy } from '../types/editorial';

interface EditorialBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CORE_EDITORS: EditorMember[] = [
  {
    name: 'Thrivikraman T.',
    category: 'core',
    role: 'Advisory Editor',
    affiliation: 'Thekkedathu Mana,\nPerole-Palakkattu Link Road,\nNileshwar 671314, Kasaragod District, Kerala, India',
    email: 'thekkedathumana@gmail.com',
  },
  {
    name: 'Krishnamoorthy A.',
    category: 'core',
    role: 'Chief Editor',
    affiliation: 'Department of Mathematics,\nCochin University of Science & Technology,\nCochin - 682 022, Kerala, India',
    email: 'akc@cusat.ac.in, akcusat@yahoo.com',
  },
  {
    name: 'Samuel M.S.',
    category: 'core',
    role: 'Executive Editor',
    affiliation: 'Mattathil, 15/64, Powath Road, Muttambalm,\nKottayam - 686 004, Kerala, India',
    email: 'ktmsamuelms@gmail.com',
  }
];

const DEFAULT_ACADEMIC_EDITORS: EditorMember[] = [
  {
    name: 'Manigalambalam N.R.',
    category: 'academic',
    role: 'Academic Editor',
    affiliation: 'Department of Mathematics,\nSt. Joseph\'s College, Irinjalakuda - 680 121,\nKerala, India',
    email: 'thottuvai@sancharnet.in',
  },
  {
    name: 'Vinod Kumar P.B.',
    category: 'academic',
    role: 'Academic Editor',
    affiliation: 'Department of Mathematics,\nRajagiri School of Engineering & Technology,\nRajagiri Valley, Kakkanad, Cochin - 682 039',
    email: 'vinod_kumar@rajagiritech.ac.in',
  }
];

const DEFAULT_ASSOCIATE_EDITORS: EditorMember[] = [
  {
    name: 'K.T. Arasu',
    category: 'associate',
    affiliation: 'Department of Mathematics and Statistics, Wright State University, Dayton, OH 45435, U.S.A.',
    email: 'karasu@wright.edu',
    areas: 'Combinatorics, Graph Theory, Number Theory'
  },
  {
    name: 'Bagheri Mohammad',
    category: 'associate',
    affiliation: 'P.O. Box 13145-1785, Tehran, Iran.',
    email: 'mohammad_bagheri2006@gmail.com',
    areas: 'History of Mathematics'
  },
  {
    name: 'Bapat R.B.',
    category: 'associate',
    affiliation: 'Indian Statistical Institute, 7, SJS Marg, New Delhi - 110016, India.',
    email: 'rbb@isid.ac.in',
    areas: 'Non-negative Matrices, Generalized Inverses, Matrices and Graphs'
  },
  {
    name: 'Choudum S.A.',
    category: 'associate',
    affiliation: 'Department of Mathematics, IIT Madras, Chennai - 600036, Tamil Nadu, India.',
    email: 'sac@iitm.ac.in',
    areas: 'Graph Theory, Combinatorics, Discrete Mathematics'
  },
  {
    name: 'Comfort W.W.',
    category: 'associate',
    affiliation: 'Department of Mathematics, Wesleyan University, Middletown, CT 06459, U.S.A.',
    email: 'wcomfort@wesleyan.edu',
    areas: 'Set Theoretic Topology, Topological Groups'
  },
  {
    name: 'Gupta R.C.',
    category: 'associate',
    affiliation: 'R-20, Ras Bahar Colony, Jhansi - 284003, Uttar Pradesh, India.',
    email: '',
    areas: 'History of Mathematics'
  },
  {
    name: 'Jinnah M.I.',
    category: 'associate',
    affiliation: 'F2, Lavanya Flats, 4th Cross Street, Andal Nagar, Adambakkam, Chennai - 600088, Tamil Nadu, India.',
    email: 'jinnahmi@yahoo.co.in, jinnahmi@hotmail.com',
    areas: 'Commutative Algebra, Graph Theory'
  },
  {
    name: 'Kaimal M.R.',
    category: 'associate',
    affiliation: 'Chairman, Department of Computer Science, Amrita Vishwa Vidyapeetham, Amritapuri, Kollam - 690525, Kerala, India.',
    email: 'mrkaimal@yahoo.com',
    areas: 'Computing Science, AI, Fuzzy Logic, Digital Image Processing, Algorithm Design, Software Metrics'
  },
  {
    name: 'Kannan D.',
    category: 'associate',
    affiliation: 'Department of Mathematics, University of Georgia, Athens, Georgia 30602, U.S.A.',
    email: 'kannan@uga.edu',
    areas: 'Stochastic Equations, Bio-informatics, Engineering and Finances'
  },
  {
    name: 'Kannan V.',
    category: 'associate',
    affiliation: 'Department of Mathematics & Statistics, University of Hyderabad, Hyderabad - 500046, Andhra Pradesh, India.',
    email: 'vksm@uohyd.ernet.in',
    areas: 'Analysis, Topology, Discrete Dynamical Systems'
  },
  {
    name: 'Kesavan S.',
    category: 'associate',
    affiliation: 'The Institute of Mathematical Sciences, CIT Campus, Taramani, Chennai - 600113, Tamil Nadu, India.',
    email: 'kesh@imsc.res.in',
    areas: 'Analysis, Functional Analysis, Partial Differential Equations'
  },
  {
    name: 'Nagabhushan P.',
    category: 'associate',
    affiliation: 'Bangalore Educational Society for Technology Advancement, Kodati, Off Sarjapur Road, Bengaluru, Karnataka, India.',
    email: 'pnagabhushan@hotmail.com',
    areas: 'Pattern Recognition, Image Processing, Remote Sensing, AI, Computer Vision'
  },
  {
    name: 'Nambooripad K.S.S.',
    category: 'associate',
    affiliation: 'Komana, Thripadapuram, Kulathur, Thiruvananthapuram - 695583, Kerala, India.',
    email: 'kssn@tug.org.in',
    areas: 'Theory of Semigroups - Algebraic/Analytic, Semigroup Operators'
  },
  {
    name: 'Rajagopalan M.',
    category: 'associate',
    affiliation: '10035, Woodland Grove Drive, Lakeland (TN) 38002, USA.',
    email: 'mrajagopalan@juno.com',
    areas: 'Topology, Functional Analysis'
  },
  {
    name: 'Roychoudhury Rajkumar',
    category: 'associate',
    affiliation: 'Physics & Applied Mathematics Unit, ISI, Kolkata - 700108, West Bengal, India.',
    email: 'raj@isical.ac.in',
    areas: 'Quantum Mechanics, Solitary Waves, Non-linear Differential Equations, Theoretical Plasma Physics'
  },
  {
    name: 'Srivastava A.K.',
    category: 'associate',
    affiliation: 'Department of Mathematics, Banaras Hindu University, Varanasi - 221005, Uttar Pradesh, India.',
    email: 'aks@banaras.ernet.in, rekhasri@bhu.ac.in',
    areas: 'Category Theory, Fuzzy Topology'
  },
  {
    name: 'Stephen Watson',
    category: 'associate',
    affiliation: 'York University, Department of Mathematics & Statistics, 4700 Keele Street, Toronto, Ontario, Canada M3J1P3.',
    email: 'mathstat@yorku.ca',
    areas: 'Topology'
  }
];

const EditorialBoardModal: React.FC<EditorialBoardModalProps> = ({ isOpen, onClose }) => {
  const [coreEditors, setCoreEditors] = useState<EditorMember[]>(DEFAULT_CORE_EDITORS);
  const [academicEditors, setAcademicEditors] = useState<EditorMember[]>(DEFAULT_ACADEMIC_EDITORS);
  const [associateEditors, setAssociateEditors] = useState<EditorMember[]>(DEFAULT_ASSOCIATE_EDITORS);
  const [customCategories, setCustomCategories] = useState<{ [key: string]: EditorMember[] }>({});
  const [policy, setPolicy] = useState<EditorialPolicy | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBoard = async () => {
      try {
        const data = await getEditorialBoard();
        if (data && data.success) {
          if (data.grouped?.core?.length) setCoreEditors(data.grouped.core);
          if (data.grouped?.academic?.length) setAcademicEditors(data.grouped.academic);
          if (data.grouped?.associate?.length) setAssociateEditors(data.grouped.associate);
          if (data.grouped?.custom) setCustomCategories(data.grouped.custom);
          if (data.policy) setPolicy(data.policy);
        }
      } catch (err) {
        console.error('Failed to fetch modal editorial board:', err);
      }
    };
    fetchBoard();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden font-['Outfit']">
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
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          {/* Section: Core Editors */}
          {coreEditors.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
                <User size={14} /> Core Editorial Team
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coreEditors.map((editor, idx) => (
                  <div key={editor.id || idx} className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      {editor.role && (
                        <h4 className="text-sm font-bold text-white mb-1">{editor.role}</h4>
                      )}
                      <p className="text-xs text-zinc-300 font-semibold mb-2">{editor.name}</p>
                      {editor.affiliation && (
                        <div className="text-[11px] text-zinc-400 space-y-1 whitespace-pre-line leading-relaxed">
                          {editor.affiliation}
                        </div>
                      )}
                    </div>
                    {editor.email && (
                      <a href={`mailto:${editor.email}`} className="text-blue-400 text-[11px] pt-2 border-t border-white/5 mt-2 hover:underline truncate block">
                        {editor.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Academic Editors */}
          {academicEditors.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
                <BookOpen size={14} /> Academic Editors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {academicEditors.map((editor, idx) => (
                  <div key={editor.id || idx} className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-zinc-300 font-semibold mb-2">{editor.name}</p>
                      {editor.affiliation && (
                        <div className="text-[11px] text-zinc-400 space-y-1 whitespace-pre-line leading-relaxed">
                          {editor.affiliation}
                        </div>
                      )}
                      {editor.areas && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Areas of Interest</p>
                          <p className="text-[10px] text-zinc-400">{editor.areas}</p>
                        </div>
                      )}
                    </div>
                    {editor.email && (
                      <a href={`mailto:${editor.email}`} className="text-blue-400 text-[11px] pt-2 border-t border-white/5 mt-2 hover:underline truncate block">
                        {editor.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Associate Editors */}
          {associateEditors.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 border-b border-white/5 pb-2">
                <Users size={14} /> Associate Editors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {associateEditors.map((editor, idx) => (
                  <div key={editor.id || idx} className="p-4 bg-zinc-900/30 rounded-xl border border-white/5 hover:bg-zinc-900/80 transition-colors flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-white font-bold mb-1">{editor.name}</p>
                      {editor.affiliation && (
                        <p className="text-[10px] text-zinc-500 mb-1 leading-relaxed whitespace-pre-line">{editor.affiliation}</p>
                      )}
                      {editor.email && (
                        <a href={`mailto:${editor.email}`} className="text-[10px] text-blue-400 mb-2 truncate block hover:underline">
                          {editor.email}
                        </a>
                      )}
                    </div>
                    {editor.areas && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Areas of Interest</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{editor.areas}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Custom Categories */}
          {Object.keys(customCategories).length > 0 && (
            <div className="space-y-6">
              {Object.entries(customCategories).map(([catKey, catEditors]) => {
                const title = catEditors[0]?.categoryTitle || (catKey.charAt(0).toUpperCase() + catKey.slice(1));
                return (
                  <section key={catKey} className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2 border-b border-white/5 pb-2">
                      <Users size={14} /> {title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catEditors.map((editor, idx) => (
                        <div key={editor.id || idx} className="p-4 bg-zinc-900/30 rounded-xl border border-white/5 hover:bg-zinc-900/80 transition-colors flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-white font-bold mb-1">{editor.name}</p>
                            {editor.role && (
                              <p className="text-[10px] text-purple-400 font-bold mb-1">{editor.role}</p>
                            )}
                            {editor.affiliation && (
                              <p className="text-[10px] text-zinc-500 mb-1 leading-relaxed whitespace-pre-line">{editor.affiliation}</p>
                            )}
                            {editor.email && (
                              <a href={`mailto:${editor.email}`} className="text-[10px] text-blue-400 mb-2 truncate block hover:underline">
                                {editor.email}
                              </a>
                            )}
                          </div>
                          {editor.areas && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Areas of Interest</p>
                              <p className="text-[10px] text-zinc-400 leading-relaxed">{editor.areas}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Section: Editorial Policy */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2 border-b border-white/5 pb-2">
              <ShieldCheck size={14} /> Editorial Policy & Guidelines
            </h3>
            
            <div className="space-y-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-emerald-950/20 border border-emerald-500/10 p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-white mb-2">Editorial Policy</h4>
                <p>{policy?.policyText || "The objective of the Bulletin is to publish original high quality and state of the art papers (in English language) in any area of Mathematical Sciences. Survey/Review articles are also welcome."}</p>
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
                  <li>Annual Subscription: Rs. 1000/- each in India.</li>
                  <li>Life members will receive 50% concession in the subscription charges.</li>
                </ul>
                <p className="mb-3">Subscription charges may be sent through Demand Draft / Online Transfer in favour of Bulletin of Kerala Mathematics Association, payable at Kottayam - 686 001.</p>
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
