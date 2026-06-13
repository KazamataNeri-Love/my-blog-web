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
  window.open('/editor', '_blank')
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
  <aside class="sidebar" @click.stop>
    <!-- Search -->
    <div class="sidebar-section">
      <div class="search-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted); flex-shrink: 0;">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文章..."
        />
      </div>
    </div>

    <!-- Nav -->
    <div class="sidebar-section">
      <p class="sidebar-section-title">导航</p>
      <div class="sidebar-nav">
        <button class="sidebar-nav-item" :class="{ active: !route.query.f }" @click="goHome">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          首页
        </button>
        <button class="sidebar-nav-item" @click="openEditor">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success);">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          新建贴文
        </button>
      </div>
    </div>

    <!-- Sort -->
    <div class="sort-wrapper">
      <span class="sort-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 4px;">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        贴文列表
      </span>
      <div class="sort-trigger" @click="toggleSortMenu" title="排序方式">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5h10M11 12h7M11 19h4"/>
          <path d="M4 5l3 3-3 3"/>
        </svg>
      </div>
      <div v-if="showSortMenu" class="sort-popup" @click.stop>
        <div
          class="sort-option"
          :class="{ active: currentSortMode === 'date' }"
          @click="applySort('date')"
        >
          <span>📅 按时间</span>
          <svg v-if="currentSortMode === 'date'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div
          class="sort-option"
          :class="{ active: currentSortMode === 'title' }"
          @click="applySort('title')"
        >
          <span>Aa 按标题</span>
          <svg v-if="currentSortMode === 'title'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- File Tree or Search Results -->
    <ul class="file-tree">
      <!-- Loading -->
      <li v-if="loading" style="text-align:center; color:var(--text-muted); padding:20px; font-size:13px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite; margin: 0 auto 8px; display: block;">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        加载中...
      </li>

      <!-- Error -->
      <li v-else-if="error" style="color: var(--danger); padding: 15px; font-size: 13px;">
        ❌ 加载失败: {{ error }}
      </li>

      <!-- Search results -->
      <template v-else-if="filteredFiles">
        <li v-for="file in filteredFiles" :key="file.path">
          <div
            class="file-item"
            :class="{ active: isActive(file.path) }"
            @click="handlePostClick(file.path)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{{ file.path.replace('posts/', '').replace('.md', '') }}</span>
          </div>
        </li>
        <li v-if="filteredFiles.length === 0" style="padding:15px; color:var(--text-muted); font-size:13px;">
          无搜索结果
        </li>
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
    </ul>

    <!-- Footer -->
    <div class="sidebar-footer">
      <span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 4px;">
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


