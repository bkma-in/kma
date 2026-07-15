import { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Calendar, 
  Mail, 
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Reader {
  id: string;
  name: string;
  email: string;
  regDate?: any;
  isLifeMember: boolean;
}

const AdminReadersList = () => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadersAndSubscriptions = async () => {
      try {
        // 1. Fetch users with role 'reader'
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'reader'));
        const usersSnapshot = await getDocs(usersQuery);
        
        // 2. Fetch active subscriptions
        const subsQuery = query(collection(db, 'subscriptions'), where('status', '==', 'active'));
        const subsSnapshot = await getDocs(subsQuery);
        
        const activeSubscribes = new Map<string, any>();
        subsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          activeSubscribes.set(data.userId, data);
        });

        // 3. Map and filter only readers who have active subscriptions
        const mappedReaders: Reader[] = [];
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          const subData = activeSubscribes.get(doc.id);
          
          const isSubscribed = !!subData || userData.isSubscribed === true || userData.subscribed === true;
          
          if (isSubscribed) {
            mappedReaders.push({
              id: doc.id,
              name: userData.name || 'Anonymous Reader',
              email: userData.email || '',
              regDate: userData.createdAt || null,
              isLifeMember: userData.lifeMember === true || userData.isLifeMember === true || subData?.type === 'lifetime' || subData?.type === 'life'
            });
          }
        });

        setReaders(mappedReaders);
      } catch (error) {
        console.error('Failed to load readers/subscriptions:', error);
        showToast('Failed to load readers list.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReadersAndSubscriptions();
  }, []);

  const filteredReaders = readers.filter(r => {
    return r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           r.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (regDate: any) => {
    if (!regDate) return 'N/A';
    const dateObj = regDate.seconds ? new Date(regDate.seconds * 1000) : new Date(regDate);
    return dateObj.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
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
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Archive Subscribers</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Subscribed Readers</h1>
          <p className="text-zinc-500 mt-2 text-sm">Monitor and manage the readers who have active subscriptions to the BKMA system.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium w-64 focus:ring-2 focus:ring-black outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      {filteredReaders.length > 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Life Member</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredReaders.map((reader) => (
                  <tr key={reader.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900">{reader.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-600 font-sans">{reader.email}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {reader.isLifeMember ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold tracking-wider uppercase font-sans">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-50 text-zinc-400 border border-zinc-200 text-[10px] font-bold tracking-wider uppercase font-sans">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                        <Calendar size={13} className="text-zinc-400" />
                        {formatDate(reader.regDate)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">No Subscribed Readers Found</h3>
            <p className="text-zinc-500 text-sm">No subscriber profiles match your search criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReadersList;
