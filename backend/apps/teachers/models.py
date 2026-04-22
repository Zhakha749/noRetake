from django.db import models


class Teacher(models.Model):
    AGE_RANGES = [
        ('20-30', '20-30'),
        ('30-40', '30-40'),
        ('40-50', '40-50'),
        ('50-60', '50-60'),
        ('60+', '60+'),
    ]

    full_name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to='teachers/', blank=True)
    description = models.TextField()
    age_range = models.CharField(max_length=10, choices=AGE_RANGES)
    is_verified = models.BooleanField(default=True)
    gender_bias_score = models.DecimalField(max_digits=3, decimal_places=1, default=0)

    def __str__(self):
        return self.full_name

    def get_average_ratings(self):
        from apps.reviews.models import Review
        reviews = Review.objects.filter(
            course_instance__teacher=self,
            is_hidden=False
        )
        if not reviews.exists():
            return {'clarity': 0, 'objectivity': 0, 'accessibility': 0, 'workload': 0, 'overall': 0}

        count = reviews.count()
        return {
            'clarity': round(sum(r.clarity_rating for r in reviews) / count, 1),
            'objectivity': round(sum(r.objectivity_rating for r in reviews) / count, 1),
            'accessibility': round(sum(r.accessibility_rating for r in reviews) / count, 1),
            'workload': round(sum(r.workload_rating for r in reviews) / count, 1),
            'overall': round(sum(r.rating for r in reviews) / count, 1),
        }

    def get_teaching_history(self):
        from apps.courses.models import CourseInstance
        instances = CourseInstance.objects.filter(teacher=self).select_related('subject')
        seen = set()
        history = []
        for ci in instances:
            key = (ci.year_interval, ci.subject.title, ci.role)
            if key not in seen:
                seen.add(key)
                history.append({
                    'year_interval': ci.year_interval,
                    'subject_name': ci.subject.title,
                    'role': ci.role,
                    'course_instance_id': ci.id,
                })
        return history
