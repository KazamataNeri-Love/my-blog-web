<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import SidebarNav from '@/components/SidebarNav.vue'
import RightSidebar from '@/components/RightSidebar.vue'

const router = useRouter()
const sidebarOpen = ref(false)

// Dark mode — .kun-dark-mode on <html> drives KunUI's dark palette
const dark = ref(localStorage.getItem('kun-dark') !== 'false')
watchEffect(() => {
  document.documentElement.classList.toggle('kun-dark-mode', dark.value)
  localStorage.setItem('kun-dark', String(dark.value))
})

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Top bar (forum-style) -->
    <header
      class="border-default-200 bg-background/80 z-kun-sticky sticky top-0 flex items-center justify-between border-b px-5 py-3 backdrop-blur"
    >
      <div class="flex cursor-pointer items-center gap-2" @click="goHome">
        <span class="text-lg"></span>
        <span class="text-lg font-bold">SeriousDucKing的<span class="text-primary">杂谈小窝</span></span>
      </div>

      <div class="flex items-center gap-3">
        <router-link
          to="/editor"
          class="text-default-500 hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          新建
        </router-link>
        <a
          href="https://github.com/KazamataNeri-Love/my-blog-web"
          target="_blank" rel="noopener"
          class="text-default-500 hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
        <button
          class="text-default-500 hover:text-foreground cursor-pointer p-1.5 rounded-kun-sm hover:bg-default-100 transition-colors"
          @click="dark = !dark"
          :title="dark ? '切换亮色模式' : '切换暗色模式'"
        >
          <!-- Moon (dark mode) / Sun (light mode) -->
          <svg v-if="dark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Layout: forum-style three columns -->
    <div class="mx-auto flex max-w-7xl" style="height: calc(100vh - 57px);">
      <!-- Left Sidebar (forum nav style) -->
      <SidebarNav
        :class="[sidebarOpen ? 'flex' : '', 'hidden lg:flex']"
        @close-sidebar="sidebarOpen = false"
      />

      <!-- Main content -->
      <main class="min-w-0 flex-1 overflow-y-auto px-5 py-6">
        <router-view />
      </main>

      <!-- Right Sidebar (recent activity) -->
      <RightSidebar class="hidden xl:block" />
    </div>
  </div>
</template>
