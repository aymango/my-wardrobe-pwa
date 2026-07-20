import { supabase, STORAGE_BUCKET } from './supabase'

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export async function uploadBlob(userId: string, folder: 'clothes' | 'ideas' | 'outfits', blob: Blob, extension: string): Promise<string> {
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type
  })
  if (error) throw error
  return path
}

export async function removeStorageFiles(paths: Array<string | null | undefined>): Promise<void> {
  const cleanPaths = paths.filter((path): path is string => Boolean(path))
  if (!cleanPaths.length) return
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(cleanPaths)
  if (error) console.warn('Storage cleanup failed:', error.message)
  cleanPaths.forEach((path) => signedUrlCache.delete(path))
}

export async function getSignedUrl(path?: string | null, expiresIn = 60 * 60): Promise<string> {
  if (!path) return ''
  const cached = signedUrlCache.get(path)
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  signedUrlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + expiresIn * 1000 })
  return data.signedUrl
}

export async function downloadBlob(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path)
  if (error) throw error
  return data
}
