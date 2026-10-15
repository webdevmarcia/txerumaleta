import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { DEMO_MODE, api } from "../api";
import { DemoBanner } from "../components/layout";
import { Logo, Spinner } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { USERNAME_RE, normalizeUsername } from "../lib/utils";

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DemoBanner />
      <div className="flag-stripe h-1.5" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-8">
          <Logo />
        </Link>
        <div className="card w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        className="input pr-10"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={6}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        aria-label={show ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
export function Login() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.auth.signIn({ email, password });
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (err) {
      toast.error(err);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Bem-vindo(a) de volta"
      subtitle="Entra para continuares ligado(a) à comunidade."
      footer={<>Ainda não tens conta? <Link to="/registar" className="font-semibold text-brand-700 hover:underline">Cria uma aqui</Link></>}
    >
      {DEMO_MODE && (
        <div className="mb-5 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
          <strong>Demo:</strong> cria uma conta nova ou entra com <code>nadia@demo.cv</code> / <code>demo1234</code>.
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Palavra-passe</label>
            <Link to="/recuperar" className="mb-1.5 text-xs font-medium text-brand-700 hover:underline">Esqueceste-te?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy && <Spinner className="size-4 text-white" />} Entrar
        </button>
      </form>
    </AuthShell>
  );
}

// ---------------------------------------------------------------------
export function Register() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const setName = (e) => {
    const full_name = e.target.value;
    setForm((f) => ({ ...f, full_name, username: usernameTouched ? f.username : normalizeUsername(full_name.replace(/\s+/g, ".")) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!USERNAME_RE.test(form.username)) {
      return toast.error("O nome de utilizador deve ter 3 a 30 caracteres: letras minúsculas, números, ponto ou _.");
    }
    if (!accepted) return toast.error("Tens de aceitar as regras da comunidade.");
    setBusy(true);
    try {
      if (!(await api.profiles.isUsernameAvailable(form.username))) {
        throw new Error("Esse nome de utilizador já está ocupado. Experimenta outro.");
      }
      const { needsConfirmation } = await api.auth.signUp({ ...form, full_name: form.full_name.trim() });
      if (needsConfirmation) setSentTo(form.email);
      else navigate("/bem-vindo", { replace: true });
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Confirma o teu email" footer={<Link to="/entrar" className="font-semibold text-brand-700 hover:underline">Voltar para entrar</Link>}>
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <MailCheck className="size-7" />
          </span>
          <p className="mt-4 text-sm text-slate-600">
            Enviámos um link de confirmação para <strong className="text-ink">{sentTo}</strong>. Abre-o para ativares a conta e depois entra.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Cria a tua conta"
      subtitle="Junta-te a estudantes, empreendedores e emigrantes cabo-verdianos."
      footer={<>Já tens conta? <Link to="/entrar" className="font-semibold text-brand-700 hover:underline">Entra aqui</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Nome completo</label>
          <input id="name" className="input" value={form.full_name} onChange={setName} maxLength={80} autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="username">Nome de utilizador</label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-slate-400">@</span>
            <input
              id="username"
              className="input pl-8"
              value={form.username}
              onChange={(e) => {
                setUsernameTouched(true);
                setForm((f) => ({ ...f, username: normalizeUsername(e.target.value) }));
              }}
              required
            />
          </div>
          <p className="hint">O teu perfil ficará em txerumaleta/u/{form.username || "o.teu.nome"}</p>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Palavra-passe</label>
          <PasswordInput id="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
        </div>
        <label className="flex items-start gap-2.5 text-sm text-slate-600">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 accent-brand-700" />
          <span>
            Li e aceito as{" "}
            <Link to="/comunidade" target="_blank" className="font-semibold text-brand-700 hover:underline">regras da comunidade</Link>.
          </span>
        </label>
        <button disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy && <Spinner className="size-4 text-white" />} Criar conta
        </button>
      </form>
    </AuthShell>
  );
}

// ---------------------------------------------------------------------
export function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.auth.resetPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar palavra-passe"
      subtitle={sent ? undefined : "Indica o teu email e enviamos-te um link para criares uma nova."}
      footer={<Link to="/entrar" className="font-semibold text-brand-700 hover:underline">Voltar para entrar</Link>}
    >
      {sent ? (
        <p className="text-sm text-slate-600">
          {DEMO_MODE
            ? "No modo demonstração não são enviados emails. Na versão real, receberias um link em poucos minutos."
            : <>Se existir uma conta com <strong>{email}</strong>, vais receber um email com o link nos próximos minutos.</>}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button disabled={busy} className="btn btn-primary btn-lg w-full">Enviar link</button>
        </form>
      )}
    </AuthShell>
  );
}

// ---------------------------------------------------------------------
export function NewPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.auth.updatePassword(password);
      toast.success("Palavra-passe atualizada!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err);
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Nova palavra-passe" subtitle="Escolhe uma palavra-passe nova para a tua conta.">
      <form onSubmit={submit} className="space-y-4">
        <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
        <button disabled={busy} className="btn btn-primary btn-lg w-full">Guardar</button>
      </form>
    </AuthShell>
  );
}
