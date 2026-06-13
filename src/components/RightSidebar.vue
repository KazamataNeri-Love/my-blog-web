<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchFileTree } from '@/composables/useGithubApi'
import type { GitTreeItem } from '@/types'

const route = useRoute()
const router = useRouter()

const allFiles = ref<GitTreeItem[]>([])
const loading = ref(true)

const AVATAR_URL = 'https://raw.githubusercontent.com/KazamataNeri-Love/my-blog-web/main/Resource/Avatar/Default.png'

// 是否处于浏览文章状态
const isReading = computed(() => !!route.query.f)

const articleCount = computed(() => {
  return allFiles.value.filter(f => f.type === 'blob' && f.path.endsWith('.md')).length
})

onMounted(async () => {
  try {
    allFiles.value = await fetchFileTree()
  } catch {
    // silent
  } finally {
    loading.value = false
  }
})

// 建站时间（固定）
const SITE_CREATED = '2025-01-01'
const lastUpdated = computed(() => {
  if (allFiles.value.length === 0) return '-'
  const paths = allFiles.value.map(f => f.path).sort()
  const latest = paths[paths.length - 1]
  const m = latest.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '-'
})
</script>

<template>
  <aside class="min-w-0 border-l border-default-200 overflow-y-auto p-5 space-y-6">
    <!-- === 常态：站长信息气泡 === -->
    <div v-if="!isReading" class="flex flex-col items-center text-center">
      <!-- 头像（纯色背景 + 黑色边框圆形） -->
      <div class="w-full rounded-kun-lg bg-default-100/50 flex flex-col items-center py-8 px-4 border border-default-200">
        <div class="w-20 h-20 rounded-full border-[3px] border-default-900 overflow-hidden bg-default-200 flex items-center justify-center mb-3">
          <img
            :src="AVATAR_URL"
            alt="站长"
            class="w-full h-full object-cover"
          />
        </div>
        <p class="text-base font-bold text-foreground">霎晴</p>
        <p class="text-xs text-default-400 mt-0.5">欢迎来到被遗忘的小苑</p>
      </div>

      <!-- 信息列表 -->
      <div class="w-full mt-4 space-y-2.5">
        <div class="flex items-center justify-between text-sm">
          <span class="text-default-400">文章总数</span>
          <span class="font-semibold">{{ loading ? '...' : articleCount }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-default-400">建站时间</span>
          <span class="font-semibold">{{ SITE_CREATED }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-default-400">上次更新</span>
          <span class="font-semibold">{{ lastUpdated }}</span>
        </div>
      </div>
    </div>

    <!-- === 浏览态：文章信息（TOC 待 Sprint 3 实现） === -->
    <div v-else class="flex flex-col items-center text-center">
      <div class="w-full rounded-kun-lg bg-default-100/50 flex flex-col items-center py-6 px-4 border border-default-200">
        <div class="w-16 h-16 rounded-kun-lg overflow-hidden bg-default-200 flex items-center justify-center mb-3">
          <img :src="AVATAR_URL" alt="撰文人" class="w-full h-full object-cover" />
        </div>
        <p class="text-sm text-primary font-medium">霎晴</p>
      </div>

      <!-- 文章目录（占位，Sprint 3 实现） -->
      <div class="w-full mt-4">
        <p class="text-default-400 text-xs font-semibold tracking-wide uppercase mb-2 text-left">文章目录</p>
        <p class="text-default-400 text-xs text-left">加载中…</p>
      </div>
    </div>

    <KunDivider color="default" />

    <!-- 相关链接 -->
    <div>
      <p class="text-default-400 mb-3 text-xs font-semibold tracking-wide uppercase">相关链接</p>
      <div class="space-y-1">
        <a href="https://github.com/KazamataNeri-Love/my-blog-web" target="_blank"
          class="flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md text-default-500 hover:bg-default-100 hover:text-foreground transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
        <a href="https://ui.kungal.com" target="_blank"
          class="flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md text-default-500 hover:bg-default-100 hover:text-foreground transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          KunUI 文档
        </a>
      </div>
    </div>
  </aside>
</template>
