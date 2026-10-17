import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { User, Chat, Message, UserStatusStory, CallSession } from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload limits for sending voice notes and image attachments
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-Memory Database
const users = new Map<string, User>();
const chats = new Map<string, Chat>();
const messages = new Map<string, Message[]>(); // chatId -> Message[]
let statuses: UserStatusStory[] = [];
const activeCalls = new Map<string, CallSession>();

// Seed default users
const defaultSeedUsers: User[] = [
  {
    id: 'user_lakshmi',
    email: 'lakshmigellu2@gmail.com',
    username: 'Lakshmi Gellu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi',
    avatarColor: '#128c7e',
    about: 'Available | నమస్కారం! చాట్ చేయండి 😊',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'user_ravi',
    email: 'ravi.kumar@example.com',
    username: 'Ravi Kumar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi',
    avatarColor: '#25D366',
    about: 'At work | Urgent calls only',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'user_priya',
    email: 'priya.sharma@example.com',
    username: 'Priya Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    avatarColor: '#e91e63',
    about: 'Living my best life ✨',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'user_suresh',
    email: 'suresh.reddy@example.com',
    username: 'Suresh Reddy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
    avatarColor: '#ff9800',
    about: 'Cricket enthusiast 🏏',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
];

defaultSeedUsers.forEach(u => users.set(u.id, u));

// Seed default chats & messages
const seedGroupChatId = 'chat_friends_group';
const seedDmChatId = 'dm_lakshmi_ravi';

const seedGroupChat: Chat = {
  id: seedGroupChatId,
  type: 'group',
  name: 'Friends Hub 🚀 (ఫ్రెండ్స్ అడ్డా)',
  avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=FriendsHub',
  avatarColor: '#00a884',
  participants: ['user_lakshmi', 'user_ravi', 'user_priya', 'user_suresh'],
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  updatedAt: new Date().toISOString(),
  unreadCount: 0,
};
chats.set(seedGroupChatId, seedGroupChat);

const seedDmChat: Chat = {
  id: seedDmChatId,
  type: 'direct',
  participants: ['user_lakshmi', 'user_ravi'],
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  updatedAt: new Date().toISOString(),
  unreadCount: 0,
};
chats.set(seedDmChatId, seedDmChat);

const groupInitialMessages: Message[] = [
  {
    id: 'msg_1',
    chatId: seedGroupChatId,
    senderId: 'user_ravi',
    senderName: 'Ravi Kumar',
    text: 'హలో అందరికీ! మన WhatsApp వెబ్ గ్రూప్ సూపర్ గా ఉంది కదా! 🎉',
    type: 'text',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'read',
    reactions: { '👍': ['user_lakshmi', 'user_suresh'], '🔥': ['user_priya'] },
  },
  {
    id: 'msg_2',
    chatId: seedGroupChatId,
    senderId: 'user_priya',
    senderName: 'Priya Sharma',
    text: 'అవును రవి, మన ఫ్రెండ్స్ అందరం ఇక్కడ హ్యాపీగా వెబ్ బ్రౌజర్ లోనే మాట్లాడుకోవచ్చు! 😊',
    type: 'text',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'read',
  },
  {
    id: 'msg_3',
    chatId: seedGroupChatId,
    senderId: 'user_suresh',
    senderName: 'Suresh Reddy',
    text: 'ఈ వీకెండ్ ప్లాన్ ఏంటి అందరూ? ఎక్కడికైనా వెళ్దామా?',
    type: 'text',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'read',
  },
];
messages.set(seedGroupChatId, groupInitialMessages);
seedGroupChat.lastMessage = groupInitialMessages[groupInitialMessages.length - 1];

const dmInitialMessages: Message[] = [
  {
    id: 'msg_dm_1',
    chatId: seedDmChatId,
    senderId: 'user_ravi',
    senderName: 'Ravi Kumar',
    text: 'హలో లక్ష్మి! ప్రాజెక్ట్ అప్‌డేట్ షేర్ చేయగలవా?',
    type: 'text',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'read',
  },
  {
    id: 'msg_dm_2',
    chatId: seedDmChatId,
    senderId: 'user_lakshmi',
    senderName: 'Lakshmi Gellu',
    text: 'షూర్ రవి! నేను ఇప్పుడే ఈ వెబ్ చాట్ ద్వారా అన్నీ అప్‌డేట్స్ పంపుతున్నాను.',
    type: 'text',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'read',
  },
];
messages.set(seedDmChatId, dmInitialMessages);
seedDmChat.lastMessage = dmInitialMessages[dmInitialMessages.length - 1];

// Seed Statuses
statuses = [
  {
    id: 'status_1',
    userId: 'user_ravi',
    userName: 'Ravi Kumar',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi',
    type: 'text',
    content: '☕ Beautiful morning! Wishing everyone a productive day ahead.',
    bgColor: '#005c4b',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    viewers: ['user_lakshmi'],
  },
  {
    id: 'status_2',
    userId: 'user_priya',
    userName: 'Priya Sharma',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    type: 'text',
    content: 'Weekend trip to hills! 🌄 Exploring nature.',
    bgColor: '#7b1fa2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    viewers: ['user_lakshmi', 'user_ravi'],
  },
];

// SSE Client Connections
interface SSEClient {
  id: string;
  userId: string;
  res: Response;
}
const sseClients = new Map<string, SSEClient>();

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients.values()) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(client.id);
    }
  }
}

// ----------------------------------------------------
// SSE Endpoint
// ----------------------------------------------------
app.get('/api/events', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'guest';
  const clientId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.set(clientId, { id: clientId, userId, res });

  // Update user online status
  if (users.has(userId)) {
    const user = users.get(userId)!;
    user.isOnline = true;
    user.lastSeen = new Date().toISOString();
    broadcastSSE('user_status', { userId, isOnline: true, lastSeen: user.lastSeen });
  }

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, userId })}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientId);
    // If no other connections from this user, mark offline after 5 seconds
    const hasOtherSessions = Array.from(sseClients.values()).some(c => c.userId === userId);
    if (!hasOtherSessions && users.has(userId)) {
      setTimeout(() => {
        const stillActive = Array.from(sseClients.values()).some(c => c.userId === userId);
        if (!stillActive && users.has(userId)) {
          const user = users.get(userId)!;
          user.isOnline = false;
          user.lastSeen = new Date().toISOString();
          broadcastSSE('user_status', { userId, isOnline: false, lastSeen: user.lastSeen });
        }
      }, 5000);
    }
  });
});

// ----------------------------------------------------
// Auth & User Endpoints
// ----------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, username, avatar } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: 'Email and username are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const cleanUsername = username.trim();

  // Find existing user by email or create new one
  let user = Array.from(users.values()).find(u => u.email.toLowerCase() === normalizedEmail);

  if (user) {
    user.username = cleanUsername;
    user.isOnline = true;
    user.lastSeen = new Date().toISOString();
    if (avatar) user.avatar = avatar;
  } else {
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const avatarColorPalette = ['#00a884', '#128c7e', '#25D366', '#0284c7', '#7c3aed', '#db2777', '#ea580c'];
    const chosenColor = avatarColorPalette[Math.floor(Math.random() * avatarColorPalette.length)];

    user = {
      id,
      email: normalizedEmail,
      username: cleanUsername,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`,
      avatarColor: chosenColor,
      about: 'హలో! నేను WhatsApp వెబ్ వాడుతున్నాను.',
      isOnline: true,
      lastSeen: new Date().toISOString(),
    };
    users.set(id, user);

    // Auto-add new user to the default Friends Hub group so they can immediately chat!
    const friendsGroup = chats.get(seedGroupChatId);
    if (friendsGroup && !friendsGroup.participants.includes(id)) {
      friendsGroup.participants.push(id);
      friendsGroup.updatedAt = new Date().toISOString();
    }
  }

  broadcastSSE('user_joined', user);
  return res.json({ user });
});

app.post('/api/auth/profile', (req: Request, res: Response) => {
  const { userId, username, about, avatar } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (username) user.username = username.trim();
  if (about !== undefined) user.about = about.trim();
  if (avatar) user.avatar = avatar;

  broadcastSSE('user_updated', user);
  return res.json({ user });
});

app.get('/api/users', (req: Request, res: Response) => {
  return res.json({ users: Array.from(users.values()) });
});

// ----------------------------------------------------
// Chats Endpoints
// ----------------------------------------------------
app.get('/api/chats', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const userChats = Array.from(chats.values())
    .filter(c => c.participants.includes(userId))
    .map(chat => {
      const participantDetails = chat.participants
        .map(pId => users.get(pId))
        .filter(Boolean) as User[];

      let displayName = chat.name;
      let displayAvatar = chat.avatar;

      if (chat.type === 'direct') {
        const otherUser = participantDetails.find(p => p.id !== userId) || participantDetails[0];
        displayName = otherUser ? otherUser.username : 'Friend';
        displayAvatar = otherUser ? otherUser.avatar : '';
      }

      return {
        ...chat,
        name: displayName,
        avatar: displayAvatar,
        participantDetails,
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return res.json({ chats: userChats });
});

app.post('/api/chats', (req: Request, res: Response) => {
  const { type, name, participants, creatorId } = req.body;
  if (!participants || !Array.isArray(participants) || participants.length < 2) {
    return res.status(400).json({ error: 'At least 2 participants required' });
  }

  // If direct chat, check if one already exists
  if (type === 'direct') {
    const existing = Array.from(chats.values()).find(
      c => c.type === 'direct' &&
        c.participants.length === 2 &&
        c.participants.includes(participants[0]) &&
        c.participants.includes(participants[1])
    );
    if (existing) {
      return res.json({ chat: existing, isExisting: true });
    }
  }

  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newChat: Chat = {
    id: chatId,
    type: type || 'direct',
    name: type === 'group' ? (name || 'New Group') : undefined,
    avatar: type === 'group' ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || chatId)}` : undefined,
    participants,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 0,
  };

  chats.set(chatId, newChat);
  messages.set(chatId, []);

  broadcastSSE('chat_created', newChat);
  return res.json({ chat: newChat, isExisting: false });
});

// ----------------------------------------------------
// Messages Endpoints
// ----------------------------------------------------
app.get('/api/messages/:chatId', (req: Request, res: Response) => {
  const { chatId } = req.params;
  const chatMessages = messages.get(chatId) || [];
  return res.json({ messages: chatMessages });
});

app.post('/api/messages', (req: Request, res: Response) => {
  const { chatId, senderId, text, type, mediaUrl, mediaCaption, audioDuration, replyTo } = req.body;

  if (!chatId || !senderId) {
    return res.status(400).json({ error: 'chatId and senderId are required' });
  }

  const sender = users.get(senderId);
  const senderName = sender ? sender.username : 'User';

  const message: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    chatId,
    senderId,
    senderName,
    text: text || '',
    type: type || 'text',
    mediaUrl,
    mediaCaption,
    audioDuration,
    replyTo,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    reactions: {},
  };

  const chatMessages = messages.get(chatId) || [];
  chatMessages.push(message);
  messages.set(chatId, chatMessages);

  // Update chat last message & updatedAt
  const chat = chats.get(chatId);
  if (chat) {
    chat.lastMessage = message;
    chat.updatedAt = message.timestamp;
  }

  broadcastSSE('new_message', { message, chatId });
  return res.json({ message });
});

app.post('/api/messages/:id/react', (req: Request, res: Response) => {
  const { id } = req.params;
  const { chatId, userId, emoji } = req.body;

  const chatMessages = messages.get(chatId);
  if (!chatMessages) return res.status(404).json({ error: 'Chat not found' });

  const message = chatMessages.find(m => m.id === id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  if (!message.reactions) message.reactions = {};

  const currentReactors = message.reactions[emoji] || [];
  if (currentReactors.includes(userId)) {
    // Remove reaction (toggle off)
    message.reactions[emoji] = currentReactors.filter(uid => uid !== userId);
    if (message.reactions[emoji].length === 0) {
      delete message.reactions[emoji];
    }
  } else {
    // Add reaction
    message.reactions[emoji] = [...currentReactors, userId];
  }

  broadcastSSE('message_reaction', { messageId: id, chatId, reactions: message.reactions });
  return res.json({ reactions: message.reactions });
});

app.delete('/api/messages/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const chatId = req.query.chatId as string;

  const chatMessages = messages.get(chatId);
  if (!chatMessages) return res.status(404).json({ error: 'Chat not found' });

  const message = chatMessages.find(m => m.id === id);
  if (!message) return res.status(404).json({ error: 'Message not found' });

  message.deletedForEveryone = true;
  message.text = 'This message was deleted';
  delete message.mediaUrl;

  broadcastSSE('message_deleted', { messageId: id, chatId });
  return res.json({ success: true, message });
});

// Typing indicator
app.post('/api/typing', (req: Request, res: Response) => {
  const { chatId, userId, userName, isTyping } = req.body;
  broadcastSSE('user_typing', { chatId, userId, userName, isTyping });
  return res.json({ success: true });
});

// ----------------------------------------------------
// Status Updates (Stories) Endpoints
// ----------------------------------------------------
app.get('/api/statuses', (req: Request, res: Response) => {
  // Filter statuses within 24 hours
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  statuses = statuses.filter(s => new Date(s.timestamp).getTime() > cutoff);
  return res.json({ statuses });
});

app.post('/api/statuses', (req: Request, res: Response) => {
  const { userId, type, content, caption, bgColor } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newStatus: UserStatusStory = {
    id: `status_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    userName: user.username,
    userAvatar: user.avatar,
    type: type || 'text',
    content: content || '',
    caption,
    bgColor: bgColor || '#005c4b',
    timestamp: new Date().toISOString(),
    viewers: [],
  };

  statuses.unshift(newStatus);
  broadcastSSE('new_status', newStatus);
  return res.json({ status: newStatus });
});

// ----------------------------------------------------
// Audio / Video Call Signaling
// ----------------------------------------------------
app.post('/api/calls/start', (req: Request, res: Response) => {
  const { callerId, receiverId, type } = req.body;
  const caller = users.get(callerId);
  if (!caller) return res.status(404).json({ error: 'Caller not found' });

  const callId = `call_${Date.now()}`;
  const session: CallSession = {
    callId,
    callerId,
    callerName: caller.username,
    callerAvatar: caller.avatar,
    receiverId,
    type: type || 'audio',
    status: 'ringing',
    startedAt: new Date().toISOString(),
  };

  activeCalls.set(callId, session);
  broadcastSSE('call_incoming', session);
  return res.json({ session });
});

app.post('/api/calls/action', (req: Request, res: Response) => {
  const { callId, action } = req.body; // 'accept' | 'reject' | 'end'
  const session = activeCalls.get(callId);
  if (!session) return res.status(404).json({ error: 'Call not found' });

  if (action === 'accept') {
    session.status = 'connected';
  } else if (action === 'reject') {
    session.status = 'rejected';
    activeCalls.delete(callId);
  } else if (action === 'end') {
    session.status = 'ended';
    activeCalls.delete(callId);
  }

  broadcastSSE('call_status_update', session);
  return res.json({ session });
});

// ----------------------------------------------------
// Vite Dev Server or Production Static Serving
// ----------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WhatsApp Web Chat Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
