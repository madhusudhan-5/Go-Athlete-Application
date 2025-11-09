# Razorpay Payment Integration Guide

## Overview
Razorpay payment integration has been implemented for handling payments for bookings and ecommerce orders.

## Implementation

### 1. Payment Service (`payments/services.py`)
- `RazorpayService`: Main service class for Razorpay operations
- `create_order()`: Create Razorpay order
- `verify_payment()`: Verify payment signature
- `capture_payment()`: Capture authorized payments
- `refund_payment()`: Create refunds
- `get_payment_details()`: Fetch payment details

### 2. Helper Functions
- `create_booking_payment()`: Create order for booking
- `create_order_payment()`: Create order for ecommerce order
- `verify_and_update_booking_payment()`: Verify and update booking
- `verify_and_update_order_payment()`: Verify and update order

### 3. API Endpoints

#### Create Payment Order
```
POST /api/v1/payments/create-order/
Body: {
    "type": "booking" | "order",
    "id": "uuid",
    "amount": 1000.00
}
Response: {
    "order_id": "order_xxx",
    "amount": 1000.00,
    "currency": "INR",
    "key": "rzp_test_xxx"
}
```

#### Verify Payment
```
POST /api/v1/payments/verify/
Body: {
    "type": "booking" | "order",
    "id": "uuid",
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature"
}
Response: {
    "status": "success",
    "message": "Payment verified"
}
```

#### Webhook Handler
```
POST /api/v1/payments/webhook/
Headers: {
    "X-Razorpay-Signature": "signature"
}
Body: Razorpay webhook payload
```

## Configuration

### Environment Variables
Add to `.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

### Settings
Already configured in `settings.py`:
```python
RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET', default='')
```

## Frontend Integration

### 1. Install Razorpay SDK
```bash
npm install razorpay
```

### 2. Create Payment Order
```javascript
const response = await fetch('/api/v1/payments/create-order/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'booking',
    id: bookingId,
    amount: totalAmount
  })
});

const { order_id, key } = await response.json();
```

### 3. Initialize Razorpay Checkout
```javascript
const options = {
  key: key,
  amount: amount * 100, // in paise
  currency: 'INR',
  name: 'Go-Athlete',
  description: 'Booking Payment',
  order_id: order_id,
  handler: async function(response) {
    // Verify payment
    await verifyPayment(response);
  },
  prefill: {
    email: userEmail,
    contact: userPhone
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### 4. Verify Payment
```javascript
async function verifyPayment(razorpayResponse) {
  const response = await fetch('/api/v1/payments/verify/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'booking',
      id: bookingId,
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    })
  });
  
  const result = await response.json();
  if (result.status === 'success') {
    // Payment successful
  }
}
```

## Webhook Setup

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/v1/payments/webhook/`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
4. Copy webhook secret and add to settings (if needed)

## Testing

### Test Mode
Use Razorpay test keys:
- Key ID: `rzp_test_xxxxx`
- Key Secret: `test_secret_xxxxx`

### Test Cards
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

## Error Handling

The service includes comprehensive error handling:
- Payment creation failures
- Signature verification failures
- Refund failures
- Webhook processing errors

All errors are logged and appropriate responses are returned.

## Security Notes

1. **Never expose secret key** in frontend code
2. **Always verify signatures** on server side
3. **Use HTTPS** in production
4. **Validate webhook signatures** before processing
5. **Store payment IDs** for reconciliation

## Next Steps

1. Add webhook signature verification
2. Implement retry logic for failed payments
3. Add payment status tracking
4. Implement automatic refunds for cancellations
5. Add payment analytics

