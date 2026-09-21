import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Mail, BookOpen, Users, ShieldCheck, Tag } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { getEditorialBoard } from '../services/editorial.service';
import type { EditorMember, EditorialPolicy } from '../types/editorial';

// Default static fallback for instant loading & resilience
const INITIAL_ASSOCIATE_EDITORS: EditorMember[] = [
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

const INITIAL_CORE_EDITORS: EditorMember[] = [
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

const INITIAL_ACADEMIC_EDITORS: EditorMember[] = [
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

const AboutUs: React.FC = () => {
  const [coreEditors, setCoreEditors] = useState<EditorMember[]>(INITIAL_CORE_EDITORS);
  const [academicEditors, setAcademicEditors] = useState<EditorMember[]>(INITIAL_ACADEMIC_EDITORS);
  const [associateEditors, setAssociateEditors] = useState<EditorMember[]>(INITIAL_ASSOCIATE_EDITORS);
  const [customCategories, setCustomCategories] = useState<{ [key: string]: EditorMember[] }>({});
  const [policy, setPolicy] = useState<EditorialPolicy | null>(null);

  useEffect(() => {
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
        console.error('Failed to load live editorial board:', err);
      }
    };
    fetchBoard();
  }, []);

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
              About BKMA
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">
              Kerala Mathematical Association
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider pt-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} className="text-zinc-600" />
              <span className="text-zinc-300">About Us</span>
            </div>
          </div>
        </section>

        {/* Document Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16">

          {/* Section: Overview */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Advancing Mathematical Research Through Knowledge and Collaboration</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              The <strong className="text-black">Bulletin of Kerala Mathematics Association (BKMA)</strong> is the official academic publication of the Kerala Mathematical Association (KMA). Established with the vision of promoting excellence in mathematical sciences, BKMA serves as a trusted platform for researchers, academicians, educators, and students to publish and share high-quality mathematical research.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              Our journal is dedicated to fostering innovation, encouraging scholarly collaboration, and supporting the global exchange of mathematical knowledge across diverse disciplines.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          {/* Section: Editorial Board */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-8 leading-tight">Editorial Board</h2>
            
            {/* Core Editorial Team */}
            {coreEditors.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-bold text-zinc-800 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                  <span>Core Editorial Team</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {coreEditors.map((editor, idx) => (
                    <div key={editor.id || idx} className="p-5 border border-zinc-200 rounded-xl bg-zinc-50/50 hover:border-black transition-all flex flex-col justify-between">
                      <div>
                        {editor.role && (
                          <h4 className="text-sm font-black uppercase tracking-wider text-blue-600 mb-1">{editor.role}</h4>
                        )}
                        <p className="text-base text-zinc-900 font-bold mb-2">{editor.name}</p>
                        {editor.affiliation && (
                          <div className="text-sm text-zinc-600 whitespace-pre-line space-y-1 mb-3 leading-relaxed">
                            {editor.affiliation}
                          </div>
                        )}
                      </div>
                      {editor.email && (
                        <a href={`mailto:${editor.email}`} className="text-sm text-black font-semibold pt-2 border-t border-zinc-100 hover:text-blue-600 transition-colors truncate block">
                          {editor.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Editors */}
            {academicEditors.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-bold text-zinc-800 mb-6 pb-2 border-b border-zinc-100">Academic Editors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {academicEditors.map((editor, idx) => (
                    <div key={editor.id || idx} className="p-5 border border-zinc-200 rounded-xl bg-zinc-50/50 hover:border-black transition-all flex flex-col justify-between">
                      <div>
                        <p className="text-base text-zinc-900 font-bold mb-2">{editor.name}</p>
                        {editor.affiliation && (
                          <div className="text-sm text-zinc-600 whitespace-pre-line space-y-1 mb-3 leading-relaxed">
                            {editor.affiliation}
                          </div>
                        )}
                        {editor.areas && (
                          <div className="mb-3 pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Areas of Interest</span>
                            <p className="text-xs text-zinc-700 leading-relaxed font-medium">{editor.areas}</p>
                          </div>
                        )}
                      </div>
                      {editor.email && (
                        <a href={`mailto:${editor.email}`} className="text-sm text-black font-semibold pt-2 border-t border-zinc-100 hover:text-blue-600 transition-colors truncate block">
                          {editor.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Associate Editors */}
            {associateEditors.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-zinc-800 mb-6 pb-2 border-b border-zinc-100">Associate Editors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {associateEditors.map((editor, idx) => (
                    <div key={editor.id || idx} className="p-5 border border-zinc-200 rounded-xl bg-zinc-50/50 hover:border-black transition-all flex flex-col justify-between">
                      <div>
                        <p className="text-base text-zinc-900 font-bold mb-2">{editor.name}</p>
                        {editor.affiliation && (
                          <div className="text-sm text-zinc-600 space-y-1 mb-2 leading-relaxed whitespace-pre-line">
                            {editor.affiliation}
                          </div>
                        )}
                        {editor.email && (
                          <a href={`mailto:${editor.email}`} className="text-sm text-black font-semibold mb-3 truncate block hover:text-blue-600 transition-colors">
                            {editor.email}
                          </a>
                        )}
                      </div>
                      {editor.areas && (
                        <div className="pt-2.5 border-t border-zinc-200 mt-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Areas of Interest</p>
                          <p className="text-sm text-zinc-700 leading-relaxed font-medium">{editor.areas}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Categories */}
            {Object.keys(customCategories).length > 0 && (
              <div className="space-y-10 mb-12">
                {Object.entries(customCategories).map(([catKey, catEditors]) => {
                  const title = catEditors[0]?.categoryTitle || (catKey.charAt(0).toUpperCase() + catKey.slice(1));
                  return (
                    <div key={catKey}>
                      <h3 className="text-xl font-bold text-zinc-800 mb-6 pb-2 border-b border-zinc-100">{title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {catEditors.map((editor, idx) => (
                          <div key={editor.id || idx} className="p-5 border border-zinc-200 rounded-xl bg-zinc-50/50 hover:border-black transition-all flex flex-col justify-between">
                            <div>
                              {editor.role && (
                                <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 mb-1">{editor.role}</h4>
                              )}
                              <p className="text-base text-zinc-900 font-bold mb-2">{editor.name}</p>
                              {editor.affiliation && (
                                <div className="text-sm text-zinc-600 space-y-1 mb-2 leading-relaxed whitespace-pre-line">
                                  {editor.affiliation}
                                </div>
                              )}
                              {editor.email && (
                                <a href={`mailto:${editor.email}`} className="text-sm text-black font-semibold mb-3 truncate block hover:text-blue-600 transition-colors">
                                  {editor.email}
                                </a>
                              )}
                            </div>
                            {editor.areas && (
                              <div className="pt-2.5 border-t border-zinc-200 mt-2">
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Areas of Interest</p>
                                <p className="text-sm text-zinc-700 leading-relaxed font-medium">{editor.areas}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Editorial Policy & Guidelines */}
            <div>
              <h3 className="text-xl font-bold text-zinc-800 mb-6 pb-2 border-b border-zinc-100">Editorial Policy &amp; Guidelines</h3>
              <div className="space-y-6 text-base text-zinc-700 leading-relaxed">
                <div>
                  <h4 className="text-base font-bold text-black mb-1.5">Editorial Policy</h4>
                  <p>{policy?.policyText || "The objective of the Bulletin is to publish original high quality and state of the art papers (in English language) in any area of Mathematical Sciences. Survey/Review articles are also welcome."}</p>
                </div>

                <div>
                  <h4 className="text-base font-bold text-black mb-1.5">Periodicity</h4>
                  <p>The journal will have one volume per year, with two issues published half-yearly. Also some special issues are brought out occasionally.</p>
                </div>

                <div>
                  <h4 className="text-base font-bold text-black mb-1.5">Submission of Papers</h4>
                  <p className="mb-3">Authors are encouraged to submit papers electronically - preferably in LaTeX to any of the Associate Editors in their area or to the Advisory Editor or to the Chief Editor or to any of the Academic Editors.</p>
                  <p className="mb-3">If electronic submission is not possible, authors may submit three copies of the manuscript to the Advisory Editor. Manuscript should not normally exceed 20 pages of A4 size paper in one-and-a-half line spacing with wide margins, printed on one side of the paper only.</p>
                  <p className="font-semibold text-zinc-900 mb-1 mt-4">The papers should be prepared in the following order:</p>
                  <p className="mb-3">Title, Author(s), Affiliation, Brief Abstract, AMS2000 Subject Classification, Keywords, Main Text, Acknowledgements and References. References should be listed alphabetically (on first author's surname) in the following format:</p>
                  <ul className="list-disc pl-6 space-y-1 mb-4 text-zinc-500 text-sm">
                    <li>L. Gillman and M. Jerison, Rings of Continuous Functions, Van Nostrand, Princeton, 1960.</li>
                    <li>L.A. Zadeh, Fuzzy Sets, Information and Control, 8 (1965) 338-358.</li>
                  </ul>
                  <p className="mb-3">Photo-ready copies of figures and tables should be inserted in the main text at the appropriate places. Sections within the paper should be decimally numbered.</p>
                  <p className="mb-3">One copy of the particular issue of the Bulletin containing the paper and soft copy of the paper will be supplied to the author(s) free of charge.</p>
                  <p className="italic font-semibold text-black mt-3">
                    Copyright of the published papers is vested with the Kerala Mathematical Association.
                  </p>
                </div>

                <div>
                  <h4 className="text-base font-bold text-black mb-1.5">Subscription Rates</h4>
                  <p className="whitespace-pre-line leading-relaxed">
                    Subscription rate per volume (two issues) including postage and handling charges:
                    {'\n'}- Annual Subscription: Rs. 1000/- each in India.
                    {'\n'}- Life members will receive 50% concession in the subscription charges.
                    {'\n\n'}Subscription charges may be sent through Demand Draft / Online Transfer in favour of Bulletin of Kerala Mathematics Association, payable at Kottayam - 686 001. All correspondence including subscription orders and exchange proposals should be sent to the Executive Editor.
                  </p>
                </div>
              </div>
            </div>

          </section>

          <hr className="border-zinc-200 mb-12" />

          {/* Section: Mission */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Our Mission</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed mb-6">
              Our mission is to promote the advancement of mathematics by providing a transparent, ethical, and peer-reviewed publication platform that encourages original research, critical thinking, and academic excellence.
            </p>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              We strive to create opportunities for researchers worldwide to contribute meaningful work that strengthens the mathematical community.
            </p>
          </section>

          <hr className="border-zinc-200 mb-12" />

          <section>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black mb-6 leading-tight">Our Vision</h2>
            <p className="text-zinc-700 text-lg sm:text-xl leading-relaxed">
              To become a globally recognized mathematical journal that inspires research, encourages innovation, and contributes to the advancement of mathematical sciences through quality publications and international collaboration.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default AboutUs;
