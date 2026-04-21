from rest_framework import serializers
from .models import Subject


class SubjectListSerializer(serializers.ModelSerializer):
    overall_difficulty = serializers.ReadOnlyField()
    teacher_dependency_ratio = serializers.ReadOnlyField()

    class Meta:
        model = Subject
        fields = ('id', 'title', 'category', 'credits', 'overall_difficulty', 'teacher_dependency_ratio')


class SubjectDetailSerializer(serializers.ModelSerializer):
    overall_difficulty = serializers.ReadOnlyField()
    teacher_dependency_ratio = serializers.ReadOnlyField()
    teachers = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = (
            'id', 'title', 'category', 'credits', 'description',
            'overall_difficulty', 'teacher_dependency_ratio', 'teachers',
        )

    def get_teachers(self, obj):
        from apps.courses.models import CourseInstance
        from apps.reviews.models import Review

        seen = set()
        all_instances = CourseInstance.objects.filter(subject=obj).select_related('teacher')
        instances = []
        for ci in all_instances:
            if ci.teacher_id not in seen:
                seen.add(ci.teacher_id)
                instances.append(ci)
        result = []
        for ci in instances:
            teacher = ci.teacher
            reviews = Review.objects.filter(course_instance__teacher=teacher, course_instance__subject=obj, is_hidden=False)
            count = reviews.count()
            avg_difficulty = round(sum(r.difficulty_rating for r in reviews) / count, 1) if count else 0
            avg_rating = round(sum(r.rating for r in reviews) / count, 1) if count else 0

            grade_totals = {}
            for ci2 in CourseInstance.objects.filter(subject=obj, teacher=teacher):
                for grade, num in ci2.grade_distribution.items():
                    grade_totals[grade] = grade_totals.get(grade, 0) + num
            total_students = sum(grade_totals.values()) or 1
            grade_avg = sum(
                {'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0, 'FX': 0}.get(g, 0) * n
                for g, n in grade_totals.items()
            ) / total_students

            all_ci = CourseInstance.objects.filter(subject=obj, teacher=teacher).values('id').first()
            result.append({
                'teacher_id': teacher.id,
                'teacher_name': teacher.full_name,
                'course_instance_id': all_ci['id'] if all_ci else None,
                'avg_difficulty': avg_difficulty,
                'avg_rating': avg_rating,
                'grade_avg': round(grade_avg, 2),
                'review_count': count,
            })
        return result
