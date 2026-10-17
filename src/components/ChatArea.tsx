import React, { useState, useRef, useEffect } from 'react';
import { User, Chat, Message, MessageType } from '../types';
import { Language, translations } from '../utils/teluguTranslations';
import { playOutgoingSound } from '../utils/sound';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  ArrowLeft,
  X,
  Play,
  Pause,
  Reply,
  Trash2,
  Copy,
  Image as ImageIcon,
  StopCircle,
} from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
  currentUser: User;
  messages: Message[];
  onSendMessage: (payload: {
    chatId: string;
    text: string;
    type?: MessageType;
    mediaUrl?: string;
    audioDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  }) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onBack: () => void;
  onTyping: (isTyping: boolean) => void;
  typingUser?: string;
  lang: Language;
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '😍', '👏', '✨', '☕', '🚀', '💯', '🙌', '😎', '💐'];
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  currentUser,
  messages,
  onSendMessage,
  onReactMessage,
  onDeleteMessage,
  onStartCall,
  onBack,
  onTyping,
  typingUser,
  lang,
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMediaPreview, setActiveMediaPreview] = useState<string | null>(null);
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const t = translations[lang];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    playOutgoingSound();
    onSendMessage({
      chatId: chat.id,
      text: inputText.trim(),
      type: 'text',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text,
          }
        : undefined,
    });

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image file attachment upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      playOutgoingSound();
      onSendMessage({
        chatId: chat.id,
        text: '',
        type: 'image',
        mediaUrl: base64Url,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Real Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const audioBase64 = reader.result as string;
          playOutgoingSound();
          onSendMessage({
            chatId: chat.id,
            text: 'Voice note',
            type: 'voice',
            mediaUrl: audioBase64,
            audioDuration: recordingSeconds || 3,
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      // If mic access blocked or unavailable, synthesize a demo voice note
      setIsRecording(true);
      setRecordingSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopAndSendRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback voice message
      playOutgoingSound();
      onSendMessage({
        chatId: chat.id,
        text: 'Voice message (simulated)',
        type: 'voice',
        audioDuration: Math.max(recordingSeconds, 2),
      });
    }
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Voice note playback
  const togglePlayAudio = (message: Message) => {
    if (playingAudioId === message.id) {
      activeAudioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    if (message.mediaUrl) {
      const audio = new Audio(message.mediaUrl);
      activeAudioRef.current = audio;
      setPlayingAudioId(message.id);
      audio.play().catch(() => setPlayingAudioId(null));
      audio.onended = () => setPlayingAudioId(null);
    } else {
      // Synthesize playback tone for demo voice notes
      setPlayingAudioId(message.id);
      setTimeout(() => {
        setPlayingAudioId(null);
      }, (message.audioDuration || 3) * 1000);
    }
  };

  // Filter messages if search is active
  const displayedMessages = inChatSearch.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(inChatSearch.toLowerCase()) ||
        m.senderName.toLowerCase().includes(inChatSearch.toLowerCase())
      )
    : messages;

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative overflow-hidden select-text">
      {/* Top Chat Header */}
      <div className="h-16 px-4 bg-slate-50 dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-10 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            <img
              src={chat.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=chat'}
              alt={chat.name || 'Chat'}
              className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
            />
            {chat.type === 'direct' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-white dark:border-[#202c33] rounded-full" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {chat.name}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {typingUser ? (
                <span className="text-[#25D366] font-medium">{typingUser} {t.isTyping}</span>
              ) : chat.type === 'group' ? (
                <span>
                  {chat.participants.length} {lang === 'te' ? 'సభ్యులు' : 'participants'}
                </span>
              ) : (
                <span>{t.online}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStartCall('video')}
            title={t.videoCall}
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            onClick={() => onStartCall('audio')}
            title={t.callUser}
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowInChatSearch(!showInChatSearch)}
            title="Search in chat"
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-44 bg-white dark:bg-[#233138] rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-30">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onStartCall('audio');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>{t.callUser}</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onStartCall('video');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                >
                  <Video className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>{t.videoCall}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar Drawer */}
      {showInChatSearch && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 z-10 animate-in fade-in slide-in-from-top-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inChatSearch}
            onChange={(e) => setInChatSearch(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => {
              setInChatSearch('');
              setShowInChatSearch(false);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtle WhatsApp doodle background overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#00a884 1px, transparent 1px), radial-gradient(#00a884 1px, #efeae2 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Messages Scroll Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 z-0">
        {/* Date divider pill */}
        <div className="flex justify-center my-2 select-none">
          <span className="px-3 py-1 bg-white/90 dark:bg-[#182229]/90 text-slate-600 dark:text-slate-400 text-[11px] font-semibold rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800 uppercase tracking-wider">
            {lang === 'te' ? 'ఈ రోజు' : 'Today'}
          </span>
        </div>

        {displayedMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const reactions = msg.reactions || {};
          const hasReactions = Object.keys(reactions).length > 0;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-2.5 shadow-sm transition-all text-xs ${
                  isMe
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none'
                    : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-tl-none'
                }`}
              >
                {/* Group chat sender name */}
                {chat.type === 'group' && !isMe && (
                  <p className="text-[11px] font-semibold text-[#128c7e] dark:text-[#25D366] mb-1">
                    {msg.senderName}
                  </p>
                )}

                {/* Quoted Reply banner */}
                {msg.replyTo && (
                  <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/20 border-l-4 border-[#00a884] text-[11px]">
                    <span className="font-semibold text-[#00a884] block">
                      {msg.replyTo.senderName}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 line-clamp-1">
                      {msg.replyTo.text}
                    </span>
                  </div>
                )}

                {/* Photo attachment */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mb-1.5 rounded-xl overflow-hidden cursor-pointer">
                    <img
                      src={msg.mediaUrl}
                      alt="attachment"
                      onClick={() => setActiveMediaPreview(msg.mediaUrl!)}
                      className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}

                {/* Voice note audio player */}
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-3 py-1 px-1 min-w-[200px]">
                    <button
                      onClick={() => togglePlayAudio(msg)}
                      className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-transform"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1">
                      {/* Fake waveform bars */}
                      <div className="flex items-center gap-0.5 h-6">
                        {[14, 22, 10, 24, 18, 12, 20, 16, 26, 14, 18, 22, 10, 16].map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${h}px` }}
                            className={`w-1 rounded-full transition-all ${
                              playingAudioId === msg.id ? 'bg-[#00a884] animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        <span>{playingAudioId === msg.id ? 'Playing...' : t.voiceNote}</span>
                        <span>0:{String(msg.audioDuration || 3).padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text content */}
                {msg.type === 'text' && (
                  <div className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">
                    {msg.deletedForEveryone ? (
                      <span className="italic text-slate-500 dark:text-slate-400">
                        {t.deletedMessage}
                      </span>
                    ) : (
                      msg.text
                    )}
                  </div>
                )}

                {/* Time & Read receipts */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400 select-none">
                  <span className="font-mono tabular-nums">{formatMessageTime(msg.timestamp)}</span>
                  {isMe && !msg.deletedForEveryone && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  )}
                </div>

                {/* Hover action menu bar (Desktop hover) */}
                <div
                  className={`absolute -top-7 ${
                    isMe ? 'right-2' : 'left-2'
                  } opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#202c33] rounded-full shadow-md border border-slate-200 dark:border-slate-700 px-2 py-0.5 flex items-center gap-1 z-10 select-none`}
                >
                  {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReactMessage(msg.id, emoji)}
                      className="text-xs hover:scale-125 transition-transform px-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setReplyingTo(msg)}
                    title={t.reply}
                    className="p-1 hover:text-[#00a884] text-slate-500 dark:text-slate-400"
                  >
                    <Reply className="w-3 h-3" />
                  </button>
                  {isMe && !msg.deletedForEveryone && (
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      title={t.deleteForEveryone}
                      className="p-1 hover:text-rose-500 text-slate-500 dark:text-slate-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Displayed reactions on bubble */}
                {hasReactions && (
                  <div
                    className={`absolute -bottom-2.5 ${
                      isMe ? 'right-2' : 'left-2'
                    } flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-[#1f2c34] rounded-full shadow border border-slate-200 dark:border-slate-700 text-[10px] select-none`}
                  >
                    {Object.entries(reactions).map(([emoji, uids]) => (
                      <span key={emoji} className="flex items-center gap-0.5">
                        <span>{emoji}</span>
                        {uids.length > 1 && <span className="font-mono text-[9px]">{uids.length}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 border-l-4 border-[#00a884] pl-3 text-xs">
            <div>
              <p className="font-semibold text-[#00a884]">{replyingTo.senderName}</p>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-1">{replyingTo.text}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-white dark:bg-[#233138] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-30 max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Emojis</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                }}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Input Action Bar */}
      <div className="px-3 md:px-4 py-2.5 bg-slate-50 dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 z-10 select-none">
        {isRecording ? (
          /* Live Voice Recording Mode */
          <div className="flex-1 flex items-center justify-between bg-rose-50 dark:bg-rose-950/30 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                {t.recordingVoice}
              </span>
              <span className="text-xs font-mono font-bold text-rose-800 dark:text-rose-200 tabular-nums">
                0:{String(recordingSeconds).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                title="Cancel"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={stopAndSendRecording}
                className="px-3 py-1 bg-[#00a884] text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.send}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Message Bar */
          <>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach photo"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t.typeMessage}
              className="flex-1 px-4 py-2 text-sm bg-white dark:bg-[#2a3942] border border-slate-200 dark:border-transparent rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
            />

            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white flex items-center justify-center shadow-md transition-all shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                title={t.holdToRecord}
                className="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-[#2a3942] text-slate-600 dark:text-slate-300 hover:bg-[#00a884] hover:text-white active:scale-95 flex items-center justify-center transition-all shrink-0"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Photo Lightbox preview */}
      {activeMediaPreview && (
        <div
          onClick={() => setActiveMediaPreview(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <button
            onClick={() => setActiveMediaPreview(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeMediaPreview}
            alt="zoom preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
