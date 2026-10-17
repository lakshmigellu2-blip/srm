import React, { useState } from 'react';
import { User, Chat } from '../types';
import { Language, translations } from '../utils/teluguTranslations';
import {
  X,
  Search,
  UserPlus,
  Users,
  Check,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

interface NewChatModalProps {
  currentUser: User;
  allUsers: User[];
  onStartDirectChat: (targetUser: User) => void;
  onCreateGroupChat: (name: string, participantIds: string[]) => void;
  onClose: () => void;
  lang: Language;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUser,
  allUsers,
  onStartDirectChat,
  onCreateGroupChat,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customUsername, setCustomUsername] = useState('');

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const t = translations[lang];

  // Exclude current user from contact pickers
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);

  const filteredUsers = otherUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStartCustomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() && !customUsername.trim()) return;

    // Check if user already exists
    const existing = otherUsers.find(
      (u) =>
        u.email.toLowerCase() === customEmail.toLowerCase().trim() ||
        u.username.toLowerCase() === customUsername.toLowerCase().trim()
    );

    if (existing) {
      onStartDirectChat(existing);
    } else {
      // Create guest user profile
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: customEmail.trim() || `${customUsername.trim().toLowerCase()}@example.com`,
        username: customUsername.trim() || customEmail.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customUsername || customEmail)}`,
        avatarColor: '#128c7e',
        about: 'Hey there! I am using WhatsApp Web',
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
      onStartDirectChat(newUser);
    }
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    onCreateGroupChat(groupName.trim(), [currentUser.id, ...selectedUserIds]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111b21] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {activeTab === 'direct' ? t.newChat : t.newGroup}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#182229] p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#00a884]" />
            <span>{lang === 'te' ? 'నేరుగా చాట్ (1-on-1)' : 'Direct Message'}</span>
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'group'
                ? 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#00a884]" />
            <span>{t.newGroup}</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'direct' ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Quick manual friend invite */}
            <form onSubmit={handleStartCustomChat} className="space-y-3 p-4 bg-slate-50 dark:bg-[#202c33] rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {lang === 'te' ? 'స్నేహితుడి ఈమెయిల్ లేదా పేరు రాయండి' : 'Chat with any friend by Email or Name'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder={lang === 'te' ? 'స్నేహితుడి పేరు (ఉదా: Ravi)' : "Friend's Name"}
                  className="px-3 py-2 text-xs bg-white dark:bg-[#111b21] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder={lang === 'te' ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email (Optional)'}
                  className="px-3 py-2 text-xs bg-white dark:bg-[#111b21] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>
              <button
                type="submit"
                disabled={!customUsername.trim() && !customEmail.trim()}
                className="w-full py-2 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>{t.startChat}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Registered contacts directory */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {lang === 'te' ? 'రిజిస్టర్ అయిన స్నేహితులు' : 'Registered Users on Web'}
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredUsers.length} {lang === 'te' ? 'స్నేహితులు' : 'friends'}
                </span>
              </div>

              {/* Search contacts */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'te' ? 'స్నేహితులను వెతకండి...' : 'Filter contacts...'}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-100 dark:bg-[#202c33] border border-transparent rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>

              {/* Contact list */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onStartDirectChat(u)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202c33] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-white dark:border-[#111b21] rounded-full" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#00a884]">
                          {u.username}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[#00a884] opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.startChat} →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Group Chat Creation View */
          <form onSubmit={handleCreateGroupSubmit} className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.groupNamePlaceholder} *
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={lang === 'te' ? 'ఉదా: ఫ్రెండ్స్ అడ్డా / కాలేజ్ గ్యాంగ్' : 'e.g. Weekend Trip / Family Group'}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t.selectMembers}
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedUserIds.length} {t.membersSelected}
                </span>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2">
                {otherUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleSelectUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30'
                          : 'hover:bg-slate-100 dark:hover:bg-[#202c33]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                            {u.username}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-[#00a884] border-[#00a884] text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={!groupName.trim() || selectedUserIds.length === 0}
                className="px-5 py-2 text-xs font-medium bg-[#00a884] text-white rounded-lg shadow hover:bg-[#008f6f] disabled:opacity-40 flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>{t.createGroup}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
