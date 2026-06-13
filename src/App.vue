<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import SidebarNav from '@/components/SidebarNav.vue'
import RightSidebar from '@/components/RightSidebar.vue'

const router = useRouter()

// Dark mode
const dark = ref(localStorage.getItem('kun-dark') !== 'false')
watchEffect(() => {
  document.documentElement.classList.toggle('kun-dark-mode', dark.value)
  localStorage.setItem('kun-dark', String(dark.value))
})

// Search bar toggle
const showSearch = ref(false)

function goHome() {
  router.push('/')
}

const AVATAR_URL = 'https://raw.githubusercontent.com/KazamataNeri-Love/my-blog-web/main/Resource/Avatar/Default.png'
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部功能栏气泡 -->
    <header
      class="border-default-200 bg-background/80 z-kun-sticky sticky top-0 flex items-center justify-between border-b px-4 py-2 backdrop-blur"
    >
      <!-- 左侧：返回主页 -->
      <button
        class="text-default-500 hover:text-foreground cursor-pointer p-1.5 rounded-kun-sm hover:bg-default-100 transition-colors"
        @click="goHome"
        title="回到主页"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>

      <!-- 右侧：搜索 + 设置 + 暗色 + 头像 -->
      <div class="flex items-center gap-1.5">
        <!-- 搜索 -->
        <button
          class="text-default-500 hover:text-foreground cursor-pointer p-1.5 rounded-kun-sm hover:bg-default-100 transition-colors"
          @click="showSearch = !showSearch"
          title="搜索"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>

        <!-- 设置（暂留空） -->
        <button
          class="text-default-500 hover:text-foreground cursor-pointer p-1.5 rounded-kun-sm hover:bg-default-100 transition-colors"
          title="设置"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>

        <!-- 暗色模式 -->
        <button
          class="text-default-500 hover:text-foreground cursor-pointer p-1.5 rounded-kun-sm hover:bg-default-100 transition-colors"
          @click="dark = !dark"
          :title="dark ? '切换亮色' : '切换暗色'"
        >
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

        <!-- 站长头像 -->
        <button class="cursor-pointer" title="站长">
          <img
            :src="AVATAR_URL"
            alt="站长"
            class="w-7 h-7 rounded-full border-2 border-default-200 object-cover"
          />
        </button>
      </div>
    </header>

    <!-- 搜索栏（点击搜索按钮后左侧延伸） -->
    <div
      v-if="showSearch"
      class="border-default-200 bg-default-100/30 flex items-center gap-2 border-b px-5 py-2 transition-all"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-default-400 shrink-0">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        placeholder="搜索文章标题或标签…"
        class="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-default-400"
      />
    </div>

    <!-- Layout: 三栏（填满视口） -->
    <div style="height: calc(100vh - 57px); display: grid; grid-template-columns: 1fr 4fr 1fr;">
      <SidebarNav class="hidden lg:flex" />
      <main class="min-w-0 overflow-y-auto px-5 py-6">
        <router-view />
      </main>
      <RightSidebar class="hidden xl:block" />
    </div>
  </div>
</template>
