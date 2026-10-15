import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, LogOut } from "lucide-react";
import { DEMO_MODE, api } from "../api";
import {
  BasicFields,
  ExperienceFields,
  InterestFields,
  OriginFields,
  PhotoFields,
  SocialFields,
} from "../components/profileFields";
import { cleanProfile } from "../lib/profile";
import { Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { USERNAME_RE, cn } from "../lib/utils";

const TABS = [
  ["perfil", "Perfil"],
  ["percurso", "Percurso"],
  ["redes", "Redes sociais"],
  ["conta", "Conta"],
];

function Card({ title, subtitle, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { profile, user, updateProfile, signOut } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("perfil");
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const patch = (p) => setForm((f) => ({ ...f, ...p }));
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);

  const save = async (e) => {
    e?.preventDefault();
    if (!form.full_name?.trim()) return toast.error("O nome não pode ficar vazio.");
    if (!USERNAME_RE.test(form.username)) return toast.error("Nome de utilizador inválido (3 a 30 caracteres: a-z, 0-9, . ou _).");
    setSaving(true);
    try {
      if (form.username !== profile.username && !(await api.profiles.isUsernameAvailable(form.username))) {
        throw new Error("Esse nome de utilizador já está ocupado.");
      }
      const saved = await updateProfile(cleanProfile(form));
      setForm(saved);
      toast.success("Perfil atualizado!");
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Definições</h1>
          <p className="text-sm text-slate-600">Um perfil completo recebe muito mais contactos e oportunidades.</p>
        </div>
        <Link to={`/u/${profile.username}`} className="btn btn-ghost btn-sm">
          Ver o meu perfil <ExternalLink className="size-3.5" />
        </Link>
      </div>

      <nav className="scrollbar-thin flex gap-1 overflow-x-auto rounded-full bg-slate-200/70 p-1">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn("shrink-0 flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition", tab === id ? "bg-white text-ink shadow-sm" : "text-slate-600 hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab !== "conta" ? (
        <form onSubmit={save} className="space-y-5">
          {tab === "perfil" && (
            <>
              <Card title="Fotos">
                <PhotoFields value={form} onChange={patch} />
              </Card>
              <Card title="Informação básica">
                <BasicFields value={form} onChange={patch} />
              </Card>
              <Card title="Origem e localização">
                <OriginFields value={form} onChange={patch} />
              </Card>
              <Card title="Competências e objetivos">
                <InterestFields value={form} onChange={patch} />
              </Card>
            </>
          )}
          {tab === "percurso" && (
            <Card title="Percurso" subtitle="Experiência profissional, projetos e formação.">
              <ExperienceFields value={form} onChange={patch} />
            </Card>
          )}
          {tab === "redes" && (
            <Card title="Redes sociais e contactos" subtitle="Aparecem no teu perfil para que te possam encontrar noutras plataformas.">
              <SocialFields value={form} onChange={patch} />
            </Card>
          )}

          <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:bottom-4">
            {dirty && <span className="mr-auto pl-2 text-sm text-slate-500">Tens alterações por guardar</span>}
            <button type="button" disabled={!dirty || saving} onClick={() => setForm(profile)} className="btn btn-ghost">
              Descartar
            </button>
            <button disabled={!dirty || saving} className="btn btn-primary">
              {saving && <Spinner className="size-4 text-white" />} Guardar alterações
            </button>
          </div>
        </form>
      ) : (
        <AccountTab email={user.email} signOut={signOut} />
      )}
    </div>
  );
}

function AccountTab({ email, signOut }) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.auth.updatePassword(password);
      setPassword("");
      toast.success("Palavra-passe alterada.");
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card title="Email da conta">
        <p className="text-sm text-slate-700">{email}</p>
      </Card>
      <Card title="Alterar palavra-passe">
        <form onSubmit={change} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            className="input"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova palavra-passe (mín. 6 caracteres)"
            autoComplete="new-password"
          />
          <button disabled={busy} className="btn btn-primary shrink-0">Alterar</button>
        </form>
      </Card>
      {DEMO_MODE && (
        <Card title="Dados de demonstração" subtitle="Apaga tudo o que criaste neste navegador e volta aos dados de exemplo.">
          <button onClick={() => window.confirm("Apagar todos os dados de demonstração?") && api.demo.reset()} className="btn btn-secondary">
            Recomeçar demonstração
          </button>
        </Card>
      )}
      <Card title="Sessão">
        <button onClick={signOut} className="btn btn-secondary">
          <LogOut className="size-4" /> Terminar sessão
        </button>
      </Card>
    </div>
  );
}
