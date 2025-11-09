"""
Razorpay Payment Integration Service
"""
import razorpay
from django.conf import settings
from django.utils import timezone
from bookings.models import Booking, Order
from core.models import VendorProfile
import json


class RazorpayService:
    """Service for handling Razorpay payments"""
    
    def __init__(self):
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
    
    def create_order(self, amount, currency='INR', receipt=None, notes=None):
        """
        Create a Razorpay order
        Args:
            amount: Amount in paise (e.g., 10000 for ₹100)
            currency: Currency code (default: INR)
            receipt: Receipt ID
            notes: Additional notes
        Returns:
            Razorpay order object
        """
        data = {
            'amount': int(amount * 100),  # Convert to paise
            'currency': currency,
        }
        
        if receipt:
            data['receipt'] = receipt
        
        if notes:
            data['notes'] = notes
        
        try:
            order = self.client.order.create(data=data)
            return order
        except Exception as e:
            raise Exception(f"Failed to create Razorpay order: {str(e)}")
    
    def verify_payment(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        """
        Verify Razorpay payment signature
        Args:
            razorpay_order_id: Order ID from Razorpay
            razorpay_payment_id: Payment ID from Razorpay
            razorpay_signature: Signature from Razorpay
        Returns:
            bool: True if signature is valid
        """
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except razorpay.errors.SignatureVerificationError:
            return False
        except Exception as e:
            raise Exception(f"Payment verification error: {str(e)}")
    
    def capture_payment(self, payment_id, amount):
        """
        Capture a payment (for authorized payments)
        Args:
            payment_id: Razorpay payment ID
            amount: Amount to capture in paise
        Returns:
            Captured payment object
        """
        try:
            payment = self.client.payment.capture(payment_id, int(amount * 100))
            return payment
        except Exception as e:
            raise Exception(f"Failed to capture payment: {str(e)}")
    
    def refund_payment(self, payment_id, amount=None, notes=None):
        """
        Create a refund
        Args:
            payment_id: Razorpay payment ID
            amount: Amount to refund in rupees (if None, full refund)
            notes: Refund notes
        Returns:
            Refund object
        """
        data = {}
        if amount:
            data['amount'] = int(amount * 100)  # Convert to paise
        
        if notes:
            data['notes'] = notes
        
        try:
            refund = self.client.payment.refund(payment_id, data=data if data else None)
            return refund
        except Exception as e:
            raise Exception(f"Failed to create refund: {str(e)}")
    
    def get_payment_details(self, payment_id):
        """
        Get payment details from Razorpay
        Args:
            payment_id: Razorpay payment ID
        Returns:
            Payment object
        """
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            raise Exception(f"Failed to fetch payment: {str(e)}")


def create_booking_payment(booking):
    """
    Create Razorpay order for a booking
    Args:
        booking: Booking instance
    Returns:
        Razorpay order object
    """
    service = RazorpayService()
    receipt = f"BOOKING_{booking.id}"
    notes = {
        'booking_id': str(booking.id),
        'customer_email': booking.customer_email,
        'court_name': booking.court.name
    }
    
    order = service.create_order(
        amount=float(booking.total_amount),
        receipt=receipt,
        notes=notes
    )
    
    return order


def create_order_payment(order):
    """
    Create Razorpay order for an ecommerce order
    Args:
        order: Order instance
    Returns:
        Razorpay order object
    """
    service = RazorpayService()
    receipt = order.order_number
    notes = {
        'order_id': str(order.id),
        'order_number': order.order_number,
        'customer_email': order.customer_user.email
    }
    
    razorpay_order = service.create_order(
        amount=float(order.total_amount),
        receipt=receipt,
        notes=notes
    )
    
    return razorpay_order


def verify_and_update_booking_payment(booking, razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Verify payment and update booking status
    Args:
        booking: Booking instance
        razorpay_order_id: Razorpay order ID
        razorpay_payment_id: Razorpay payment ID
        razorpay_signature: Payment signature
    Returns:
        bool: True if payment verified and updated
    """
    service = RazorpayService()
    
    if not service.verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        return False
    
    # Update booking
    booking.payment_id = razorpay_payment_id
    booking.payment_status = 'PAID'
    booking.save(update_fields=['payment_id', 'payment_status'])
    
    return True


def verify_and_update_order_payment(order, razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Verify payment and update order status
    Args:
        order: Order instance
        razorpay_order_id: Razorpay order ID
        razorpay_payment_id: Razorpay payment ID
        razorpay_signature: Payment signature
    Returns:
        bool: True if payment verified and updated
    """
    service = RazorpayService()
    
    if not service.verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        return False
    
    # Update order
    order.payment_id = razorpay_payment_id
    order.payment_status = 'PAID'
    order.order_status = 'CONFIRMED'
    order.save(update_fields=['payment_id', 'payment_status', 'order_status'])
    
    return True

