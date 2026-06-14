<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchFileTree, downloadFile } from '@/composables/useGithubApi'
import type { GitTreeItem } from '@/types'

const router = useRouter()
const route = useRoute()

const allFiles = ref<GitTreeItem[]>([])
const loading = ref(true)

const activeChannel = computed(() => (route.query.channel as string) || '')

// 从文件名解析年月日
function extractDate(path: string): string {
  const m = path.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  return m ? `${m[1]}/${m[2]}/${m[3]}` : ''
}

// 显示名称
function displayName(path: string): string {
  return path
    .replace('Article/', '')
    .replace('.md', '')
    .replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
}

// 提取频道（一级目录名）
function extractChannel(path: string): string {
  const parts = path.replace('Article/', '').split('/')
  return parts.length > 1 ? parts[0] : '未分类'
}

// 按频道筛选后的文章
const filteredFiles = computed(() => {
  let files = allFiles.value.filter(f => f.type === 'blob' && f.path.endsWith('.md'))
  if (activeChannel.value) {
    files = files.filter(f => extractChannel(f.path) === activeChannel.value)
  }
  return files.sort((a, b) => b.path.localeCompare(a.path))
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

function openArticle(path: string) {
  router.push({ path: '/', query: { ...route.query, f: path } })
}

function isCurrentArticle(path: string): boolean {
  return route.query.f === path
}
</script>

<template>
  <div class="space-y-5">
    <!-- === 上部小气泡（公告/封面） === -->
    <KunCard color="background" bordered class="relative overflow-hidden">
      <div class="flex items-center gap-4 p-2">
        <!-- 封面占位图 -->
        <div class="w-24 h-16 rounded-kun-md bg-gradient-to-br from-primary/20 to-secondary/20 shrink-0 flex items-center justify-center text-2xl opacity-40">
          📢
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-foreground">SeriousDucKing 的杂谈小窝</p>
          <p class="text-xs text-default-400 mt-0.5">写写歌曲推荐和 Gal 游玩随想</p>
          <a href="https://github.com/KazamataNeri-Love/my-blog-web" target="_blank"
            class="text-xs text-primary hover:underline mt-1 inline-block">
            查看 GitHub →
          </a>
        </div>
      </div>
    </KunCard>

    <!-- === 下部大气泡（帖子列表） === -->
    <KunCard color="background" bordered class="min-h-[300px]">
      <div class="flex items-center justify-between mb-3 px-2">
        <p class="text-sm font-semibold text-foreground">
          {{ activeChannel ? `${activeChannel}频道` : '全部文章' }}
        </p>
        <span class="text-xs text-default-400">{{ filteredFiles.length }} 篇</span>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center py-12 text-default-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>

      <!-- 文章列表 -->
      <div v-else class="space-y-1">
        <div
          v-for="file in filteredFiles"
          :key="file.path"
          class="flex items-center justify-between px-3 py-2.5 rounded-kun-md cursor-pointer transition-colors"
          :class="isCurrentArticle(file.path)
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-default-100'"
          @click="openArticle(file.path)"
        >
          <div class="min-w-0 flex-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-default-400">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="text-sm truncate">{{ displayName(file.path) }}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-3">
            <span class="text-xs text-default-400">{{ extractDate(file.path) }}</span>
            <span class="text-xs bg-default-100 text-default-500 px-1.5 py-0.5 rounded-kun-sm">{{ extractChannel(file.path) }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredFiles.length === 0" class="text-center py-12 text-default-400 text-sm">
          {{ activeChannel ? `「${activeChannel}」频道暂无文章` : '暂无文章' }}
        </div>
      </div>
    </KunCard>
  </div>
</template>
