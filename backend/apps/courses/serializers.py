from rest_framework import serializers
from .models import CourseInstance, SyllabusVersion
from apps.teachers.serializers import TeacherListSerializer
from apps.subjects.serializers import SubjectListSerializer


class SyllabusVersionSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SyllabusVersion
        fields = ('id', 'file', 'year', 'uploaded_by_name', 'uploaded_at')

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.username
        return 'Anonymous'


class CourseInstanceListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    subject_title = serializers.CharField(source='subject.title', read_only=True)

    class Meta:
        model = CourseInstance
        fields = ('id', 'teacher_name', 'subject_title', 'year_interval', 'role')


class CourseInstanceDetailSerializer(serializers.ModelSerializer):
    teacher = TeacherListSerializer(read_only=True)
    subject = SubjectListSerializer(read_only=True)
    syllabus_history = SyllabusVersionSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    average_ratings = serializers.SerializerMethodField()

    class Meta:
        model = CourseInstance
        fields = (
            'id', 'teacher', 'subject', 'year_interval', 'role',
            'grading_policy', 'weekly_plan', 'grade_distribution',
            'syllabus_history', 'reviews', 'average_ratings',
        )

    def get_reviews(self, obj):
        from apps.reviews.serializers import ReviewSerializer
        reviews = obj.reviews.filter(is_hidden=False).order_by('-helpful_votes', '-created_at')
        return ReviewSerializer(reviews, many=True, context=self.context).data

    def get_average_ratings(self, obj):
        reviews = obj.reviews.filter(is_hidden=False)
        count = reviews.count()
        if not count:
            return {'clarity': 0, 'objectivity': 0, 'accessibility': 0, 'workload': 0, 'overall': 0, 'difficulty': 0}
        return {
            'clarity': round(sum(r.clarity_rating for r in reviews) / count, 1),
            'objectivity': round(sum(r.objectivity_rating for r in reviews) / count, 1),
            'accessibility': round(sum(r.accessibility_rating for r in reviews) / count, 1),
            'workload': round(sum(r.workload_rating for r in reviews) / count, 1),
            'overall': round(sum(r.rating for r in reviews) / count, 1),
            'difficulty': round(sum(r.difficulty_rating for r in reviews) / count, 1),
        }


class CourseInstanceCompareSerializer(serializers.ModelSerializer):
    teacher = TeacherListSerializer(read_only=True)
    subject = SubjectListSerializer(read_only=True)
    average_ratings = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = CourseInstance
        fields = (
            'id', 'teacher', 'subject', 'year_interval', 'role',
            'grading_policy', 'grade_distribution', 'average_ratings', 'review_count',
        )

    def get_average_ratings(self, obj):
        reviews = obj.reviews.filter(is_hidden=False)
        count = reviews.count()
        if not count:
            return {'clarity': 0, 'objectivity': 0, 'accessibility': 0, 'workload': 0, 'overall': 0, 'difficulty': 0}
        return {
            'clarity': round(sum(r.clarity_rating for r in reviews) / count, 1),
            'objectivity': round(sum(r.objectivity_rating for r in reviews) / count, 1),
            'accessibility': round(sum(r.accessibility_rating for r in reviews) / count, 1),
            'workload': round(sum(r.workload_rating for r in reviews) / count, 1),
            'overall': round(sum(r.rating for r in reviews) / count, 1),
            'difficulty': round(sum(r.difficulty_rating for r in reviews) / count, 1),
        }

    def get_review_count(self, obj):
        return obj.reviews.filter(is_hidden=False).count()
