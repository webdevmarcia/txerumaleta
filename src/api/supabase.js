import { createClient } from "@supabase/supabase-js";
import { resizeImage, stripAccents } from "../lib/utils";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);
const sb = isSupabaseConfigured ? createClient(url, key) : null;

// ---------------------------------------------------------------------
// utilitários
// ---------------------------------------------------------------------
const ERRORS = {
  "Invalid login credentials": "Email ou palavra-passe incorretos.",
  "User already registered": "Já existe uma conta com este email.",
  "Email not confirmed": "Confirme o seu email antes de entrar (veja a caixa de entrada).",
  "Password should be at least 6 characters": "A palavra-passe deve ter pelo menos 6 caracteres.",
};

function fail(error) {
  const msg = ERRORS[error?.message] ?? error?.message ?? "Ocorreu um erro. Tente novamente.";
  return new Error(msg);
}

function check({ data, error }) {
  if (error) throw fail(error);
  return data;
}

async function myId() {
  const { data } = await sb.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function requireId() {
  const id = await myId();
  if (!id) throw new Error("Sessão expirada. Entre novamente.");
  return id;
}

const clean = (q = "") => stripAccents(q).toLowerCase().replace(/[,()%*\\]/g, " ").trim();

const toSession = (s) => (s ? { user: { id: s.user.id, email: s.user.email } } : null);

const POST_SELECT = "*, author:profiles(*), likes(count), comments(count)";

async function hydratePosts(rows) {
  if (!rows.length) return [];
  const uid = await myId();
  const ids = rows.map((r) => r.id);
  const [likes, saves] = await Promise.all([
    sb.from("likes").select("post_id").eq("user_id", uid).in("post_id", ids).then(check),
    sb.from("saves").select("post_id").eq("user_id", uid).in("post_id", ids).then(check),
  ]);
  const liked = new Set(likes.map((l) => l.post_id));
  const saved = new Set(saves.map((s) => s.post_id));
  return rows.map(({ likes: lc, comments: cc, ...p }) => ({
    ...p,
    like_count: lc?.[0]?.count ?? 0,
    comment_count: cc?.[0]?.count ?? 0,
    liked_by_me: liked.has(p.id),
    saved_by_me: saved.has(p.id),
  }));
}

async function followingIds(uid) {
  const rows = check(await sb.from("follows").select("following_id").eq("follower_id", uid));
  return rows.map((r) => r.following_id);
}

// ---------------------------------------------------------------------
// API
// ---------------------------------------------------------------------
export const api = {
  auth: {
    async getSession() {
      const { data } = await sb.auth.getSession();
      return toSession(data.session);
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((event, session) => cb(toSession(session), event));
      return () => data.subscription.unsubscribe();
    },
    async signUp({ email, password, full_name, username }) {
      const data = check(
        await sb.auth.signUp({
          email,
          password,
          options: { data: { full_name, username }, emailRedirectTo: window.location.origin },
        })
      );
      return { needsConfirmation: !data.session };
    },
    async signIn({ email, password }) {
      check(await sb.auth.signInWithPassword({ email, password }));
    },
    async signOut() {
      check(await sb.auth.signOut());
    },
    async resetPassword(email) {
      check(
        await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/nova-password`,
        })
      );
    },
    async updatePassword(password) {
      check(await sb.auth.updateUser({ password }));
    },
  },

  profiles: {
    async getById(id) {
      return check(await sb.from("profiles").select("*").eq("id", id).maybeSingle());
    },
    async getByUsername(username) {
      return check(await sb.from("profiles").select("*").eq("username", username).maybeSingle());
    },
    async isUsernameAvailable(username) {
      const uid = await myId();
      const row = check(await sb.from("profiles").select("id").eq("username", username).maybeSingle());
      return !row || row.id === uid;
    },
    async update(patch) {
      const uid = await requireId();
      // eslint-disable-next-line no-unused-vars
      const { id, created_at, updated_at, search_text, ...rest } = patch;
      return check(await sb.from("profiles").update(rest).eq("id", uid).select().single());
    },
    async uploadImage(file, kind = "img") {
      const uid = await requireId();
      const blob = await resizeImage(file, kind === "avatar" ? 600 : 1600);
      const path = `${uid}/${kind}-${Date.now()}.jpg`;
      check(await sb.storage.from("media").upload(path, blob, { contentType: "image/jpeg" }));
      return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    },
    async search({ q = "", island = "", country = "", role = "", openTo = "", limit = 60 } = {}) {
      let query = sb.from("profiles").select("*").eq("onboarded", true).order("created_at", { ascending: false }).limit(limit);
      const term = clean(q);
      if (term) query = query.ilike("search_text", `%${term}%`);
      if (island) query = query.eq("island", island);
      if (country) query = query.eq("country", country);
      if (role) query = query.contains("roles", [role]);
      if (openTo) query = query.contains("open_to", [openTo]);
      return check(await query);
    },
    async suggestions(limit = 5) {
      const uid = await requireId();
      const [me, following, recent] = await Promise.all([
        api.profiles.getById(uid),
        followingIds(uid),
        sb.from("profiles").select("*").eq("onboarded", true).neq("id", uid).order("created_at", { ascending: false }).limit(50).then(check),
      ]);
      const skip = new Set(following);
      const score = (p) =>
        (p.island && p.island === me?.island ? 2 : 0) +
        (p.country && p.country === me?.country ? 2 : 0) +
        (p.interests ?? []).filter((i) => me?.interests?.includes(i)).length;
      return recent
        .filter((p) => !skip.has(p.id))
        .sort((a, b) => score(b) - score(a))
        .slice(0, limit);
    },
    async stats(id) {
      const count = (q) => q.then((r) => r.count ?? 0);
      const head = { count: "exact", head: true };
      const [followers, following, posts] = await Promise.all([
        count(sb.from("follows").select("*", head).eq("following_id", id)),
        count(sb.from("follows").select("*", head).eq("follower_id", id)),
        count(sb.from("posts").select("*", head).eq("author_id", id)),
      ]);
      return { followers, following, posts };
    },
    async isFollowing(id) {
      const uid = await requireId();
      const { count } = await sb
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", uid)
        .eq("following_id", id);
      return (count ?? 0) > 0;
    },
    async follow(id) {
      const uid = await requireId();
      const { error } = await sb.from("follows").insert({ follower_id: uid, following_id: id });
      if (error && error.code !== "23505") throw fail(error);
    },
    async unfollow(id) {
      const uid = await requireId();
      check(await sb.from("follows").delete().eq("follower_id", uid).eq("following_id", id));
    },
    async followers(id) {
      const rows = check(
        await sb.from("follows").select("profile:profiles!follows_follower_id_fkey(*)").eq("following_id", id).order("created_at", { ascending: false })
      );
      return rows.map((r) => r.profile);
    },
    async following(id) {
      const rows = check(
        await sb.from("follows").select("profile:profiles!follows_following_id_fkey(*)").eq("follower_id", id).order("created_at", { ascending: false })
      );
      return rows.map((r) => r.profile);
    },
  },

  posts: {
    async list({ scope = "all", category = "", authorId = "", before = "", limit = 15 } = {}) {
      let query = sb.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(limit + 1);
      if (category) query = query.eq("category", category);
      if (authorId) query = query.eq("author_id", authorId);
      if (before) query = query.lt("created_at", before);
      if (scope === "following") {
        const uid = await requireId();
        query = query.in("author_id", [uid, ...(await followingIds(uid))]);
      }
      const rows = check(await query);
      return { items: await hydratePosts(rows.slice(0, limit)), hasMore: rows.length > limit };
    },
    async saved() {
      const uid = await requireId();
      const saves = check(await sb.from("saves").select("post_id").eq("user_id", uid).order("created_at", { ascending: false }));
      if (!saves.length) return { items: [], hasMore: false };
      const order = saves.map((s) => s.post_id);
      const rows = check(await sb.from("posts").select(POST_SELECT).in("id", order));
      rows.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      return { items: await hydratePosts(rows), hasMore: false };
    },
    async get(id) {
      const row = check(await sb.from("posts").select(POST_SELECT).eq("id", id).maybeSingle());
      return row ? (await hydratePosts([row]))[0] : null;
    },
    async create({ content, category, image }) {
      const uid = await requireId();
      const image_url = image ? await api.profiles.uploadImage(image, "post") : null;
      const row = check(
        await sb.from("posts").insert({ author_id: uid, content, category, image_url }).select(POST_SELECT).single()
      );
      return (await hydratePosts([row]))[0];
    },
    async remove(id) {
      check(await sb.from("posts").delete().eq("id", id));
    },
    async setLiked(id, liked) {
      const uid = await requireId();
      if (liked) {
        const { error } = await sb.from("likes").insert({ user_id: uid, post_id: id });
        if (error && error.code !== "23505") throw fail(error);
      } else {
        check(await sb.from("likes").delete().eq("user_id", uid).eq("post_id", id));
      }
    },
    async setSaved(id, saved) {
      const uid = await requireId();
      if (saved) {
        const { error } = await sb.from("saves").insert({ user_id: uid, post_id: id });
        if (error && error.code !== "23505") throw fail(error);
      } else {
        check(await sb.from("saves").delete().eq("user_id", uid).eq("post_id", id));
      }
    },
    async comments(postId) {
      return check(
        await sb.from("comments").select("*, author:profiles(*)").eq("post_id", postId).order("created_at", { ascending: true })
      );
    },
    async addComment(postId, content) {
      const uid = await requireId();
      return check(
        await sb.from("comments").insert({ post_id: postId, author_id: uid, content }).select("*, author:profiles(*)").single()
      );
    },
    async removeComment(id) {
      check(await sb.from("comments").delete().eq("id", id));
    },
  },

  services: {
    async list({ q = "", category = "", ownerId = "" } = {}) {
      let query = sb.from("services").select("*, owner:profiles(*)").order("created_at", { ascending: false }).limit(100);
      if (category) query = query.eq("category", category);
      if (ownerId) query = query.eq("owner_id", ownerId);
      const term = q.replace(/[,()%*\\]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
      return check(await query);
    },
    async create(data) {
      const uid = await requireId();
      return check(
        await sb.from("services").insert({ ...data, owner_id: uid }).select("*, owner:profiles(*)").single()
      );
    },
    async remove(id) {
      check(await sb.from("services").delete().eq("id", id));
    },
  },

  messages: {
    async conversations() {
      const rows = check(await sb.rpc("my_conversations"));
      if (!rows.length) return [];
      const profiles = check(await sb.from("profiles").select("*").in("id", rows.map((r) => r.other_id)));
      const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
      return rows.map((r) => ({
        id: r.conv_id,
        other: byId[r.other_id] ?? null,
        updated_at: r.last_at ?? r.conv_updated_at,
        last_message: r.last_at ? { content: r.last_content, sender_id: r.last_sender, created_at: r.last_at } : null,
        unread_count: Number(r.unread ?? 0),
      }));
    },
    async openWith(otherId) {
      const uid = await requireId();
      const [user_a, user_b] = [uid, otherId].sort();
      const find = () =>
        sb.from("conversations").select("id").eq("user_a", user_a).eq("user_b", user_b).maybeSingle().then(check);
      const existing = await find();
      if (existing) return existing.id;
      const { data, error } = await sb.from("conversations").insert({ user_a, user_b }).select("id").single();
      if (error?.code === "23505") return (await find()).id;
      if (error) throw fail(error);
      return data.id;
    },
    async get(conversationId) {
      const uid = await requireId();
      const c = check(
        await sb
          .from("conversations")
          .select("*, a:profiles!conversations_user_a_fkey(*), b:profiles!conversations_user_b_fkey(*)")
          .eq("id", conversationId)
          .maybeSingle()
      );
      if (!c) return null;
      return { id: c.id, other: c.a.id === uid ? c.b : c.a };
    },
    async list(conversationId) {
      return check(
        await sb.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(500)
      );
    },
    async send(conversationId, content) {
      const uid = await requireId();
      return check(
        await sb.from("messages").insert({ conversation_id: conversationId, sender_id: uid, content }).select().single()
      );
    },
    async markRead(conversationId) {
      const uid = await requireId();
      check(
        await sb
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .neq("sender_id", uid)
          .is("read_at", null)
      );
    },
    async unreadCount() {
      const uid = await myId();
      if (!uid) return 0;
      const { count } = await sb
        .from("messages")
        .select("*", { count: "exact", head: true })
        .neq("sender_id", uid)
        .is("read_at", null);
      return count ?? 0;
    },
    subscribe(cb) {
      const ch = sb
        .channel(`messages-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, cb)
        .subscribe();
      return () => sb.removeChannel(ch);
    },
  },

  notifications: {
    async list() {
      const uid = await requireId();
      return check(
        await sb
          .from("notifications")
          .select("*, actor:profiles!notifications_actor_id_fkey(*), post:posts(id, content)")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(60)
      );
    },
    async unreadCount() {
      const uid = await myId();
      if (!uid) return 0;
      const { count } = await sb
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("read", false);
      return count ?? 0;
    },
    async markAllRead() {
      const uid = await requireId();
      check(await sb.from("notifications").update({ read: true }).eq("user_id", uid).eq("read", false));
    },
    subscribe(cb) {
      const ch = sb
        .channel(`notifications-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, cb)
        .subscribe();
      return () => sb.removeChannel(ch);
    },
  },

  reports: {
    async create({ target_type, target_id, reason, details = "" }) {
      const uid = await requireId();
      check(await sb.from("reports").insert({ reporter_id: uid, target_type, target_id, reason, details }));
    },
  },
};
