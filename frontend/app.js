
const API_URL = 'http://127.0.0.1:8000/api';


let state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    currentPage: 'feed'
};

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    if (!state.token) {
        showAuth();
        return;
    }

    showApp();

    const savedPage = localStorage.getItem('currentPage') || 'feed';
    navigateTo(savedPage); 
});


function setupEventListeners() {
   
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('toggleAuth').addEventListener('click', toggleAuthMode);
    
   
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(e.target.dataset.page);
        });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    
    document.getElementById('createPostForm').addEventListener('submit', handleCreatePost);
    document.getElementById('postImageUrl').addEventListener('input', previewImage);
    

    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.id === 'postModal') closeModal();
    });
}


async function handleAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    const isSignup = document.getElementById('email').style.display !== 'none';
    
    const endpoint = isSignup ? 'signup' : 'login';
    const body = isSignup ? { username, email, password } : { username, password };
    
    try {
        const response = await fetch(`${API_URL}/${endpoint}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            state.token = data.token;
            state.user = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showApp();
            navigateTo('feed');
            loadFeed();
        } else {
            showError('authError', data.error || 'Authentication failed');
        }
    } catch (error) {
        showError('authError', 'Network error. Please try again.');
    }
}

function toggleAuthMode(e) {
    e.preventDefault();
    const emailInput = document.getElementById('email');
    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('toggleText');
    const toggleLink = document.getElementById('toggleAuth');
    
    if (emailInput.style.display === 'none') {
        emailInput.style.display = 'block';
        title.textContent = 'Sign up for Mini Instagram';
        submitBtn.textContent = 'Sign up';
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Log in';
    } else {
        emailInput.style.display = 'none';
        title.textContent = 'Login to Mini Instagram';
        submitBtn.textContent = 'Login';
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign up';
    }
    
    document.getElementById('authError').textContent = '';
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    state.token = null;
    state.user = null;
    showAuth();
}

function showAuth() {
    document.getElementById('authPage').classList.add('active');
    document.getElementById('feedPage').classList.remove('active');
    document.getElementById('createPage').classList.remove('active');
    document.getElementById('profilePage').classList.remove('active');
    document.getElementById('navbar').style.display = 'none';
}

function showApp() {
    document.getElementById('authPage').classList.remove('active');
    document.getElementById('navbar').style.display = 'block';
}

function navigateTo(page) {
    state.currentPage = page;
    localStorage.setItem('currentPage', page); 

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (page === 'feed') {
        document.getElementById('feedPage').classList.add('active');
        loadFeed();
    } 
    else if (page === 'create') {
        document.getElementById('createPage').classList.add('active');
    } 
    else if (page === 'profile') {
        document.getElementById('profilePage').classList.add('active');
        loadProfile(state.user.username);
    }
}

async function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    feedContainer.innerHTML = '<p class="loading">Loading feed...</p>';
    
    try {
        const response = await fetch(`${API_URL}/posts/feed/`, {
            headers: {
                'Authorization': `Token ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.posts.length === 0) {
                feedContainer.innerHTML = '<p class="loading">No posts yet. Follow some users to see their posts!</p>';
            } else {
                feedContainer.innerHTML = data.posts.map(post => createPostCard(post)).join('');
                attachPostEventListeners();
            }
        }
    } catch (error) {
        feedContainer.innerHTML = '<p class="loading">Error loading feed</p>';
    }
}

function createPostCard(post) {
    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <span class="post-username">${post.username}</span>
            </div>
            <img src="${post.image_url}" alt="Post" class="post-image">
            <div class="post-actions">
                <div class="action-buttons">
                    <button class="action-btn like-btn ${post.is_liked ? 'liked' : ''}" data-post-id="${post.id}">
                        ${post.is_liked ? '❤️' : '🤍'}
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}">💬</button>
                </div>
                <div class="post-stats">
                    <span class="likes-count">${post.likes_count} likes</span>
                    <span class="comments-count">${post.comments_count} comments</span>
                </div>
                <div class="post-caption">
                    <span class="username">${post.username}</span>
                    ${post.caption}
                </div>
                <div class="comments-section">
                    ${post.comments.slice(0, 2).map(comment => `
                        <div class="comment">
                            <span class="username">${comment.username}</span>
                            ${comment.text}
                        </div>
                    `).join('')}
                    ${post.comments.length > 2 ? `<p style="color: #8e8e8e; font-size: 14px; cursor: pointer;" class="view-all" data-post-id="${post.id}">View all ${post.comments_count} comments</p>` : ''}
                </div>
                <div class="comment-form">
                    <input type="text" class="comment-input" placeholder="Add a comment..." data-post-id="${post.id}">
                    <button class="comment-btn post-comment" data-post-id="${post.id}">Post</button>
                </div>
            </div>
        </div>
    `;
}

function attachPostEventListeners() {
    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLike);
    });
    
    // Comment buttons
    document.querySelectorAll('.post-comment').forEach(btn => {
        btn.addEventListener('click', handleComment);
    });
    
    // View all comments
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            openPostDetail(e.target.dataset.postId);
        });
    });
    
    // Post images
    document.querySelectorAll('.post-image').forEach(img => {
        img.addEventListener('click', (e) => {
            const postCard = e.target.closest('.post-card');
            openPostDetail(postCard.dataset.postId);
        });
    });
}

async function handleLike(e) {
    const postId = e.target.dataset.postId;
    const isLiked = e.target.classList.contains('liked');
    const endpoint = isLiked ? 'unlike' : 'like';
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/${endpoint}/`, {
            method: isLiked ? 'DELETE' : 'POST',
            headers: {
                'Authorization': `Token ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            e.target.classList.toggle('liked');
            e.target.textContent = isLiked ? '🤍' : '❤️';
            
            const postCard = e.target.closest('.post-card');
            postCard.querySelector('.likes-count').textContent = `${data.likes_count} likes`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleComment(e) {
    const postId = e.target.dataset.postId;
    const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comment/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (response.ok) {
            input.value = '';
            loadFeed(); t
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


function previewImage() {
    const url = document.getElementById('postImageUrl').value;
    const preview = document.getElementById('imagePreview');
    
    if (url) {
        preview.innerHTML = `<img src="${url}" alt="Preview">`;
    } else {
        preview.innerHTML = '';
    }
}

async function handleCreatePost(e) {
    e.preventDefault();
    
    const imageUrl = document.getElementById('postImageUrl').value;
    const caption = document.getElementById('postCaption').value;
    
    try {
        const response = await fetch(`${API_URL}/posts/create/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_url: imageUrl,
                caption: caption
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('createPostForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            navigateTo('feed');
            loadFeed();
        } else {
            showError('createError', data.error || 'Failed to create post');
        }
    } catch (error) {
        showError('createError', 'Network error. Please try again.');
    }
}

// Profile Functions
async function loadProfile(username) {
    try {
        const response = await fetch(`${API_URL}/profile/${username}/`, {
            headers: {
                'Authorization': `Token ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayProfile(data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayProfile(data) {
    document.getElementById('profileUsername').textContent = data.user.username;
    document.getElementById('postsCount').textContent = data.posts.length;
    document.getElementById('followersCount').textContent = data.user.followers_count;
    document.getElementById('followingCount').textContent = data.user.following_count;
    
    const followBtn = document.getElementById('followBtn');
    if (data.user.is_own_profile) {
        followBtn.style.display = 'none';
    } else {
        followBtn.style.display = 'block';
        followBtn.textContent = data.user.is_following ? 'Unfollow' : 'Follow';
        followBtn.className = data.user.is_following ? 'unfollow' : 'follow';
        followBtn.onclick = () => handleFollow(data.user.id, data.user.is_following);
    }
    
    const postsContainer = document.getElementById('profilePosts');
    postsContainer.innerHTML = data.posts.map(post => `
        <div class="profile-post" data-post-id="${post.id}">
            <img src="${post.image_url}" alt="Post">
        </div>
    `).join('');
    
    document.querySelectorAll('.profile-post').forEach(post => {
        post.addEventListener('click', () => {
            openPostDetail(post.dataset.postId);
        });
    });
}

async function handleFollow(userId, isFollowing) {
    const endpoint = isFollowing ? 'unfollow' : 'follow';
    
    try {
        const response = await fetch(`${API_URL}/${endpoint}/${userId}/`, {
            method: isFollowing ? 'DELETE' : 'POST',
            headers: {
                'Authorization': `Token ${state.token}`
            }
        });
        
        if (response.ok) {
            loadProfile(document.getElementById('profileUsername').textContent);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Modal Functions
async function openPostDetail(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/`, {
            headers: {
                'Authorization': `Token ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayPostDetail(data.post);
            document.getElementById('postModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayPostDetail(post) {
    const detailContainer = document.getElementById('postDetail');
    detailContainer.innerHTML = createPostCard(post);
    attachPostEventListeners();
}

function closeModal() {
    document.getElementById('postModal').classList.remove('active');
}


function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    setTimeout(() => {
        errorElement.textContent = '';
    }, 5000);
}

const searchInput = document.getElementById('userSearchInput');
const searchResults = document.getElementById('searchResults');
const searchBtn = document.getElementById('searchBtn');

searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    if (query.length === 0) {
        searchResults.innerHTML = '';
        return;
    }

    const response = await fetch(`${API_URL}/users/search/?q=${query}`,{
        headers: {
            'Authorization' : `Token ${state.token}`
        }
    });

    const data = await response.json();

    searchResults.innerHTML = data.users.map(user =>`
        <div class = "search-item" onclick = "openUserProfile('${user.username}')">
        <strong>${user.username}</strong>
        </div>
        `).join('');
});

function openUserProfile(username) {
    searchResults.innerHTML = '';
    searchInput.value = '';
    navigateTo('profile');
    loadProfile(username);
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    const response = await fetch(`${API_URL}/users/search/?q=${query}`, {
        headers: {
            'Authorization': `Token ${state.token}`
        }
    });

    const data = await response.json();

    searchResults.innerHTML = data.users.map(user => `
        <div class="search-item" onclick="openUserProfile('${user.username}')">
            <strong>${user.username}</strong>
        </div>
    `).join('');
}

document.getElementById('searchBtn').addEventListener('click', performSearch);