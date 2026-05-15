import React from 'react';
import { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Download, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';

type PaymentStatus = 'Paid' | 'Pending' | 'Failed';

interface Payment {
  id: string;
  amount: string;
  date: string;
  status: PaymentStatus;
  article: string;
}

const ReaderPayments = () => {
  const { showToast } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');

  const [payments] = useState<Payment[]>([
    { id: 'PAY-8821', amount: '₹499', date: '2024-03-15', status: 'Paid', article: 'On the Homotopy Type of Certain Spaces' },
    { id: 'PAY-7712', amount: '₹499', date: '2024-03-10', status: 'Paid', article: 'Prime Distribution in Arithmetic Progressions' },
    { id: 'PAY-6654', amount: '₹499', date: '2024-03-05', status: 'Failed', article: 'Fluid Dynamics in Porous Media' },
    { id: 'PAY-5543', amount: '₹499', date: '2024-02-28', status: 'Paid', article: 'Neural Networks in Modern Medicine' },
    { id: 'PAY-4432', amount: '₹499', date: '2024-02-20', status: 'Pending', article: 'Advanced Cryptography Protocols' },
  ]);

  const handleDownloadReceipt = (id: string) => {
    showToast(`Receipt for ${id} downloaded successfully`, 'success');
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.article.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight font-['Outfit']">Payment History</h1>
          <p className="text-zinc-500 mt-1">Manage your transactions and download receipts.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black w-64 focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black focus:ring-1 focus:ring-black outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table Container */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Article</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                        <CreditCard size={16} />
                      </div>
                      <span className="text-xs font-bold text-black">{payment.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-zinc-500 font-medium line-clamp-1 max-w-[200px]">{payment.article}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-black">{payment.amount}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">{payment.date}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      payment.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      payment.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-rose-50 text-rose-600 border-rose-100'
                    )}>
                      {payment.status === 'Paid' ? <CheckCircle2 size={10} /> : 
                       payment.status === 'Pending' ? <Clock size={10} /> : 
                       <XCircle size={10} />}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleDownloadReceipt(payment.id)}
                      className="p-2 bg-zinc-50 hover:bg-black text-zinc-400 hover:text-white rounded-lg transition-all"
                      disabled={payment.status !== 'Paid'}
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <FileText size={48} />
                      <p className="text-xs font-bold uppercase tracking-widest text-black">No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReaderPayments;
