"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  SendHorizontal, Paperclip, Mic, Sparkles, Plus, 
  LayoutGrid, FolderOpen, Bot, Image as ImageIcon, X, ArrowLeft,
  History, Menu, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

// Logic & API Services
import { fetchAIThreads, fetchMe, apiClient } from "@/services/api";
import { useAskAI } from "@/features/dashboard/hooks/useAskAI";
import { useVoiceAI } from "@/features/dashboard/hooks/useVoiceAI";

/**
 * Kilicare+ AI Chat Content Component
 * Handles streaming AI chat, voice recognition, and image uploads.
 */
function AiChatContent() {
  const router = useRouter();
  
  // --- States ---
  const [messages, setMessages] = useState<{role: string, content: string, image_data?: string | null}[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Refs ---
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const aiBufferRef = useRef<string>("");

  // --- Mutations ---
  const { mutate: askMutation, isPending: isAsking } = useAskAI();
  const { mutate: voiceMutation, isPending: isProcessingVoice } = useVoiceAI();
  const isLoading = isAsking || isProcessingVoice;

  // --- Logic ya Suggestions ---
  const getSuggestions = () => {
    return [
      { l: "Maeneo ya Kutembelea 🌍", v: "Nipe orodha ya vivutio vya utalii vilivyo karibu nami" },
      { l: "Utamaduni wa Tanzania 🇹🇿", v: "Elezea mila na desturi za watu wa eneo hili" },
      { l: "Safari Tips 🚗", v: "Nini cha kuzingatia ninaposafiri kwenda mikoani?" },
      { l: "Vyakula vya Asili 🍲", v: "Ni vyakula gani vya asili maarufu hapa?" },
      { l: "Huduma za Jamii 🏥", v: "Ni wapi naweza kupata huduma za karibu?" },
      { l: "Fursa za Biashara 📈", v: "Elezea fursa za kiuchumi zilizopo kwenye mkoa wangu" },
      { l: "Hali ya Hewa 🌦️", v: "Tabiri hali ya hapa kwa wiki hii itakuwaje?" },
      { l: "Msaada wa Kiufundi 🛠️", v: "Nisaidie kutatua tatizo langu la kiufundi" }
    ];
  };

  // --- Responsive Setup (Maboresho ya UI pekee) ---
  useEffect(() => {
    // Kufunga sidebar automatiki kwenye simu
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Initial Load & Polling ---
  useEffect(() => {
    const init = async () => {
      try {
        const [me, threadList] = await Promise.all([fetchMe(), fetchAIThreads()]);
        setUserData(me);
        setThreads(threadList);
      } catch (err) { 
        toast.error("Imeshindwa kupata profile yako.");
      }
    };
    init();

    const checkAlerts = async () => {
      try {
        const res = await apiClient.get("/api/ai/alerts/");
        if (res.data && res.data.length > 0) {
          const latestAlert = res.data[0];
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white p-4 rounded-2xl flex gap-3 shadow-xl border-l-4 border-orange-500`}>
               <span className="text-2xl">{latestAlert.type === 'weather' ? '🌦️' : '🔔'}</span>
               <div>
                 <p className="font-bold text-slate-800">Kilicare Alert</p>
                 <p className="text-sm text-gray-600">{latestAlert.message}</p>
               </div>
            </div>
          ), { duration: 5000 });
        }
      } catch (e) { /* Fail silently */ }
    };

    const alertInterval = setInterval(checkAlerts, 120000);
    return () => clearInterval(alertInterval);
  }, []);

  useEffect(() => {
    const refreshThreads = async () => {
      try {
        const threadList = await fetchAIThreads();
        setThreads(threadList);
      } catch (e) { console.error("Sidebar refresh failed"); }
    };

    const threadInterval = setInterval(refreshThreads, 5000);
    return () => clearInterval(threadInterval);
  }, []);

  // --- Real-time Auto-scroll Logic ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return toast.error("Picha isizidi 10MB!");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        // Fix ya Image Upload: Inasafisha value ili kuruhusu ku-upload tena picha hiyo hiyo
        e.target.value = ""; 
      };
      reader.readAsDataURL(file);
    }
  };

  // --- executeStreamingChat ---
  const executeStreamingChat = (userMsg: string, userImg: string | null) => {
    aiBufferRef.current = ""; 
    setMessages(prev => [...prev, { role: "ai", content: "" }]);

    askMutation({
      message: userMsg,
      image: userImg,
      threadId: threadId,
      onChunk: (chunk) => {
        aiBufferRef.current += chunk; 
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = { ...updated[lastIndex], content: aiBufferRef.current };
          }
          return updated;
        });
        scrollToBottom();
      },
      onMeta: (meta) => { 
        if (meta.thread_id) setThreadId(meta.thread_id); 
        if (meta.audio_url) {
          const audio = new Audio(meta.audio_url);
          audio.play().catch(e => console.error("Audio playback failed", e));
        }
      }
    });
  };

  const handleSend = () => {
    if ((!input.trim() && !image) || isLoading) return;
    const currentMsg = input;
    const currentImg = image;
    
    setMessages(prev => [...prev, { role: "user", content: currentMsg, image_data: currentImg }]);
    setInput("");
    setImage(null);
    
    executeStreamingChat(currentMsg, currentImg);
  };

  const handleSuggestionClick = (value: string) => {
    if (isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: value, image_data: null }]);
    executeStreamingChat(value, null);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        voiceMutation({ audioBlob: blob, threadId }, {
          onSuccess: (res: any) => {
            setMessages(prev => [...prev, { role: "user", content: res.userText }]);
            executeStreamingChat(res.userText, null);
          }
        });
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      toast("Sikiliza...", { icon: '🎙️' });
    } catch (e) { toast.error("Maikrofoni haipatikani."); }
  };

  return (
    <div className="ai-page-container">
      
      {/* Mobile Overlay kwa ajili ya Sidebar */}
      <div 
        className={`ai-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* 1. SIDEBAR AREA */}
      <aside className={`chat-history-sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-white font-bold text-lg">Menu</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="hide-sidebar-btn"
            >
              <span className="sr-only">Funga Sidebar</span>
              <PanelLeftClose size={20} />
            </button>
          </div>

          <button onClick={() => window.location.reload()} className="sidebar-action-btn primary-btn">
            <Plus size={20} />
            <span>Chat Mpya</span>
          </button>
        </div>

        <nav className="history-nav custom-scrollbar">
          <div className="section-label mt-4 flex items-center gap-2">
            <History size={12} /> Historia ya Chat
          </div>
          <div className="recent-chats flex flex-col gap-1 mt-2">
            {threads.length > 0 ? (
              threads.slice(0, 15).map((t, i) => (
                <div 
                  key={i} 
                  className={`chat-history-item truncate ${threadId === t.id ? 'active-thread' : ''}`}
                  onClick={() => {
                    setThreadId(t.id);
                    if (window.innerWidth <= 768) setIsSidebarOpen(false); // Funga ukichagua kwenye simu
                  }}
                >
                  {t.summary || t.title || "Inatengeneza muhtasari..."}
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-100/60 italic px-3">Huna historia ya karibuni</p>
            )}
          </div>
        </nav>

        <div className="p-5 border-t border-white/10">
          <button 
            onClick={() => router.push("/dashboard/tourist")} 
            className="sidebar-action-btn secondary-btn"
          >
            <ArrowLeft size={20} />
            <span>Dashboard</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CHAT AREA */}
      <section className="main-chat-area">
        <header className="chat-header">
            <div className="flex items-center gap-4">
              {!isSidebarOpen && (
                <button className="unhide-sidebar-btn" onClick={() => setIsSidebarOpen(true)}>
                  <PanelLeftOpen size={24} />
                </button>
              )}
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                kiliAI<span className="text-[#16a34a]"></span>
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{userData?.username || (userData?.role === 'Tourist' ? 'Mtalii' : 'Mwenyeji')}</p>
                <div className="flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Online</p>
                </div>
              </div>
              <div className="user-avatar">
                {userData?.username?.substring(0,2).toUpperCase() || 'ME'}
              </div>
            </div>
        </header>

        <div className="chat-content custom-scrollbar">
          {messages.length === 0 ? (
            <div className="welcome-section">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bot-icon-container"
              >
                 <Bot size={48} className="text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="welcome-text"
              >
                Je, unahitaji msaada gani <br /> 
                <span className="text-[#16a34a]">
                    leo, {userData?.username || (userData?.role === 'Tourist' ? 'Mtalii' : 'Mwenyeji')}?
                </span>
              </motion.h1>
              
              <div className="suggestions-grid">
                {getSuggestions().map((s, i) => (
                  <button key={i} onClick={() => handleSuggestionClick(s.v)} className="suggestion-pill">
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map((msg, i) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={`message-row ${msg.role === 'user' ? 'row-user' : 'row-bot'}`}
                >
                  <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                    {msg.image_data && (
                      <img src={msg.image_data} className="msg-image" alt="Preview" />
                    )}
                    <div className="prose-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {isLoading && i === messages.length - 1 && msg.role === 'ai' && (
                        <span className="ai-cursor" />
                      )}
                    </div>
                  </div>
                  <div className={`msg-time ${msg.role === 'user' ? 'time-user' : 'time-bot'}`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* 3. INPUT FIELD AREA */}
        <footer className="chat-footer">
          <div className="input-box-container">
            <AnimatePresence>
              {image && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="image-preview-float">
                  <img src={image} className="w-12 h-12 rounded-lg object-cover" alt="Selected thumbnail" />
                  <button onClick={() => setImage(null)} className="close-preview">
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="input-field-wrapper">
              <textarea 
                placeholder="Uliza chochote..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                rows={1}
                className="chat-textarea"
              />
              
              <div className="input-toolbar">
                <div className="flex gap-1">
                  <button onClick={() => fileInputRef.current?.click()} className="icon-btn-circle">
                      <ImageIcon size={18} />
                  </button>
                  <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
                  
                  <button 
                    onClick={toggleRecording} 
                    className={`icon-btn-circle ${isRecording ? 'recording-active' : ''}`} 
                  >
                    <Mic size={18} />
                  </button>
                </div>
                
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || (!input.trim() && !image)}
                  className="send-action-btn"
                >
                  {isLoading ? <div className="spinner-small" /> : <SendHorizontal size={18} />}
                </button>
              </div>
            </div>
          </div>
          <p className="disclaimer-text">Kilicare AI inaweza kutoa maelezo yasiyo sahihi. Hakiki taarifa muhimu.</p>
        </footer>
      </section>

      {/* --- STYLING --- */}
      <style jsx>{`
        .ai-cursor {
          display: inline-block;
          width: 8px;
          height: 18px;
          background-color: #16a34a;
          margin-left: 4px;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Responsive Fix: 100dvh for Mobile browsers */
        .ai-page-container {
          display: flex; height: 100dvh; width: 100%; background: #f8fafc; overflow: hidden;
          position: relative;
        }

        /* Overlay Styling */
        .ai-sidebar-overlay {
          display: none;
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px); z-index: 150;
          transition: opacity 0.3s ease;
        }

        .chat-history-sidebar {
          width: 300px; border-right: 1px solid #e4e4e9; display: flex;
          flex-direction: column; background: #f8ebfc; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 200; /* Updated z-index for AI sidebar */
        }
        .sidebar-closed { margin-left: -300px; }
        .hide-sidebar-btn {
          display: flex; align-items: center; justify-content: center;
          color: white; padding: 8px; border-radius: 12px; transition: 0.2s;
          cursor: pointer; background: rgb(11, 37, 16);
        }
        .hide-sidebar-btn:hover { background: #ef4444; color: #ffffff; }
        .unhide-sidebar-btn {
          display: flex; align-items: center; justify-content: center;
          color: #16a34a; padding: 8px; border-radius: 10px; transition: 0.2s;
          cursor: pointer; background: #f1f5f9;
        }
        .unhide-sidebar-btn:hover { color: white; background: #16a34a; }
        .sidebar-action-btn {
          width: 100%; padding: 14px; border-radius: 14px; background: #1e293b;
          color: white; border: none; display: flex; align-items: center;
          justify-content: center; gap: 10px; font-weight: 700; cursor: pointer;
          transition: all 0.3s ease;
        }
        .sidebar-action-btn:hover { background: #16a34a; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .history-nav { flex: 1; padding: 10px 15px; overflow-y: auto; }
        .section-label { font-size: 13px; text-transform: uppercase; color: rgba(0, 0, 0, 0.8); font-weight: 900; margin-bottom: 13px; letter-spacing: 1px; }
        .chat-history-item { font-size: 12px; color: #000000; padding: 10px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
        .chat-history-item:hover { background: rgba(255,255,255,0.15); }
        .active-thread { background: #e6bbf8 !important; color: #000000 !important; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .main-chat-area { 
          flex: 1; display: flex; flex-direction: column; 
          background-image: linear-gradient(rgba(184, 156, 250, 0.9), rgba(248, 250, 252, 0.9)), 
          url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2070');
          background-size: cover; background-position: center; position: relative; width: 100%; 
        }
        .chat-header {
          display: flex; align-items: center; justify-content: space-between; padding: 15px 30px;
          background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0;
        }
        .user-avatar {
          width: 38px; height: 38px; border-radius: 12px; background: #16a34a; 
          display: flex; align-items: center; justify-content: center; 
          color: white; font-size: 12px; font-weight: 800; border: 2px solid #e2e8f0;
        }
        .chat-content { flex: 1; overflow-y: auto; padding: 20px 0; }
        .welcome-section { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; text-align: center; padding: 0 20px; }
        .bot-icon-container { background: #16a34a; padding: 20px; border-radius: 24px; margin-bottom: 20px; box-shadow: 0 20px 40px rgba(255, 254, 173, 0.97); }
        .welcome-text { font-size: clamp(20px, 5vw, 35px); font-weight: 1000; line-height: 1.2; margin-bottom: 30px; color: #e2b6b6; }
        .suggestions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 600px; width: 100%; }
        .suggestion-pill { background: #ffffff; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; text-align: left; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .suggestion-pill:hover { border-color: #16a34a; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .messages-container { max-width: 900px; margin: 0 auto; width: 100%; padding: 0 20px; display: flex; flex-direction: column; gap: 24px; }
        .message-row { display: flex; flex-direction: column; width: 100%; }
        .row-user { align-items: flex-end; }
        .row-bot { align-items: flex-start; }
        .message-bubble { max-width: 80%; width: fit-content; padding: 14px 20px; font-size: 15px; line-height: 1.6; }
        .user-bubble { background: #000000; color: #ffffff; border-radius: 20px 20px 4px 20px; box-shadow: 0 4px 15px rgba(22, 179, 48, 0.94); margin-left: auto; }
        .bot-bubble { 
          background: #ffffff;
          color: #1e293b; border-radius: 20px 20px 20px 4px; border: 1px solid #e2e8f0;
          border-left: 4px solid #16a34a; box-shadow: 0 8px 32px rgba(0,0,0,0.05); position: relative;
        }
        .prose-content :global(ul) { list-style-type: disc; padding-left: 20px; }
        .prose-content :global(p) { margin-bottom: 8px; }
        .msg-image { width: 100%; max-width: 300px; border-radius: 12px; margin-bottom: 10px; }
        .msg-time { font-size: 10px; color: #94a3b8; margin-top: 6px; font-weight: 600; }
        .time-user { text-align: right; }
        .time-bot { text-align: left; }
        .chat-footer { padding: 20px 30px; display: flex; flex-direction: column; align-items: center; }
        .input-box-container { width: 100%; max-width: 900px; position: relative; }
        .input-field-wrapper { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 12px 16px; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .input-field-wrapper:focus-within { border-color: #16a34a; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .image-preview-float { position: absolute; top: -60px; left: 0; background: white; padding: 5px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: flex; align-items: center; }
        .close-preview { background: #ef4444; color: white; border-radius: 50%; padding: 2px; margin-left: -10px; margin-top: -30px; }
        .chat-textarea { width: 100%; border: none; background: transparent; outline: none; resize: none; font-size: 15px; padding: 8px 0; color: #1e293b; max-height: 150px; }
        .input-toolbar { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
        .icon-btn-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.2s; cursor: pointer; }
        .icon-btn-circle:hover { background: #f1f5f9; color: #16a34a; }
        .recording-active { background: #fee2e2; color: #ef4444; animation: pulse 1.5s infinite; }
        .send-action-btn { background: #16a34a; color: #fff; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .send-action-btn:hover:not(:disabled) { background: #15803d; transform: scale(1.05); }
        .send-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .disclaimer-text { font-size: 10px; color: #94a3b8; margin-top: 12px; text-align: center; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        .spinner-small { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        /* RESPONSIVE DESIGN (Mobile Tweaks) */
        @media (max-width: 768px) {
          .ai-sidebar-overlay.active { display: block; }
          .chat-history-sidebar { position: fixed; height: 100dvh; z-index: 200; box-shadow: 10px 0 30px rgba(0,0,0,0.1); }
          .sidebar-closed { margin-left: -300px; }
          .suggestions-grid { grid-template-columns: 1fr; width: 100%; }
          
          /* Padding Tweaks for Breathing Space on Mobile */
          .chat-header { padding: 12px 15px; }
          .chat-footer { padding: 15px 15px; }
          .messages-container { padding: 0 10px; }
          .message-bubble { max-width: 90%; font-size: 14px; }
          .bot-icon-container { padding: 15px; }
          .welcome-text { font-size: clamp(18px, 6vw, 24px); margin-bottom: 20px; }
        }
      `}</style>
    </div>
  );
}

/**
 * Main AI Page Wrapper
 */
export default function AiPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white text-slate-800 font-bold">Inapakia Kilicare AI...</div>}>
      <AiChatContent />
    </Suspense>
  );
}