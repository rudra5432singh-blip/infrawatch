import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Maximize, 
  X, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Tv,
  Layers,
  BrainCircuit,
  Scale
} from 'lucide-react';

export default function WelcomeVideoModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(21.7);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }

    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setNeedsUserInteraction(false);
            })
            .catch(() => {
              setIsMuted(true);
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play()
                  .then(() => {
                    setIsPlaying(true);
                    setNeedsUserInteraction(true);
                  })
                  .catch(() => {
                    setIsPlaying(false);
                    setNeedsUserInteraction(true);
                  });
              }
            });
        }
      }
    }, 150);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 21.7;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setNeedsUserInteraction(false);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    setNeedsUserInteraction(false);
  };

  const handleUnmuteAndPlay = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    setIsMuted(false);
    videoRef.current.play();
    setIsPlaying(true);
    setNeedsUserInteraction(false);
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('infrawatch_welcome_walkthrough_seen', 'true');
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3 }}
          className="bg-[#161714] text-[#FAF9F5] w-full max-w-4xl rounded-3xl border border-[rgba(217,119,6,0.35)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto"
        >
          {/* TOP SOVEREIGN BRANDING HEADER */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#1B1C18] border-b border-[rgba(61,58,52,0.4)] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[rgba(217,119,6,0.15)] border border-[rgba(217,119,6,0.3)] flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-[#D97706]" />
              </div>
              <div className="truncate">
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-[#D97706] block font-bold truncate">
                  GOVERNMENT OF INDIA • MoSPI PAIMANA 2026
                </span>
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#FAF9F5] tracking-tight truncate">
                  INFRAWATCH Sovereign AI Briefing &amp; Walkthrough
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EFECE6]/10 text-[#A39D8F] border border-white/10">
                20s Overview
              </span>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-white/10 text-[#A39D8F] hover:text-white transition-colors cursor-pointer"
                aria-label="Close walkthrough"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* VIDEO PLAYER CONTAINER */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
            <video
              ref={videoRef}
              src="/welcome_walkthrough.mp4"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              playsInline
              preload="auto"
              className="w-full h-full object-contain cursor-pointer"
              onClick={handleTogglePlay}
            />

            {/* UNMUTE AUDIO OVERLAY BANNER */}
            {needsUserInteraction && isPlaying && isMuted && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleUnmuteAndPlay}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#D97706] text-[#1E1E1E] font-bold text-xs flex items-center gap-2 shadow-xl hover:bg-[#F59E0B] transition-transform hover:scale-105 cursor-pointer z-30"
              >
                <Volume2 size={15} />
                <span>Click for AI Voiceover Narration</span>
              </motion.button>
            )}

            {/* BIG PLAY OVERLAY BUTTON */}
            {!isPlaying && (
              <button
                onClick={handleTogglePlay}
                className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[rgba(217,119,6,0.9)] text-[#1E1E1E] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer z-20"
              >
                <Play size={30} className="ml-1 fill-[#1E1E1E] text-[#1E1E1E]" />
              </button>
            )}

            {/* HOVER / TOUCH VIDEO CONTROLS BAR */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 space-y-2 opacity-95 transition-opacity z-20">
              {/* Progress Scrubber */}
              <div 
                onClick={handleSeek}
                className="w-full h-2 bg-white/20 hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all"
              >
                <div 
                  className="h-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] rounded-full relative"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Buttons Strip */}
              <div className="flex items-center justify-between text-xs font-mono text-[#FAF9F5]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button 
                    onClick={handleTogglePlay} 
                    className="hover:text-[#D97706] transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={17} /> : <Play size={17} className="fill-current" />}
                  </button>

                  <button 
                    onClick={handleToggleMute} 
                    className="hover:text-[#D97706] transition-colors cursor-pointer flex items-center gap-1.5"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={17} className="text-[#C25E3E]" /> : <Volume2 size={17} />}
                    <span className="text-[11px] hidden sm:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
                  </button>

                  <button 
                    onClick={handleReplay} 
                    className="hover:text-[#D97706] transition-colors cursor-pointer hidden sm:block"
                    title="Replay from start"
                  >
                    <RotateCcw size={15} />
                  </button>

                  <span className="text-[11px] text-[#A39D8F] tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#D97706] bg-[#D97706]/10 border border-[#D97706]/20 px-2 py-0.5 rounded font-bold hidden sm:inline-block">
                    NEURAL AI VOICEOVER
                  </span>
                  <button 
                    onClick={handleFullscreen} 
                    className="hover:text-[#D97706] transition-colors cursor-pointer p-1"
                    title="Fullscreen"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3-TIER ARCHITECTURE QUICK HIGHLIGHTS RIBBON */}
          <div className="p-4 sm:p-5 bg-[#1B1C18] border-t border-[rgba(61,58,52,0.4)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-[#D97706] font-bold flex items-center gap-1.5 text-[11px]">
                  <Layers size={13} />
                  <span>Tier 1: Descriptive</span>
                </div>
                <p className="text-[11px] text-[#A39D8F] font-sans leading-snug">
                  1,484 Central Assets • 31 States • Live GIS Centroid Telemetry
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-[#C25E3E] font-bold flex items-center gap-1.5 text-[11px]">
                  <BrainCircuit size={13} />
                  <span>Tier 2: Predictive</span>
                </div>
                <p className="text-[11px] text-[#A39D8F] font-sans leading-snug">
                  Dual XGBoost (97.2% Acc) • SHAP Root-Cause Attribution
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-[#4A5D4E] font-bold flex items-center gap-1.5 text-[11px]">
                  <Scale size={13} />
                  <span>Tier 3: Prescriptive</span>
                </div>
                <p className="text-[11px] text-[#A39D8F] font-sans leading-snug">
                  ₹18.5k Cr Capital Saved • 1-Click Executive Decision Memos
                </p>
              </div>
            </div>

            {/* MODAL FOOTER CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
              <label className="flex items-center gap-2 text-xs text-[#A39D8F] cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="accent-[#D97706] w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span>Don't show video automatically on startup</span>
              </label>

              <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto">
                <button
                  onClick={handleReplay}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-[#FAF9F5] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Replay</span>
                </button>

                <button
                  onClick={handleDismiss}
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold bg-[#D97706] hover:bg-[#F59E0B] text-[#1E1E1E] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span>Enter War Room</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
