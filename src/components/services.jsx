import { useState } from "react";
import { Laptop, MapPin, Phone, Tag, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { SERVICE_CATEGORIES } from "../lib/constants";
import { socialUrl, timeAgo } from "../lib/utils";
import { Avatar, Modal, ProfileLink, Spinner } from "./ui";
import { MessageButton } from "./people";

export function ServiceCard({ service, onDeleted }) {
  const { user } = useAuth();
  const toast = useToast();
  const isMine = user?.id === service.owner_id;
  const whatsapp = socialUrl("whatsapp", service.owner?.socials?.whatsapp);

  const remove = async () => {
    if (!window.confirm("Remover este serviço?")) return;
    try {
      await api.services.remove(service.id);
      onDeleted?.(service.id);
      toast.success("Serviço removido.");
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="chip bg-orange-50 text-orange-700">{service.category}</span>
        {isMine && (
          <button onClick={remove} className="btn btn-ghost -mt-1 -mr-2 p-1.5 text-slate-400 hover:text-coral-600" aria-label="Remover serviço">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <h3 className="mt-3 text-lg leading-snug font-bold">{service.title}</h3>
      {service.description && <p className="mt-1.5 line-clamp-4 text-sm text-slate-600">{service.description}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        {service.price && (
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <Tag className="size-4 text-brand-700" /> {service.price}
          </span>
        )}
        {service.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-slate-400" /> {service.location}
          </span>
        )}
        {service.remote && (
          <span className="flex items-center gap-1.5">
            <Laptop className="size-4 text-slate-400" /> Remoto
          </span>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <ProfileLink profile={service.owner} className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar profile={service.owner} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{service.owner?.full_name}</span>
              <span className="block text-xs text-slate-500">{timeAgo(service.created_at)}</span>
            </span>
          </ProfileLink>
          {!isMine && (
            <div className="flex gap-1.5">
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" aria-label="WhatsApp">
                  <Phone className="size-4 text-emerald-600" />
                </a>
              )}
              <MessageButton profileId={service.owner_id} size="sm" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

const EMPTY = { title: "", description: "", category: SERVICE_CATEGORIES[0], price: "", location: "", remote: false };

export function ServiceFormModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3) return toast.error("Dá um título ao serviço (mín. 3 caracteres).");
    setBusy(true);
    try {
      const s = await api.services.create({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price.trim(),
        location: form.location.trim(),
      });
      onCreated?.(s);
      setForm(EMPTY);
      onClose();
      toast.success("Serviço publicado!");
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Publicar um serviço" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="s-title">Título *</label>
          <input id="s-title" className="input" maxLength={100} value={form.title} onChange={set("title")} placeholder="Ex.: Explicações de Matemática para o 12.º ano" required />
        </div>
        <div>
          <label className="label" htmlFor="s-cat">Categoria</label>
          <select id="s-cat" className="input" value={form.category} onChange={set("category")}>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="s-desc">Descrição</label>
          <textarea id="s-desc" className="input min-h-28" maxLength={2000} value={form.description} onChange={set("description")} placeholder="O que inclui, experiência, prazos…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-price">Preço</label>
            <input id="s-price" className="input" maxLength={60} value={form.price} onChange={set("price")} placeholder="Ex.: desde 2 000 CVE / 25 €" />
          </div>
          <div>
            <label className="label" htmlFor="s-loc">Local</label>
            <input id="s-loc" className="input" maxLength={80} value={form.location} onChange={set("location")} placeholder="Ex.: Praia, Santiago" />
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" checked={form.remote} onChange={set("remote")} className="size-4 accent-brand-700" />
          Também faço este serviço à distância (online)
        </label>
        <p className="hint">Dica: adiciona o teu WhatsApp nas definições do perfil para que te possam contactar diretamente.</p>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
          <button disabled={busy} className="btn btn-primary">
            {busy && <Spinner className="size-4 text-white" />} Publicar serviço
          </button>
        </div>
      </form>
    </Modal>
  );
}
