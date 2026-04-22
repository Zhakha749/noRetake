from django.urls import path, include

urlpatterns = [
    path('auth/', include('apps.users.urls')),
    path('teachers/', include('apps.teachers.urls')),
    path('subjects/', include('apps.subjects.urls')),
    path('course-instances/', include('apps.courses.urls')),
    path('reviews/', include('apps.reviews.urls')),
    path('materials/', include('apps.materials.urls')),
    path('admin/', include('apps.users.admin_urls')),
]
