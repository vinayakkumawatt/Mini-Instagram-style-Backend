from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import  make_password
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db.models import Count, Q
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import User, Post, Like, Comment, Follow
from .serializers import UserSerializer, PostSerializer, CommentSerializer
import json

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])

def signup(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not password:
            return JsonResponse({'error': 'Username and passsword required'}, status = 400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error':'Username already exists'}, status=400)
        
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password)
        )

        token, _ = Token.objects.get_or_create(user = user)

        return JsonResponse({
            'message' : 'User created sucessfully',
            'token' : token.key,
            'user':{
                'id':user.id,
                'username':user.username,
                'email':user.email
            }
        }, status= 201)
    except Exception as e:
        return JsonResponse({'error':str(e)},status=500)
    
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        user = authenticate(username=username, password = password)

        if user is None:
            return JsonResponse({'error':'Invalid Credentials'}, status=401)
        
        token, _ = Token.objects.get_or_create(user=user)

        return JsonResponse({
            'message':'Login successfull',
            'token': token.key,
            'user':{
                'id':user.id,
                'username':user.username,
                'email' : user.email
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)},status = 500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    try:
        user_to_follow = User.objects.get(id=user_id)

        if request.user.id == user_id:
            return Response({'error':'Cannot follow yourself'}, status = 400)

        follow, created = Follow.objects.get_or_create(
            follower = request.user,
            following = user_to_follow
        )   

        if not created:
            return Response({'message':'Already following'}, status = 400)
        
        return Response({'message':f'followed {user_to_follow.username}'})
    except User.DoesNotExist:
        return Response({'error':'User not found'}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, user_id):
    try:
        user_to_unfollow = User.objects.get(id=user_id)

        follow = Follow.objects.filter(
            follower=request.user,
            following= user_to_unfollow
        ).first()

        if not follow:
            return Response({'error': 'Not following this user'}, status=400)
        follow.delete()
        return Response({'message':f'Succesfully unfollowed {user_to_unfollow.username}'})
    except User.DoesNotExist:
        return Response({'error': 'User not found '}, status = 404)
    
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    print("AUTH HEADER:", request.headers.get("Authorization"))
    print("USER:", request.user)
    try:
        data = request.data
        image_url = data.get('image_url')
        caption = data.get('caption')
        

        if not image_url:
            return Response({'error': 'Image URL required'}, status=400)
        
        post = Post.objects.create(
            user = request.user,
            image_url = image_url,
            caption = caption or ''
        )

        serializer = PostSerializer(post, context={'request':request})
        return Response({
            'message':'Post created succesfully',
            'post': serializer.data
        },status = 201)
    except Exception as e:
        return Response({'error':str(e)}, status = 500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_feed(request):
    try:
        following_user=Follow.objects.filter(
            follower=request.user
        ).values_list('following', flat=True)

        posts = Post.objects.filter(
            Q(user__in = following_user) | Q(user=request.user)
        ).select_related('user').prefetch_related('likes','comments')

        serializer = PostSerializer(posts,many = True, context = {'request': request})
        return Response({'posts': serializer.data})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_post(request, post_id):
    try: 
        post= Post.objects.get(id=post_id)
        serializer = PostSerializer(post, context = {'request':request})
        return Response({'post':serializer.data})
    except Post.DoesNotExist:
        return Response({'error':'Post not found'},status=404)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if not created:
            return Response({'message':'Already liked'}, status=400)
        
        return Response({
            'message':'Post liked',
            'likes_count': post.likes.count()
        })
    except Post.DoesNotExist:
        return Response({'error':'Post not found'}, status= 404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])

def unlike_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        like  = Like.objects.filter(user=request.user, post=post).first()

        if not like:
            return Response({'error':'Post not liked'},status=400)
        
        like.delete()
        return Response({
            'message':'Post unliked',
            'likes count':post.likes.count()
        })
    except Post.DoesNotExist:
        return Response({'error':'Post not found'},status=404)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_comment(request, post_id):
    try:
        post = Post.objects.get(id =post_id)
        text = request.data.get('text')

        if not text:
            return Response({'error':'Comment text is required'}, status=400)
        
        comment = Comment.objects.create(
            user = request.user,
            post= post,
            text=text
        )

        serializer = CommentSerializer(comment)
        return Response({
            'message':'Comment added',
            'comment': serializer.data
        }, status=201)
    except Post.DoesNotExist:
        return Response({'error':'Post not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request, username):
    try:
        user = User.objects.get(username=username)
        posts = Post.objects.filter(user=user)

        followers_count = user.followers.count()
        following_count = user.following.count()
        is_following = Follow.objects.filter(
            follower = request.user,
            following = user
        ).exists()

        post_serializer = PostSerializer(posts, many = True, context = {'request':request})

        return Response({
            'user': {
                'id':user.id,
                'username': user.username,
                'bio':user.bio,
                'profile_picture':user.profile_picture,
                'followers_count':followers_count,
                'following_count':following_count,
                'is_following':is_following,
                'is_own_profile': request.user.id == user.id
            },
            'posts':post_serializer.data
        })
    except User.DoesNotExist:
        return Response({'error':'User not found'}, status=404)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.GET.get('q', '').strip()

    if not query:
        return Response({'users':[]})
    users = User.objects.filter(
        username__icontains = query
    ).exclude(id=request.user.id)[:10]

    data = [
        {
            'id':user.id,
            'username':user.username,
            'profile_picture':user.profile_picture

        }
        for user in users
    ]
    return Response({'users':data})