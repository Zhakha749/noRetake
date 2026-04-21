from django.urls import path
from .views import StudyMaterialListCreateView, StudyMaterialDetailView

urlpatterns = [
    path('', StudyMaterialListCreateView.as_view(), name='material-list-create'),
    path('<int:pk>/', StudyMaterialDetailView.as_view(), name='material-detail'),
]
