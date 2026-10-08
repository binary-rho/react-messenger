-- 단톡 멤버 초대/나가기 추가분입니다. groups.sql을 실행한 뒤 SQL Editor에서 이어서 실행하세요.

-- 그룹 멤버라면 누구나 친구를 초대할 수 있음 (이미 멤버인 사람은 무시)
create or replace function public.add_group_members(gid uuid, member_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_member(gid) then
    raise exception 'not a group member';
  end if;

  insert into public.group_members (group_id, user_id)
  select distinct gid, member_id
  from unnest(member_ids) as member_id
  on conflict do nothing;
end;
$$;

-- 단톡 나가기. 마지막 멤버가 나가면 그룹과 메시지도 함께 삭제됨
create or replace function public.leave_group(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.group_members where group_id = gid and user_id = auth.uid();

  if not exists (select 1 from public.group_members where group_id = gid) then
    delete from public.groups where id = gid;
  end if;
end;
$$;
