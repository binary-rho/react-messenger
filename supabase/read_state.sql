-- 채팅방별 읽음 상태 + 안 읽은 개수. last_messages.sql 실행 후 SQL Editor에서 이어서 실행하세요.
-- room_key: 1:1은 'dm:<상대 uuid>', 단톡은 'group:<group uuid>'

create table if not exists public.chat_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_key text not null,
  last_read_id bigint not null default 0,
  primary key (user_id, room_key)
);

alter table public.chat_reads enable row level security;

create policy "chat_reads read own" on public.chat_reads for select to authenticated
  using (user_id = auth.uid());
create policy "chat_reads insert own" on public.chat_reads for insert to authenticated
  with check (user_id = auth.uid());
create policy "chat_reads update own" on public.chat_reads for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 읽음 위치는 앞으로만 이동 (오래된 요청이 늦게 도착해도 되돌아가지 않도록 greatest 사용)
create or replace function public.mark_room_read(key text, read_id bigint)
returns void
language sql
security invoker
as $$
  insert into public.chat_reads (user_id, room_key, last_read_id)
  values (auth.uid(), key, read_id)
  on conflict (user_id, room_key)
  do update set last_read_id = greatest(public.chat_reads.last_read_id, excluded.last_read_id)
$$;

-- 방별 안 읽은 개수 (내가 보낸 메시지는 제외, 안 읽은 게 없는 방은 반환하지 않음)
create or replace function public.my_unread_counts()
returns table (room_key text, unread_count bigint)
language sql
stable
security invoker
as $$
  select 'dm:' || m.sender_id::text, count(*)
  from public.messages m
  left join public.chat_reads r
    on r.user_id = auth.uid() and r.room_key = 'dm:' || m.sender_id::text
  where m.receiver_id = auth.uid() and m.id > coalesce(r.last_read_id, 0)
  group by m.sender_id
  union all
  select 'group:' || gm.group_id::text, count(*)
  from public.group_messages gm
  left join public.chat_reads r
    on r.user_id = auth.uid() and r.room_key = 'group:' || gm.group_id::text
  where gm.sender_id <> auth.uid() and gm.id > coalesce(r.last_read_id, 0)
  group by gm.group_id
$$;
