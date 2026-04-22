import django_filters
from .models import Teacher


class TeacherFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='full_name', lookup_expr='icontains')
    subject = django_filters.NumberFilter(field_name='course_instances__subject__id')

    class Meta:
        model = Teacher
        fields = ['age_range', 'is_verified']
