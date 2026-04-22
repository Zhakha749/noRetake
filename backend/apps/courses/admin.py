from django.contrib import admin
from django.db.models import Count, Avg
from .models import CourseInstance, SyllabusVersion
from apps.reviews.models import Review


# ── Inlines ───────────────────────────────────────────────────────────────────

class SyllabusVersionInline(admin.TabularInline):
    model = CourseInstance.syllabus_history.through
    extra = 0
    verbose_name = 'Syllabus Version'
    verbose_name_plural = 'Syllabus History'


class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    fields = ['author', 'rating', 'difficulty_rating', 'is_hidden', 'created_at']
    readonly_fields = ['author', 'rating', 'difficulty_rating', 'is_hidden', 'created_at']
    can_delete = False
    show_change_link = True
    verbose_name_plural = 'Recent Reviews (latest 10)'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Only show 10 most recent to keep the inline fast
        ids = list(qs.order_by('-created_at').values_list('pk', flat=True)[:10])
        return qs.filter(pk__in=ids)


# ── Actions ───────────────────────────────────────────────────────────────────

@admin.action(description='Duplicate selected instances with year 2025–2027')
def duplicate_instances(modeladmin, request, queryset):
    for ci in queryset:
        ci.pk = None
        ci.year_interval = '2025–2027'
        ci.save()


# ── ModelAdmins ───────────────────────────────────────────────────────────────

@admin.register(SyllabusVersion)
class SyllabusVersionAdmin(admin.ModelAdmin):
    list_display = ['year', 'uploaded_by', 'uploaded_at', 'linked_courses']
    list_filter = ['year']
    readonly_fields = ['uploaded_at']
    date_hierarchy = 'uploaded_at'

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_linked=Count('courseinstance'))

    @admin.display(description='Linked Courses', ordering='_linked')
    def linked_courses(self, obj):
        return obj._linked


@admin.register(CourseInstance)
class CourseInstanceAdmin(admin.ModelAdmin):
    list_display = [
        'subject', 'teacher', 'year_interval', 'role',
        'review_count', 'avg_rating',
    ]
    list_filter = ['role', 'year_interval', 'subject__category']
    search_fields = ['subject__title', 'teacher__full_name']
    filter_horizontal = ['syllabus_history']
    list_select_related = ['subject', 'teacher']
    actions = [duplicate_instances]
    inlines = [ReviewInline]
    list_per_page = 30

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _review_count=Count('reviews', distinct=True),
            _avg_rating=Avg('reviews__rating'),
        )

    @admin.display(description='Reviews', ordering='_review_count')
    def review_count(self, obj):
        return obj._review_count

    @admin.display(description='Avg Rating', ordering='_avg_rating')
    def avg_rating(self, obj):
        val = obj._avg_rating
        return f'{val:.1f}' if val is not None else '—'
