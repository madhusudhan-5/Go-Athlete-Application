from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from .models import DailyAnalytics, VendorProfile
from .models.predictive_analytics import PredictiveMetrics
import pandas as pd
import io

@shared_task
def generate_daily_analytics_report():
    """Generate and email daily analytics report"""
    today = timezone.now().date()
    yesterday = today - timezone.timedelta(days=1)
    
    # Get yesterday's analytics
    analytics = DailyAnalytics.objects.get(date=yesterday)
    
    # Generate Excel report
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    
    # Daily Summary
    summary_data = {
        'Metric': [
            'Total Revenue',
            'Total Commission',
            'Net Vendor Earnings',
            'Total Bookings',
            'New Customers',
            'Offers Used'
        ],
        'Value': [
            analytics.total_revenue,
            analytics.total_commission,
            analytics.net_vendor_earnings,
            analytics.total_bookings,
            analytics.new_customers,
            analytics.total_offers_used
        ]
    }
    pd.DataFrame(summary_data).to_excel(writer, sheet_name='Daily Summary', index=False)
    
    # Add predictions for next day
    predictions = PredictiveMetrics.objects.filter(date=today)
    pred_data = []
    for pred in predictions:
        pred_data.append({
            'Vendor': pred.vendor.business_name,
            'Predicted Revenue': pred.predicted_revenue,
            'Predicted Bookings': pred.predicted_bookings,
            'Confidence': f"{pred.revenue_confidence:.2%}"
        })
    
    if pred_data:
        pd.DataFrame(pred_data).to_excel(writer, sheet_name='Tomorrow Predictions', index=False)
    
    writer.save()
    output.seek(0)
    
    # Prepare email
    subject = f'Daily Analytics Report - {yesterday}'
    message = render_to_string('analytics/email/daily_report.html', {
        'date': yesterday,
        'analytics': analytics,
        'predictions': pred_data
    })
    
    # Send email with attachment
    send_mail(
        subject=subject,
        message='Please see attached report',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.ADMIN_EMAILS,
        html_message=message,
        attachments=[
            ('daily_analytics.xlsx', output.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ]
    )

@shared_task
def alert_low_performing_vendors():
    """Alert admins about vendors with concerning metrics"""
    today = timezone.now().date()
    
    # Get vendors with low performance
    predictions = PredictiveMetrics.objects.filter(
        date=today,
        revenue_confidence__lt=0.6  # Low confidence in revenue
    ).select_related('vendor')
    
    if predictions:
        message = render_to_string('analytics/email/low_performance_alert.html', {
            'predictions': predictions
        })
        
        send_mail(
            subject=f'Low Performance Alert - {today}',
            message='Please see the HTML version',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=settings.ADMIN_EMAILS,
            html_message=message
        )

@shared_task
def weekly_trend_analysis():
    """Generate weekly trend analysis report"""
    end_date = timezone.now().date()
    start_date = end_date - timezone.timedelta(days=7)
    
    # Get weekly data
    weekly_analytics = DailyAnalytics.objects.filter(
        date__range=[start_date, end_date]
    ).order_by('date')
    
    # Prepare trend data
    trend_data = {
        'Date': [],
        'Revenue': [],
        'Bookings': [],
        'New Customers': []
    }
    
    for day in weekly_analytics:
        trend_data['Date'].append(day.date)
        trend_data['Revenue'].append(float(day.total_revenue))
        trend_data['Bookings'].append(day.total_bookings)
        trend_data['New Customers'].append(day.new_customers)
    
    # Create Excel report
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    
    # Weekly trends
    pd.DataFrame(trend_data).to_excel(writer, sheet_name='Weekly Trends', index=False)
    
    # Add charts
    workbook = writer.book
    worksheet = writer.sheets['Weekly Trends']
    
    # Revenue chart
    chart1 = workbook.add_chart({'type': 'line'})
    chart1.add_series({
        'name': 'Revenue',
        'values': ['Weekly Trends', 1, 1, 7, 1],
        'categories': ['Weekly Trends', 1, 0, 7, 0]
    })
    worksheet.insert_chart('J2', chart1)
    
    writer.save()
    output.seek(0)
    
    # Send email
    subject = f'Weekly Trend Analysis - {start_date} to {end_date}'
    message = render_to_string('analytics/email/weekly_report.html', {
        'start_date': start_date,
        'end_date': end_date,
        'trend_data': trend_data
    })
    
    send_mail(
        subject=subject,
        message='Please see attached report',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.ADMIN_EMAILS,
        html_message=message,
        attachments=[
            ('weekly_trends.xlsx', output.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ]
    )