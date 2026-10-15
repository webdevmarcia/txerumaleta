// Listas usadas em toda a plataforma. Edite à vontade.

export const ISLANDS = [
  "Santiago",
  "São Vicente",
  "Santo Antão",
  "Fogo",
  "Sal",
  "Boa Vista",
  "Maio",
  "São Nicolau",
  "Brava",
];

export const COUNTRIES = [
  "Cabo Verde",
  "Portugal",
  "Estados Unidos",
  "França",
  "Países Baixos",
  "Luxemburgo",
  "Itália",
  "Espanha",
  "Brasil",
  "Reino Unido",
  "Suíça",
  "Alemanha",
  "Bélgica",
  "Irlanda",
  "Suécia",
  "Noruega",
  "Canadá",
  "Angola",
  "Senegal",
  "Guiné-Bissau",
  "São Tomé e Príncipe",
  "Moçambique",
  "Outro",
];

export const ROLES = [
  { id: "estudante", label: "Estudante" },
  { id: "empreendedor", label: "Empreendedor(a)" },
  { id: "emigrante", label: "Emigrante / Diáspora" },
  { id: "profissional", label: "Profissional" },
  { id: "freelancer", label: "Freelancer" },
  { id: "mentor", label: "Mentor(a)" },
  { id: "criador", label: "Criador(a) de conteúdo" },
  { id: "outro", label: "Outro" },
];

export const OPEN_TO = [
  { id: "networking", label: "Networking" },
  { id: "mentoria", label: "Dar mentoria" },
  { id: "aprender", label: "Receber mentoria" },
  { id: "parcerias", label: "Parcerias" },
  { id: "emprego", label: "Oportunidades de emprego" },
  { id: "clientes", label: "Novos clientes" },
  { id: "investimento", label: "Investimento" },
  { id: "voluntariado", label: "Voluntariado" },
];

// As classes de cor ficam escritas por extenso para o Tailwind as detetar.
export const POST_CATEGORIES = [
  { id: "experiencia", label: "Experiência", className: "bg-brand-50 text-brand-700" },
  { id: "dica", label: "Dica", className: "bg-amber-50 text-amber-700" },
  { id: "conhecimento", label: "Conhecimento", className: "bg-emerald-50 text-emerald-700" },
  { id: "oportunidade", label: "Oportunidade", className: "bg-violet-50 text-violet-700" },
  { id: "evento", label: "Evento", className: "bg-rose-50 text-rose-700" },
  { id: "pergunta", label: "Pergunta", className: "bg-sky-50 text-sky-700" },
  { id: "servico", label: "Serviço", className: "bg-orange-50 text-orange-700" },
];

export const SERVICE_CATEGORIES = [
  "Tecnologia & Web",
  "Design & Criatividade",
  "Marketing & Redes Sociais",
  "Explicações & Formação",
  "Tradução & Documentação",
  "Consultoria & Negócios",
  "Fotografia & Vídeo",
  "Música & Eventos",
  "Beleza & Bem-estar",
  "Gastronomia",
  "Moda & Artesanato",
  "Transporte & Envios",
  "Construção & Reparações",
  "Turismo & Alojamento",
  "Outro",
];

export const SOCIALS = [
  { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/o-seu-nome", color: "#0a66c2" },
  { id: "instagram", label: "Instagram", placeholder: "instagram.com/o_seu_user", color: "#e1306c" },
  { id: "facebook", label: "Facebook", placeholder: "facebook.com/o.seu.nome", color: "#1877f2" },
  { id: "tiktok", label: "TikTok", placeholder: "tiktok.com/@o_seu_user", color: "#111111" },
  { id: "x", label: "X / Twitter", placeholder: "x.com/o_seu_user", color: "#111111" },
  { id: "youtube", label: "YouTube", placeholder: "youtube.com/@o_seu_canal", color: "#ff0000" },
  { id: "github", label: "GitHub", placeholder: "github.com/o-seu-user", color: "#24292f" },
  { id: "website", label: "Website", placeholder: "www.o-seu-site.cv", color: "#003893" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "+238 9xx xx xx", color: "#25d366" },
];

export const REPORT_REASONS = [
  "Spam ou publicidade enganosa",
  "Assédio ou discurso de ódio",
  "Conteúdo impróprio",
  "Burla ou fraude",
  "Perfil falso",
  "Outro motivo",
];

export const findLabel = (list, id) => list.find((x) => x.id === id)?.label ?? id;
