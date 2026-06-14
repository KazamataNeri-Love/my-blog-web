import { ref, type Ref } from 'vue'

export interface TocItem {
  level: number
  text: string
  id: string
}

/** Shared reactive TOC state — PostView writes, RightSidebar reads */
const tocItems = ref<TocItem[]>([])

export function useToc() {
  /** Parse HTML string and extract h1/h2/h3 → TocItem[] */
  function extractToc(html: string): TocItem[] {
    const items: TocItem[] = []
    const idMap = new Map<string, number>()
    const headingRegex = /<h([1-3])(\s[^>]*)?>([\s\S]*?)<\/h[1-3]>/gi
    let match

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1])
      const rawText = match[3].replace(/<[^>]+>/g, '').trim()

      // Generate unique ID
      let id = rawText
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '') || `heading-${items.length}`

      const count = idMap.get(id) || 0
      if (count > 0) id += `-${count}`
      idMap.set(id.replace(/-\d+$/, ''), count + 1)

      items.push({ level, text: rawText, id })
    }

    return items
  }

  /** Update the shared TOC state */
  function updateToc(html: string) {
    tocItems.value = extractToc(html)
  }

  /** Clear TOC state */
  function clearToc() {
    tocItems.value = []
  }

  return { tocItems, extractToc, updateToc, clearToc }
}
