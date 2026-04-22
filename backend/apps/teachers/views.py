from rest_framework import generics, permissions, filters
from django.db.models import Avg, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Teacher
from .serializers import TeacherListSerializer, TeacherDetailSerializer
from .filters import TeacherFilter


class TeacherListView(generics.ListAPIView):
    serializer_class = TeacherListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TeacherFilter
    search_fields = ['full_name']
    ordering_fields = ['full_name', 'avg_overall']
    ordering = ['full_name']

    def get_queryset(self):
        # Аннотируем средний общий рейтинг из отзывов для возможности сортировки
        return Teacher.objects.annotate(
            avg_overall=Avg(
                'course_instances__reviews__rating',
                filter=Q(course_instances__reviews__is_hidden=False),
            )
        ).distinct()


class TeacherDetailView(generics.RetrieveAPIView):
    queryset = Teacher.objects.all()
    serializer_class = TeacherDetailSerializer
    permission_classes = [permissions.AllowAny]
