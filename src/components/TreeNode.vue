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

function displayName(name: string): string {
  return name.replace('.md', '').replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '')
}
</script>

<template>
  <template v-for="key in getKeys()" :key="key">
    <!-- Folder (KunButton light style) -->
    <li v-if="nodes[key].children && Object.keys(nodes[key].children).length > 0 && !nodes[key].path" class="folder-open">
      <button
        class="relative inline-flex cursor-pointer items-center gap-1.5 overflow-hidden font-medium transition-all w-full text-left px-3 py-1.5 text-sm rounded-md text-default-500 hover:bg-default-100 hover:text-foreground"
        @click="toggleFolder"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 transition-transform">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0" style="color: hsl(37, 74%, 44%);">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
        <span class="truncate text-xs">{{ displayName(nodes[key].name) }}</span>
      </button>
      <ul class="hidden pl-3 list-none folder-open:block">
        <TreeNode
          :nodes="nodes[key].children"
          :sort-mode="sortMode"
          :active-path="activePath"
          @select="emit('select', $event)"
        />
      </ul>
    </li>
    <!-- File (KunButton light style) -->
    <li v-else>
      <button
        class="relative inline-flex cursor-pointer items-center gap-2 overflow-hidden font-medium transition-all w-full text-left px-3 py-1.5 text-sm rounded-md truncate"
        :class="activePath === nodes[key].path
          ? '!text-primary !bg-primary/10'
          : 'text-default-500 hover:bg-default-100 hover:text-foreground'"
        @click="emit('select', nodes[key].path!)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span class="truncate text-xs">{{ displayName(nodes[key].name) }}</span>
      </button>
    </li>
  </template>
</template>
