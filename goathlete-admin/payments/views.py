"""
Razorpay Payment Webhook Handler
"""
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import json
import hmac
import hashlib

from django.conf import settings
from .services import RazorpayService
from bookings.models import Booking, Order


@csrf_exempt
@require_POST
@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    """
    Handle Razorpay webhook events
    """
    try:
        webhook_secret = request.META.get('HTTP_X_RAZORPAY_SIGNATURE')
        webhook_body = request.body.decode('utf-8')
        
        # Verify webhook signature
        service = RazorpayService()
        # Note: Razorpay webhook signature verification needs to be implemented
        # based on Razorpay's webhook documentation
        
        event_data = json.loads(webhook_body)
        event_type = event_data.get('event')
        payload = event_data.get('payload', {})
        
        if event_type == 'payment.captured':
            payment_entity = payload.get('payment', {}).get('entity', {})
            payment_id = payment_entity.get('id')
            order_id = payment_entity.get('order_id')
            amount = payment_entity.get('amount', 0) / 100  # Convert from paise
            
            # Find booking or order by payment_id or order_id
            notes = payment_entity.get('notes', {})
            booking_id = notes.get('booking_id')
            order_number = notes.get('order_number')
            
            if booking_id:
                try:
                    booking = Booking.objects.get(id=booking_id)
                    booking.payment_id = payment_id
                    booking.payment_status = 'PAID'
                    booking.save(update_fields=['payment_id', 'payment_status'])
                except Booking.DoesNotExist:
                    pass
            
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number)
                    order.payment_id = payment_id
                    order.payment_status = 'PAID'
                    order.order_status = 'CONFIRMED'
                    order.save(update_fields=['payment_id', 'payment_status', 'order_status'])
                except Order.DoesNotExist:
                    pass
        
        elif event_type == 'payment.failed':
            payment_entity = payload.get('payment', {}).get('entity', {})
            payment_id = payment_entity.get('id')
            notes = payment_entity.get('notes', {})
            booking_id = notes.get('booking_id')
            order_number = notes.get('order_number')
            
            if booking_id:
                try:
                    booking = Booking.objects.get(id=booking_id)
                    booking.payment_status = 'FAILED'
                    booking.save(update_fields=['payment_status'])
                except Booking.DoesNotExist:
                    pass
            
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number)
                    order.payment_status = 'FAILED'
                    order.save(update_fields=['payment_status'])
                except Order.DoesNotExist:
                    pass
        
        elif event_type == 'refund.created':
            refund_entity = payload.get('refund', {}).get('entity', {})
            payment_id = refund_entity.get('payment_id')
            refund_amount = refund_entity.get('amount', 0) / 100
            
            # Update booking or order with refund info
            try:
                booking = Booking.objects.get(payment_id=payment_id)
                booking.refund_amount = refund_amount
                booking.refund_status = 'PROCESSED'
                booking.payment_status = 'REFUNDED'
                booking.save(update_fields=['refund_amount', 'refund_status', 'payment_status'])
            except Booking.DoesNotExist:
                try:
                    order = Order.objects.get(payment_id=payment_id)
                    order.refund_amount = refund_amount
                    order.refund_status = 'PROCESSED'
                    order.payment_status = 'REFUNDED'
                    order.save(update_fields=['refund_amount', 'refund_status', 'payment_status'])
                except Order.DoesNotExist:
                    pass
        
        return JsonResponse({'status': 'success'}, status=200)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_order(request):
    """
    Create Razorpay order for payment
    POST /api/v1/payments/create-order/
    Body: {
        "type": "booking" | "order",
        "id": "booking_id or order_id",
        "amount": 1000.00
    }
    """
    try:
        payment_type = request.data.get('type')
        entity_id = request.data.get('id')
        amount = request.data.get('amount')
        
        if payment_type == 'booking':
            try:
                booking = Booking.objects.get(id=entity_id)
                from .services import create_booking_payment
                razorpay_order = create_booking_payment(booking)
                return Response({
                    'order_id': razorpay_order['id'],
                    'amount': razorpay_order['amount'] / 100,
                    'currency': razorpay_order['currency'],
                    'key': settings.RAZORPAY_KEY_ID
                }, status=status.HTTP_200_OK)
            except Booking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif payment_type == 'order':
            try:
                order = Order.objects.get(id=entity_id)
                from .services import create_order_payment
                razorpay_order = create_order_payment(order)
                return Response({
                    'order_id': razorpay_order['id'],
                    'amount': razorpay_order['amount'] / 100,
                    'currency': razorpay_order['currency'],
                    'key': settings.RAZORPAY_KEY_ID
                }, status=status.HTTP_200_OK)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Invalid payment type'}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_payment(request):
    """
    Verify Razorpay payment
    POST /api/v1/payments/verify/
    Body: {
        "type": "booking" | "order",
        "id": "booking_id or order_id",
        "razorpay_order_id": "...",
        "razorpay_payment_id": "...",
        "razorpay_signature": "..."
    }
    """
    try:
        payment_type = request.data.get('type')
        entity_id = request.data.get('id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        if payment_type == 'booking':
            try:
                booking = Booking.objects.get(id=entity_id)
                from .services import verify_and_update_booking_payment
                verified = verify_and_update_booking_payment(
                    booking, razorpay_order_id, razorpay_payment_id, razorpay_signature
                )
                if verified:
                    return Response({'status': 'success', 'message': 'Payment verified'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
            except Booking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif payment_type == 'order':
            try:
                order = Order.objects.get(id=entity_id)
                from .services import verify_and_update_order_payment
                verified = verify_and_update_order_payment(
                    order, razorpay_order_id, razorpay_payment_id, razorpay_signature
                )
                if verified:
                    return Response({'status': 'success', 'message': 'Payment verified'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Invalid payment type'}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

