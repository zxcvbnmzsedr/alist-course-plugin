import axios from 'axios'
// AList API 基础配置
const alistApi = axios.create({
  baseURL: 'http://localhost:5244',
  timeout: 10000
})

// 请求拦截器
alistApi.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    config.baseURL = localStorage.getItem('alistServerUrl') || ''
    config.headers.Authorization = localStorage.getItem('alistToken') || ''
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
alistApi.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    return response
  },
  error => {
    // 对响应错误做点什么
    return Promise.reject(error)
  }
)

// 获取文件列表
export const getFileList = async (path = '/') => {
  try {
    const response = await alistApi.post('/api/fs/list', {
      path,
      password: ''
    })
    return response.data
  } catch (error) {
    console.error('获取文件列表失败:', error)
    throw error
  }
}

// 获取文件信息
export const getFileInfo = async (path: string) => {
  try {
    const response = await alistApi.post('/api/fs/get', {
      path,
      password: ''
    })
    return response.data
  } catch (error) {
    console.error('获取文件信息失败:', error)
    throw error
  }
}

// 获取下载链接
export const getDownloadUrl = async (path: string) => {
  try {
    const response = await alistApi.post('/api/fs/link', {
      path,
      password: ''
    })
    return response.data
  } catch (error) {
    console.error('获取下载链接失败:', error)
    throw error
  }
}
// axios.post(`${config.value.serverUrl}/api/auth/login`
export const login = async (username: string, password: string) => {
  const response = await alistApi.post(`/api/auth/login`, {
    username,
    password
  })
  return response.data
}

export const putFile = async (path: string, file: any) => {
  const response = await alistApi.put(`/api/fs/form`, file, {
    headers: {
      'File-Path': encodeURIComponent(path)
    }
  })
  return response.data
}
