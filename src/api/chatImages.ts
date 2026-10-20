import { CHAT_IMAGE_BUCKET, supabase } from '../lib/supabase'

export const MAX_CHAT_IMAGE_SIZE_MB = 10
const MAX_CHAT_IMAGE_SIZE_BYTES = MAX_CHAT_IMAGE_SIZE_MB * 1024 * 1024
const MAX_IMAGE_DIMENSION_PX = 1280
const RESIZED_IMAGE_TYPE = 'image/jpeg'
const RESIZED_IMAGE_QUALITY = 0.85
const GIF_TYPE = 'image/gif'
const WEBP_TYPE = 'image/webp'
const PNG_TYPE = 'image/png'
const EXTENSION_BY_TYPE: Record<string, string> = {
  [GIF_TYPE]: 'gif',
  [WEBP_TYPE]: 'webp',
  [PNG_TYPE]: 'png',
}

const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60
//만료 직전에 쓰다 깨지지 않도록 여유를 두고 캐시를 무효로 본다
const SIGNED_URL_CACHE_MARGIN_MS = 5 * 60 * 1000

export const validateChatImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) return '이미지 파일만 보낼 수 있어요.'
  if (file.size > MAX_CHAT_IMAGE_SIZE_BYTES) return `사진은 ${MAX_CHAT_IMAGE_SIZE_MB}MB 이하만 보낼 수 있어요.`
  return null
}

//움직이는 WebP(ANIM 청크)/APNG(acTL 청크)인지 앞부분 바이트로 확인
const SNIFF_BYTES = 4096
const isAnimatedWebpOrPng = async (file: File): Promise<boolean> => {
  if (file.type !== WEBP_TYPE && file.type !== PNG_TYPE) return false
  const head = new TextDecoder('latin1').decode(await file.slice(0, SNIFF_BYTES).arrayBuffer())
  return head.includes('ANIM') || head.includes('acTL')
}

//긴 변이 MAX_IMAGE_DIMENSION_PX를 넘으면 줄여서 JPEG로 변환 (GIF와 움직이는 WebP/APNG는 움직임이 사라지므로 원본 유지)
const resizeImage = async (file: File): Promise<Blob> => {
  if (file.type === GIF_TYPE || (await isAnimatedWebpOrPng(file))) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, RESIZED_IMAGE_TYPE, RESIZED_IMAGE_QUALITY),
  )
  return blob ?? file
}

//업로드 후 스토리지 경로를 반환. 경로의 첫 폴더는 내 id여야 RLS를 통과한다
export const uploadChatImage = async (myId: string, file: File): Promise<string> => {
  const body = await resizeImage(file)
  const extension = EXTENSION_BY_TYPE[body.type] ?? 'jpg'
  const path = `${myId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(CHAT_IMAGE_BUCKET).upload(path, body, { contentType: body.type })
  if (error) throw error
  return path
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export const fetchChatImageUrl = async (path: string): Promise<string> => {
  const cached = signedUrlCache.get(path)
  if (cached && cached.expiresAt - SIGNED_URL_CACHE_MARGIN_MS > Date.now()) return cached.url

  const { data, error } = await supabase.storage.from(CHAT_IMAGE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) throw error
  signedUrlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000 })
  return data.signedUrl
}
