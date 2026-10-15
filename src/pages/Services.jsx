import { useState } from "react";
import { Briefcase, Plus, Search } from "lucide-react";
import { api } from "../api";
import { ServiceCard, ServiceFormModal } from "../components/services";
import { EmptyState, PageLoader } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { SERVICE_CATEGORIES } from "../lib/constants";
import { cn } from "../lib/utils";

export default function Services() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const { data, loading, setData } = useApi(() => api.services.list({ q: term, category }), [term, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Serviços da comunidade</h1>
          <p className="text-sm text-slate-600">Contrata talento cabo-verdiano e divulga o teu trabalho.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary">
          <Plus className="size-4" /> Publicar serviço
        </button>
      </div>

      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(q.trim());
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="O que procuras? (ex.: logótipo, explicações, Praia)" className="input pl-10" />
        </form>
        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {["", ...SERVICE_CATEGORIES].map((c) => (
            <button
              key={c || "all"}
              onClick={() => setCategory(c)}
              className={cn("chip-toggle shrink-0 text-xs")}
              data-active={category === c}
            >
              {c || "Todos"}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum serviço encontrado"
          action={<button onClick={() => setCreating(true)} className="btn btn-primary">Publicar o primeiro</button>}
        >
          Tens um talento ou negócio? Divulga-o aqui para toda a comunidade.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <ServiceCard key={s.id} service={s} onDeleted={(id) => setData((list) => list.filter((x) => x.id !== id))} />
          ))}
        </div>
      )}

      <ServiceFormModal open={creating} onClose={() => setCreating(false)} onCreated={(s) => setData((list) => [s, ...(list ?? [])])} />
    </div>
  );
}
