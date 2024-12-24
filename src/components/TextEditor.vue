<template>
  <div class="h-full relative flex flex-col">
    <!-- 工具栏 -->
    <div class="bg-gray-800 p-2 flex items-center gap-2">
      <el-button
        type="primary"
        size="small"
        :loading="saving"
        @click="saveContent"
      >
        <el-icon class="mr-1"><Document /></el-icon>
        保存
      </el-button>
      <span v-if="lastSaved" class="text-gray-400 text-sm">
        上次保存: {{ lastSaved }}
      </span>
    </div>

    <!-- 编辑器区域 -->
    <div class="flex-1 relative">
      <div v-if="loading" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <el-loading />
      </div>
      <monaco-editor
        :value="content"
        @update:value="handleChange"
        :language="getLanguage()"
        theme="vs-dark"
        class="h-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MonacoEditor from 'monaco-editor-vue3';
import type { AlistFile } from '@/types/alist';
import { useAlistStore } from '@/stores/alist';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';

const props = defineProps<{
  courseFile: AlistFile
}>();

const content = ref('222');

const alistStore = useAlistStore();
const loading = ref(false);
const saving = ref(false);
const lastSaved = ref<string>('');
const hasUnsavedChanges = ref(false);

function getLanguage() {
  const ext = props.courseFile.name.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'vue': 'vue',
    // 添加更多文件类型映射
  };
  return languageMap[ext || ''] || 'plaintext';
}

onMounted(async () => {
  try {
    loading.value = true;
    const response = await alistStore.fetchFileContent(props.courseFile.path);
    content.value = response;
  } catch (error) {
    ElMessage.error('获取文件内容失败');
    console.error('Failed to fetch file content:', error);
  } finally {
    loading.value = false;
  }
});

const handleChange = (newValue: string) => {
  content.value = newValue;
  hasUnsavedChanges.value = true;
};

const saveContent = async () => {
  if (!hasUnsavedChanges.value) {
    ElMessage.info('没有需要保存的更改');
    return;
  }

  try {
    saving.value = true;
    await alistStore.saveFileContent(props.courseFile.path, content.value);
    hasUnsavedChanges.value = false;
    lastSaved.value = new Date().toLocaleTimeString();
    ElMessage.success('文件保存成功');
  } catch (error) {
    ElMessage.error('保存文件失败');
    console.error('Failed to save file:', error);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveContent();
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveContent();
    }
  });
});
</script>

<style scoped>
.el-button {
  display: inline-flex;
  align-items: center;
}
</style>
