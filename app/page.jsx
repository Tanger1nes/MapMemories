"use client";

import { useState, useEffect } from "react";
import Dashboard from "../components/Dashboard";

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const samplePosts = [
    {
      id: 1,
      location: "Wanjang Kopi Pak Darto",
      address: "2, Komik - 2 hari ini",
      note: "Dulu tiap-tiap orangtangan di sini berlangsung bersama. Tempat kecil lagi penuh keranangan.",
      author: "Rian",
      year: "2024",
      likes: 41,
      comments: 23,
      username: "rian_123",
    },
    {
      id: 2,
      location: "Lorong Mural Warna",
      address: "Jl. Nusa Indah, Ciputra - 3 hari ini",
      note: "Tempat ini dulu terletak pada pase. Sekarang penuh warna dan cerita. Lagu ini selalu ternyata saat melewati jalan ini.",
      author: "Sita",
      year: "2024",
      likes: 35,
      comments: 12,
      username: "sita_art",
    },
  ];

  useEffect(() => {
    setPosts(samplePosts);
  }, []);

  const handleLogin = (data) => {
    setUser({ username: data.username || data.email?.split("@")[0], email: data.email });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleLike = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  return (
    <Dashboard
      user={user}
      onLogin={handleLogin}
      onLogout={handleLogout}
      posts={posts}
      onLike={handleLike}
    />
  );
}