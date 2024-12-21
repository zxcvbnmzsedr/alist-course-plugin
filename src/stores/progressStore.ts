import { defineStore } from 'pinia'
import { ref } from 'vue'
import { putFile, getFileInfo } from '@/api/alist'
import type { CourseProgress, VideoProgress } from '@/types/progress'
const PROGRESS_FILE = '.course_progress.json'

export const useProgressStore = defineStore('progress', () => {
  const state = ref<CourseProgress>({
    version: '1.0.0',
    coursePath: '',
    courseRootPath: '',
    videos: {}
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

  return {
    state,
    changeCourse,
    getVideoProgress,
    updateVideoProgress,
    saveProgress
  }
})
