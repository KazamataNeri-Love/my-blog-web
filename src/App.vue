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

// Settings modal
const showSettings = ref(false)
const bgBrightness = ref(Number(localStorage.getItem('bg-brightness')) || 82)
const glassOpacity = ref(Number(localStorage.getItem('glass-opacity')) || 70)
watchEffect(() => {
  document.documentElement.style.setProperty('--bg-overlay-opacity', String(bgBrightness.value / 100))
  localStorage.setItem('bg-brightness', String(bgBrightness.value))
})
watchEffect(() => {
  document.documentElement.style.setProperty('--kun-global-opacity', String(glassOpacity.value / 100))
  localStorage.setItem('glass-opacity', String(glassOpacity.value))
})

function goHome() {
  router.push('/')
}

const AVATAR_URL = 'https://raw.githubusercontent.com/KazamataNeri-Love/my-blog-web/main/Resource/Avatar/Default.png'
</script>

<template>
  <div class="min-h-screen app-bg">
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

        <!-- 设置（齿轮图标） -->
        <button
          class="text-default-500 hover:text-foreground cursor-pointer p-1.5 rounded-kun-sm hover:bg-default-100 transition-colors"
          @click="showSettings = true"
          title="设置"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
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

    <!-- 设置面板模态框 -->
    <KunModal v-model="showSettings" size="full" innerClassName="[background:hsl(var(--content1))] [width:20vw] min-w-[400px]">
      <template #default>
        <div class="relative">
          <!-- 右上角关闭 -->
          <button
            class="absolute top-0 right-0 text-default-400 hover:text-foreground cursor-pointer p-1 rounded-kun-sm hover:bg-default-100 transition-colors"
            @click="showSettings = false"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <h3 class="text-base font-semibold mb-5 border-b border-default-200 pb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          设置面板
        </h3>

        <div class="space-y-5">
          <!-- 背景亮度 -->
          <div>
            <label class="modal-label flex items-center justify-between">
              <span>背景亮度</span>
              <span class="text-foreground font-mono text-sm">{{ bgBrightness }}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              v-model.number="bgBrightness"
              class="w-full accent-primary cursor-pointer"
            />
            <div class="flex justify-between text-xs text-default-400 mt-1">
              <span>暗</span>
              <span>亮</span>
            </div>
          </div>

          <!-- 页面透明度 -->
          <div>
            <label class="modal-label flex items-center justify-between">
              <span>页面透明度</span>
              <span class="text-foreground font-mono text-sm">{{ glassOpacity }}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              v-model.number="glassOpacity"
              class="w-full accent-primary cursor-pointer"
            />
            <div class="flex justify-between text-xs text-default-400 mt-1">
              <span>透明</span>
              <span>不透明</span>
            </div>
          </div>
        </div>
        </div>

      </template>
    </KunModal>
  </div>
</template>
