<template>
  <div class="h-screen w-screen overflow-hidden flex-center bg-gray-50">
    <el-card class="w-500px">
      <template #header>
        <div class="flex-between">
          <h2 class="m-0">Alist 配置</h2>
        </div>
      </template>

      <el-form :model="config" label-width="120px">
        <el-form-item label="服务器地址">
          <el-input v-model="config.serverUrl" placeholder="请输入Alist服务器地址，例如: http://localhost:5244" />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input v-model="config.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="config.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="课程路径">
          <el-input v-model="config.coursePath" placeholder="请输入课程路径，例如: /课程/前端开发">
            <template #prepend>/</template>
          </el-input>
          <div class="mt-1 text-gray-400 text-sm">相对路径，例如：课程/前端开发</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/alist'

const router = useRouter()
const config = ref({
  serverUrl: localStorage.getItem('alistServerUrl') || '',
  username: localStorage.getItem('alistUsername') || '',
  password: localStorage.getItem('alistPassword') || '',
  coursePath: localStorage.getItem('alistCoursePath') || ''
})

const formatPath = (path: string): string => {
  // 移除开头的斜杠
  path = path.replace(/^\/+/, '')
  // 移除结尾的斜杠
  path = path.replace(/\/+$/, '')
  return path
}

const saveConfig = async () => {
  if (!config.value.serverUrl) {
    ElMessage.error('请输入服务器地址')
    return
  }

  if (!config.value.username || !config.value.password) {
    ElMessage.error('请输入用户名和密码')
    return
  }

  if (!config.value.coursePath) {
    ElMessage.error('请输入课程路径')
    return
  }

  try {
    // 格式化课程路径
    config.value.coursePath = formatPath(config.value.coursePath)
    localStorage.setItem('alistServerUrl', config.value.serverUrl)
    localStorage.setItem('alistUsername', config.value.username)
    localStorage.setItem('alistPassword', config.value.password)

    // 尝试登录获取token
    const response = await login(config.value.username, config.value.password)
    if (response.code === 200) {
      // 保存配置和token
      localStorage.setItem('alistCoursePath', config.value.coursePath)
      localStorage.setItem('alistToken', response.data.token)
      ElMessage.success('配置保存成功')
      router.push('/')
    } else {
      ElMessage.error(response.data.message || '登录失败')
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('登录失败，请检查服务器地址和账号密码是否正确')
  }
}
</script>
