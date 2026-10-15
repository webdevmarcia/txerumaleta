// MODO DEMONSTRAÇÃO — guarda tudo no localStorage do navegador.
// Tem exatamente as mesmas funções que ./supabase.js, para a app não notar a diferença.
import { seedDB } from "./seed";
import { isSupabaseConfigured } from "./supabase";
import { blobToDataURL, resizeImage, stripAccents } from "../lib/utils";

const DB_KEY = "txerumaleta:db:v1";
const SESSION_KEY = "txerumaleta:session";
const CHANGE = "txerumaleta:change";

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* dados corrompidos: recomeça */
  }
  const fresh = seedDB();
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  } catch {
    /* sem armazenamento disponível */
  }
  return fresh;
}

// só carrega/semeia os dados se o modo demonstração estiver mesmo a ser usado
let db = isSupabaseConfigured ? null : load();
const authListeners = new Set();

function commit() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new Error("O armazenamento do navegador está cheio. Use imagens mais pequenas ou limpe os dados de demonstração.");
  }
  window.dispatchEvent(new Event(CHANGE));
}

// sincroniza entre separadores abertos
window.addEventListener("storage", (e) => {
  if (isSupabaseConfigured) return;
  if (e.key === DB_KEY) {
    db = load();
    window.dispatchEvent(new Event(CHANGE));
  }
  if (e.key === SESSION_KEY) authListeners.forEach((cb) => cb(session()));
});

const wait = (v) => new Promise((r) => setTimeout(() => r(v), 80));
const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const byDateDesc = (a, b) => b.created_at.localeCompare(a.created_at);

function session() {
  const id = localStorage.getItem(SESSION_KEY);
  const user = id && db.users.find((u) => u.id === id);
  return user ? { user: { id: user.id, email: user.email } } : null;
}
function setSession(id) {
  if (id) localStorage.setItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
  authListeners.forEach((cb) => cb(session()));
}
function myId() {
  return session()?.user.id ?? null;
}
function requireId() {
  const id = myId();
  if (!id) throw new Error("Sessão expirada. Entre novamente.");
  return id;
}

const profileOf = (id) => db.profiles.find((p) => p.id === id) ?? null;
const copy = (x) => (x == null ? x : structuredClone(x));

function hydratePost(p) {
  const uid = myId();
  return copy({
    ...p,
    author: profileOf(p.author_id),
    like_count: db.likes.filter((l) => l.post_id === p.id).length,
    comment_count: db.comments.filter((c) => c.post_id === p.id).length,
    liked_by_me: db.likes.some((l) => l.post_id === p.id && l.user_id === uid),
    saved_by_me: db.saves.some((s) => s.post_id === p.id && s.user_id === uid),
  });
}

function notify(user_id, actor_id, type, post_id = null) {
  if (user_id === actor_id) return;
  db.notifications.push({ id: newId(), user_id, actor_id, type, post_id, read: false, created_at: now() });
}

const searchText = (p) =>
  stripAccents(
    [p.full_name, p.username, p.headline, p.city, p.country, p.island, ...(p.skills ?? []), ...(p.interests ?? [])]
      .join(" ")
      .toLowerCase()
  );

function subscribeChanges(cb) {
  window.addEventListener(CHANGE, cb);
  return () => window.removeEventListener(CHANGE, cb);
}

export const api = {
  auth: {
    async getSession() {
      return wait(session());
    },
    onAuthChange(cb) {
      authListeners.add(cb);
      return () => authListeners.delete(cb);
    },
    async signUp({ email, password, full_name, username }) {
      const mail = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === mail)) throw new Error("Já existe uma conta com este email.");
      if (db.profiles.some((p) => p.username === username)) throw new Error("Esse nome de utilizador já está ocupado.");
      if (password.length < 6) throw new Error("A palavra-passe deve ter pelo menos 6 caracteres.");
      const id = newId();
      db.users.push({ id, email: mail, password });
      db.profiles.push({
        id, username, full_name, avatar_url: null, cover_url: null, headline: "", bio: "",
        roles: [], island: null, city: "", country: "", skills: [], interests: [], open_to: [],
        socials: {}, experience: [], onboarded: false, created_at: now(),
      });
      commit();
      setSession(id);
      return wait({ needsConfirmation: false });
    },
    async signIn({ email, password }) {
      const user = db.users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
      if (!user) throw new Error("Email ou palavra-passe incorretos.");
      setSession(user.id);
      return wait();
    },
    async signOut() {
      setSession(null);
      return wait();
    },
    async resetPassword() {
      // no modo demonstração não são enviados emails
      return wait();
    },
    async updatePassword(password) {
      const user = db.users.find((u) => u.id === requireId());
      if (password.length < 6) throw new Error("A palavra-passe deve ter pelo menos 6 caracteres.");
      user.password = password;
      commit();
      return wait();
    },
  },

  profiles: {
    async getById(id) {
      return wait(copy(profileOf(id)));
    },
    async getByUsername(username) {
      return wait(copy(db.profiles.find((p) => p.username === username) ?? null));
    },
    async isUsernameAvailable(username) {
      const p = db.profiles.find((x) => x.username === username);
      return wait(!p || p.id === myId());
    },
    async update(patch) {
      const p = profileOf(requireId());
      // eslint-disable-next-line no-unused-vars
      const { id, created_at, ...rest } = patch;
      if (rest.username && db.profiles.some((x) => x.username === rest.username && x.id !== p.id)) {
        throw new Error("Esse nome de utilizador já está ocupado.");
      }
      Object.assign(p, rest, { updated_at: now() });
      commit();
      return wait(copy(p));
    },
    async uploadImage(file, kind = "img") {
      const blob = await resizeImage(file, kind === "avatar" ? 400 : 1000, 0.8);
      return blobToDataURL(blob);
    },
    async search({ q = "", island = "", country = "", role = "", openTo = "", limit = 60 } = {}) {
      const term = stripAccents(q.toLowerCase().trim());
      const rows = db.profiles
        .filter((p) => p.onboarded)
        .filter((p) => !term || searchText(p).includes(term))
        .filter((p) => !island || p.island === island)
        .filter((p) => !country || p.country === country)
        .filter((p) => !role || p.roles?.includes(role))
        .filter((p) => !openTo || p.open_to?.includes(openTo))
        .sort(byDateDesc)
        .slice(0, limit);
      return wait(copy(rows));
    },
    async suggestions(limit = 5) {
      const uid = requireId();
      const me = profileOf(uid);
      const following = new Set(db.follows.filter((f) => f.follower_id === uid).map((f) => f.following_id));
      const score = (p) =>
        (p.island && p.island === me?.island ? 2 : 0) +
        (p.country && p.country === me?.country ? 2 : 0) +
        (p.interests ?? []).filter((i) => me?.interests?.includes(i)).length;
      const rows = db.profiles
        .filter((p) => p.onboarded && p.id !== uid && !following.has(p.id))
        .sort((a, b) => score(b) - score(a))
        .slice(0, limit);
      return wait(copy(rows));
    },
    async stats(id) {
      return wait({
        followers: db.follows.filter((f) => f.following_id === id).length,
        following: db.follows.filter((f) => f.follower_id === id).length,
        posts: db.posts.filter((p) => p.author_id === id).length,
      });
    },
    async isFollowing(id) {
      const uid = requireId();
      return wait(db.follows.some((f) => f.follower_id === uid && f.following_id === id));
    },
    async follow(id) {
      const uid = requireId();
      if (!db.follows.some((f) => f.follower_id === uid && f.following_id === id)) {
        db.follows.push({ follower_id: uid, following_id: id, created_at: now() });
        notify(id, uid, "follow");
        commit();
      }
      return wait();
    },
    async unfollow(id) {
      const uid = requireId();
      db.follows = db.follows.filter((f) => !(f.follower_id === uid && f.following_id === id));
      commit();
      return wait();
    },
    async followers(id) {
      return wait(copy(db.follows.filter((f) => f.following_id === id).sort(byDateDesc).map((f) => profileOf(f.follower_id)).filter(Boolean)));
    },
    async following(id) {
      return wait(copy(db.follows.filter((f) => f.follower_id === id).sort(byDateDesc).map((f) => profileOf(f.following_id)).filter(Boolean)));
    },
  },

  posts: {
    async list({ scope = "all", category = "", authorId = "", before = "", limit = 15 } = {}) {
      let rows = [...db.posts].sort(byDateDesc);
      if (category) rows = rows.filter((p) => p.category === category);
      if (authorId) rows = rows.filter((p) => p.author_id === authorId);
      if (before) rows = rows.filter((p) => p.created_at < before);
      if (scope === "following") {
        const uid = requireId();
        const ids = new Set([uid, ...db.follows.filter((f) => f.follower_id === uid).map((f) => f.following_id)]);
        rows = rows.filter((p) => ids.has(p.author_id));
      }
      return wait({ items: rows.slice(0, limit).map(hydratePost), hasMore: rows.length > limit });
    },
    async saved() {
      const uid = requireId();
      const ids = db.saves.filter((s) => s.user_id === uid).sort(byDateDesc).map((s) => s.post_id);
      const items = ids.map((id) => db.posts.find((p) => p.id === id)).filter(Boolean).map(hydratePost);
      return wait({ items, hasMore: false });
    },
    async get(id) {
      const p = db.posts.find((x) => x.id === id);
      return wait(p ? hydratePost(p) : null);
    },
    async create({ content, category, image }) {
      const uid = requireId();
      const image_url = image ? await api.profiles.uploadImage(image, "post") : null;
      const post = { id: newId(), author_id: uid, content, category, image_url, created_at: now() };
      db.posts.push(post);
      commit();
      return wait(hydratePost(post));
    },
    async remove(id) {
      const uid = requireId();
      db.posts = db.posts.filter((p) => !(p.id === id && p.author_id === uid));
      db.likes = db.likes.filter((l) => l.post_id !== id);
      db.comments = db.comments.filter((c) => c.post_id !== id);
      db.saves = db.saves.filter((s) => s.post_id !== id);
      db.notifications = db.notifications.filter((n) => n.post_id !== id);
      commit();
      return wait();
    },
    async setLiked(id, liked) {
      const uid = requireId();
      db.likes = db.likes.filter((l) => !(l.post_id === id && l.user_id === uid));
      if (liked) {
        db.likes.push({ user_id: uid, post_id: id, created_at: now() });
        const post = db.posts.find((p) => p.id === id);
        if (post) notify(post.author_id, uid, "like", id);
      }
      commit();
      return wait();
    },
    async setSaved(id, saved) {
      const uid = requireId();
      db.saves = db.saves.filter((s) => !(s.post_id === id && s.user_id === uid));
      if (saved) db.saves.push({ user_id: uid, post_id: id, created_at: now() });
      commit();
      return wait();
    },
    async comments(postId) {
      const rows = db.comments
        .filter((c) => c.post_id === postId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((c) => ({ ...c, author: profileOf(c.author_id) }));
      return wait(copy(rows));
    },
    async addComment(postId, content) {
      const uid = requireId();
      const c = { id: newId(), post_id: postId, author_id: uid, content, created_at: now() };
      db.comments.push(c);
      const post = db.posts.find((p) => p.id === postId);
      if (post) notify(post.author_id, uid, "comment", postId);
      commit();
      return wait(copy({ ...c, author: profileOf(uid) }));
    },
    async removeComment(id) {
      db.comments = db.comments.filter((c) => c.id !== id);
      commit();
      return wait();
    },
  },

  services: {
    async list({ q = "", category = "", ownerId = "" } = {}) {
      const term = stripAccents(q.toLowerCase().trim());
      const rows = db.services
        .filter((s) => !category || s.category === category)
        .filter((s) => !ownerId || s.owner_id === ownerId)
        .filter((s) => !term || stripAccents(`${s.title} ${s.description} ${s.location}`.toLowerCase()).includes(term))
        .sort(byDateDesc)
        .map((s) => ({ ...s, owner: profileOf(s.owner_id) }));
      return wait(copy(rows));
    },
    async create(data) {
      const uid = requireId();
      const s = { id: newId(), owner_id: uid, created_at: now(), ...data };
      db.services.push(s);
      commit();
      return wait(copy({ ...s, owner: profileOf(uid) }));
    },
    async remove(id) {
      const uid = requireId();
      db.services = db.services.filter((s) => !(s.id === id && s.owner_id === uid));
      commit();
      return wait();
    },
  },

  messages: {
    async conversations() {
      const uid = requireId();
      const rows = db.conversations
        .filter((c) => c.user_a === uid || c.user_b === uid)
        .map((c) => {
          const msgs = db.messages.filter((m) => m.conversation_id === c.id);
          const last = msgs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
          return {
            id: c.id,
            other: profileOf(c.user_a === uid ? c.user_b : c.user_a),
            updated_at: last?.created_at ?? c.created_at,
            last_message: last,
            unread_count: msgs.filter((m) => m.sender_id !== uid && !m.read_at).length,
          };
        })
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      return wait(copy(rows));
    },
    async openWith(otherId) {
      const uid = requireId();
      const [user_a, user_b] = [uid, otherId].sort();
      let c = db.conversations.find((x) => x.user_a === user_a && x.user_b === user_b);
      if (!c) {
        c = { id: newId(), user_a, user_b, created_at: now() };
        db.conversations.push(c);
        commit();
      }
      return wait(c.id);
    },
    async get(conversationId) {
      const uid = requireId();
      const c = db.conversations.find((x) => x.id === conversationId && (x.user_a === uid || x.user_b === uid));
      return wait(c ? copy({ id: c.id, other: profileOf(c.user_a === uid ? c.user_b : c.user_a) }) : null);
    },
    async list(conversationId) {
      const rows = db.messages
        .filter((m) => m.conversation_id === conversationId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      return wait(copy(rows));
    },
    async send(conversationId, content) {
      const uid = requireId();
      const m = { id: newId(), conversation_id: conversationId, sender_id: uid, content, read_at: null, created_at: now() };
      db.messages.push(m);
      commit();

      // as contas de exemplo respondem automaticamente, para a demo parecer viva
      const c = db.conversations.find((x) => x.id === conversationId);
      const otherId = c && (c.user_a === uid ? c.user_b : c.user_a);
      const alreadyReplied = db.messages.some((x) => x.conversation_id === conversationId && x.sender_id === otherId);
      if (otherId?.startsWith("u-") && !alreadyReplied) {
        const name = profileOf(uid)?.full_name?.split(" ")[0] ?? "";
        setTimeout(() => {
          db.messages.push({
            id: newId(), conversation_id: conversationId, sender_id: otherId, read_at: null, created_at: now(),
            content: `Olá ${name}! Obrigado pela mensagem 😊 Esta é uma conta de demonstração, mas na versão real a pessoa responder-te-ia aqui.`,
          });
          commit();
        }, 2500);
      }
      return wait(copy(m));
    },
    async markRead(conversationId) {
      const uid = requireId();
      let changed = false;
      db.messages.forEach((m) => {
        if (m.conversation_id === conversationId && m.sender_id !== uid && !m.read_at) {
          m.read_at = now();
          changed = true;
        }
      });
      if (changed) commit();
      return wait();
    },
    async unreadCount() {
      const uid = myId();
      if (!uid) return 0;
      const mine = new Set(db.conversations.filter((c) => c.user_a === uid || c.user_b === uid).map((c) => c.id));
      return db.messages.filter((m) => mine.has(m.conversation_id) && m.sender_id !== uid && !m.read_at).length;
    },
    subscribe: subscribeChanges,
  },

  notifications: {
    async list() {
      const uid = requireId();
      const rows = db.notifications
        .filter((n) => n.user_id === uid)
        .sort(byDateDesc)
        .slice(0, 60)
        .map((n) => {
          const post = n.post_id ? db.posts.find((p) => p.id === n.post_id) : null;
          return { ...n, actor: profileOf(n.actor_id), post: post ? { id: post.id, content: post.content } : null };
        });
      return wait(copy(rows));
    },
    async unreadCount() {
      const uid = myId();
      if (!uid) return 0;
      return db.notifications.filter((n) => n.user_id === uid && !n.read).length;
    },
    async markAllRead() {
      const uid = requireId();
      let changed = false;
      db.notifications.forEach((n) => {
        if (n.user_id === uid && !n.read) {
          n.read = true;
          changed = true;
        }
      });
      if (changed) commit();
      return wait();
    },
    subscribe: subscribeChanges,
  },

  reports: {
    async create({ target_type, target_id, reason, details = "" }) {
      db.reports.push({ id: newId(), reporter_id: requireId(), target_type, target_id, reason, details, created_at: now() });
      commit();
      return wait();
    },
  },

  demo: {
    reset() {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "/";
    },
  },
};
