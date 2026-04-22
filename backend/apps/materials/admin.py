from django.contrib import admin
from .models import StudyMaterial


# ── Actions ───────────────────────────────────────────────────────────────────

@admin.action(description='Approve selected materials (+5 karma to contributor)')
def approve_materials(modeladmin, request, queryset):
    for material in queryset.filter(status__in=['pending', 'rejected']):
        material.status = 'approved'
        material.save()   # triggers karma award in model.save()


@admin.action(description='Reject selected materials')
def reject_materials(modeladmin, request, queryset):
    queryset.update(status='rejected')


# ── ModelAdmin ────────────────────────────────────────────────────────────────

@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'status_badge', 'subject', 'contributor', 'karma_display', 'created_at']
    list_filter = ['status', 'type', 'subject__category']
    search_fields = ['title', 'contributor__username', 'subject__title']
    readonly_fields = ['contributor', 'created_at']
    date_hierarchy = 'created_at'
    actions = [approve_materials, reject_materials]
    list_per_page = 30
    list_select_related = ['contributor', 'subject']

    @admin.display(description='Status')
    def status_badge(self, obj):
        icons = {'pending': '⏳', 'approved': '✅', 'rejected': '❌'}
        return f"{icons.get(obj.status, '')} {obj.get_status_display()}"

    @admin.display(description='Contributor Karma')
    def karma_display(self, obj):
        return obj.contributor.karma
