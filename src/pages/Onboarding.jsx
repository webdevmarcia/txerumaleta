import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { DemoBanner } from "../components/layout";
import { BasicFields, InterestFields, OriginFields, PhotoFields, SocialFields } from "../components/profileFields";
import { cleanProfile } from "../lib/profile";
import { Logo, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { cn } from "../lib/utils";

const STEPS = [
  { title: "Apresenta-te", subtitle: "É assim que a comunidade te vai conhecer." },
  { title: "De onde és e onde estás", subtitle: "Ajuda-nos a ligar-te às pessoas certas." },
  { title: "O que sabes e o que procuras", subtitle: "Para encontrares mentores, parceiros e oportunidades." },
  { title: "Onde mais te podem encontrar", subtitle: "Opcional — podes adicionar mais tarde." },
];

export default function Onboarding() {
  const { profile, updateProfile, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(profile);
  const [busy, setBusy] = useState(false);
  const patch = (p) => setForm((f) => ({ ...f, ...p }));

  const next = async (e) => {
    e.preventDefault();
    if (step === 0 && !form.full_name?.trim()) return toast.error("Indica o teu nome.");
    if (step === 1 && !form.roles?.length) return toast.error("Escolhe pelo menos uma opção sobre quem és.");
    if (step < STEPS.length - 1) return setStep((s) => s + 1);

    setBusy(true);
    try {
      await updateProfile({ ...cleanProfile(form), onboarded: true });
      toast.success("Perfil criado! Bem-vindo(a) à Txerumaleta!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DemoBanner />
      <div className="flag-stripe h-1.5" />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <button onClick={signOut} className="btn btn-ghost btn-sm">Sair</button>
        </div>

        <div className="mb-6 flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition", i <= step ? "bg-brand-700" : "bg-slate-200")} />
          ))}
        </div>

        <form onSubmit={next} className="card animate-fade-up p-6 sm:p-8" key={step}>
          <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">Passo {step + 1} de {STEPS.length}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{STEPS[step].title}</h1>
          <p className="mt-1 mb-6 text-sm text-slate-600">{STEPS[step].subtitle}</p>

          {step === 0 && (
            <div className="space-y-6">
              <PhotoFields value={form} onChange={patch} withCover={false} />
              <BasicFields value={form} onChange={patch} withUsername={false} />
            </div>
          )}
          {step === 1 && <OriginFields value={form} onChange={patch} />}
          {step === 2 && <InterestFields value={form} onChange={patch} />}
          {step === 3 && <SocialFields value={form} onChange={patch} />}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-ghost">
                <ArrowLeft className="size-4" /> Voltar
              </button>
            ) : (
              <span />
            )}
            <button disabled={busy} className="btn btn-primary btn-lg">
              {busy ? <Spinner className="size-4 text-white" /> : step === STEPS.length - 1 ? <Check className="size-5" /> : null}
              {step === STEPS.length - 1 ? "Concluir" : "Continuar"}
              {step < STEPS.length - 1 && <ArrowRight className="size-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
