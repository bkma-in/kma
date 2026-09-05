import { useState, useEffect } from 'react';
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
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { ReceiptTemplate, formatReceiptNo } from '../../components/ReceiptTemplate';
import { getPaymentHistory } from '../../services/payment.service';
import type { PaymentAttemptItem } from '../../services/payment.service';
import { CustomSelect } from '../../components/common/CustomSelect';
import { ReaderPaymentsSkeleton } from '../../components/skeletons/PageSkeletons';

type PaymentFilterStatus = 'APPROVED' | 'PENDING_VERIFICATION' | 'REJECTED' | 'All';

const ReaderPayments = () => {
  const { showToast } = useNotification();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentFilterStatus>('All');
  const [payments, setPayments] = useState<PaymentAttemptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const attempts = await getPaymentHistory();
      setPayments(attempts);
    } catch (err: any) {
      console.error('Failed to load payment history:', err);
      showToast('Failed to load payment history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [selectedPayment, setSelectedPayment] = useState<PaymentAttemptItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewReceipt = (payment: PaymentAttemptItem) => {
    if (payment.status !== 'APPROVED' && !payment.receiptAvailable) {
      showToast('Official receipts are issued exclusively for successful, verified payments.', 'info');
      return;
    }
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  // Helper to format date YYYY-MM-DD to DD/MM/YYYY
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
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
    if (num === 1) return 'One Rupee Only';
    return `${helper(num)} Rupees Only`;
  };

  const filteredPayments = payments.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = p.id.toLowerCase().includes(searchLower) ||
                          p.article.toLowerCase().includes(searchLower) ||
                          (p.transactionRef && p.transactionRef.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && payments.length === 0) {
    return <ReaderPaymentsSkeleton />;
  }

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-700 no-print">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-black tracking-tight font-['Outfit']">Payment History</h1>
            <p className="text-zinc-500 mt-1">Audit log of all your manual bank transfer submissions and official receipts.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search UTR / ref number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-black w-64 focus:ring-1 focus:ring-black outline-none transition-all shadow-sm"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              icon={<Filter size={15} />}
              align="right"
              buttonClassName="py-2.5 text-xs w-full sm:w-auto min-w-[160px]"
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'APPROVED', label: 'APPROVED / Active' },
                { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>
        </div>

        {/* Payments Table Container */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction UTR / Ref</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Subscription Plan</th>
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
                        <div>
                          <p className="text-xs font-mono font-bold text-black">{payment.transactionRef}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">Receipt No: {formatReceiptNo(payment.id)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-zinc-700 font-semibold">{payment.article}</p>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">
                        Method: Manual Bank Transfer
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-black">{payment.amount}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">{payment.paymentDate || payment.date}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          payment.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          payment.status === 'PENDING_VERIFICATION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        )}>
                          {payment.status === 'APPROVED' ? <CheckCircle2 size={10} /> :
                           payment.status === 'PENDING_VERIFICATION' ? <Clock size={10} /> :
                           <XCircle size={10} />}
                          {payment.status === 'APPROVED' ? 'APPROVED' :
                           payment.status === 'PENDING_VERIFICATION' ? 'PENDING VERIFICATION' : 'REJECTED'}
                        </span>
                        {payment.status === 'REJECTED' && payment.rejectionReason && (
                          <p className="text-[10px] text-rose-500 font-medium mt-1 flex items-center gap-1 max-w-[220px]" title={payment.rejectionReason}>
                            <AlertCircle size={10} className="shrink-0" /> Reason: {payment.rejectionReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleViewReceipt(payment)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          (payment.status === 'APPROVED' || payment.receiptAvailable)
                            ? "bg-zinc-50 hover:bg-black text-zinc-400 hover:text-white cursor-pointer"
                            : "bg-zinc-100 text-zinc-300 opacity-50 cursor-not-allowed"
                        )}
                        disabled={payment.status !== 'APPROVED' && !payment.receiptAvailable}
                        aria-disabled={payment.status !== 'APPROVED' && !payment.receiptAvailable}
                        title={payment.status === 'APPROVED' || payment.receiptAvailable ? "View Official Receipt" : "Receipt available only for approved payments"}
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-400">
                        <Loader2 size={28} className="animate-spin text-black" />
                        <p className="text-xs font-bold uppercase tracking-widest">Loading transaction audit history...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <FileText size={48} className="text-zinc-400" />
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">No payment submissions recorded</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm receipt-modal-backdrop animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-zinc-200 receipt-modal-card">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 no-print">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider">Official Payment Receipt Preview</h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                  Transaction UTR / Ref: {selectedPayment.transactionRef}
                </p>
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
                receiptNumber={formatReceiptNo(selectedPayment.id)}
                date={formatDateString(selectedPayment.paymentDate || selectedPayment.date)}
                memberName={currentUser?.name || localStorage.getItem('userName') || 'Member'}
                amount={(selectedPayment.amountRaw || selectedPayment.amount).toString().replace('₹', '')}
                amountInWords={numberToWords(parseInt((selectedPayment.amountRaw || selectedPayment.amount).toString().replace(/[^\d]/g, '')) || 1000)}
                membershipType={selectedPayment.plan === 'lifetime' ? 'Life Membership Pass' : 'Annual Pass Subscription'}
                journalYear={(selectedPayment.date || new Date().toISOString()).substring(0, 4)}
                paymentMethod="Manual Bank Transfer (UPI / NEFT / IMPS)"
                transactionId={selectedPayment.transactionRef}
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
