"use client";
import { useState, useRef, useEffect } from "react";
// Tumesafisha import hapa - tunatumia useChatSystem pekee
import { useChatSystem } from "@/features/dashboard/hooks/useChatSystem";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";

export default function MessagingSection() {
  const user = useAuthStore(s => s.user);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Pata Receiver ID (Mfano: 2 kwa ajili ya Local Guide)
  const activeReceiverId = 2; 

  // 2. Tumia Hook ya kisasa (Destructuring kila kitu tunachohitaji)
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    isOnline, 
    isTyping, 
    sendTypingStatus 
  } = useChatSystem(user?.id || null, activeReceiverId);

  // Auto-scroll kila ujumbe mpya ukija
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]); // Tumeongeza isTyping hapa ili i-scroll pia mwenzako akianza kuandika

  const handleSend = () => {
    if (!message.trim() || !activeReceiverId) return;

    // Tunatumia sendMessage badala ya mutate
    try {
      sendMessage(message);
      setMessage(""); // Safisha input
      sendTypingStatus(false); // Zima typing status baada ya kutuma
    } catch (err) {
      toast.error("Imefeli kutuma ujumbe!");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '450px', borderRadius: '35px', overflow: 'hidden', border: '1px solid #f1f5f9', backgroundColor: 'white' }}>
      
      {/* --- Header --- */}
      <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '35px', height: '35px', borderRadius: '12px', backgroundColor: '#1A3C34', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
            G
          </div>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '800', margin: 0 }}>Local Guide</h3>
            {/* Status inatoka kwenye Real-time WebSocket sasa hivi */}
            <p style={{ fontSize: '10px', color: isOnline ? '#22c55e' : '#94a3b8', margin: 0, fontWeight: '700' }}>
              ● {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* --- Messages Area --- */}
      <div 
        ref={scrollRef} 
        style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#F9FBFC', display: 'flex', flexDirection: 'column', gap: '12px' }}
        className="scrollbar-hide"
      >
        {isLoading && <p style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>Checking messages...</p>}
        
        {messages?.map((msg: any) => {
          const isMe = msg.sender === "me" || msg.sender === user?.id;
          
          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: isMe ? '20px 20px 5px 20px' : '20px 20px 20px 5px', 
                fontSize: '13px', 
                backgroundColor: isMe ? '#1A3C34' : 'white', 
                color: isMe ? 'white' : '#1e293b', 
                boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                border: isMe ? 'none' : '1px solid #f1f5f9',
                fontWeight: '500'
              }}>
                {msg.content}
              </div>
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                </p>
                {/* Ticks za kishua (Blue Ticks logic) */}
                {isMe && (
                  <span style={{ fontSize: '12px', color: msg.is_read ? '#3b82f6' : '#94a3b8' }}>
                    {msg.is_read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator Bubble */}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', backgroundColor: '#e2e8f0', padding: '8px 12px', borderRadius: '15px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
            Guide is typing...
          </div>
        )}
      </div>

      {/* --- Input Area --- */}
      <div style={{ padding: '15px', backgroundColor: 'white', borderTop: '1px solid #f8fafc' }}>
        <div style={{ display: 'flex', gap: '10px', backgroundColor: '#F3F5F7', padding: '10px', borderRadius: '20px' }}>
          <input 
            style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 10px', outline: 'none', fontSize: '13px', fontWeight: '600' }}
            value={message} 
            onChange={e => {
              setMessage(e.target.value);
              sendTypingStatus(e.target.value.length > 0);
            }} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Write a message..."
          />
          <button 
            onClick={handleSend} 
            style={{ 
              backgroundColor: '#16a34a', 
              border: 'none', 
              padding: '8px 18px', 
              borderRadius: '15px', 
              color: 'white', 
              fontWeight: '800', 
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 4px 10px rgba(22,163,74,0.2)'
            }}
          >
            SEND
          </button>
        </div>
      </div>

    </div>
  );
}