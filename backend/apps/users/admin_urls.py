from django.urls import path
from apps.materials.views import AdminMaterialModerationView, AdminMaterialActionView
from apps.reviews.views import AdminReportListView, AdminReportActionView
from apps.courses.views import AdminMassSyllabusView
from .admin_views import AdminStatsView

urlpatterns = [
    path('moderation/materials/', AdminMaterialModerationView.as_view(), name='admin-materials'),
    path('moderation/materials/<int:pk>/', AdminMaterialActionView.as_view(), name='admin-material-action'),
    path('moderation/reports/', AdminReportListView.as_view(), name='admin-reports'),
    path('moderation/reports/<int:pk>/', AdminReportActionView.as_view(), name='admin-report-action'),
    path('mass-assign-syllabus/', AdminMassSyllabusView.as_view(), name='admin-mass-syllabus'),
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
]
