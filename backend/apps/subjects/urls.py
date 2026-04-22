from django.urls import path
from .views import SubjectListView, SubjectDetailView

urlpatterns = [
    path('', SubjectListView.as_view(), name='subject-list'),
    path('<int:pk>/', SubjectDetailView.as_view(), name='subject-detail'),
]
