import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Mic, Info, Play, ChevronRight, Trophy, Zap, Timer, User, RefreshCw } from "lucide-react";
import { GamePage, Participant, LeaderboardEntry, getAchievement } from './types';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Rocket } from './components/Rocket';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [currentPage, setCurrentPage] = useState<GamePage>(GamePage.WELCOME);
  const [name, setName] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameTimer, setGameTimer] = useState<number | null>(null);
  const [peakDb, setPeakDb] = useState(0);
  const [dbSamples, setDbSamples] = useState<number[]>([]);
  const peakDbRef = useRef(0);
  const dbSamplesRef = useRef<number[]>([]);
  const hasFinishedRef = useRef(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentResult, setCurrentResult] = useState<Participant | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const { db, startAnalysis, stopAnalysis, isAnalyzing } = useAudioAnalyzer();

  // Load leaderboard initially
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Keyboard shortcut for Admin (F9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        setIsAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game Logic
  const handleStartGame = () => {
    if (name.trim()) {
      setCurrentPage(GamePage.RULES);
    }
  };

  const startChallenge = () => {
    setCurrentPage(GamePage.GAME);
    setPeakDb(0);
    setDbSamples([]);
    peakDbRef.current = 0;
    dbSamplesRef.current = [];
    hasFinishedRef.current = false;
    setIsGameStarted(true);
    setCountdown(3);
  };

  const finishGame = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    const finalPeak = peakDbRef.current;
    const finalSamples = dbSamplesRef.current;
    const finalAvg = finalSamples.length > 0 ? finalSamples.reduce((a, b) => a + b, 0) / finalSamples.length : 0;
    
    // Reward higher screams more aggressively (Exponential scoring)
    // 80dB -> ~640, 100dB -> 1000, 120dB -> 1440
    const score = Math.round(Math.pow(finalPeak, 2) / 10);
    const achievement = getAchievement(score);
    
    const now = new Date();
    const result: Participant = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      peakDb: finalPeak,
      avgDb: finalAvg,
      score,
      achievement
    };

    // Transition IMMEDIATELY
    setCurrentResult(result);
    // Use a tiny timeout to ensure state is set before page transition
    setTimeout(() => {
      setCurrentPage(GamePage.RESULT);
    }, 50);

    // Save in background
    fetch('/api/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    }).then(() => fetchLeaderboard())
      .catch(err => console.error('Failed to save result', err));
  }, [name, fetchLeaderboard]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Start 5 second recording session
      setCountdown(null);
      setGameTimer(5);
      startAnalysis();
    }
  }, [countdown, startAnalysis]);

  // Game Timer effect
  useEffect(() => {
    if (gameTimer === null) return;
    if (gameTimer > 0) {
      const timer = setTimeout(() => setGameTimer(prev => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameTimer(null);
      stopAnalysis();
      finishGame();
    }
  }, [gameTimer, stopAnalysis, finishGame]);

  // Collect dB samples while recording
  useEffect(() => {
    if (isAnalyzing && db > 0) {
      const newPeak = Math.max(peakDbRef.current, db);
      peakDbRef.current = newPeak;
      dbSamplesRef.current.push(db);
      
      // Update UI state less frequently or just for display
      setPeakDb(newPeak);
    }
  }, [db, isAnalyzing]);

  const resetGame = () => {
    setName('');
    setCurrentResult(null);
    setCurrentPage(GamePage.WELCOME);
  };

  return (
    <div className="relative w-screen h-screen galaxy-bg overflow-hidden flex items-center justify-center selection:bg-cyan-500/30">
      
      {/* Top Left Logo */}
      <div className="absolute top-2 left-2 z-50 flex items-center gap-3">
        <div className="w-32 h-32 items-center justify-center p-2">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-mono text-white/40 uppercase tracking-widest leading-none"></div>
          <div className="text-lg font-display font-bold text-white leading-none"></div>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-700 rounded-full blur-[150px]" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* PAGE 1: WELCOME */}
        {currentPage === GamePage.WELCOME && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center z-10 w-full max-w-xl p-8"
          >
            <div className="mb-12 inline-block">
              <h1 className="text-6xl font-display font-bold mt-80 tracking-tighter leading-none">
                ROCKET LAUNCH<br/>
                <span className="text-red-300">SCREAM CHALLENGE</span>
              </h1>
            </div>

            <div className="  glass-panel p-8 space-y-6 mt-60">
              <div className="space-y-2 text-left">
                <label className="text-xs font-mono text-white/70 uppercase tracking-widest pl-1">Participant Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ENTER YOUR NAME"
                  className="w-full bg-white/8 border border-white/20 rounded-xl px-6 py-4 text-xl font-display outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                />
              </div>
              <button 
                onClick={handleStartGame}
                disabled={!name.trim()}
                className="neon-button red-button-primary w-full disabled:opacity-30 disabled:pointer-events-none"
              >
                START GAME
              </button>
            </div>
          </motion.div>
        )}

        {/* PAGE 2: RULES */}
        {currentPage === GamePage.RULES && (
          <motion.div 
            key="rules"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="z-10 w-full max-w-2xl p-8"
          >
            <div className="glass-panel p-10 space-y-10 text-center">
              <div className="space-y-3 flex flex-col items-center">
                <h2 className="text-5xl font-display font-bold tracking-tight">HOW TO PLAY</h2>
                <div className="h-1.5 w-24 bg-cyan-200 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              </div>
              
              <div className="flex justify-center">
                <ul className="space-y-6 text-left max-w-md">
                  {[
                    { icon: Mic, text: "Stand near the microphone clearly." },
                    { icon: Play, text: "Press START and wait for the GO signal." },
                    { icon: Timer, text: "You have 5 seconds of maximum thrust time!" },
                    { icon: Zap, text: "Scream as loudly as you can to launch!" },
                    { icon: Trophy, text: "Volumetric sound energy = Rocket altitude." },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-5 items-start group">
                      <div className="flex-shrink-0 p-3 bg-white/5 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                        <item.icon className="w-6 h-6 text-cyan-100" />
                      </div>
                      <p className="text-xl text-white/80 pt-2 leading-tight font-medium group-hover:text-white transition-colors">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-6 pt-4">
                <button 
                  onClick={() => setCurrentPage(GamePage.WELCOME)} 
                  className="neon-button flex-1 py-4 text-white/60 hover:text-white"
                >
                  BACK
                </button>
                <button 
                  onClick={startChallenge} 
                  className="neon-button -button-primary flex-1 py-4"
                >
                  START CHALLENGE
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PAGE 3: GAME */}
        {currentPage === GamePage.GAME && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full h-full p-12 grid grid-cols-12 gap-8"
          >
            {/* Left: dB Meter */}
            <div className="col-span-3 flex flex-col justify-center">
              <div className="glass-panel p-8 h-fit space-y-8">
                <div className="text-center">
                  <div className="text-sm font-mono text-white/40 mb-2">LIVE SOUND PRESSURE</div>
                  <div className="text-7xl font-display font-bold text-cyan-500">{(db || 0).toFixed(0)} <span className="text-2xl text-cyan-300">dB</span></div>
                </div>
                
                {/* dB Vertical Bar */}
                <div className="h-[40vh] w-full bg-white/5 rounded-2xl overflow-hidden relative border border-white/5 p-1">
                  <div 
                    className="absolute bottom-0 left-0 w-full transition-all duration-75"
                    style={{ 
                      height: `${(db / 120) * 100}%`,
                      background: `linear-gradient(to top, #22c55e, #eab308, #ef4444)` 
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-between items-center py-4 text-[10px] font-mono text-white/30 uppercase pointer-events-none">
                    <div>Limit</div>
                    <div>Space</div>
                    <div>Cloud</div>
                    <div>Lift</div>
                    <div>Base</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Rocket */}
            <div className="col-span-6 flex items-center justify-center relative">
              <Rocket 
                heightPercent={Math.min(100, Math.max(0, (db - 35) * 1.8))} // More sensitive to scream for dramatic lift-off
                isLaunching={isAnalyzing}
              />
              


              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                  <motion.div 
                    key={countdown}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    className="text-9xl font-display font-bold text-white shadow-xl"
                  >
                    {countdown === 0 ? "GO!" : countdown}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="col-span-3 flex flex-col justify-center gap-8">
              <div className="glass-panel p-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <User className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-white/50 uppercase">Pilot</div>
                    <div className="text-xl font-bold truncate">{name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-1 text-white/40">
                         <Timer className="w-4 h-4" />
                         <span className="text-[10px] uppercase font-mono">Timer</span>
                      </div>
                      <div className="text-2xl font-bold font-mono">{gameTimer ?? 5}s</div>
                   </div>
                   <div className="bg-white/5 p-4 rounded-xl border border-red-500/20">
                      <div className="flex items-center gap-2 mb-1 text-white/40">
                         <Trophy className="w-4 h-4" />
                         <span className="text-[10px] uppercase font-mono">Peak</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-red-400">{(peakDb || 0).toFixed(0)}</div>
                   </div>
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* PAGE 4: RESULT */}
        {currentPage === GamePage.RESULT && currentResult && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full h-fit max-w-7xl p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch"
          >
            {/* Left: Player Result */}
            <div className="flex flex-col h-full">
              <div className="glass-panel p-10 w-full h-full relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-600/30 blur-3xl rounded-full" />
                  
                  <h2 className="text-sm font-mono text-cyan-500 tracking-widest uppercase mb-2 font-bold bg-black/40 inline-block px-3 py-1 rounded">Mission Accomplished</h2>
                  <h1 className="text-6xl font-display font-bold mb-8 drop-shadow-lg">RESULT REPORT</h1>

                  <div className="grid grid-cols-2 gap-6 mb-8 text-left">
                    <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-[10px] font-mono text-white/60 uppercase font-bold">Participant</div>
                      <div className="text-3xl font-bold text-white drop-shadow-md">{currentResult?.name || 'Unknown'}</div>
                    </div>
                    
                    <div className="space-y-2  bg-white/5 p-8 rounded-xl border border-white/10">
                      <div className="text-[10px] font-mono text-white/60 uppercase font-bold">Peak Level</div>
                      <div className="text-3xl font-mono font-bold text-white">{(currentResult?.peakDb || 0).toFixed(1)} dB</div>
                    </div>
                    <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Final Score</div>
                      <div className="text-4xl font-mono text-cyan-400 font-black drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{currentResult?.score || 0}</div>
                    </div>
                  </div>

                  <div className="h-4 w-full bg-black/40 rounded-full mb-12 overflow-hidden border border-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((currentResult?.score || 0) / 1200) * 100)}%` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white"
                    />
                  </div>
                </div>

                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  onClick={resetGame} 
                  className="neon-button neon-button-primary w-full flex items-center justify-center gap-3 text-xl py-6 mt-auto"
                >
                  <RefreshCw className="w-6 h-6" /> RE-ENTER CHALLENGE
                </motion.button>
              </div>
            </div>

            {/* Right: Leaderboard */}
            <div className="flex flex-col h-full">
              <Leaderboard entries={leaderboard} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)}
        onResetLeaderboard={async () => {
          await fetch('/api/admin/reset-leaderboard', { method: 'POST' });
          fetchLeaderboard();
        }}
        onResetAll={async () => {
          await fetch('/api/admin/reset-all', { method: 'POST' });
          fetchLeaderboard();
        }}
      />
      


    </div>
  );
}

