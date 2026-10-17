import React, { useState, useEffect, useRef } from 'react';
import { CallSession, User } from '../types';
import { Language, translations } from '../utils/teluguTranslations';
import { playRingtone } from '../utils/sound';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Maximize2,
  Users,
} from 'lucide-react';

interface CallModalProps {
  session: CallSession;
  currentUser: User;
  onEndCall: () => void;
  lang: Language;
}

export const CallModal: React.FC<CallModalProps> = ({
  session,
  currentUser,
  onEndCall,
  lang,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(session.type === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected'>(session.status === 'connected' ? 'connected' : 'ringing');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const t = translations[lang];

  // Ringtone simulation while ringing
  useEffect(() => {
    let stopRinging: (() => void) | null = null;
    if (callStatus === 'ringing') {
      stopRinging = playRingtone();
      // Auto-connect after 3 seconds for demo/simulation experience
      const timer = setTimeout(() => {
        setCallStatus('connected');
        if (stopRinging) stopRinging();
      }, 3500);

      return () => {
        if (stopRinging) stopRinging();
        clearTimeout(timer);
      };
    }
  }, [callStatus]);

  // Duration timer when connected
  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStatus]);

  // Local webcam stream if video call
  useEffect(() => {
    if (isVideoEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera not available or blocked
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isVideoEnabled]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isCaller = session.callerId === currentUser.id;
  const otherPartyName = isCaller ? (session.receiverId === 'group' ? 'Friends Group' : 'Friend') : session.callerName;
  const otherPartyAvatar = isCaller
    ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Friend'
    : session.callerAvatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-lg bg-[#111b21] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-between min-h-[480px] p-8">
        {/* Top Info */}
        <div className="text-center space-y-2 z-10">
          <span className="text-xs font-semibold text-[#00a884] uppercase tracking-wider">
            WhatsApp {session.type === 'video' ? t.videoCall : t.callUser}
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {otherPartyName}
          </h2>
          <p className="text-xs font-mono text-slate-400">
            {callStatus === 'ringing' ? t.ringing : formatDuration(callDuration)}
          </p>
        </div>

        {/* Center: Video element or Avatar */}
        <div className="relative w-full flex-1 flex items-center justify-center my-6">
          {session.type === 'video' && isVideoEnabled ? (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 rounded-full text-[10px] text-white flex items-center gap-1.5 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Feed</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#00a884]/40 shadow-2xl">
                <img
                  src={otherPartyAvatar}
                  alt={otherPartyName}
                  className="w-full h-full object-cover"
                />
              </div>
              {callStatus === 'ringing' && (
                <div className="absolute inset-0 rounded-full border-4 border-[#00a884] animate-ping opacity-30" />
              )}
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="flex items-center gap-4 z-10">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {session.type === 'video' && (
            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !isVideoEnabled
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all"
            title={t.endCall}
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
