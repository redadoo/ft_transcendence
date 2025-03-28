from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('django_prometheus.urls')),
    path('', include("authentication.urls")),
    path('', include("pong.urls")),
    path('', include("liarsbar.urls")),
    path('', include("social.urls")),
    path('', include("website.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
 