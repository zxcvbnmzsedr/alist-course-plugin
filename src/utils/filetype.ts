import type{ AlistFile } from '@/types/alist'

export const isVideo = (file: AlistFile): boolean => {
  if (!file || !file.name) return false
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.m3u8']
  return videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}
