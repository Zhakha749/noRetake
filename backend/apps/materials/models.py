from django.db import models
from django.core.validators import URLValidator


class StudyMaterial(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]
    TYPE_CHOICES = [
        ('lecture', 'Lecture Notes'),
        ('exam', 'Past Exams'),
        ('book', 'Book/Reference'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    link = models.URLField(blank=True, validators=[URLValidator()])
    file = models.FileField(upload_to='materials/', blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subject = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE, related_name='materials')
    contributor = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='materials')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.type})"

    def save(self, *args, **kwargs):
        if self.pk:
            old = StudyMaterial.objects.filter(pk=self.pk).first()
            if old and old.status != 'approved' and self.status == 'approved':
                self.contributor.karma += 5
                self.contributor.save(update_fields=['karma'])
        super().save(*args, **kwargs)
