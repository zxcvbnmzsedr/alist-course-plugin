<template>
  <div class="h-screen flex flex-col w-screen bg-white">
    <el-page-header class="border-b p-4" @back="router.push('/')" title="返回课程列表">
      <template #content>
        {{ courseName }}
      </template>
      <template #extra>
        <el-button @click="drawerVisible = true" class="mr-2">
          <el-icon><Menu /></el-icon>
          <span class="ml-1">目录</span>
        </el-button>
        <el-button type="primary" @click="router.push('/config')">
          <el-icon>
            <Setting/>
          </el-icon>
          <span class="ml-1">配置</span>
        </el-button>
      </template>
    </el-page-header>

    <div class="flex-1 flex overflow-hidden h-full w-full overflow-y-auto">
      <el-drawer
        v-model="drawerVisible"
        title="课程目录"
        :size="650"
      >
        <course-directory
          :course-path="coursePath"
          :course-name="courseName"
          @file-selected="selectedFile = $event"
          @update-video-files="updateVideoFiles"
        />
      </el-drawer>
      <div class="flex-1 p-5 flex-center">
        <div v-if="selectedFile && isVideo(selectedFile)" class="w-full h-full">
          <video-player
            v-model:course-file="selectedFile"
            :previous-video="getPreviousVideo(selectedFile)"
            :next-video="getNextVideo(selectedFile)"
            @update:courseFile="updateCourseFile"
            class="vjs-custom-skin"
            ref="videoPlayer"
          />
        </div>
        <div v-else class="flex-center h-full">
          <el-empty description="请选择视频文件进行播放"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import VideoPlayer from '@/components/VideoPlayer.vue'
import CourseDirectory from '@/components/CourseDirectory.vue'
import {Setting, Menu} from '@element-plus/icons-vue'
import type {AlistFile} from '@/types/alist'
import {isVideo} from '@/utils/filetype'

const router = useRouter()
const route = useRoute()
const selectedFile = ref<AlistFile | null>(null)
const coursePath = ref<string>(localStorage.getItem('alistCoursePath') || '')
const drawerVisible = ref(true)
const videoFiles = ref<AlistFile[]>([])

// 获取上一个视频文件
const getPreviousVideo = (currentFile: AlistFile): AlistFile | null => {
  console.log('getPreviousVideo called', { currentFile, videoFiles: videoFiles.value })
  const currentIndex = videoFiles.value.findIndex(file => file.name === currentFile.name)
  console.log('currentIndex', currentIndex)
  if (currentIndex > 0) {
    return videoFiles.value[currentIndex - 1]
  }
  return null
}

const updateCourseFile = (file: AlistFile) => {
  selectedFile.value = file
}

// 获取下一个视频文件
const getNextVideo = (currentFile: AlistFile): AlistFile | null => {
  console.log('getNextVideo called', { currentFile, videoFiles: videoFiles.value })
  const currentIndex = videoFiles.value.findIndex(file => file.name === currentFile.name)
  console.log('currentIndex', currentIndex)
  if (currentIndex < videoFiles.value.length - 1) {
    return videoFiles.value[currentIndex + 1]
  }
  return null
}

// 更新视频文件列表
const updateVideoFiles = (files: AlistFile[]) => {
  console.log('updateVideoFiles called', { files })
  videoFiles.value = files.filter(file => isVideo(file))
  console.log('filtered videoFiles', videoFiles.value)
}

const courseName = computed(() => {
  const name = route.params.courseName
  return typeof name === 'string' ? name : name[0] || ''
})
</script>

<style>
.text-primary {
  color: var(--el-color-primary);
}
</style>
