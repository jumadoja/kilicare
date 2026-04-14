"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

export const useChatSystem = (myId: number | null, receiverId: number | null) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. TENGENEZA ROOM NAME
  const roomName = useMemo(() => {
    if (!myId || !receiverId) return null;
    const sortedIds = [myId, receiverId].sort((a, b) => a - b);
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }, [myId, receiverId]);

  // 2. FETCH CHAT HISTORY
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-history", receiverId],
    queryFn: async () => {
      if (!receiverId) return [];
      const response = await apiClient.get(`/api/messages/history/${receiverId}/`);
      return response.data;
    },
    enabled: !!receiverId && !!myId,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });

  const updateMessageList = useCallback((newMessage: any) => {
    queryClient.setQueryData(["chat-history", receiverId], (old: any[] | undefined) => {
      const currentMessages = old || [];
      const exists = currentMessages.find(m => m.id === newMessage.id);
      if (exists) return currentMessages;
      return [...currentMessages, newMessage];
    });
  }, [queryClient, receiverId]);

  // 3. WEBSOCKET ENGINE
  useEffect(() => {
    if (!roomName || !myId || !receiverId) return;

    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      console.warn("WebSocket: accessToken haijapatikana!");
      return;
    }

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${roomName}/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log(`%c [WS CONNECTED]: Room -> ${roomName}`, "color: green; font-weight: bold;");
      socket.send(JSON.stringify({ action: "status", status: "online" }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat_message" || data.action === "message") {
        updateMessageList({
          id: data.id || Date.now(),
          sender: data.sender,
          sender_id: data.sender,
          content: data.message || data.content,
          attachment: data.attachment || null,
          timestamp: data.timestamp || new Date().toISOString(),
          is_read: data.is_read || false,
        });

        if (data.sender === receiverId && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            action: "read_receipt", 
            message_id: data.id,
            sender_id: receiverId
          }));
        }
      }

      if (data.type === "chat_typing" && data.sender === receiverId) {
        setIsTyping(data.typing);
      }

      if (data.type === "user_status" && data.user_id === receiverId) {
        setIsOnline(data.status === "online");
      }

      if (data.action === "read_receipt") {
        queryClient.setQueryData(["chat-history", receiverId], (old: any[] | undefined) =>
          old?.map((m: any) => 
            m.id === data.message_id ? { ...m, is_read: true } : m
          )
        );
      }
    };

    socket.onclose = () => {
      setIsOnline(false);
      console.log("%c [WS CLOSED]: Connection imefungwa.", "color: orange;");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "status", status: "offline" }));
        socket.close();
      }
    };
  }, [roomName, myId, receiverId, queryClient, updateMessageList]);

  // 4. CHAT ACTIONS
  const sendMessage = useCallback((content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && content.trim()) {
      socketRef.current.send(JSON.stringify({
        action: "message",
        message: content,
        receiver_id: receiverId,
      }));
    }
  }, [receiverId]);

  const sendFile = useCallback(async (file: File, onProgress?: (pct: number) => void) => {
    if (!receiverId) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("attachment", file);
      formData.append("receiver", receiverId.toString());
      formData.append("content", `Sent a file: ${file.name}`); 

      const response = await apiClient.post("/api/messages/send/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });

      const newMessage = {
        id: response.data.id || Date.now(),
        sender: myId,
        sender_id: myId,
        content: response.data.content || file.name,
        attachment: response.data.attachment,
        timestamp: new Date().toISOString(),
        is_read: false,
      };
      updateMessageList(newMessage);

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          action: "message",
          message: file.name,
          attachment: response.data.attachment,
          receiver_id: receiverId,
        }));
      }

      return response.data;
      
    } catch (error: any) {
      console.error("Upload failed details:", error.response?.data || error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [receiverId, myId, updateMessageList]);

  const sendTypingStatus = useCallback((typing: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "typing", typing }));
    }
  }, []);

  // --- LOGIC YA DELETE CHAT NZIMA ---
  const deleteChat = useCallback(async (contactId: number) => {
    try {
      // Imebadilishwa kuwa DELETE ili iendane na DeleteChatView mpya
      const response = await apiClient.delete(`/api/messages/delete-chat/${contactId}/`);
      
      if (response.status === 200) {
        queryClient.setQueryData(["chat-history", contactId], []);
        queryClient.invalidateQueries({ queryKey: ["chat-contacts"] });
        return { success: true };
      }
    } catch (error) {
      console.error("Delete chat failed:", error);
      return { success: false, error };
    }
  }, [queryClient]);

  // --- LOGIC YA DELETE SINGLE MESSAGE (Fixed URL) ---
  const deleteSingleMessage = useCallback(async (messageId: number) => {
    try {
      // URL inalingana na path('messages/delete/<int:message_id>/', ...)
      const response = await apiClient.delete(`/api/messages/delete/${messageId}/`);
      
      if (response.status === 200 || response.status === 204) {
        queryClient.setQueryData(["chat-history", receiverId], (old: any[] | undefined) => {
          return old?.filter((m: any) => m.id !== messageId) || [];
        });
        return { success: true };
      }
    } catch (error) {
      console.error("Delete message failed:", error);
      return { success: false, error };
    }
  }, [queryClient, receiverId]);

  return {
    messages,
    setMessages: (data: any) => queryClient.setQueryData(["chat-history", receiverId], data),
    isLoading,
    isOnline,
    isTyping,
    isUploading,
    sendMessage,
    sendFile,
    sendTypingStatus,
    deleteChat,
    deleteSingleMessage, 
  };
};