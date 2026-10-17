import React, { useState } from 'react';
import { UserStatusStory, User } from '../types';
import { Language, translations } from '../utils/teluguTranslations';
import {
  X,
  Plus,
  CircleDot,
  Image as ImageIcon,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface StatusModalProps {
  statuses: UserStatusStory[];
  currentUser: User;
  onPostStatus: (status: {
    type: 'text' | 'image';
    content: string;
    bgColor?: string;
  }) => void;
  onClose: () => void;
  lang: Language;
}

const BG_COLORS = ['#005c4b', '#1f2c34', '#7b1fa2', '#c2185b', '#00796b', '#e65100'];

export const StatusModal: React.FC<StatusModalProps> = ({
  statuses,
  currentUser,
  onPostStatus,
  onClose,
  lang,
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedBgColor, setSelectedBgColor] = useState(BG_COLORS[0]);

  const t = translations[lang];

  const handlePost = () => {
    if (!newText.trim()) return;
    onPostStatus({
      type: 'text',
      content: newText.trim(),
      bgColor: selectedBgColor,
    });
    setNewText('');
    setIsPosting(false);
  };

  const currentViewingStory = activeStoryIndex !== null ? statuses[activeStoryIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111b21] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <CircleDot className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t.status}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isPosting ? (
          /* Create new status view */
          <div className="p-6 space-y-5">
            <div
              style={{ backgroundColor: selectedBgColor }}
              className="w-full h-48 rounded-2xl p-6 flex items-center justify-center text-center shadow-inner transition-colors"
            >
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={t.statusPlaceholder}
                className="w-full bg-transparent text-white placeholder-white/70 text-base md:text-lg font-medium text-center focus:outline-none resize-none"
                rows={3}
                autoFocus
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                {lang === 'te' ? 'రంగు ఎంచుకోండి' : 'Choose Background Color'}
              </label>
              <div className="flex items-center gap-2">
                {BG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedBgColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      selectedBgColor === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPosting(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handlePost}
                disabled={!newText.trim()}
                className="px-5 py-2 text-xs font-medium bg-[#00a884] text-white rounded-lg shadow hover:bg-[#008f6f] disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.postStatus}</span>
              </button>
            </div>
          </div>
        ) : activeStoryIndex !== null && currentViewingStory ? (
          /* View single story */
          <div className="flex-1 flex flex-col justify-between p-6 min-h-[400px]" style={{ backgroundColor: currentViewingStory.bgColor || '#005c4b' }}>
            {/* Top user badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentViewingStory.userAvatar}
                  alt={currentViewingStory.userName}
                  className="w-10 h-10 rounded-full border border-white/50"
                />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {currentViewingStory.userName}
                  </h3>
                  <span className="text-[11px] text-white/80 font-mono">
                    {new Date(currentViewingStory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStoryIndex(null)}
                className="p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story Text */}
            <div className="my-auto py-8 text-center text-white text-lg md:text-xl font-medium px-4 leading-relaxed">
              {currentViewingStory.content}
            </div>

            {/* Prev / Next controls */}
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={activeStoryIndex === 0}
                onClick={() => setActiveStoryIndex(activeStoryIndex - 1)}
                className="px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs rounded-lg disabled:opacity-30 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                disabled={activeStoryIndex === statuses.length - 1}
                onClick={() => setActiveStoryIndex(activeStoryIndex + 1)}
                className="px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs rounded-lg disabled:opacity-30 flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* List of statuses */
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* My status trigger */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#202c33] rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#00a884] text-white rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-[#202c33]">
                    +
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.myStatus}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'te' ? 'స్టేటస్ అప్‌డేట్ జోడించడానికి క్లిక్ చేయండి' : 'Click to add status update'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPosting(true)}
                className="px-3.5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addStatus}</span>
              </button>
            </div>

            {/* Recent updates from friends */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {t.recentUpdates}
              </h4>
              <div className="space-y-2">
                {statuses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {lang === 'te' ? 'ఇంకా ఎటువంటి స్టేటస్ అప్‌డేట్స్ లేవు' : 'No recent updates available'}
                  </p>
                ) : (
                  statuses.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveStoryIndex(idx)}
                      className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    >
                      <div className="w-12 h-12 rounded-full p-0.5 border-2 border-[#00a884] shrink-0">
                        <img
                          src={s.userAvatar}
                          alt={s.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {s.userName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {s.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
