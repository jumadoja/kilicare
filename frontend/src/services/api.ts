import axios from "axios";

// ---------- BASE API CLIENT ----------
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Automatically attach token if exists
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ---------- AUTH & PROFILE ----------
export const fetchMe = async () => {
  const res = await apiClient.get("/auth/me/");
  return res.data;
};

// ---------- TIPS (Phase 3) ----------
export const fetchLatestTips = async (category?: string) => {
  const params = category ? { category: category.toUpperCase() } : {};
  const res = await apiClient.get("/api/tips/list/", { params });
  return res.data;
};

export const upvoteTip = async (id: number) => {
  const res = await apiClient.post(`/api/tips/upvote/${id}/`);
  return res.data;
};

// ---------- MOMENTS (KiliMoments) ----------
export const fetchTrendingMoments = async () => {
  const res = await apiClient.get("/api/moments/");
  return res.data;
};

export const likeMoment = async (id: number) => {
  const res = await apiClient.post(`/api/moments/${id}/like/`);
  return res.data;
};

// ---------- AI ASSISTANT (UPGRADED) ----------
// Inasupport Text, Vision (Image), na Threads (UUID)
export const askAI = async (
  message: string,
  image: string | null = null,
  threadId: string | null = null // ✅ FIXED (UUID string)
) => {
  /**
   * NOTE:
   * Streaming inafanyika kupitia useAskAI (fetch API).
   * Hii function ni fallback ya non-streaming requests.
   */
  const res = await apiClient.post("/api/ai/ask/", {
    message,
    image,
    thread_id: threadId, // ✅ aligned na backend
  });

  return res.data;
};

// ---------- VOICE AI ----------
// Inatuma audio kwa Whisper na kurudisha text
export const sendVoiceAI = async (
  audioBlob: Blob,
  threadId: string | null = null // ✅ FIXED
) => {
  const formData = new FormData();

  formData.append("audio", audioBlob, "voice_input.wav");

  if (threadId) {
    // ✅ hakuna toString (tayari string)
    formData.append("thread_id", threadId);
  }

  const res = await apiClient.post("/api/ai/voice/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data; // { user_text: "..."}
};

// ---------- AI THREADS ----------
export const fetchAIThreads = async () => {
  const res = await apiClient.get("/api/ai/threads/");
  return res.data;
};

// ---------- EXPERIENCES ----------
export const fetchExperiencesToday = async (location?: string) => {
  const params = location ? { location } : {};
  const res = await apiClient.get("/api/experiences/today/", { params });
  return res.data;
};

// ---------- MESSAGING ----------
export const fetchMessageHistory = async (userId: number) => {
  const res = await apiClient.get(`/api/messages/history/${userId}/`);
  return res.data;
};

export const fetchChatContacts = async () => {
  const res = await apiClient.get("/api/messages/contacts/");
  return res.data;
};

export const sendMessage = async (
  receiverId: number,
  content: string
) => {
  const res = await apiClient.post("/api/messages/send/", {
    receiver: receiverId,
    content,
  });
  return res.data;
};

// ---------- PASSPORT ----------
export const fetchMyPassport = async () => {
  const res = await apiClient.get("/api/tourist/passport/");
  return res.data;
};

// ---------- ADMIN ----------
export const fetchAllUsers = async () => {
  const res = await apiClient.get("/api/admin/users/");
  return res.data;
};

export const fetchUserMoments = async (userId: number) => {
  const res = await apiClient.get(`/api/admin/user-moments/${userId}/`);
  return res.data;
};

export const fetchAILogs = async () => {
  const res = await apiClient.get("/api/admin/ai-logs/");
  return res.data;
};

export const fetchAllTipsAdmin = async () => {
  const res = await apiClient.get("/api/admin/tips/");
  return res.data;
};

export const fetchSavedTrips = async () => {
  const res = await apiClient.get("/api/tourist/savedtrips/");
  return res.data;
};

// ---------- PROFILE UPDATE ----------
export const updateAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await apiClient.patch("/auth/me/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const updateProfileInfo = async (profileData: {
  location?: string;
  bio?: string;
}) => {
  const res = await apiClient.patch("/auth/me/", profileData);
  return res.data;
};