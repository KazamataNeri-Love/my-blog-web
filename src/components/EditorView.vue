<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import {
  savePost,
  fetchPost,
  listDir,
  uploadImage,
  downloadFile,
} from '@/composables/useGithubApi'
import type { ContentItem } from '@/types'

const router = useRouter()
const props = defineProps<{ editPath?: string | null }>()

const titleInput = ref('')
const contentArea = ref('')
const isSplitMode = ref(false)
const statusText = ref('准备就绪')
const wordCount = ref(0)
const loading = ref(false)

// Modal states
const showImgModal = ref(false)
const showFileModal = ref(false)
const showExtModal = ref(false)
const selectedImgFile = ref<File | null>(null)
const imgPreviewUrl = ref('')
const uploadToken = ref(localStorage.getItem('github_token') || '')
const imgWidth = ref('')
const fileList = ref<ContentItem[]>([])
const fileListPath = ref('')
const extName = ref('')
const extUrl = ref('')
const extNote = ref('')

onMounted(async () => {
  if (props.editPath) {
    statusText.value = `正在编辑: ${props.editPath}`
    try {
      const text = await fetchPost(props.editPath)
      titleInput.value = props.editPath.replace(/^posts\//, '').replace('.md', '')
      contentArea.value = text
      wordCount.value = text.length
    } catch (e: any) {
      alert('读取失败: ' + e.message)
    }
  }
  toggleSplit()
})

const previewHtml = computed(() => {
  if (!isSplitMode.value) return ''
  return marked.parse(contentArea.value) as string
})

function toggleSplit() {
  isSplitMode.value = !isSplitMode.value
}

function updateWordCount() {
  wordCount.value = contentArea.value.length
}

function insertMD(before: string, after: string) {
  const ta = contentArea.value
  const start = (document.querySelector('.editor-textarea') as HTMLTextAreaElement)?.selectionStart ?? ta.length
  const end = (document.querySelector('.editor-textarea') as HTMLTextAreaElement)?.selectionEnd ?? ta.length
  const selected = ta.substring(start, end)
  contentArea.value =
    ta.substring(0, start) + before + selected + after + ta.substring(end)
}

function insertTable() {
  insertMD(
    '\n| 标题 | 内容 |\n|------|------|\n|  |  |\n',
    ''
  )
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    save()
  }
}

// --- Image Upload ---
function triggerFileSelect() {
  if (!titleInput.value.trim() && !props.editPath) {
    alert('请先输入路径/标题')
    return
  }
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    selectedImgFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imgPreviewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    showImgModal.value = true
  }
  input.click()
}

async function confirmUpload() {
  if (!uploadToken.value) return alert('请输入Token')
  if (!selectedImgFile.value) return
  localStorage.setItem('github_token', uploadToken.value)

  const folderName = titleInput.value.split('/').pop() || 'Untitled'
  try {
    const url = await uploadImage(selectedImgFile.value, folderName, uploadToken.value)
    let widthSpec = imgWidth.value.trim()
    if (widthSpec && /^\d+$/.test(widthSpec)) widthSpec += '%'
    const titleAttr = widthSpec ? ` "width=${widthSpec}"` : ''
    insertMD(`\n![${selectedImgFile.value.name}](${url}${titleAttr})\n`, '')
    closeImgModal()
  } catch (e: any) {
    alert('上传失败: ' + e.message)
  }
}

function closeImgModal() {
  showImgModal.value = false
  selectedImgFile.value = null
  imgPreviewUrl.value = ''
}

// --- File Browser ---
async function openFileBrowser() {
  showFileModal.value = true
  fileListPath.value = ''
  await loadFiles('')
}

async function loadFiles(path: string) {
  fileListPath.value = path
  fileList.value = await listDir(path)
}

function selectFile(item: ContentItem) {
  if (item.type === 'dir') {
    loadFiles(item.path)
  } else {
    const html = `<div class="file-card">
<span class="file-name"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> ${item.name}</span>
<div class="file-info"><a class="file-download" href="javascript:void(0)" data-path="${item.path}" onclick="event.stopPropagation()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 下载</a></div>
</div>`
    insertMD(`\n${html}\n`, '')
    showFileModal.value = false
  }
}

// --- External Link ---
function openExtLinkModal() {
  extName.value = ''
  extUrl.value = ''
  extNote.value = ''
  showExtModal.value = true
}

function insertExtLink() {
  if (!extName.value || !extUrl.value) return alert('名称和链接不能为空')
  const noteHtml = extNote.value
    ? `<span class="file-note">${extNote.value}</span>`
    : ''
  const html = `<div class="file-card">
<span class="file-name"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> ${extName.value}</span>
<div class="file-info">${noteHtml}<a class="file-download" href="javascript:void(0)" data-path="${extUrl.value}" onclick="event.stopPropagation()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 下载</a></div>
</div>`
  insertMD(`\n${html}\n`, '')
  showExtModal.value = false
}

// --- Save ---
async function save() {
  let inputVal = titleInput.value.trim()
  const body = contentArea.value
  if (!inputVal) return alert('请输入路径/标题')

  let token = localStorage.getItem('github_token')
  if (!token) token = prompt('请输入 Token:')
  if (!token) return
  localStorage.setItem('github_token', token)

  const saveBtn = document.querySelector('.btn-primary') as HTMLButtonElement
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '保存中...' }

  try {
    let fullPath = inputVal
    if (!fullPath.startsWith('_legacy/posts/')) fullPath = '_legacy/posts/' + fullPath
    if (!fullPath.endsWith('.md')) fullPath = fullPath + '.md'
    await savePost(fullPath, body, token)
    alert('保存成功!')
    router.push({ path: '/', query: { f: fullPath } })
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '保存' }
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Editor Header -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-default-200 bg-background/80 backdrop-blur shrink-0">
      <router-link to="/" class="flex items-center gap-1.5 text-primary text-sm hover:opacity-80 transition-opacity">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        返回列表
      </router-link>
      <div class="flex-1 mx-5 flex items-center gap-2">
        <label class="text-default-500 text-sm font-semibold whitespace-nowrap">路径/标题:</label>
        <input
          v-model="titleInput"
          type="text"
          class="flex-1 px-3 py-2 text-sm border border-default-200 rounded-kun-md bg-background text-foreground outline-none transition-colors focus:border-primary"
          placeholder="例如: 笔记/Vue/第一课"
          @keydown="handleKeydown"
        />
      </div>
      <KunButton variant="solid" color="success" size="sm" @click="save">
        <template #default>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存
        </template>
      </KunButton>
    </div>

    <!-- Editor Layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Editor -->
      <div class="flex-1 flex flex-col border-r border-default-200 min-w-0">
        <!-- Toolbar -->
        <div class="flex items-center gap-1 flex-wrap px-3 py-2 border-b border-default-200 bg-default-100/30">
          <button class="tool-btn" @click="insertMD('**', '**')"><b>B</b></button>
          <button class="tool-btn" @click="insertMD('*', '*')"><i>I</i></button>
          <button class="tool-btn !text-foreground font-bold" @click="insertMD('# ', '')">H1</button>
          <button class="tool-btn !text-foreground font-bold" @click="insertMD('## ', '')">H2</button>
          <div class="tool-sep"></div>
          <button class="tool-btn" @click="insertTable()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
          </button>
          <button class="tool-btn" @click="insertMD('> ', '')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </button>
          <button class="tool-btn" @click="insertMD('\n---\n', '')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
            </svg>
          </button>
          <div class="tool-sep"></div>
          <button class="tool-btn" @click="triggerFileSelect" title="上传图片">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </button>
          <button class="tool-btn" @click="openFileBrowser" title="插入仓库内文件">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <button class="tool-btn" @click="openExtLinkModal" title="插入外部链接">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <KunButton
            variant="light"
            color="default"
            size="sm"
            class="ml-auto px-2"
            @click="toggleSplit"
          >
            <template #default>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/>
              </svg>
              {{ isSplitMode ? '关闭分栏' : '分栏预览' }}
            </template>
          </KunButton>
        </div>

        <textarea
          v-model="contentArea"
          class="flex-1 w-full resize-none border-none p-5 outline-none overflow-y-auto bg-background text-foreground"
          style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 14px; line-height: 1.7;"
          placeholder="在此撰写 Markdown... (Ctrl+S 保存)"
          @input="updateWordCount"
          @keydown="handleKeydown"
        ></textarea>
      </div>

      <!-- Right: Preview -->
      <div v-if="isSplitMode" class="flex-1 overflow-y-auto p-10 bg-background">
        <div class="markdown-body" v-html="previewHtml"></div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="flex items-center justify-between px-5 py-1.5 text-xs text-default-400 border-t border-default-200 bg-default-100/30 shrink-0">
      <span>{{ statusText }}</span>
      <span>{{ wordCount }} 字</span>
    </div>
  </div>

  <!-- Image Upload Modal -->
  <KunModal v-model="showImgModal" size="sm" innerClassName="p-4 img-modal-panel">
    <template #default>
      <h3 class="text-base font-semibold mb-4 border-b border-default-200 pb-3">插入图片</h3>
      <div class="w-full h-48 bg-default-100/50 flex items-center justify-center border border-dashed border-default-200 rounded-kun-md mb-4">
        <img v-if="imgPreviewUrl" :src="imgPreviewUrl" class="max-w-full max-h-full object-contain" />
        <span v-else class="text-default-400">预览区</span>
      </div>
      <label class="modal-label">Github Token:</label>
      <input v-model="uploadToken" type="password" class="modal-input" placeholder="输入 Token" />
      <label class="modal-label">图片宽度（可选）:</label>
      <input v-model="imgWidth" class="modal-input" placeholder="例如: 50% 或 400px 或 orig (原始)" />
      <div class="flex justify-end gap-2 mt-4">
        <KunButton variant="light" color="default" size="sm" @click="closeImgModal">取消</KunButton>
        <KunButton variant="solid" color="primary" size="sm" @click="confirmUpload">上传并插入</KunButton>
      </div>
    </template>
  </KunModal>

  <!-- File Browser Modal -->
  <KunModal v-model="showFileModal" size="sm" innerClassName="p-4 img-modal-panel">
    <template #default>
      <h3 class="text-base font-semibold mb-4 border-b border-default-200 pb-3">选择仓库文件</h3>
      <div class="text-xs text-default-400 mb-1">{{ fileListPath || '/' }}</div>
      <ul class="list-none p-0 max-h-64 overflow-y-auto border border-default-200 rounded-kun-sm">
        <li v-if="fileListPath" class="px-3 py-2 border-b border-default-200 cursor-pointer text-sm hover:bg-default-100 transition-colors" @click="loadFiles(fileListPath.split('/').slice(0, -1).join('/'))">
          🔙 返回上级
        </li>
        <li v-for="item in fileList" :key="item.path" class="px-3 py-2 border-b border-default-200 cursor-pointer text-sm hover:bg-default-100 transition-colors last:border-b-0" @click="selectFile(item)">
          {{ item.type === 'dir' ? '📂' : '📄' }} {{ item.name }}
        </li>
      </ul>
      <div class="flex justify-end mt-4">
        <KunButton variant="light" color="default" size="sm" @click="showFileModal = false">关闭</KunButton>
      </div>
    </template>
  </KunModal>

  <!-- External Link Modal -->
  <KunModal v-model="showExtModal" size="sm" innerClassName="p-4 img-modal-panel">
    <template #default>
      <h3 class="text-base font-semibold mb-4 border-b border-default-200 pb-3">插入外部/Release 资源</h3>
      <label class="modal-label">资源显示名称:</label>
      <input v-model="extName" class="modal-input" placeholder="例如: 游戏完整版 v1.0.zip" />
      <label class="modal-label">下载链接 (URL):</label>
      <input v-model="extUrl" class="modal-input" placeholder="https://..." />
      <label class="modal-label">提取码/备注 (可选):</label>
      <input v-model="extNote" class="modal-input" placeholder="例如: 提取码 1234" />
      <div class="flex justify-end gap-2 mt-4">
        <KunButton variant="light" color="default" size="sm" @click="showExtModal = false">取消</KunButton>
        <KunButton variant="solid" color="primary" size="sm" @click="insertExtLink">确认插入</KunButton>
      </div>
    </template>
  </KunModal>
</template>
