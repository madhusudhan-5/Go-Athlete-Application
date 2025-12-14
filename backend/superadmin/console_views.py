from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Count, Sum
from .models import (
    AdminUser, GlobalConfig, Offer, AuditLog, 
    Vendor, VendorKYC, Venue, Court, Customer, Booking, Ticket, Payout
)


@csrf_exempt
def console_login(request):
    if request.user.is_authenticated:
        return redirect('console-dashboard')
    
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password) and user.is_active:
                if hasattr(user, 'admin_profile') or user.is_superuser:
                    login(request, user)
                    AuditLog.objects.create(
                        user=user.username,
                        action='login',
                        resource='AdminUser',
                        resource_id=str(user.id),
                        details=f'User logged in from admin console'
                    )
                    return redirect('console-dashboard')
                else:
                    return render(request, 'admin_console/login.html', {'error': 'Not authorized for admin access', 'email': email})
            else:
                return render(request, 'admin_console/login.html', {'error': 'Invalid credentials', 'email': email})
        except User.DoesNotExist:
            return render(request, 'admin_console/login.html', {'error': 'User not found', 'email': email})
    
    return render(request, 'admin_console/login.html')


def console_logout(request):
    logout(request)
    return redirect('console-login')


@login_required(login_url='console-login')
def console_dashboard(request):
    user_role = 'SUPER_ADMIN' if request.user.is_superuser else 'ADMIN'
    
    if user_role == 'SUPER_ADMIN':
        stats = {
            'total_vendors': Vendor.objects.count(),
            'new_vendors': Vendor.objects.filter(status='PENDING').count(),
            'total_revenue': Booking.objects.filter(status='COMPLETED').aggregate(Sum('amount'))['amount__sum'] or 0,
            'active_offers': Offer.objects.filter(status='ACTIVE').count(),
            'total_offers': Offer.objects.count(),
            'admin_count': AdminUser.objects.filter(is_suspended=False).count(),
        }
    else:
        stats = {
            'pending_vendors': Vendor.objects.filter(status='PENDING').count(),
            'today_bookings': Booking.objects.filter(status='CONFIRMED').count(),
            'total_bookings': Booking.objects.count(),
            'open_tickets': Ticket.objects.filter(status='OPEN').count(),
            'total_tickets': Ticket.objects.count(),
            'total_customers': Customer.objects.count(),
            'new_customers': Customer.objects.count(),
        }
    
    booking_status_counts = Booking.objects.values('status').annotate(count=Count('id'))
    bookings_by_status = [0, 0, 0, 0]
    for item in booking_status_counts:
        if item['status'] == 'CONFIRMED':
            bookings_by_status[0] = item['count']
        elif item['status'] == 'COMPLETED':
            bookings_by_status[1] = item['count']
        elif item['status'] == 'PENDING':
            bookings_by_status[2] = item['count']
        elif item['status'] == 'CANCELLED':
            bookings_by_status[3] = item['count']
    
    vendor_type_counts = Vendor.objects.values('vendor_type').annotate(count=Count('id'))
    vendor_types = [0, 0, 0, 0]
    for item in vendor_type_counts:
        if item['vendor_type'] == 'VENUE':
            vendor_types[0] = item['count']
        elif item['vendor_type'] == 'COACH':
            vendor_types[1] = item['count']
        elif item['vendor_type'] == 'ECOM':
            vendor_types[2] = item['count']
        else:
            vendor_types[3] += item['count']
    
    chart_data = {
        'revenue_labels': "['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']",
        'revenue_data': "[12500, 19200, 15300, 22100, 18700, 25800, 21300]",
        'bookings_by_status': str(bookings_by_status) if any(bookings_by_status) else "[45, 30, 15, 10]",
        'vendor_types': str(vendor_types) if any(vendor_types) else "[40, 25, 20, 15]",
        'monthly_labels': "['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']",
        'monthly_bookings': "[120, 150, 180, 210, 195, 240]",
    }
    
    recent_logs = AuditLog.objects.order_by('-created_at')[:5]
    
    return render(request, 'admin_console/dashboard.html', {
        'stats': stats,
        'chart_data': chart_data,
        'recent_logs': recent_logs,
        'user_role': user_role,
        'active_page': 'dashboard'
    })


@login_required(login_url='console-login')
def console_global_config(request):
    config, _ = GlobalConfig.objects.get_or_create(pk=1)
    
    if request.method == 'POST':
        config.commission_percentage = request.POST.get('commission_percentage', 10)
        config.payout_cycle = request.POST.get('payout_cycle', 'WEEKLY')
        config.sms_mode = request.POST.get('sms_mode', 'LOG')
        config.min_booking_amount = request.POST.get('min_booking_amount', 100)
        config.cancellation_window_hours = request.POST.get('cancellation_window_hours', 24)
        config.save()
        
        AuditLog.objects.create(
            user=request.user,
            action='update_config',
            details='Global configuration updated'
        )
        messages.success(request, 'Configuration saved successfully!')
        return redirect('console-global-config')
    
    return render(request, 'admin_console/superadmin/global_config.html', {
        'config': config,
        'user_role': 'SUPER_ADMIN',
        'active_page': 'global-config'
    })


@login_required(login_url='console-login')
def console_offers(request):
    offers = Offer.objects.all().order_by('-created_at')
    return render(request, 'admin_console/superadmin/offers.html', {
        'offers': offers,
        'user_role': 'SUPER_ADMIN',
        'active_page': 'offers'
    })


@login_required(login_url='console-login')
def console_offer_add(request):
    if request.method == 'POST':
        Offer.objects.create(
            title=request.POST.get('title', 'New Offer'),
            code=request.POST.get('code'),
            offer_type=request.POST.get('offer_type', 'PERCENT'),
            value=request.POST.get('value', 0),
            start_date=request.POST.get('start_date'),
            end_date=request.POST.get('end_date'),
            status='ACTIVE'
        )
        messages.success(request, 'Offer created successfully!')
    return redirect('console-offers')


@login_required(login_url='console-login')
def console_offer_toggle(request, offer_id):
    offer = get_object_or_404(Offer, id=offer_id)
    if offer.status == 'ACTIVE':
        offer.status = 'DISABLED'
    else:
        offer.status = 'ACTIVE'
    offer.save()
    messages.success(request, f'Offer {"activated" if offer.status == "ACTIVE" else "deactivated"}!')
    return redirect('console-offers')


@login_required(login_url='console-login')
def console_offer_edit(request, offer_id):
    offer = get_object_or_404(Offer, id=offer_id)
    return redirect('console-offers')


@login_required(login_url='console-login')
def console_audit_logs(request):
    logs = AuditLog.objects.all().order_by('-created_at')
    paginator = Paginator(logs, 10)
    page = request.GET.get('page', 1)
    logs = paginator.get_page(page)
    
    return render(request, 'admin_console/superadmin/audit_logs.html', {
        'logs': logs,
        'user_role': 'SUPER_ADMIN',
        'active_page': 'audit-logs'
    })


@login_required(login_url='console-login')
def console_admin_users(request):
    admins = AdminUser.objects.all().order_by('-created_at')
    return render(request, 'admin_console/superadmin/admin_users.html', {
        'admins': admins,
        'user_role': 'SUPER_ADMIN',
        'active_page': 'admin-users'
    })


@login_required(login_url='console-login')
def console_admin_add(request):
    if request.method == 'POST':
        from django.contrib.auth.models import User
        user = User.objects.create_user(
            username=request.POST.get('email'),
            email=request.POST.get('email'),
            password=request.POST.get('password'),
            first_name=request.POST.get('first_name', ''),
            last_name=request.POST.get('last_name', '')
        )
        AdminUser.objects.create(
            user=user,
            can_onboard_vendor=True,
            can_manage_bookings=True,
            can_view_reports=True
        )
        messages.success(request, 'Admin user created successfully!')
    return redirect('console-admin-users')


@login_required(login_url='console-login')
def console_admin_toggle(request, admin_id):
    admin = get_object_or_404(AdminUser, id=admin_id)
    admin.is_suspended = not admin.is_suspended
    admin.save()
    messages.success(request, f'Admin {"suspended" if admin.is_suspended else "activated"}!')
    return redirect('console-admin-users')


@login_required(login_url='console-login')
def console_vendors(request):
    status = request.GET.get('status', 'all')
    vendors = Vendor.objects.all()
    if status != 'all':
        vendors = vendors.filter(status=status)
    vendors = vendors.order_by('-created_at')
    
    return render(request, 'admin_console/admin/vendors.html', {
        'vendors': vendors,
        'status': status,
        'user_role': 'ADMIN',
        'active_page': 'vendors'
    })


@login_required(login_url='console-login')
def console_vendor_approve(request, vendor_id):
    vendor = get_object_or_404(Vendor, id=vendor_id)
    vendor.status = 'APPROVED'
    vendor.save()
    messages.success(request, f'Vendor {vendor.business_name} approved!')
    return redirect('console-vendors')


@login_required(login_url='console-login')
def console_vendor_suspend(request, vendor_id):
    vendor = get_object_or_404(Vendor, id=vendor_id)
    vendor.status = 'SUSPENDED'
    vendor.save()
    messages.success(request, f'Vendor {vendor.business_name} suspended!')
    return redirect('console-vendors')


@login_required(login_url='console-login')
def console_kyc(request):
    status = request.GET.get('status', 'all')
    kyc_list = VendorKYC.objects.all().select_related('vendor').order_by('-created_at')
    if status != 'all':
        kyc_list = kyc_list.filter(status=status)
    
    return render(request, 'admin_console/admin/kyc.html', {
        'kyc_list': kyc_list,
        'status': status,
        'user_role': 'ADMIN',
        'active_page': 'kyc'
    })


@login_required(login_url='console-login')
def console_kyc_verify(request, kyc_id):
    kyc = get_object_or_404(VendorKYC, id=kyc_id)
    kyc.status = 'VERIFIED'
    kyc.save()
    messages.success(request, 'KYC verified successfully!')
    return redirect('console-kyc')


@login_required(login_url='console-login')
def console_kyc_reject(request, kyc_id):
    kyc = get_object_or_404(VendorKYC, id=kyc_id)
    kyc.status = 'REJECTED'
    kyc.save()
    messages.success(request, 'KYC rejected!')
    return redirect('console-kyc')


@login_required(login_url='console-login')
def console_bookings(request):
    status = request.GET.get('status', 'all')
    bookings = Booking.objects.all().select_related('court', 'court__venue').order_by('-created_at')
    if status != 'all':
        bookings = bookings.filter(status=status)
    
    return render(request, 'admin_console/admin/bookings.html', {
        'bookings': bookings,
        'status': status,
        'user_role': 'ADMIN',
        'active_page': 'bookings'
    })


@login_required(login_url='console-login')
def console_booking_complete(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    booking.status = 'COMPLETED'
    booking.save()
    messages.success(request, 'Booking marked as completed!')
    return redirect('console-bookings')


@login_required(login_url='console-login')
def console_booking_cancel(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    booking.status = 'CANCELLED'
    booking.save()
    messages.success(request, 'Booking cancelled!')
    return redirect('console-bookings')


@login_required(login_url='console-login')
def console_customers(request):
    customers = Customer.objects.all().order_by('-created_at')
    
    return render(request, 'admin_console/admin/customers.html', {
        'customers': customers,
        'user_role': 'ADMIN',
        'active_page': 'customers'
    })


@login_required(login_url='console-login')
def console_customer_detail(request, customer_id):
    customer = get_object_or_404(Customer, id=customer_id)
    return redirect('console-customers')


@login_required(login_url='console-login')
def console_tickets(request):
    status = request.GET.get('status', 'all')
    tickets = Ticket.objects.all().order_by('-created_at')
    if status != 'all':
        tickets = tickets.filter(status=status)
    
    return render(request, 'admin_console/admin/tickets.html', {
        'tickets': tickets,
        'status': status,
        'user_role': 'ADMIN',
        'active_page': 'tickets'
    })


@login_required(login_url='console-login')
def console_ticket_progress(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    ticket.status = 'IN_PROGRESS'
    ticket.save()
    messages.success(request, 'Ticket marked as in progress!')
    return redirect('console-tickets')


@login_required(login_url='console-login')
def console_ticket_resolve(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    ticket.status = 'RESOLVED'
    ticket.save()
    messages.success(request, 'Ticket resolved!')
    return redirect('console-tickets')
