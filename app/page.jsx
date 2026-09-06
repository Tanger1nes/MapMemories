// app/page.jsx (atau file utama Anda)
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";

const Dashboard = dynamic(() => import("../components/Dashboard"), {
  ssr: false,
  loading: () => <div style={{ padding: "2rem", textAlign: "center" }}>Memuat Peta...</div>
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      fetchPosts(session?.user?.id);
    };

    fetchInitialData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      fetchPosts(session?.user?.id);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Ambil posts beserta profiles, likes, dan comments
  const fetchPosts = async (currentUserId) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (full_name, username),
          likes (user_id),
          comments (id, text, user_id, profiles(full_name, username))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Format data agar sesuai kebutuhan Dashboard (hitung like, cek apakah user sudah like)
      const formattedPosts = (data || []).map(post => {
        const likeCount = post.likes ? post.likes.length : 0;
        const userLiked = currentUserId ? post.likes?.some(l => l.user_id === currentUserId) : false;
        
        const comments = (post.comments || []).map(c => ({
          id: c.id,
          text: c.text,
          author: c.profiles?.full_name || c.profiles?.username || "Anonim"
        }));

        return {
          ...post,
          likeCount,
          userLiked,
          comments
        };
      });

      setPosts(formattedPosts);
    } catch (err) {
      console.error("Gagal mengambil posts:", err?.message || err);
    }
  };

  const handleAddPost = async (payload) => {
    if (!user) throw new Error("Kamu harus login terlebih dahulu!");

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: user.id,
          location: payload.location,
          address: payload.address,
          note: payload.note,
          track_name: payload.track_name,
          preview_url: payload.preview_url,
          start_time: payload.start_time,
          lat: payload.lat,
          lng: payload.lng
        }
      ])
      .select();

    if (error) {
      console.error("Supabase Insert Error Detail:", error);
      throw new Error(error.message || "Gagal menyimpan ke database Supabase");
    }

    fetchPosts(user.id);
    return data;
  };

  // --- PERBAIKAN: FITUR LIKE TERHUBUNG KE SUPABASE ---
  const handleLike = async (postId) => {
    if (!user) return;

    // Cek apakah user sudah pernah like post ini sebelumnya
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking like:", checkError);
      return;
    }

    if (existingLike) {
      // Kalau sudah di-like, hapus (Unlike)
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      // Kalau belum, masukkan data like baru (Like)
      await supabase
        .from("likes")
        .insert([{ post_id: postId, user_id: user.id }]);
    }

    fetchPosts(user.id);
  };

  // --- PERBAIKAN: FITUR KOMENTAR TERHUBUNG KE SUPABASE ---
  const handleAddComment = async (postId, text) => {
    if (!user) throw new Error("Harus login untuk berkomentar!");

    const { error } = await supabase
      .from("comments")
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          text: text
        }
      ]);

    if (error) {
      console.error("Gagal kirim komentar:", error);
      throw new Error(error.message);
    }

    fetchPosts(user.id);
  };

  const handleLogin = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const handleRegister = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw new Error(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    fetchPosts(null);
  };

  return (
    <Dashboard
      user={user}
      posts={posts}
      onLike={handleLike}
      onAddComment={handleAddComment}
      onAddPost={handleAddPost}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onLogout={handleLogout}
    />
  );
}