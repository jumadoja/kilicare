# PHASE 2.5 — RUNTIME EXECUTION PLAN

Complete step-by-step guide to test the Kilicare+ system in a real environment.

---

## TABLE OF CONTENTS

1. [Backend Setup](#1-backend-setup)
2. [Frontend Setup](#2-frontend-setup)
3. [API Testing](#3-api-testing)
4. [Auth Flow Test](#4-auth-flow-test)
5. [WebSocket Test](#5-websocket-test)
6. [Full Flow Tests](#6-full-flow-tests)
7. [Debugging Guide](#7-debugging-guide)

---

## 1. BACKEND SETUP

### 1.1 Prerequisites

- Python 3.10+
- PostgreSQL 13+ (or SQLite for development)
- Redis 6+
- Node.js 18+ (for frontend)
- pip
- npm/yarn

### 1.2 Backend Directory

```bash
cd backend
```

### 1.3 Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 1.4 Install Dependencies

```bash
pip install -r requirements.txt
```

### 1.5 Database Setup

#### Option A: PostgreSQL (Recommended for Production)

```bash
# Create database
createdb kilicare

# Or use psql
psql -U postgres
CREATE DATABASE kilicare;
\q
```

#### Option B: SQLite (Development Only)

No setup required. SQLite will be created automatically.

### 1.6 Environment Variables

Create `.env` file in `backend/` directory:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kilicare
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Database (SQLite - comment out PostgreSQL above)
# DB_ENGINE=django.db.backends.sqlite3
# DB_NAME=db.sqlite3

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Groq AI
GROQ_API_KEY=your-groq-api-key

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

### 1.7 Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 1.8 Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 1.9 Start Redis (Required for Celery)

```bash
# Windows
redis-server

# Linux/Mac
redis-server
```

### 1.10 Start Celery Worker (Required for Background Tasks)

```bash
# Terminal 1 - Celery Worker
celery -A config worker -l info

# Terminal 2 - Celery Beat (for scheduled tasks)
celery -A config beat -l info
```

### 1.11 Start Django Development Server

```bash
python manage.py runserver
```

Backend will run on: `http://localhost:8000`

API endpoint: `http://localhost:8000/api`

---

## 2. FRONTEND SETUP

### 2.1 Frontend Directory

```bash
cd frontend
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Environment Variables

Create `.env.local` file in `frontend/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/chat/

# App Configuration
NEXT_PUBLIC_APP_NAME=Kilicare+
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_IS_DEVELOPMENT=true
NEXT_PUBLIC_IS_PRODUCTION=false
NEXT_PUBLIC_DEFAULT_LANGUAGE=en

# Map Configuration
NEXT_PUBLIC_MAP_DEFAULT_LAT=-1.2921
NEXT_PUBLIC_MAP_DEFAULT_LNG=36.8219
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=13
NEXT_PUBLIC_SOS_DEFAULT_RADIUS=25
```

### 2.4 Start Next.js Development Server

```bash
npm run dev
```

Frontend will run on: `http://localhost:3000`

---

## 3. API TESTING

### 3.1 Tools

- Postman (recommended)
- Thunder Client (VS Code extension)
- curl (command line)

### 3.2 Base URL

```
http://localhost:8000/api
```

### 3.3 Auth Endpoints

#### 3.3.1 Register User

**POST** `/auth/register/`

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "role": "TOURIST",
  "profile": {
    "phone_number": "+254700000000",
    "bio": "Test user",
    "avatar": null,
    "gender": "MALE",
    "dob": "1990-01-01",
    "location": "Nairobi"
  }
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "role": "TOURIST",
  "is_verified": false,
  "profile": {
    "phone_number": "+254700000000",
    "bio": "Test user",
    "avatar": null,
    "gender": "MALE",
    "dob": "1990-01-01",
    "location": "Nairobi"
  }
}
```

**curl Command:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "TOURIST",
    "profile": {
      "phone_number": "+254700000000",
      "bio": "Test user",
      "avatar": null,
      "gender": "MALE",
      "dob": "1990-01-01",
      "location": "Nairobi"
    }
  }'
```

#### 3.3.2 Login

**POST** `/auth/login/`

**Request Body:**
```json
{
  "username": "testuser",
  "password": "SecurePass123!"
}
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "TOURIST",
    "is_verified": false
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**curl Command:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

#### 3.3.3 Get Current User (Protected)

**GET** `/auth/me/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "role": "TOURIST",
  "is_verified": false,
  "profile": {
    "phone_number": "+254700000000",
    "bio": "Test user",
    "avatar": null,
    "gender": "MALE",
    "dob": "1990-01-01",
    "location": "Nairobi"
  }
}
```

**curl Command:**
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

#### 3.3.4 Refresh Token

**POST** `/auth/refresh/`

**Request Body:**
```json
{
  "refresh": "<refresh_token>"
}
```

**Expected Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**curl Command:**
```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "<refresh_token>"
  }'
```

### 3.4 Moments Endpoints

#### 3.4.1 Get Moments

**GET** `/moments/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**
```
page=1
page_size=20
```

**Expected Response (200 OK):**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/moments/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "posted_by": 1,
      "media": "http://localhost:8000/media/moments/image1.jpg",
      "media_type": "image",
      "caption": "Beautiful sunset",
      "location": "Nairobi",
      "latitude": -1.2921,
      "longitude": 36.8219,
      "views": 150,
      "likes_count": 25,
      "comments_count": 10,
      "shares_count": 5,
      "is_liked": false,
      "is_saved": false,
      "is_verified": false,
      "is_featured": false,
      "visibility": "PUBLIC",
      "is_hidden": false,
      "content_warning": null,
      "trending_score": 45.5,
      "last_engagement": "2024-04-21T10:00:00Z",
      "created_at": "2024-04-20T10:00:00Z",
      "updated_at": "2024-04-20T10:00:00Z"
    }
  ]
}
```

**curl Command:**
```bash
curl -X GET "http://localhost:8000/api/moments/?page=1&page_size=20" \
  -H "Authorization: Bearer <access_token>"
```

#### 3.4.2 Like Moment

**POST** `/moments/{id}/like/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Moment liked successfully"
}
```

**curl Command:**
```bash
curl -X POST http://localhost:8000/api/moments/1/like/ \
  -H "Authorization: Bearer <access_token>"
```

### 3.5 Tips Endpoints

#### 3.5.1 Get Tips

**GET** `/tips/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**
```
page=1
page_size=20
```

**Expected Response (200 OK):**
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/tips/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "author": 1,
      "author_username": "localguide",
      "title": "Best places to visit in Nairobi",
      "content": "Nairobi has amazing parks...",
      "location": "Nairobi",
      "latitude": -1.2921,
      "longitude": 36.8219,
      "category": "TRAVEL",
      "subtopics": ["parks", "wildlife", "culture"],
      "upvotes": 45,
      "is_upvoted_by_user": false,
      "is_verified": true,
      "created_at": "2024-04-20T10:00:00Z",
      "updated_at": "2024-04-20T10:00:00Z"
    }
  ]
}
```

**curl Command:**
```bash
curl -X GET "http://localhost:8000/api/tips/?page=1&page_size=20" \
  -H "Authorization: Bearer <access_token>"
```

#### 3.5.2 Create Tip (Local Guide Only)

**POST** `/tips/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Best hiking trails",
  "content": "Amazing trails in the area...",
  "location": "Nairobi",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "category": "ADVENTURE",
  "subtopics": ["hiking", "nature", "trails"]
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "author": 1,
  "author_username": "localguide",
  "title": "Best hiking trails",
  "content": "Amazing trails in the area...",
  "location": "Nairobi",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "category": "ADVENTURE",
  "subtopics": ["hiking", "nature", "trails"],
  "upvotes": 0,
  "is_upvoted_by_user": false,
  "is_verified": false,
  "created_at": "2024-04-21T10:00:00Z",
  "updated_at": "2024-04-21T10:00:00Z"
}
```

**curl Command:**
```bash
curl -X POST http://localhost:8000/api/tips/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best hiking trails",
    "content": "Amazing trails in the area...",
    "location": "Nairobi",
    "latitude": -1.2921,
    "longitude": 36.8219,
    "category": "ADVENTURE",
    "subtopics": ["hiking", "nature", "trails"]
  }'
```

### 3.6 Passport Endpoints

#### 3.6.1 Get Passport

**GET** `/passport/me/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response (200 OK):**
```json
{
  "user": 1,
  "user_info": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "TOURIST"
  },
  "trust_score": 75,
  "points": 1250,
  "level": 3,
  "is_verified": false,
  "level_info": {
    "name": "Explorer",
    "color": "#3B82F6",
    "min_points": 1000
  }
}
```

**curl Command:**
```bash
curl -X GET http://localhost:8000/api/passport/me/ \
  -H "Authorization: Bearer <access_token>"
```

### 3.7 Chat Endpoints

#### 3.7.1 Get Contacts

**GET** `/chat/contacts/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 2,
    "username": "otheruser",
    "full_name": "John Doe",
    "profile_image": "http://localhost:8000/media/avatars/avatar2.jpg",
    "role": "TOURIST",
    "last_message": "Hello!",
    "timestamp": "2024-04-21T10:00:00Z",
    "is_online": true,
    "unread_count": 2
  }
]
```

**curl Command:**
```bash
curl -X GET http://localhost:8000/api/chat/contacts/ \
  -H "Authorization: Bearer <access_token>"
```

#### 3.7.2 Send Message

**POST** `/chat/send/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "receiver": 2,
  "content": "Hello from API!"
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "sender": 1,
  "sender_username": "testuser",
  "receiver": 2,
  "receiver_username": "otheruser",
  "content": "Hello from API!",
  "timestamp": "2024-04-21T10:00:00Z",
  "is_delivered": false,
  "is_read": false,
  "is_deleted": false
}
```

**curl Command:**
```bash
curl -X POST http://localhost:8000/api/chat/send/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": 2,
    "content": "Hello from API!"
  }'
```

#### 3.7.3 Get Message History

**GET** `/chat/history/{user_id}/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "sender": 1,
    "sender_username": "testuser",
    "receiver": 2,
    "receiver_username": "otheruser",
    "content": "Hello from API!",
    "timestamp": "2024-04-21T10:00:00Z",
    "is_delivered": true,
    "delivered_at": "2024-04-21T10:00:01Z",
    "is_read": false,
    "is_deleted": false
  }
]
```

**curl Command:**
```bash
curl -X GET http://localhost:8000/api/chat/history/2/ \
  -H "Authorization: Bearer <access_token>"
```

### 3.8 SOS Endpoints

#### 3.8.1 Create SOS Alert

**POST** `/sos/alerts/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": -1.2921,
  "longitude": 36.8219,
  "location_address": "Nairobi CBD",
  "severity": "HIGH",
  "message": "Need help immediately!"
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "user": 1,
  "user_username": "testuser",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "location_address": "Nairobi CBD",
  "severity": "HIGH",
  "message": "Need help immediately!",
  "status": "ACTIVE",
  "responders": [],
  "created_at": "2024-04-21T10:00:00Z",
  "updated_at": "2024-04-21T10:00:00Z"
}
```

**curl Command:**
```bash
curl -X POST http://localhost:8000/api/sos/alerts/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.2921,
    "longitude": 36.8219,
    "location_address": "Nairobi CBD",
    "severity": "HIGH",
    "message": "Need help immediately!"
  }'
```

#### 3.8.2 Get Nearby Alerts

**GET** `/sos/nearby/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Params:**
```
lat=-1.2921
lng=36.8219
radius=25
```

**Expected Response (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "user_username": "testuser",
      "latitude": -1.2921,
      "longitude": 36.8219,
      "location_address": "Nairobi CBD",
      "severity": "HIGH",
      "message": "Need help immediately!",
      "status": "ACTIVE",
      "responders": [2],
      "created_at": "2024-04-21T10:00:00Z",
      "updated_at": "2024-04-21T10:00:00Z"
    }
  ]
}
```

**curl Command:**
```bash
curl -X GET "http://localhost:8000/api/sos/nearby/?lat=-1.2921&lng=36.8219&radius=25" \
  -H "Authorization: Bearer <access_token>"
```

### 3.9 Experiences Endpoints

#### 3.9.1 Get Experiences

**GET** `/experiences/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response (200 OK):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "host": 1,
      "host_username": "localguide",
      "title": "Nairobi City Tour",
      "description": "Explore Nairobi with a local guide...",
      "location": "Nairobi",
      "latitude": -1.2921,
      "longitude": 36.8219,
      "category": "TOUR",
      "availability": "WEEKENDS",
      "price_per_person": 50.00,
      "currency": "KES",
      "created_at": "2024-04-20T10:00:00Z",
      "updated_at": "2024-04-20T10:00:00Z"
    }
  ]
}
```

**curl Command:**
```bash
curl -X GET http://localhost:8000/api/experiences/ \
  -H "Authorization: Bearer <access_token>"
```

---

## 4. AUTH FLOW TEST

### 4.1 Complete Auth Flow

**Step 1: Register User**

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "TOURIST",
    "profile": {
      "phone_number": "+254700000000",
      "bio": "Test user",
      "avatar": null,
      "gender": "MALE",
      "dob": "1990-01-01",
      "location": "Nairobi"
    }
  }'
```

**Expected:** 201 Created with user data

**Step 2: Login**

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

**Expected:** 200 OK with access_token and refresh_token

**Step 3: Access Protected Endpoint**

```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

**Expected:** 200 OK with user profile

**Step 4: Refresh Token**

```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "<refresh_token>"
  }'
```

**Expected:** 200 OK with new access_token and refresh_token

---

## 5. WEBSOCKET TEST

### 5.1 WebSocket URL

```
ws://localhost:8000/ws/chat/?token=<access_token>
```

### 5.2 Connection Methods

#### Option A: Browser Console

```javascript
const token = '<access_token>';
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Send a message
  ws.send(JSON.stringify({
    type: 'message',
    receiver: 2,
    content: 'Hello from WebSocket!'
  }));
};

ws.onmessage = (event) => {
  console.log('Message received:', JSON.parse(event.data));
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
};
```

#### Option B: Postman (WebSocket)

1. Create new WebSocket request
2. URL: `ws://localhost:8000/ws/chat/?token=<access_token>`
3. Connect
4. Send message:
```json
{
  "type": "message",
  "receiver": 2,
  "content": "Hello from Postman!"
}
```

#### Option C: wscat (Command Line)

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c "ws://localhost:8000/ws/chat/?token=<access_token>"

# Send message
> {"type":"message","receiver":2,"content":"Hello from wscat!"}
```

### 5.3 Expected Message Format

**Send:**
```json
{
  "type": "message",
  "receiver": 2,
  "content": "Hello!"
}
```

**Receive:**
```json
{
  "type": "message",
  "id": 1,
  "sender": 1,
  "sender_username": "testuser",
  "receiver": 2,
  "receiver_username": "otheruser",
  "content": "Hello!",
  "timestamp": "2024-04-21T10:00:00Z",
  "is_delivered": true,
  "is_read": false
}
```

### 5.4 WebSocket Events

- `message` - New message received
- `typing` - User typing indicator
- `online_status` - User online/offline status
- `ping` - Heartbeat ping
- `pong` - Heartbeat pong

---

## 6. FULL FLOW TESTS

### 6.1 Chat Flow

**Step 1: Get Contacts**

```bash
curl -X GET http://localhost:8000/api/chat/contacts/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 2: Send Message via REST**

```bash
curl -X POST http://localhost:8000/api/chat/send/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": 2,
    "content": "Hello from REST API!"
  }'
```

**Step 3: Send Message via WebSocket**

```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    receiver: 2,
    content: 'Hello from WebSocket!'
  }));
};
```

**Step 4: Get Message History**

```bash
curl -X GET http://localhost:8000/api/chat/history/2/ \
  -H "Authorization: Bearer <access_token>"
```

**Expected:** Both messages (REST + WebSocket) should appear in history

### 6.2 Moments Flow

**Step 1: Get Moments Feed**

```bash
curl -X GET "http://localhost:8000/api/moments/?page=1&page_size=20" \
  -H "Authorization: Bearer <access_token>"
```

**Step 2: Like a Moment**

```bash
curl -X POST http://localhost:8000/api/moments/1/like/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 3: Get Trending Moments**

```bash
curl -X GET "http://localhost:8000/api/moments/trending/?page=1&page_size=20" \
  -H "Authorization: Bearer <access_token>"
```

**Expected:** Moments should have updated likes_count

### 6.3 Tips Flow

**Step 1: Get Tips Feed**

```bash
curl -X GET "http://localhost:8000/api/tips/?page=1&page_size=20" \
  -H "Authorization: Bearer <access_token>"
```

**Step 2: Create Tip (Local Guide Only)**

```bash
curl -X POST http://localhost:8000/api/tips/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best hiking trails",
    "content": "Amazing trails in the area...",
    "location": "Nairobi",
    "latitude": -1.2921,
    "longitude": 36.8219,
    "category": "ADVENTURE",
    "subtopics": ["hiking", "nature", "trails"]
  }'
```

**Step 3: Upvote Tip**

```bash
curl -X POST http://localhost:8000/api/tips/1/upvote/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 4: Get Nearby Tips**

```bash
curl -X GET "http://localhost:8000/api/tips/nearby/?lat=-1.2921&lng=36.8219&radius=25" \
  -H "Authorization: Bearer <access_token>"
```

**Expected:** Tips should have updated upvotes

### 6.4 SOS Flow

**Step 1: Create SOS Alert**

```bash
curl -X POST http://localhost:8000/api/sos/alerts/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.2921,
    "longitude": 36.8219,
    "location_address": "Nairobi CBD",
    "severity": "HIGH",
    "message": "Need help immediately!"
  }'
```

**Step 2: Get Nearby Alerts**

```bash
curl -X GET "http://localhost:8000/api/sos/nearby/?lat=-1.2921&lng=36.8219&radius=25" \
  -H "Authorization: Bearer <access_token>"
```

**Step 3: Respond to Alert (Local Guide Only)**

```bash
curl -X POST http://localhost:8000/api/sos/alerts/1/respond/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "response_text": "I am on my way!",
    "eta_minutes": 15
  }'
```

**Step 4: Resolve Alert**

```bash
curl -X POST http://localhost:8000/api/sos/alerts/1/resolve/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution_notes": "Help provided successfully"
  }'
```

**Expected:** Alert status should change from ACTIVE → RESPONDING → RESOLVED

### 6.5 Passport Flow

**Step 1: Get Passport**

```bash
curl -X GET http://localhost:8000/api/passport/me/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 2: Get Passport Statistics**

```bash
curl -X GET http://localhost:8000/api/passport/statistics/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 3: Get Passport Badges**

```bash
curl -X GET http://localhost:8000/api/passport/badges/ \
  -H "Authorization: Bearer <access_token>"
```

**Step 4: Get Leaderboard**

```bash
curl -X GET "http://localhost:8000/api/passport/leaderboard/?page=1&page_size=10" \
  -H "Authorization: Bearer <access_token>"
```

**Expected:** All passport data should be accessible

---

## 7. DEBUGGING GUIDE

### 7.1 Common Errors

#### 7.1.1 CORS Error

**Error:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Cause:** Backend CORS not configured

**Fix:**
- Check `CORS_ALLOWED_ORIGINS` in backend `.env`
- Ensure `http://localhost:3000` is in the allowed origins
- Restart Django server

#### 7.1.2 Authentication Error

**Error:**
```
401 Unauthorized
```

**Cause:** Invalid or expired token

**Fix:**
- Check token is included in `Authorization` header
- Format: `Bearer <token>`
- Refresh token if expired
- Check token is not blacklisted

#### 7.1.3 Database Connection Error

**Error:**
```
django.db.utils.OperationalError: could not connect to server
```

**Cause:** PostgreSQL not running or wrong credentials

**Fix:**
- Ensure PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Use SQLite for development if PostgreSQL unavailable

#### 7.1.4 Migration Error

**Error:**
```
django.db.migrations.exceptions.InconsistentMigrationHistory
```

**Cause:** Migration history mismatch

**Fix:**
```bash
python manage.py migrate --run-syncdb
# Or reset database (WARNING: deletes data)
python manage.py flush
python manage.py migrate
```

#### 7.1.5 WebSocket Connection Error

**Error:**
```
WebSocket connection failed: HTTP 403
```

**Cause:** Invalid or missing JWT token in WebSocket URL

**Fix:**
- Ensure token is valid and not expired
- Check token is included in URL: `?token=<token>`
- Verify backend WebSocket consumer authentication

#### 7.1.6 Redis Connection Error

**Error:**
```
Error 111 connecting to localhost:6379. Connection refused
```

**Cause:** Redis not running

**Fix:**
- Start Redis: `redis-server`
- Check Redis is running: `redis-cli ping`
- Check Redis configuration in `.env`

#### 7.1.7 Celery Not Working

**Error:**
Tasks not executing or delayed

**Cause:** Celery worker not running

**Fix:**
- Start Celery worker: `celery -A config worker -l info`
- Start Celery beat: `celery -A config beat -l info`
- Check Redis is running (Celery uses Redis as broker)

### 7.2 Identifying Issue Source

#### 7.2.1 Frontend Issue

**Symptoms:**
- UI not updating
- React errors in console
- Component not rendering
- State not persisting

**Check:**
- Browser console for errors
- Network tab for failed requests
- Frontend environment variables
- Component logic

#### 7.2.2 Backend Issue

**Symptoms:**
- 500 Internal Server Error
- 400/422 Validation errors
- Database errors
- Permission errors

**Check:**
- Django logs: `python manage.py runserver --verbosity=2`
- Database migrations
- Serializer validation
- Permission classes
- Backend environment variables

#### 7.2.3 Network Issue

**Symptoms:**
- Connection refused
- Timeout errors
- CORS errors
- DNS resolution errors

**Check:**
- Backend server running: `http://localhost:8000/api/`
- Frontend server running: `http://localhost:3000`
- Firewall settings
- Proxy settings
- Network connectivity

#### 7.2.4 Auth Issue

**Symptoms:**
- 401 Unauthorized
- 403 Forbidden
- Token expired
- Invalid credentials

**Check:**
- Token format: `Bearer <token>`
- Token expiration time
- Refresh token logic
- JWT settings in backend
- User authentication flow

### 7.3 Debugging Commands

#### Backend

```bash
# Check Django logs
python manage.py runserver --verbosity=2

# Check database
python manage.py dbshell
# Or for SQLite
sqlite db.sqlite3

# Check migrations
python manage.py showmigrations

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell
```

#### Frontend

```bash
# Check Next.js logs
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

#### Redis

```bash
# Check Redis status
redis-cli ping

# Monitor Redis
redis-cli monitor

# Check Redis info
redis-cli info
```

#### Celery

```bash
# Check Celery worker logs
celery -A config worker -l info

# Check active tasks
celery -A config inspect active
```

### 7.4 Testing Checklist

Before proceeding to Phase 3, ensure:

- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] PostgreSQL/SQLite database connected
- [ ] Redis server running
- [ ] Celery worker running
- [ ] All migrations applied
- [ ] User can register successfully
- [ ] User can login and receive tokens
- [ ] Protected endpoints accessible with token
- [ ] Token refresh works
- [ ] WebSocket connects successfully
- [ ] Messages sent via REST
- [ ] Messages sent via WebSocket
- [ ] Moments fetch successfully
- [ ] Tips fetch successfully
- [ ] SOS alerts created and fetched
- [ ] Passport data accessible
- [ ] No CORS errors
- [ ] No authentication errors
- [ ] No database errors

---

## SUMMARY

This guide provides complete steps to:
1. Set up backend (Django, PostgreSQL/SQLite, Redis, Celery)
2. Set up frontend (Next.js, environment variables)
3. Test all API endpoints
4. Test authentication flow
5. Test WebSocket connection
6. Test complete feature flows
7. Debug common issues

Follow each step in order to bring the Kilicare+ system to life.
