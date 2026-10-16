-- 메시지 리액션(미니 이모티콘) 추가분입니다. schema.sql, groups.sql을 실행한 뒤 SQL Editor에서 이어서 실행하세요.
-- 1:1 메시지(messages)와 단톡 메시지(group_messages)는 id 시퀀스가 따로라서 message_kind로 구분합니다.

create table if not exists public.message_reactions (
  id bigint generated always as identity primary key,
  message_kind text not null check (message_kind in ('dm', 'group')),
  message_id bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (message_kind, message_id, user_id, emoji)
);

create index if not exists message_reactions_message_idx on public.message_reactions (message_kind, message_id);

-- 내가 볼 수 있는 메시지인지 확인 (1:1은 보내거나 받은 사람, 단톡은 멤버)
create or replace function public.can_access_message(kind text, mid bigint)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case kind
    when 'dm' then exists (
      select 1 from public.messages
      where id = mid and (sender_id = auth.uid() or receiver_id = auth.uid())
    )
    when 'group' then exists (
      select 1 from public.group_messages gm
      where gm.id = mid and public.is_group_member(gm.group_id)
    )
    else false
  end
$$;

alter table public.message_reactions enable row level security;

create policy "message_reactions read accessible" on public.message_reactions for select to authenticated
  using (public.can_access_message(message_kind, message_id));
create policy "message_reactions insert own" on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.can_access_message(message_kind, message_id));
create policy "message_reactions delete own" on public.message_reactions for delete to authenticated
  using (user_id = auth.uid());

-- 실시간 반영 (DELETE 이벤트는 RLS가 적용되지 않으므로 replica identity는 기본값(id만)을 유지합니다)
alter publication supabase_realtime add table public.message_reactions;
