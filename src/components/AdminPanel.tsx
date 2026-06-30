import React, { useState, useEffect } from "react";
import { Participant } from "../types";
import { X, Download, Trash2, RefreshCw } from "lucide-react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResetLeaderboard: () => void;
  onResetAll: () => void;
}

export const AdminPanel = ({ isOpen, onClose, onResetLeaderboard, onResetAll }: AdminPanelProps) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      fetchParticipants();
    }
  }, [authenticated]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      setParticipants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234") {
      setAuthenticated(true);
    } else {
      alert("Invalid Password");
    }
  };

  const exportCSV = () => {
    if (participants.length === 0) return;
    const headers = "ID,Name,Date,Time,PeakdB,AvgdB,Score,Achievement\n";
    const body = participants.map(p => `${p.id},"${p.name}",${p.date},${p.time},${p.peakDb},${p.avgDb},${p.score},${p.achievement}`).join('\n');
    const blob = new Blob([headers + body], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-display font-bold text-red-500">ADMIN CONTROL CENTER</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!authenticated ? (
          <div className="p-12 flex flex-col items-center">
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/50 font-mono uppercase">Enter Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-colors"
                  autoFocus
                />
              </div>
              <button type="submit" className="neon-button neon-button-danger w-full">Access Terminal</button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5">
              <button onClick={exportCSV} className="neon-button text-xs py-3 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Data
              </button>
              <button onClick={fetchParticipants} className="neon-button text-xs py-3 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button 
                onClick={() => { if(confirm("Reset Leaderboard?")) onResetLeaderboard(); }} 
                className="neon-button neon-button-danger text-xs py-3 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Reset Leaderboard
              </button>
              <button 
                onClick={() => { if(confirm("DELETE EVERYTHING?")) onResetAll(); }} 
                className="neon-button neon-button-danger text-xs py-3 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Full Reset
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="text-center py-10 text-white/50">Loading entries...</div>
              ) : (
                <table className="w-full text-left font-mono text-sm">
                  <thead className="text-white/40 sticky top-0 bg-space-deep">
                    <tr>
                      <th className="pb-4 pr-4">DATE</th>
                      <th className="pb-4 pr-4">NAME</th>
                      <th className="pb-4 pr-4">DB</th>
                      <th className="pb-4 pr-4">SCORE</th>
                      <th className="pb-4">BADGE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {participants.map((p, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="py-3 pr-4 text-xs">{p.date}</td>
                        <td className="py-3 pr-4 truncate max-w-[150px]">{p.name}</td>
                        <td className="py-3 pr-4">{(p.peakDb || 0).toFixed(1)}</td>
                        <td className="py-3 pr-4 text-cyan-400">{p.score}</td>
                        <td className="py-3 text-xs opacity-70">{p.achievement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
