import { apiService } from './api.ts';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface PaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  async createOrder(amount: number, receipt: string): Promise<RazorpayOrder> {
    try {
      const { data } = await apiService.post('/payments/razorpay/create-order', {
        amount: Math.round(amount * 100), // Razorpay expects amount in smallest currency unit (paise)
        receipt,
        currency: 'INR'
      });
      return data;
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      throw new Error('Payment initialization failed');
    }
  }

  async verifyPayment(paymentResult: PaymentResult): Promise<boolean> {
    try {
      const { data } = await apiService.post('/payments/razorpay/verify', paymentResult);
      return data.valid;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw new Error('Payment verification failed');
    }
  }

  async processPaymentAndSplit(params: {
    bookingId: string;
    amount: number;
    commission: number;
    vendorId: string;
    paymentResult: PaymentResult;
  }): Promise<{ success: boolean; transactionId: string }> {
    try {
      const { data } = await apiService.post('/payments/razorpay/process-split', {
        ...params,
        vendorAmount: params.amount - params.commission,
        platformAmount: params.commission
      });
      return data;
    } catch (error) {
      console.error('Payment split processing failed:', error);
      throw new Error('Failed to process payment split');
    }
  }
}

export const razorpayService = new RazorpayService();