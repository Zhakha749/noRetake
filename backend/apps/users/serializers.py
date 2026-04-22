from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Student


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Student
        fields = ('username', 'university_email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if not attrs['university_email'].endswith('@kbtu.kz'):
            raise serializers.ValidationError({'university_email': 'Only @kbtu.kz emails are allowed.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = Student.objects.create_user(
            username=validated_data['username'],
            university_email=validated_data['university_email'],
            password=validated_data['password'],
        )
        return user


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'username', 'university_email', 'is_verified', 'karma', 'is_staff')
        read_only_fields = ('id', 'is_verified', 'karma', 'is_staff')
