from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from apps.teachers.models import Teacher
from apps.subjects.models import Subject
from apps.reviews.models import Review, Report
from apps.materials.models import StudyMaterial
from .models import Student


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        week_ago = timezone.now() - timedelta(days=7)

        stats = {
            'total_teachers': Teacher.objects.count(),
            'total_subjects': Subject.objects.count(),
            'total_reviews': Review.objects.count(),
            'total_users': Student.objects.count(),
            'new_reviews_today': Review.objects.filter(created_at__date=today).count(),
            'pending_materials': StudyMaterial.objects.filter(status='pending').count(),
            'open_reports': Report.objects.filter(status='open').count(),
            'reviews_last_7_days': [
                {
                    'date': str(today - timedelta(days=i)),
                    'count': Review.objects.filter(
                        created_at__date=today - timedelta(days=i)
                    ).count()
                }
                for i in range(6, -1, -1)
            ],
        }
        return Response(stats)
