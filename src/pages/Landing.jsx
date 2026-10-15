import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Handshake,
  Heart,
  Lightbulb,
  MessageCircle,
  Plane,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { DemoBanner } from "../components/layout";
import { Logo } from "../components/ui";
import { ISLANDS } from "../lib/constants";

const FEATURES = [
  { icon: Sparkles, title: "Partilha a tua caminhada", text: "Conta experiências de vida, conquistas e desafios que podem inspirar quem vem a seguir." },
  { icon: Lightbulb, title: "Aprende e ensina", text: "Dicas práticas sobre estudos, emigração, carreira e negócios — da comunidade para a comunidade." },
  { icon: Briefcase, title: "Mostra os teus serviços", text: "Divulga o que fazes, encontra profissionais de confiança e apoia negócios cabo-verdianos." },
  { icon: Handshake, title: "Faz networking a sério", text: "Encontra mentores, parceiros e oportunidades por ilha, país, competência ou interesse." },
  { icon: MessageCircle, title: "Conversa em privado", text: "Mensagens diretas em tempo real para combinar colaborações, tirar dúvidas ou fechar negócio." },
  { icon: ShieldCheck, title: "Um espaço seguro", text: "Regras claras, denúncias e moderação para que todos se sintam em casa." },
];

const AUDIENCE = [
  { icon: GraduationCap, title: "Estudantes", text: "Bolsas, estágios, dicas de quem já passou pelo mesmo." },
  { icon: Rocket, title: "Empreendedores", text: "Clientes, parceiros, investimento e visibilidade." },
  { icon: Plane, title: "Emigrantes", text: "Fica ligado à terra e ajuda quem está a chegar." },
  { icon: Users, title: "E não só", text: "Profissionais, criadores, mentores e amigos de Cabo Verde." },
];

function PreviewCard({ name, role, text, tag, tagClass, likes, color }) {
  return (
    <div className="card p-4 text-left shadow-lg">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white ${color}`}>
          {name.split(" ").map((n) => n[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-slate-500">{role}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagClass}`}>{tag}</span>
      </div>
      <p className="mt-3 text-sm text-slate-700">{text}</p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Heart className="size-3.5 fill-coral-500 text-coral-500" /> {likes} gostos
      </p>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <DemoBanner />

      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/entrar" className="btn btn-ghost">Entrar</Link>
            <Link to="/registar" className="btn btn-primary">Criar conta</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-700 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sun-300 ring-1 ring-white/20">
              ★ Nas 9 ilhas e na diáspora
            </span>
            <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold text-white md:text-5xl">
              A comunidade da juventude <span className="text-sun-400">cabo-verdiana</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-brand-100">
              Sabes aquele <em>txeru di maleta</em> quando alguém chega de fora, cheio de novidades? A Txerumaleta é isso:
              um lugar para partilhar experiências, conhecimentos, serviços e criar ligações que levam longe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/registar" className="btn btn-sun btn-lg">
                Junta-te à comunidade <ArrowRight className="size-5" />
              </Link>
              <Link to="/entrar" className="btn btn-lg border border-white/30 text-white hover:bg-white/10">
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 text-sm text-brand-200">Grátis. Cria o teu perfil em menos de 2 minutos.</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-[2rem] bg-white/5" />
            <div className="relative space-y-4">
              <div className="translate-x-4">
                <PreviewCard name="Nádia Lopes" role="Engenheira de software · Lisboa" tag="Dica" tagClass="bg-amber-50 text-amber-700" color="bg-brand-500" likes={48}
                  text="Vens estudar para Portugal? Trata do NIF logo na 1.ª semana e procura a associação de estudantes cabo-verdianos 💙" />
              </div>
              <div className="-translate-x-2">
                <PreviewCard name="Ailton Monteiro" role="Fundador · Santo Antão" tag="Experiência" tagClass="bg-brand-50 text-brand-700" color="bg-coral-500" likes={112}
                  text="Há 3 anos larguei tudo para criar o meu negócio de turismo comunitário. Hoje recebemos visitantes de 12 países!" />
              </div>
            </div>
          </div>
        </div>
        <div className="flag-stripe h-3" />
      </section>

      {/* PARA QUEM */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-extrabold">Feita para quem constrói o futuro de Cabo Verde</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Estejas na Praia, no Mindelo, em Lisboa, Boston ou Roterdão — aqui a distância não conta.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-sun-400/20 text-brand-800">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold">Tudo o que precisas para crescer em comunidade</h2>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ILHAS */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-3xl font-extrabold">Dez ilhas, uma só morabeza</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Encontra pessoas da tua ilha ou descobre talentos de todo o arquipélago e da diáspora.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {[...ISLANDS, "Diáspora 🌍"].map((i) => (
            <span key={i} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{i}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-ink text-center text-white">
          <div className="px-6 py-14">
            <h2 className="text-3xl font-extrabold text-white">Bô ta txiga? A tua maleta tem lugar aqui.</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-300">Cria a tua conta, completa o perfil e começa a ligar-te a quem partilha as tuas raízes e ambições.</p>
            <Link to="/registar" className="btn btn-sun btn-lg mt-8">
              Criar conta grátis <ArrowRight className="size-5" />
            </Link>
          </div>
          <div className="flag-stripe h-2" />
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <div className="flex gap-5">
            <Link to="/comunidade" className="hover:text-ink">Regras da comunidade</Link>
            <Link to="/entrar" className="hover:text-ink">Entrar</Link>
          </div>
          <p>© {new Date().getFullYear()} Txerumaleta</p>
        </div>
      </footer>
    </div>
  );
}
