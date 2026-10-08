-- Supabase SQL Editor에서 실행하세요. (이미 만들어 두셨다면 이 파일은 참고용입니다.)
-- 전제: Authentication > Providers > Email 이 켜져 있어야 합니다.
--       테스트 중 바로 로그인하려면 "Confirm email"을 끄세요.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists messages_receiver_idx on public.messages (receiver_id);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- 프로필: 로그인한 사용자는 누구나 조회, 생성/수정은 본인 것만
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- 메시지: 내가 보낸/받은 것만 조회, 보내기는 내 이름으로만
create policy "messages read own" on public.messages for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "messages insert own" on public.messages for insert to authenticated
  with check (sender_id = auth.uid());

-- 실시간 메시지 수신 (RLS가 적용되어 내 메시지만 전달됨)
alter publication supabase_realtime add table public.messages;

-- 프로필 사진 버킷 (public). 업로드는 본인 폴더(<auth.uid()>/...)에만 가능
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
