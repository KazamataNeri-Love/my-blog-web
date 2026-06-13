/** GitHub Tree API item */
export interface GitTreeItem {
  path: string
  type: 'blob' | 'tree'
  sha: string
}

/** Node in our file tree */
export interface TreeNode {
  name: string
  path: string | null
  children: Record<string, TreeNode>
}

/** GitHub Contents API item */
export interface ContentItem {
  name: string
  path: string
  type: 'file' | 'dir'
  sha: string
}

/** Sort mode */
export type SortMode = 'date' | 'title'
