<template>
  <div>
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
      node-key="path"
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
          <div v-if="isVideo(data) || data.is_dir" class="ml-2 flex items-center">
            <el-progress
              v-if="getNodeProgress(data)"
              type="circle"
              :percentage="getNodeProgress(data)"
              :width="16"
              :stroke-width="3"
              :show-text="false"
              :status="isNodeCompleted(data) ? 'success' : ''"
            />
            <el-button
              v-if="!isNodeCompleted(data) && !data.is_dir"
              size="small"
              type="primary"
              class="mark-complete-btn opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              link
              @click.stop="markAsCompleted(data)"
            >
              已看完
            </el-button>
          </div>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, watch} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Folder, Document, VideoPlay} from '@element-plus/icons-vue'
import {orderBy} from 'natural-orderby'
import type {AlistFile} from '@/types/alist'
import {getFileList} from '@/api/alist'
import {useProgressStore} from '@/stores/progressStore'
import {isVideo} from '@/utils/filetype'
import type { TreeInstance } from 'element-plus'

interface Props {
  coursePath: string
  courseName: string
  selectedFile?: AlistFile | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'fileSelected', file: AlistFile): void
  (e: 'updateVideoFiles', files: AlistFile[]): void
}>()

const router = useRouter()
const treeRef = ref<TreeInstance>()
const treeData = ref<AlistFile[]>([])
const loading = ref(true)
const defaultProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data: AlistFile) => !data.is_dir
}


// 检查认证状态
const checkAuth = () => {
  const serverUrl = localStorage.getItem('alistServerUrl')
  const token = localStorage.getItem('alistToken')
  if (!serverUrl || !token || !props.coursePath) {
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

interface ApiError {
  response?: {
    status: number;
  };
}

// 获取完整路径
const getFullPath = (node: TreeNode): string => {
  if (node.level === 0) {
    return `/${props.coursePath}/${props.courseName}`
  }

  let path = ''
  let currentNode: TreeNode | null = node
  while (currentNode && currentNode.level > 0) {
    path = `/${currentNode.data.name}${path}`
    currentNode = currentNode.parent
  }
  return `/${props.coursePath}/${props.courseName}${path}`
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
    progressStore.initDirChildProcess(sortedFiles)
    emit('updateVideoFiles', sortedFiles)
    resolve(sortedFiles)
  } catch (error: unknown) {
    if ((error as ApiError).response?.status === 401) {
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
  console.log('handleNodeClick', { data })
  if (!data.is_dir) {
    emit('fileSelected', data)
  }
}

// 获取视频进度百分比
const progressStore = useProgressStore()
const getVideoPercentage = (path: string): number => {
  const progress = progressStore.getVideoProgress(path)
  if (!progress) return 0
  if (progress.completed) return 100
  return Math.round(((progress.currentTime || 0) / (progress.duration || 0)) * 100)
}

// 获取节点（文件或目录）的进度
const getNodeProgress = (data: AlistFile): number => {
  if (data.is_dir) {
    return progressStore.getDirProgress(data.path)
  }
  return getVideoPercentage(data.path)
}

// 检查节点是否完成
const isNodeCompleted = (data: AlistFile): boolean => {
  if (data.is_dir) {
    return progressStore.getDirProgress(data.path) === 100
  }
  const progress = progressStore.getVideoProgress(data.path)
  return progress?.completed || false
}


// 初始化根节点数据
const initRootNode = async () => {
  if (!checkAuth()) return

  try {
    loading.value = true
    const rootPath = `/${props.coursePath}/${props.courseName}`
    const response = await getFileList(rootPath)

    const files = response.data.content.map((file: AlistFile) => ({
      ...file,
      path: `${rootPath}/${file.name}`
    }))
    treeData.value = files
    emit('updateVideoFiles', files)
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

const initProgressStore = async () => {
  const rootPath = `/${props.coursePath}/${props.courseName}`
  progressStore.changeCourse(rootPath)
}

const setCurrentNode = (file: AlistFile) => {
  if (!treeRef.value) return

  // Find the node that matches the file path
  treeRef.value.setCurrentKey(file.path)
}

// Add this watch to handle external file changes
watch(() => props.selectedFile, (newFile) => {
  if (newFile) {
    setCurrentNode(newFile)
  }
}, { immediate: true })

// 添加标记完成的方法
const markAsCompleted = (data: AlistFile) => {
  let progress = progressStore.getVideoProgress(data.path)
  if (!progress) {
    progress = {
      path: data.path,
      currentTime: 0,
      duration: 0,
      completed: true
    }
  } else {
    progress.completed = true
  }
  progressStore.updateVideoProgress(data.path, progress)
  progressStore.saveProgress()
}

onMounted(async () => {
  await initProgressStore()
  await initRootNode()
})
</script>

<style scoped>
.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
  width: 100%;
  padding: 2px;
}

.custom-tree-node:hover {
  background-color: var(--el-fill-color-light);
}

.text-primary {
  color: var(--el-color-primary);
}

:deep(.el-progress-circle) {
  vertical-align: middle;
}

.mark-complete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-tree-node:hover .mark-complete-btn {
  opacity: 100;
}
</style>
