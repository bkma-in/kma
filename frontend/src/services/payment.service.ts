import api from './api';

export interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId?: string;
  qrCodeUrl?: string | null;
}

export interface LifeMemberOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  maskedEmail?: string;
  uniqueId?: string;
}

export interface PaymentAttemptItem {
  id: string;
  receiptNo?: string;
  attemptId: string;
  paymentId: string;
  plan: 'annual' | 'lifetime';
  article: string;
  amount: string;
  amountRaw: number;
  currency: string;
  date: string;
  paymentDate: string;
  transactionRef: string;
  submittedAt: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  rawStatus: string;
  paymentMethod: string;
  proofStorageKey?: string;
  proofFileName?: string;
  proofUrl?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedByName?: string;
  receiptAvailable: boolean;
}

export interface AdminPendingSubmission {
  id: string;
  attemptId: string;
  userId: string;
  userName: string;
  userEmail: string;
  membershipType: 'annual' | 'lifetime';
  expectedAmount: number;
  transactionRef: string;
  paymentDate: string;
  submissionDate: string;
  submittedAt: string;
  proofStorageKey: string;
  proofFileName: string;
  proofUrl: string | null;
  remarks?: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
}

/**
 * Fetch official BKMA Bank Details for Manual Payment
 */
export const getBankDetails = async (): Promise<BankDetails> => {
  try {
    const res = await api.get('/subscriptions/bank-details');
    return res.data.bankDetails;
  } catch (error: any) {
    // Fallback default BKMA bank details if offline
    return {
      accountName: 'M.S.SAMUEL',
      bankName: 'Bank of Baroda',
      accountNumber: '92660100000105',
      ifsc: 'BARB0DBKOTT',
      branch: 'Good Shepherd Road Branch, Kottayam - 686001',
      upiId: ''
    };
  }
};

/**
 * Request 6-digit OTP for KMA Life Member 50% Concession
 */
export const requestLifeMemberOtp = async (uniqueId: string): Promise<LifeMemberOtpResponse> => {
  const res = await api.post('/subscriptions/request-life-member-otp', { uniqueId });
  return res.data;
};

/**
 * Submit Payment Proof receipt file (JPG, PNG, PDF max 5MB)
 */
export const submitPaymentProof = async (formData: FormData) => {
  const res = await api.post('/subscriptions/submit-proof', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

/**
 * Fetch authenticated user's payment submission history
 */
export const getPaymentHistory = async (): Promise<PaymentAttemptItem[]> => {
  const res = await api.get('/subscriptions/payment-history');
  return res.data.attempts || [];
};

/**
 * Fetch authenticated user's subscriptions
 */
export const getMySubscriptions = async () => {
  const res = await api.get('/subscriptions/my-subscriptions');
  return res.data;
};

/**
 * Fetch presigned URL for payment proof file
 */
export const getPaymentProofUrl = async (proofKey: string): Promise<string> => {
  const res = await api.get('/subscriptions/proof-url', {
    params: { proofKey }
  });
  return res.data.signedUrl;
};

/**
 * Admin API: Fetch all pending & historical payment submissions
 */
export const getAdminPendingPayments = async (): Promise<AdminPendingSubmission[]> => {
  const res = await api.get('/subscriptions/admin/pending');
  return res.data.submissions || [];
};

/**
 * Admin API: Approve Payment & Activate Subscription
 */
export const approvePayment = async (paymentId: string) => {
  const res = await api.post(`/subscriptions/admin/approve/${paymentId}`);
  return res.data;
};

/**
 * Admin API: Reject payment submission with mandatory reason
 */
export const rejectPayment = async (paymentId: string, rejectionReason: string): Promise<{ success: boolean; error?: string }> => {
  const res = await api.post(`/subscriptions/admin/reject/${paymentId}`, { rejectionReason });
  return res.data;
};

/**
 * Admin API: Upload official Bank QR Code image
 */
export const uploadAdminQrCode = async (file: File): Promise<{ success: boolean; qrCodeUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/subscriptions/admin/upload-qr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
