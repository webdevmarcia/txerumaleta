// Campos do formulário de perfil, partilhados entre "Bem-vindo" e "Definições".
import { useRef, useState } from "react";
import { Camera, GraduationCap, Plus, Briefcase, Trash2 } from "lucide-react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { COUNTRIES, ISLANDS, OPEN_TO, ROLES, SOCIALS } from "../lib/constants";
import { normalizeUsername } from "../lib/utils";
import { Avatar, ChipSelect, Spinner, TagInput } from "./ui";

const SKILL_SUGGESTIONS = ["Marketing digital", "Programação", "Design gráfico", "Gestão", "Vendas", "Fotografia", "Contabilidade", "Inglês", "Francês", "Ensino", "Saúde", "Culinária"];
const INTEREST_SUGGESTIONS = ["Empreendedorismo", "Tecnologia", "Educação", "Diáspora", "Música", "Desporto", "Turismo", "Finanças", "Arte", "Moda", "Ambiente", "Voluntariado"];

function useUpload(kind, onDone) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onDone(await api.profiles.uploadImage(file, kind));
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };
  const input = <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />;
  return { busy, open: () => ref.current?.click(), input };
}

// ---------------------------------------------------------------------
export function PhotoFields({ value, onChange, withCover = true }) {
  const avatar = useUpload("avatar", (url) => onChange({ avatar_url: url }));
  const cover = useUpload("cover", (url) => onChange({ cover_url: url }));

  return (
    <div>
      {withCover && (
        <div
          className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 bg-cover bg-center"
          style={value.cover_url ? { backgroundImage: `url(${value.cover_url})` } : undefined}
        >
          {cover.input}
          <button type="button" onClick={cover.open} className="absolute right-3 bottom-3 btn btn-sm bg-white/90 text-ink hover:bg-white">
            {cover.busy ? <Spinner className="size-4" /> : <Camera className="size-4" />} Capa
          </button>
        </div>
      )}
      <div className={withCover ? "-mt-10 ml-4 flex items-end gap-4" : "flex items-center gap-4"}>
        <div className="relative">
          <Avatar profile={value} size="xl" ring />
          {avatar.input}
          <button
            type="button"
            onClick={avatar.open}
            className="absolute right-1 bottom-1 flex size-9 items-center justify-center rounded-full bg-brand-700 text-white shadow ring-2 ring-white hover:bg-brand-800"
            aria-label="Mudar foto de perfil"
          >
            {avatar.busy ? <Spinner className="size-4 text-white" /> : <Camera className="size-4" />}
          </button>
        </div>
        <div className="pb-2 text-sm">
          <p className="font-medium text-ink">Foto de perfil</p>
          <p className="text-xs text-slate-500">Uma foto real ajuda a criar confiança.</p>
          {value.avatar_url && (
            <button type="button" onClick={() => onChange({ avatar_url: null })} className="mt-1 text-xs font-medium text-coral-600 hover:underline">
              Remover foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function BasicFields({ value, onChange, withUsername = true }) {
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pf-name">Nome completo</label>
          <input id="pf-name" className="input" maxLength={80} value={value.full_name ?? ""} onChange={set("full_name")} required />
        </div>
        {withUsername && (
          <div>
            <label className="label" htmlFor="pf-user">Nome de utilizador</label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-slate-400">@</span>
              <input id="pf-user" className="input pl-8" value={value.username ?? ""} onChange={(e) => onChange({ username: normalizeUsername(e.target.value) })} required />
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="label" htmlFor="pf-headline">Título profissional</label>
        <input
          id="pf-headline"
          className="input"
          maxLength={120}
          value={value.headline ?? ""}
          onChange={set("headline")}
          placeholder="Ex.: Estudante de Medicina no Porto · Fundadora da Loja Sabura"
        />
        <p className="hint">Aparece por baixo do teu nome em todo o lado. Sê claro(a) sobre o que fazes.</p>
      </div>
      <div>
        <label className="label" htmlFor="pf-bio">Sobre mim</label>
        <textarea
          id="pf-bio"
          className="input min-h-28"
          maxLength={1500}
          value={value.bio ?? ""}
          onChange={set("bio")}
          placeholder="Conta um pouco da tua história, o que fazes e o que procuras na comunidade."
        />
        <p className="hint text-right">{(value.bio ?? "").length}/1500</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function OriginFields({ value, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="label">Quem és tu na comunidade? <span className="font-normal text-slate-400">(escolhe um ou mais)</span></p>
        <ChipSelect options={ROLES} value={value.roles} onChange={(roles) => onChange({ roles })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="pf-island">Ilha de origem</label>
          <select id="pf-island" className="input" value={value.island ?? ""} onChange={(e) => onChange({ island: e.target.value || null })}>
            <option value="">—</option>
            {ISLANDS.map((i) => <option key={i}>{i}</option>)}
            <option value="Diáspora">Nasci na diáspora</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pf-country">País onde vives</label>
          <select id="pf-country" className="input" value={value.country ?? ""} onChange={(e) => onChange({ country: e.target.value })}>
            <option value="">—</option>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pf-city">Cidade</label>
          <input id="pf-city" className="input" maxLength={60} value={value.city ?? ""} onChange={(e) => onChange({ city: e.target.value })} placeholder="Ex.: Mindelo" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function InterestFields({ value, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="label">Competências</p>
        <TagInput value={value.skills} onChange={(skills) => onChange({ skills })} placeholder="Escreve e carrega Enter…" suggestions={SKILL_SUGGESTIONS} />
      </div>
      <div>
        <p className="label">Interesses</p>
        <TagInput value={value.interests} onChange={(interests) => onChange({ interests })} placeholder="Escreve e carrega Enter…" suggestions={INTEREST_SUGGESTIONS} />
      </div>
      <div>
        <p className="label">Estou disponível para…</p>
        <ChipSelect options={OPEN_TO} value={value.open_to} onChange={(open_to) => onChange({ open_to })} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function SocialFields({ value, onChange }) {
  const socials = value.socials ?? {};
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SOCIALS.map((s) => (
        <div key={s.id}>
          <label className="label flex items-center gap-2" htmlFor={`pf-${s.id}`}>
            <span className="size-2 rounded-full" style={{ background: s.color }} /> {s.label}
          </label>
          <input
            id={`pf-${s.id}`}
            className="input"
            maxLength={200}
            value={socials[s.id] ?? ""}
            placeholder={s.placeholder}
            onChange={(e) => onChange({ socials: { ...socials, [s.id]: e.target.value } })}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
export function ExperienceFields({ value, onChange }) {
  const items = value.experience ?? [];
  const update = (i, patch) => onChange({ experience: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const add = (type) => onChange({ experience: [...items, { type, title: "", org: "", period: "", description: "" }] });
  const remove = (i) => onChange({ experience: items.filter((_, j) => j !== i) });

  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="text-sm text-slate-500">Adiciona experiências profissionais, projetos ou formação.</p>}
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="chip">
              {it.type === "formacao" ? <GraduationCap className="size-3.5" /> : <Briefcase className="size-3.5" />}
              {it.type === "formacao" ? "Formação" : "Experiência"}
            </span>
            <button type="button" onClick={() => remove(i)} className="btn btn-ghost p-1.5 text-slate-400 hover:text-coral-600" aria-label="Remover">
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" maxLength={100} value={it.title} onChange={(e) => update(i, { title: e.target.value })} placeholder={it.type === "formacao" ? "Curso" : "Cargo / projeto"} />
            <input className="input" maxLength={100} value={it.org} onChange={(e) => update(i, { org: e.target.value })} placeholder={it.type === "formacao" ? "Escola / universidade" : "Empresa / organização"} />
            <input className="input" maxLength={40} value={it.period} onChange={(e) => update(i, { period: e.target.value })} placeholder="Ex.: 2021 — atual" />
            <input className="input" maxLength={300} value={it.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Descrição curta (opcional)" />
          </div>
        </div>
      ))}
      {items.length < 15 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => add("trabalho")} className="btn btn-secondary btn-sm"><Plus className="size-4" /> Experiência</button>
          <button type="button" onClick={() => add("formacao")} className="btn btn-secondary btn-sm"><Plus className="size-4" /> Formação</button>
        </div>
      )}
    </div>
  );
}
