# Mini Instagram Style Backend

This is a Mini Instagram clone built using **Django REST Framework** for the backend and **Vanilla JavaScript, HTML, and CSS** for the frontend.  
The project implements core social media features such as authentication, posting images via URLs, likes, comments, follow/unfollow system, profile pages, search functionality, and an admin panel.
---
## Features
- User authentication
- Create posts with image URL and caption
- Like and comment on posts
- Follow and unfollow users
- User profile pages
- Search users
- Admin panel for managing data

## Requirements
- Python
- Django
- Django REST Framework
- Web browser

## How to Run the Project

### 1. Run Backend Server
Open a terminal and run:
py manage.py runserver

Backend will start at:
http://127.0.0.1:8000/

### 2. Run frontend server
Open another terminal (keep backend running):
cd frontend
python -m http.server 3000

Frontend will open at:
http://127.0.0.1:3000/

## Admin Panel
Admin panel is available at:
http://127.0.0.1:8000/admin
(username and password is attachd in file named as user)
