"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";
import { useChatSystem } from "@/features/dashboard/hooks/useChatSystem";
import { useFetchContacts } from "@/features/dashboard/hooks/useChatQueries";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Search, 
  X, 
  Trash2, 
  CheckCircle2, 
  Circle,
  MoreVertical,
  ChevronLeft,
  Paperclip,
  Send,
  LayoutDashboard,
  Image as ImageIcon
} from "lucide-react";

// --- SKELETON LOADER (Babukubwa Version) ---
function MessagingSkeleton() {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-sidebar">
        <div className="shimmer skeleton-title" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-item">
            <div className="shimmer skeleton-avatar" />
            <div className="skeleton-text-group">
              <div className="shimmer skeleton-line-long" />
              <div className="shimmer skeleton-line-short" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton-main" />
      <style jsx>{`
        .skeleton-wrapper { display: flex; height: 100vh; width: 100%; background: #fff; }
        .skeleton-sidebar { width: 380px; border-right: 1px solid #f1f5f9; padding: 40px 24px; }
        .skeleton-title { height: 32px; width: 140px; margin-bottom: 40px; border-radius: 8px; }
        .skeleton-item { display: flex; gap: 16px; margin-bottom: 24px; }
        .skeleton-avatar { width: 52px; height: 52px; border-radius: 16px; }
        .skeleton-text-group { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
        .skeleton-line-long { height: 12px; width: 80%; border-radius: 4px; }
        .skeleton-line-short { height: 10px; width: 40%; border-radius: 4px; }
        .skeleton-main { flex: 1; background: #f8fafc; }
        .shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

// --- MAIN CONTENT ---
function ChatContent() {
  const router = useRouter();
  const { data: user } = useFetchMe();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  
  const { data: contacts, isLoading: loadingContacts } = useFetchContacts();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [activeReceiver, setActiveReceiver] = useState<any>(null);
  const [typedMessage, setTypedMessage] = useState("");
  
  const [selectedMsgs, setSelectedMsgs] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null); 
  const [selectedImageFull, setSelectedImageFull] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0); 
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { 
    messages, isOnline, isTyping, isUploading, 
    sendMessage, sendFile, sendTypingStatus, deleteChat, deleteSingleMessage 
  } = useChatSystem(user?.id || null, activeReceiver?.id || null);

  useEffect(() => {
    if (contacts && targetUserId) {
      const autoSelect = contacts.find((c: any) => String(c.id) === String(targetUserId));
      if (autoSelect) setActiveReceiver(autoSelect);
    }
  }, [contacts, targetUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const filteredContacts = contacts?.filter((c: any) => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendAction = () => {
    if (!typedMessage.trim() || !activeReceiver) return;
    sendMessage(typedMessage);
    setTypedMessage("");
    sendTypingStatus(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeReceiver) return;
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const confirmAndSendFile = async () => {
    if (!pendingFile || !activeReceiver) return;
    const fileToUpload = pendingFile;
    setPendingFile(null); 
    setFilePreview(null);
    try {
      setUploadProgress(0); 
      await sendFile(fileToUpload, (progress: number) => setUploadProgress(progress));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="messaging-wrapper-main">
      
      {/* MODALS */}
      <AnimatePresence>
        {(selectedImageFull || pendingFile || deleteTarget) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            {selectedImageFull && (
              <div onClick={() => setSelectedImageFull(null)} className="full-image-modal">
                <img src={selectedImageFull} alt="Full view" />
              </div>
            )}

            {pendingFile && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content-card">
                <div className="preview-container">
                  {filePreview ? <img src={filePreview} className="preview-img" /> : <div className="file-icon-large">📁</div>}
                </div>
                <h3>Tuma Faili?</h3>
                <p>{pendingFile.name}</p>
                <div className="modal-actions">
                  <button onClick={() => { setPendingFile(null); setFilePreview(null); }} className="btn-secondary">Ghairi</button>
                  <button onClick={confirmAndSendFile} className="btn-primary">Tuma Sasa</button>
                </div>
              </motion.div>
            )}

            {deleteTarget && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content-card">
                <div className="warning-icon">🗑️</div>
                <h3>Futa Mazungumzo?</h3>
                <p>Kitendo hiki hakiwezi kubatilishwa.</p>
                <div className="modal-actions">
                  <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Hapana</button>
                  <button onClick={async () => { await deleteChat(deleteTarget); setDeleteTarget(null); setActiveReceiver(null); }} className="btn-danger">Ndio, Futa</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="messaging-layout-grid">
        {/* SIDEBAR AREA */}
        <div className={`sidebar-area ${activeReceiver ? 'mobile-hide' : 'mobile-show'}`} style={{ width: isSidebarOpen ? '380px' : '0px' }}>
          <div className="sidebar-container-inner">
            <div className="sidebar-header">
              <div className="nav-top">
                <button onClick={() => router.push('/dashboard/tourist')} className="dash-back-btn">
                  <LayoutDashboard size={18} />
                  <span>Rudi</span>
                </button>
                <div className="nav-actions">
                  <button onClick={() => setIsSearchMode(!isSearchMode)} className="circle-btn">
                    {isSearchMode ? <X size={18} /> : <Search size={18} />}
                  </button>
                  <button onClick={() => setIsSidebarOpen(false)} className="circle-btn desktop-only">
                    <PanelLeftClose size={18} />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isSearchMode ? (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="search-box">
                    <input autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tafuta rafiki..." className="modern-input" />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sidebar-title">
                    <h2>Ujumbe</h2>
                    <div className="accent-dot" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="contacts-list chat-scrollbar">
              {loadingContacts ? (
                <div className="loading-text">Inapakia...</div>
              ) : (
                filteredContacts?.map((contact: any) => (
                  <div key={contact.id} onClick={() => setActiveReceiver(contact)} className={`contact-item ${activeReceiver?.id === contact.id ? 'active' : ''}`}>
                    <div className="avatar-box">
                      <div className="avatar-main">{contact.full_name?.charAt(0).toUpperCase()}</div>
                      {contact.is_online && <div className="online-indicator" />}
                    </div>
                    <div className="contact-details">
                      <div className="contact-row">
                        <span className="name">{contact.full_name}</span>
                        {contact.unread_count > 0 && <span className="unread">{contact.unread_count}</span>}
                      </div>
                      <p className="last-msg">{contact.last_message || "Anza mazungumzo mapya..."}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(contact.id); }} className="contact-delete-hover">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className={`chat-area ${!activeReceiver ? 'mobile-hide' : 'mobile-show'}`}>
          {activeReceiver ? (
            <>
              <div className="chat-header">
                <div className="header-info">
                  <button className="mobile-only back-to-list" onClick={() => setActiveReceiver(null)}>
                    <ChevronLeft size={24} />
                  </button>
                  {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="circle-btn desktop-only">
                      <PanelLeftOpen size={18} />
                    </button>
                  )}
                  <div className="active-avatar">{activeReceiver.full_name?.charAt(0)}</div>
                  <div className="active-meta">
                    <h4>{activeReceiver.full_name}</h4>
                    <p className={isOnline ? 'online' : ''}>{isOnline ? 'Online sasa' : 'Offline'}</p>
                  </div>
                </div>
                <div className="header-tools">
                   <button className="circle-btn"><MoreVertical size={18}/></button>
                </div>
              </div>

              <div ref={scrollRef} className="messages-container chat-scrollbar">
                {messages?.map((msg: any, idx: number) => {
                  const isMe = msg.sender === user?.id || msg.sender_id === user?.id;
                  return (
                    <div key={idx} className={`msg-row ${isMe ? 'me' : 'them'}`}>
                      <div className="msg-bubble">
                        {msg.attachment && (
                          <div className="msg-attachment">
                            <img src={msg.attachment} onClick={() => setSelectedImageFull(msg.attachment)} alt="file" />
                          </div>
                        )}
                        <p>{msg.content}</p>
                        <span className="msg-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button onClick={() => deleteSingleMessage(msg.id)} className="msg-del">×</button>
                      </div>
                    </div>
                  );
                })}
                {isTyping && <div className="typing-status">Anachapa...</div>}
              </div>

              <div className="input-area">
                {isUploading && (
                  <div className="upload-bar"><motion.div className="up-fill" animate={{ width: `${uploadProgress}%` }} /></div>
                )}
                <div className="input-box-wrapper">
                  <button onClick={() => fileInputRef.current?.click()} className="attach-btn">
                    <Paperclip size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} />
                  <input 
                    value={typedMessage} 
                    onChange={(e) => { setTypedMessage(e.target.value); sendTypingStatus(e.target.value.length > 0); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAction()}
                    placeholder="Andika ujumbe wako..." 
                  />
                  <button onClick={handleSendAction} className="send-btn">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-art">💬</div>
              <h3>Chagua Mazungumzo</h3>
              <p>Anza kuwasiliana na marafiki au wateja wako hapa.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .messaging-wrapper-main { height: 100vh; width: 100%; background: #fff; overflow: hidden; }
        .messaging-layout-grid { display: flex; height: 100%; }

        /* SIDEBAR */
        .sidebar-area {
          border-right: 1px solid #f1f5f9;
          background: #fcfdfe;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          z-index: 50;
        }
        .sidebar-container-inner { width: 380px; height: 100%; display: flex; flex-direction: column; }
        .sidebar-header { padding: 32px 24px 20px; }
        .nav-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        
        .dash-back-btn {
          display: flex; align-items: center; gap: 8px; background: #1A3C34; color: #fff;
          border: none; padding: 8px 16px; border-radius: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease;
        }
        .dash-back-btn:hover { background: #16a34a; transform: translateY(-1px); }

        .circle-btn {
          width: 40px; height: 40px; border-radius: 50%; border: 1px solid #f1f5f9;
          background: #fff; color: #64748b; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s;
        }
        .circle-btn:hover { background: #f8fafc; color: #16a34a; border-color: #16a34a; }

        .sidebar-title { display: flex; align-items: baseline; gap: 6px; }
        .sidebar-title h2 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
        .accent-dot { width: 8px; height: 8px; background: #16a34a; border-radius: 50%; }

        .modern-input {
          width: 100%; padding: 12px 16px; border-radius: 14px; border: 2px solid #f1f5f9;
          outline: none; font-size: 14px; transition: 0.2s;
        }
        .modern-input:focus { border-color: #16a34a; background: #fff; }

        .contacts-list { flex: 1; overflow-y: auto; padding: 0 16px 20px; }
        .contact-item {
          display: flex; gap: 14px; padding: 14px; border-radius: 20px; cursor: pointer;
          transition: 0.2s; align-items: center; position: relative; margin-bottom: 4px;
        }
        .contact-item:hover { background: #f8fafc; }
        .contact-item.active { background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.04); }

        .avatar-box { position: relative; }
        .avatar-main { 
          width: 52px; height: 52px; border-radius: 16px; background: #f1f5f9; 
          color: #1A3C34; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 18px; border: 2px solid #fff;
        }
        .online-indicator {
          position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px;
          background: #22c55e; border: 3px solid #fff; border-radius: 50%;
        }

        .contact-details { flex: 1; overflow: hidden; }
        .contact-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .name { font-weight: 700; color: #1e293b; font-size: 15px; }
        .unread { background: #16a34a; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 800; }
        .last-msg { font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .contact-delete-hover {
          position: absolute; right: 10px; opacity: 0; transition: 0.2s;
          background: #fee2e2; color: #ef4444; border: none; padding: 6px; border-radius: 8px;
        }
        .contact-item:hover .contact-delete-hover { opacity: 1; }

        /* CHAT AREA */
        .chat-area { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
        .chat-header {
          padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex;
          align-items: center; justify-content: space-between; background: rgba(255,255,255,0.8);
          backdrop-filter: blur(10px); z-index: 40;
        }
        .header-info { display: flex; align-items: center; gap: 14px; }
        .active-avatar { width: 44px; height: 44px; border-radius: 12px; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .active-meta h4 { margin: 0; font-size: 16px; color: #0f172a; }
        .active-meta p { margin: 0; font-size: 12px; color: #94a3b8; }
        .active-meta p.online { color: #22c55e; font-weight: 600; }

        .messages-container { flex: 1; padding: 24px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; }
        .msg-row { display: flex; width: 100%; }
        .msg-row.me { justify-content: flex-end; }
        .msg-bubble { 
          max-width: 65%; padding: 12px 16px; border-radius: 20px; position: relative;
          box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }
        .me .msg-bubble { background: #1A3C34; color: #fff; border-bottom-right-radius: 4px; }
        .them .msg-bubble { background: #fff; color: #334155; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }

        .msg-time { font-size: 10px; opacity: 0.6; display: block; margin-top: 4px; text-align: right; }
        .msg-del { 
          position: absolute; top: -8px; right: -8px; width: 20px; height: 20px;
          background: #ef4444; color: #fff; border-radius: 50%; border: none;
          font-size: 14px; cursor: pointer; opacity: 0; transition: 0.2s;
        }
        .msg-bubble:hover .msg-del { opacity: 1; }

        .msg-attachment img { max-width: 100%; border-radius: 12px; cursor: pointer; margin-bottom: 8px; }

        /* INPUT AREA */
        .input-area { padding: 20px 24px; background: #fff; border-top: 1px solid #f1f5f9; }
        .input-box-wrapper {
          display: flex; align-items: center; gap: 12px; background: #f1f5f9;
          padding: 8px 16px; border-radius: 20px;
        }
        .input-box-wrapper input { 
          flex: 1; border: none; background: transparent; outline: none; 
          padding: 10px 0; font-size: 14px; color: #1e293b;
        }
        .attach-btn, .send-btn { 
          background: none; border: none; color: #64748b; cursor: pointer; transition: 0.2s;
        }
        .send-btn { 
          background: #16a34a; color: #fff; width: 40px; height: 40px; 
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
        }
        .send-btn:hover { background: #15803d; transform: scale(1.05); }

        /* MODALS */
        .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
        .modal-content-card { background: #fff; padding: 32px; border-radius: 30px; width: 90%; max-width: 400px; text-align: center; }
        .btn-primary { background: #16a34a; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; width: 100%; margin-top: 10px; }
        .btn-secondary { background: #f1f5f9; color: #64748b; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; width: 100%; }
        .btn-danger { background: #ef4444; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; width: 100%; margin-top: 10px; }

        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
        .empty-art { font-size: 64px; margin-bottom: 16px; }

        @media (max-width: 1024px) {
          .sidebar-area { position: absolute; left: 0; top: 0; bottom: 0; }
          .mobile-hide { display: none !important; }
          .mobile-show { display: flex !important; width: 100% !important; }
          .desktop-only { display: none !important; }
          .sidebar-container-inner { width: 100vw; }
        }

        .chat-scrollbar::-webkit-scrollbar { width: 5px; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default function MessagingPage() {
  return (
    <Suspense fallback={<MessagingSkeleton />}>
      <ChatContent />
    </Suspense>
  );
}