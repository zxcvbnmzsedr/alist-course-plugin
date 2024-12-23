import type { VideoProgress } from '@/types/progress'
import { useProgressStore } from '@/stores/progressStore'
import type { AlistFile } from '@/types/alist'
export class ProgressManager {
  private courseFile: AlistFile
  private syncTimer: number | null = null
  private progressStore

  constructor(courseFile: AlistFile) {
    this.courseFile = courseFile
    this.progressStore = useProgressStore()
  }

  // 加载进度文件
  async loadProgress(courseFile: AlistFile): Promise<void> {
    this.courseFile = courseFile
  }


  // 更新视频进度
  async updateProgress(currentTime: number, duration: number): Promise<void> {
    const completed = currentTime >= duration - 15 // 剩余5秒以内视为看完
    const path = this.courseFile.path
    // 确保路径作为键值存在
    const videoProgress: VideoProgress = {
      path,
      currentTime,
      duration,
      lastUpdated: Date.now(),
      completed
    }
    this.progressStore.updateVideoProgress(path, videoProgress)

  }

  // 获取视频进度
  getVideoProgress(): VideoProgress | null {
    const path = this.courseFile.path
    return this.progressStore.getVideoProgress(path)
  }

  // 开始自动同步
  startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = window.setInterval(async () => {
      this.progressStore.saveProgress()
    }, 5000) // 修改为每5秒同步一次
  }

  // 停止自动同步
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      this.progressStore.saveProgress()
    }
  }


}
