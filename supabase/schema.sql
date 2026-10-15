-- =====================================================================
--  TXERUMALETA — esquema da base de dados (Supabase / PostgreSQL)
--  Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
--  Pode ser executado mais do que uma vez sem problemas.
-- =====================================================================

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------
-- PERFIS
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null check (username ~ '^[a-z0-9_.]{3,30}$'),
  full_name   text not null default '' check (char_length(full_name) <= 80),
  avatar_url  text,
  cover_url   text,
  headline    text not null default '' check (char_length(headline) <= 120),
  bio         text not null default '' check (char_length(bio) <= 1500),
  roles       text[] not null default '{}',
  island      text,
  city        text,
  country     text,
  skills      text[] not null default '{}',
  interests   text[] not null default '{}',
  open_to     text[] not null default '{}',
  socials     jsonb not null default '{}'::jsonb,
  experience  jsonb not null default '[]'::jsonb,
  onboarded   boolean not null default false,
  search_text text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.profiles_before_write()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  new.updated_at := now();
  new.search_text := lower(extensions.unaccent(concat_ws(' ',
    new.full_name, new.username, new.headline, new.city, new.country, new.island,
    array_to_string(new.skills, ' '), array_to_string(new.interests, ' '))));
  return new;
end $$;

drop trigger if exists profiles_before_write on public.profiles;
create trigger profiles_before_write before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

-- Cria o perfil automaticamente quando alguém se regista
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base  text;
  final text;
  n     int := 0;
begin
  base := lower(regexp_replace(
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)),
    '[^a-zA-Z0-9_.]', '', 'g'));
  if char_length(base) < 3 then base := base || 'membro'; end if;
  base := left(base, 25);
  final := base;
  while exists (select 1 from public.profiles where username = final) loop
    n := n + 1;
    final := base || n::text;
  end loop;

  insert into public.profiles (id, username, full_name)
  values (new.id, final, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 80));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- PUBLICAÇÕES, GOSTOS, COMENTÁRIOS, GUARDADOS
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles on delete cascade,
  content    text not null default '' check (char_length(content) <= 5000),
  category   text not null default 'experiencia',
  image_url  text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);

create table if not exists public.likes (
  user_id    uuid not null references public.profiles on delete cascade,
  post_id    uuid not null references public.posts on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists likes_post_idx on public.likes (post_id);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts on delete cascade,
  author_id  uuid not null references public.profiles on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

create table if not exists public.saves (
  user_id    uuid not null references public.profiles on delete cascade,
  post_id    uuid not null references public.posts on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ---------------------------------------------------------------------
-- SEGUIR
-- ---------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles on delete cascade,
  following_id uuid not null references public.profiles on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------
-- SERVIÇOS
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles on delete cascade,
  title       text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  category    text not null default 'Outro',
  price       text not null default '' check (char_length(price) <= 60),
  location    text not null default '' check (char_length(location) <= 80),
  remote      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists services_created_idx on public.services (created_at desc);

-- ---------------------------------------------------------------------
-- MENSAGENS DIRETAS (conversas entre 2 pessoas)
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles on delete cascade,
  user_b     uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  sender_id       uuid not null references public.profiles on delete cascade,
  content         text not null check (char_length(content) between 1 and 4000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation();

-- Lista de conversas do utilizador com a última mensagem e não lidas
create or replace function public.my_conversations()
returns table (
  conv_id uuid, other_id uuid, conv_updated_at timestamptz,
  last_content text, last_sender uuid, last_at timestamptz, unread bigint
)
language sql stable set search_path = public as $$
  select c.id,
         case when c.user_a = auth.uid() then c.user_b else c.user_a end,
         c.updated_at,
         lm.content, lm.sender_id, lm.created_at,
         (select count(*) from public.messages u
           where u.conversation_id = c.id and u.sender_id <> auth.uid() and u.read_at is null)
  from public.conversations c
  left join lateral (
    select m.content, m.sender_id, m.created_at from public.messages m
    where m.conversation_id = c.id order by m.created_at desc limit 1
  ) lm on true
  where auth.uid() in (c.user_a, c.user_b)
  order by coalesce(lm.created_at, c.updated_at) desc;
$$;

-- ---------------------------------------------------------------------
-- NOTIFICAÇÕES (criadas automaticamente por triggers)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  actor_id   uuid not null references public.profiles on delete cascade,
  type       text not null check (type in ('like', 'comment', 'follow')),
  post_id    uuid references public.posts on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.notify_like()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, post_id)
  select p.author_id, new.user_id, 'like', new.post_id
  from public.posts p where p.id = new.post_id and p.author_id <> new.user_id;
  return new;
end $$;

create or replace function public.notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type, post_id)
  select p.author_id, new.author_id, 'comment', new.post_id
  from public.posts p where p.id = new.post_id and p.author_id <> new.author_id;
  return new;
end $$;

create or replace function public.notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end $$;

drop trigger if exists likes_notify on public.likes;
create trigger likes_notify after insert on public.likes
  for each row execute function public.notify_like();
drop trigger if exists comments_notify on public.comments;
create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_comment();
drop trigger if exists follows_notify on public.follows;
create trigger follows_notify after insert on public.follows
  for each row execute function public.notify_follow();

-- ---------------------------------------------------------------------
-- DENÚNCIAS (moderação)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles on delete cascade,
  target_type text not null check (target_type in ('post', 'profile', 'comment', 'service')),
  target_id   text not null,
  reason      text not null,
  details     text not null default '' check (char_length(details) <= 1000),
  status      text not null default 'pendente',
  created_at  timestamptz not null default now()
);

-- =====================================================================
--  SEGURANÇA (Row Level Security)
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.posts         enable row level security;
alter table public.likes         enable row level security;
alter table public.comments      enable row level security;
alter table public.saves         enable row level security;
alter table public.follows       enable row level security;
alter table public.services      enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.notifications enable row level security;
alter table public.reports       enable row level security;

-- apaga políticas antigas para o script poder ser executado de novo
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Perfis: públicos para leitura, cada um edita o seu
create policy "perfis visiveis" on public.profiles for select using (true);
create policy "editar o meu perfil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Publicações
create policy "ver publicacoes" on public.posts for select to authenticated using (true);
create policy "criar publicacao" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "editar publicacao" on public.posts for update to authenticated using (author_id = auth.uid());
create policy "apagar publicacao" on public.posts for delete to authenticated using (author_id = auth.uid());

-- Gostos
create policy "ver gostos" on public.likes for select to authenticated using (true);
create policy "dar gosto" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "tirar gosto" on public.likes for delete to authenticated using (user_id = auth.uid());

-- Comentários (o autor do post também pode apagar comentários no seu post)
create policy "ver comentarios" on public.comments for select to authenticated using (true);
create policy "comentar" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "apagar comentario" on public.comments for delete to authenticated using (
  author_id = auth.uid()
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);

-- Guardados (privados)
create policy "ver os meus guardados" on public.saves for select to authenticated using (user_id = auth.uid());
create policy "guardar" on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy "remover guardado" on public.saves for delete to authenticated using (user_id = auth.uid());

-- Seguir
create policy "ver seguidores" on public.follows for select to authenticated using (true);
create policy "seguir" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "deixar de seguir" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- Serviços
create policy "ver servicos" on public.services for select to authenticated using (true);
create policy "criar servico" on public.services for insert to authenticated with check (owner_id = auth.uid());
create policy "editar servico" on public.services for update to authenticated using (owner_id = auth.uid());
create policy "apagar servico" on public.services for delete to authenticated using (owner_id = auth.uid());

-- Conversas e mensagens: só os participantes
create policy "ver conversas" on public.conversations for select to authenticated
  using (auth.uid() in (user_a, user_b));
create policy "criar conversa" on public.conversations for insert to authenticated
  with check (auth.uid() in (user_a, user_b));

create policy "ver mensagens" on public.messages for select to authenticated using (
  exists (select 1 from public.conversations c
          where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
create policy "enviar mensagem" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (select 1 from public.conversations c
          where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
create policy "marcar como lida" on public.messages for update to authenticated using (
  sender_id <> auth.uid() and exists (select 1 from public.conversations c
          where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
-- só a coluna read_at pode ser alterada
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- Notificações
create policy "ver as minhas notificacoes" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "marcar notificacoes" on public.notifications for update to authenticated
  using (user_id = auth.uid());
create policy "apagar notificacoes" on public.notifications for delete to authenticated
  using (user_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

-- Denúncias: qualquer membro pode denunciar; só a equipa (service role) as lê
create policy "denunciar" on public.reports for insert to authenticated with check (reporter_id = auth.uid());

-- =====================================================================
--  TEMPO REAL (mensagens e notificações aparecem sem recarregar)
-- =====================================================================
do $$
begin
  begin alter publication supabase_realtime add table public.messages;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;

-- =====================================================================
--  ARMAZENAMENTO DE IMAGENS (fotos de perfil, capas, publicações)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "media publica" on storage.objects;
drop policy if exists "media enviar" on storage.objects;
drop policy if exists "media apagar" on storage.objects;

create policy "media publica" on storage.objects for select using (bucket_id = 'media');
create policy "media enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
