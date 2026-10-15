import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Ellipsis,
  Flag,
  Heart,
  ImagePlus,
  Link as LinkIcon,
  MessageSquare,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useApi } from "../hooks/useApi";
import { POST_CATEGORIES } from "../lib/constants";
import { cn, timeAgo } from "../lib/utils";
import { Avatar, CategoryBadge, Dropdown, Linkify, ProfileLink, Spinner } from "./ui";
import { ReportModal } from "./people";

// ---------------------------------------------------------------------
// ESCREVER UMA PUBLICAÇÃO
// ---------------------------------------------------------------------
const PLACEHOLDERS = {
  experiencia: "Partilha uma experiência de vida que possa inspirar alguém…",
  dica: "Que dica gostavas de ter recebido mais cedo?",
  conhecimento: "Ensina algo que sabes fazer bem…",
  oportunidade: "Uma vaga, bolsa, estágio ou concurso…",
  evento: "Que evento está a acontecer? Data, local e como participar…",
  pergunta: "Qual é a tua dúvida? A comunidade ajuda!",
  servico: "Que serviço ofereces? Preço, zona e como contactar…",
};

export function PostComposer({ onCreated }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("experiencia");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef(null);

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha um ficheiro de imagem.");
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setExpanded(true);
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setBusy(true);
    try {
      const post = await api.posts.create({ content: content.trim(), category, image });
      onCreated?.(post);
      setContent("");
      clearImage();
      setExpanded(false);
      toast.success("Publicado!");
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="flex gap-3">
        <Avatar profile={profile} size="md" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setExpanded(true)}
          maxLength={5000}
          rows={expanded ? 4 : 1}
          placeholder={expanded ? PLACEHOLDERS[category] : `O que queres partilhar, ${profile?.full_name?.split(" ")[0] ?? ""}?`}
          className="input min-h-11 resize-none rounded-2xl bg-slate-50 transition-all focus:bg-white"
        />
      </div>

      {preview && (
        <div className="relative mt-3 ml-14">
          <img src={preview} alt="Pré-visualização" className="max-h-80 w-full rounded-xl object-cover" />
          <button type="button" onClick={clearImage} className="absolute top-2 right-2 rounded-full bg-ink/70 p-1.5 text-white hover:bg-ink" aria-label="Remover imagem">
            <X className="size-4" />
          </button>
        </div>
      )}

      {expanded && (
        <div className="animate-fade-up mt-3 sm:ml-14">
          <p className="mb-2 text-xs font-medium text-slate-500">Tipo de publicação</p>
          <div className="flex flex-wrap gap-1.5">
            {POST_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition",
                  category === c.id ? cn(c.className, "ring-current") : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 sm:ml-14">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm">
          <ImagePlus className="size-4 text-emerald-600" /> Foto
        </button>
        <div className="flex items-center gap-3">
          {content.length > 4500 && <span className="text-xs text-slate-400">{5000 - content.length}</span>}
          <button disabled={busy || (!content.trim() && !image)} className="btn btn-primary">
            {busy ? <Spinner className="size-4 text-white" /> : <Send className="size-4" />}
            Publicar
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------
// CARTÃO DE PUBLICAÇÃO
// ---------------------------------------------------------------------
export function PostCard({ post, onDeleted, defaultShowComments = false }) {
  const { user } = useAuth();
  const toast = useToast();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(post.saved_by_me);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [expanded, setExpanded] = useState(false);
  const [reporting, setReporting] = useState(false);
  const isMine = user?.id === post.author_id;
  const long = post.content.length > 420;

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await api.posts.setLiked(post.id, next);
    } catch (e) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      toast.error(e);
    }
  };

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await api.posts.setSaved(post.id, next);
      toast.success(next ? "Guardado nos teus favoritos." : "Removido dos guardados.");
    } catch (e) {
      setSaved(!next);
      toast.error(e);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
        await navigator.share({ title: "Txerumaleta", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      /* partilha cancelada */
    }
  };

  const remove = async () => {
    if (!window.confirm("Eliminar esta publicação? Esta ação não pode ser desfeita.")) return;
    try {
      await api.posts.remove(post.id);
      onDeleted?.(post.id);
      toast.success("Publicação eliminada.");
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <article className="card animate-fade-up">
      <header className="flex items-start gap-3 px-4 pt-4">
        <ProfileLink profile={post.author}>
          <Avatar profile={post.author} size="md" />
        </ProfileLink>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <ProfileLink profile={post.author} className="truncate font-semibold text-ink hover:underline">
              {post.author?.full_name || post.author?.username || "Membro"}
            </ProfileLink>
            <CategoryBadge category={post.category} />
          </div>
          <p className="truncate text-xs text-slate-500">
            {post.author?.headline ? `${post.author.headline} · ` : ""}
            <Link to={`/post/${post.id}`} className="hover:underline">
              {timeAgo(post.created_at)}
            </Link>
          </p>
        </div>
        <Dropdown
          trigger={({ toggle }) => (
            <button onClick={toggle} className="btn btn-ghost -mr-2 p-2" aria-label="Mais opções">
              <Ellipsis className="size-5" />
            </button>
          )}
        >
          <button onClick={copyLink} className="menu-item">
            <LinkIcon className="size-4" /> Copiar link
          </button>
          <button onClick={toggleSave} className="menu-item">
            <Bookmark className="size-4" /> {saved ? "Remover dos guardados" : "Guardar"}
          </button>
          {isMine ? (
            <button onClick={remove} className="menu-item text-coral-600">
              <Trash2 className="size-4" /> Eliminar
            </button>
          ) : (
            <button onClick={() => setReporting(true)} className="menu-item">
              <Flag className="size-4" /> Denunciar
            </button>
          )}
        </Dropdown>
      </header>

      {post.content && (
        <div className="px-4 pt-3 text-[15px] leading-relaxed whitespace-pre-line text-slate-800">
          <Linkify text={long && !expanded ? `${post.content.slice(0, 400).trimEnd()}…` : post.content} />
          {long && (
            <button onClick={() => setExpanded((e) => !e)} className="ml-1 text-sm font-semibold text-slate-500 hover:text-brand-700">
              {expanded ? "ver menos" : "ver mais"}
            </button>
          )}
        </div>
      )}

      {post.image_url && (
        <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="mt-3 block bg-slate-100">
          <img src={post.image_url} alt="" className="max-h-130 w-full object-cover" loading="lazy" />
        </a>
      )}

      {(likeCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 pt-3 text-xs text-slate-500">
          <span>{likeCount > 0 && `${likeCount} ${likeCount === 1 ? "gosto" : "gostos"}`}</span>
          <button onClick={() => setShowComments(true)} className="hover:underline">
            {commentCount > 0 && `${commentCount} ${commentCount === 1 ? "comentário" : "comentários"}`}
          </button>
        </div>
      )}

      <footer className="mx-2 mt-2 grid grid-cols-3 border-t border-slate-100 py-1">
        <button onClick={toggleLike} className={cn("btn btn-ghost rounded-lg", liked && "text-coral-500 hover:text-coral-600")}>
          <Heart className={cn("size-4.5", liked && "fill-current")} /> Gosto
        </button>
        <button onClick={() => setShowComments((s) => !s)} className="btn btn-ghost rounded-lg">
          <MessageSquare className="size-4.5" /> Comentar
        </button>
        <button onClick={toggleSave} className={cn("btn btn-ghost rounded-lg", saved && "text-brand-700")}>
          <Bookmark className={cn("size-4.5", saved && "fill-current")} /> Guardar
        </button>
      </footer>

      {showComments && (
        <Comments postId={post.id} postAuthorId={post.author_id} onCountChange={(d) => setCommentCount((c) => c + d)} />
      )}

      {reporting && <ReportModal target={{ type: "post", id: post.id }} onClose={() => setReporting(false)} />}
    </article>
  );
}

// ---------------------------------------------------------------------
// COMENTÁRIOS
// ---------------------------------------------------------------------
function Comments({ postId, postAuthorId, onCountChange }) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const { data: comments, error, setData: setComments } = useApi(() => api.posts.comments(postId), [postId]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    try {
      const c = await api.posts.addComment(postId, content);
      setComments((list) => [...(list ?? []), c]);
      onCountChange(1);
      setText("");
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.posts.removeComment(id);
      setComments((list) => list.filter((c) => c.id !== id));
      onCountChange(-1);
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="border-t border-slate-100 px-4 pt-3 pb-4">
      <form onSubmit={submit} className="flex items-center gap-2">
        <Avatar profile={profile} size="sm" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Escreve um comentário…"
          className="input rounded-full bg-slate-50 py-2"
        />
        <button disabled={busy || !text.trim()} className="btn btn-primary p-2.5" aria-label="Enviar comentário">
          <Send className="size-4" />
        </button>
      </form>

      {error && !comments ? (
        <p className="py-4 text-center text-sm text-slate-500">Não foi possível carregar os comentários.</p>
      ) : comments === undefined ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-2">
              <ProfileLink profile={c.author}>
                <Avatar profile={c.author} size="sm" />
              </ProfileLink>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">
                  <ProfileLink profile={c.author} className="text-sm font-semibold text-ink hover:underline">
                    {c.author?.full_name || c.author?.username}
                  </ProfileLink>
                  <p className="text-sm whitespace-pre-line text-slate-700">
                    <Linkify text={c.content} />
                  </p>
                </div>
                <div className="mt-0.5 flex gap-3 px-3 text-xs text-slate-500">
                  <span>{timeAgo(c.created_at)}</span>
                  {(c.author_id === user?.id || postAuthorId === user?.id) && (
                    <button onClick={() => remove(c.id)} className="font-medium hover:text-coral-600">
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
