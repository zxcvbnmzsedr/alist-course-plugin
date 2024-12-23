<template>
  <div class="h-screen flex flex-col w-screen">
    <div class="bg-white border-b border-gray-200 p-4 flex-between">
      <div class="flex items-center">
        <el-button @click="router.push('/')" class="mr-4">
          <el-icon>
            <ArrowLeft/>
          </el-icon>
          <span class="ml-1">返回课程列表</span>
        </el-button>
        <h2 class="text-xl font-semibold">{{ $route.params.courseName }}</h2>
      </div>
      <el-button type="primary" @click="router.push('/config')">
        <el-icon>
          <Setting/>
        </el-icon>
        <span class="ml-1">配置</span>
      </el-button>
    </div>

    <div class="flex-1 flex overflow-hidden h-full w-full overflow-y-auto">
      <div class="w-600px p-5 border-r border-gray-200 overflow-y-auto">
        <div class="mb-4 text-gray-500">当前目录：{{ coursePath }}/{{ $route.params.courseName }}</div>
        <div v-if="loading" class="flex-center py-20">
          <el-spinner/>
        </div>
        <el-tree
          v-else
          ref="treeRef"
          :data="treeData"
          :props="defaultProps"
          @node-click="handleNodeClick"
          :load="loadNode"
          lazy
          highlight-current
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <el-icon v-if="data.is_dir" class="mr-1">
                <Folder/>
              </el-icon>
              <el-icon v-else-if="isVideo(data)" class="mr-1">
                <VideoPlay/>
              </el-icon>
              <el-icon v-else class="mr-1">
                <Document/>
              </el-icon>
              <span :class="{ 'text-primary': isVideo(data) }">{{ node.label }}</span>
              <div v-if="isVideo(data) && progressStore.getVideoProgress(data.path)" class="ml-2">
                <el-progress
                  type="circle"
                  :percentage="getVideoPercentage(data.path)"
                  :width="16"
                  :stroke-width="3"
                  :show-text="false"
                  :status="progressStore.getVideoProgress(data.path)?.completed ? 'success' : ''"
                />
              </div>
            </div>
          </template>
        </el-tree>
      </div>
      <div class="flex-1 p-5 flex-center">
        <div v-if="selectedFile && isVideo(selectedFile)" class="w-full h-full">
          <video-player
            :course-file="selectedFile"
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
import {ref, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import VideoPlayer from '@/components/VideoPlayer.vue'
import {ElMessage} from 'element-plus'
import {ArrowLeft, Setting, Folder, Document, VideoPlay} from '@element-plus/icons-vue'
import {orderBy} from 'natural-orderby'
import type {AlistFile} from '@/types/alist'
import {getFileList, getFileInfo, getOtherVideoPreview} from '@/api/alist'
import {useProgressStore} from '@/stores/progressStore'
import type {quality} from "artplayer/types/quality";

interface ApiError {
  response?: {
    status: number;
  };
}

const router = useRouter()
const route = useRoute()
const treeRef = ref()
const treeData = ref<AlistFile[]>([])
const selectedFile = ref<AlistFile | null>(null)
const serverUrl = ref<string | null>(localStorage.getItem('alistServerUrl'))
const token = ref<string | null>(localStorage.getItem('alistToken'))
const coursePath = ref<string>(localStorage.getItem('alistCoursePath') || '')
const loading = ref(true)
const defaultProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data: AlistFile) => !data.is_dir
}

// 检查是否是视频文件
const isVideo = (file: AlistFile): boolean => {
  if (!file || !file.name) return false
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.m3u8']
  return videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}

// 检查认证状态
const checkAuth = () => {
  if (!serverUrl.value || !token.value || !coursePath.value) {
    router.push('/config')
    return false
  }
  return true
}

interface TreeNode {
  level: number
  data: AlistFile
  parent: TreeNode | null
}

// 获取完整路径
const getFullPath = (node: TreeNode): string => {
  if (node.level === 0) {
    return `/${coursePath.value}/${route.params.courseName}`
  }

  let path = ''
  let currentNode = node
  while (currentNode && currentNode.level > 0) {
    path = `/${currentNode.data.name}${path}`
    currentNode = currentNode.parent
  }
  return `/${coursePath.value}/${route.params.courseName}${path}`
}

// 加载节点数据
const loadNode = async (node: TreeNode, resolve: (data: AlistFile[]) => void) => {
  if (!checkAuth()) return

  try {
    const fullPath = getFullPath(node)
    const response = await getFileList(fullPath)

    // 为每个文件添加完整路径
    const files = response.data.content.map((file: AlistFile) => ({
      ...file,
      path: `${fullPath === '/' ? '' : fullPath}/${file.name}`
    }))

    // 排序文件列表
    const sortedFiles = orderBy(files, [
      // 首先按照是否是文件夹排序
      (item: AlistFile) => !item.is_dir,
      // 然后按照名称自然排序
      (item: AlistFile) => item.name
    ])

    resolve(sortedFiles)
  } catch (error) {
    if (error.response?.status === 401) {
      ElMessage.error('认证失败，请重新登录')
      router.push('/config')
    } else {
      ElMessage.error('获取文件列表失败')
      console.error('Error loading node:', error)
    }
    resolve([])
  }
}

// 处理节点点击
const handleNodeClick = async (data: AlistFile) => {
  if (!data.is_dir) {
    try {
      const response = await getFileInfo(data.path)
      const otherPreview = await getOtherVideoPreview(data.path)
      const quantity: quality[] = []
      let download_url = response.data.raw_url;
      if (otherPreview) {
        const live_transcoding = otherPreview.data?.video_preview_play_info?.live_transcoding_task_list?.map(it => {
          return {
            html: it.template_id,
            url: it.url
          }
        }) || []
        const lastLive = live_transcoding[live_transcoding.length - 1]
        lastLive.default = true
        // 浏览器有可能无法解码，所以优先使用在线进行解码
        download_url = lastLive.url
        quantity.push(live_transcoding)
      }
      quantity.push({
        html: '原画',
        url: response.data.raw_url
      })
      selectedFile.value = {
        ...data,
        download_url: download_url,
        quantity: quantity
      }
    } catch (error) {
      ElMessage.error('获取文件信息失败')
      console.error('Error getting file info:', error)
    }
  }
}

// 初始化根节点数据
const initRootNode = async () => {
  if (!checkAuth()) return

  try {
    loading.value = true
    const rootPath = `/${coursePath.value}/${route.params.courseName}`
    const response = await getFileList(rootPath)

    treeData.value = response.data.content.map((file: AlistFile) => ({
      ...file,
      path: `${rootPath}/${file.name}`
    }))
  } catch (error: unknown) {
    if ((error as ApiError).response?.status === 401) {
      ElMessage.error('认证失败，请重新登录')
      router.push('/config')
    } else {
      ElMessage.error('获取文件列表失败')
      console.error('Error loading data:', error)
    }
  } finally {
    loading.value = false
  }
}


// 获取视频进度百分比
const getVideoPercentage = (path: string): number => {
  const progress = progressStore.getVideoProgress(path)
  if (!progress) return 0
  return Math.round((progress.currentTime / progress.duration) * 100)
}
const progressStore = useProgressStore()
const initProgressStore = async () => {
  const rootPath = `/${coursePath.value}/${route.params.courseName}`
  await progressStore.changeCourse(rootPath)
}

onMounted(async () => {
  await initProgressStore()
  await initRootNode()
})
</script>

<style>
.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.text-primary {
  color: var(--el-color-primary);
}

:deep(.el-progress-circle) {
  vertical-align: middle;
}
</style>
