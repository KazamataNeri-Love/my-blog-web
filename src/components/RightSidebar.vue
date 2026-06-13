<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchFileTree } from '@/composables/useGithubApi'
import type { GitTreeItem } from '@/types'

const router = useRouter()
const recentFiles = ref<GitTreeItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const files = await fetchFileTree()
    // Sort by path (which includes date prefix) and take recent
    recentFiles.value = files
      .filter(f => f.type === 'blob' && f.path.endsWith('.md'))
      .sort((a, b) => b.path.localeCompare(a.path))
      .slice(0, 10)
  } catch {
    // silent
  } finally {
    loading.value = false
  }
})

function openFile(path: string) {
  router.push({ path: '/', query: { f: path } })
}

function displayName(path: string): string {
  return path
    .replace('posts/', '')
    .replace('.md', '')
    .replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
}

function extractCategory(path: string): string {
  const parts = path.replace('posts/', '').split('/')
  return parts.length > 1 ? parts[0] : '未分类'
}
</script>

<template>
  <aside class="w-72 shrink-0 border-l border-default-200 overflow-y-auto p-5 space-y-6">
    <!-- Stats Card -->
    <div>
      <p class="text-default-400 mb-3 text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        统计
      </p>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-default-400">文章总数</span>
          <span class="font-semibold">{{ recentFiles.length }}+</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-default-400">分类</span>
          <span class="font-semibold">美术 · 音乐</span>
        </div>
      </div>
    </div>

    <KunDivider color="default" />

    <!-- Recent Activity -->
    <div>
      <p class="text-default-400 mb-3 text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        最新动态
      </p>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-6 text-default-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>

      <!-- Activity list -->
      <div v-else class="space-y-3">
        <div
          v-for="file in recentFiles"
          :key="file.path"
          class="group cursor-pointer"
          @click="openFile(file.path)"
        >
          <div class="flex items-start gap-2.5">
            <div class="mt-1 shrink-0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-default-500 group-hover:text-foreground transition-colors line-clamp-2 leading-snug">
                {{ displayName(file.path) }}
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-default-400 text-xs">{{ extractCategory(file.path) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <KunDivider color="default" />

    <!-- Quick Links -->
    <div>
      <p class="text-default-400 mb-3 text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
        相关链接
      </p>
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
