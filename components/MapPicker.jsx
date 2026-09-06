// components/MapPicker.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Play, Pause, Search } from "lucide-react";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const useMapEvents = dynamic(() => import("react-leaflet").then((mod) => mod.useMapEvents), { ssr: false });

function LocationMarker({ lat, lng, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return lat && lng ? <Marker position={[lat, lng]} /> : null;
}

export default function MapPicker({ lat, lng, onLocationChange, onSongSelect, selectedSong }) {
  const [mapCenter, setMapCenter] = useState([lat || -6.2088, lng || 106.8456]);
  const [searchQuery, setSearchQuery] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [songResults, setSongResults] = useState([]);
  
  // State Pemutar Musik & Slider
  const [activeSong, setActiveSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (lat && lng) {
      setMapCenter([lat, lng]);
    }
  }, [lat, lng]);

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setMapCenter([newLat, newLng]);
        onLocationChange(newLat, newLng, data[0].display_name);
      } else {
        alert("Lokasi tidak ditemukan!");
      }
    } catch (err) {
      console.error("Gagal mencari lokasi:", err);
    }
  };

  const handleMapClick = async (clickedLat, clickedLng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLat}&lon=${clickedLng}`);
      const data = await res.json();
      const address = data.display_name || "Lokasi dipilih";
      onLocationChange(clickedLat, clickedLng, address);
    } catch {
      onLocationChange(clickedLat, clickedLng, "Lokasi dipilih");
    }
  };

  // Cari Lagu dari iTunes API
  const handleSearchSongs = async (e) => {
    e.preventDefault();
    if (!songSearch) return;
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(songSearch)}&entity=song&limit=5`);
      const data = await res.json();
      setSongResults(data.results || []);
    } catch (err) {
      console.error("Gagal mencari lagu:", err);
    }
  };

  // Play / Pause Preview Lagu
  const togglePlay = (song) => {
    if (activeSong?.trackId === song.trackId) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(song.previewUrl);
      audio.currentTime = startTime; // Mulai dari detik slider saat ini
      audio.play();
      audioRef.current = audio;
      setActiveSong(song);
      setIsPlaying(true);

      audio.onended = () => setIsPlaying(false);
    }
  };

  // PERBAIKAN UTAMA: Geser slider langsung mengubah detik audio (currentTime)
  const handleSliderChange = (e) => {
    const newTime = Number(e.target.value);
    setStartTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime; // Audio langsung melompat ke detik yang digeser!
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={styles.container}>
      {/* Search Lokasi */}
      <div style={styles.searchBox}>
        <input 
          type="text" 
          placeholder="Cari lokasi di peta..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          style={styles.input}
        />
        <button onClick={handleSearchLocation} style={styles.searchBtn}><Search size={14} /></button>
      </div>

      {/* Peta Interaktif */}
      <div style={styles.mapWrapper}>
        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker lat={lat} lng={lng} onLocationSelect={handleMapClick} />
        </MapContainer>
      </div>

      {/* Cari Lagu */}
      <div style={styles.songSection}>
        <form onSubmit={handleSearchSongs} style={styles.searchBox}>
          <input 
            type="text" 
            placeholder="Cari lagu latar belakang..." 
            value={songSearch} 
            onChange={(e) => setSongSearch(e.target.value)} 
            style={styles.input}
          />
          <button type="submit" style={styles.searchBtn}>Cari Musik</button>
        </form>

        {songResults.map((song) => {
          const isSelected = selectedSong?.trackName === song.trackName;
          const isThisActive = activeSong?.trackId === song.trackId;

          return (
            <div key={song.trackId} style={{ ...styles.songItem, borderColor: isSelected ? "#0984e3" : "#eee" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                <img src={song.artworkUrl100} alt="cover" width={40} height={40} style={{ borderRadius: "4px" }} />
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.trackName}</div>
                  <div style={{ fontSize: "0.7rem", color: "#636e72" }}>{song.artistName}</div>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => togglePlay(song)} 
                style={styles.playBtn}
              >
                {isThisActive && isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button 
                type="button" 
                onClick={() => onSongSelect(song)} 
                style={{ ...styles.selectSongBtn, backgroundColor: isSelected ? "#00b894" : "#0984e3" }}
              >
                {isSelected ? "Dipilih ✓" : "Pilih Lagu"}
              </button>
            </div>
          );
        })}

        {/* Slider Pengatur Detik Lagu (Aktif jika ada lagu yang dipilih/diputar) */}
        {activeSong && (
          <div style={styles.sliderContainer}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#636e72" }}>
              <span>Mulai: {formatTime(startTime)}</span>
              <span>Durasi Preview: 30 Detik</span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={25} 
              step={1} 
              value={startTime} 
              onChange={handleSliderChange} 
              style={styles.slider} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  searchBox: { display: "flex", gap: "0.4rem" },
  input: { padding: "0.5rem", borderRadius: "6px", border: "1px solid #ced4da", fontSize: "0.85rem", outline: "none", flex: 1 },
  searchBtn: { backgroundColor: "#1976d2", color: "#fff", border: "none", padding: "0.5rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" },
  mapWrapper: { width: "100%", height: "200px", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd" },
  songSection: { display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" },
  songItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem", borderRadius: "8px", border: "1px solid #eee", gap: "0.5rem", backgroundColor: "#fafafa" },
  playBtn: { background: "#dfe6e9", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  selectSongBtn: { border: "none", padding: "0.3rem 0.6rem", borderRadius: "4px", color: "#fff", fontSize: "0.75rem", cursor: "pointer" },
  sliderContainer: { backgroundColor: "#f1f3f5", padding: "0.6rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.3rem" },
  slider: { width: "100%", cursor: "pointer" }
};