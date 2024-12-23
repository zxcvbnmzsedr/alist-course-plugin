import {createRouter, createWebHashHistory} from 'vue-router'
import CourseListView from '../views/CourseListView.vue'
import CourseView from '../views/CourseView.vue'
import ConfigView from '../views/ConfigView.vue'

const router = createRouter({
  history: createWebHashHistory(),
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
