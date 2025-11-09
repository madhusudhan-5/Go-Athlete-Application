from django.http import HttpResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from openpyxl import Workbook
from datetime import datetime, timedelta
from .models import DailyAnalytics, VendorPerformanceMetrics, Transaction
import csv

@method_decorator(staff_member_required, name='dispatch')
class ExportAnalyticsView(View):
    def get(self, request, *args, **kwargs):
        report_type = request.GET.get('type', 'daily')
        format = request.GET.get('format', 'xlsx')
        start_date = request.GET.get('start_date', None)
        end_date = request.GET.get('end_date', None)
        
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).date()
        if not end_date:
            end_date = datetime.now().date()
            
        if report_type == 'daily':
            return self.export_daily_analytics(start_date, end_date, format)
        elif report_type == 'vendor':
            return self.export_vendor_metrics(start_date, end_date, format)
        else:
            return HttpResponse('Invalid report type', status=400)
    
    def export_daily_analytics(self, start_date, end_date, format):
        analytics = DailyAnalytics.objects.filter(
            date__range=[start_date, end_date]
        ).order_by('date')
        
        if format == 'xlsx':
            wb = Workbook()
            ws = wb.active
            ws.title = "Daily Analytics"
            
            # Headers
            headers = [
                'Date', 'Total Revenue', 'Commission', 'Net Earnings',
                'Online Revenue', 'Offline Revenue', 'Total Bookings',
                'Completed Bookings', 'New Customers', 'Offers Used',
                'Average Booking Value', 'Customer Satisfaction'
            ]
            ws.append(headers)
            
            # Data
            for analytic in analytics:
                ws.append([
                    analytic.date,
                    float(analytic.total_revenue),
                    float(analytic.total_commission),
                    float(analytic.net_vendor_earnings),
                    float(analytic.online_revenue),
                    float(analytic.offline_revenue),
                    analytic.total_bookings,
                    analytic.completed_bookings,
                    analytic.new_customers,
                    analytic.total_offers_used,
                    float(analytic.average_booking_value),
                    float(analytic.customer_satisfaction_score)
                ])
            
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename=daily_analytics_{start_date}_{end_date}.xlsx'
            wb.save(response)
            return response
            
        else:  # CSV format
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename=daily_analytics_{start_date}_{end_date}.csv'
            
            writer = csv.writer(response)
            writer.writerow([
                'Date', 'Total Revenue', 'Commission', 'Net Earnings',
                'Online Revenue', 'Offline Revenue', 'Total Bookings',
                'Completed Bookings', 'New Customers', 'Offers Used',
                'Average Booking Value', 'Customer Satisfaction'
            ])
            
            for analytic in analytics:
                writer.writerow([
                    analytic.date,
                    float(analytic.total_revenue),
                    float(analytic.total_commission),
                    float(analytic.net_vendor_earnings),
                    float(analytic.online_revenue),
                    float(analytic.offline_revenue),
                    analytic.total_bookings,
                    analytic.completed_bookings,
                    analytic.new_customers,
                    analytic.total_offers_used,
                    float(analytic.average_booking_value),
                    float(analytic.customer_satisfaction_score)
                ])
            
            return response
    
    def export_vendor_metrics(self, start_date, end_date, format):
        metrics = VendorPerformanceMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).select_related('vendor').order_by('vendor', 'date')
        
        if format == 'xlsx':
            wb = Workbook()
            ws = wb.active
            ws.title = "Vendor Performance"
            
            headers = [
                'Vendor', 'Date', 'Total Revenue', 'Net Revenue',
                'Commission Paid', 'Total Bookings', 'Completed Bookings',
                'Cancellation Rate', 'Average Rating', 'Response Time',
                'Customer Retention', 'Offer Conversion'
            ]
            ws.append(headers)
            
            for metric in metrics:
                ws.append([
                    metric.vendor.business_name,
                    metric.date,
                    float(metric.total_revenue),
                    float(metric.net_revenue),
                    float(metric.commission_paid),
                    metric.total_bookings,
                    metric.completed_bookings,
                    f"{float(metric.completion_rate)}%",
                    float(metric.average_rating),
                    f"{metric.average_response_time}min",
                    f"{float(metric.customer_retention_rate)}%",
                    f"{float(metric.offer_conversion_rate)}%"
                ])
            
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename=vendor_metrics_{start_date}_{end_date}.xlsx'
            wb.save(response)
            return response
            
        else:  # CSV format
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename=vendor_metrics_{start_date}_{end_date}.csv'
            
            writer = csv.writer(response)
            writer.writerow([
                'Vendor', 'Date', 'Total Revenue', 'Net Revenue',
                'Commission Paid', 'Total Bookings', 'Completed Bookings',
                'Cancellation Rate', 'Average Rating', 'Response Time',
                'Customer Retention', 'Offer Conversion'
            ])
            
            for metric in metrics:
                writer.writerow([
                    metric.vendor.business_name,
                    metric.date,
                    float(metric.total_revenue),
                    float(metric.net_revenue),
                    float(metric.commission_paid),
                    metric.total_bookings,
                    metric.completed_bookings,
                    f"{float(metric.completion_rate)}%",
                    float(metric.average_rating),
                    f"{metric.average_response_time}min",
                    f"{float(metric.customer_retention_rate)}%",
                    f"{float(metric.offer_conversion_rate)}%"
                ])
            
            return response