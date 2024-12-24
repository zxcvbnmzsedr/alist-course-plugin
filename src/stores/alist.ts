import { defineStore } from 'pinia';
import { getFileInfo, putText } from '@/api/alist';

export const useAlistStore = defineStore('alist', {
  state: () => ({
    // ... existing state
  }),

  actions: {
    async fetchFileContent(path: string): Promise<string> {
      const response = await getFileInfo(path);
      // 获取文件内容
      const rawUrl = response.data.raw_url;
      const content = await fetch(rawUrl).then(res => res.text());
      return content;
    },

    async saveFileContent(path: string, content: string): Promise<void> {
      await putText(path, content);
    },
  },
});
