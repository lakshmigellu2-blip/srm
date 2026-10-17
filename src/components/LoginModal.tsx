import React, { useState } from 'react';
import { User } from '../types';
import { Language, translations } from '../utils/teluguTranslations';
import { MessageSquare, ShieldCheck, Users, Sparkles, ArrowRight, UserCheck, Globe } from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: User) => void;
  lang: Language;
  onToggleLang: () => void;
}

const sampleAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Anitha',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kiran',
];

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, lang, onToggleLang }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [about, setAbout] = useState('Available | నమస్కారం! చాట్ చేయండి 😊');
  const [selectedAvatar, setSelectedAvatar] = useState(sampleAvatars[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim()) {
      setError(lang === 'te' ? 'దయచేసి ఈమెయిల్ మరియు యూజర్ నేమ్ ఇవ్వండి' : 'Please provide both email and username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          avatar: selectedAvatar,
          about: about.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Failed to login');
      }
    } catch (err: any) {
      // Local fallback in case network hiccup
      const localUser: User = {
        id: `user_${Date.now()}`,
        email: email.trim(),
        username: username.trim(),
        avatar: selectedAvatar,
        avatarColor: '#00a884',
        about: about.trim(),
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
      onLogin(localUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (name: string, mail: string, avatarIdx: number) => {
    setEmail(mail);
    setUsername(name);
    setSelectedAvatar(sampleAvatars[avatarIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111b21]/90 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Background WhatsApp green top band */}
      <div className="absolute top-0 left-0 right-0 h-44 bg-[#00a884] -z-10" />

      <div className="w-full max-w-4xl bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Top bar inside card */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#202c33]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t.appTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'te' ? 'వెబ్ బ్రౌజింగ్ మెసెంజర్' : 'Web Browsing Messenger'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#00a884]" />
              <span>{lang === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Content area: 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left instructions & feature highlights */}
          <div className="lg:col-span-5 p-6 lg:p-8 bg-slate-50/70 dark:bg-[#111b21]/60 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {t.loginTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.loginSubtitle}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {lang === 'te' ? 'సులువైన లాగిన్' : 'Simple Direct Login'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'te'
                        ? 'పాస్‌వర్డ్ అవసరం లేకుండా మీ ఈమెయిల్ మరియు యూజర్ నేమ్ తో క్షణాల్లో లాగిన్ అవ్వండి.'
                        : 'No complicated passwords needed. Simply enter your email and chosen username.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {lang === 'te' ? 'స్నేహితులతో రియల్ టైమ్ చాట్' : 'Real-Time Chat with Friends'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'te'
                        ? 'ఈ లింక్ ని మీ ఫ్రెండ్స్‌కి పంపండి. వాళ్లూ లాగిన్ అయి మీతో నేరుగా చాట్ చేయవచ్చు.'
                        : 'Share this web URL with friends. When they sign in, you can talk immediately in real-time.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {lang === 'te' ? 'పూర్తి WhatsApp ఫీచర్లు' : 'Full WhatsApp Features'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'te'
                        ? 'వాయిస్ నోట్స్, ఫోటోలు, స్టేటస్ స్టోరీస్, ఎమోజి రియాక్షన్స్ మరియు గ్రూప్ చాట్స్.'
                        : 'Voice messages, photo sharing, 24h stories, emoji reactions & group messaging.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              {t.shareLinkTip}
            </div>
          </div>

          {/* Right form */}
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.emailLabel} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.usernameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.aboutLabel}
                </label>
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder={t.aboutPlaceholder}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {lang === 'te' ? 'అవతార్ ఎంచుకోండి' : 'Choose Your Avatar'}
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {sampleAvatars.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-transform shrink-0 ${
                        selectedAvatar === av
                          ? 'border-[#00a884] scale-110 shadow-md ring-2 ring-[#00a884]/30'
                          : 'border-slate-200 dark:border-slate-700 hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#008f6f] active:scale-[0.99] text-white font-medium text-sm rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                <span>{isLoading ? '...' : t.loginButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-click test accounts */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 font-medium">
                {t.quickLogin}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Lakshmi Gellu', 'lakshmigellu2@gmail.com', 0)}
                  className="flex items-center gap-1.5 p-2 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#00a884] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-xs text-slate-800 dark:text-slate-200"
                >
                  <img src={sampleAvatars[0]} alt="Lakshmi" className="w-6 h-6 rounded-full shrink-0" />
                  <span className="truncate font-medium">Lakshmi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Ravi Kumar', 'ravi.kumar@example.com', 1)}
                  className="flex items-center gap-1.5 p-2 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#00a884] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-xs text-slate-800 dark:text-slate-200"
                >
                  <img src={sampleAvatars[1]} alt="Ravi" className="w-6 h-6 rounded-full shrink-0" />
                  <span className="truncate font-medium">Ravi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Priya Sharma', 'priya.sharma@example.com', 2)}
                  className="flex items-center gap-1.5 p-2 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#00a884] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-xs text-slate-800 dark:text-slate-200"
                >
                  <img src={sampleAvatars[2]} alt="Priya" className="w-6 h-6 rounded-full shrink-0" />
                  <span className="truncate font-medium">Priya</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Suresh Reddy', 'suresh.reddy@example.com', 3)}
                  className="flex items-center gap-1.5 p-2 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#00a884] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-xs text-slate-800 dark:text-slate-200"
                >
                  <img src={sampleAvatars[3]} alt="Suresh" className="w-6 h-6 rounded-full shrink-0" />
                  <span className="truncate font-medium">Suresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
