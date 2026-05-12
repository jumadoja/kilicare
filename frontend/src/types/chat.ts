export type RoomType = 'DM' | 'GROUP';

export interface ChatUser {
  id: number;
  username: string;
  avatar: string | null;
  is_online: boolean;
}

export interface Message {
  id: number;
  room: number;
  sender: ChatUser;
  content: string;
  attachment: string | null;
  reply_to: number | null;
  timestamp: string;
  is_delivered: boolean;
  is_read: boolean;
  is_deleted: boolean;
}

export interface Contact {
  user: ChatUser;
  last_message: Message | null;
  unread_count: number;
  room_name: string;
}

export interface WsOutgoing {
  action: 'message' | 'typing' | 'read_receipt';
  message?: string;
  receiver_id?: number;
}

export interface WsIncoming {
  action: string;
  data?: Message;
  user?: string;
  timestamp?: string;
}