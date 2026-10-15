import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Users, X } from "lucide-react";
import { api } from "../api";
import { MemberCard } from "../components/people";
import { EmptyState, PageLoader } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { COUNTRIES, ISLANDS, OPEN_TO, ROLES } from "../lib/constants";

const FILTERS = ["q", "role", "island", "country", "openTo"];

// recria a página quando a pesquisa muda a partir da barra de topo
export default function ExplorePage() {
  const [params] = useSearchParams();
  return <Explore key={params.get("q") ?? ""} />;
}

function Explore() {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(FILTERS.map((k) => [k, params.get(k) ?? ""]));
  const [text, setText] = useState(filters.q);
  const { data, loading } = useApi(() => api.profiles.search(filters), [filters]);

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const active = FILTERS.some((k) => filters[k]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Comunidade</h1>
        <p className="text-sm text-slate-600">Encontra estudantes, empreendedores, profissionais e emigrantes cabo-verdianos.</p>
      </div>

      <div className="card space-y-3 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("q", text.trim());
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nome, competência, cidade… (ex.: design, Lisboa, contabilidade)"
            className="input pl-10"
          />
        </form>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="input" value={filters.role} onChange={(e) => setFilter("role", e.target.value)} aria-label="Tipo de membro">
            <option value="">Todos os perfis</option>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <select className="input" value={filters.island} onChange={(e) => setFilter("island", e.target.value)} aria-label="Ilha de origem">
            <option value="">Todas as ilhas</option>
            {ISLANDS.map((i) => <option key={i}>{i}</option>)}
            <option value="Diáspora">Nascidos na diáspora</option>
          </select>
          <select className="input" value={filters.country} onChange={(e) => setFilter("country", e.target.value)} aria-label="País">
            <option value="">Todos os países</option>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input" value={filters.openTo} onChange={(e) => setFilter("openTo", e.target.value)} aria-label="Disponível para">
            <option value="">Disponível para…</option>
            {OPEN_TO.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        {active && (
          <button
            onClick={() => {
              setText("");
              setParams({}, { replace: true });
            }}
            className="btn btn-ghost btn-sm"
          >
            <X className="size-3.5" /> Limpar filtros
          </button>
        )}
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={Users} title="Ninguém encontrado">
          Experimenta outros filtros ou convida pessoas para a Txerumaleta!
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-slate-500">{data.length} {data.length === 1 ? "membro" : "membros"}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((p) => (
              <MemberCard key={p.id} profile={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
