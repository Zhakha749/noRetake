from django.contrib import admin
from django.db.models import Count
from .models import Subject
from apps.materials.models import StudyMaterial
from apps.courses.models import CourseInstance


# ── Inlines ───────────────────────────────────────────────────────────────────

class StudyMaterialInline(admin.TabularInline):
    model = StudyMaterial
    extra = 0
    fields = ['title', 'type', 'status', 'contributor']
    readonly_fields = ['title', 'type', 'status', 'contributor']
    can_delete = False
    show_change_link = True
    verbose_name_plural = 'Study Materials (Approved)'

    def get_queryset(self, request):
        return super().get_queryset(request).filter(status='approved')


class CourseInstanceInline(admin.TabularInline):
    model = CourseInstance
    extra = 0
    fields = ['teacher', 'year_interval', 'role']
    readonly_fields = ['teacher', 'year_interval', 'role']
    can_delete = False
    show_change_link = True
    verbose_name_plural = 'Course Instances (Teachers)'


# ── ModelAdmin ────────────────────────────────────────────────────────────────

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'credits', 'teacher_count', 'material_count']
    list_filter = ['category', 'credits']
    search_fields = ['title', 'description']
    inlines = [CourseInstanceInline, StudyMaterialInline]
    list_per_page = 30

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _teacher_count=Count('course_instances__teacher', distinct=True),
            _material_count=Count('materials', distinct=True),
        )

    @admin.display(description='Teachers', ordering='_teacher_count')
    def teacher_count(self, obj):
        return obj._teacher_count

    @admin.display(description='Materials', ordering='_material_count')
    def material_count(self, obj):
        return obj._material_count
