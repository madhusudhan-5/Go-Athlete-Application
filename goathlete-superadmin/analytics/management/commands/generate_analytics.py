from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import ExtractHour, ExtractWeekDay
from datetime import timedelta
import numpy as np
from scipy import stats
from analytics.models import Transaction, VendorProfile
from analytics.models.predictive_analytics import (
    SeasonalityAnalytics,
    CustomerLifetimeValue,
    PredictiveMetrics
)

class Command(BaseCommand):
    help = 'Generate predictive analytics and seasonality patterns'

    def handle(self, *args, **options):
        self.analyze_seasonality()
        self.update_customer_lifetime_values()
        self.generate_predictions()

    def analyze_seasonality(self):
        # Analyze daily patterns
        daily_data = Transaction.objects.annotate(
            hour=ExtractHour('created_at')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')

        # Convert to numpy array for statistical analysis
        hours = np.array([d['hour'] for d in daily_data])
        counts = np.array([d['count'] for d in daily_data])
        
        # Find peaks using rolling average
        window = 3
        rolling_mean = np.convolve(counts, np.ones(window)/window, mode='valid')
        peaks = self.find_peaks(rolling_mean)
        
        for vendor_type, _ in VendorProfile.VENDOR_TYPES:
            SeasonalityAnalytics.objects.update_or_create(
                analysis_type='DAILY',
                vendor_type=vendor_type,
                defaults={
                    'pattern_data': counts.tolist(),
                    'confidence_score': self.calculate_confidence(counts),
                    'peak_periods': peaks.tolist(),
                    'low_periods': self.find_troughs(rolling_mean).tolist()
                }
            )

    def update_customer_lifetime_values(self):
        # Get all customers with transactions
        customers = Transaction.objects.values(
            'customer_id'
        ).distinct()

        for customer in customers:
            customer_transactions = Transaction.objects.filter(
                customer_id=customer['customer_id']
            )

            first_booking = customer_transactions.order_by('created_at').first()
            last_booking = customer_transactions.order_by('-created_at').first()
            
            # Calculate metrics
            total_spent = customer_transactions.aggregate(
                total=Sum('amount')
            )['total']
            total_bookings = customer_transactions.count()
            days_since_first = (timezone.now() - first_booking.created_at).days
            days_since_last = (timezone.now() - last_booking.created_at).days
            
            # Calculate frequency (bookings per month)
            months_active = max(days_since_first / 30, 1)
            frequency = total_bookings / months_active
            
            # Predict future value using simple regression
            predicted_clv = self.predict_customer_value(
                total_spent,
                frequency,
                days_since_last
            )
            
            # Update or create CLV record
            CustomerLifetimeValue.objects.update_or_create(
                customer_id=customer['customer_id'],
                defaults={
                    'first_booking_date': first_booking.created_at,
                    'total_bookings': total_bookings,
                    'total_spent': total_spent,
                    'average_booking_value': total_spent / total_bookings,
                    'frequency': frequency,
                    'recency': days_since_last,
                    'predicted_clv': predicted_clv,
                    'churn_probability': self.calculate_churn_probability(
                        frequency,
                        days_since_last
                    ),
                    'segment': self.determine_customer_segment(
                        frequency,
                        total_spent,
                        days_since_last
                    )
                }
            )

    def generate_predictions(self):
        today = timezone.now().date()
        
        for vendor in VendorProfile.objects.filter(is_active=True):
            # Get historical data
            historical_data = Transaction.objects.filter(
                vendor=vendor,
                created_at__date__gte=today - timedelta(days=90)
            )
            
            # Calculate basic metrics
            daily_averages = historical_data.values(
                'created_at__date'
            ).annotate(
                revenue=Sum('amount'),
                bookings=Count('id')
            )
            
            # Generate predictions using simple moving average
            revenue_pred, revenue_conf = self.predict_metric(
                [d['revenue'] for d in daily_averages]
            )
            booking_pred, booking_conf = self.predict_metric(
                [d['bookings'] for d in daily_averages]
            )
            
            # Generate hourly demand prediction
            hourly_pattern = historical_data.annotate(
                hour=ExtractHour('created_at')
            ).values('hour').annotate(
                demand=Count('id')
            ).order_by('hour')
            
            demand_by_hour = [0] * 24
            for entry in hourly_pattern:
                demand_by_hour[entry['hour']] = entry['demand']
            
            # Create prediction record
            PredictiveMetrics.objects.update_or_create(
                vendor=vendor,
                date=today + timedelta(days=1),
                defaults={
                    'predicted_revenue': revenue_pred,
                    'revenue_confidence': revenue_conf,
                    'predicted_bookings': booking_pred,
                    'booking_confidence': booking_conf,
                    'peak_hours': self.find_peaks(demand_by_hour).tolist(),
                    'demand_by_hour': demand_by_hour,
                    'recommended_base_price': self.calculate_recommended_price(
                        vendor,
                        demand_by_hour
                    ),
                    'price_confidence': 0.85  # Placeholder
                }
            )

    def find_peaks(self, data):
        return np.array([i for i in range(1, len(data)-1) if data[i-1] < data[i] > data[i+1]])

    def find_troughs(self, data):
        return np.array([i for i in range(1, len(data)-1) if data[i-1] > data[i] < data[i+1]])

    def calculate_confidence(self, data):
        return min(1.0, 1 - stats.variation(data))

    def predict_customer_value(self, total_spent, frequency, recency):
        # Simple prediction based on historical spending and frequency
        monthly_spend = total_spent / max(recency/30, 1)
        predicted_months = 12
        return monthly_spend * predicted_months * (1 - recency/365)

    def calculate_churn_probability(self, frequency, days_since_last):
        # Simple churn model
        if days_since_last > 90:
            return 0.9
        return min(1.0, days_since_last / (frequency * 30 * 3))

    def determine_customer_segment(self, frequency, total_spent, recency):
        if recency <= 30 and frequency >= 2:
            return 'LOYAL'
        if total_spent > 10000:
            return 'HIGH_VALUE'
        if recency > 90:
            return 'CHURNED'
        return 'REGULAR'

    def predict_metric(self, historical_data):
        if not historical_data:
            return 0, 0
        
        # Simple moving average prediction
        window = min(7, len(historical_data))
        prediction = sum(historical_data[-window:]) / window
        
        # Calculate confidence based on variance
        variance = np.var(historical_data[-window:]) if window > 1 else 0
        confidence = 1 / (1 + variance)
        
        return prediction, confidence

    def calculate_recommended_price(self, vendor, demand_by_hour):
        # Simple price recommendation based on demand
        base_price = Transaction.objects.filter(
            vendor=vendor
        ).aggregate(
            avg_price=Avg('amount')
        )['avg_price'] or 0
        
        max_demand = max(demand_by_hour)
        if max_demand == 0:
            return base_price
        
        # Adjust price based on demand
        demand_factor = 1 + (max_demand - np.mean(demand_by_hour)) / max_demand * 0.2
        return base_price * demand_factor