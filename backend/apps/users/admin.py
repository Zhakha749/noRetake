from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.db.models import Count
from .models import Student


# ── Actions ───────────────────────────────────────────────────────────────────

@admin.action(description='Verify selected students (set is_verified=True)')
def verify_students(modeladmin, request, queryset):
    queryset.update(is_verified=True)


@admin.action(description='Deactivate selected students')
def deactivate_students(modeladmin, request, queryset):
    queryset.update(is_active=False)


# ── ModelAdmin ────────────────────────────────────────────────────────────────

@admin.register(Student)
class StudentAdmin(UserAdmin):
    list_display = [
        'university_email', 'username', 'is_verified', 'karma',
        'review_count', 'material_count', 'is_staff', 'date_joined',
    ]
    list_filter = ['is_verified', 'is_staff', 'is_active']
    search_fields = ['university_email', 'username']
    readonly_fields = ['date_joined', 'last_login']
    date_hierarchy = 'date_joined'
    actions = [verify_students, deactivate_students]
    list_per_page = 30

    fieldsets = UserAdmin.fieldsets + (
        ('KBTU Info', {'fields': ('university_email', 'is_verified', 'karma')}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _review_count=Count('reviews', distinct=True),
            _material_count=Count('materials', distinct=True),
        )

    @admin.display(description='Reviews', ordering='_review_count')
    def review_count(self, obj):
        return obj._review_count

    @admin.display(description='Materials', ordering='_material_count')
    def material_count(self, obj):
        return obj._material_count
