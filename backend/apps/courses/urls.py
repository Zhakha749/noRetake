from django.urls import path
from .views import CourseInstanceDetailView, CourseInstanceCompareView

urlpatterns = [
    path('<int:pk>/', CourseInstanceDetailView.as_view(), name='course-instance-detail'),
    path('compare/', CourseInstanceCompareView.as_view(), name='course-instance-compare'),
]
