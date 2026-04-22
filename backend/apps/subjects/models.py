import statistics
from django.db import models


class Subject(models.Model):
    CATEGORY_CHOICES = [
        ('mandatory', 'Mandatory'),
        ('elective', 'Elective'),
        ('major', 'Major'),
        ('minor', 'Minor'),
        ('profile', 'Profile'),
    ]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    credits = models.IntegerField()
    description = models.TextField()

    def __str__(self):
        return self.title

    @property
    def overall_difficulty(self):
        from apps.reviews.models import Review
        ratings = list(
            Review.objects.filter(
                course_instance__subject=self,
                is_hidden=False
            ).values_list('difficulty_rating', flat=True)
        )
        if not ratings:
            return 0
        return round(sum(ratings) / len(ratings), 1)

    @property
    def teacher_dependency_ratio(self):
        from apps.reviews.models import Review
        from apps.courses.models import CourseInstance
        instances = CourseInstance.objects.filter(subject=self)
        per_teacher = []
        for ci in instances:
            ratings = list(
                Review.objects.filter(
                    course_instance=ci, is_hidden=False
                ).values_list('difficulty_rating', flat=True)
            )
            if ratings:
                per_teacher.append(sum(ratings) / len(ratings))
        if len(per_teacher) < 2:
            return 0
        return round(statistics.stdev(per_teacher), 2)
