import { create } from 'zustand';
import { Contact, Message } from '@/types';

interface ChatState {
  contacts: Contact[];
  activeRoom: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  unreadTotal: number;
  setContacts: (c: Contact[]) => void;
  setActiveRoom: (r: string | null) => void;
  addMessage: (room: string, msg: Message) => void;
  setMessages: (room: string, msgs: Message[]) => void;
  setTyping: (room: string, users: string[]) => void;
  markRead: (room: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  contacts: [],
  activeRoom: null,
  messages: {},
  typingUsers: {},
  unreadTotal: 0,
  setContacts: (contacts) =>
    set({ contacts, unreadTotal: contacts.reduce((a, c) => a + c.unread_count, 0) }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  addMessage: (room, msg) =>
    set((s) => ({ messages: { ...s.messages, [room]: [...(s.messages[room] ?? []), msg] } })),
  setMessages: (room, msgs) =>
    set((s) => ({ messages: { ...s.messages, [room]: msgs } })),
  setTyping: (room, users) =>
    set((s) => ({ typingUsers: { ...s.typingUsers, [room]: users } })),
  markRead: (room) =>
    set((s) => ({
      contacts: s.contacts.map((c) => c.room_name === room ? { ...c, unread_count: 0 } : c),
      unreadTotal: Math.max(0, s.unreadTotal - (s.contacts.find((c) => c.room_name === room)?.unread_count ?? 0)),
    })),
}));