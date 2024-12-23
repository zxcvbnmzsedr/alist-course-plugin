import { defineStore } from 'pinia'
import { ref } from 'vue'
import { putFile, getFileInfo } from '@/api/alist'
import type { CourseProgress, VideoProgress } from '@/types/progress'
const PROGRESS_FILE = '.course_progress.json'
import {isVideo} from '@/utils/filetype'
import type { AlistFile } from '@/types/alist'
export const useProgressStore = defineStore('progress', () => {
  const state = ref<CourseProgress>({
    version: '1.0.0',
    coursePath: '',
    courseRootPath: '',
    videos: {},
    dirProgress: {}
  })
  const changeCourse = (courseRootPath: string) => {
    state.value.courseRootPath = courseRootPath
    initialize()
  }
  const initialize = async () => {
    try {
      const response = await getFileInfo(`${state.value.courseRootPath}/${PROGRESS_FILE}`)
      if (response.code === 200) {
        const content = await fetch(response.data.raw_url).then(res => res.json())
        state.value = {
          ...state.value,
          ...content,
        }
      }
    } catch (error) {
      console.log('Progress file not found, using default state', error)
    }
  }

  const getVideoProgress = (path: string): VideoProgress | null => {
    return state.value.videos[path] || null
  }

  const updateVideoProgress = (path: string, progress: VideoProgress) => {
    state.value.videos[path] = progress
    // 获取当前目录的父级别目录
    const dirPath = path.split('/').slice(0, -1).join('/')
    // 寻找当前父级别目录下的所有视频进度
    const dirVideos = Object.values(state.value.videos).filter(video => video.path.startsWith(dirPath))
    // 计算当前目录下的视频进度, 已完成的视频数量 / 视频总数
    const dirProgress = dirVideos.filter(video => video.completed).length / dirVideos.length
    state.value.dirProgress[dirPath] = dirProgress
  }

  const saveProgress = async () => {
    try {

      const content = JSON.stringify(state.value, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const formData = new FormData()
      formData.append('file', blob, PROGRESS_FILE)
      await putFile(`${state.value.courseRootPath}/${PROGRESS_FILE}`, formData)
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }
  const getDirProgress = (path: string): number => {
    return (state.value.dirProgress[path] || 0) * 100
  }
  const initDirChildProcess = (paths: AlistFile[]) => {
    // 初始化目录下的视频文件的信息，查看path是否在state.value.videos中，
    // 如果不在，则初始化一个VideoProgress对象，并添加到state.value.videos中
    paths.forEach(path => {
      if (isVideo(path)) {
        if (!state.value.videos[path.path]) {
          state.value.videos[path.path] = {
            completed: false,
            path: path.path,
          }
        }
      }
    })
    saveProgress()
  }

  return {
    state,
    changeCourse,
    getVideoProgress,
    updateVideoProgress,
    saveProgress,
    getDirProgress,
    initDirChildProcess
  }
})
