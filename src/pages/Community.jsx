import { Link } from "react-router-dom";
import { ArrowLeft, Flag, HandHeart, Lock, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const RULES = [
  { icon: HandHeart, title: "Respeito e morabeza", text: "Trata todos com respeito. Não são tolerados insultos, assédio, discriminação ou discurso de ódio — seja por origem, ilha, género, religião, orientação ou opinião." },
  { icon: Sparkles, title: "Partilha com valor", text: "Publica experiências, dicas, conhecimentos e oportunidades reais. Evita spam, correntes e publicidade repetida." },
  { icon: ShieldCheck, title: "Honestidade nos serviços", text: "Descreve os teus serviços e preços com verdade. Burlas, esquemas de dinheiro fácil ou pirâmides levam à remoção imediata da conta." },
  { icon: Lock, title: "Privacidade", text: "Não partilhes dados pessoais de outras pessoas (moradas, telefones, fotos) sem autorização. Cuidado com o que partilhas sobre ti." },
  { icon: MessageCircle, title: "Mensagens com bom senso", text: "Usa as mensagens privadas para networking e negócios. Não envies mensagens em massa nem insistas com quem não responde." },
  { icon: Flag, title: "Denuncia o que não está bem", text: "Se vires algo que viole estas regras, usa a opção “Denunciar”. A equipa analisa todas as denúncias de forma confidencial." },
];

export default function Community() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flag-stripe h-1.5" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft className="size-4" /> {user ? "Voltar ao feed" : "Início"}</Link>
        </div>

        <h1 className="text-3xl font-extrabold">Regras da comunidade</h1>
        <p className="mt-3 text-slate-600">
          A Txerumaleta é um espaço para a juventude cabo-verdiana — nas ilhas e na diáspora — crescer junta.
          Para que todos se sintam em casa, pedimos que sigas estas regras simples.
        </p>

        <div className="mt-8 space-y-4">
          {RULES.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card flex gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="font-bold">{i + 1}. {title}</h2>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-8 p-5 text-sm text-slate-600">
          <h2 className="mb-2 font-bold text-ink">Os teus dados</h2>
          <p>
            O teu perfil (nome, foto, título, localização, competências e redes sociais) é visível para os membros da comunidade.
            As mensagens privadas e os teus guardados só são visíveis para ti. Podes editar ou remover a tua informação a qualquer momento nas Definições.
          </p>
        </div>
      </div>
    </div>
  );
}
