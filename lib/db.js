import { supabase } from "./supabase";

// --- AUTH ---
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { ...user, ...profile };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || "",
        username: email.split("@")[0],
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// --- POSTS ---
export async function getPosts(userId = null) {
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:user_id (username, full_name),
      likes (user_id),
      comments (
        id,
        text,
        created_at,
        profiles:user_id (full_name, username)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return posts.map((post) => ({
    ...post,
    likeCount: post.likes ? post.likes.length : 0,
    userLiked: userId ? post.likes?.some((l) => l.user_id === userId) : false,
    comments: post.comments?.map((c) => ({
      id: c.id,
      author: c.profiles?.full_name || c.profiles?.username || "Anonim",
      text: c.text,
    })) || [],
  }));
}

export async function createPost(postData) {
  const { data, error } = await supabase
    .from("posts")
    .insert([postData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- LIKES ---
export async function toggleLike(postId, userId) {
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("likes").insert([{ post_id: postId, user_id: userId }]);
  }
}

// --- COMMENTS ---
export async function addComment(postId, userId, text) {
  const { data, error } = await supabase
    .from("comments")
    .insert([{ post_id: postId, user_id: userId, text }])
    .select()
    .single();

  if (error) throw error;
  return data;
}