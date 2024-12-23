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
          <div v-if="(isVideo(data) || data.is_dir) && getNodeProgress(data)" class="ml-2">
            <el-progress
              type="circle"
              :percentage="getNodeProgress(data)"
              :width="16"
              :stroke-width="3"
              :show-text="false"
              :status="isNodeCompleted(data) ? 'success' : ''"
            />
          </div>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Folder, Document, VideoPlay} from '@element-plus/icons-vue'
import {orderBy} from 'natural-orderby'
import type {AlistFile} from '@/types/alist'
import {getFileList} from '@/api/alist'
import {useProgressStore} from '@/stores/progressStore'
import {isVideo} from '@/utils/filetype'

interface Props {
  coursePath: string
  courseName: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'fileSelected', file: AlistFile): void
  (e: 'updateVideoFiles', files: AlistFile[]): void
}>()

const router = useRouter()
const treeRef = ref()
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

// ���取视频进度百分比
const progressStore = useProgressStore()
const getVideoPercentage = (path: string): number => {
  const progress = progressStore.getVideoProgress(path)
  if (!progress) return 0
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
      ElMessage.error('认证失败��请重新登录')
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
}

.text-primary {
  color: var(--el-color-primary);
}

:deep(.el-progress-circle) {
  vertical-align: middle;
}
</style>
