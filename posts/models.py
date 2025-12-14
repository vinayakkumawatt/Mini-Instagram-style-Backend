from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    bio = models.TextField(max_length=500, blank = True)
    profile_picture = models.URLField(blank= True)
    created_at = models.DateTimeField(auto_now_add = True)

    def __str__(self):
        return self.username

class Follow(models.Model):
    follower = models.ForeignKey(User, related_name = 'following', on_delete = models.CASCADE)
    following = models.ForeignKey(User, related_name = 'followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add = True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class Post(models.Model):
    user = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE)
    image_url = models.URLField(blank=True, null=True)  # ✅ FIX
    caption = models.TextField(max_length=2200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.user.username} at {self.created_at}"
    
class Like(models.Model):
    user  = models.ForeignKey(User, related_name='user_likes', on_delete=models.CASCADE)
    post = models.ForeignKey(Post, related_name = 'likes', on_delete= models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        
    def __str__(self):
        return f"{self.user.username} likes post {self.post.id}"
    
class Comment(models.Model):
    user = models.ForeignKey(User, related_name='user_comments', on_delete = models.CASCADE)
    post = models.ForeignKey(Post, related_name = 'comments', on_delete= models.CASCADE)
    text = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add = True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on post {self.post.id}"
    