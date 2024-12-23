<template>
  <div ref="playerContainer" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Artplayer from "artplayer";
import { ProgressManager } from "@/utils/progressManager";
import type { AlistFile } from "@/types/alist";
import flvjs from "flv.js";
import Hls from "hls.js";
const props = defineProps<{ courseFile: AlistFile }>();

const playerContainer = ref<HTMLDivElement | null>(null);
let player: Artplayer | null = null;
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

  player = new Artplayer({
    container: playerContainer.value,
    // 视频地址
    quality: props.courseFile.quantity,
    url: props.courseFile.download_url,
    // 开启自适应
    isLive: false,
    // 自动播放
    autoplay: true,
    // 播放器配置
    playbackRate: true,
    aspectRatio: true,
    // 快捷键
    hotkey: true,
    // 视频填充模式
    flip: true,
    // 播放器皮肤
    theme: "#409eff",
    // 语言
    lang: navigator.language.toLowerCase(),
    // 音量配置
    volume: 0.6,
    // 控制栏配置
    setting: true,
    // 画中画
    pip: true,
    // 截图
    screenshot: false,
    // 迷你进度条
    miniProgressBar: true,
    // 默认播放速率
    customType: {
      flv: function (video: HTMLMediaElement, url: string) {
        const flvPlayer = flvjs.createPlayer(
          {
            type: "flv",
            url: url,
          },
          { referrerPolicy: "same-origin" }
        );
        flvPlayer.attachMediaElement(video);
        flvPlayer.load();
      },
      m3u8: function (video: HTMLMediaElement, url: string) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        if (!video.src) {
          video.src = url;
        }
      },
    },
  });



  player.on('ready', () => {
    // 加载已保存的进度
    progressManager?.loadProgress(props.courseFile).then(() => {
      if (player && progressManager) {
        const savedProgress = progressManager.getVideoProgress();
        if (savedProgress) {
          player.seek = savedProgress?.currentTime || 0;
        }
      }
    });
  });

  // 监听播放进度
  player.on("video:timeupdate", () => {
    if (player && progressManager) {
      const currentTime = player.currentTime;
      const duration = player.duration;
      progressManager.updateProgress(currentTime, duration);
    }
  });

  // 监听错误事件
  player.on("error", (error) => {
    console.error("Video player error", error);
  });

  // 监听播放开始
  player.on("video:play", () => {
    if (progressManager) {
      progressManager.startAutoSync();
    }
  });

  // 监听播放结束
  player.on("video:ended", () => {
    if (progressManager) {
      progressManager.stopAutoSync();
    }
  });

  // 监听播放暂停
  player.on("video:pause", () => {
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
