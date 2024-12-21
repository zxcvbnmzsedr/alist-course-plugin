<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import 'element-plus/dist/index.css'
</script>

<style>
html, body {
  @apply m-0 p-0 h-full w-full overflow-hidden;
}

#app {
  @apply h-screen w-screen overflow-hidden;
}
</style>
