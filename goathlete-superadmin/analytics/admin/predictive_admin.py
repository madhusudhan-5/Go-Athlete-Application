from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models.predictive_analytics import (
    SeasonalityAnalytics,
    CustomerLifetimeValue,
    PredictiveMetrics
)

@admin.register(SeasonalityAnalytics)
class SeasonalityAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('analysis_type', 'vendor_type', 'confidence_score', 'last_updated')
    list_filter = ('analysis_type', 'vendor_type')
    readonly_fields = ('pattern_visualization', 'last_updated')

    def pattern_visualization(self, obj):
        # Generate HTML for Chart.js visualization
        data_points = obj.pattern_data
        peak_markers = obj.peak_periods
        
        return format_html("""
            <div style="width: 600px; height: 300px;">
                <canvas id="pattern_chart_{}"></canvas>
            </div>
            <script>
                new Chart(document.getElementById('pattern_chart_{}'), {{
                    type: 'line',
                    data: {{
                        labels: [...Array({}).keys()],
                        datasets: [{{
                            label: 'Pattern',
                            data: {},
                            borderColor: '#4F46E5',
                            tension: 0.1
                        }},
                        {{
                            label: 'Peak Periods',
                            data: {},
                            borderColor: '#EF4444',
                            pointRadius: 8,
                            showLine: false
                        }}]
                    }},
                    options: {{
                        responsive: true,
                        interaction: {{
                            mode: 'index',
                            intersect: false,
                        }}
                    }}
                }});
            </script>
        """, obj.id, obj.id, len(data_points), data_points, peak_markers)

@admin.register(CustomerLifetimeValue)
class CustomerLifetimeValueAdmin(admin.ModelAdmin):
    list_display = ('customer_id', 'total_spent', 'predicted_clv', 
                   'churn_probability', 'segment', 'last_updated')
    list_filter = ('segment', 'last_updated')
    search_fields = ('customer_id',)
    readonly_fields = ('customer_metrics_chart',)

    def customer_metrics_chart(self, obj):
        return format_html("""
            <div style="width: 600px; height: 300px;">
                <canvas id="customer_metrics_{}"></canvas>
            </div>
            <script>
                new Chart(document.getElementById('customer_metrics_{}'), {{
                    type: 'bar',
                    data: {{
                        labels: ['Total Spent', 'Predicted CLV'],
                        datasets: [{{
                            data: [{}, {}],
                            backgroundColor: ['#4F46E5', '#10B981']
                        }}]
                    }},
                    options: {{
                        responsive: true,
                        plugins: {{
                            title: {{
                                display: true,
                                text: 'Customer Value Metrics'
                            }}
                        }}
                    }}
                }});
            </script>
        """, obj.id, obj.id, float(obj.total_spent), float(obj.predicted_clv))

@admin.register(PredictiveMetrics)
class PredictiveMetricsAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'date', 'predicted_revenue', 'predicted_bookings', 
                   'revenue_confidence')
    list_filter = ('date', 'vendor')
    readonly_fields = ('demand_forecast_chart',)

    def demand_forecast_chart(self, obj):
        return format_html("""
            <div style="width: 600px; height: 300px;">
                <canvas id="demand_forecast_{}"></canvas>
            </div>
            <script>
                new Chart(document.getElementById('demand_forecast_{}'), {{
                    type: 'line',
                    data: {{
                        labels: [...Array(24).keys()],
                        datasets: [{{
                            label: 'Hourly Demand',
                            data: {},
                            borderColor: '#4F46E5',
                            fill: true,
                            backgroundColor: 'rgba(79, 70, 229, 0.1)'
                        }}]
                    }},
                    options: {{
                        responsive: true,
                        plugins: {{
                            title: {{
                                display: true,
                                text: 'Demand Forecast by Hour'
                            }}
                        }},
                        scales: {{
                            y: {{
                                beginAtZero: true
                            }}
                        }}
                    }}
                }});
            </script>
        """, obj.id, obj.id, obj.demand_by_hour)