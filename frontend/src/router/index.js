import { createRouter, createWebHistory } from 'vue-router'
import Swal from 'sweetalert2'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login.vue'),
    },
    {
      path: '/',
      component: () => import('../layout/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/dashboard.vue'),
        },
        {
          path: 'report-bug',
          name: 'report-bug',
          component: () => import('../views/report_bug.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/my_profile.vue'),
        },
        {
          path: 'user_management',
          name: 'usermanagement',
          component: () => import('../views/user_management.vue'),
          meta: { roles: ['Administrator', 'Developer'] },
        },
        {
          path: 'development',
          name: 'development',
          component: () => import('../views/development.vue'),
          meta: { roles: ['Administrator', 'Developer'] },
        },
        {
          path: 'development/detail/:id',
          name: 'DevelopmentDetail',
          component: () => import('../views/development_detail.vue'),
          meta: { roles: ['Administrator', 'Developer'] },
        },
        {
          path: 'Implement',
          name: 'Implement',
          component: () => import('../views/implement.vue'),
          meta: { roles: ['Administrator', 'Implement'] },
        },
        {
          path: 'Implement/detail/:id',
          name: 'ImplementDetail',
          component: () => import('../views/implement_detail.vue'),
          meta: { roles: ['Administrator', 'Implement'] },
        }
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// --- Middleware ตรวจสอบสิทธิ์ ---
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('user_role')

  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired && !token) {
    return next('/login')
  }

  if (token && publicPages.includes(to.path)) {
    return next('/dashboard')
  }

  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    Swal.fire({
      icon: 'error',
      title: 'ไม่สามารถเข้าถึงหน้านี้ได้',
      text: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
      timer: 1500,
      showConfirmButton: false,
    })
    return next('/dashboard')
  }

  next()
})

export default router
