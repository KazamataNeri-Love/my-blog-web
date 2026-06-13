<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { fetchPost, downloadFile } from '@/composables/useGithubApi'

const route = useRoute()
const router = useRouter()

const articleHtml = ref('')
const articleTitle = ref('')
const articlePath = ref('')
const loading = ref(false)
const error = ref('')

onMounted(() => {
  if (route.query.f) loadArticle(route.query.f as string)
})

watch(() => route.query.f, (f) => {
  if (f) loadArticle(f as string)
})

async function loadArticle(path: string) {
  loading.value = true
  error.value = ''
  articlePath.value = path

  try {
    const text = await fetchPost(path)
    const lines = text.split('\n')
    const firstLine = lines[0].trim()

    if (firstLine.startsWith('# ')) {
      articleTitle.value = firstLine.replace(/^#\s+/, '').trim()
      articleHtml.value = marked.parse(lines.slice(1).join('\n')) as string
    } else {
      const filename = path.split('/').pop() || ''
      articleTitle.value = filename.replace('.md', '').replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
      articleHtml.value = marked.parse(text) as string
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function editArticle() {
  if (articlePath.value) {
    router.push(`/editor?edit=${encodeURIComponent(articlePath.value)}`)
  }
}

function goBack() {
  const query = { ...route.query }
  delete query.f
  router.push({ path: '/', query })
}
</script>

<template>
  <!-- 单个大气泡（文章阅读） -->
  <KunCard color="background" bordered class="min-h-[400px] p-5">
    <!-- 返回 -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-default-200">
      <button
        class="text-default-500 hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors cursor-pointer"
        @click="goBack"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        返回列表
      </button>
      <KunButton variant="light" color="default" size="sm" class="px-4" @click="editArticle">
        <template #default>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑
        </template>
      </KunButton>
    </div>

    <!-- 标题 -->
    <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-2">{{ articleTitle }}</h1>
    <p class="text-xs text-default-400 mb-5 pb-4 border-b border-default-200">
      {{ articlePath }}
    </p>

    <!-- 加载中 -->
    <div v-if="loading" class="flex justify-center py-16 text-default-400">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="text-danger text-sm p-4">❌ {{ error }}</div>

    <!-- 正文 -->
    <div
      v-else
      class="markdown-body px-2"
      v-html="articleHtml"
    ></div>
  </KunCard>
</template>
