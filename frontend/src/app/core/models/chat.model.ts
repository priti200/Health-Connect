export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR';
  avatar?: string;
  specialization?: string;
  affiliation?: string;
}

export interface Message {
  id: number;
  chatId: number;
  sender: User;
  content: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'EDITED' | 'DELETED';
  type?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'FILE' | 'SYSTEM' | 'APPOINTMENT' | 'PRESCRIPTION' | 'URGENT' | 'EMOJI' | 'LOCATION' | 'CONTACT' | 'VOICE_CALL' | 'VIDEO_CALL';
  createdAt: string;
  readAt?: string;
  deliveredAt?: string;
  editedAt?: string;

  // File attachment fields
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;

  // Reply functionality
  replyToMessage?: Message;

  // Reactions
  reactions?: { [userId: number]: string };

  // Mentions
  mentionedUserIds?: number[];

  // Additional flags
  isUrgent?: boolean;
  isEdited?: boolean;
  hasAttachment?: boolean;
}

export interface Chat {
  id: number;
  patient: User;
  doctor: User;
  lastMessage?: Message;
  unreadCount: number;
  relatedAppointment?: any;
  type?: string;
  status?: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface ChatRequest {
  participantId: number;
}

export interface MessageRequest {
  chatId: number;
  content: string;
}

export interface TypingNotification {
  userId: number;
  userEmail: string;
  status: 'typing' | 'stopped';
}

// Enhanced interfaces for real-time features
export interface MessageStatusUpdate {
  messageId: number;
  chatId: number;
  status: string;
  timestamp: string;
}

export interface MessageReactionUpdate {
  messageId: number;
  chatId: number;
  userId: number;
  reaction: string;
  action: 'added' | 'removed';
  timestamp: string;
}

export interface UserPresence {
  userId: number;
  userName: string;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE' | 'INVISIBLE';
  statusMessage?: string;
  lastSeen: Date;
  isTyping?: boolean;
  typingInChatId?: number;
}

export interface PresenceTypingNotification {
  userId: number;
  chatId: number;
  isTyping: boolean;
  timestamp: Date;
}
