import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Compass,
  House,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  User,
} from "lucide-react";
import { DEMO_MODE, api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useUnreadCounts } from "../hooks/useUnreadCounts";
import { cn } from "../lib/utils";
import { Avatar, Dropdown, Logo, PageLoader } from "./ui";

// ---------------------------------------------------------------------
export function RequireAuth({ allowIncomplete = false }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  if (!profile) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-sm text-slate-600">
        Não foi possível carregar o teu perfil. Se estás a usar o Supabase, confirma que executaste o ficheiro
        <code className="mx-1 rounded bg-slate-100 px-1">supabase/schema.sql</code>.
      </div>
    );
  }
  if (!profile.onboarded && !allowIncomplete) return <Navigate to="/bem-vindo" replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

// ---------------------------------------------------------------------
export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="bg-sun-400 px-4 py-1.5 text-center text-xs font-medium text-ink">
      Modo demonstração: os dados ficam guardados só neste navegador.{" "}
      <button onClick={() => window.confirm("Apagar todos os dados de demonstração e recomeçar?") && api.demo.reset()} className="font-bold underline">
        Recomeçar
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const NAV = [
  { to: "/", label: "Início", icon: House, end: true },
  { to: "/explorar", label: "Comunidade", icon: Compass },
  { to: "/servicos", label: "Serviços", icon: Briefcase },
  { to: "/mensagens", label: "Mensagens", icon: MessageCircle, badge: "messages" },
  { to: "/notificacoes", label: "Notificações", icon: Bell, badge: "notifications" },
];

function Navbar() {
  const { profile, signOut } = useAuth();
  const counts = useUnreadCounts();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const search = (e) => {
    e.preventDefault();
    navigate(`/explorar?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" aria-label="Início">
          <span className="hidden sm:inline">
            <Logo />
          </span>
          <span className="sm:hidden">
            <Logo compact />
          </span>
        </Link>

        <form onSubmit={search} className="relative hidden max-w-xs flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar pessoas, competências…"
            className="input rounded-full border-transparent bg-slate-100 py-2 pl-9 focus:bg-white"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("nav-link", isActive && "active")}>
              <span className="relative">
                <Icon className="size-5" />
                {badge && <Badge count={counts[badge]} />}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link to="/notificacoes" className="btn btn-ghost relative p-2 md:hidden" aria-label="Notificações">
            <Bell className="size-5" />
            <Badge count={counts.notifications} />
          </Link>
          <Dropdown
            trigger={({ toggle }) => (
              <button onClick={toggle} className="rounded-full focus-visible:outline-2 focus-visible:outline-brand-500" aria-label="Menu da conta">
                <Avatar profile={profile} size="sm" />
              </button>
            )}
          >
            <Link to={`/u/${profile?.username}`} className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50">
              <Avatar profile={profile} size="md" />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{profile?.full_name}</span>
                <span className="block text-xs font-medium text-brand-700">Ver o meu perfil</span>
              </span>
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <Link to="/guardados" className="menu-item"><Bookmark className="size-4" /> Guardados</Link>
            <Link to="/definicoes" className="menu-item"><Settings className="size-4" /> Definições</Link>
            <Link to="/comunidade" className="menu-item"><BookOpen className="size-4" /> Regras da comunidade</Link>
            <div className="my-1 border-t border-slate-100" />
            <button onClick={signOut} className="menu-item"><LogOut className="size-4" /> Sair</button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { profile } = useAuth();
  const counts = useUnreadCounts();
  const items = [
    NAV[0],
    NAV[1],
    NAV[2],
    NAV[3],
    { to: `/u/${profile?.username}`, label: "Perfil", icon: User },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map(({ to, label, icon: Icon, end, badge }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("nav-link flex-1 py-2", isActive && "active")}>
          <span className="relative">
            <Icon className="size-5" />
            {badge && <Badge count={counts[badge]} />}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <DemoBanner />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
