<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { marked } from 'marked'
import {
  savePost,
  fetchPost,
  listDir,
  uploadImage,
  downloadFile,
} from '@/composables/useGithubApi'
import type { ContentItem } from '@/types'

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
    if (!fullPath.startsWith('posts/')) fullPath = 'posts/' + fullPath
    if (!fullPath.endsWith('.md')) fullPath = fullPath + '.md'
    await savePost(fullPath, body, token)
    alert('保存成功!')
    window.location.href = `/?f=${encodeURIComponent(fullPath)}`
  } catch (e: any) {
    alert('保存失败: ' + e.message)
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '保存' }
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%;">
    <!-- Editor Header -->
    <div class="top-bar" style="position: static; margin: -32px -48px 0; padding: 12px 20px;">
      <a href="/" class="back-link" style="color: var(--accent); font-size: 14px; display: inline-flex; align-items: center; gap: 5px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        返回列表
      </a>
      <div class="header-inputs" style="flex: 1; margin: 0 20px; display: flex; gap: 10px; align-items: center;">
        <label style="font-weight: 600; font-size: 13px; color: var(--text-sub); white-space: nowrap;">路径/标题:</label>
        <input
          v-model="titleInput"
          type="text"
          class="modal-input"
          placeholder="例如: 笔记/Vue/第一课"
          style="margin-bottom: 0;"
          @keydown="handleKeydown"
        />
      </div>
      <div class="header-actions" style="display: flex; gap: 10px;">
        <button class="btn-primary" @click="save">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存
        </button>
      </div>
    </div>

    <!-- Editor Layout -->
    <div class="editor-layout">
      <!-- Left: Editor -->
      <div class="editor-pane">
        <div class="toolbar">
          <button class="tool-btn" @click="insertMD('**', '**')"><b>B</b></button>
          <button class="tool-btn" @click="insertMD('*', '*')"><i>I</i></button>
          <button class="tool-btn" @click="insertMD('# ', '')">H1</button>
          <button class="tool-btn" @click="insertMD('## ', '')">H2</button>
          <div class="tool-sep"></div>
          <button class="tool-btn" @click="insertTable()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
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
            图片
          </button>
          <button class="tool-btn" @click="openFileBrowser" title="插入仓库内文件">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
            文件
          </button>
          <button class="tool-btn" @click="openExtLinkModal" title="插入外部链接">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            外部/网盘
          </button>
          <button class="tool-btn" :class="{ active: isSplitMode }" style="margin-left: auto;" @click="toggleSplit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="18"/>
              <rect x="14" y="3" width="7" height="18"/>
            </svg>
            {{ isSplitMode ? '关闭分栏' : '分栏预览' }}
          </button>
        </div>

        <textarea
          v-model="contentArea"
          class="editor-textarea"
          placeholder="在此撰写 Markdown... (Ctrl+S 保存)"
          @input="updateWordCount"
          @keydown="handleKeydown"
        ></textarea>
      </div>

      <!-- Right: Preview -->
      <div v-if="isSplitMode" class="preview-pane">
        <div class="markdown-body" v-html="previewHtml"></div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <span>{{ statusText }}</span>
      <span>{{ wordCount }} 字</span>
    </div>
  </div>

  <!-- Image Upload Modal -->
  <div v-if="showImgModal" class="modal-overlay open" @click.self="closeImgModal">
    <div class="modal">
      <h3>插入图片</h3>
      <div style="width:100%; height:200px; background:var(--bg-elevated); display:flex; align-items:center; justify-content:center; border:1px dashed var(--border); border-radius:var(--radius-md); margin-bottom:16px;">
        <img v-if="imgPreviewUrl" :src="imgPreviewUrl" style="max-width:100%; max-height:100%; object-fit:contain;" />
        <span v-else style="color:var(--text-muted)">预览区</span>
      </div>
      <label class="modal-label">Github Token:</label>
      <input v-model="uploadToken" type="password" class="modal-input" placeholder="输入 Token" />
      <label class="modal-label">图片宽度（可选）:</label>
      <input v-model="imgWidth" class="modal-input" placeholder="例如: 50% 或 400px 或 orig (原始)" />
      <div class="modal-footer">
        <button class="tool-btn" @click="closeImgModal">取消</button>
        <button class="btn-primary" @click="confirmUpload">上传并插入</button>
      </div>
    </div>
  </div>

  <!-- File Browser Modal -->
  <div v-if="showFileModal" class="modal-overlay open" @click.self="showFileModal = false">
    <div class="modal">
      <h3>选择仓库文件</h3>
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">
        {{ fileListPath || '/' }}
      </div>
      <ul class="file-list-modal">
        <li v-if="fileListPath" @click="loadFiles(fileListPath.split('/').slice(0, -1).join('/'))">
          🔙 返回上级
        </li>
        <li v-for="item in fileList" :key="item.path" @click="selectFile(item)">
          {{ item.type === 'dir' ? '📂' : '📄' }} {{ item.name }}
        </li>
      </ul>
      <div class="modal-footer">
        <button class="tool-btn" @click="showFileModal = false">关闭</button>
      </div>
    </div>
  </div>

  <!-- External Link Modal -->
  <div v-if="showExtModal" class="modal-overlay open" @click.self="showExtModal = false">
    <div class="modal">
      <h3>插入外部/Release 资源</h3>
      <label class="modal-label">资源显示名称:</label>
      <input v-model="extName" class="modal-input" placeholder="例如: 游戏完整版 v1.0.zip" />
      <label class="modal-label">下载链接 (URL):</label>
      <input v-model="extUrl" class="modal-input" placeholder="https://..." />
      <label class="modal-label">提取码/备注 (可选):</label>
      <input v-model="extNote" class="modal-input" placeholder="例如: 提取码 1234" />
      <div class="modal-footer">
        <button class="tool-btn" @click="showExtModal = false">取消</button>
        <button class="btn-primary" @click="insertExtLink">确认插入</button>
      </div>
    </div>
  </div>
</template>
