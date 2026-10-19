-- 메시지 답장 기능 추가분입니다. schema.sql, groups.sql을 실행한 뒤 SQL Editor에서 이어서 실행하세요.
-- 답장 대상 메시지가 지워져도 답장 메시지는 남도록 set null 처리합니다.

alter table public.messages
  add column if not exists reply_to_id bigint references public.messages(id) on delete set null;

alter table public.group_messages
  add column if not exists reply_to_id bigint references public.group_messages(id) on delete set null;
