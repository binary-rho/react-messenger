-- 채팅 사진 버킷 (private). 업로드는 본인 폴더(<auth.uid()>/...)에만 가능하고,
-- 읽기는 로그인한 사용자만 가능 (앱에서는 signed URL로 접근)
-- 나중에 "해당 방 멤버만 읽기"로 좁히려면 아래 select 정책을 교체하면 된다.
insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', false)
on conflict (id) do nothing;

create policy "chat-images read" on storage.objects for select to authenticated
  using (bucket_id = 'chat-images');
create policy "chat-images upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-images' and (storage.foldername(name))[1] = auth.uid()::text);
