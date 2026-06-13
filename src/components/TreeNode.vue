<script setup lang="ts">
import { type PropType } from 'vue'
import type { TreeNode as TreeNodeType, SortMode } from '@/types'
import { sortTreeKeys } from '@/composables/useGithubApi'

defineOptions({ name: 'TreeNode' })

const props = defineProps({
  nodes: { type: Object as PropType<Record<string, TreeNodeType>>, required: true },
  sortMode: { type: String as PropType<SortMode>, default: 'date' as const },
  activePath: { type: String, default: '' },
})

const emit = defineEmits<{ select: [path: string] }>()

function toggleFolder(e: MouseEvent) {
  const li = (e.target as HTMLElement).closest('li')
  if (li) li.classList.toggle('folder-open')
}

function getKeys() {
  return sortTreeKeys(props.nodes, props.sortMode)
}
</script>

<template>
  <template v-for="key in getKeys()" :key="key">
    <li v-if="nodes[key].children && Object.keys(nodes[key].children).length > 0 && !nodes[key].path">
      <div class="folder-item" @click="toggleFolder">
        <svg class="folder-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <svg class="folder-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
        <span>{{ nodes[key].name.replace('.md', '').replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '') }}</span>
      </div>
      <ul class="nested-ul">
        <TreeNode
          :nodes="nodes[key].children"
          :sort-mode="sortMode"
          :active-path="activePath"
          @select="emit('select', $event)"
        />
      </ul>
    </li>
    <li v-else>
      <div
        class="file-item"
        :class="{ active: activePath === nodes[key].path }"
        @click="emit('select', nodes[key].path!)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span>{{ nodes[key].name.replace('.md', '').replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '') }}</span>
      </div>
    </li>
  </template>
</template>
