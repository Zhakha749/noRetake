from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError


def validate_kbtu_email(value):
    if not value.endswith('@kbtu.kz'):
        raise ValidationError('Only @kbtu.kz email addresses are allowed.')


class Student(AbstractUser):
    university_email = models.EmailField(unique=True, validators=[validate_kbtu_email])
    is_verified = models.BooleanField(default=False)
    karma = models.IntegerField(default=0)

    USERNAME_FIELD = 'university_email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.university_email
