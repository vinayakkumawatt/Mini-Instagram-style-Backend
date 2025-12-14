from django.urls import path 
from . import views
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path ('api/signup/', views.signup, name='signup'),
    path('api/login/', views.login, name = 'login'),

    path('api/follow/<int:user_id>/', views.follow_user, name='folow_user'),
    path('api/unfollow/<int:user_id>/', views.unfollow_user, name='unfolow_user'),
    path('api/posts/create/', views.create_post, name='create_post'),
    path('api/posts/feed/', views.get_feed, name='get_feed'),
    path('api/posts/<int:post_id>/', views.get_post, name='get_post'),
    path('api/posts/<int:post_id>/like/', views.like_post, name='like_post'),
    path('api/posts/<int:post_id>/unlike/', views.unlike_post, name='unlike_post'),
    path('api/posts/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('api/profile/<str:username>/', views.get_profile, name='get_profile'),
    path('api/users/search/',views.search_users, name='search_users'),


]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)