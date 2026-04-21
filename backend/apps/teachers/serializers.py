from rest_framework import serializers
from .models import Teacher


class TeacherListSerializer(serializers.ModelSerializer):
    average_ratings = serializers.SerializerMethodField()
    review_count    = serializers.SerializerMethodField()
    photo           = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = (
            'id', 'full_name', 'photo', 'age_range', 'is_verified',
            'gender_bias_score', 'average_ratings', 'review_count',
        )

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url

    def get_average_ratings(self, obj):
        return obj.get_average_ratings()

    def get_review_count(self, obj):
        from apps.reviews.models import Review
        return Review.objects.filter(course_instance__teacher=obj, is_hidden=False).count()


class TeacherDetailSerializer(serializers.ModelSerializer):
    average_ratings  = serializers.SerializerMethodField()
    teaching_history = serializers.SerializerMethodField()
    review_count     = serializers.SerializerMethodField()
    show_gender_bias = serializers.SerializerMethodField()
    photo            = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = (
            'id', 'full_name', 'photo', 'description', 'age_range', 'is_verified',
            'gender_bias_score', 'average_ratings', 'teaching_history',
            'review_count', 'show_gender_bias',
        )

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url

    def get_average_ratings(self, obj):
        return obj.get_average_ratings()

    def get_teaching_history(self, obj):
        return obj.get_teaching_history()

    def get_review_count(self, obj):
        from apps.reviews.models import Review
        return Review.objects.filter(course_instance__teacher=obj, is_hidden=False).count()

    def get_show_gender_bias(self, obj):
        from apps.reviews.models import Review
        import json
        reviews_with_marker = Review.objects.filter(
            course_instance__teacher=obj,
            is_hidden=False,
        )
        count = sum(
            1 for r in reviews_with_marker
            if r.sensitive_markers.get('gender_bias', False)
        )
        return obj.gender_bias_score > 3.0 and count >= 10
