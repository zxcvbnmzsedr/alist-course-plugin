import { createRouter, createWebHistory } from 'vue-router'
import CourseListView from '../views/CourseListView.vue'
import CourseView from '../views/CourseView.vue'
import ConfigView from '../views/ConfigView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: CourseListView
    },
    {
      path: '/course/:courseName',
      name: 'course',
      component: CourseView
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigView
    }
  ]
})

export default router
