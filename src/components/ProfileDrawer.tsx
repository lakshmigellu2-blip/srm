import React, { useState } from 'react';
import { User } from '../types';
import { Language, translations } from '../utils/teluguTranslations';
import {
  X,
  User as UserIcon,
  Mail,
  Edit2,
  Check,
  Share2,
  LogOut,
  Users,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface ProfileDrawerProps {
  currentUser: User;
  onUpdateProfile: (updated: Partial<User>) => void;
  onSwitchUser: (email: string, username: string) => void;
  onLogout: () => void;
  onClose: () => void;
  lang: Language;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  currentUser,
  onUpdateProfile,
  onSwitchUser,
  onLogout,
  onClose,
  lang,
}) => {
  const [username, setUsername] = useState(currentUser.username);
  const [about, setAbout] = useState(currentUser.about);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const t = translations[lang];

  const handleSaveName = () => {
    if (username.trim()) {
      onUpdateProfile({ username: username.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveAbout = () => {
    onUpdateProfile({ about: about.trim() });
    setIsEditingAbout(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm md:max-w-md h-full bg-white dark:bg-[#111b21] shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-24 px-6 bg-[#00a884] text-white flex items-end pb-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold">{t.profile}</h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 dark:border-slate-700 shadow-md">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* User Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#00a884] uppercase tracking-wider">
              {t.usernameLabel}
            </label>
            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 text-sm bg-transparent border-b border-[#00a884] text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 text-[#00a884] hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {currentUser.username}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#00a884] uppercase tracking-wider">
              {t.emailLabel}
            </label>
            <div className="flex items-center gap-2 py-1 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{currentUser.email}</span>
            </div>
          </div>

          {/* About / Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#00a884] uppercase tracking-wider">
              {t.aboutLabel}
            </label>
            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              {isEditingAbout ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="flex-1 text-sm bg-transparent border-b border-[#00a884] text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveAbout}
                    className="p-1 text-[#00a884] hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    {currentUser.about || 'Available'}
                  </span>
                  <button
                    onClick={() => setIsEditingAbout(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Share App Link With Friends */}
          <div className="p-4 bg-slate-50 dark:bg-[#202c33] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <Share2 className="w-4 h-4 text-[#00a884]" />
              <span>{lang === 'te' ? 'స్నేహితులకు లింక్ షేర్ చేయండి' : 'Invite Friends to Chat'}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.shareLinkTip}
            </p>
            <button
              onClick={handleCopyLink}
              className="w-full mt-2 py-2 px-3 bg-white dark:bg-[#111b21] border border-slate-300 dark:border-slate-700 hover:border-[#00a884] text-xs font-medium text-slate-800 dark:text-slate-200 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              {copiedLink ? <CheckCheck className="w-4 h-4 text-[#00a884]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? t.linkCopied : t.copyLink}</span>
            </button>
          </div>

          {/* Switch Account Quick Tester */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.switchAccount}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSwitchUser('lakshmigellu2@gmail.com', 'Lakshmi Gellu')}
                className="p-2 text-left text-xs bg-slate-50 dark:bg-[#202c33] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#00a884] transition-all"
              >
                <span className="font-semibold block truncate">Lakshmi Gellu</span>
                <span className="text-[10px] text-slate-400 truncate block">lakshmigellu2@gmail.com</span>
              </button>
              <button
                onClick={() => onSwitchUser('ravi.kumar@example.com', 'Ravi Kumar')}
                className="p-2 text-left text-xs bg-slate-50 dark:bg-[#202c33] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#00a884] transition-all"
              >
                <span className="font-semibold block truncate">Ravi Kumar</span>
                <span className="text-[10px] text-slate-400 truncate block">ravi.kumar@example.com</span>
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onLogout}
              className="w-full py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center justify-center gap-2 transition-colors border border-rose-200 dark:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
