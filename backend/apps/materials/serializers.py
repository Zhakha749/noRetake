from rest_framework import serializers
from .models import StudyMaterial


class StudyMaterialSerializer(serializers.ModelSerializer):
    contributor_name = serializers.CharField(source='contributor.username', read_only=True)
    contributor_karma = serializers.IntegerField(source='contributor.karma', read_only=True)

    class Meta:
        model = StudyMaterial
        fields = (
            'id', 'title', 'link', 'file', 'type', 'status',
            'subject', 'contributor_name', 'contributor_karma', 'created_at',
        )
        read_only_fields = ('id', 'status', 'created_at', 'contributor_name', 'contributor_karma')

    def create(self, validated_data):
        validated_data['contributor'] = self.context['request'].user
        return super().create(validated_data)


class AdminStudyMaterialSerializer(serializers.ModelSerializer):
    contributor_name = serializers.CharField(source='contributor.username', read_only=True)
    subject_title = serializers.CharField(source='subject.title', read_only=True)

    class Meta:
        model = StudyMaterial
        fields = (
            'id', 'title', 'link', 'file', 'type', 'status',
            'subject_title', 'contributor_name', 'created_at',
        )
