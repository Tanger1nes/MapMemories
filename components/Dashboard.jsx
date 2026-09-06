// components/Dashboard.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Plus, Heart, MessageSquare, LogIn, LogOut, X, Music, Play, Pause, Send } from "lucide-react";
import MusicPicker from "./MusicPicker";

const purpleIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

// Komponen Pemutar Musik Postingan (Otomatis Pause jika postingan lain diputar)
function IgNotePlayer({ postId, songName, audioUrl, startTime = 0, playingPostId, setPlayingPostId }) {
  const audioRef = useRef(null);
  const isPlaying = playingPostId === postId;

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.currentTime = startTime || 0;
      audioRef.current.play().catch((err) => console.log("Audio play error:", err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, startTime]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      setPlayingPostId(null);
    } else {
      setPlayingPostId(postId);
    }
  };

  return (
    <div 
      onClick={togglePlay}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        background: "#f1f2f6",
        padding: "0.35rem 0.75rem",
        borderRadius: "20px",
        border: "1px solid #dfe4ea",
        marginBottom: "0.75rem",
        cursor: "pointer",
        maxWidth: "fit-content"
      }}
    >
      <div style={{ background: "#6c5ce7", borderRadius: "50%", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        {isPlaying ? <Pause size={10} /> : <Play size={10} />}
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#2d3436" }}>
        <Music size={10} style={{ display: "inline", marginRight: "3px" }} />
        {songName || "Musik Kenangan"} ({formatTime(startTime)})
      </span>
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={() => setPlayingPostId(null)} 
        />
      )}
    </div>
  );
}

export default function Dashboard({ user, posts = [], onLike, onAddComment, onAddPost, onLogin, onRegister, onLogout }) {
  const [localPosts, setLocalPosts] = useState(posts);
  const [playingPostId, setPlayingPostId] = useState(null); // State global untuk mengontrol lagu aktif
  
  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  // Form Inputs
  const [authData, setAuthData] = useState({ email: "", password: "", fullName: "" });
  const [postData, setPostData] = useState({ location: "", address: "", note: "", lat: "", lng: "" });
  const [commentInput, setCommentInput] = useState("");

  // Music States for Picker
  const [selectedSong, setSelectedSong] = useState(null);
  const [startTime, setStartTime] = useState(0);

  const handleLikeClick = async (postId, e) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLocalPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const isLiked = post.userLiked || false;
          return {
            ...post,
            userLiked: !isLiked,
            likeCount: (post.likeCount || 0) + (isLiked ? -1 : 1)
          };
        }
        return post;
      })
    );

    if (onLike) {
      try {
        await onLike(postId);
      } catch (err) {
        console.error("Gagal memproses like:", err);
      }
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentPost) return;

    const currentText = commentInput;
    const currentPostId = activeCommentPost.id;

    try {
      if (onAddComment) {
        await onAddComment(currentPostId, currentText);
      }

      const newCommentObj = {
        id: Date.now(),
        text: currentText,
        author: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Saya"
      };

      setLocalPosts(prev =>
        prev.map(p => {
          if (p.id === currentPostId) {
            const updatedComments = [...(p.comments || []), newCommentObj];
            return { ...p, comments: updatedComments };
          }
          return p;
        })
      );

      setActiveCommentPost(prev => prev ? { ...prev, comments: [...(prev.comments || []), newCommentObj] } : null);
      setCommentInput("");
    } catch (err) {
      console.error("Gagal kirim komentar:", err);
      alert("Gagal kirim komentar: " + (err?.message || "Terjadi kesalahan"));
    }
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!postData.location || !postData.note) return;

    try {
      await onAddPost({
        location: postData.location,
        address: postData.address || "Lokasi Baru",
        note: postData.note,
        track_name: selectedSong ? `${selectedSong.artist} - ${selectedSong.name}` : "",
        preview_url: selectedSong?.previewUrl || null,
        start_time: startTime,
        lat: parseFloat(postData.lat) || -6.2088,
        lng: parseFloat(postData.lng) || 106.8456
      });

      setPostData({ location: "", address: "", note: "", lat: "", lng: "" });
      setSelectedSong(null);
      setStartTime(0);
      setShowAddModal(false);
    } catch (err) {
      console.error("Gagal menyimpan postingan:", err);
      alert("Gagal menyimpan postingan: " + (err?.message || JSON.stringify(err)));
    }
  };

  const handlePostClick = (post) => {
    setSelectedPostId(post.id);
    if (post.lat && post.lng) setMapCenter([post.lat, post.lng]);
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPin color="#6c5ce7" size={28} /> Spatial Nostalgia
        </h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => user ? setShowAddModal(true) : setShowAuthModal(true)} style={btnStyle}>
            <Plus size={18} /> Tambah Kenangan
          </button>
          {user ? (
            <button onClick={onLogout} style={btnOutStyle}><LogOut size={16} /> Logout</button>
          ) : (
            <button onClick={() => { setIsRegistering(false); setShowAuthModal(true); }} style={btnWhiteStyle}>
              <LogIn size={18} /> Login
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: "flex", gap: "1.5rem", height: "calc(100vh - 150px)", minHeight: "500px" }}>
        {/* Map */}
        <div style={{ flex: 1, borderRadius: "16px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
          <MapContainer center={mapCenter} zoom={13} style={{ width: "100%", height: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFlyTo center={mapCenter} />
            {localPosts.map((post) => (
              post?.lat && post?.lng && (
                <Marker key={post.id} position={[post.lat, post.lng]} icon={purpleIcon} eventHandlers={{ click: () => handlePostClick(post) }}>
                  <Popup><strong>{post.location}</strong><br />{post.address}</Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div style={{ width: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {localPosts.map((post) => {
            const isSelected = selectedPostId === post.id;
            return (
              <div 
                key={post.id} 
                onClick={() => handlePostClick(post)} 
                style={{
                  padding: "1.25rem",
                  background: "white",
                  borderRadius: "12px",
                  border: isSelected ? "2px solid #6c5ce7" : "1px solid #e0e0e0",
                  cursor: "pointer"
                }}
              >
                <h3 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{post.location}</h3>
                <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>{post.address}</p>

                {(post.track_name || post.song || post.preview_url) && (
                  <IgNotePlayer 
                    postId={post.id}
                    songName={post.track_name || post.song} 
                    audioUrl={post.preview_url} 
                    startTime={post.start_time || 0}
                    playingPostId={playingPostId}
                    setPlayingPostId={setPlayingPostId}
                  />
                )}

                <p style={{ fontSize: "0.95rem", color: "#333", marginBottom: "0.8rem" }}>{post.note}</p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#aaa" }}>— {post.profiles?.full_name || post.profiles?.username || post.author_name || "Anonim"}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      onClick={(e) => handleLikeClick(post.id, e)} 
                      style={post.userLiked ? likeActiveBtn : likeBtn}
                    >
                      <Heart size={14} fill={post.userLiked ? "white" : "none"} /> {post.likeCount || 0}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setActiveCommentPost(post); }} style={likeBtn}>
                      <MessageSquare size={14} /> {post.comments?.length || 0}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL AUTH */}
      {showAuthModal && (
        <div style={overlay}>
          <div style={modal}>
            <div style={flexBet}>
              <h3>{isRegistering ? "Buat Akun" : "Masuk"}</h3>
              <X onClick={() => setShowAuthModal(false)} style={{ cursor: "pointer" }} />
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (isRegistering) await onRegister(authData.email, authData.password, authData.fullName);
                else await onLogin(authData.email, authData.password);
                setShowAuthModal(false);
              } catch (err) {
                alert("Gagal auth: " + (err?.message || "Terjadi kesalahan"));
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
              {isRegistering && (
                <input placeholder="Nama Lengkap" onChange={e => setAuthData({...authData, fullName: e.target.value})} style={inp} required />
              )}
              <input type="email" placeholder="Email" onChange={e => setAuthData({...authData, email: e.target.value})} style={inp} required />
              <input type="password" placeholder="Password" onChange={e => setAuthData({...authData, password: e.target.value})} style={inp} required />
              <button style={submitBtn}>{isRegistering ? "Daftar" : "Masuk"}</button>
              <p onClick={() => setIsRegistering(!isRegistering)} style={{ textAlign: "center", cursor: "pointer", color: "#6c5ce7", fontSize: "0.85rem" }}>
                {isRegistering ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
              </p>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KENANGAN */}
      {showAddModal && (
        <div style={overlay}>
          <div style={{ ...modal, maxWidth: "450px" }}>
            <div style={flexBet}>
              <h3>✨ Buat Memori</h3>
              <X onClick={() => setShowAddModal(false)} style={{ cursor: "pointer" }} />
            </div>

            <form onSubmit={submitPost} style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
              <input placeholder="Nama Tempat" value={postData.location} onChange={e => setPostData({ ...postData, location: e.target.value })} style={inp} required />
              <input placeholder="Alamat Singkat" value={postData.address} onChange={e => setPostData({ ...postData, address: e.target.value })} style={inp} />

              <MusicPicker 
                selectedSong={selectedSong} 
                setSelectedSong={setSelectedSong} 
                startTime={startTime} 
                setStartTime={setStartTime} 
              />

              <textarea placeholder="Ceritakan kenanganmu..." value={postData.note} onChange={e => setPostData({ ...postData, note: e.target.value })} style={{ ...inp, minHeight: "70px" }} required />

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input placeholder="Latitude" value={postData.lat} onChange={e => setPostData({ ...postData, lat: e.target.value })} style={inp} />
                <input placeholder="Longitude" value={postData.lng} onChange={e => setPostData({ ...postData, lng: e.target.value })} style={inp} />
              </div>

              <button style={submitBtn}>Simpan Memori</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KOMENTAR */}
      {activeCommentPost && (
        <div style={overlay}>
          <div style={modal}>
            <div style={flexBet}>
              <h3>Komentar</h3>
              <X onClick={() => setActiveCommentPost(null)} style={{ cursor: "pointer" }} />
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto", margin: "1rem 0" }}>
              {activeCommentPost.comments && activeCommentPost.comments.length > 0 ? (
                activeCommentPost.comments.map((c, idx) => (
                  <div key={c.id || idx} style={{ fontSize: "0.85rem", padding: "0.4rem 0", borderBottom: "1px solid #eee" }}>
                    <strong>{c.author || "Anonim"}</strong>: {c.text}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.85rem", color: "#888", textAlign: "center" }}>Belum ada komentar.</p>
              )}
            </div>
            <form onSubmit={handleSendComment} style={{ display: "flex", gap: "0.3rem" }}>
              <input placeholder="Tulis komentar..." value={commentInput} onChange={e => setCommentInput(e.target.value)} style={inp} required />
              <button type="submit" style={searchBtn}><Send size={16} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Helper
const btnStyle = { background: "#6c5ce7", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "bold" };
const btnOutStyle = { ...btnStyle, background: "#ef4444" };
const btnWhiteStyle = { ...btnStyle, background: "white", color: "#333", border: "1px solid #ccc" };
const likeBtn = { border: "none", background: "#f1f2f6", padding: "0.35rem 0.6rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem" };
const likeActiveBtn = { ...likeBtn, background: "#ff7675", color: "white" };
const overlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modal = { background: "white", padding: "1.5rem", borderRadius: "12px", width: "90%", maxWidth: "400px" };
const inp = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.9rem", boxSizing: "border-box" };
const submitBtn = { background: "#6c5ce7", color: "white", padding: "0.6rem", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const searchBtn = { background: "#6c5ce7", color: "white", border: "none", padding: "0 0.8rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const flexBet = { display: "flex", justifyContent: "space-between", alignItems: "center" };