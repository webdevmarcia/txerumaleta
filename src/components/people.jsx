// Componentes ligados a pessoas: seguir, listas, redes sociais, denúncias.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Globe, MapPin, MessageCircle, Phone, UserCheck, UserPlus } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useApi } from "../hooks/useApi";
import { REPORT_REASONS, ROLES, SOCIALS, findLabel } from "../lib/constants";
import { cn, location, socialUrl } from "../lib/utils";
import { Avatar, Modal, Spinner } from "./ui";

// ---------------------------------------------------------------------
export function FollowButton({ profileId, initial, onChange, size = "md", className = "" }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: fetched } = useApi(
    () => (initial === undefined ? api.profiles.isFollowing(profileId) : Promise.resolve(initial)),
    [profileId]
  );
  const [override, setOverride] = useState(null);
  const [busy, setBusy] = useState(false);
  const following = override ?? fetched ?? false;

  if (!user || user.id === profileId) return null;

  const toggle = async () => {
    const next = !following;
    setOverride(next);
    setBusy(true);
    try {
      await (next ? api.profiles.follow(profileId) : api.profiles.unfollow(profileId));
      onChange?.(next);
    } catch (e) {
      setOverride(!next);
      toast.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy || fetched === undefined}
      className={cn("btn", size === "sm" && "btn-sm", following ? "btn-secondary" : "btn-primary", className)}
    >
      {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {following ? "A seguir" : "Seguir"}
    </button>
  );
}

// ---------------------------------------------------------------------
export function MessageButton({ profileId, className = "", size = "md" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!user || user.id === profileId) return null;

  const open = async () => {
    setBusy(true);
    try {
      const id = await api.messages.openWith(profileId);
      navigate(`/mensagens/${id}`);
    } catch (e) {
      toast.error(e);
      setBusy(false);
    }
  };

  return (
    <button onClick={open} disabled={busy} className={cn("btn btn-secondary", size === "sm" && "btn-sm", className)}>
      <MessageCircle className="size-4" />
      Mensagem
    </button>
  );
}

// ---------------------------------------------------------------------
export function UserRow({ profile, showFollow = true, onNavigate }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Link to={`/u/${profile.username}`} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar profile={profile} size="md" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink hover:underline">{profile.full_name || profile.username}</span>
          <span className="block truncate text-xs text-slate-500">{profile.headline || `@${profile.username}`}</span>
        </span>
      </Link>
      {showFollow && <FollowButton profileId={profile.id} size="sm" />}
    </div>
  );
}

// ---------------------------------------------------------------------
export function MemberCard({ profile }) {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div
        className="h-16 bg-gradient-to-r from-brand-700 to-brand-500 bg-cover bg-center"
        style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})` } : undefined}
      />
      <div className="-mt-8 flex flex-1 flex-col items-center px-4 pb-4 text-center">
        <Link to={`/u/${profile.username}`}>
          <Avatar profile={profile} size="lg" ring />
        </Link>
        <Link to={`/u/${profile.username}`} className="mt-2 font-semibold text-ink hover:underline">
          {profile.full_name || profile.username}
        </Link>
        <p className="mt-0.5 line-clamp-2 min-h-8 text-xs text-slate-500">{profile.headline}</p>
        {location(profile) && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3" /> {location(profile)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {profile.roles?.slice(0, 2).map((r) => (
            <span key={r} className="chip">
              {findLabel(ROLES, r)}
            </span>
          ))}
        </div>
        <div className="mt-auto flex w-full gap-2 pt-4">
          <FollowButton profileId={profile.id} size="sm" className="flex-1" />
          <MessageButton profileId={profile.id} size="sm" className="flex-1" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function SocialLinks({ socials = {} }) {
  const items = SOCIALS.filter((s) => socials[s.id]);
  if (!items.length) return <p className="text-sm text-slate-500">Sem redes sociais adicionadas.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => {
        const Icon = s.id === "website" ? Globe : s.id === "whatsapp" ? Phone : ExternalLink;
        return (
          <a
            key={s.id}
            href={socialUrl(s.id, socials[s.id])}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="size-2 rounded-full" style={{ background: s.color }} />
            {s.label}
            <Icon className="size-3.5 text-slate-400" />
          </a>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
export function SuggestionsCard() {
  const { data } = useApi(() => api.profiles.suggestions(4), []);
  if (!data?.length) return null;
  return (
    <div className="card p-4">
      <h3 className="mb-1 text-sm font-bold">Pessoas que talvez conheças</h3>
      <div className="divide-y divide-slate-100">
        {data.map((p) => (
          <UserRow key={p.id} profile={p} />
        ))}
      </div>
      <Link to="/explorar" className="mt-2 block text-center text-sm font-semibold text-brand-700 hover:underline">
        Ver toda a comunidade
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------
export function FollowListModal({ profileId, type, onClose }) {
  const { data, loading } = useApi(
    () => (type === "followers" ? api.profiles.followers(profileId) : api.profiles.following(profileId)),
    [profileId, type]
  );
  return (
    <Modal open={Boolean(type)} onClose={onClose} title={type === "followers" ? "Seguidores" : "A seguir"}>
      {loading && !data ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : data?.length ? (
        <div className="divide-y divide-slate-100">
          {data.map((p) => (
            <UserRow key={p.id} profile={p} onNavigate={onClose} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-slate-500">Ainda ninguém por aqui.</p>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------
export function ReportModal({ target, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.reports.create({ target_type: target.type, target_id: target.id, reason, details });
      toast.success("Obrigado. A nossa equipa vai analisar a denúncia.");
      onClose();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={Boolean(target)} onClose={onClose} title="Denunciar">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-600">Ajuda-nos a manter a Txerumaleta um espaço seguro. A denúncia é anónima.</p>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50">
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-brand-700" />
              {r}
            </label>
          ))}
        </div>
        <textarea
          className="input min-h-20"
          placeholder="Detalhes (opcional)"
          value={details}
          maxLength={1000}
          onChange={(e) => setDetails(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button disabled={busy} className="btn btn-danger">
            Enviar denúncia
          </button>
        </div>
      </form>
    </Modal>
  );
}
