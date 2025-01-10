from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.SessionListView.as_view(), name='session-list'),
    path('sessions/<str:access_code>/', views.SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<str:access_code>/users/', views.UserListView.as_view(), name='user-list'),
    path('sessions/<str:access_code>/cards/', views.CardListView.as_view(), name='card-list'),
    path('sessions/<str:access_code>/votes/', views.VoteListView.as_view(), name='vote-list'),
]