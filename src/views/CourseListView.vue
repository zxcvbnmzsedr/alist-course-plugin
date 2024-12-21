<template>
  <div class="h-screen w-screen overflow-hidden bg-gray-50">
    <div class="h-full w-full overflow-y-auto p-8">
      <div class="max-w-7xl mx-auto">
        <div class="mb-6 flex-between">
          <h2 class="text-2xl font-bold">课程列表</h2>
          <el-button type="primary" @click="goToConfig">
            <el-icon><Setting /></el-icon>
            <span class="ml-1">配置</span>
          </el-button>
        </div>

        <div v-if="loading" class="flex-center py-20">
          <el-spinner />
        </div>

        <div v-else-if="courses.length === 0" class="flex-center py-20">
          <el-empty description="暂无课程" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="course in courses"
            :key="course.name"
            class="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300"
            @click="enterCourse(course)"
          >
            <div class="aspect-video bg-gradient-to-r from-blue-500 to-indigo-600 flex-center">
              <el-icon class="text-5xl text-white"><Folder /></el-icon>
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 truncate">{{ course.name }}</h3>
              <p class="text-sm text-gray-500 mt-2">
                修改时间: {{ new Date(course.modified).toLocaleDateString() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Setting, Folder } from '@element-plus/icons-vue'
import type { AlistFile } from '@/types/alist'
import { getFileList } from '@/api/alist'
import { useProgressStore } from '@/stores/progressStore'
const router = useRouter()
const courses = ref<AlistFile[]>([])
const loading = ref(true)

const serverUrl = localStorage.getItem('alistServerUrl')
const token = localStorage.getItem('alistToken')
const coursePath = localStorage.getItem('alistCoursePath')

// 检查配置
const checkConfig = () => {
  if (!serverUrl || !token || !coursePath) {
    router.push('/config')
    return false
  }
  return true
}

// 加载课程列表
const loadCourses = async () => {
  if (!checkConfig()) return

  try {
    const response = await getFileList(`/${coursePath}`)
    // 只保留文件夹
    courses.value = response.data.content.filter((item: AlistFile) => item.is_dir)
  } catch (error) {
    console.error('Failed to load courses:', error)
    ElMessage.error('加载课程列表失败')
  } finally {
    loading.value = false
  }
}

// 进入课程
const enterCourse = (course: AlistFile) => {
  // 初始化process store
  router.push({
    name: 'course',
    params: { courseName: course.name }
  })
}

// 前往配置页面
const goToConfig = () => {
  router.push('/config')
}

onMounted(() => {
  loadCourses()
})
</script>
