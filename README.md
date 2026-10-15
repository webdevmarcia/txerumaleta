# Txerumaleta

CpN8ZCTn5BBlSpzb senha supa

A rede social da juventude cabo-verdiana — estudantes, empreendedores, emigrantes e não só —
para partilhar experiências de vida, conhecimentos, dicas, serviços e fazer networking.

## Funcionalidades

- **Contas**: registo, entrada, recuperação de palavra-passe, confirmação por email (Supabase).
- **Boas-vindas em 4 passos**: foto, título, ilha de origem, país/cidade, perfil (estudante, empreendedor, emigrante…), competências, interesses, "disponível para" e redes sociais.
- **Perfil profissional**: capa, foto, biografia, percurso (experiência e formação), redes sociais (LinkedIn, Instagram, Facebook, TikTok, X, YouTube, GitHub, website, WhatsApp), seguidores e serviços.
- **Feed**: publicações com texto, foto e tipo (Experiência, Dica, Conhecimento, Oportunidade, Evento, Pergunta, Serviço); filtros "Para ti" / "A seguir" e por tipo; gostos, comentários, guardados, copiar link, denúncias.
- **Comunidade**: pesquisa de membros por nome, competência ou cidade, e filtros por perfil, ilha, país e disponibilidade.
- **Serviços**: catálogo de serviços com categorias, preço, local, opção remota e contacto direto (mensagem ou WhatsApp).
- **Mensagens diretas** em tempo real, com indicação de lidas e contador de não lidas.
- **Notificações** de gostos, comentários e novos seguidores.
- **Moderação**: denúncias de publicações e perfis, e página de regras da comunidade.
- Design responsivo (telemóvel e computador), com as cores da bandeira de Cabo Verde.

## Começar (modo demonstração)

```bash
npm install
npm run dev
```

Abra http://localhost:5173. Sem configurar nada, a app arranca em **modo demonstração**:
os dados ficam guardados só no navegador e já há membros e publicações de exemplo.
Pode entrar com `nadia@demo.cv` / `demo1234` ou criar uma conta nova.

## Ligar à base de dados real (Supabase — grátis para começar)

1. Crie uma conta em https://supabase.com e um projeto novo.
2. No projeto, abra **SQL Editor → New query**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e carregue em **Run**.
3. Em **Project Settings → API**, copie o *Project URL* e a chave *anon public*.
4. Copie `.env.example` para `.env` e preencha:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Em **Authentication → URL Configuration**, defina o *Site URL* (ex.: `http://localhost:5173` e, mais tarde, o seu domínio) e adicione `.../nova-password` às *Redirect URLs*.
6. Reinicie `npm run dev`. A faixa amarela de "modo demonstração" desaparece.

Opcional: em **Authentication → Emails** pode traduzir os emails de confirmação e recuperação para português.

As denúncias ficam na tabela `reports` (visível em **Table Editor** no Supabase).

## Publicar online

Funciona em Vercel ou Netlify (já incluídos `vercel.json` e `public/_redirects`):

1. Envie o projeto para o GitHub.
2. Importe-o na Vercel/Netlify (comando `npm run build`, pasta `dist`).
3. Adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas definições do projeto.

## Estrutura

```
src/
  api/           acesso a dados: supabase.js (produção), local.js + seed.js (demonstração)
  components/    interface reutilizável (publicações, pessoas, serviços, layout…)
  context/       sessão do utilizador e avisos (toasts)
  hooks/         carregamento de dados, feed com paginação, contadores
  lib/           listas (ilhas, países, categorias…) e utilitários
  pages/         páginas da aplicação
supabase/
  schema.sql     tabelas, segurança (RLS), notificações automáticas e armazenamento de imagens
```

Para mudar ilhas, países, categorias de publicações ou serviços, edite `src/lib/constants.js`.

## Próximos passos sugeridos

- Painel de administração para tratar denúncias e moderar conteúdo.
- Bloquear utilizadores.
- Grupos/comunidades temáticas (ex.: "Estudantes em Portugal", "Empreendedores do Sal").
- Eventos com inscrição e agenda.
- Notificações por email e push.
- Login com Google.
- Versão em Kriolu e Inglês.
