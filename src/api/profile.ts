import { AVATAR_BUCKET, supabase } from '../lib/supabase'
import { imgPath } from '../style/imgPath'

export interface Profile {
  id: string
  name: string
  avatar_url: string | null
  created_at: string
}

export const MAX_NAME_LENGTH = 20
export const MAX_AVATAR_SIZE_MB = 5
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024

export const resolveAvatarSrc = (avatarUrl: string | null | undefined): string => avatarUrl || imgPath.profile[0]

export const validateName = (name: string): string | null => {
  const trimmed = name.trim()
  if (trimmed === '') return '이름을 입력해주세요.'
  if (trimmed.length > MAX_NAME_LENGTH) return `이름은 ${MAX_NAME_LENGTH}자 이하로 입력해주세요.`
  return null
}

export const validateAvatarFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) return '이미지 파일만 업로드할 수 있어요.'
  if (file.size > MAX_AVATAR_SIZE_BYTES) return `사진은 ${MAX_AVATAR_SIZE_MB}MB 이하만 가능해요.`
  return null
}

export const fetchProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const fetchOtherProfiles = async (myId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', myId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

//파일명에 timestamp를 넣어 사진 교체 시 캐시가 남지 않도록
const uploadAvatar = async (profileId: string, file: File): Promise<string> => {
  const extension = file.name.split('.').pop() || 'png'
  const path = `${profileId}/${Date.now()}.${extension}`
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}

//프로필 id는 로그인한 사용자의 auth id와 동일
export const createProfile = async ({
  id,
  name,
  avatarFile,
}: {
  id: string
  name: string
  avatarFile: File | null
}) => {
  const avatar_url = avatarFile ? await uploadAvatar(id, avatarFile) : null
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id, name: name.trim(), avatar_url })
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

export const updateProfile = async (
  id: string,
  { name, avatarFile }: { name?: string; avatarFile?: File | null },
): Promise<Profile> => {
  const changes: { name?: string; avatar_url?: string } = {}
  if (name !== undefined) changes.name = name.trim()
  if (avatarFile) changes.avatar_url = await uploadAvatar(id, avatarFile)

  const { data, error } = await supabase.from('profiles').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}
