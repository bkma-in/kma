import { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Download, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Printer,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { ReceiptTemplate } from '../../components/ReceiptTemplate';

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
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');

  const [payments] = useState<Payment[]>([
    { id: 'PAY-8821', amount: '₹499', date: '2024-03-15', status: 'Paid', article: 'On the Homotopy Type of Certain Spaces' },
    { id: 'PAY-7712', amount: '₹499', date: '2024-03-10', status: 'Paid', article: 'Prime Distribution in Arithmetic Progressions' },
    { id: 'PAY-6654', amount: '₹499', date: '2024-03-05', status: 'Failed', article: 'Fluid Dynamics in Porous Media' },
    { id: 'PAY-5543', amount: '₹499', date: '2024-02-28', status: 'Paid', article: 'Neural Networks in Modern Medicine' },
    { id: 'PAY-4432', amount: '₹499', date: '2024-02-20', status: 'Pending', article: 'Advanced Cryptography Protocols' },
  ]);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  // Helper to format date YYYY-MM-DD to DD/MM/YYYY
  const formatDateString = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  // Helper to convert number to Indian words
  const numberToWords = (num: number): string => {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const helper = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
      return '';
    };
    
    if (num === 0) return 'Zero';
    return `${helper(num)} Rupees Only`;
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.article.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-700 no-print">
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
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'All')}
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
                      onClick={() => handleViewReceipt(payment)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        payment.status === 'Paid' 
                          ? "bg-zinc-50 hover:bg-black text-zinc-400 hover:text-white" 
                          : "bg-zinc-100 text-zinc-300 opacity-50 cursor-not-allowed"
                      )}
                      disabled={payment.status !== 'Paid'}
                      aria-disabled={payment.status !== 'Paid'}
                      title="View Receipt"
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
    </div> {/* End of no-print page wrapper */}

      {/* Receipt Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm receipt-modal-backdrop animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-zinc-200 receipt-modal-card">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 no-print">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider">Receipt Preview</h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Transaction Ref: {selectedPayment.id}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Scroll Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-100/50 flex justify-center">
              <ReceiptTemplate 
                receiptNumber={selectedPayment.id.replace('PAY-', '')}
                date={formatDateString(selectedPayment.date)}
                memberName={currentUser?.name || localStorage.getItem('userName') || ''}
                amount={selectedPayment.amount.replace('₹', '')}
                amountInWords={numberToWords(parseInt(selectedPayment.amount.replace('₹', '')))}
                membershipType="Article Subscription"
                journalYear={selectedPayment.date.substring(0, 4)}
                paymentMethod="Online Payment (UPI/Card)"
                transactionId={`TXN-${selectedPayment.id}-${selectedPayment.date.replace(/-/g, '')}`}
                status="PAID"
              />
            </div>

            {/* Modal Footer / Actions */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3 receipt-modal-actions no-print">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-black transition-all bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-zinc-800 transition-all rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Printer size={14} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReaderPayments;
