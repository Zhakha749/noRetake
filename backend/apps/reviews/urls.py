from django.urls import path
from .views import ReviewCreateView, review_report, review_vote

urlpatterns = [
    path('',                ReviewCreateView.as_view(), name='review-create'),
    path('<int:pk>/report/', review_report,              name='review-report'),
    path('<int:pk>/vote/',   review_vote,                name='review-vote'),
]
