-- 단톡(그룹 채팅) 추가분입니다. schema.sql을 실행한 뒤 SQL Editor에서 이어서 실행하세요.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 20),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (group_id, user_id)
);

create table if not exists public.group_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists group_messages_group_idx on public.group_messages (group_id);
create index if not exists group_members_user_idx on public.group_members (user_id);

-- 정책에서 group_members를 직접 조회하면 무한 재귀가 나므로 security definer 함수로 확인
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members where group_id = gid and user_id = auth.uid()
  )
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;

-- 그룹/멤버/메시지는 그룹 멤버에게만 보임
create policy "groups read member" on public.groups for select to authenticated
  using (public.is_group_member(id));
create policy "group_members read member" on public.group_members for select to authenticated
  using (public.is_group_member(group_id));
create policy "group_messages read member" on public.group_messages for select to authenticated
  using (public.is_group_member(group_id));
create policy "group_messages insert member" on public.group_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_group_member(group_id));

-- 그룹 생성 (그룹 + 멤버를 한 번에, 만든 사람은 자동 포함)
create or replace function public.create_group(group_name text, member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.groups (name, created_by) values (trim(group_name), auth.uid())
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id)
  select distinct new_group_id, member_id
  from unnest(array_append(member_ids, auth.uid())) as member_id;

  return new_group_id;
end;
$$;

alter publication supabase_realtime add table public.group_messages;
