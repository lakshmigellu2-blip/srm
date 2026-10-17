import React, { useState, useEffect, useRef } from 'react';
import { User, Chat, Message, UserStatusStory, CallSession, MessageType } from './types';
import { Language, translations } from './utils/teluguTranslations';
import { playIncomingSound, playOutgoingSound } from './utils/sound';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LoginModal } from './components/LoginModal';
import { CallModal } from './components/CallModal';
import { StatusModal } from './components/StatusModal';
import { NewChatModal } from './components/NewChatModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { MessageSquare, ShieldCheck, Lock, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('whatsapp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('whatsapp_lang') as Language) || 'te';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('whatsapp_theme') === 'dark';
  });

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<UserStatusStory[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // Modals & Drawers
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // chatId -> userName

  const sseRef = useRef<EventSource | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const t = translations[lang];

  // Apply dark mode class to html document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('whatsapp_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('whatsapp_theme', 'light');
    }
  }, [isDarkMode]);

  // Save language preference
  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'te' : 'en';
    setLang(nextLang);
    localStorage.setItem('whatsapp_lang', nextLang);
  };

  // BroadcastChannel for instant local multi-tab cross communication
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('whatsapp_web_sync');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'NEW_MESSAGE') {
          handleIncomingMessage(payload.message, payload.chatId);
        } else if (type === 'USER_TYPING') {
          handleTypingEvent(payload);
        }
      };

      return () => {
        channel.close();
      };
    } catch {
      // BroadcastChannel unsupported
    }
  }, [currentUser, activeChatId]);

  // Load initial users and statuses
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setAllUsers(data.users);
      })
      .catch(() => {});

    fetch('/api/statuses')
      .then((res) => res.json())
      .then((data) => {
        if (data.statuses) setStatuses(data.statuses);
      })
      .catch(() => {});
  }, []);

  // Fetch chats when currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/chats?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.chats) {
          setChats(data.chats);
          // Set first chat as default on desktop if none selected
          if (!activeChatId && data.chats.length > 0 && window.innerWidth >= 768) {
            setActiveChatId(data.chats[0].id);
          }
        }
      })
      .catch(() => {});
  }, [currentUser]);

  // Fetch messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    fetch(`/api/messages/${activeChatId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  }, [activeChatId]);

  // Setup Server-Sent Events (SSE) for real-time messaging across friends & devices
  useEffect(() => {
    if (!currentUser) return;

    if (sseRef.current) {
      sseRef.current.close();
    }

    const eventSource = new EventSource(`/api/events?userId=${currentUser.id}`);
    sseRef.current = eventSource;

    eventSource.addEventListener('new_message', (e) => {
      try {
        const { message, chatId } = JSON.parse(e.data);
        handleIncomingMessage(message, chatId);
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    });

    eventSource.addEventListener('message_reaction', (e) => {
      try {
        const { messageId, reactions } = JSON.parse(e.data);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        );
      } catch {}
    });

    eventSource.addEventListener('message_deleted', (e) => {
      try {
        const { messageId } = JSON.parse(e.data);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, deletedForEveryone: true, text: t.deletedMessage }
              : m
          )
        );
      } catch {}
    });

    eventSource.addEventListener('user_typing', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleTypingEvent(data);
      } catch {}
    });

    eventSource.addEventListener('new_status', (e) => {
      try {
        const newStatus = JSON.parse(e.data);
        setStatuses((prev) => [newStatus, ...prev.filter((s) => s.id !== newStatus.id)]);
      } catch {}
    });

    eventSource.addEventListener('call_incoming', (e) => {
      try {
        const session: CallSession = JSON.parse(e.data);
        if (session.receiverId === currentUser.id || session.receiverId === 'group') {
          setActiveCall(session);
        }
      } catch {}
    });

    eventSource.addEventListener('call_status_update', (e) => {
      try {
        const session: CallSession = JSON.parse(e.data);
        if (session.status === 'ended' || session.status === 'rejected') {
          setActiveCall(null);
        } else {
          setActiveCall(session);
        }
      } catch {}
    });

    return () => {
      eventSource.close();
    };
  }, [currentUser, activeChatId]);

  const handleIncomingMessage = (message: Message, chatId: string) => {
    // If sent to current active chat, append message
    if (activeChatId === chatId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }

    // Play incoming sound if from someone else
    if (currentUser && message.senderId !== currentUser.id) {
      playIncomingSound();
    }

    // Update chats list with latest message and move to top
    setChats((prev) => {
      const chatIndex = prev.findIndex((c) => c.id === chatId);
      if (chatIndex === -1) {
        // Refresh chats if a brand new chat was started
        if (currentUser) {
          fetch(`/api/chats?userId=${currentUser.id}`)
            .then((r) => r.json())
            .then((d) => d.chats && setChats(d.chats));
        }
        return prev;
      }

      const updatedChat = {
        ...prev[chatIndex],
        lastMessage: message,
        updatedAt: message.timestamp,
        unreadCount: activeChatId === chatId ? 0 : (prev[chatIndex].unreadCount || 0) + 1,
      };

      const rest = prev.filter((c) => c.id !== chatId);
      return [updatedChat, ...rest];
    });
  };

  const handleTypingEvent = (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => {
    if (currentUser && data.userId === currentUser.id) return;

    setTypingUsers((prev) => {
      if (data.isTyping) {
        return { ...prev, [data.chatId]: data.userName };
      } else {
        const copy = { ...prev };
        delete copy[data.chatId];
        return copy;
      }
    });
  };

  // Login handler
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('whatsapp_user', JSON.stringify(user));
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('whatsapp_user');
    setActiveChatId(null);
    setShowProfileDrawer(false);
  };

  // Switch demo test user
  const handleSwitchUser = async (email: string, username: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });
      const data = await res.json();
      if (data.user) {
        handleLogin(data.user);
        setShowProfileDrawer(false);
      }
    } catch {}
  };

  // Send message handler
  const handleSendMessage = async (payload: {
    chatId: string;
    text: string;
    type?: MessageType;
    mediaUrl?: string;
    audioDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  }) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          senderId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.message) {
        // Broadcast locally to any other open browser tabs
        broadcastChannelRef.current?.postMessage({
          type: 'NEW_MESSAGE',
          payload: { message: data.message, chatId: payload.chatId },
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // React to message
  const handleReactMessage = async (messageId: string, emoji: string) => {
    if (!currentUser || !activeChatId) return;

    try {
      await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          userId: currentUser.id,
          emoji,
        }),
      });
    } catch {}
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChatId) return;
    try {
      await fetch(`/api/messages/${messageId}?chatId=${activeChatId}`, {
        method: 'DELETE',
      });
    } catch {}
  };

  // Broadcast typing
  const handleTyping = (isTyping: boolean) => {
    if (!currentUser || !activeChatId) return;

    fetch('/api/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: activeChatId,
        userId: currentUser.id,
        userName: currentUser.username,
        isTyping,
      }),
    }).catch(() => {});
  };

  // Start 1-on-1 direct chat
  const handleStartDirectChat = async (targetUser: User) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          participants: [currentUser.id, targetUser.id],
          creatorId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.chat) {
        // Refresh chats list
        const chatsRes = await fetch(`/api/chats?userId=${currentUser.id}`);
        const chatsData = await chatsRes.json();
        if (chatsData.chats) setChats(chatsData.chats);

        setActiveChatId(data.chat.id);
        setShowNewChatModal(false);
      }
    } catch {}
  };

  // Create new group chat
  const handleCreateGroupChat = async (name: string, participantIds: string[]) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          name,
          participants: participantIds,
          creatorId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.chat) {
        const chatsRes = await fetch(`/api/chats?userId=${currentUser.id}`);
        const chatsData = await chatsRes.json();
        if (chatsData.chats) setChats(chatsData.chats);

        setActiveChatId(data.chat.id);
        setShowNewChatModal(false);
      }
    } catch {}
  };

  // Post a 24-hour status story
  const handlePostStatus = async (status: {
    type: 'text' | 'image';
    content: string;
    bgColor?: string;
  }) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...status,
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.status) {
        setStatuses((prev) => [data.status, ...prev]);
        setShowStatusModal(false);
      }
    } catch {}
  };

  // Call management
  const handleStartCall = (type: 'audio' | 'video') => {
    if (!currentUser || !activeChat) return;

    const receiverId = activeChat.type === 'direct'
      ? activeChat.participants.find((p) => p !== currentUser.id) || 'guest'
      : 'group';

    const session: CallSession = {
      callId: `call_${Date.now()}`,
      callerId: currentUser.id,
      callerName: currentUser.username,
      callerAvatar: currentUser.avatar,
      receiverId,
      type,
      status: 'ringing',
      startedAt: new Date().toISOString(),
    };

    setActiveCall(session);

    fetch('/api/calls/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId: currentUser.id,
        receiverId,
        type,
      }),
    }).catch(() => {});
  };

  const handleEndCall = () => {
    if (activeCall) {
      fetch('/api/calls/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeCall.callId,
          action: 'end',
        }),
      }).catch(() => {});
    }
    setActiveCall(null);
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="w-full h-screen bg-[#d1d7db] dark:bg-[#0c1317] flex items-center justify-center font-sans antialiased overflow-hidden p-0 md:p-3 xl:p-4">
      {/* Background WhatsApp top green strip on desktop */}
      <div className="hidden md:block absolute top-0 left-0 right-0 h-32 bg-[#00a884] -z-10" />

      {/* Main WhatsApp Window Container */}
      <div className="w-full max-w-[1600px] h-full bg-white dark:bg-[#111b21] md:rounded-xl shadow-2xl overflow-hidden flex flex-row border border-slate-200 dark:border-slate-800">
        {/* Sidebar: Chat list & navigation */}
        <div
          className={`${
            activeChatId ? 'hidden md:flex' : 'flex'
          } w-full md:w-auto h-full shrink-0`}
        >
          {currentUser && (
            <Sidebar
              currentUser={currentUser}
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={(chat) => setActiveChatId(chat.id)}
              onOpenNewChat={() => setShowNewChatModal(true)}
              onOpenStatus={() => setShowStatusModal(true)}
              onOpenProfile={() => setShowProfileDrawer(true)}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              lang={lang}
              onToggleLang={toggleLanguage}
              typingUsers={typingUsers}
              hasUnseenStatus={statuses.length > 0}
            />
          )}
        </div>

        {/* Chat Area or Empty Welcome Placeholder */}
        <div
          className={`${
            !activeChatId ? 'hidden md:flex' : 'flex'
          } flex-1 h-full min-w-0`}
        >
          {activeChat && currentUser ? (
            <ChatArea
              chat={activeChat}
              currentUser={currentUser}
              messages={messages}
              onSendMessage={handleSendMessage}
              onReactMessage={handleReactMessage}
              onDeleteMessage={handleDeleteMessage}
              onStartCall={handleStartCall}
              onBack={() => setActiveChatId(null)}
              onTyping={handleTyping}
              typingUser={typingUsers[activeChat.id]}
              lang={lang}
            />
          ) : (
            /* WhatsApp Web Default Welcome Screen */
            <div className="flex-1 h-full bg-[#f0f2f5] dark:bg-[#222e35] flex flex-col items-center justify-center p-8 text-center border-b-[6px] border-[#25D366] select-none">
              <div className="max-w-md space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shadow-sm">
                  <MessageSquare className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {t.noChatsTitle}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.noChatsDesc}
                  </p>
                </div>

                {/* Quick actions for starting chat */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>{t.newChat}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      alert(t.linkCopied);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-[#111b21] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:border-[#00a884] transition-all"
                  >
                    {t.copyLink}
                  </button>
                </div>

                {/* Privacy tagline */}
                <div className="pt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'te'
                      ? 'మీ మెసేజ్‌లు మరియు కాల్స్ సురక్షితమైనవి'
                      : 'End-to-end encrypted in your private session'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal if not logged in */}
      {!currentUser && (
        <LoginModal
          onLogin={handleLogin}
          lang={lang}
          onToggleLang={toggleLanguage}
        />
      )}

      {/* Call Modal */}
      {activeCall && currentUser && (
        <CallModal
          session={activeCall}
          currentUser={currentUser}
          onEndCall={handleEndCall}
          lang={lang}
        />
      )}

      {/* Status Modal */}
      {showStatusModal && currentUser && (
        <StatusModal
          statuses={statuses}
          currentUser={currentUser}
          onPostStatus={handlePostStatus}
          onClose={() => setShowStatusModal(false)}
          lang={lang}
        />
      )}

      {/* New Chat & Group Modal */}
      {showNewChatModal && currentUser && (
        <NewChatModal
          currentUser={currentUser}
          allUsers={allUsers}
          onStartDirectChat={handleStartDirectChat}
          onCreateGroupChat={handleCreateGroupChat}
          onClose={() => setShowNewChatModal(false)}
          lang={lang}
        />
      )}

      {/* Profile & Account Drawer */}
      {showProfileDrawer && currentUser && (
        <ProfileDrawer
          currentUser={currentUser}
          onUpdateProfile={(updated) => {
            const next = { ...currentUser, ...updated };
            setCurrentUser(next);
            localStorage.setItem('whatsapp_user', JSON.stringify(next));
            fetch('/api/auth/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id, ...updated }),
            }).catch(() => {});
          }}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
          onClose={() => setShowProfileDrawer(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
