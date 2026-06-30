import { LeaderboardEntry } from "../types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export const Leaderboard = ({ entries }: LeaderboardProps) => {
  return (
    <div className="glass-panel p-8 w-full h-full bg-black/80 border-white/20 backdrop-blur-2xl flex flex-col">
      <h3 className="font-display font-bold text-3xl mb-8 text-center text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">HALL OF FAME</h3>
      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-6 text-xs font-mono text-white/50 pb-3 border-b border-white/10 uppercase tracking-widest font-black">
          <div className="col-span-1">RK</div>
          <div className="col-span-2">NAME</div>
          <div className="col-span-1 text-right">DB</div>
          <div className="col-span-2 text-right">SCORE</div>
        </div>
        {entries.length === 0 ? (
          <div className="py-8 text-center text-white/30 italic font-mono">No legends detected yet...</div>
        ) : (
          entries.map((entry) => (
            <div 
              key={`${entry.rank}-${entry.name}`} 
              className={`grid grid-cols-6 text-base py-3 px-4 rounded-xl border transition-all duration-300 ${
                entry.rank === 1 
                  ? 'bg-cyan-500/25 border-cyan-500/60 text-cyan-300 font-extrabold shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                  : entry.rank === 2
                  ? 'bg-slate-400/20 border-slate-400/40 text-slate-200 font-bold'
                  : entry.rank === 3
                  ? 'bg-orange-600/20 border-orange-600/40 text-orange-300 font-bold'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="col-span-1 font-mono opacity-80">#{entry.rank}</div>
              <div className="col-span-2 font-display truncate pr-2">{entry.name}</div>
              <div className="col-span-1 text-right font-mono opacity-90">{(entry.peakDb || 0).toFixed(1)}</div>
              <div className="col-span-2 text-right font-mono font-black text-cyan-400">{entry.score}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
