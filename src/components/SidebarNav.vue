<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchFileTree, buildTree } from '@/composables/useGithubApi'
import type { TreeNode, GitTreeItem, SortMode } from '@/types'
import TreeNodeComponent from './TreeNode.vue'

const emit = defineEmits<{ closeSidebar: [] }>()

const router = useRouter()
const route = useRoute()

const allFiles = ref<GitTreeItem[]>([])
const treeData = ref<TreeNode>({ name: '', path: null, children: {} })
const searchQuery = ref('')
const currentSortMode = ref<SortMode>('date')
const loading = ref(true)
const error = ref('')
const showSortMenu = ref(false)

const filteredFiles = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return null
  return allFiles.value.filter(
    (f) => f.type === 'blob' && f.path.endsWith('.md') && f.path.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    allFiles.value = await fetchFileTree()
    treeData.value = buildTree(allFiles.value)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

function goHome() {
  router.push('/')
  emit('closeSidebar')
}

function openEditor() {
  router.push('/editor')
  emit('closeSidebar')
}

function handlePostClick(path: string) {
  router.push({ path: '/', query: { f: path } })
  emit('closeSidebar')
}

function applySort(mode: SortMode) {
  currentSortMode.value = mode
  showSortMenu.value = false
}

function toggleSortMenu() {
  showSortMenu.value = !showSortMenu.value
}

function isActive(path: string | null): boolean {
  if (!path) return false
  return route.query.f === path
}
</script>

<template>
  <aside
    class="border-default-200 sticky top-[57px] flex h-[calc(100vh-57px)] w-60 shrink-0 flex-col overflow-y-auto border-r p-4"
    @click.stop
  >
    <!-- Search -->
    <div class="mb-4">
      <div
        class="border-default-200 bg-default-100/50 flex items-center gap-2 rounded-kun-md border px-3 py-2 text-sm transition-colors"
        :class="{ 'border-primary': searchQuery }"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-default-400 shrink-0">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文章..."
          class="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-default-400"
        />
      </div>
    </div>

    <!-- Nav -->
    <div class="mb-4">
      <p class="text-default-400 mb-2 px-2 text-xs font-semibold tracking-wide uppercase">导航</p>
      <div class="flex flex-col gap-0.5">
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md transition-colors w-full text-left"
          :class="!route.query.f ? '!text-primary bg-primary/10 font-medium' : 'text-default-500 hover:bg-default-100 hover:text-foreground'"
          @click="goHome"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          首页
        </button>
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md transition-colors w-full text-left text-default-500 hover:bg-default-100 hover:text-foreground"
          @click="openEditor"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          新建贴文
        </button>
      </div>
    </div>

    <!-- Sort -->
    <div class="mb-2 flex items-center justify-between px-2 relative">
      <span class="text-default-400 text-xs font-semibold tracking-wide uppercase">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline align-middle mr-1">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        贴文列表
      </span>
      <button class="text-default-400 hover:text-foreground cursor-pointer p-1 rounded-kun-sm hover:bg-default-100 transition-colors text-xs" @click="toggleSortMenu">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5h10M11 12h7M11 19h4"/>
          <path d="M4 5l3 3-3 3"/>
        </svg>
      </button>
      <!-- Sort popup -->
      <div
        v-if="showSortMenu"
        class="z-kun-popover absolute right-0 top-8 min-w-[140px] bg-default-100 border border-default-200 rounded-kun-md shadow-lg overflow-hidden"
        @click.stop
      >
        <button
          class="w-full flex items-center justify-between px-3 py-2 text-xs text-foreground hover:bg-default-200 transition-colors"
          :class="{ '!text-primary font-medium': currentSortMode === 'date' }"
          @click="applySort('date')"
        >
          <span>📅 按时间</span>
          <svg v-if="currentSortMode === 'date'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button
          class="w-full flex items-center justify-between px-3 py-2 text-xs text-foreground hover:bg-default-200 transition-colors"
          :class="{ '!text-primary font-medium': currentSortMode === 'title' }"
          @click="applySort('title')"
        >
          <span>Aa 按标题</span>
          <svg v-if="currentSortMode === 'title'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
    </div>

    <!-- File Tree / Search Results -->
    <div class="flex-1 overflow-y-auto scrollbar-hide">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center gap-2 py-8 text-default-400 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        <span>加载中...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="px-3 py-4 text-danger text-sm">
        ❌ {{ error }}
      </div>

      <!-- Search results -->
      <template v-else-if="filteredFiles">
        <div
          v-for="file in filteredFiles"
          :key="file.path"
          class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors"
          :class="isActive(file.path) ? '!text-primary bg-primary/10 font-medium' : 'text-default-500 hover:bg-default-100 hover:text-foreground'"
          @click="handlePostClick(file.path)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="truncate">{{ file.path.replace('posts/', '').replace('.md', '') }}</span>
        </div>
        <div v-if="filteredFiles.length === 0" class="px-3 py-4 text-default-400 text-sm text-center">
          无搜索结果
        </div>
      </template>

      <!-- Tree view -->
      <template v-else>
        <TreeNodeComponent
          :nodes="treeData.children"
          :sort-mode="currentSortMode"
          :active-path="(route.query.f as string) || ''"
          @select="handlePostClick"
        />
      </template>
    </div>

    <!-- Footer -->
    <div class="border-default-200 mt-4 flex items-center justify-between border-t pt-3 text-default-400 text-xs">
      <span class="flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        GitHub Tree
      </span>
      <span>v4.0</span>
    </div>
  </aside>
</template>


