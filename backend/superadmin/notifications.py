import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def get_notification_service():
    mode = os.environ.get('EMAIL_MODE', 'LOG')
    if mode == 'RESEND':
        return ResendNotificationService()
    return LogNotificationService()

class LogNotificationService:
    def send_email(self, to_email, subject, html_content):
        logger.info(f"[EMAIL LOG] To: {to_email}")
        logger.info(f"[EMAIL LOG] Subject: {subject}")
        logger.info(f"[EMAIL LOG] Content: {html_content[:200]}...")
        return {'success': True, 'mode': 'LOG'}

class ResendNotificationService:
    def __init__(self):
        try:
            import resend
            resend.api_key = os.environ.get('RESEND_API_KEY', '')
            self.resend = resend
            self.from_email = os.environ.get('RESEND_FROM', 'notifications@sportsplatform.com')
        except ImportError:
            logger.warning("Resend package not installed, falling back to LOG mode")
            self.resend = None
    
    def send_email(self, to_email, subject, html_content):
        if not self.resend or not os.environ.get('RESEND_API_KEY'):
            logger.warning("Resend not configured, using LOG mode")
            return LogNotificationService().send_email(to_email, subject, html_content)
        
        try:
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            response = self.resend.Emails.send(params)
            logger.info(f"[EMAIL SENT] To: {to_email}, Subject: {subject}")
            return {'success': True, 'mode': 'RESEND', 'id': response.get('id')}
        except Exception as e:
            logger.error(f"[EMAIL ERROR] {str(e)}")
            return {'success': False, 'error': str(e)}

class EmailTemplates:
    @staticmethod
    def booking_confirmation(booking_data):
        return f"""
        <html>
        <body style="font-family: 'Inter', sans-serif; background-color: #F5F6F7; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px;">
                <h1 style="color: #061A2C; margin-bottom: 24px;">Booking Confirmed!</h1>
                <p style="color: #6B7280;">Your booking has been confirmed. Here are the details:</p>
                <div style="background: #F5F6F7; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p><strong>Booking ID:</strong> #{booking_data.get('id')}</p>
                    <p><strong>Court:</strong> {booking_data.get('court_name')}</p>
                    <p><strong>Date:</strong> {booking_data.get('booking_date')}</p>
                    <p><strong>Time:</strong> {booking_data.get('start_time')} - {booking_data.get('end_time')}</p>
                    <p style="color: #D96A23; font-size: 24px; font-weight: bold;">Amount: ₹{booking_data.get('amount')}</p>
                </div>
                <p style="color: #6B7280; font-size: 14px;">Thank you for booking with Sports Platform!</p>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    def vendor_approved(vendor_name):
        return f"""
        <html>
        <body style="font-family: 'Inter', sans-serif; background-color: #F5F6F7; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px;">
                <h1 style="color: #2E7D32; margin-bottom: 24px;">🎉 Congratulations!</h1>
                <p style="color: #061A2C; font-size: 18px;">Hi {vendor_name},</p>
                <p style="color: #6B7280;">Your vendor account has been approved! You can now start accepting bookings and managing your business on Sports Platform.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background: #D96A23; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
                </div>
                <p style="color: #6B7280; font-size: 14px;">Welcome aboard!</p>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    def payout_processed(payout_data):
        return f"""
        <html>
        <body style="font-family: 'Inter', sans-serif; background-color: #F5F6F7; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px;">
                <h1 style="color: #061A2C; margin-bottom: 24px;">💰 Payout Processed</h1>
                <p style="color: #6B7280;">Your payout has been successfully processed!</p>
                <div style="background: #F5F6F7; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p><strong>Payout ID:</strong> #{payout_data.get('id')}</p>
                    <p><strong>Gross Amount:</strong> ₹{payout_data.get('gross_amount')}</p>
                    <p><strong>Commission:</strong> -₹{payout_data.get('commission')}</p>
                    <p style="color: #2E7D32; font-size: 24px; font-weight: bold;">Net Amount: ₹{payout_data.get('net_amount')}</p>
                </div>
                <p style="color: #6B7280; font-size: 14px;">The amount will be credited to your registered bank account within 2-3 business days.</p>
            </div>
        </body>
        </html>
        """

def send_booking_confirmation_email(booking):
    service = get_notification_service()
    booking_data = {
        'id': booking.id,
        'court_name': booking.court.name if hasattr(booking, 'court') else 'N/A',
        'booking_date': str(booking.booking_date),
        'start_time': str(booking.start_time),
        'end_time': str(booking.end_time),
        'amount': booking.amount,
    }
    html = EmailTemplates.booking_confirmation(booking_data)
    customer_email = booking.customer.email if hasattr(booking, 'customer') and booking.customer.email else None
    if customer_email:
        return service.send_email(customer_email, f"Booking Confirmed - #{booking.id}", html)
    return {'success': False, 'error': 'No customer email'}

def send_vendor_approval_email(vendor):
    service = get_notification_service()
    html = EmailTemplates.vendor_approved(vendor.business_name or vendor.user.first_name)
    return service.send_email(vendor.user.email, "Your Vendor Account is Approved!", html)

def send_payout_processed_email(payout):
    service = get_notification_service()
    payout_data = {
        'id': payout.id,
        'gross_amount': payout.gross_amount,
        'commission': payout.commission,
        'net_amount': payout.net_amount,
    }
    html = EmailTemplates.payout_processed(payout_data)
    return service.send_email(payout.vendor.user.email, f"Payout Processed - ₹{payout.net_amount}", html)
