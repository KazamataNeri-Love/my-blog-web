import { createApp } from 'vue'
import KunUI from '@kungal/ui-vue'
import '@kungal/ui-vue/style.css'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(KunUI)
app.use(router)
app.mount('#app')
