import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookOpen, Briefcase, Compass, MapPin, Newspaper, Pencil } from "lucide-react";
import { api } from "../api";
import { SuggestionsCard } from "../components/people";
import { PostCard, PostComposer } from "../components/posts";
import { Avatar, EmptyState, PageLoader, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { usePostFeed } from "../hooks/usePostFeed";
import { POST_CATEGORIES } from "../lib/constants";
import { cn, location } from "../lib/utils";

export function ProfileSideCard({ refreshKey = 0 }) {
  const { profile } = useAuth();
  const { data: stats } = useApi(() => api.profiles.stats(profile.id), [profile.id, refreshKey]);
  return (
    <div className="card overflow-hidden">
      <div
        className="h-16 bg-gradient-to-r from-brand-700 to-brand-500 bg-cover bg-center"
        style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})` } : undefined}
      />
      <div className="-mt-8 px-4 pb-4 text-center">
        <Link to={`/u/${profile.username}`}>
          <Avatar profile={profile} size="lg" ring className="mx-auto" />
          <p className="mt-2 font-bold text-ink hover:underline">{profile.full_name}</p>
        </Link>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{profile.headline || "Adiciona um título ao teu perfil"}</p>
        {location(profile) && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3" /> {location(profile)}
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 border-t border-slate-100 py-3 text-center">
        {[
          ["Publicações", stats?.posts],
          ["Seguidores", stats?.followers],
          ["A seguir", stats?.following],
        ].map(([label, n]) => (
          <Link key={label} to={`/u/${profile.username}`} className="hover:text-brand-700">
            <p className="text-sm font-bold text-ink">{n ?? "–"}</p>
            <p className="text-[11px] text-slate-500">{label}</p>
          </Link>
        ))}
      </div>
      <div className="border-t border-slate-100 p-2">
        <Link to="/definicoes" className="menu-item"><Pencil className="size-4" /> Editar perfil</Link>
        <Link to="/guardados" className="menu-item"><Bookmark className="size-4" /> Guardados</Link>
        <Link to="/servicos" className="menu-item"><Briefcase className="size-4" /> Serviços</Link>
        <Link to="/explorar" className="menu-item"><Compass className="size-4" /> Encontrar pessoas</Link>
      </div>
    </div>
  );
}

export default function Feed() {
  const [scope, setScope] = useState("all");
  const [category, setCategory] = useState("");
  const params = useMemo(() => ({ scope, category }), [scope, category]);
  const feed = usePostFeed(params);
  const [published, setPublished] = useState(0);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:block">
        <div className="sticky top-22 space-y-4">
          <ProfileSideCard refreshKey={published} />
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        <PostComposer
          onCreated={(post) => {
            feed.prepend(post);
            setPublished((n) => n + 1);
          }}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-full bg-slate-200/70 p-1">
            {[
              ["all", "Para ti"],
              ["following", "A seguir"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setScope(id)}
                className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", scope === id ? "bg-white text-ink shadow-sm" : "text-slate-600 hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-auto rounded-full py-2" aria-label="Filtrar por tipo">
            <option value="">Todos os tipos</option>
            {POST_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {feed.loading ? (
          <PageLoader />
        ) : feed.error && !feed.posts.length ? (
          <EmptyState icon={Newspaper} title="Não foi possível carregar o feed" action={<button onClick={feed.reload} className="btn btn-primary">Tentar novamente</button>}>
            {feed.error.message}
          </EmptyState>
        ) : feed.posts.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={scope === "following" ? "Ainda não segues ninguém com publicações" : "Ainda não há publicações aqui"}
            action={<Link to="/explorar" className="btn btn-primary">Descobrir pessoas</Link>}
          >
            {scope === "following" ? "Segue membros da comunidade para veres aqui o que partilham." : "Sê a primeira pessoa a partilhar algo!"}
          </EmptyState>
        ) : (
          <>
            {feed.posts.map((p) => (
              <PostCard key={p.id} post={p} onDeleted={feed.remove} />
            ))}
            {feed.hasMore && (
              <button onClick={feed.loadMore} disabled={feed.loadingMore} className="btn btn-secondary w-full">
                {feed.loadingMore && <Spinner className="size-4" />} Ver mais publicações
              </button>
            )}
          </>
        )}
      </section>

      <aside className="hidden lg:block">
        <div className="sticky top-22 space-y-4">
          <SuggestionsCard />
          <div className="card p-4">
            <h3 className="text-sm font-bold">Partilha com propósito</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li>💡 Dicas que gostavas de ter recebido</li>
              <li>🎓 Bolsas, estágios e oportunidades</li>
              <li>🛠️ O teu serviço ou negócio</li>
              <li>🤝 Pedidos de ajuda e mentoria</li>
            </ul>
            <Link to="/comunidade" className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
              <BookOpen className="size-4" /> Regras da comunidade
            </Link>
          </div>
          <p className="px-2 text-xs text-slate-400">© {new Date().getFullYear()} Txerumaleta · Feito com morabeza</p>
        </div>
      </aside>
    </div>
  );
}
