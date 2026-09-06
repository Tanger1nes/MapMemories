// components/MusicPicker.jsx
"use client";

import { useState, useRef } from "react";
import { Search, Loader2, Play, Pause, Music } from "lucide-react";

export default function MusicPicker({ selectedSong, setSelectedSong, startTime, setStartTime }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  const previewAudioRef = useRef(null);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearchItunes = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`);
      const data = await res.json();

      if (data && data.results) {
        const formattedResults = data.results.map((track) => ({
          id: track.trackId,
          name: track.trackName,
          artist: track.artistName,
          albumArt: track.artworkUrl100 ? track.artworkUrl100.replace("100x100bb", "300x300bb") : "",
          previewUrl: track.previewUrl,
          duration: 30
        }));
        setResults(formattedResults);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data dari iTunes:", err);
      alert("Gagal mengambil data lagu.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlayCutter = () => {
    if (!selectedSong?.previewUrl) return;

    if (isPlayingPreview) {
      previewAudioRef.current?.pause();
      setIsPlayingPreview(false);
    } else {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      const audio = new Audio(selectedSong.previewUrl);
      previewAudioRef.current = audio;
      audio.play().catch((err) => console.log("Cutter audio play error:", err));
      setIsPlayingPreview(true);
      audio.onended = () => setIsPlayingPreview(false);
    }
  };

  return (
    <div style={deezerBox}>
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem" }}>
        <input 
          placeholder="Cari lagu..." 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          style={inp} 
        />
        <button type="button" onClick={handleSearchItunes} style={searchBtn}>
          {loading ? <Loader2 size={16} /> : <Search size={16} />}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ maxHeight: "120px", overflowY: "auto", marginBottom: "0.5rem" }}>
          {results.map(t => {
            const isSelected = selectedSong?.id === t.id;
            return (
              <div 
                key={t.id} 
                onClick={() => { setSelectedSong(t); setStartTime(0); setIsPlayingPreview(false); }} 
                style={isSelected ? activeTrack : trackRow}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <img src={t.albumArt} alt={t.name} style={{ width: "24px", height: "24px", borderRadius: "4px" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>{t.artist} - {t.name}</span>
                </div>
                <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>0:30</span>
              </div>
            );
          })}
        </div>
      )}

      {selectedSong && (
        <div style={igCutterBox}>
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <img src={selectedSong.albumArt} alt="Cover" style={{ width: "48px", height: "48px", borderRadius: "8px", margin: "0 auto 0.3rem auto" }} />
            <div style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{selectedSong.name}</div>
            <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{selectedSong.artist}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={togglePlayCutter} style={igPlayBtn}>
              {isPlayingPreview ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#ccc", marginBottom: "0.2rem" }}>
                <span>Mulai: <strong>{formatTime(startTime)}</strong></span>
                <span>Durasi: <strong>00:30</strong></span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="0" 
                value={startTime} 
                onChange={(e) => setStartTime(parseInt(e.target.value))}
                style={{ width: "100%", cursor: "pointer", accentColor: "#e1306c" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Helper
const inp = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.9rem", boxSizing: "border-box" };
const searchBtn = { background: "#6c5ce7", color: "white", border: "none", padding: "0 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const deezerBox = { background: "#f8fafc", padding: "0.6rem", borderRadius: "8px", border: "1px solid #e2e8f0" };
const trackRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem", cursor: "pointer", borderBottom: "1px solid #eee" };
const activeTrack = { ...trackRow, background: "#f3e8ff", color: "#6c5ce7" };
const igCutterBox = { background: "#111", color: "white", padding: "0.8rem", borderRadius: "12px", marginTop: "0.5rem" };
const igPlayBtn = { background: "white", color: "black", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };