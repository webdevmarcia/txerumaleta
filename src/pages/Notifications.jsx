import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageSquare, UserPlus } from "lucide-react";
import { api } from "../api";
import { FollowButton } from "../components/people";
import { Avatar, EmptyState, PageLoader } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { refreshCounts } from "../hooks/useUnreadCounts";
import { cn, timeAgo } from "../lib/utils";

const TYPES = {
  like: { icon: Heart, color: "bg-coral-500", text: "gostou da tua publicação" },
  comment: { icon: MessageSquare, color: "bg-brand-700", text: "comentou a tua publicação" },
  follow: { icon: UserPlus, color: "bg-emerald-600", text: "começou a seguir-te" },
};

export default function Notifications() {
  const { data, loading, reload } = useApi(() => api.notifications.list(), []);

  useEffect(() => api.notifications.subscribe(reload), [reload]);

  // marca tudo como lido quando a página abre
  const hasUnread = data?.some((n) => !n.read);
  useEffect(() => {
    if (hasUnread) api.notifications.markAllRead().then(refreshCounts, () => {});
  }, [hasUnread]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Notificações</h1>
      {loading && !data ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={Bell} title="Sem notificações">
          Quando alguém gostar, comentar ou começar a seguir-te, vais ver aqui.
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {data.map((n) => {
            const t = TYPES[n.type];
            const link = n.post_id ? `/post/${n.post_id}` : `/u/${n.actor?.username}`;
            return (
              <li key={n.id} className={cn("flex items-center gap-3 px-4 py-3", !n.read && "bg-brand-50/60")}>
                <Link to={`/u/${n.actor?.username}`} className="relative shrink-0">
                  <Avatar profile={n.actor} size="md" />
                  <span className={cn("absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-white", t.color)}>
                    <t.icon className="size-3" />
                  </span>
                </Link>
                <Link to={link} className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">
                    <strong className="text-ink">{n.actor?.full_name}</strong> {t.text}
                  </p>
                  {n.post?.content && <p className="truncate text-xs text-slate-500">“{n.post.content}”</p>}
                  <p className="text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                </Link>
                {n.type === "follow" && n.actor && <FollowButton profileId={n.actor.id} size="sm" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
