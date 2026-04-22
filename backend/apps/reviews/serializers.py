from rest_framework import serializers
from .models import Review, Report, ReviewVote


# ── Plain serializers.Serializer (не ModelSerializer) ────────────────────────

class VoteSerializer(serializers.Serializer):
    """Валидирует входящий голос: только 'up' или 'down'."""
    vote = serializers.ChoiceField(choices=['up', 'down'])


class ReportInputSerializer(serializers.Serializer):
    """Валидирует причину жалобы."""
    reason = serializers.CharField(min_length=10, max_length=1000)


# ── ModelSerializer'ы ─────────────────────────────────────────────────────────

class ReviewSerializer(serializers.ModelSerializer):
    author_name  = serializers.SerializerMethodField()
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            'id', 'author_name', 'course_instance', 'text',
            'rating', 'difficulty_rating',
            'clarity_rating', 'objectivity_rating', 'accessibility_rating', 'workload_rating',
            'is_anonymous', 'sensitive_markers', 'helpful_votes',
            'took_this_course', 'created_at', 'report_count',
        )
        read_only_fields = ('id', 'helpful_votes', 'created_at', 'report_count')

    def get_author_name(self, obj):
        if obj.is_anonymous:
            return 'Anonymous'
        return obj.author.username

    def get_report_count(self, obj):
        return obj.reports.count()

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('id', 'review', 'reason', 'status', 'created_at')
        read_only_fields = ('id', 'review', 'status', 'created_at')

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)


class AdminReportSerializer(serializers.ModelSerializer):
    review_text   = serializers.CharField(source='review.text', read_only=True)
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)

    class Meta:
        model = Report
        fields = ('id', 'review', 'review_text', 'reporter_name', 'reason', 'status', 'created_at')
