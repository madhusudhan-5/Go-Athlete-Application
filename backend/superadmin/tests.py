from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Vendor, VendorKYC, Venue, Court, Booking, Customer, AdminUser


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testvendor@test.com',
            email='testvendor@test.com',
            password='TestPass123!'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            business_name='Test Sports Arena',
            business_type='VENUE',
            vendor_type='VENUE',
            phone='+1234567890',
            status='APPROVED'
        )
        VendorKYC.objects.create(vendor=self.vendor)
    
    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'testvendor@test.com',
            'password': 'TestPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'wrong@test.com',
            'password': 'WrongPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_register_vendor(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'newvendor@test.com',
            'password': 'NewPass123!',
            'name': 'New Vendor',
            'phone': '+1234567890',
            'business_name': 'New Sports Arena',
            'business_type': 'VENUE',
            'vendor_type': 'VENUE'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('vendor_id', response.data)
        
        vendor = Vendor.objects.get(id=response.data['vendor_id'])
        self.assertEqual(vendor.business_name, 'New Sports Arena')
        self.assertEqual(vendor.status, 'PENDING')
    
    def test_register_weak_password(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'newvendor2@test.com',
            'password': '123',
            'name': 'New Vendor',
            'phone': '+1234567890',
            'business_name': 'New Sports Arena',
            'business_type': 'VENUE',
            'vendor_type': 'VENUE'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VendorAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='vendor@test.com',
            email='vendor@test.com',
            password='VendorPass123!'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            business_name='Test Sports Arena',
            business_type='VENUE',
            vendor_type='VENUE',
            phone='+1234567890',
            status='APPROVED'
        )
        VendorKYC.objects.create(vendor=self.vendor)
        self.client.force_authenticate(user=self.user)
    
    def test_get_vendor_profile(self):
        response = self.client.get(f'/api/vendors/{self.vendor.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_name'], 'Test Sports Arena')
    
    def test_unauthorized_access(self):
        self.client.logout()
        response = self.client.get(f'/api/vendors/{self.vendor.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class VenueAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='venue@test.com',
            email='venue@test.com',
            password='VenuePass123!'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            business_name='Test Sports Arena',
            business_type='VENUE',
            vendor_type='VENUE',
            phone='+1234567890',
            status='APPROVED'
        )
        VendorKYC.objects.create(vendor=self.vendor)
        self.venue = Venue.objects.create(
            vendor=self.vendor,
            name='Test Stadium',
            address='123 Sports Street',
            city='Mumbai',
            state='Maharashtra',
            is_active=True
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_venues(self):
        response = self.client.get(f'/api/vendors/{self.vendor.id}/venues/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_venue(self):
        response = self.client.post(f'/api/vendors/{self.vendor.id}/venues/', {
            'name': 'New Stadium',
            'address': '456 Sports Ave',
            'city': 'Delhi',
            'state': 'Delhi',
            'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Venue.objects.filter(name='New Stadium').exists())


class BookingAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='booking@test.com',
            email='booking@test.com',
            password='BookingPass123!'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            business_name='Test Sports Arena',
            business_type='VENUE',
            vendor_type='VENUE',
            phone='+1234567890',
            status='APPROVED'
        )
        VendorKYC.objects.create(vendor=self.vendor)
        self.venue = Venue.objects.create(
            vendor=self.vendor,
            name='Test Stadium',
            address='123 Sports Street',
            city='Mumbai',
            state='Maharashtra'
        )
        self.court = Court.objects.create(
            venue=self.venue,
            name='Court 1',
            sport_type='BADMINTON',
            price_per_hour=500
        )
        self.customer = Customer.objects.create(
            name='Test Customer',
            phone='+1234567890',
            email='customer@test.com'
        )
        self.booking = Booking.objects.create(
            customer=self.customer,
            court=self.court,
            booking_date='2025-12-15',
            start_time='10:00:00',
            end_time='11:00:00',
            amount=500,
            status='confirmed'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_bookings(self):
        response = self.client.get(f'/api/vendors/{self.vendor.id}/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_cancel_booking(self):
        response = self.client.post(f'/api/bookings/{self.booking.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')


class AdminConsoleTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            password='AdminPass123!',
            is_staff=True
        )
        AdminUser.objects.create(
            user=self.admin_user,
            role='ADMIN',
            is_active=True
        )
    
    def test_login_page_loads(self):
        response = self.client.get('/login/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Admin Console')
    
    def test_login_success(self):
        response = self.client.post('/login/', {
            'email': 'admin@test.com',
            'password': 'AdminPass123!'
        })
        self.assertEqual(response.status_code, 302)
    
    def test_dashboard_requires_login(self):
        response = self.client.get('/dashboard/')
        self.assertEqual(response.status_code, 302)
    
    def test_dashboard_access_after_login(self):
        self.client.login(username='admin@test.com', password='AdminPass123!')
        response = self.client.get('/dashboard/')
        self.assertEqual(response.status_code, 200)


class EmailNotificationTests(TestCase):
    def test_log_mode_email(self):
        from .notifications import LogNotificationService
        service = LogNotificationService()
        result = service.send_email(
            'test@example.com',
            'Test Subject',
            '<p>Test content</p>'
        )
        self.assertTrue(result['success'])
        self.assertEqual(result['mode'], 'LOG')
    
    def test_email_templates(self):
        from .notifications import EmailTemplates
        
        booking_html = EmailTemplates.booking_confirmation({
            'id': 1,
            'court_name': 'Court 1',
            'booking_date': '2025-12-15',
            'start_time': '10:00',
            'end_time': '11:00',
            'amount': 500
        })
        self.assertIn('Booking Confirmed', booking_html)
        self.assertIn('Court 1', booking_html)
        
        vendor_html = EmailTemplates.vendor_approved('Test Vendor')
        self.assertIn('Congratulations', vendor_html)
        self.assertIn('Test Vendor', vendor_html)
