-- 채팅 목록용: 상대/그룹별 마지막 메시지만 반환 (기본 1000행 제한 회피). SQL Editor에서 실행하세요.
-- security invoker라 기존 RLS 정책이 그대로 적용됩니다.

create or replace function public.my_last_messages()
returns setof public.messages
language sql
stable
security invoker
as $$
  select distinct on (case when sender_id = auth.uid() then receiver_id else sender_id end) *
  from public.messages
  where sender_id = auth.uid() or receiver_id = auth.uid()
  order by (case when sender_id = auth.uid() then receiver_id else sender_id end), id desc
$$;

create or replace function public.my_last_group_messages()
returns setof public.group_messages
language sql
stable
security invoker
as $$
  select distinct on (group_id) *
  from public.group_messages
  order by group_id, id desc
$$;
