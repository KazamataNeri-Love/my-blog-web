import { ref, type Ref } from 'vue'
import type { GitTreeItem, TreeNode, ContentItem } from '@/types'

const OWNER = 'KazamataNeri-love'
const REPO = 'my-blog-web'
const BRANCH = 'main'

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`

/** Fetch full recursive file tree from GitHub Git Tree API
 *  Cached in localStorage for 5 min to avoid 403 rate limiting. */
const TREE_CACHE_KEY = 'github-tree-cache'
const TREE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function fetchFileTree(): Promise<GitTreeItem[]> {
  // Check cache
  const cached = localStorage.getItem(TREE_CACHE_KEY)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < TREE_CACHE_TTL) return data
    } catch { /* ignore corrupt cache */ }
  }

  const res = await fetch(
    `${API_BASE}/git/trees/${BRANCH}?recursive=1&t=${Date.now()}`
  )
  if (!res.ok) {
    // On failure, try stale cache
    if (cached) {
      try {
        const { data } = JSON.parse(cached)
        return data
      } catch { /* ignore */ }
    }
    return []
  }
  const json = await res.json()
  const items: GitTreeItem[] = json.tree.filter((item: any) =>
    item.path.startsWith('Article/')
  )
  // Write cache
  try {
    localStorage.setItem(TREE_CACHE_KEY, JSON.stringify({ data: items, timestamp: Date.now() }))
  } catch { /* quota exceeded, ignore */ }
  return items
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

/** Upload image via GitHub Contents API
 *
 * Naming scheme: ArticleResource/{channel}/{date}-{sanitized-name}.png
 *   - channel: passed from editor (e.g. '音乐', '美术')
 *   - date:    today's date, e.g. '2026-06-15'
 *   - name:    original filename stripped of extension and special chars
 */
export async function uploadImage(
  file: File,
  channel: string,
  token: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const contentBase64 = (reader.result as string).split(',')[1]
      const safeName = file.name
        .replace(/\.[^.]+$/, '')          // strip extension
        .replace(/[^\w\-]/g, '')          // keep only letters/digits/underscore/hyphen
        .slice(0, 60)                       // length cap
      const today = new Date().toISOString().slice(0, 10)
      const filename = `${today}-${safeName}.png`
      const channelSafe = encodeURIComponent(channel)
      const path = `ArticleResource/${channelSafe}/${filename}`

      const body = {
        message: `Upload image to ${channel}`,
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
        const rawUrl = `${RAW_BASE}/ArticleResource/${channelSafe}/${encodeURIComponent(filename)}`
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

    const parts = file.path.replace(/^Article\//, '').split('/')
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
