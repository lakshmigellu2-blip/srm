import React, { useState } from 'react';
import { User, Chat } from '../types';
import { Language, translations } from '../utils/teluguTranslations';
import {
  MessageSquarePlus,
  Search,
  Filter,
  Users,
  Check,
  CheckCheck,
  Mic,
  Image as ImageIcon,
  CircleDot,
  Moon,
  Sun,
  Globe,
  MoreVertical,
  Pin,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onOpenNewChat: () => void;
  onOpenStatus: () => void;
  onOpenProfile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  lang: Language;
  onToggleLang: () => void;
  typingUsers: Record<string, string>; // chatId -> typing user name
  hasUnseenStatus?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenStatus,
  onOpenProfile,
  isDarkMode,
  onToggleTheme,
  lang,
  onToggleLang,
  typingUsers,
  hasUnseenStatus = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  const t = translations[lang];

  // Filter chats by search and category
  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'unread') {
      return (chat.unreadCount || 0) > 0;
    }
    if (activeFilter === 'groups') {
      return chat.type === 'group';
    }
    return true;
  });

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return lang === 'te' ? 'నిన్న' : 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-full md:w-80 lg:w-[400px] xl:w-[420px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
      {/* Top Header */}
      <div className="h-16 px-4 bg-slate-50 dark:bg-[#202c33] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button
          onClick={onOpenProfile}
          title={t.profile}
          className="flex items-center gap-3 group text-left max-w-[200px]"
        >
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#00a884] transition-all"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white dark:border-[#202c33] rounded-full" />
          </div>
          <div className="truncate">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#00a884] transition-colors truncate">
              {currentUser.username}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentUser.email}
            </p>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Status stories trigger */}
          <button
            onClick={onOpenStatus}
            title={t.status}
            className="relative p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
          >
            <CircleDot className="w-5 h-5" />
            {hasUnseenStatus && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#00a884] rounded-full ring-2 ring-white dark:ring-[#202c33]" />
            )}
          </button>

          {/* New Chat trigger */}
          <button
            onClick={onOpenNewChat}
            title={t.newChat}
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Language toggle */}
          <button
            onClick={onToggleLang}
            title={lang === 'en' ? 'తెలుగులోకి మార్చండి' : 'Switch to English'}
            className="p-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 rounded-full transition-colors flex items-center gap-1"
          >
            <Globe className="w-4 h-4 text-[#00a884]" />
            <span className="uppercase text-[11px] font-bold">{lang}</span>
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-48 bg-white dark:bg-[#233138] rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-30">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenNewChat();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-[#00a884]" />
                  <span>{t.newGroup}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenStatus();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                >
                  <CircleDot className="w-4 h-4 text-[#00a884]" />
                  <span>{t.status}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700"
                >
                  <Sparkles className="w-4 h-4 text-[#00a884]" />
                  <span>{t.switchAccount}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="p-2.5 bg-white dark:bg-[#111b21] space-y-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchChats}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-[#202c33] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 px-0.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === 'all'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-[#00a884]/20 dark:text-[#25D366]'
                : 'bg-slate-100 text-slate-600 dark:bg-[#202c33] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.all}
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === 'unread'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-[#00a884]/20 dark:text-[#25D366]'
                : 'bg-slate-100 text-slate-600 dark:bg-[#202c33] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.unread}
          </button>
          <button
            onClick={() => setActiveFilter('groups')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === 'groups'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-[#00a884]/20 dark:text-[#25D366]'
                : 'bg-slate-100 text-slate-600 dark:bg-[#202c33] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.groups}
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/40">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm font-medium">
              {searchQuery ? (lang === 'te' ? 'చాట్‌లు ఏవీ కనుగొనబడలేదు' : 'No chats found') : (lang === 'te' ? 'ఇంకా చాట్స్ లేవు' : 'No chats yet')}
            </p>
            <p className="text-xs mt-1">
              {lang === 'te' ? 'కొత్త చాట్ ప్రారంభించడానికి పైన ఉన్న + ఐకాన్ క్లిక్ చేయండి' : 'Click the + icon above to start a conversation'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const typingUser = typingUsers[chat.id];
            const lastMsg = chat.lastMessage;
            const isOutgoing = lastMsg && lastMsg.senderId === currentUser.id;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`w-full px-3.5 py-3 flex items-center gap-3.5 cursor-pointer transition-colors relative ${
                  isActive
                    ? 'bg-slate-100 dark:bg-[#2a3942]'
                    : 'hover:bg-slate-50 dark:hover:bg-[#202c33]/60'
                }`}
              >
                {/* Chat Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={chat.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=group'}
                    alt={chat.name || 'Chat'}
                    className="w-12 h-12 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                  />
                  {chat.type === 'direct' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white dark:border-[#111b21] rounded-full" />
                  )}
                  {chat.type === 'group' && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00a884] text-white rounded-full flex items-center justify-center text-[9px] shadow-sm">
                      <Users className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {chat.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-mono tabular-nums">
                      {formatMessageTime(chat.lastMessage?.timestamp || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Message snippet or typing state */}
                    <div className="text-xs truncate flex items-center gap-1">
                      {typingUser ? (
                        <span className="text-[#25D366] font-medium animate-pulse flex items-center gap-1">
                          <span>{typingUser}</span>
                          <span>{t.isTyping}</span>
                        </span>
                      ) : lastMsg ? (
                        <>
                          {isOutgoing && (
                            <span className="shrink-0">
                              {lastMsg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                              ) : lastMsg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </span>
                          )}
                          {lastMsg.type === 'voice' && (
                            <span className="flex items-center gap-1 text-[#00a884]">
                              <Mic className="w-3.5 h-3.5" />
                              <span>{t.voiceNote}</span>
                            </span>
                          )}
                          {lastMsg.type === 'image' && (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{t.photo}</span>
                            </span>
                          )}
                          {lastMsg.type === 'text' && (
                            <span className="text-slate-500 dark:text-slate-400 truncate">
                              {lastMsg.deletedForEveryone ? t.deletedMessage : lastMsg.text}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          {lang === 'te' ? 'కొత్త చాట్ ప్రారంభించండి' : 'Start chatting'}
                        </span>
                      )}
                    </div>

                    {/* Unread badge & Pin */}
                    <div className="flex items-center gap-1 shrink-0">
                      {chat.isPinned && (
                        <Pin className="w-3 h-3 text-slate-400 rotate-45" />
                      )}
                      {(chat.unreadCount || 0) > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-[#25D366] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
