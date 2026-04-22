from django.contrib import admin
from django.db.models import Count, Avg
from .models import Teacher
from apps.courses.models import CourseInstance


# ── Inlines ───────────────────────────────────────────────────────────────────

class CourseInstanceInline(admin.TabularInline):
    model = CourseInstance
    extra = 0
    fields = ['subject', 'year_interval', 'role']
    readonly_fields = ['subject', 'year_interval', 'role']
    can_delete = False
    show_change_link = True
    verbose_name_plural = 'Course Instances'


# ── Actions ───────────────────────────────────────────────────────────────────

@admin.action(description='Mark selected teachers as verified')
def verify_teachers(modeladmin, request, queryset):
    queryset.update(is_verified=True)


@admin.action(description='Unverify selected teachers')
def unverify_teachers(modeladmin, request, queryset):
    queryset.update(is_verified=False)


# ── ModelAdmin ────────────────────────────────────────────────────────────────

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'age_range', 'is_verified',
        'gender_bias_score', 'course_count', 'avg_rating',
    ]
    list_filter = ['age_range', 'is_verified']
    search_fields = ['full_name', 'description']
    readonly_fields = ['gender_bias_score']
    actions = [verify_teachers, unverify_teachers]
    inlines = [CourseInstanceInline]
    list_per_page = 30

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _course_count=Count('course_instances', distinct=True),
            _avg_rating=Avg('course_instances__reviews__rating'),
        )

    @admin.display(description='Courses', ordering='_course_count')
    def course_count(self, obj):
        return obj._course_count

    @admin.display(description='Avg Rating', ordering='_avg_rating')
    def avg_rating(self, obj):
        val = obj._avg_rating
        return f'{val:.1f}' if val is not None else '—'
