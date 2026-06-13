import { ref, type Ref } from 'vue'
import type { GitTreeItem, TreeNode, ContentItem } from '@/types'

const OWNER = 'KazamataNeri-love'
const REPO = 'my-blog-web'
const BRANCH = 'main'

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`

/** Fetch full recursive file tree from GitHub Git Tree API */
export async function fetchFileTree(): Promise<GitTreeItem[]> {
  const res = await fetch(
    `${API_BASE}/git/trees/${BRANCH}?recursive=1&t=${Date.now()}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.tree.filter((item: any) => item.path.startsWith('posts/'))
}

/** Fetch markdown file content from raw URL */
export async function fetchPost(path: string): Promise<string> {
  const safePath = path.split('/').map(encodeURIComponent).join('/')
  const url = `${RAW_BASE}/${safePath}?t=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('文件不存在或无法访问')
  return await res.text()
}

/** Download file (blob download or open URL) */
export async function downloadFile(pathOrUrl: string) {
  if (pathOrUrl.startsWith('http')) {
    window.open(pathOrUrl, '_blank')
    return
  }
  const url = `${RAW_BASE}/${pathOrUrl}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('文件未找到')
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = decodeURIComponent(pathOrUrl.split('/').pop() || 'file')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (e: any) {
    alert('下载出错: ' + e.message)
  }
}

/** List directory contents via GitHub Contents API */
export async function listDir(path: string = ''): Promise<ContentItem[]> {
  const res = await fetch(`${API_BASE}/contents/${path}`)
  if (!res.ok) return []
  return await res.json()
}

/** Save/update a post via GitHub Contents API */
export async function savePost(
  fullPath: string,
  content: string,
  token: string
) {
  const contentEncoded = btoa(unescape(encodeURIComponent(content)))
  let sha: string | null = null

  try {
    const safePath = fullPath.split('/').map(encodeURIComponent).join('/')
    const check = await fetch(`${API_BASE}/contents/${safePath}`, {
      headers: { Authorization: `token ${token}` },
    })
    if (check.ok) {
      const data = await check.json()
      sha = data.sha
    }
  } catch {}

  const body: any = {
    message: `Update ${fullPath}`,
    content: contentEncoded,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${API_BASE}/contents/${fullPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
}

/** Upload image via GitHub Contents API */
export async function uploadImage(
  file: File,
  folderName: string,
  token: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const contentBase64 = (reader.result as string).split(',')[1]
      const filename = `${Date.now()}-${file.name}`
      const path = `_legacy/images/${encodeURIComponent(folderName)}/${filename}`

      const body = {
        message: `Upload image to ${folderName}`,
        content: contentBase64,
        branch: BRANCH,
      }

      try {
        const res = await fetch(`${API_BASE}/contents/${path}`, {
          method: 'PUT',
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await res.text())
        const rawUrl = `${RAW_BASE}/_legacy/images/${encodeURIComponent(folderName)}/${encodeURIComponent(filename)}`
        resolve(rawUrl)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = (e) => reject(e)
  })
}

/** Build a nested tree from flat file list */
export function buildTree(files: GitTreeItem[]): TreeNode {
  const root: TreeNode = { name: '', path: null, children: {} }

  files.forEach((file) => {
    if (file.type !== 'blob' && file.type !== 'tree') return
    if (!file.path.endsWith('.md') && file.type === 'blob') return

    const parts = file.path.replace(/^posts\//, '').split('/')
    let current = root
    parts.forEach((part, index) => {
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: index === parts.length - 1 && file.type === 'blob' ? file.path : null,
          children: {},
        }
      }
      current = current.children[part]
    })
  })

  return root
}

/** Sort tree nodes */
export function sortTreeKeys(
  nodes: Record<string, TreeNode>,
  mode: 'date' | 'title'
): string[] {
  return Object.keys(nodes).sort((a, b) => {
    const nodeA = nodes[a]
    const nodeB = nodes[b]
    const isFolderA = Object.keys(nodeA.children).length > 0 && !nodeA.path
    const isFolderB = Object.keys(nodeB.children).length > 0 && !nodeB.path

    if (isFolderA && !isFolderB) return -1
    if (!isFolderA && isFolderB) return 1

    if (mode === 'date') {
      return b.localeCompare(a, 'zh-CN')
    } else {
      const nameA = a.replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
      const nameB = b.replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
      return nameA.localeCompare(nameB, 'zh-CN')
    }
  })
}
