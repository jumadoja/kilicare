export const MEDIA_BASE = process.env.NEXT_PUBLIC_API_URL!;

export const mediaUrl = (path: string | null | undefined): string => {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE}${path}`;
};

export const API = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    ME: '/auth/me/',
    LOGOUT: '/auth/logout/',
    FORGOT: '/auth/forgot-password/',
    RESET: '/auth/reset-password/',
    REFRESH: '/auth/token/refresh/',
  },
  MOMENTS: {
    LIST: '/api/moments/',
    FEED: '/api/moments/feed/',
    TRENDING: '/api/moments/trending/',
    MY: '/api/moments/my-moments/',
    SAVED: '/api/moments/saved/',
    DETAIL: (id: number) => `/api/moments/${id}/`,
    LIKE: (id: number) => `/api/moments/${id}/like/`,
    COMMENT: (id: number) => `/api/moments/${id}/comments/`,
    SAVE: (id: number) => `/api/moments/${id}/save/`,
    SHARE: (id: number) => `/api/moments/${id}/share/`,
    FOLLOW: '/api/moments/follow/follow/',
    UNFOLLOW: '/api/moments/follow/unfollow/',
    TRACK_VIEW: (id: number) => `/api/moments/${id}/track_view/`,
  },
  AI: {
    CHAT: '/api/ai/chat/',
    VOICE: '/api/ai/voice-to-text/',
    THREADS: '/api/ai/threads/',
    ALERTS: '/api/ai/proactive-alerts/',
    PREFERENCES: '/api/ai/preferences/',
  },
  MESSAGES: {
    SEND: '/api/messages/send/',
    CONTACTS: '/api/messages/contacts/',
    HISTORY: (userId: number) => `/api/messages/history/${userId}/`,
    ROOMS: '/api/messages/rooms/',
    DELETE_MSG: (id: number) => `/api/messages/${id}/`,
    DELETE_CHAT: (userId: number) => `/api/messages/chat/${userId}/`,
  },
  TIPS: {
    LIST: '/api/tips/',
    NEARBY: '/api/tips/nearby/',
    TRENDING: '/api/tips/trending/',
    MY: '/api/tips/my-tips/',
    CATEGORIES: '/api/tips/categories/',
    DETAIL: (id: number) => `/api/tips/${id}/`,
    UPVOTE: (id: number) => `/api/tips/${id}/upvote/`,
    REPORT: (id: number) => `/api/tips/${id}/report/`,
    VERIFY: '/api/tips/verify/',
  },
  SOS: {
    LIST: '/api/sos/',
    NEARBY: '/api/sos/nearby/',
    MY: '/api/sos/my-alerts/',
    STATS: '/api/sos/statistics/',
    DETAIL: (id: number) => `/api/sos/${id}/`,
    RESPOND: (id: number) => `/api/sos/${id}/respond/`,
    RESOLVE: (id: number) => `/api/sos/${id}/resolve/`,
    CANCEL: (id: number) => `/api/sos/${id}/cancel/`,
    RESPONSES: '/api/sos/responses/',
  },
  EXPERIENCES: {
    LIST: '/api/experiences/',
    TODAY: '/api/experiences/today-near-me/',
    DETAIL: (id: number) => `/api/experiences/${id}/`,
  },
  PASSPORT: {
    MY: '/api/passport/my-passport/',
    STATS: '/api/passport/statistics/',
    BADGES: '/api/passport/badges-available/',
    MY_BADGES: '/api/passport/badges/',
    TRANSACTIONS: '/api/passport/transactions/',
    ACTIVITIES: '/api/passport/activities/',
    LEADERBOARD: '/api/passport/leaderboard/',
    AWARD: '/api/passport/award-points/',
    TRUST: '/api/passport/update-trust-score/',
    ACTIVITY: '/api/passport/create-activity/',
  },
  FOLLOW: {
    FOLLOW: '/api/follow/',
    UNFOLLOW: '/api/follow/unfollow/',
    FOLLOWING: '/api/follow/following/',
    FOLLOWERS: '/api/follow/followers/',
  },
} as const;

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT: '/forgot-password',
  FEED: '/feed',
  AI: '/ai',
  CHAT: '/chat',
  DISCOVER: '/discover',
  MAP: '/map',
  TIPS: '/tips',
  SOS: '/sos',
  PASSPORT: '/passport',
  PROFILE: '/profile',
  EXPERIENCES: '/experiences',
  ADMIN: {
    USERS: '/admin/users',
    MODERATION: '/admin/moderation',
    SOS: '/admin/sos-monitor',
    AI: '/admin/ai-monitor',
  },
} as const;