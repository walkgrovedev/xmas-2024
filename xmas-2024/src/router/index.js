import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AnswerView from '../views/AnswerView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/@n5w3rS',
      name: 'answers',
      component: AnswerView,
    },
  ],
})

export default router
