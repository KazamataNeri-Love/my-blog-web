import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/components/HomeView.vue'
import EditorView from '@/components/EditorView.vue'

const router = createRouter({
  history: createWebHistory('/my-blog-web/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorView,
      props: (route) => ({
        editPath: route.query.edit || null,
      }),
    },
  ],
})

export default router
