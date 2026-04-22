from django.db import models


class SyllabusVersion(models.Model):
    file = models.FileField(upload_to='syllabi/')
    year = models.IntegerField()
    uploaded_by = models.ForeignKey(
        'users.Student', null=True, blank=True, on_delete=models.SET_NULL
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Syllabus {self.year} (uploaded {self.uploaded_at.date()})"


class CourseInstance(models.Model):
    ROLE_CHOICES = [
        ('Lecturer', 'Lecturer'),
        ('Practice', 'Practice'),
        ('Labs', 'Labs'),
        ('All', 'All'),
    ]

    teacher = models.ForeignKey(
        'teachers.Teacher', on_delete=models.CASCADE, related_name='course_instances'
    )
    subject = models.ForeignKey(
        'subjects.Subject', on_delete=models.CASCADE, related_name='course_instances'
    )
    year_interval = models.CharField(max_length=20)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Lecturer')
    grading_policy = models.TextField()
    weekly_plan = models.JSONField(default=list)
    grade_distribution = models.JSONField(default=dict)
    syllabus_history = models.ManyToManyField(SyllabusVersion, blank=True)

    def __str__(self):
        return f"{self.subject.title} — {self.teacher.full_name} ({self.year_interval})"
