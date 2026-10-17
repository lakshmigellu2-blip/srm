export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  avatarColor: string;
  about: string;
  isOnline: boolean;
  lastSeen: string;
}

export type MessageType = 'text' | 'image' | 'voice' | 'file';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  mediaCaption?: string;
  audioDuration?: number;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  timestamp: string;
  status: MessageStatus;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  deletedForEveryone?: boolean;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  avatarColor?: string;
  participants: string[]; // user IDs
  participantDetails?: User[];
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'image';
  content: string; // text or image data url
  caption?: string;
  bgColor?: string;
  timestamp: string;
  viewers: string[];
}

export interface CallSession {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  startedAt?: string;
}
