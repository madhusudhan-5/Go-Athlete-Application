from django.urls import path
from . import views

urlpatterns = [
    path('create-order/', views.create_payment_order, name='create-payment-order'),
    path('verify/', views.verify_payment, name='verify-payment'),
    path('webhook/', views.razorpay_webhook, name='razorpay-webhook'),
]

