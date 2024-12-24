import type{ AlistFile } from '@/types/alist'

export const isVideo = (file: AlistFile): boolean => {
  if (!file || !file.name) return false
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.m3u8']
  return videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}

export function isText(file: AlistFile): boolean {
  const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.html', '.css', '.vue', '.py', '.java', '.cpp', '.c', '.h'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  return textExtensions.includes(ext);
}
