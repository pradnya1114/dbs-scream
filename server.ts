import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DATA_DIR = path.join(process.cwd(), 'data');
  const PARTICIPANTS_FILE = path.join(DATA_DIR, 'participants.csv');
  const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.csv');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  // Initialize CSV files with headers if they don't exist
  if (!fs.existsSync(PARTICIPANTS_FILE)) {
    fs.writeFileSync(PARTICIPANTS_FILE, "ID,Name,Date,Time,PeakdB,AvgdB,Score,Achievement\n");
  }
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, "Name,PeakdB,Score,Date\n");
  }

  // Helper to parse CSV line with support for quoted values
  const parseCSVLine = (line: string) => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField);
    return fields;
  };

  // API Routes
  app.post("/api/save-result", (req, res) => {
    const { id, name, date, time, peakDb, avgDb, score, achievement } = req.body;
    
    // Validate inputs to prevent NaN
    const safePeak = isNaN(parseFloat(peakDb)) ? 0 : parseFloat(peakDb);
    const safeScore = isNaN(parseInt(score)) ? 0 : parseInt(score);

    // Save to participants.csv
    const participantLine = `${id},"${name.replace(/"/g, '""')}",${date},${time},${safePeak},${avgDb},${safeScore},${achievement}\n`;
    fs.appendFileSync(PARTICIPANTS_FILE, participantLine);

    // Update leaderboard.csv logic
    // Read all leaderboard entries
    const leaderboardLines = fs.readFileSync(LEADERBOARD_FILE, 'utf8').split('\n').slice(1).filter(line => line.trim() !== '');
    const entries = leaderboardLines.map(line => {
      const parts = parseCSVLine(line);
      return { 
        name: parts[0] || "Unknown", 
        peakDb: parseFloat(parts[1]) || 0, 
        score: parseInt(parts[2]) || 0, 
        date: parts[3] || new Date().toISOString()
      };
    });

    // Add current player
    entries.push({ name, peakDb: safePeak, score: safeScore, date });

    // Sort: Score DESC, PeakdB DESC, Date ASC (earlier first)
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.peakDb !== a.peakDb) return b.peakDb - a.peakDb;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Keep top 100 for storage (UI only shows 10)
    const topEntries = entries.slice(0, 100);

    // Write back to leaderboard.csv
    const header = "Name,PeakdB,Score,Date\n";
    const body = topEntries.map(e => `"${e.name.replace(/"/g, '""')}",${e.peakDb},${e.score},${e.date}`).join('\n');
    fs.writeFileSync(LEADERBOARD_FILE, header + body + (body ? '\n' : ''));

    res.json({ success: true });
  });

  app.get("/api/leaderboard", (req, res) => {
    try {
      const leaderboardData = fs.readFileSync(LEADERBOARD_FILE, 'utf8').split('\n').filter(line => line.trim() !== '');
      if (leaderboardData.length <= 1) return res.json([]);
      
      const entries = leaderboardData.slice(1).map((line, index) => {
        const parts = parseCSVLine(line);
        return {
          rank: index + 1,
          name: parts[0] || "Unknown",
          peakDb: parseFloat(parts[1]) || 0,
          score: parseInt(parts[2]) || 0,
          date: parts[3] || ""
        };
      });
      res.json(entries.slice(0, 10)); // Top 10 for UI
    } catch (err) {
      res.status(500).json({ error: "Failed to read leaderboard" });
    }
  });

  app.get("/api/participants", (req, res) => {
    try {
      const data = fs.readFileSync(PARTICIPANTS_FILE, 'utf8').split('\n').filter(line => line.trim() !== '');
      if (data.length <= 1) return res.json([]);
      const participants = data.slice(1).map(line => {
        const parts = parseCSVLine(line);
        return {
          id: parts[0],
          name: parts[1] || "Unknown",
          date: parts[2],
          time: parts[3],
          peakDb: parseFloat(parts[4]) || 0,
          avgDb: parseFloat(parts[5]) || 0,
          score: parseInt(parts[6]) || 0,
          achievement: parts[7]
        };
      });
      res.json(participants);
    } catch (err) {
      res.status(500).json({ error: "Failed to read participants" });
    }
  });

  app.post("/api/admin/reset-leaderboard", (req, res) => {
    fs.writeFileSync(LEADERBOARD_FILE, "Name,PeakdB,Score,Date\n");
    res.json({ success: true });
  });

  app.post("/api/admin/reset-all", (req, res) => {
    fs.writeFileSync(PARTICIPANTS_FILE, "ID,Name,Date,Time,PeakdB,AvgdB,Score,Achievement\n");
    fs.writeFileSync(LEADERBOARD_FILE, "Name,PeakdB,Score,Date\n");
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
