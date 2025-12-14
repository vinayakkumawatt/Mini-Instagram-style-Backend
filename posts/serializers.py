from rest_framework import serializers
from .models import User, Post, Comment, Like

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_picture']
    
class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source = 'user.username', read_only= True)
    user_id = serializers.IntegerField(source = 'user.id', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user_id', 'username', 'text', 'created_at']
class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'id',
            'user_id',
            'username',
            'image_url',
            'caption',
            'likes_count',
            'comments_count',
            'is_liked',
            'comments',
            'created_at'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False