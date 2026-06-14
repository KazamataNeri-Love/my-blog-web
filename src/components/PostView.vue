<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { fetchPost, downloadFile } from '@/composables/useGithubApi'
import { useToc } from '@/composables/useToc'

const route = useRoute()
const router = useRouter()

const articleHtml = ref('')
const articleTitle = ref('')
const articlePath = ref('')
const articleTags = ref<string[]>([])
const articleDate = ref('')
const loading = ref(false)
const error = ref('')
const contentRef = ref<HTMLElement | null>(null)

const { updateToc, clearToc } = useToc()

// Custom marked renderer
const renderer = new marked.Renderer()

// Heading renderer with IDs for TOC
renderer.heading = ({ text, depth, tokens }) => {
  const rawText = tokens.map(t => 'text' in t ? t.text : '').join('')
  const id = rawText
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `<h${depth} id="${id}">${text}</h${depth}>`
}

// Code block renderer
renderer.code = ({ text, lang }) => {
  const langDisplay = lang || 'text'
  const encoded = encodeURIComponent(text)
  return `
<div class="code-block rounded-kun-md border border-default-200 overflow-hidden my-4">
  <div class="flex items-center justify-between px-4 py-1.5 bg-default-100/50 text-xs text-default-500 border-b border-default-200">
    <span class="font-mono font-medium">${langDisplay}</span>
    <button class="copy-btn inline-flex items-center gap-1 px-2 py-0.5 rounded-kun-sm hover:bg-default-200 transition-colors cursor-pointer" onclick="navigator.clipboard.writeText(decodeURIComponent('${encoded}')).then(() => { this.textContent='已复制'; setTimeout(()=>{this.innerHTML='📋 复制'},1500) })">
      📋 复制
    </button>
  </div>
  <pre class="!border-0 !rounded-none !my-0"><code class="language-${langDisplay}">${text}</code></pre>
</div>`
}

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
  articleTags.value = []
  articleDate.value = ''
  clearToc()

  try {
    const text = await fetchPost(path)

    // Extract date from filename
    const dateMatch = path.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
    articleDate.value = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : ''

    // Parse tags from front-matter
    let cleanText = text
    const tagMatch = text.match(/^<!--\s*tags:\s*([\s\S]*?)-->/m)
    if (tagMatch) {
      articleTags.value = tagMatch[1].split(',').map(t => t.trim()).filter(Boolean)
      cleanText = text.replace(tagMatch[0], '').trim()
    }

    const lines = cleanText.split('\n')
    const firstLine = lines[0].trim()

    let html: string
    if (firstLine.startsWith('# ')) {
      articleTitle.value = firstLine.replace(/^#\s+/, '').trim()
      html = marked.parse(lines.slice(1).join('\n'), { renderer }) as string
    } else {
      const filename = path.split('/').pop() || ''
      articleTitle.value = filename.replace('.md', '').replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
      html = marked.parse(cleanText, { renderer }) as string
    }

    articleHtml.value = html

    // Extract TOC after render
    await nextTick()
    updateToc(html)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

// Expose scrollToHeading for RightSidebar
defineExpose({ scrollToHeading })
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

    <!-- Tag 气泡行 -->
    <div v-if="articleTags.length > 0" class="flex flex-wrap gap-1.5 mb-2">
      <span
        v-for="tag in articleTags"
        :key="tag"
        class="inline-flex items-center px-2.5 py-0.5 text-xs rounded-kun-sm bg-primary/10 text-primary border border-primary/20"
      >{{ tag }}</span>
    </div>

    <!-- 投稿时间 + 路径 -->
    <p class="text-xs text-default-400 mb-5 pb-4 border-b border-default-200">
      <template v-if="articleDate">投稿于 {{ articleDate }} · </template>
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
