from django.urls import path
from .views import TeacherListView, TeacherDetailView

urlpatterns = [
    path('', TeacherListView.as_view(), name='teacher-list'),
    path('<int:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),
]
