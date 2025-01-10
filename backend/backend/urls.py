from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/voting/', include('voting.urls')),  # Include voting app URLs
]