from django.contrib import admin
from django.db.models import Count
from .models import Review, Report


# ── Actions ───────────────────────────────────────────────────────────────────

@admin.action(description='Hide selected reviews')
def hide_reviews(modeladmin, request, queryset):
    queryset.update(is_hidden=True)


@admin.action(description='Unhide selected reviews')
def unhide_reviews(modeladmin, request, queryset):
    queryset.update(is_hidden=False)


@admin.action(description='Resolve all open reports for selected reviews')
def resolve_reports(modeladmin, request, queryset):
    Report.objects.filter(review__in=queryset, status='open').update(status='resolved')


# ── Inlines ───────────────────────────────────────────────────────────────────

class ReportInline(admin.TabularInline):
    model = Report
    extra = 0
    readonly_fields = ['reporter', 'reason', 'status', 'created_at']
    can_delete = False
    show_change_link = True


# ── ModelAdmins ───────────────────────────────────────────────────────────────

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'author_display', 'course_instance', 'rating', 'difficulty_rating',
        'is_hidden', 'is_anonymous', 'took_this_course', 'report_count', 'created_at',
    ]
    list_filter = ['is_hidden', 'is_anonymous', 'took_this_course', 'created_at']
    search_fields = ['author__username', 'author__university_email', 'text']
    readonly_fields = ['author', 'course_instance', 'created_at', 'helpful_votes']
    date_hierarchy = 'created_at'
    actions = [hide_reviews, unhide_reviews, resolve_reports]
    inlines = [ReportInline]
    list_per_page = 30

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_report_count=Count('reports'))

    @admin.display(description='Author', ordering='author__username')
    def author_display(self, obj):
        return obj.author.username if not obj.is_anonymous else f'{obj.author.username} (anon)'

    @admin.display(description='Reports', ordering='_report_count')
    def report_count(self, obj):
        return obj._report_count


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['review_excerpt', 'reporter', 'reason_short', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['reporter__username', 'reason', 'review__text']
    readonly_fields = ['review', 'reporter', 'created_at']
    date_hierarchy = 'created_at'
    list_per_page = 30

    @admin.display(description='Review')
    def review_excerpt(self, obj):
        return obj.review.text[:60] + '…' if len(obj.review.text) > 60 else obj.review.text

    @admin.display(description='Reason')
    def reason_short(self, obj):
        return obj.reason[:60] + '…' if len(obj.reason) > 60 else obj.reason
