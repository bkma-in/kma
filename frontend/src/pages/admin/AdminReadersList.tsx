import { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Calendar, 
  Loader2
} from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';
import { getReaders } from '../../services/user.service';
import { SkeletonTable } from '../../components/skeletons/SkeletonTable';

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
    const fetchReaders = async () => {
      try {
        const response = await getReaders();
        if (response.success) {
          const mapped = response.readers.map((r: any) => ({
            ...r,
            isSubscribed: false // For now set all readers status to notsubscribed
          })).filter((r: any) => r.isSubscribed);
          setReaders(mapped);
        }
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

  const formatDate = (regDate: any) => {
    if (!regDate) return 'N/A';
    const dateObj = new Date(regDate);
    return dateObj.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 animate-fade-in">
        <div className="flex justify-between items-end gap-6 mb-6">
          <div className="space-y-2">
            <div className="h-8 skeleton-box rounded w-48" />
            <div className="h-4 skeleton-box rounded w-64" />
          </div>
          <div className="h-10 skeleton-box rounded-xl w-64" />
        </div>
        <SkeletonTable rowsCount={4} colsCount={4} />
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
