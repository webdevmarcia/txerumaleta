// Dados fictícios para o MODO DEMONSTRAÇÃO.
// Todas as contas de exemplo usam a palavra-passe "demo1234".

const ago = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

const profile = (p) => ({
  avatar_url: null,
  cover_url: null,
  bio: "",
  roles: [],
  island: null,
  city: "",
  country: "",
  skills: [],
  interests: [],
  open_to: [],
  socials: {},
  experience: [],
  onboarded: true,
  created_at: ago(24 * 60),
  ...p,
});

export function seedDB() {
  const profiles = [
    profile({
      id: "u-nadia",
      username: "nadia.lopes",
      full_name: "Nádia Lopes",
      headline: "Engenheira de software em Lisboa · Mentora de jovens na tecnologia",
      bio: "Nasci na Praia e vim estudar para Lisboa com uma maleta e muitos sonhos. Hoje trabalho como engenheira de software e adoro ajudar quem está a começar na área. Pergunta-me sobre bolsas, estágios e como entrar na tecnologia!",
      roles: ["profissional", "emigrante", "mentor"],
      island: "Santiago",
      city: "Lisboa",
      country: "Portugal",
      skills: ["JavaScript", "React", "Carreira em TI", "Entrevistas técnicas"],
      interests: ["Tecnologia", "Educação", "Mentoria"],
      open_to: ["mentoria", "networking"],
      socials: { linkedin: "linkedin.com/in/exemplo", github: "github.com/exemplo" },
      experience: [
        { type: "trabalho", title: "Engenheira de Software", org: "Empresa Tech", period: "2022 — atual", description: "" },
        { type: "formacao", title: "Licenciatura em Engenharia Informática", org: "Universidade de Lisboa", period: "2017 — 2021", description: "" },
      ],
    }),
    profile({
      id: "u-ailton",
      username: "ailton.monteiro",
      full_name: "Ailton Monteiro",
      headline: "Fundador da Morabeza Tours · Turismo comunitário em Santo Antão",
      bio: "Empreendedor apaixonado pela nossa terra. Organizo caminhadas e experiências autênticas em Santo Antão com guias locais.",
      roles: ["empreendedor"],
      island: "Santo Antão",
      city: "Ribeira Grande",
      country: "Cabo Verde",
      skills: ["Turismo", "Gestão", "Marketing digital"],
      interests: ["Empreendedorismo", "Turismo", "Ambiente"],
      open_to: ["parcerias", "clientes", "investimento"],
      socials: { instagram: "instagram.com/exemplo", whatsapp: "+2389000000" },
    }),
    profile({
      id: "u-kevin",
      username: "kevin.fortes",
      full_name: "Kevin Fortes",
      headline: "Estudante de Gestão na Uni-CV · Sonho com o meu próprio negócio",
      roles: ["estudante"],
      island: "São Vicente",
      city: "Mindelo",
      country: "Cabo Verde",
      skills: ["Excel", "Contabilidade"],
      interests: ["Empreendedorismo", "Finanças", "Música"],
      open_to: ["aprender", "emprego", "networking"],
    }),
    profile({
      id: "u-elis",
      username: "elis.semedo",
      full_name: "Elisângela Semedo",
      headline: "Designer gráfica freelancer · Identidade visual para pequenos negócios",
      bio: "Ajudo negócios cabo-verdianos a terem uma imagem profissional: logótipos, redes sociais e embalagens.",
      roles: ["freelancer", "criador"],
      island: "Fogo",
      city: "Roterdão",
      country: "Países Baixos",
      skills: ["Design gráfico", "Branding", "Canva", "Illustrator"],
      interests: ["Design", "Arte", "Moda"],
      open_to: ["clientes", "parcerias"],
      socials: { instagram: "instagram.com/exemplo", website: "exemplo.cv" },
    }),
    profile({
      id: "u-helder",
      username: "helder.brito",
      full_name: "Hélder Brito",
      headline: "Enfermeiro em Boston · Ajudo quem quer emigrar para os EUA",
      roles: ["profissional", "emigrante"],
      island: "Brava",
      city: "Boston",
      country: "Estados Unidos",
      skills: ["Saúde", "Processos de imigração"],
      interests: ["Saúde", "Diáspora", "Comunidade"],
      open_to: ["mentoria", "networking", "voluntariado"],
    }),
    profile({
      id: "u-sonia",
      username: "sonia.varela",
      full_name: "Sónia Varela",
      headline: "Pastelaria artesanal no Sal · Encomendas para eventos",
      roles: ["empreendedor"],
      island: "Sal",
      city: "Santa Maria",
      country: "Cabo Verde",
      skills: ["Pastelaria", "Gestão de pequeno negócio"],
      interests: ["Gastronomia", "Empreendedorismo"],
      open_to: ["clientes", "parcerias"],
      socials: { facebook: "facebook.com/exemplo", whatsapp: "+2389000001" },
    }),
  ];

  const users = profiles.map((p) => ({
    id: p.id,
    email: `${p.username.split(".")[0]}@demo.cv`,
    password: "demo1234",
  }));

  const posts = [
    {
      id: "p1",
      author_id: "u-nadia",
      category: "dica",
      content:
        "Dica para quem vem estudar para Portugal ✈️\n\n1. Trata do NIF e do cartão de estudante logo na primeira semana.\n2. Procura a associação de estudantes cabo-verdianos da tua universidade — ajudam imenso.\n3. Abre conta num banco com conta jovem gratuita.\n4. Não tenhas vergonha de pedir ajuda. Todos passámos por isso!\n\nSe tiverem dúvidas, mandem mensagem 💙",
      created_at: ago(3),
    },
    {
      id: "p2",
      author_id: "u-ailton",
      category: "experiencia",
      content:
        "Há 3 anos larguei um emprego estável para criar a Morabeza Tours. O primeiro ano foi duríssimo: poucos clientes, muitas dúvidas. O que mudou tudo foi trabalhar com a comunidade — os guias são pessoas das próprias aldeias.\n\nHoje recebemos visitantes de 12 países. Se estás a pensar empreender em Cabo Verde: começa pequeno, ouve os teus clientes e não desistas. Nós ka ta disisti! 💪",
      created_at: ago(9),
    },
    {
      id: "p3",
      author_id: "u-kevin",
      category: "pergunta",
      content:
        "Malta, alguém conhece programas de estágio de verão para estudantes de Gestão, em Cabo Verde ou na diáspora? Estou no 2.º ano e queria ganhar experiência. Obrigado! 🙏",
      created_at: ago(14),
    },
    {
      id: "p4",
      author_id: "u-helder",
      category: "oportunidade",
      content:
        "📢 O hospital onde trabalho em Boston está a recrutar enfermeiros(as) com inglês fluente. Para quem estiver interessado, posso explicar como funciona o processo de equivalência do diploma. Comentem ou enviem mensagem.",
      created_at: ago(26),
    },
    {
      id: "p5",
      author_id: "u-elis",
      category: "conhecimento",
      content:
        "3 erros que vejo muitos pequenos negócios cometer nas redes sociais:\n\n❌ Publicar sem consistência\n❌ Fotos escuras e desfocadas dos produtos\n❌ Não responder às mensagens\n\n✅ Define 2-3 dias fixos para publicar, usa luz natural nas fotos e responde sempre, mesmo que seja só um 'obrigado'. Faz toda a diferença!",
      created_at: ago(40),
    },
    {
      id: "p6",
      author_id: "u-sonia",
      category: "servico",
      content:
        "Bolos personalizados para aniversários, casamentos e batizados no Sal 🎂 Faço também pudim de queijo e doce de papaia tradicional. Encomendas com 3 dias de antecedência!",
      created_at: ago(55),
    },
    {
      id: "p7",
      author_id: "u-nadia",
      category: "evento",
      content:
        "🗓️ Sábado vamos fazer um encontro online gratuito: \"Como conseguir o primeiro emprego em tecnologia\". Vou estar com mais duas profissionais cabo-verdianas da área. Quem quer participar? Deixem um comentário que eu envio o link.",
      created_at: ago(72),
    },
  ];

  const likes = [
    ["u-kevin", "p1"], ["u-ailton", "p1"], ["u-elis", "p1"], ["u-helder", "p1"],
    ["u-nadia", "p2"], ["u-kevin", "p2"], ["u-sonia", "p2"],
    ["u-nadia", "p3"],
    ["u-kevin", "p4"], ["u-nadia", "p4"],
    ["u-sonia", "p5"], ["u-ailton", "p5"], ["u-kevin", "p5"],
    ["u-elis", "p6"],
    ["u-kevin", "p7"], ["u-helder", "p7"],
  ].map(([user_id, post_id]) => ({ user_id, post_id, created_at: ago(2) }));

  const comments = [
    { id: "c1", post_id: "p1", author_id: "u-kevin", content: "Muito útil, obrigado Nádia! Vou para Coimbra em setembro.", created_at: ago(2) },
    { id: "c2", post_id: "p1", author_id: "u-nadia", content: "Boa sorte Kevin! Manda mensagem quando chegares 😊", created_at: ago(1.5) },
    { id: "c3", post_id: "p3", author_id: "u-ailton", content: "Na Morabeza Tours aceitamos estagiários no verão! Envia-me mensagem.", created_at: ago(12) },
    { id: "c4", post_id: "p2", author_id: "u-sonia", content: "Inspirador! Força 💪", created_at: ago(8) },
    { id: "c5", post_id: "p7", author_id: "u-kevin", content: "Eu quero participar!", created_at: ago(70) },
  ];

  const follows = [
    ["u-kevin", "u-nadia"], ["u-kevin", "u-ailton"], ["u-elis", "u-nadia"],
    ["u-sonia", "u-elis"], ["u-helder", "u-nadia"], ["u-ailton", "u-sonia"],
    ["u-nadia", "u-helder"],
  ].map(([follower_id, following_id]) => ({ follower_id, following_id, created_at: ago(100) }));

  const services = [
    {
      id: "s1",
      owner_id: "u-elis",
      title: "Criação de logótipo e identidade visual",
      description: "Logótipo, paleta de cores, tipografia e modelos para redes sociais. Entrega em 7 dias, com 2 revisões incluídas.",
      category: "Design & Criatividade",
      price: "desde 120 €",
      location: "Roterdão",
      remote: true,
      created_at: ago(30),
    },
    {
      id: "s2",
      owner_id: "u-ailton",
      title: "Caminhadas guiadas em Santo Antão",
      description: "Trilhos de meio dia ou dia inteiro com guias locais. Inclui transporte e almoço típico.",
      category: "Turismo & Alojamento",
      price: "desde 3 500 CVE",
      location: "Santo Antão",
      remote: false,
      created_at: ago(50),
    },
    {
      id: "s3",
      owner_id: "u-nadia",
      title: "Mentoria de carreira em tecnologia",
      description: "Sessões de 1 hora para rever o teu CV, preparar entrevistas técnicas e definir um plano de estudo.",
      category: "Explicações & Formação",
      price: "1.ª sessão gratuita",
      location: "Online",
      remote: true,
      created_at: ago(80),
    },
    {
      id: "s4",
      owner_id: "u-sonia",
      title: "Bolos e doces para eventos",
      description: "Bolos personalizados, docinhos e doces tradicionais cabo-verdianos.",
      category: "Gastronomia",
      price: "sob orçamento",
      location: "Santa Maria, Sal",
      remote: false,
      created_at: ago(55),
    },
  ];

  return {
    users,
    profiles,
    posts,
    likes,
    comments,
    saves: [],
    follows,
    services,
    conversations: [],
    messages: [],
    notifications: [],
    reports: [],
  };
}
