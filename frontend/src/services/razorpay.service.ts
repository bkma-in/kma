import api from './api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createSubscriptionOrder = async (type: 'annual' | 'lifetime') => {
  const response = await api.post('/subscriptions/create-order', { type });
  return response.data;
};

export const createArticleOrder = async (articleId: string) => {
  const response = await api.post('/subscriptions/create-article-order', { articleId });
  return response.data;
};

export const verifyRazorpayPayment = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const response = await api.post('/subscriptions/verify-payment', paymentData);
  return response.data;
};

export const getUserSubscriptions = async () => {
  const response = await api.get('/subscriptions/my-subscriptions');
  return response.data;
};

export interface RazorpayCheckoutOptions {
  orderId: string;
  keyId: string;
  amount: number;
  name?: string;
  description?: string;
  userEmail?: string;
  userName?: string;
  userContact?: string;
  onSuccess: (paymentResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => Promise<void> | void;
  onDismiss?: () => void;
}

export const openRazorpayModal = async (options: RazorpayCheckoutOptions) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  const razorpayOptions = {
    key: options.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TGqtRzvui2FOPI',
    amount: options.amount * 100, // paise
    currency: 'INR',
    name: options.name || 'Bulletin of BKMA',
    description: options.description || 'Access Subscription / Article Purchase',
    order_id: options.orderId,
    prefill: {
      name: options.userName || '',
      email: options.userEmail || '',
      contact: options.userContact || '',
    },
    theme: {
      color: '#000000',
    },
    handler: async (response: any) => {
      await options.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      },
    },
  };

  const rzp = new window.Razorpay(razorpayOptions);
  rzp.open();
};
