<template>
  <div ref="playerContainer" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";
import { ProgressManager } from '@/utils/progressManager';
import type { AlistFile } from '@/types/alist';

const props = defineProps<{courseFile: AlistFile}>();

const playerContainer = ref<HTMLElement | null>(null);
let player: Player | null = null;
let progressManager: ProgressManager | null = null;

const createPlayer = () => {
  if (!playerContainer.value) return;

  // 销毁旧的播放器实例
  if (player) {
    player.destroy();
    player = null;
  }

  // 创建进度管理器
  progressManager = new ProgressManager(props.courseFile);

  player = new Player({
    el: playerContainer.value,
    url: props.courseFile.download_url,
    // 开启自适应
    fluid: true,
    // 自动播放
    autoplay: false,
    // 视频封面
    poster: "",
    // 播放器配置
    playbackRate: [0.5, 0.75, 1, 1.5, 2],
    defaultPlaybackRate: 1,
    // 快捷键
    keyShortcut: true,
    // 预加载
    preload: "auto",
    // 视频填充模式
    objectFit: "contain",
    // 自定义请求配置
    fetchOptions: {
      credentials: "omit", // 不发送凭证
      referrerPolicy: "no-referrer",
    },
    // 播放器皮肤
    theme: "#409eff",
    // 语言
    lang: "zh-cn",
    // 音量配置
    volume: 0.6,
    // 控制栏配置
    controls: {
      // 播放器底部控制栏配置
      bottom: true,
      // 播放器顶部控制栏配置
      top: true,
      // 是否显示进度条预览
      progressPreview: true,
      // 是否显示时间提示
      timePreview: true,
      // 是否显示播放时间
      playbackTime: true,
      // 是否显示总时间
      totalTime: true,
      // 是否显示音量控制
      volume: true,
      // 是否显示播放速率控制
      playbackRate: true,
      // 是否显示画质切换
      quality: false,
      // 是否显示全屏按钮
      fullscreen: true,
      // 是否显示画中画按钮
      pip: true,
      // 是否显示截图按钮
      screenshot: false,
      // 是否显示设置按钮
      setting: true,
      // 是否显示迷你进度条
      miniProgress: true,
    },
  });

  // 加载已保存的进度
  progressManager.loadProgress(props.courseFile).then(() => {
    if (player && progressManager) {
      const savedProgress = progressManager.getVideoProgress();
      if (savedProgress) {
        player.currentTime = savedProgress.currentTime;
      }
    }
  });

  // 监听播放进度
  player.on('timeupdate', () => {
    if (player && progressManager) {
      const currentTime = player.currentTime;
      const duration = player.duration;
      progressManager.updateProgress(currentTime, duration);
    }
  });

  // 监听错误事件
  player.on("error", (e) => {
    console.error("Video player error", e);
  });
  // 监听播放开始
  player.on('play', () => {
    if (progressManager) {
      progressManager.startAutoSync();
    }
  });
  // 监听播放结束
  player.on('ended', () => {
    if (progressManager) {
      progressManager.stopAutoSync();
    }
  });
  // 监听播放暂停
  player.on('pause', () => {
    if (progressManager) {
      progressManager.stopAutoSync();
    }
  });
};

// 监听 src 变化
watch(
  () => props.courseFile,
  (newCourseFile) => {
    if (newCourseFile) {
      createPlayer();
    }
  }
);

onMounted(() => {
  if (props.courseFile) {
    createPlayer();
  }
});

onBeforeUnmount(() => {
  if (player) {
    // 停止进度同步并销毁播放器
    if (progressManager) {
      progressManager.stopAutoSync();
    }
    player.destroy();
    player = null;
  }
});
</script>
