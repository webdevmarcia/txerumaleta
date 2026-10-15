import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Briefcase, CalendarDays, Ellipsis, Flag, GraduationCap, Link as LinkIcon, MapPin, Newspaper, Pencil, Sparkles, UserX } from "lucide-react";
import { api } from "../api";
import { FollowButton, FollowListModal, MessageButton, ReportModal, SocialLinks } from "../components/people";
import { PostCard, PostComposer } from "../components/posts";
import { ServiceCard, ServiceFormModal } from "../components/services";
import { Avatar, Dropdown, EmptyState, PageLoader, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useApi } from "../hooks/useApi";
import { usePostFeed } from "../hooks/usePostFeed";
import { OPEN_TO, ROLES, findLabel } from "../lib/constants";
import { cn, location, memberSince } from "../lib/utils";

export default function Profile() {
  const { username } = useParams();
  const { data: profile, loading } = useApi(() => api.profiles.getByUsername(username), [username]);

  if (loading) return <PageLoader />;
  if (!profile) {
    return (
      <EmptyState icon={UserX} title="Perfil não encontrado" action={<Link to="/explorar" className="btn btn-primary">Ver comunidade</Link>}>
        O utilizador @{username} não existe ou mudou de nome.
      </EmptyState>
    );
  }
  return <ProfileView key={profile.id} profile={profile} />;
}

function ProfileView({ profile }) {
  const { user } = useAuth();
  const toast = useToast();
  const isMe = user?.id === profile.id;
  const [tab, setTab] = useState("posts");
  const [listType, setListType] = useState(null);
  const [reporting, setReporting] = useState(false);
  const { data: stats, setData: setStats } = useApi(() => api.profiles.stats(profile.id), [profile.id]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
    toast.success("Link do perfil copiado!");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="card overflow-hidden">
        <div
          className="h-36 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-500 bg-cover bg-center sm:h-52"
          style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})` } : undefined}
        />
        <div className="px-5 pb-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Avatar profile={profile} size="xl" ring className="-mt-14 sm:-mt-16" />
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {isMe ? (
                <Link to="/definicoes" className="btn btn-secondary">
                  <Pencil className="size-4" /> Editar perfil
                </Link>
              ) : (
                <>
                  <FollowButton profileId={profile.id} onChange={(f) => setStats((s) => s && { ...s, followers: s.followers + (f ? 1 : -1) })} />
                  <MessageButton profileId={profile.id} />
                </>
              )}
              <Dropdown
                trigger={({ toggle }) => (
                  <button onClick={toggle} className="btn btn-secondary p-2" aria-label="Mais opções">
                    <Ellipsis className="size-5" />
                  </button>
                )}
              >
                <button onClick={copyLink} className="menu-item"><LinkIcon className="size-4" /> Copiar link do perfil</button>
                {!isMe && (
                  <button onClick={() => setReporting(true)} className="menu-item"><Flag className="size-4" /> Denunciar perfil</button>
                )}
              </Dropdown>
            </div>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold">{profile.full_name || profile.username}</h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.headline && <p className="mt-2 text-[15px] text-slate-800">{profile.headline}</p>}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {location(profile) && (
              <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {location(profile)}</span>
            )}
            {profile.island && (
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4" /> {profile.island === "Diáspora" ? "Nascido(a) na diáspora" : `Raízes em ${profile.island}`}
              </span>
            )}
            <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> Membro desde {memberSince(profile.created_at)}</span>
          </div>

          {(profile.roles?.length > 0 || profile.open_to?.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.roles?.map((r) => (
                <span key={r} className="chip bg-brand-50 text-brand-700">{findLabel(ROLES, r)}</span>
              ))}
              {profile.open_to?.map((o) => (
                <span key={o} className="chip bg-emerald-50 text-emerald-700">✓ {findLabel(OPEN_TO, o)}</span>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-5 text-sm">
            <span><strong className="text-ink">{stats?.posts ?? "–"}</strong> <span className="text-slate-500">publicações</span></span>
            <button onClick={() => setListType("followers")} className="hover:underline">
              <strong className="text-ink">{stats?.followers ?? "–"}</strong> <span className="text-slate-500">seguidores</span>
            </button>
            <button onClick={() => setListType("following")} className="hover:underline">
              <strong className="text-ink">{stats?.following ?? "–"}</strong> <span className="text-slate-500">a seguir</span>
            </button>
          </div>
        </div>

        <nav className="flex border-t border-slate-100 px-2 sm:px-6">
          {[
            ["posts", "Publicações"],
            ["about", "Sobre"],
            ["services", "Serviços"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition",
                tab === id ? "border-brand-700 text-brand-700" : "border-transparent text-slate-500 hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </section>

      {tab === "posts" && <ProfilePosts profile={profile} isMe={isMe} />}
      {tab === "about" && <ProfileAbout profile={profile} isMe={isMe} />}
      {tab === "services" && <ProfileServices profile={profile} isMe={isMe} />}

      {listType && <FollowListModal profileId={profile.id} type={listType} onClose={() => setListType(null)} />}
      {reporting && <ReportModal target={{ type: "profile", id: profile.id }} onClose={() => setReporting(false)} />}
    </div>
  );
}

function ProfilePosts({ profile, isMe }) {
  const params = useMemo(() => ({ authorId: profile.id }), [profile.id]);
  const feed = usePostFeed(params);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {isMe && <PostComposer onCreated={feed.prepend} />}
      {feed.loading ? (
        <PageLoader />
      ) : feed.posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="Sem publicações ainda">
          {isMe ? "Partilha a tua primeira experiência, dica ou conhecimento." : `${profile.full_name?.split(" ")[0]} ainda não publicou nada.`}
        </EmptyState>
      ) : (
        <>
          {feed.posts.map((p) => <PostCard key={p.id} post={p} onDeleted={feed.remove} />)}
          {feed.hasMore && (
            <button onClick={feed.loadMore} disabled={feed.loadingMore} className="btn btn-secondary w-full">
              {feed.loadingMore && <Spinner className="size-4" />} Ver mais
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ProfileAbout({ profile, isMe }) {
  const empty = !profile.bio && !profile.skills?.length && !profile.interests?.length && !profile.experience?.length;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <Section title="Sobre">
          {profile.bio ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-slate-700">{profile.bio}</p>
          ) : (
            <p className="text-sm text-slate-500">
              {isMe ? <>Ainda não escreveste nada sobre ti. <Link to="/definicoes" className="font-semibold text-brand-700 hover:underline">Adicionar</Link></> : "Sem descrição."}
            </p>
          )}
        </Section>

        {profile.experience?.length > 0 && (
          <Section title="Percurso">
            <ol className="space-y-4">
              {profile.experience.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    {e.type === "formacao" ? <GraduationCap className="size-5" /> : <Briefcase className="size-5" />}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{e.title}</p>
                    <p className="text-sm text-slate-600">{e.org}</p>
                    {e.period && <p className="text-xs text-slate-500">{e.period}</p>}
                    {e.description && <p className="mt-1 text-sm text-slate-600">{e.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}
        {empty && isMe && (
          <Link to="/definicoes" className="btn btn-outline w-full">Completar o meu perfil</Link>
        )}
      </div>

      <div className="space-y-4">
        {profile.skills?.length > 0 && (
          <Section title="Competências">
            <div className="flex flex-wrap gap-1.5">{profile.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          </Section>
        )}
        {profile.interests?.length > 0 && (
          <Section title="Interesses">
            <div className="flex flex-wrap gap-1.5">{profile.interests.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          </Section>
        )}
        <Section title="Redes sociais e contactos">
          <SocialLinks socials={profile.socials} />
        </Section>
      </div>
    </div>
  );
}

function ProfileServices({ profile, isMe }) {
  const [creating, setCreating] = useState(false);
  const { data, loading, setData } = useApi(() => api.services.list({ ownerId: profile.id }), [profile.id]);
  if (loading && !data) return <PageLoader />;
  return (
    <div className="space-y-4">
      {isMe && (
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn btn-primary">Publicar serviço</button>
        </div>
      )}
      {!data?.length ? (
        <EmptyState icon={Briefcase} title="Sem serviços publicados">
          {isMe ? "Divulga o que fazes para que a comunidade te possa contratar." : "Este membro ainda não divulgou serviços."}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((s) => (
            <ServiceCard key={s.id} service={s} onDeleted={(id) => setData((l) => l.filter((x) => x.id !== id))} />
          ))}
        </div>
      )}
      <ServiceFormModal open={creating} onClose={() => setCreating(false)} onCreated={(s) => setData((l) => [s, ...(l ?? [])])} />
    </div>
  );
}
