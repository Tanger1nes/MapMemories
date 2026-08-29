// lib/db.js
import { supabase } from "./supabase";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPosts(userId = null) {
  let query = supabase
    .from("posts")
    .select(
      `
      *,
      profiles:user_id (username, full_name, avatar_url)
    `,
    )
    .order("created_at", { ascending: false });

  const { data: posts, error } = await query;
  if (error) throw error;

  const postsWithLikes = await Promise.all(
    posts.map(async (post) => {
      const { count, error: countError } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      if (countError) throw countError;

      let userLiked = false;
      if (userId) {
        const { data: likeData, error: likeError } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .maybeSingle();
        if (likeError) throw likeError;
        userLiked = !!likeData;
      }

      return {
        ...post,
        likeCount: count || 0,
        userLiked,
      };
    }),
  );

  return postsWithLikes;
}

export async function getPost(postId, userId = null) {
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles:user_id (username, full_name, avatar_url)
    `,
    )
    .eq("id", postId)
    .single();
  if (error) throw error;

  const { count, error: countError } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  if (countError) throw countError;

  let userLiked = false;
  if (userId) {
    const { data: likeData, error: likeError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
    if (likeError) throw likeError;
    userLiked = !!likeData;
  }

  return {
    ...post,
    likeCount: count || 0,
    userLiked,
  };
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

export async function updatePost(postId, updates) {
  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
  return true;
}

export async function toggleLike(postId, userId) {
  const { data: existing, error: findError } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return { liked: false, likeId: null };
  } else {
    const { data, error } = await supabase
      .from("likes")
      .insert([{ post_id: postId, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return { liked: true, likeId: data.id };
  }
}

export async function getLikeCount(postId) {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) throw error;
  return count || 0;
}

export async function hasUserLiked(postId, userId) {
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function createReport(reportData) {
  const { data, error } = await supabase
    .from("reports")
    .insert([reportData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getReports(status = null) {
  let query = supabase
    .from("reports")
    .select(
      `
      *,
      reporter:profiles!reporter_id (id, username, full_name),
      post:posts (
        *,
        profiles:user_id (id, username, full_name)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateReportStatus(reportId, status) {
  const { data, error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReport(reportId) {
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) throw error;
  return true;
}

export async function signUp(email, password, userData = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: userData.username || email.split("@")[0],
        full_name: userData.full_name || "",
        avatar_url: userData.avatar_url || "",
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            username:
              user.user_metadata?.username ||
              user.email?.split("@")[0] ||
              "user",
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
          },
        ])
        .select()
        .single();

      if (insertError) {
        return user;
      }
      return { ...user, ...newProfile };
    }
    throw error;
  }

  return { ...user, ...profile };
}

export async function isAdmin() {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data;
}

export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data?.role || "user";
}

export function subscribeToTable(table, event = "*", callback) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      "postgres_changes",
      {
        event,
        schema: "public",
        table,
      },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();

  return channel;
}

export function subscribeToNewPosts(callback) {
  return subscribeToTable("posts", "INSERT", callback);
}

export function subscribeToNewLikes(callback) {
  return subscribeToTable("likes", "INSERT", callback);
}

export function subscribeToNewReports(callback) {
  return subscribeToTable("reports", "INSERT", callback);
}
