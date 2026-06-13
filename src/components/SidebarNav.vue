<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const emit = defineEmits<{ closeSidebar: [] }>()
const router = useRouter()
const route = useRoute()

// 频道定义
const CHANNELS = [
  { id: '',      label: '全部',    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { id: '杂谈',  label: '杂谈频道' },
  { id: '技术',  label: '技术频道' },
  { id: '美术',  label: '美术频道' },
  { id: '音乐',  label: '音乐频道' },
  { id: '媒体',  label: '媒体频道' },
  { id: '游戏',  label: '游戏频道' },
  { id: '公告',  label: '公告' },
]

const activeChannel = ref((route.query.channel as string) || '')

function selectChannel(channelId: string) {
  activeChannel.value = channelId
  const query = { ...route.query }
  if (channelId) {
    query.channel = channelId
  } else {
    delete query.channel
  }
  router.push({ path: '/', query })
  emit('closeSidebar')
}

function openEditor() {
  router.push('/editor')
  emit('closeSidebar')
}
</script>

<template>
  <aside
    class="border-default-200 sticky top-[57px] flex h-[calc(100vh-57px)] min-w-0 flex-col border-r bg-default-100/90 backdrop-blur-sm"
  >
    <!-- 频道导航 -->
    <div class="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-hide">
      <p class="text-default-400 mb-2 px-2 text-xs font-semibold tracking-wide uppercase">频道</p>
      <button
        v-for="ch in CHANNELS"
        :key="ch.id"
        class="relative inline-flex cursor-pointer items-center gap-2 overflow-hidden font-medium transition-all w-full text-left px-3 py-2 rounded-kun-md text-sm"
        :class="activeChannel === ch.id
          ? '!text-primary !bg-primary/10'
          : 'text-default-500 hover:bg-default-100 hover:text-foreground'"
        @click="selectChannel(ch.id)"
      >
        <svg v-if="ch.icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
          <path :d="ch.icon"/>
          <polyline v-if="ch.id === ''" points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>{{ ch.label }}</span>
      </button>

      <div class="border-t border-default-200 my-3"></div>

      <p class="text-default-400 mb-2 px-2 text-xs font-semibold tracking-wide uppercase">操作</p>
      <button
        class="relative inline-flex cursor-pointer items-center gap-2 overflow-hidden font-medium transition-all w-full text-left px-3 py-2 rounded-kun-md text-sm text-default-500 hover:bg-default-100 hover:text-foreground"
        @click="openEditor"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-success">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>新建贴文</span>
      </button>
    </div>

    <!-- Footer -->
    <div class="border-default-200 flex items-center justify-between border-t px-5 py-3 text-default-400 text-xs">
      <span>数据源</span>
      <span>v4.0</span>
    </div>
  </aside>
</template>


