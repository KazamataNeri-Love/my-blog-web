<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { fetchPost, downloadFile } from '@/composables/useGithubApi'

const route = useRoute()
const router = useRouter()

const articlePath = ref('')
const articleTitle = ref('')
const articleHtml = ref('')
const loading = ref(false)
const error = ref('')
const hasContent = ref(false)

onMounted(() => {
  if (route.query.f) {
    loadArticle(route.query.f as string)
  }
})

watch(
  () => route.query.f,
  (newF) => {
    if (newF) {
      loadArticle(newF as string)
    } else {
      resetView()
    }
  }
)

function resetView() {
  hasContent.value = false
  articleHtml.value = ''
  articleTitle.value = ''
  articlePath.value = ''
  error.value = ''
}

async function loadArticle(path: string) {
  loading.value = true
  error.value = ''
  hasContent.value = true
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

    // Process images and file downloads after render
    // (Vue's nextTick handles this)
  } catch (e: any) {
    error.value = e.message
    articleHtml.value = ''
  } finally {
    loading.value = false
  }
}

function bindDownloads(container: HTMLElement | null) {
  if (!container) return
  container.querySelectorAll('.file-download').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      downloadFile(btn.getAttribute('data-path') || '')
    })
  })
}

function editArticle() {
  if (articlePath.value) {
    window.open(`/editor?edit=${encodeURIComponent(articlePath.value)}`, '_blank')
  }
}
</script>

<template>
  <!-- Article Header -->
  <div v-if="hasContent && !loading" class="doc-header">
    <div class="header-top">
      <h1 class="doc-title">{{ articleTitle || '无标题' }}</h1>
      <div class="header-actions">
        <button class="btn-edit" @click="editArticle">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑
        </button>
      </div>
    </div>
    <div class="doc-meta">
      <span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 4px;">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        -
      </span>
      <span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 4px;">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Admin
      </span>
      <span style="opacity: 0.6; font-size: 11px;">{{ articlePath }}</span>
    </div>
  </div>

  <!-- Loading -->
  <div v-if="loading" class="loading-spinner">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  </div>

  <!-- Error -->
  <div v-else-if="error" style="color: var(--danger); padding: 20px;">
    ❌ 加载失败: {{ error }}
  </div>

  <!-- Empty State (Welcome) -->
  <div v-if="!hasContent && !loading" class="empty-state">
    <div class="empty-state-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="16 12 12 8 8 12"/>
        <line x1="12" y1="16" x2="12" y2="8"/>
      </svg>
    </div>
    <h2>> 欢迎来到知识库 <</h2>
    <p>点击左侧目录查看文章，或者搜索。</p>
  </div>

  <!-- Article Content -->
  <div
    v-if="articleHtml && !loading"
    ref="contentRef"
    class="markdown-body"
    v-html="articleHtml"
  ></div>
</template>
