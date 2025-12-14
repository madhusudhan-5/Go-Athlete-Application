from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from superadmin.models import AdminUser, Vendor, VendorKYC, SuperAdmin


class Command(BaseCommand):
    help = 'Seeds the database with initial users for all roles'

    def handle(self, *args, **options):
        self.stdout.write('Seeding users...')
        
        # Create/Update Super Admin
        superadmin_user, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'superadmin@sportsplatform.com',
                'first_name': 'Super',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        superadmin_user.email = 'superadmin@sportsplatform.com'
        superadmin_user.first_name = 'Super'
        superadmin_user.last_name = 'Admin'
        superadmin_user.is_staff = True
        superadmin_user.is_superuser = True
        superadmin_user.set_password('SuperAdmin@123')
        superadmin_user.save()
        
        SuperAdmin.objects.get_or_create(
            user=superadmin_user,
            defaults={
                'full_name': 'Super Admin',
                'phone': '+919999999999',
                'is_active': True,
            }
        )
        
        self.stdout.write(self.style.SUCCESS(
            f'Super Admin: superadmin@sportsplatform.com / SuperAdmin@123'
        ))

        # Create Admin User
        admin_user, created = User.objects.get_or_create(
            username='admin_ops',
            defaults={
                'email': 'admin@sportsplatform.com',
                'first_name': 'Platform',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': False,
            }
        )
        admin_user.email = 'admin@sportsplatform.com'
        admin_user.first_name = 'Platform'
        admin_user.last_name = 'Admin'
        admin_user.is_staff = True
        admin_user.set_password('Admin@123')
        admin_user.save()
        
        AdminUser.objects.get_or_create(
            user=admin_user,
            defaults={
                'can_onboard_vendor': True,
                'can_manage_bookings': True,
                'can_view_reports': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(
            f'Admin: admin@sportsplatform.com / Admin@123'
        ))

        # Create Vendor User (Django auth user for vendor login)
        vendor_user, created = User.objects.get_or_create(
            username='vendor_sports',
            defaults={
                'email': 'vendor@sportsarena.com',
                'first_name': 'John',
                'last_name': 'Vendor',
                'is_staff': False,
                'is_superuser': False,
            }
        )
        vendor_user.email = 'vendor@sportsarena.com'
        vendor_user.first_name = 'John'
        vendor_user.last_name = 'Vendor'
        vendor_user.set_password('Vendor@123')
        vendor_user.save()

        # Create Vendor
        vendor, created = Vendor.objects.get_or_create(
            email='vendor@sportsarena.com',
            defaults={
                'name': 'John Vendor',
                'business_name': 'Sports Arena',
                'legal_name': 'Sports Arena Pvt Ltd',
                'owner_name': 'John Vendor',
                'phone': '+919876543210',
                'business_type': 'Sports Facility',
                'address': '123 Sports Complex Road, Andheri West',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'country': 'India',
                'status': 'APPROVED',
                'kyc_status': 'VERIFIED',
                'kyc_verified': True,
            }
        )
        
        vendor.password = vendor_user.password
        vendor.save()
        
        if created:
            VendorKYC.objects.get_or_create(
                vendor=vendor,
                defaults={
                    'pan_number': 'ABCDE1234F',
                    'gst_number': '27ABCDE1234F1Z5',
                    'status': 'VERIFIED',
                }
            )
        
        self.stdout.write(self.style.SUCCESS(
            f'Vendor: vendor@sportsarena.com / Vendor@123 (ID: {vendor.id})'
        ))

        self.stdout.write(self.style.SUCCESS('All users seeded successfully!'))
