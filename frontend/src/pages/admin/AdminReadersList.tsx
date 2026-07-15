import { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Calendar, 
  Mail, 
  Loader2,
  X,
  User,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Reader {
  id: string;
  name: string;
  email: string;
  regDate?: any;
  status?: string;
}

const AdminReadersList = () => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReaders = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'reader'));
        const querySnapshot = await getDocs(q);
        const mappedReaders = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Anonymous Reader',
            email: data.email || '',
            regDate: data.createdAt || null,
            status: data.status || 'Active'
          };
        });
        setReaders(mappedReaders);
      } catch (error) {
        console.error('Failed to load readers:', error);
        showToast('Failed to load readers list.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReaders();
  }, []);

  const filteredReaders = readers.filter(r => {
    return r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           r.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openDetails = (reader: Reader) => {
    setSelectedReader(reader);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
              <Users size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Archive Audience</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Registered Readers</h1>
          <p className="text-zinc-500 mt-2 text-sm">Monitor and manage the active readers and subscribers of the BKMA Archive.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search readers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-64 focus:ring-2 focus:ring-black outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Cards Queue Section */}
      {filteredReaders.length > 0 ? (
        <div className="space-y-4">
          {filteredReaders.map((reader) => (
            <div 
              key={reader.id} 
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 shadow-sm">
                    <User size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 leading-tight">{reader.name}</h2>
                    <p className="text-xs text-zinc-500 font-medium font-sans mt-0.5">{reader.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 leading-none font-sans">
                    {reader.status || 'Active'}
                  </span>
                  <button 
                    onClick={() => openDetails(reader)}
                    className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all uppercase cursor-pointer shadow-sm font-sans"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">No Readers Found</h3>
            <p className="text-zinc-500 text-sm">No reader accounts match your criteria.</p>
          </div>
        </div>
      )}

      {/* Reader Details Modal */}
      {isModalOpen && selectedReader && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-zinc-100">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-black tracking-tight text-base">Reader Information</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Account Details</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Full Name</span>
                  <p className="text-sm font-bold text-zinc-800">{selectedReader.name}</p>
                </div>

                <div>
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Email Address</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                    <Mail size={14} className="text-zinc-400" />
                    {selectedReader.email}
                  </div>
                </div>

                {selectedReader.regDate && (
                  <div>
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Registration Date</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                      <Calendar size={14} className="text-zinc-400" />
                      {new Date(selectedReader.regDate.seconds ? selectedReader.regDate.seconds * 1000 : selectedReader.regDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReadersList;
