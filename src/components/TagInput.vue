<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ 'update:tags': [value: string[]] }>()
const props = defineProps<{ tags: string[] }>()

const inputValue = ref('')
const MAX_TAGS = 6
let lastEnterTime = 0

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const now = Date.now()
    // Double Enter within 500ms
    if (now - lastEnterTime < 500) {
      const tag = inputValue.value.trim()
      if (tag && !props.tags.includes(tag) && props.tags.length < MAX_TAGS) {
        emit('update:tags', [...props.tags, tag])
      }
      inputValue.value = ''
      lastEnterTime = 0
    } else {
      lastEnterTime = now
    }
  }
}

function removeTag(index: number) {
  const updated = [...props.tags]
  updated.splice(index, 1)
  emit('update:tags', updated)
}
</script>

<template>
  <div class="space-y-2">
    <!-- Tag bubbles -->
    <div v-if="tags.length > 0" class="flex flex-wrap gap-1.5">
      <span
        v-for="(tag, i) in tags"
        :key="i"
        class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-kun-sm bg-primary/10 text-primary border border-primary/20"
      >
        {{ tag }}
        <button
          class="cursor-pointer hover:text-danger transition-colors leading-none text-xs"
          @click="removeTag(i)"
        >×</button>
      </span>
      <span v-if="tags.length >= MAX_TAGS" class="text-xs text-default-400 self-center">(已达上限)</span>
    </div>
    <!-- Input -->
    <input
      v-model="inputValue"
      type="text"
      placeholder="输入标签后按两次 Enter 添加…"
      class="w-full px-3 py-2 text-sm border border-default-200 rounded-kun-md bg-background text-foreground outline-none transition-colors focus:border-primary placeholder:text-default-400"
      :disabled="tags.length >= MAX_TAGS"
      @keydown="onKeydown"
    />
  </div>
</template>
