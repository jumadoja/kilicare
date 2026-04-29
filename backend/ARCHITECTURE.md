# Kilicare+ Backend Architecture Documentation

## Table of Contents
1. [Full Project Overview](#1-full-project-overview)
2. [Complete Folder Structure Explanation](#2-complete-folder-structure-explanation)
3. [System Architecture Flow](#3-system-architecture-flow)
4. [Module Breakdown](#4-module-breakdown)
5. [Core Layer Explanation](#5-core-layer-explanation)
6. [Infrastructure Layer](#6-infrastructure-layer)
7. [Data Flow Diagram](#7-data-flow-diagram)
8. [Security Model](#8-security-model)
9. [Deployment Overview](#9-deployment-overview)
10. [Maintenance Guide](#10-maintenance-guide)

---

## 1. Full Project Overview

### What is Kilicare+ System?
Kilicare+ is a comprehensive tourism assistance platform designed for Tanzania, connecting tourists with local residents to provide authentic, safe, and enriched travel experiences. The system leverages AI-powered assistance, real-time communication, emergency support, and gamification through a digital passport system.

### Core Purpose of Backend
The backend serves as the central nervous system of Kilicare+, providing:
- **RESTful API Services**: All CRUD operations and business logic for frontend consumption
- **Real-time Communication**: WebSocket-based messaging and emergency alerts
- **AI Integration**: Groq-powered intelligent assistance with vision capabilities
- **Background Processing**: Celery-based async tasks for notifications, data cleanup, and analytics
- **User Management**: Authentication, authorization, and role-based access control
- **Gamification**: Digital passport with points, badges, and trust scoring
- **Emergency Response**: SOS system with location-based alerting and responder coordination

### Technology Stack
- **Framework**: Django 4.2+ with Django REST Framework
- **Real-time**: Django Channels with Redis backend
- **Async Tasks**: Celery with Redis broker
- **AI**: Groq API (Llama models)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT (SimpleJWT)
- **API Documentation**: GraphQL + REST

---

## 2. Complete Folder Structure Explanation

```
backend/
├── apps/                      # Feature modules (clean architecture)
│   ├── adminpanel/           # Admin-specific endpoints and moderation
│   ├── ai/                   # AI assistant, voice transcription, proactive alerts
│   ├── experiences/          # Local experiences and recommendations
│   ├── kilicaremoments/     # Social media moments (photos, videos, likes)
│   ├── messaging/            # Real-time chat and messaging system
│   ├── passport/            # Digital passport, gamification, trust scoring
│   ├── sos/                  # Emergency alert and response system
│   ├── tips/                 # Local tips and recommendations (safety, food, culture)
│   └── users/                # Authentication, user profiles, activity tracking
│
├── core/                     # Business logic layer (reusable across apps)
│   ├── exceptions/          # Custom exception classes
│   ├── permissions/          # Custom permission classes
│   ├── services/             # Business logic services (service layer pattern)
│   │   ├── ai_service.py
│   │   ├── base_service.py
│   │   ├── experiences_service.py
│   │   ├── messaging_service.py
│   │   ├── moments_service.py
│   │   ├── passport_service.py
│   │   ├── sos_service.py
│   │   ├── tips_service.py
│   │   └── user_service.py
│   └── utils/                # Utility functions and helpers
│
├── config/                   # Configuration management
│   ├── kilicare/             # ASGI configuration for WebSocket support
│   ├── settings/             # Environment-specific settings
│   │   ├── base.py          # Base settings (shared across environments)
│   │   ├── dev.py           # Development settings
│   │   └── prod.py          # Production settings
│   └── urls.py               # Main URL configuration
│
├── infrastructure/          # Infrastructure components
│   ├── celery/               # Celery application configuration
│   │   └── celery_app.py    # Celery app initialization and task discovery
│   ├── channels/             # Channels configuration (future use)
│   └── redis/                # Redis configuration (future use)
│
├── media/                    # User-uploaded media files (images, videos, audio)
├── static/                   # Static assets (CSS, JS, images)
├── .env                      # Environment variables (not committed to git)
├── .env.example              # Environment variables template
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
└── ARCHITECTURE.md           # This documentation file
```

### Folder Responsibilities

**apps/**: Contains all feature-specific modules. Each app is self-contained with its own models, views, serializers, URLs, admin configuration, signals, and Celery tasks. This modular structure allows for easy maintenance and scalability.

**core/**: Contains shared business logic that is reused across multiple apps. The service layer pattern is implemented here to separate business logic from views and models. This promotes code reusability and testability.

**config/**: Contains all configuration-related code. Settings are split into base (shared), development, and production configurations. The ASGI configuration enables WebSocket support for real-time features.

**infrastructure/**: Contains infrastructure-level configurations for external services like Celery, Redis, and Channels. These components handle background processing, caching, and real-time communication.

**media/**: Stores user-uploaded media files. In production, this should be served through cloud storage (Cloudinary/Mux integration prepared).

**static/**: Contains static assets for the Django admin interface and any frontend static files.

---

## 3. System Architecture Flow

### Request Flow: API → View → Service → Model → DB → Response

```
1. HTTP Request
   ↓
2. Django URL Router (config/urls.py)
   ↓
3. App-specific URL routing (apps/{app}/urls.py)
   ↓
4. API View / ViewSet (apps/{app}/views.py)
   ↓
5. Permission Check (IsAuthenticated, Role-based)
   ↓
6. Serializer Validation (apps/{app}/serializers.py)
   ↓
7. Service Layer (core/services/{service}.py)
   - Business logic execution
   - Transaction management
   - Error handling
   ↓
8. Model Operations (apps/{app}/models.py)
   - Database queries
   - Data manipulation
   ↓
9. Database (PostgreSQL/SQLite)
   ↓
10. Response Serialization
    ↓
11. HTTP Response (JSON)
```

### WebSocket Flow (Messaging System)

```
1. WebSocket Connection Request
   ↓
2. ASGI Application (config/kilicare/asgi.py)
   ↓
3. JWT Middleware (apps/messaging/middleware.py)
   - Token validation
   - User authentication
   ↓
4. Protocol Router (http vs websocket)
   ↓
5. URL Router (apps/messaging/routing.py)
   ↓
6. Consumer (apps/messaging/consumers.py)
   - connect(): Initialize connection, join room
   - receive(): Handle incoming messages
   - disconnect(): Cleanup
   ↓
7. Message Processing
   - Save to database (async)
   - Broadcast to room members
   - Trigger notifications (Celery task)
   ↓
8. WebSocket Response (real-time delivery)
```

### Celery Async Flow

```
1. View/Service triggers task
   ↓
2. Task decorated with @shared_task
   ↓
3. Celery worker picks up task
   ↓
4. Task execution (background)
   - Email sending
   - Data cleanup
   - Statistics calculation
   - External API calls
   ↓
5. Result storage (Redis)
   ↓
6. Optional callback/notification
```

### AI Request Flow (Groq Integration)

```
1. User sends message/image
   ↓
2. AI View (apps/ai/views.py)
   ↓
3. Service Layer (core/services/ai_service.py)
   - Get/create conversation thread
   - Build context (history, preferences)
   - Prepare system prompt
   ↓
4. Groq API Call
   - Model selection (text/vision)
   - Request payload construction
   - Timeout handling
   ↓
5. Response Processing
   - Parse AI response
   - Save to database (thread, activity)
   - Update conversation summary
   ↓
6. Return to frontend
```

### SOS Emergency Flow

```
1. User triggers SOS (mobile app)
   ↓
2. SOS View/Consumer (apps/sos/)
   - Create alert with location
   - Rate limiting check
   ↓
3. Database Save (SOSAlert model)
   ↓
4. WebSocket Broadcast
   - All users in SOS channel
   - Role-specific channels (locals, admins)
   ↓
5. Celery Task Triggered
   - Send notifications to nearby users
   - Update SOS statistics
   ↓
6. Responders Receive Alert
   - Can respond with status
   - Provide location updates
   ↓
7. Alert Resolution
   - Mark as resolved
   - Cleanup task (scheduled)
```

---

## 4. Module Breakdown

### users

**Purpose**: Authentication, user management, and activity tracking

**Models**:
- `User`: Custom user model with role field (LOCAL, TOURIST, ADMIN), email verification
- `Profile`: Extended user profile (avatar, bio, phone, gender, location)
- `PasswordResetOTP`: One-time password for password reset
- `UserActivity`: Track user actions for analytics

**Services**:
- `RegisterUserService`: User registration with validation
- `UpdateProfileService`: Profile update logic
- `ChangePasswordService`: Password change with old password verification
- `DeactivateAccountService`: Account deactivation logic

**APIs**:
- `POST /auth/register/` - User registration
- `POST /auth/login/` - JWT token generation
- `POST /auth/logout/` - Token blacklisting
- `GET /auth/me/` - Current user profile
- `POST /auth/forgot-password/` - Initiate password reset
- `POST /auth/reset-password/` - Complete password reset

**Dependencies**: Django REST Framework, SimpleJWT, Celery (for email tasks)

---

### ai

**Purpose**: AI-powered assistance with text, voice, and image capabilities

**Models**:
- `AIThread`: Conversation thread with summary and metadata
- `AIActivity`: Individual messages in conversation (user/assistant)
- `UserAIPreference`: User preferences (language, voice, interests)
- `ProactiveAlert`: AI-generated alerts (weather, events, security)

**Services**:
- `GenerateAIResponseService`: Main AI response generation with context
- `TranscribeAudioService`: Audio-to-text using Whisper
- `CreateProactiveAlertService`: Create proactive AI alerts
- `GetUserAIThreadsService`: Retrieve user's conversation history

**APIs**:
- `POST /api/ai/ask/` - AI chat (text + image)
- `POST /api/ai/voice/` - Voice transcription
- `GET/PUT /api/ai/preferences/` - User AI preferences
- `GET /api/ai/threads/` - Conversation history
- `GET /api/ai/alerts/` - Proactive alerts

**Dependencies**: Groq API, requests library, Celery (for proactive tasks)

---

### messaging

**Purpose**: Real-time messaging and communication between users

**Models**:
- `Message`: Chat messages with attachment support, read receipts, soft delete
- `ChatRoom`: Chat room management (direct or group)

**Services**:
- `SendMessageService`: Message sending with room creation logic

**APIs**:
- `POST /api/messages/send/` - Send message
- `GET /api/messages/history/<user_id>/` - Message history with user
- `GET /api/messages/history/room/<room_id>/` - Room message history
- `GET /api/messages/contacts/` - Chat contacts list
- `GET/POST /api/messages/rooms/` - Chat room management
- `DELETE /api/messages/delete-chat/<user_id>/` - Delete chat
- `DELETE /api/messages/delete/<message_id>/` - Delete single message

**WebSocket**:
- `ws://domain/ws/chat/<room_name>/` - Real-time chat connection

**Dependencies**: Django Channels, Redis, Celery (for notifications)

---

### passport

**Purpose**: Digital passport gamification system with points, badges, and trust scoring

**Models**:
- `PassportProfile`: User's passport with points, trust score, level
- `PassportBadge`: Available badges with criteria
- `UserBadge`: User's earned badges
- `PassportActivity`: Activity log with point transactions
- `PointsTransaction`: Detailed point transaction history

**Services**:
- `AwardPointsService`: Award points to users
- `UpdateTrustScoreService`: Calculate and update trust scores

**APIs**:
- `GET /api/passport/me/` - Current user's passport
- `GET /api/passport/badges/` - User's earned badges
- `POST /api/passport/award-points/` - Admin award points
- `CRUD /api/passport/` - Full passport management

**Dependencies**: Celery (for background score updates, leaderboard recalculation)

---

### sos

**Purpose**: Emergency alert system with location-based responder coordination

**Models**:
- `SOSAlert`: Emergency alerts with location, severity, status
- `SOSResponse`: Responder actions and status updates

**Services**:
- `CreateAlertService`: Create SOS alert with validation
- `RespondToAlertService`: Handle responder actions

**APIs**:
- `CRUD /api/sos/alerts/` - SOS alert management
  - `POST /api/sos/alerts/` - Create alert
  - `GET /api/sos/alerts/nearby/` - Nearby alerts
  - `POST /api/sos/alerts/<id>/respond/` - Respond to alert
  - `POST /api/sos/alerts/<id>/resolve/` - Resolve alert
  - `POST /api/sos/alerts/<id>/cancel/` - Cancel alert
- `GET /api/sos/responses/` - SOS responses

**WebSocket**:
- `ws://domain/ws/sos/` - Real-time SOS alerts

**Dependencies**: Django Channels, Redis, Celery (for notifications, cleanup)

---

### tips

**Purpose**: Local tips and recommendations (safety, food, culture) with voting system

**Models**:
- `Tip`: Local tips with category, location, trust score, upvotes
- `TipUpvote`: User upvotes with unique constraint
- `TipReport`: Tip reports for moderation

**Services**:
- `CreateTipService`: Create tip with validation
- `VoteTipService`: Handle upvote/remove upvote logic

**APIs**:
- `POST /api/tips/create/` - Create tip (LOCAL only)
- `GET /api/tips/list/` - Public tips list
- `CRUD /api/tips/tips/` - Full tip management
  - `POST /api/tips/tips/<id>/upvote/` - Upvote tip
  - `POST /api/tips/tips/<id>/report/` - Report tip
  - `GET /api/tips/tips/nearby/` - Nearby tips

**Dependencies**: Django filters, math (for distance calculations)

---

### experiences

**Purpose**: Local experiences and recommendations with media support

**Models**:
- `LocalExperience`: Experience listings with location, category, today's moment
- `ExperienceMedia`: Media files for experiences (images, videos)

**Services**:
- `CreateExperienceService`: Create experience with media handling

**APIs**:
- `GET/POST /api/experiences/` - Experience list/create
- `GET/PUT/DELETE /api/experiences/<id>/` - Experience detail
- `GET /api/experiences/today-near-me/` - Today's experiences near location

**Dependencies**: Django storage, caching

---

### kilicaremoments

**Purpose**: Social media platform for sharing moments (photos, videos) with engagement

**Models**:
- `KilicareMoment`: Moments with media, caption, location, visibility, trending score
- `MomentLike`: User likes on moments
- `MomentComment`: Comments on moments
- `SavedMoment`: User-saved moments
- `Follow`: User following system
- `BackgroundMusic`: Background music for moments
- `AdminActionLog`: Admin moderation actions

**Services**:
- `CreateMomentService`: Create moment with media processing
- `LikeMomentService`: Handle like/unlike logic
- `CommentMomentService`: Handle comment creation

**APIs**:
- `CRUD /api/moments/moments/` - Moment management
  - `POST /api/moments/moments/<id>/like/` - Like moment
  - `POST /api/moments/moments/<id>/comment/` - Comment moment
  - `POST /api/moments/moments/<id>/save/` - Save moment
  - `POST /api/moments/moments/<id>/share/` - Share moment
- `CRUD /api/moments/follow/` - Follow/unfollow users
- `CRUD /api/moments/music/` - Background music management
- `CRUD /api/moments/admin/moments/` - Admin moderation

**Dependencies**: Django storage, trending algorithm

---

### adminpanel

**Purpose**: Admin-specific endpoints for content moderation and user management

**APIs**:
- `GET/PATCH /api/admin/locals/` - Manage local users
- `GET/PATCH /api/admin/tips/` - Moderate tips
- `GET/PATCH /api/admin/moments/` - Moderate moments
- `GET /api/admin/ai-activity/` - Monitor AI usage

**Dependencies**: Custom admin permissions

---

## 5. Core Layer Explanation

### Service Layer (Business Logic)

The service layer implements the Service Layer Pattern to separate business logic from views and models. All services inherit from `BaseService` and implement an `execute()` method.

**BaseService** (`core/services/base_service.py`):
- Provides common functionality for all services
- Error handling and logging
- Transaction management support

**Key Services**:
- `user_service.py`: User registration, profile updates, password changes
- `ai_service.py`: AI response generation, audio transcription
- `messaging_service.py`: Message sending logic
- `passport_service.py`: Points awarding, trust score updates
- `sos_service.py`: Alert creation, response handling
- `moments_service.py`: Moment creation, likes, comments
- `tips_service.py`: Tip creation, voting
- `experiences_service.py`: Experience creation

**Benefits**:
- Reusable business logic
- Easier testing (mock services)
- Transactional atomicity
- Centralized error handling

### Utils

Utility functions and helpers used across the application:
- Common calculations (distance, scores)
- Data transformation helpers
- Formatting utilities

### Exceptions

Custom exception classes for better error handling:
- `ValidationError`: Invalid input data
- `ServiceError`: Service-level errors
- `AuthenticationError`: Authentication failures

### Permissions

Custom permission classes for role-based access control:
- `IsLocalUser`: Only LOCAL role users
- `IsAdmin`: Only ADMIN role users
- `IsAuthenticatedUser`: Authenticated users only

---

## 6. Infrastructure Layer

### Celery

**Configuration** (`infrastructure/celery/celery_app.py`):
- Celery app initialization
- Auto-discovery of tasks from installed apps
- Redis broker and result backend configuration

**Tasks by App**:
- `users/tasks.py`: Welcome emails, password reset OTPs, activity stats, daily digest, OTP cleanup
- `messaging/tasks.py`: Message notifications, message cleanup, chat statistics
- `ai/tasks.py`: Weather notifications, local events, alert cleanup
- `passport/tasks.py`: Trust score updates, badge awards, leaderboard recalculation, transaction cleanup
- `sos/tasks.py`: Alert cleanup, SOS notifications, SOS statistics

**Task Scheduling**:
- Periodic tasks configured via django-celery-beat
- Background processing for non-blocking operations

### Redis

**Uses**:
- Celery broker and result backend
- Django Channels channel layer for WebSocket
- Caching layer (Django cache framework)
- Session storage (optional)

**Configuration**:
- Default: `redis://127.0.0.1:6379/0`
- Configurable via environment variables

### Channels

**Configuration** (`config/kilicare/asgi.py`):
- ASGI application for WebSocket support
- Protocol router (HTTP vs WebSocket)
- JWT authentication middleware for WebSocket
- URL routing for WebSocket consumers

**Consumers**:
- `messaging/consumers.py`: Chat consumer for real-time messaging
- `sos/consumers.py`: SOS consumer for emergency alerts

### Caching System

**Implementation**:
- Django cache framework with Redis backend
- Queryset caching in tips view
- Session caching
- Custom cache keys for performance optimization

---

## 7. Data Flow Diagram

### User Registration Flow
```
User → POST /auth/register/
  → RegisterUserService.execute()
    → User.objects.create()
      → Database (PostgreSQL/SQLite)
    → Password hash
    → Email trigger (Celery task)
  → Response: User data + JWT token
```

### AI Chat Flow
```
User → POST /api/ai/ask/ (message + optional image)
  → GenerateAIResponseService.execute()
    → Get/create AIThread
    → Build context (history + preferences)
    → Call Groq API
      → API Response
    → Save AIActivity (user message)
    → Save AIActivity (AI response)
    → Update thread summary (if needed)
  → Response: AI response + thread_id
```

### SOS Emergency Flow
```
User → POST /api/sos/alerts/ (location + severity)
  → CreateAlertService.execute()
    → SOSAlert.objects.create()
      → Database
    → WebSocket broadcast (SOS channel)
    → Celery task: notify nearby users
  → Response: Alert data
  → Locals/Admins receive via WebSocket
  → Responders → POST /api/sos/alerts/<id>/respond/
    → SOSResponse.objects.create()
    → WebSocket broadcast
```

### Moment Creation Flow
```
User → POST /api/moments/moments/ (media + caption)
  → CreateMomentService.execute()
    → Media upload validation
    → KilicareMoment.objects.create()
      → Database
    → Calculate trending score
    → Award points (PassportService)
  → Response: Moment data
```

### Real-time Messaging Flow
```
User → WebSocket connect (ws://domain/ws/chat/<room_name>/)
  → JWT middleware validation
  → ChatConsumer.connect()
    → Join room channel
  → User sends message
    → ChatConsumer.receive()
      → Save to database (async)
      → Broadcast to room members
      → Trigger notification task
  → All room members receive message (real-time)
```

---

## 8. Security Model

### JWT Authentication

**Implementation**: Django REST Framework SimpleJWT

**Flow**:
1. User logs in → `/auth/login/`
2. Server generates JWT access token (short-lived) and refresh token (long-lived)
3. Client stores tokens
4. Subsequent requests include `Authorization: Bearer <access_token>` header
5. Server validates token and authenticates user
6. Access token expires → Use refresh token to get new access token

**Token Blacklisting**:
- Logout action blacklists tokens
- Prevents token reuse after logout
- Configured via `rest_framework_simplejwt.token_blacklist`

### Role-Based Access Control (RBAC)

**User Roles**:
- `LOCAL`: Local residents (can create tips, respond to SOS)
- `TOURIST`: Tourists (can view content, create moments, trigger SOS)
- `ADMIN`: Administrators (full access, moderation)

**Permission Classes**:
- `IsAuthenticated`: User must be logged in
- `IsLocalUser`: User must have LOCAL role
- `IsAdmin`: User must have ADMIN role
- `IsAdminUser`: Custom admin permission
- `AllowAny`: Public access (rare, mostly for discovery endpoints)

**Implementation**:
- Decorators on views: `@permission_classes([IsAuthenticated])`
- Custom permission checks in service layer
- Role-based filtering in querysets

### API Protection

**Protected Endpoints**:
- All API endpoints except `/auth/register/`, `/auth/login/` require authentication
- Admin endpoints require ADMIN role
- Content creation endpoints require specific roles (e.g., tips require LOCAL)

**CORS Configuration**:
- Configured allowed origins in settings
- Credentials support enabled
- Development: `localhost:3000`, `127.0.0.1:3000`

**Rate Limiting**:
- Implemented in tips views
- Can be extended globally using DRF throttling classes

**Input Validation**:
- Serializer validation for all inputs
- SQL injection prevention (ORM)
- XSS prevention (template escaping, serializer output)

---

## 9. Deployment Overview

### Backend Runtime Flow

**Development**:
```
Django Development Server
  → SQLite database
  → In-memory Celery (optional)
  → In-memory Channels (optional)
```

**Production**:
```
Daphne (ASGI Server)
  → PostgreSQL database
  → Redis (Channels + Celery + Cache)
  → Celery workers (multiple)
  → Celery beat (scheduled tasks)
  → Nginx (reverse proxy + static files)
```

### Environment Variables Usage

**Required Variables**:
- `DJANGO_SETTINGS_MODULE`: Settings module path
- `DJANGO_SECRET_KEY`: Django secret key
- `JWT_SECRET_KEY`: JWT signing key
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `USE_POSTGRES`: true/false to switch database

**Optional Variables**:
- `GROQ_API_KEY`: Groq AI API key
- `EMAIL_HOST_USER`: Email for notifications
- `EMAIL_HOST_PASSWORD`: Email password
- `CELERY_BROKER_URL`: Redis URL
- `CELERY_RESULT_BACKEND`: Redis URL

**Configuration Files**:
- `.env.example`: Template with all variables
- `.env`: Actual values (not committed)
- Settings load from environment via `os.getenv()`

### Deployment Checklist

**Pre-deployment**:
- [ ] Set `DEBUG=False` in production settings
- [ ] Configure `ALLOWED_HOSTS` with production domain
- [ ] Set strong random `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Configure PostgreSQL database
- [ ] Configure Redis server
- [ ] Set up cloud storage (Cloudinary/Mux) for media
- [ ] Configure email service
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Run `python manage.py collectstatic`
- [ ] Run `python manage.py migrate`

**Runtime Services**:
- [ ] Daphne (ASGI server)
- [ ] PostgreSQL database
- [ ] Redis server
- [ ] Celery worker
- [ ] Celery beat scheduler
- [ ] Nginx (reverse proxy)

---

## 10. Maintenance Guide

### How to Add New Feature

**Step 1: Create/Choose App**
- If feature fits existing app, add there
- If new domain, create new app: `python manage.py startapp newapp`

**Step 2: Define Models**
- Create models in `apps/{app}/models.py`
- Add indexes for performance
- Define relationships (ForeignKey, ManyToMany)

**Step 3: Create Migrations**
- `python manage.py makemigrations {app}`
- `python manage.py migrate`

**Step 4: Create Serializers**
- Add serializers in `apps/{app}/serializers.py`
- Implement validation logic

**Step 5: Create Service Layer**
- Create service in `core/services/{service}_service.py`
- Inherit from `BaseService`
- Implement `execute()` method
- Add business logic and error handling

**Step 6: Create Views/ViewSets**
- Add views in `apps/{app}/views.py`
- Use service layer for business logic
- Add permission classes
- Implement filtering/search if needed

**Step 7: Configure URLs**
- Add URL patterns in `apps/{app}/urls.py`
- Include in main `config/urls.py`

**Step 8: Admin Integration**
- Register models in `apps/{app}/admin.py`
- Configure `list_display`, `search_fields`, `list_filter`

**Step 9: Add Tests**
- Create tests in `apps/{app}/tests.py`
- Test models, services, views

**Step 10: Documentation**
- Update this ARCHITECTURE.md
- Add API documentation if needed

### Where to Put Logic

**Models** (`apps/{app}/models.py`):
- Data structure
- Field definitions
- Model methods (instance-specific logic)
- Meta options (ordering, indexes)
- `__str__` method

**Services** (`core/services/`):
- Business logic
- Complex calculations
- External API calls
- Transaction management
- Cross-model operations
- Reusable logic

**Views** (`apps/{app}/views.py`):
- HTTP request/response handling
- Permission checks
- Serializer validation
- Service layer calls
- Response formatting

**Serializers** (`apps/{app}/serializers.py`):
- Input validation
- Output formatting
- Field-level logic
- Nested serialization

**Tasks** (`apps/{app}/tasks.py`):
- Background processing
- Scheduled operations
- External notifications
- Data cleanup
- Analytics calculations

**Consumers** (`apps/{app}/consumers.py`):
- WebSocket connection handling
- Real-time message processing
- Channel layer operations

### How to Debug System

**Enable Debug Logging**:
```python
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
```

**Check Database Queries**:
- Add `django.db.backends` to LOGGING in settings
- Use `django-debug-toolbar` in development

**Trace Service Calls**:
- Add logging in service `execute()` methods
- Log input parameters and output results

**Monitor Celery Tasks**:
- Use Flower: `celery -A infrastructure.celery.celery_app flower`
- Check task status and results

**Debug WebSocket Issues**:
- Check ASGI logs
- Verify Redis connection
- Test with WebSocket client (e.g., wscat)

**Common Issues**:
- **Migration conflicts**: Use `python manage.py migrate --fake`
- **Celery not picking up tasks**: Check broker connection, restart worker
- **WebSocket not connecting**: Verify ASGI config, check middleware
- **Permission denied**: Check user role, verify permission classes
- **Database locked**: Close connections, check for long-running transactions

**Performance Optimization**:
- Use `select_related` for ForeignKey relationships
- Use `prefetch_related` for ManyToMany relationships
- Add database indexes for frequently queried fields
- Implement caching for expensive operations
- Use pagination for large result sets

---

## Appendix

### Quick Reference

**Run Development Server**:
```bash
python manage.py runserver
```

**Run Migrations**:
```bash
python manage.py makemigrations
python manage.py migrate
```

**Create Superuser**:
```bash
python manage.py createsuperuser
```

**Start Celery Worker**:
```bash
celery -A infrastructure.celery.celery_app worker -l info
```

**Start Celery Beat**:
```bash
celery -A infrastructure.celery.celery_app beat -l info
```

**Run Tests**:
```bash
python manage.py test
```

**Collect Static Files**:
```bash
python manage.py collectstatic
```

**System Check**:
```bash
python manage.py check
```

### Contact & Support

For questions or issues related to this architecture:
- Review this documentation
- Check code comments
- Refer to Django REST Framework documentation
- Refer to Django Channels documentation
- Refer to Celery documentation

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Maintained By**: Kilicare+ Development Team
