"use client";

import { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import LoginModal from "./LoginModal";

const tabs = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "explore", icon: "🔍", label: "Explore" },
  { id: "create", icon: "➕", label: "Create" },
  { id: "notifications", icon: "🔔", label: "Notif" },
  { id: "profile", icon: "👤", label: "Profile" },
];

const sampleComments = {
  1: [
    { id: 1, username: "Dika", text: "Dika juga seringnya berani untuk menyelamatkan kita." },
    { id: 2, username: "Sita", text: "Tampak di bawah semangat yang agak cagap." },
  ],
};

export default function Dashboard({ user, onLogin, onLogout, posts, onLike }) {
  const [view, setView] = useState("home");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [comments, setComments] = useState({});
  const [comment, setComment] = useState("");
  const [newMemory, setNewMemory] = useState({
    location: "",
    song: "",
    story: "",
    step: 1,
  });

  useEffect(() => {
    setComments(sampleComments);
  }, []);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setView("detail");
  };

  const handleBack = () => {
    setView("home");
    setSelectedPost(null);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const postId = selectedPost?.id || 1;
    const newComment = {
      id: Date.now(),
      username: user?.username || "Anonymous",
      text: comment,
    };
    setComments({
      ...comments,
      [postId]: [...(comments[postId] || []), newComment],
    });
    setComment("");
  };

  const handleCreateMemory = () => {
    if (newMemory.step === 1 && !newMemory.location) return;
    if (newMemory.step === 2 && !newMemory.song) return;
    if (newMemory.step === 3 && !newMemory.story) return;

    if (newMemory.step < 3) {
      setNewMemory({ ...newMemory, step: newMemory.step + 1 });
    } else {
      setView("home");
      setNewMemory({ location: "", song: "", story: "", step: 1 });
    }
  };

  const renderHome = () => (
    <div className={styles.homeContainer}>
      <div className={styles.header}>
        <h1 className={styles.appTitle}>🗺️ Spatial Nostalgia</h1>
        <div className={styles.headerActions}>
          {user ? (
            <button className={styles.userBtn} onClick={onLogout}>
              👤 {user.username || user.email?.split("@")[0]}
            </button>
          ) : (
            <button className={styles.loginHeaderBtn} onClick={() => setShowLogin(true)}>
              Masuk
            </button>
          )}
          <button className={styles.addBtn} onClick={() => setView("create")}>➕</button>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input type="text" placeholder="Cari tempat atau cerita..." className={styles.searchInput} />
      </div>

      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "create") setView("create");
            }}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.postsGrid}>
        {posts.map((post) => (
          <div key={post.id} className={styles.postCard} onClick={() => handlePostClick(post)}>
            <div className={styles.postHeader}>
              <div>
                <h3 className={styles.postTitle}>{post.location}</h3>
                <p className={styles.postAddress}>{post.address}</p>
              </div>
              <span className={styles.postTime}>⏱️</span>
            </div>
            <p className={styles.postNote}>{post.note}</p>
            <div className={styles.postFooter}>
              <span className={styles.postAuthor}>— {post.author || post.username}, {post.year || "2024"}</span>
            </div>
            <div className={styles.postActions}>
              <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onLike(post.id); }}>
                ❤️ {post.likes || 0}
              </button>
              <button className={styles.actionBtn} onClick={(e) => e.stopPropagation()}>
                💬 {post.comments || 0}
              </button>
              <button className={styles.actionBtn} onClick={(e) => e.stopPropagation()}>
                🔗
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedPost) return null;
    const postComments = comments[selectedPost.id] || [];

    return (
      <div className={styles.detailContainer}>
        <button className={styles.backBtn} onClick={handleBack}>←</button>
        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <h2>{selectedPost.location}</h2>
            <p className={styles.detailAddress}>{selectedPost.address}</p>
          </div>
          <div className={styles.detailNote}>
            <p>{selectedPost.note}</p>
          </div>
          <div className={styles.detailAuthor}>
            <span>👤 {selectedPost.author || selectedPost.username}</span>
            <span>❤️ {selectedPost.likes || 0}</span>
            <span>💬 {postComments.length}</span>
          </div>
          <div className={styles.detailActions}>
            <button className={styles.detailLikeBtn}>❤️ {selectedPost.likes || 0}</button>
            <button className={styles.detailShareBtn}>🔗 Bagikan</button>
          </div>
          <div className={styles.commentSection}>
            <h4>Gema Komunitas ({postComments.length})</h4>
            {postComments.map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <strong>{c.username}</strong>
                <p>{c.text}</p>
              </div>
            ))}
            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <input
                type="text"
                placeholder="Tulis komentar..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={styles.commentInput}
              />
              <button type="submit" className={styles.commentSubmit}>Kirim</button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderCreate = () => {
    const steps = [
      { id: 1, label: "Pilih Lokasi", icon: "📍" },
      { id: 2, label: "Pilih Lagu", icon: "🎵" },
      { id: 3, label: "Tulis Cerita", icon: "✍️" },
    ];

    return (
      <div className={styles.createContainer}>
        <button className={styles.backBtn} onClick={() => setView("home")}>←</button>
        <h2 className={styles.createTitle}>✨ Buat Memori Baru</h2>

        <div className={styles.stepProgress}>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`${styles.stepDot} ${
                step.id === newMemory.step ? styles.stepDotActive : ""
              } ${step.id < newMemory.step ? styles.stepDotCompleted : ""}`}
            >
              {step.icon}
            </div>
          ))}
        </div>

        <div className={styles.stepContent}>
          {newMemory.step === 1 && (
            <div>
              <h3>📍 Pilih Lokasi</h3>
              <p className={styles.stepDesc}>Tap peta atau geser pin</p>
              <input
                type="text"
                placeholder="Nama tempat..."
                value={newMemory.location}
                onChange={(e) => setNewMemory({ ...newMemory, location: e.target.value })}
                className={styles.input}
              />
              <div className={styles.mapPlaceholder}>🗺️ Peta interaktif di sini</div>
              <button className={styles.nextBtn} onClick={handleCreateMemory}>Lanjut →</button>
            </div>
          )}

          {newMemory.step === 2 && (
            <div>
              <h3>🎵 Pilih Lagu</h3>
              <p className={styles.stepDesc}>Cari lagu untuk memori ini</p>
              <div className={styles.searchRow}>
                <input type="text" placeholder="Cari lagu..." className={styles.input} />
                <button className={styles.searchBtn}>🔍</button>
              </div>
              <button className={styles.nextBtn} onClick={handleCreateMemory}>Lanjut →</button>
            </div>
          )}

          {newMemory.step === 3 && (
            <div>
              <h3>✍️ Tulis Cerita</h3>
              <p className={styles.stepDesc}>Ceritakan kenanganmu (max 500 karakter)</p>
              <textarea
                placeholder="Tulis kenanganmu di sini..."
                value={newMemory.story}
                onChange={(e) => setNewMemory({ ...newMemory, story: e.target.value })}
                className={styles.textarea}
                rows="5"
                maxLength={500}
              />
              <div className={styles.charCount}>{newMemory.story.length}/500</div>
              <button className={styles.submitBtn} onClick={handleCreateMemory}>📌 Kirim</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.app}>
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={onLogin}
      />

      {view === "home" && renderHome()}
      {view === "detail" && renderDetail()}
      {view === "create" && renderCreate()}
    </div>
  );
}