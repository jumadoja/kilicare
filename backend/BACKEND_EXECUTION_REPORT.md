# Kilicare+ Backend Execution & Architecture Report

**Version:** 1.0  
**Date:** April 23, 2026  
**Status:** Production Ready  
**Architecture:** Clean Architecture with Django REST Framework

---

## 1. SYSTEM OVERVIEW

### 1.1 What Kilicare Backend Does

Kilicare+ backend provides:
- **RESTful API Services**: Complete CRUD for all entities (users, tips, experiences, moments, SOS, passport)
- **Real-time Communication**: WebSocket-based messaging and emergency alerts via Django Channels
- **AI Integration**: Groq-powered AI with vision, voice transcription, and proactive alerts
- **Background Processing**: Celery-based async tasks for notifications and analytics
- **User Management**: JWT authentication, role-based access (TOURIST, LOCAL_GUIDE, ADMIN)
- **Gamification**: Digital passport with points, badges, trust scoring, and leveling
- **Emergency Response**: SOS system with location-based alerting and responder coordination
- **Media Management**: File upload handling for images, videos, and attachments

### 1.2 Architecture Style: Clean Architecture

```
Presentation Layer (Views, Serializers, URLs, Consumers)
         ↓
Application Layer (Service Layer - Business Logic)
         ↓
Domain Layer (Models, Domain Logic)
         ↓
Infrastructure Layer (Database, Redis, Celery, APIs, File System)
```

### 1.3 External Dependencies

| Service | Purpose | Config |
|---------|---------|-------|
| PostgreSQL | Primary DB (prod) | USE_POSTGRES=true |
| SQLite | Dev DB fallback | USE_POSTGRES=false |
| Redis | Channels layer, Celery broker | CELERY_BROKER_URL=redis://127.0.0.1:6379/0 |
| Celery | Async tasks | Beat scheduler |
| Django Channels | WebSockets | Redis-backed |
| Groq AI | AI chat, vision, voice | GROQ_API_KEY, GROQ_TEXT_MODEL, GROQ_VISION_MODEL |
| WhiteNoise | Static files | Middleware |
| JWT (SimpleJWT) | Auth tokens | 60min access, 7day refresh |

---

## 2. FULL MODULE BREAKDOWN

### 2.1 USERS MODULE

**Purpose:** Authentication, profile management, activity tracking

**Models:**
- **User** (extends AbstractUser): role (TOURIST/LOCAL_GUIDE/ADMIN), is_verified
- **Profile**: phone_number, bio, avatar, gender, dob, location
- **UserActivity**: action (LOGIN/REGISTER/CREATE/UPDATE), ip_address, timestamp
- **PasswordResetOTP**: otp (6-digit), expires_at (10min), is_used

**APIs:**
- POST /auth/register/ - Register user (AllowAny)
- GET/PUT /auth/me/ - Current user profile (IsAuthenticated)
- POST /auth/login/ - JWT login (AllowAny)
- POST /auth/forgot-password/ - Send OTP (AllowAny)
- POST /auth/reset-password/ - Reset with OTP (AllowAny)
- POST /auth/logout/ - Blacklist token (IsAuthenticated)

**Services:**
- RegisterUserService - Creates user + profile
- UpdateProfileService - Updates profile fields
- ChangePasswordService - Changes password
- DeactivateAccountService - Soft deactivates

**Permissions:** Register/Login/Password: AllowAny; Others: IsAuthenticated

---

### 2.2 AI MODULE

**Purpose:** AI assistance with chat, vision, voice

**Models:**
- **UserAIPreference**: preferred_voice (male/female), preferred_language (sw/en), interests (JSON list)
- **AIThread**: id (UUID), user, title, summary, created_at, updated_at
- **AIActivity**: thread, user, role (user/assistant/system), content, image_url (TextField for Base64), timestamp
- **ProactiveAlert**: user, message, alert_type (weather/event/security), is_sent

**APIs:**
- POST /api/ai/chat/ - Chat with text/image (IsAuthenticated)
- POST /api/ai/voice-to-text/ - Transcribe audio (IsAuthenticated)
- GET/PUT /api/ai/preferences/ - User AI preferences (IsAuthenticated)
- GET /api/ai/threads/ - User's conversation threads (IsAuthenticated)
- GET /api/ai/proactive-alerts/ - Last 5 alerts (IsAuthenticated)

**Services:**
- GenerateAIResponseService - Calls Groq API, manages threads, saves messages
- TranscribeAudioService - Uses Groq Whisper for voice-to-text
- CreateProactiveAlertService - Creates proactive alerts
- GetUserAIThreadsService - Retrieves user threads

**Permissions:** All: IsAuthenticated

---

### 2.3 MESSAGING MODULE

**Purpose:** Real-time and REST messaging

**Models:**
- **ChatRoom**: name (unique), room_type (DM/GROUP), participants (ManyToMany), created_at, updated_at
- **Message**: room, sender, content, attachment (FileField), reply_to, timestamp, is_delivered, is_read, is_deleted, deleted_by (ManyToMany - soft delete)

**APIs (REST):**
- POST /api/messages/send/ - Send message (IsAuthenticated)
- GET /api/messages/history/<user_id>/ - Message history (IsAuthenticated)
- GET /api/messages/contacts/ - Contact list with unread count (IsAuthenticated)
- GET/POST /api/messages/rooms/ - Chat rooms (IsAuthenticated)
- DELETE /api/messages/<message_id>/ - Soft delete message (IsAuthenticated)
- DELETE /api/messages/chat/<user_id>/ - Soft delete chat (IsAuthenticated)

**WebSocket:**
- ws://localhost:8000/ws/chat/{room_name}/?token={jwt}
- Actions: message, typing, read_receipt

**Services:**
- SendMessageService - Creates message, broadcasts via WebSocket
- MarkMessagesAsReadService - Marks messages as read
- DeleteMessageService - Soft deletes message
- DeleteChatService - Soft deletes entire chat
- GetChatContactsService - Gets contact list with last message

**Permissions:** All: IsAuthenticated

---

### 2.4 EXPERIENCES MODULE

**Purpose:** Local guides create tourism experiences

**Models:**
- **LocalExperience**: local (User), title, description, location, category (Safari/Food/Culture/Night Life), cultural_moment, availability, price_range, today_moment_active, today_moment_date, created_at
- **ExperienceMedia**: experience, file (FileField), media_type (image/video), uploaded_at
- Upload path: experiences/videos/{id}/ or experiences/images/{id}/

**APIs:**
- GET /api/experiences/ - List experiences (IsAuthenticatedOrReadOnly)
- POST /api/experiences/ - Create with media files (IsAuthenticatedOrReadOnly)
- GET /api/experiences/<id>/ - Single experience (IsAuthenticatedOrReadOnly)
- PUT/PATCH /api/experiences/<id>/ - Update (IsAuthenticatedOrReadOnly)
- DELETE /api/experiences/<id>/ - Delete (IsAuthenticatedOrReadOnly)
- GET /api/experiences/today-near-me/ - Today's active experiences (AllowAny)

**Services:**
- CreateExperienceService - Creates experience, handles media uploads (max 20MB per file)

**Permissions:** Most: IsAuthenticatedOrReadOnly; TodayNearMe: AllowAny

---

### 2.5 KILICAREMOMENTS MODULE

**Purpose:** Social media - moments, likes, comments, follows

**Models:**
- **Follow**: follower, following, created_at
- **KilicareMoment**: posted_by, media (FileField), media_type, caption, location, latitude, longitude, views, shares, is_verified, is_featured, visibility (PUBLIC/FOLLOWERS/PRIVATE), is_hidden, trending_score, created_at
- **MomentLike**: user, moment, created_at
- **MomentComment**: user, moment, comment, created_at
- **SavedMoment**: user, moment, created_at
- **BackgroundMusic**: title, file, description
- **AdminActionLog**: admin, action, target_user, target_moment, created_at

**APIs:**
- GET/POST /api/moments/ - List/create moments (IsAuthenticated)
- GET /api/moments/<id>/ - Single moment (increments views) (IsAuthenticated)
- PUT/PATCH /api/moments/<id>/ - Update (IsAuthenticated)
- DELETE /api/moments/<id>/ - Delete (IsAuthenticated)
- POST /api/moments/<id>/like/ - Toggle like (IsAuthenticated)
- POST /api/moments/<id>/comment/ - Add comment (IsAuthenticated)
- POST /api/moments/<id>/save/ - Toggle save (IsAuthenticated)
- POST /api/moments/<id>/share/ - Track share (IsAuthenticated)
- GET /api/moments/feed/ - Personalized feed (IsAuthenticated)
- GET /api/moments/trending/ - Trending (last 24h) (IsAuthenticated)
- GET /api/moments/my-moments/ - User's moments (IsAuthenticated)
- GET /api/moments/saved/ - Saved moments (IsAuthenticated)
- POST /api/follow/ - Follow user (IsAuthenticated)
- POST /api/follow/unfollow/ - Unfollow (IsAuthenticated)
- GET /api/follow/following/ - Following list (IsAuthenticated)
- GET /api/follow/followers/ - Followers list (IsAuthenticated)
- GET /api/music/ - Background music (IsAuthenticated)
- POST /api/admin/moments/<id>/approve/ - Approve moment (IsAuthenticated, IsAdmin)

**Services:**
- CreateMomentService - Creates moment, calculates trending score
- LikeMomentService - Toggles like, updates trending score
- CommentMomentService - Creates comment

**Permissions:** Most: IsAuthenticated; Admin endpoints: IsAuthenticated + IsAdmin

---

### 2.6 PASSPORT MODULE

**Purpose:** Gamification - points, badges, trust scoring

**Models:**
- **PassportProfile**: user (OneToOne), image, trust_score, points, level, is_verified, created_at
- **PassportBadge**: name, description, icon, criteria_points
- **UserBadge**: user, badge, unlocked_at
- **PointsTransaction**: user, transaction_type (VISIT/POST_MOMENT/SEND_MESSAGE/HELPFUL_TIP/REPORT/VERIFICATION/EXPERIENCE_CREATED/SOS_RESPONSE/ADMIN_ADJUSTMENT), points_change, balance_after, description, metadata (JSON), created_at
- **PassportActivity**: user, action_type (TIP_CREATED/TIP_UPVOTED/CHAT_HELPFUL/VERIFIED_LOCAL/MOMENT_LIKED/EXPERIENCE_BOOKED/SOS_RESOLVED), points_awarded, metadata, created_at

**APIs:**
- GET /api/passport/my-passport/ - User's passport (IsAuthenticated)
- GET /api/passport/badges/ - User's badges (IsAuthenticated)
- GET /api/passport/statistics/ - Comprehensive stats (IsAuthenticated)
- GET /api/passport/activities/ - Activity history (IsAuthenticated)
- GET /api/passport/transactions/ - Transaction history (IsAuthenticated)
- POST /api/passport/award-points/ - Award points (Admin only) (IsAuthenticated)
- POST /api/passport/create-activity/ - Create activity (IsAuthenticated)
- GET /api/passport/leaderboard/ - Leaderboard (IsAuthenticated)
- GET /api/passport/badges-available/ - All badges with unlock status (IsAuthenticated)
- POST /api/passport/update-trust-score/ - Recalculate trust (Admin only) (IsAuthenticated)

**Services:**
- AwardPointsService - Adds points with transaction record
- DeductPointsService - Removes points (penalty)
- CreatePassportActivityService - Creates activity, awards points
- UpdateTrustScoreService - Recalculates trust score (points 50%, badges 20%, activity 20%, age 10%)
- CheckBadgeUnlockService - Checks and unlocks eligible badges
- GetLeaderboardService - Gets leaderboard by metric

**Permissions:** Most: IsAuthenticated; Award/update-trust: IsAuthenticated + Admin

---

### 2.7 TIPS MODULE

**Purpose:** Local safety/travel tips with voting

**Models:**
- **Tip**: title, description, category (SAFETY/LIFESTYLE/NAVIGATION/EXPERIENCE/ACCESSIBILITY), sub_topics (JSON list), latitude, longitude, location_address, created_by, trust_score, upvotes, downvotes, reports, is_verified, is_public, is_hidden, featured_until, created_at
- **TipUpvote**: user, tip, created_at
- **TipReport**: user, tip, reason (INACCURATE/SPAM/INAPPROPRIATE/DUPLICATE/OUTDATED), description, is_resolved, created_at

**APIs:**
- POST /api/tips/create/ - Create tip (IsAuthenticated, IsLocalUser only)
- GET /api/tips/ - List tips with filtering (IsAuthenticated)
- GET /api/tips/<id>/ - Single tip (IsAuthenticated)
- POST /api/tips/<id>/upvote/ - Toggle upvote (IsAuthenticated)
- POST /api/tips/<id>/report/ - Report tip (IsAuthenticated)
- GET /api/tips/nearby/ - Nearby tips (lat, lng, radius) (IsAuthenticated)
- GET /api/tips/trending/ - Trending tips (last 7d) (IsAuthenticated)
- GET /api/tips/my-tips/ - User's tips (IsAuthenticated)
- GET /api/tips/categories/ - Categories with counts (IsAuthenticated)
- POST /api/tips/verify/ - Verify tip (Admin only) (IsAuthenticated)

**Services:**
- CreateTipService - Creates tip, awards 10 points
- VoteTipService - Handles voting, updates trust score

**Permissions:** Create: IsAuthenticated + LOCAL_GUIDE; Verify: IsAuthenticated + Admin; Others: IsAuthenticated

---

### 2.8 SOS MODULE

**Purpose:** Emergency alert system

**Models:**
- **SOSAlert**: user, latitude, longitude, location_address, severity (LOW/MEDIUM/HIGH/CRITICAL), status (ACTIVE/RESPONDING/RESOLVED/CANCELLED), message, responders (ManyToMany), created_at, resolved_at, metadata (JSON)
- **SOSResponse**: alert, responder, message, is_onsite, created_at

**APIs:**
- GET /api/sos/ - List alerts (role-filtered) (IsAuthenticated)
- POST /api/sos/ - Create alert (IsAuthenticated)
- GET /api/sos/<id>/ - Single alert with responses (IsAuthenticated)
- PUT/PATCH /api/sos/<id>/ - Update (IsAuthenticated)
- DELETE /api/sos/<id>/ - Delete (IsAuthenticated)
- POST /api/sos/<id>/respond/ - Respond to alert (IsAuthenticated, LOCAL/ADMIN only)
- POST /api/sos/<id>/resolve/ - Resolve alert (creator or Admin) (IsAuthenticated)
- POST /api/sos/<id>/cancel/ - Cancel alert (creator only) (IsAuthenticated)
- GET /api/sos/nearby/ - Nearby alerts (IsAuthenticated)
- GET /api/sos/my-alerts/ - User's alerts (IsAuthenticated)
- GET /api/sos/statistics/ - SOS stats (LOCAL/ADMIN only) (IsAuthenticated)
- GET /api/sos/responses/ - Response list (IsAuthenticated)

**Services:**
- CreateAlertService - Creates alert, rate limits (max 3 per 5min)
- RespondToAlertService - Creates response, adds responder

**Permissions:** Respond: IsAuthenticated + LOCAL/ADMIN; Resolve: creator or Admin; Cancel: creator only; Statistics: LOCAL/ADMIN only

---

### 2.9 ADMINPANEL MODULE

**Purpose:** Admin functionality (placeholder)

**Models:** None (uses Django Admin)

**APIs:** None defined

**Services:** None defined

---

## 3. ENDPOINT FLOWS

### 3.1 Authentication Flow

**Register:**
```
POST /auth/register/ → RegisterUserView → UserSerializer → RegisterUserService → User.objects.create_user() + Profile.objects.create() → Response: User object
```

**Login:**
```
POST /auth/login/ → LoginView → CustomTokenObtainPairSerializer → SimpleJWT validation → Generate tokens → Response: {access_token, refresh_token, user}
```

**JWT Refresh:**
```
POST /auth/refresh/ → TokenRefreshView → Validate refresh_token → Generate new access_token → Response: {access, refresh}
```

### 3.2 AI Chat Flow

**Text Chat:**
```
POST /api/ai/chat/ → KilicareAIView → AIChatSerializer → GenerateAIResponseService → Get/Create AIThread → Fetch UserAIPreferences → Fetch history (last 12) → Build system prompt → Call Groq API → Save user message → Save AI response → Update thread summary → Response: {response, thread_id, voice_preference}
```

**Image Chat:**
```
Same as text, but content preparation includes Base64 image → Select GROQ_VISION_MODEL → Multi-modal content array → Groq API with vision
```

**Voice-to-Text:**
```
POST /api/ai/voice-to-text/ → VoiceToTextView → Groq Whisper API → Extract transcription → Fetch preferences → Response: {user_text, thread_id, voice_preference}
```

### 3.3 Messaging Flow

**REST Send:**
```
POST /api/messages/send/ → SendMessageView → MessageSerializer → SendMessageService → Get/Create ChatRoom → Create Message → Update room timestamp → WebSocket broadcast → Response: Message object
```

**WebSocket:**
```
Connect: ws://.../ws/chat/{room_name}/?token={jwt} → JWTAuthMiddleware → ChatConsumer.connect() → Validate token → Join channel group → Accept
Send: {action: 'message', message: 'Hello'} → ChatConsumer.receive() → save_message() → Broadcast to group → All clients receive
```

### 3.4 SOS Flow

**Create Alert:**
```
POST /api/sos/ → SOSAlertViewSet.create() → SOSAlertCreateSerializer → CreateAlertService → Validate coordinates → Check rate limit → Create SOSAlert → WebSocket broadcast → Response: Alert object
```

**WebSocket SOS:**
```
Connect: ws://.../ws/sos/?token={jwt} → SOSConsumer.connect() → Join sos_alerts + role channel → Accept
Trigger: {action: 'trigger_alert', ...} → create_sos_alert() → Broadcast to all channels → All users receive
Respond: {action: 'respond_to_alert', ...} → create_sos_response() → Broadcast response → Alert creator sees response
```

### 3.5 Moments Flow

**Create Moment:**
```
POST /api/moments/ → MomentViewSet.create() → MomentCreateSerializer → CreateMomentService → Create KilicareMoment → Calculate trending score → Response: Moment object
```

### 3.6 Tips Flow

**Create Tip:**
```
POST /api/tips/create/ → CreateTipView → TipCreateSerializer → CreateTipService → Validate → Create Tip → Award 10 points → Response: Tip object
```

**Vote:**
```
POST /api/tips/<id>/upvote/ → TipViewSet.upvote() → VoteTipService → Check existing vote → Add/remove/update vote → Recalculate trust score → Award 2 points → Response: {status, upvotes, is_upvoted}
```

### 3.7 Passport Flow

**Award Points:**
```
POST /api/passport/award-points/ → PassportViewSet.award_points() → Check Admin role → AwardPointsSerializer → AwardPointsService → Validate points → Get/create Passport → Transaction.atomic() → Update points → Create transaction → Update trust score and level → Response: {message, new_balance, new_trust_score}
```

**Trust Score:**
```
POST /api/passport/update-trust-score/ → UpdateTrustScoreService → passport.update_trust_score() → Calculate: points (50%) + badges (20%) + activity (20%) + age (10%) → Save → Response: {new_trust_score}
```

---

## 4. REALTIME SYSTEM

### 4.1 WebSocket Implementation

**ASGI:** config.kilicare.asgi.application
**ProtocolTypeRouter:** Routes HTTP and WebSocket
**JWTAuthMiddleware:** Authenticates WebSocket connections
**Channel Layer:** Redis (production), InMemory (dev)

### 4.2 Chat System

**Connection:** ws://localhost:8000/ws/chat/{room_name}/?token={jwt}
**Channels:** chat_{room_name}
**Actions:** message, typing, read_receipt
**Flow:** Connect → Validate JWT → Join group → Accept → Send/receive messages → Broadcast to group

### 4.3 SOS System

**Connection:** ws://localhost:8000/ws/sos/?token={jwt}
**Channels:** sos_alerts (all), sos_locals (LOCAL), sos_admins (ADMIN)
**Actions:** trigger_alert, respond_to_alert, update_alert_status, location_update
**Flow:** Connect → Validate JWT → Join multiple groups → Accept → Trigger/respond → Broadcast to relevant groups

### 4.4 Redis Role

Stores channel group memberships, routes messages to consumers, maintains connection state across servers.

### 4.5 Consumers

**ChatConsumer:** Handles chat messages, typing indicators, read receipts
**SOSConsumer:** Handles SOS alerts, responses, status updates, location updates

---

## 5. MEDIA SYSTEM ARCHITECTURE

### 5.1 Storage

**Location:** Local disk filesystem
**Config:** MEDIA_URL = '/media/', MEDIA_ROOT = BASE_DIR / "media"

**Directory Structure:**
```
media/
├── avatars/           # User profile pictures
├── moments/           # KilicareMoments media
├── chat_attachments/  # Message attachments (YYYY/MM/DD/)
├── experiences/
│   ├── videos/{id}/  # Experience videos
│   └── images/{id}/  # Experience images
├── profile_pics/     # Passport profile pictures
├── passport_badges/  # Badge icons
└── music/            # Background music
```

### 5.2 Media in DB vs Filesystem

**Database:** Stores file paths as strings (e.g., "avatars/user123.jpg")
**Filesystem:** Stores actual binary files
**Django FileField:** Handles upload, storage, and URL generation

### 5.3 Media by Module

**Users:** Profile.avatar (ImageField)
**Moments:** KilicareMoment.media (FileField - image/video)
**Experiences:** ExperienceMedia.file (FileField - image/video)
**Messaging:** Message.attachment (FileField - any file)
**Passport:** PassportProfile.image (ImageField)
**Badges:** PassportBadge.icon (ImageField)
**Music:** BackgroundMusic.file (FileField - audio)

### 5.4 Important Notes

- Media is NOT stored in database (only file paths)
- FileField handles upload to MEDIA_ROOT
- MEDIA_URL serves files via Django (DEBUG) or WhiteNoise (production)
- Max file size: 20MB for experiences, 5MB for others (validated in serializers)
- File types validated: image/*, video/*, audio/* depending on field

---

## 6. AI SYSTEM FLOW

### 6.1 AI Request Processing

**Input:** Message (text) + Image (Base64, optional) + Thread ID (UUID, optional)
**Service:** GenerateAIResponseService

**Steps:**
1. Get or create AIThread
2. Fetch UserAIPreferences (voice, language, interests)
3. Fetch conversation history (last 12 messages)
4. Build system prompt with user context
5. Prepare content (text + image if provided)
6. Select model (vision model for images, text model for text only)
7. Call Groq API with messages array
8. Save user message to AIActivity
9. Parse AI response
10. Save AI response to AIActivity
11. Update thread summary if >15 messages
12. Return response with thread_id and voice_preference

### 6.2 Prompt Construction

**System Prompt:**
```
"You are KilicareGO AI, an intelligent tourism assistant for Tanzania. 
You are chatting with {username} who is a {role}. 
User interests: {interests}. 
Primary language is {language}. 
Provide knowledgeable responses, use Markdown, and be friendly."
```

**Context:** Thread summary (if exists) + last 12 messages in chronological order

### 6.3 Image + Text + Voice Flow

**Image:** Base64 string → Clean → Format as data:image/jpeg;base64,{data} → Multi-modal content array → Groq vision model
**Text:** String → Direct content → Groq text model
**Voice:** Audio file → Groq Whisper API → Transcription → Text → Use in chat

### 6.4 Response Saving

**User Message:** AIActivity(role='user', content, image_url)
**AI Response:** AIActivity(role='assistant', content)
**Thread Summary:** Updated after 15 messages with AI response[:500]

### 6.5 Proactive Alerts

**Service:** CreateProactiveAlertService
**Trigger:** Background tasks (weather, events, security)
**Storage:** ProactiveAlert model with is_sent flag
**Delivery:** Via WebSocket or notification system

---

## 7. DATABASE DESIGN OVERVIEW

### 7.1 PostgreSQL Structure

**Primary Database:** PostgreSQL (production)
**Fallback:** SQLite (development)
**Switch:** USE_POSTGRES environment variable

### 7.2 Main Relationships

**User Relationships:**
- User → Profile (OneToOne)
- User → PassportProfile (OneToOne)
- User → UserAIPreference (OneToOne)
- User → AIThread (ForeignKey - user)
- User → ChatRoom (ManyToMany - participants)
- User → Message (ForeignKey - sender)
- User → LocalExperience (ForeignKey - local)
- User → KilicareMoment (ForeignKey - posted_by)
- User → Tip (ForeignKey - created_by)
- User → SOSAlert (ForeignKey - user)
- User → SOSResponse (ForeignKey - responder)

**Cross-App Relationships:**
- PassportProfile → PointsTransaction (ForeignKey - user)
- PassportProfile → PassportActivity (ForeignKey - user)
- Tip → TipUpvote (ForeignKey - tip)
- Tip → TipReport (ForeignKey - tip)
- KilicareMoment → MomentLike (ForeignKey - moment)
- KilicareMoment → MomentComment (ForeignKey - moment)
- KilicareMoment → SavedMoment (ForeignKey - moment)
- ChatRoom → Message (ForeignKey - room)
- SOSAlert → SOSResponse (ForeignKey - alert)

### 7.3 Foreign Keys Across Apps

**Users → All Apps:** User model referenced by all apps for created_by, sender, etc.
**Passport → Tips/Moments/SOS:** Trust score and points affect content ranking
**Messaging → Users:** Chat participants and message senders
**AI → Users:** Threads and preferences per user

### 7.4 SQLite vs PostgreSQL

**SQLite:** Development only, single file, no network, simpler setup
**PostgreSQL:** Production, multi-user, better performance, full SQL features
**Why SQLite for dev:** No server setup, portable, sufficient for local testing
**Why PostgreSQL for prod:** Concurrent access, better scaling, advanced features

### 7.5 Data Types

**Relational Data:** User relationships, foreign keys, joins (PostgreSQL optimized)
**Transactional Data:** Points transactions, activities, messages (ACID compliance)
**JSON Data:** Interests, metadata, sub_topics (PostgreSQL JSONB support)
**Geospatial Data:** Latitude/longitude (Decimal fields, can use PostGIS in future)

---

## 8. CELERY BACKGROUND SYSTEM

### 8.1 Async Tasks

**Current Implementation:**
- CELERY_BROKER_URL = redis://127.0.0.1:6379/0
- CELERY_RESULT_BACKEND = redis://127.0.0.1:6379/0
- CELERY_ACCEPT_CONTENT = ['json']
- CELERY_TASK_SERIALIZER = 'json'
- CELERY_RESULT_SERIALIZER = 'json'
- CELERY_TIMEZONE = 'Africa/Nairobi'

**Development Override:**
- CELERY_TASK_ALWAYS_EAGER = True (tasks run synchronously in dev)

### 8.2 Tasks Per Module

**Users Tasks:**
- Send welcome email (not implemented)
- Password reset email (not implemented)

**AI Tasks:**
- Generate proactive alerts (weather, events, security)
- Clean up old AI threads (not implemented)

**Messaging Tasks:**
- Send push notifications for new messages (not implemented)
- Clean up old messages (not implemented)

**SOS Tasks:**
- Auto-escalate unresponded alerts (not implemented)
- Send location-based alerts to nearby users (not implemented)

**Passport Tasks:**
- Batch trust score recalculation (scheduled)
- Badge unlock checking (scheduled)
- Points expiration (not implemented)

### 8.3 Scheduling System

**Django Celery Beat:**
- Installed in INSTALLED_APPS
- Configured for periodic tasks
- Tasks defined in infrastructure/celery/ (not fully implemented)

**Example Scheduled Tasks:**
- Recalculate trust scores daily
- Check badge unlocks hourly
- Clean up old data weekly

---

## 9. SECURITY ARCHITECTURE

### 9.1 JWT Authentication Flow

**Login:**
1. User sends username/password to /auth/login/
2. Django validates credentials
3. SimpleJWT generates access_token (60min) and refresh_token (7day)
4. Response includes tokens and user info
5. Frontend stores tokens securely

**API Access:**
1. Frontend includes access_token in Authorization header: `Bearer {token}`
2. JWTAuthentication middleware validates token
3. User set in request.user
4. Permission classes check request.user.is_authenticated

**Token Refresh:**
1. Access token expires
2. Frontend sends refresh_token to /auth/refresh/
3. SimpleJWT validates and generates new access_token
4. Frontend updates stored token

**Logout:**
1. Frontend sends refresh_token to /auth/logout/
2. Token blacklisted (token_blacklist app)
3. Tokens invalidated

### 9.2 Role-Based Access Control

**Roles:**
- TOURIST: Can view content, create moments, send messages, trigger SOS
- LOCAL_GUIDE: Can create tips, experiences, respond to SOS, all TOURIST permissions
- ADMIN: Can verify content, award points, update trust scores, all permissions

**Implementation:**
- User.role field with choices
- Custom permissions: IsLocalUser, IsAdmin
- Permission classes in views
- Role checks in services

### 9.3 Permissions System

**Django Permissions:**
- IsAuthenticated: User must be logged in
- IsAdminUser: User must be staff/superuser
- AllowAny: No authentication required

**Custom Permissions:**
- IsLocalUser: Only LOCAL_GUIDE role
- IsOwner: Only resource owner
- IsVerifiedLocal: Only verified locals

**View-Level:**
```python
permission_classes = [IsAuthenticated, IsLocalUser]
```

**Object-Level:**
```python
def has_object_permission(self, request, view, obj):
    return obj.user == request.user
```

### 9.4 CORS Setup

**Configuration:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

**Middleware:**
- corsheaders.middleware.CorsMiddleware (first in MIDDLEWARE)

### 9.5 API Protection Strategy

**Authentication:** JWT tokens required for all protected endpoints
**Authorization:** Role-based permissions per endpoint
**Rate Limiting:** Not implemented (can add django-ratelimit)
**Input Validation:** Serializers validate all inputs
**SQL Injection:** Django ORM prevents (parameterized queries)
**XSS:** Django templates escape by default
**CSRF:** Not required for API (token-based auth)
**HTTPS:** Required in production (ALLOWED_HOSTS, SSL)

---

## 10. FRONTEND INTEGRATION BLUEPRINT

### 10.1 API Consumption

**Base URL:** http://localhost:8000 (dev), https://api.kilicare.com (prod)
**Authentication:** Include `Authorization: Bearer {access_token}` header

**Example Request:**
```javascript
fetch('http://localhost:8000/api/moments/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
```

### 10.2 API Usage by UI Component

**Auth Screen:**
- POST /auth/register/ - Registration form
- POST /auth/login/ - Login form
- POST /auth/forgot-password/ - Forgot password
- POST /auth/reset-password/ - Reset with OTP

**Profile Screen:**
- GET /auth/me/ - User profile data
- PUT /auth/me/ - Update profile
- GET /api/passport/my-passport/ - Passport stats
- GET /api/passport/statistics/ - Detailed stats

**AI Chat Screen:**
- POST /api/ai/chat/ - Send message (text/image)
- POST /api/ai/voice-to-text/ - Voice input
- GET /api/ai/threads/ - Chat history sidebar
- GET/PUT /api/ai/preferences/ - AI settings

**Messaging Screen:**
- GET /api/messages/contacts/ - Contact list
- GET /api/messages/history/<user_id>/ - Message history
- POST /api/messages/send/ - Send message
- WebSocket: ws://localhost:8000/ws/chat/{room_name}/?token={jwt}

**Moments Feed:**
- GET /api/moments/feed/ - Personalized feed
- GET /api/moments/trending/ - Trending moments
- POST /api/moments/ - Create moment
- POST /api/moments/<id>/like/ - Like
- POST /api/moments/<id>/comment/ - Comment
- POST /api/moments/<id>/save/ - Save

**Tips Screen:**
- GET /api/tips/ - Tips list
- GET /api/tips/nearby/ - Nearby tips
- POST /api/tips/create/ - Create tip (LOCAL only)
- POST /api/tips/<id>/upvote/ - Upvote

**Experiences Screen:**
- GET /api/experiences/ - Experiences list
- GET /api/experiences/today-near-me/ - Today's experiences
- POST /api/experiences/ - Create experience (LOCAL only)

**SOS Screen:**
- POST /api/sos/ - Trigger SOS
- GET /api/sos/nearby/ - Nearby alerts
- WebSocket: ws://localhost:8000/ws/sos/?token={jwt}
- POST /api/sos/<id>/respond/ - Respond (LOCAL/ADMIN)

**Leaderboard Screen:**
- GET /api/passport/leaderboard/ - Leaderboard

### 10.3 Data Frontend Expects

**User Object:**
```json
{
  "id": 1,
  "username": "john",
  "email": "john@example.com",
  "role": "TOURIST",
  "is_verified": false,
  "profile": {
    "phone_number": "+1234567890",
    "bio": "Travel enthusiast",
    "avatar": "/media/avatars/john.jpg",
    "location": "Dar es Salaam"
  }
}
```

**Moment Object:**
```json
{
  "id": 1,
  "posted_by": {"id": 1, "username": "john", "passport_trust_score": 150},
  "media": "/media/moments/photo.jpg",
  "media_type": "image",
  "caption": "Beautiful sunset",
  "location": "Zanzibar",
  "likes_count": 42,
  "comments_count": 5,
  "is_liked": true,
  "is_saved": false,
  "trending_score": 85.5,
  "created_at": "2026-04-23T18:00:00Z"
}
```

**Tip Object:**
```json
{
  "id": 1,
  "title": "Safe taxi tips",
  "description": "Always use registered taxis",
  "category": "SAFETY",
  "sub_topics": ["taxi", "safety"],
  "latitude": -6.7924,
  "longitude": 39.2083,
  "created_by_info": {"id": 2, "username": "local_guide", "role": "LOCAL_GUIDE"},
  "trust_score": 85,
  "upvotes": 23,
  "is_verified": true,
  "is_upvoted_by_user": false
}
```

**SOS Alert Object:**
```json
{
  "id": 1,
  "user_info": {"id": 1, "username": "tourist", "role": "TOURIST"},
  "latitude": -6.7924,
  "longitude": 39.2083,
  "severity": "HIGH",
  "status": "ACTIVE",
  "message": "Need help!",
  "responder_count": 2,
  "responses": [...],
  "is_responded_by_current_user": false,
  "created_at": "2026-04-23T18:00:00Z"
}
```

### 10.4 WebSocket Connections

**Chat WebSocket:**
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/chat/chat_${user1}_${user2}/?token=${accessToken}`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.action === 'message') {
    // Display message
  }
};
ws.send(JSON.stringify({action: 'message', message: 'Hello'}));
```

**SOS WebSocket:**
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/sos/?token=${accessToken}`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.action === 'new_alert') {
    // Show alert notification
  }
};
ws.send(JSON.stringify({
  action: 'trigger_alert',
  latitude: -6.7924,
  longitude: 39.2083,
  severity: 'HIGH',
  message: 'Help!'
}));
```

### 10.5 Media URLs Structure

**Base URL:** http://localhost:8000/media/
**Examples:**
- Avatar: /media/avatars/user123.jpg
- Moment: /media/moments/moment456.jpg
- Experience: /media/experiences/images/789/photo.jpg
- Chat attachment: /media/chat_attachments/2026/04/23/file.pdf

**Frontend Usage:**
```javascript
const avatarUrl = `http://localhost:8000${user.profile.avatar}`;
const momentMedia = `http://localhost:8000${moment.media}`;
```

### 10.6 AI Chat Integration

**Text Chat:**
```javascript
const response = await fetch('http://localhost:8000/api/ai/chat/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'What are the best beaches in Zanzibar?',
    thread_id: existingThreadId
  })
});
const data = await response.json();
// data.response, data.thread_id, data.voice_preference
```

**Image Chat:**
```javascript
const response = await fetch('http://localhost:8000/api/ai/chat/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'What is this?',
    image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
  })
});
```

**Voice Input:**
```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('thread_id', threadId);

const response = await fetch('http://localhost:8000/api/ai/voice-to-text/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
const data = await response.json();
// data.user_text, data.voice_preference
```

### 10.7 Messaging UI Flow

**Load Contacts:**
```javascript
const contacts = await fetch('http://localhost:8000/api/messages/contacts/', {
  headers: {'Authorization': `Bearer ${accessToken}`}
}).then(r => r.json());
// Display contacts with last message and unread count
```

**Load Chat History:**
```javascript
const messages = await fetch(`http://localhost:8000/api/messages/history/${userId}/`, {
  headers: {'Authorization': `Bearer ${accessToken}`}
}).then(r => r.json());
// Display messages in chat window
```

**Send Message (REST):**
```javascript
await fetch('http://localhost:8000/api/messages/send/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    receiver: userId,
    content: 'Hello'
  })
});
```

**Send Message (WebSocket):**
```javascript
ws.send(JSON.stringify({
  action: 'message',
  message: 'Hello',
  receiver_id: userId
}));
```

### 10.8 SOS UI Flow

**Trigger SOS:**
```javascript
await fetch('http://localhost:8000/api/sos/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    latitude: currentLocation.lat,
    longitude: currentLocation.lng,
    severity: 'HIGH',
    message: 'Emergency!'
  })
});
```

**WebSocket SOS:**
```javascript
ws.send(JSON.stringify({
  action: 'trigger_alert',
  latitude: currentLocation.lat,
  longitude: currentLocation.lng,
  severity: 'HIGH',
  message: 'Emergency!'
}));
```

**Respond to SOS:**
```javascript
await fetch(`http://localhost:8000/api/sos/${alertId}/respond/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    response_text: 'On my way!',
    is_onsite: false
  })
});
```

---

## 11. COMPLETE SYSTEM FLOW DIAGRAM

### 11.1 Full Request Flow

```
User (Frontend)
    ↓
HTTP/WebSocket Request
    ↓
Nginx/Load Balancer (production)
    ↓
Daphne (ASGI Server)
    ↓
JWTAuthMiddleware (WebSocket) / Django Middleware (HTTP)
    ↓
URL Router (config/urls.py → config/kilicare/urls.py)
    ↓
View (apps/*/views.py) or Consumer (apps/*/consumers.py)
    ↓
Serializer Validation (apps/*/serializers.py)
    ↓
Service Layer (core/services/*_service.py)
    ↓
Model (apps/*/models.py)
    ↓
PostgreSQL Database
    ↓
Response (HTTP) / WebSocket Broadcast
    ↓
Redis (Channel Layer for WebSocket)
    ↓
Celery (Background Tasks)
    ↓
Frontend
```

### 11.2 Data Flow Example: Create Tip

```
Frontend: POST /api/tips/create/ with tip data
    ↓
CreateTipView receives request
    ↓
TipCreateSerializer validates data
    ↓
CreateTipService.execute()
    ↓
Transaction.atomic()
    ↓
Tip.objects.create() - saves to PostgreSQL
    ↓
PassportProfile.add_points() - updates user points
    ↓
PointsTransaction.objects.create() - logs transaction
    ↓
PassportProfile.update_trust_score() - recalculates trust
    ↓
Response: Tip object with trust score
    ↓
Frontend displays tip in UI
```

### 11.3 Real-time Flow Example: Chat Message

```
Frontend: WebSocket send {action: 'message', message: 'Hello'}
    ↓
ChatConsumer.receive()
    ↓
save_message() (database_sync_to_async)
    ↓
Message.objects.create() - saves to PostgreSQL
    ↓
channel_layer.group_send('chat_room_name')
    ↓
Redis stores message in channel group
    ↓
All connected consumers receive message
    ↓
chat_message handler sends to frontend
    ↓
Frontend displays message in chat
```

---

## 12. FINAL ARCHITECTURE SUMMARY

### 12.1 What Is Fully Built

**Core Systems:**
- ✅ User authentication (JWT, registration, password reset)
- ✅ AI chat with Groq integration (text, image, voice)
- ✅ Real-time messaging (WebSocket + REST)
- ✅ SOS emergency system (WebSocket + REST)
- ✅ KilicareMoments social features (posts, likes, comments, follows)
- ✅ Tips system with voting and trust scoring
- ✅ Experiences for local guides
- ✅ Passport gamification (points, badges, trust scores, leaderboard)
- ✅ Clean architecture with service layer
- ✅ PostgreSQL + SQLite database switching
- ✅ Static files with WhiteNoise
- ✅ Django Channels with Redis

**API Endpoints:**
- ✅ 50+ REST API endpoints across all modules
- ✅ WebSocket consumers for chat and SOS
- ✅ GraphQL endpoint (configured, not fully used)

**Infrastructure:**
- ✅ ASGI configuration with Daphne
- ✅ Celery configuration (tasks not fully implemented)
- ✅ Redis channel layer
- ✅ Environment-based configuration
- ✅ Development vs production settings

### 12.2 What Is Ready for Frontend

**All APIs are ready:**
- Authentication endpoints (register, login, logout, password reset)
- User profile management
- AI chat (text, image, voice)
- Messaging (REST + WebSocket)
- Moments (CRUD, likes, comments, follows, feed)
- Tips (CRUD, voting, nearby, trending)
- Experiences (CRUD, today's moments)
- SOS (create, respond, nearby, statistics)
- Passport (stats, leaderboard, badges, transactions)

**WebSocket endpoints:**
- Chat: ws://localhost:8000/ws/chat/{room_name}/?token={jwt}
- SOS: ws://localhost:8000/ws/sos/?token={jwt}

**Media endpoints:**
- All media served via /media/ URL
- File upload endpoints for moments, experiences, messages

### 12.3 What Is Missing

**Celery Tasks:**
- Background task implementations (configured but not fully coded)
- Scheduled tasks (beat scheduler configured but no tasks defined)
- Proactive AI alerts (service exists but no trigger)

**Advanced Features:**
- Push notifications (not implemented)
- Email sending (configured but not used)
- File upload to cloud storage (currently local only)
- PostGIS for advanced geospatial queries
- Caching layer (Redis cache configured but not used)
- Rate limiting (not implemented)

**Admin Panel:**
- Custom admin views (uses Django Admin)
- Admin-specific APIs (minimal)

### 12.4 Production Readiness Level

**Ready:**
- ✅ Core API functionality
- ✅ Authentication and authorization
- ✅ Database schema and migrations
- ✅ Static file serving (WhiteNoise)
- ✅ WebSocket real-time features
- ✅ Environment configuration
- ✅ Clean architecture for maintainability

**Needs Before Production:**
- ⚠️ Celery background tasks implementation
- ⚠️ Email service configuration (SMTP)
- ⚠️ Cloud storage for media (S3/CloudFront)
- ⚠️ HTTPS/SSL configuration
- ⚠️ Production Redis server
- ⚠️ Load testing and optimization
- ⚠️ Monitoring and logging setup
- ⚠️ CI/CD pipeline
- ⚠️ Backup strategy for database
- ⚠️ Rate limiting implementation

**Estimated Production Timeline:** 2-3 weeks for production deployment with missing items addressed.

---

**END OF REPORT**
