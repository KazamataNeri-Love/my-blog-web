<script setup lang="ts">
import { ref } from 'vue'
import SidebarNav from '@/components/SidebarNav.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const sidebarOpen = ref(false)

function goHome() {
  router.push('/')
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="app-wrapper">
    <!-- Top Bar (KunUI docs-style) -->
    <header class="top-bar">
      <div class="top-bar-brand" @click="goHome">
        <span>📚</span>
        <span>我的<span class="accent">知识库</span></span>
      </div>
      <div class="top-bar-actions">
        <button
          class="top-bar-link"
          @click="toggleSidebar"
          title="切换侧边栏"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <router-link to="/editor" class="top-bar-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          新建
        </router-link>
        <a href="https://github.com/KazamataNeri-Love/my-blog-web" target="_blank" class="top-bar-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>
    </header>

    <!-- Layout Row -->
    <div class="layout-row">
      <!-- Sidebar -->
      <SidebarNav
        :class="{ open: sidebarOpen }"
        @close-sidebar="sidebarOpen = false"
      />

      <!-- Main Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>
