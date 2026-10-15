import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCheck, MessageCircle, Send } from "lucide-react";
import { api } from "../api";
import { Avatar, EmptyState, PageLoader, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useApi } from "../hooks/useApi";
import { refreshCounts } from "../hooks/useUnreadCounts";
import { cn, formatTime, timeAgo } from "../lib/utils";

export default function Messages() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { data: conversations, loading, reload } = useApi(() => api.messages.conversations(), []);

  useEffect(() => api.messages.subscribe(reload), [reload]);

  const visible = (conversations ?? []).filter((c) => c.last_message || c.id === conversationId);

  return (
    <div className="card grid h-[calc(100dvh-10rem)] overflow-hidden md:h-[calc(100dvh-7.5rem)] md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className={cn("flex min-h-0 flex-col border-r border-slate-100", conversationId && "hidden md:flex")}>
        <div className="border-b border-slate-100 px-4 py-4">
          <h1 className="text-lg font-extrabold">Mensagens</h1>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {loading && !conversations ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : visible.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Ainda não tens conversas. Abre o perfil de alguém e carrega em <strong>Mensagem</strong>.
              <Link to="/explorar" className="btn btn-primary btn-sm mt-4">Encontrar pessoas</Link>
            </div>
          ) : (
            visible.map((c) => (
              <Link
                key={c.id}
                to={`/mensagens/${c.id}`}
                className={cn("flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50", c.id === conversationId && "bg-brand-50 hover:bg-brand-50")}
              >
                <Avatar profile={c.other} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("truncate text-sm text-ink", c.unread_count ? "font-bold" : "font-semibold")}>{c.other?.full_name}</p>
                    {c.last_message && <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(c.last_message.created_at)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={cn("flex-1 truncate text-xs", c.unread_count ? "font-semibold text-ink" : "text-slate-500")}>
                      {c.last_message ? `${c.last_message.sender_id === user.id ? "Tu: " : ""}${c.last_message.content}` : "Nova conversa"}
                    </p>
                    {c.unread_count > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">{c.unread_count}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </aside>

      <section className={cn("min-h-0", !conversationId && "hidden md:block")}>
        {conversationId ? (
          <Thread key={conversationId} conversationId={conversationId} onActivity={reload} />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState icon={MessageCircle} title="As tuas conversas">
              Escolhe uma conversa à esquerda ou começa uma nova a partir do perfil de um membro.
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}

function Thread({ conversationId, onActivity }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: conv, loading } = useApi(() => api.messages.get(conversationId), [conversationId]);
  const { data: messages, reload, setData } = useApi(() => api.messages.list(conversationId), [conversationId]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);

  // tempo real
  useEffect(() => api.messages.subscribe(reload), [reload]);

  // marca como lidas quando chegam mensagens novas
  const unread = messages?.some((m) => m.sender_id !== user.id && !m.read_at);
  useEffect(() => {
    if (!unread) return;
    api.messages.markRead(conversationId).then(() => {
      refreshCounts();
      onActivity();
    }, () => {});
  }, [unread, conversationId, onActivity]);

  useLayoutEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setText("");
    try {
      const m = await api.messages.send(conversationId, content);
      setData((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]));
      onActivity();
    } catch (err) {
      setText(content);
      toast.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading && !conv) return <PageLoader />;
  if (!conv) {
    return (
      <div className="p-6">
        <EmptyState icon={MessageCircle} title="Conversa não encontrada" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 sm:px-4">
        <button onClick={() => navigate("/mensagens")} className="btn btn-ghost p-2 md:hidden" aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <Link to={`/u/${conv.other?.username}`} className="flex min-w-0 items-center gap-3">
          <Avatar profile={conv.other} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-ink hover:underline">{conv.other?.full_name}</span>
            <span className="block truncate text-xs text-slate-500">{conv.other?.headline}</span>
          </span>
        </Link>
      </header>

      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-5">
        {messages === undefined ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Avatar profile={conv.other} size="lg" />
            <p className="mt-3 font-semibold text-ink">{conv.other?.full_name}</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">Diz olá! 👋 Apresenta-te e explica porque queres falar — ajuda a criar uma boa ligação.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === user.id;
            const prev = messages[i - 1];
            const newGroup = !prev || prev.sender_id !== m.sender_id || new Date(m.created_at) - new Date(prev.created_at) > 5 * 60_000;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start", newGroup && "pt-2")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    mine ? "rounded-br-md bg-brand-700 text-white" : "rounded-bl-md bg-white text-slate-800"
                  )}
                >
                  <p className="break-words whitespace-pre-line">{m.content}</p>
                  <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-brand-100" : "text-slate-400")}>
                    {formatTime(m.created_at)}
                    {mine && m.read_at && <CheckCheck className="size-3" aria-label="Lida" />}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-100 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Escreve uma mensagem…"
          className="input max-h-32 min-h-11 resize-none rounded-2xl bg-slate-50"
        />
        <button disabled={sending || !text.trim()} className="btn btn-primary size-11 shrink-0 p-0" aria-label="Enviar">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
