<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HomeContent from './HomeContent.vue'
import PostView from './PostView.vue'

const route = useRoute()
const isReading = computed(() => !!route.query.f)
</script>

<template>
  <!-- 浏览态：文章阅读 -->
  <PostView v-if="isReading" />

  <!-- 常态：双气泡（公告 + 帖子列表） -->
  <HomeContent v-else />
</template>
