<template>
  <div ref="playerContainer" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Artplayer from "artplayer";
import { ProgressManager } from "@/utils/progressManager";
import type { AlistFile } from "@/types/alist";
import { getFileInfo, getOtherVideoPreview } from '@/api/alist'
import { ElMessage } from 'element-plus'
import flvjs from "flv.js";
import Hls from "hls.js";
import type { quality } from "artplayer/types/quality";

const props = defineProps<{
  courseFile: AlistFile;
  previousVideo: AlistFile | null;
  nextVideo: AlistFile | null;
}>();

const emit = defineEmits<{
  (e: "update:courseFile", file: AlistFile): void;
}>();

const playerContainer = ref<HTMLDivElement | null>(null);
let player: Artplayer | null = null;
let progressManager: ProgressManager | null = null;

const createPlayer = async (file: AlistFile) => {
  if (!playerContainer.value) return;

  // 销毁旧的播放器实例
  if (player) {
    player.destroy();
    player = null;
  }

  try {
    // 获取视频文件信息
    const response = await getFileInfo(file.path)
    const otherPreview = await getOtherVideoPreview(file.path)
    const quantity: Array<quality> = []
    let download_url = response.data.raw_url;

    if (otherPreview) {
      interface TranscodingTask {
        template_id: string;
        url: string;
      }
      const live_transcoding = otherPreview.data?.video_preview_play_info?.live_transcoding_task_list?.map((it: TranscodingTask) => ({
        html: it.template_id,
        url: it.url
      })) || []
      const lastLive = live_transcoding[live_transcoding.length - 1]
      if (lastLive) {
        lastLive.default = true
        // 浏览器有可能无法解码，所以优先使用在线进行解码
        download_url = lastLive.url
        quantity.push(...live_transcoding)
      }
    }
    quantity.push({
      html: '原画',
      url: response.data.raw_url
    })

    // 创建进度管理器
    progressManager = new ProgressManager(file);

    // 创建自定义控制按钮
    const prevButton = {
      position: "right",
      html: '上一集',
      click: function () {
        if (props.previousVideo) {
          updateCourseFile(props.previousVideo);
        }
      },
      tooltip: "上一集",
      style: {
        opacity: props.previousVideo ? "1" : "0.5",
        cursor: props.previousVideo ? "pointer" : "not-allowed",
      },
    };

    const nextButton = {
      position: "right",
      html: '下一集',
      click: function () {
        if (props.nextVideo) {
          updateCourseFile(props.nextVideo);
        }
      },
      tooltip: "下一集",
      style: {
        opacity: props.nextVideo ? "1" : "0.5",
        cursor: props.nextVideo ? "pointer" : "not-allowed",
      },
    };

    player = new Artplayer({
      container: playerContainer.value,
      quality: quantity,
      url: download_url,
      isLive: false,
      autoplay: true,
      playbackRate: true,
      aspectRatio: true,
      hotkey: true,
      flip: true,
      theme: "#409eff",
      lang: navigator.language.toLowerCase(),
      volume: 0.6,
      setting: true,
      pip: true,
      screenshot: false,
      miniProgressBar: true,
      controls: [prevButton, nextButton],
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

    player.on("ready", () => {
      progressManager?.loadProgress(file).then(() => {
        if (player && progressManager) {
          const savedProgress = progressManager.getVideoProgress();
          if (savedProgress) {
            player.seek = savedProgress?.currentTime || 0;
          }
        }
      });
    });

    player.on("video:timeupdate", () => {
      if (player && progressManager) {
        const currentTime = player.currentTime;
        const duration = player.duration;
        progressManager.updateProgress(currentTime, duration);
      }
    });

    player.on("error", (error) => {
      console.error("Video player error", error);
    });

    player.on("video:play", () => {
      if (progressManager) {
        progressManager.startAutoSync();
      }
    });

    player.on("video:ended", () => {
      if (progressManager) {
        progressManager.stopAutoSync();
      }
    });

    player.on("video:pause", () => {
      if (progressManager) {
        progressManager.stopAutoSync();
      }
    });
  } catch (error: unknown) {
    ElMessage.error('获取视频信息失败')
    console.error('Error getting video info:', error)
  }
};

const updateCourseFile = (file: AlistFile) => {
  emit("update:courseFile", file);
};

// 监听 courseFile 变化
watch(
  () => props.courseFile,
  (newCourseFile) => {
    if (newCourseFile) {
      createPlayer(newCourseFile);
    }
  }
);

onMounted(() => {
  if (props.courseFile) {
    createPlayer(props.courseFile);
  }
});

onBeforeUnmount(() => {
  if (player) {
    if (progressManager) {
      progressManager.stopAutoSync();
    }
    player.destroy();
    player = null;
  }
});
</script>
