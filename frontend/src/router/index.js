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
          path: 'leaderboard',
          name: 'leaderboard',
          component: () => import('../views/Leader_board.vue'),
        },
        {
          path: 'developer-overview',
          name: 'DeveloperOverview',
          component: () => import('../views/developer_overview.vue'),
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
          path: 'user-management',
          name: 'usermanagement',
          component: () => import('../views/user_management.vue'),
          meta: { roles: ['Administrator'] },
        },
        {
          path: 'system-logs',
          name: 'system-logs',
          component: () => import('../views/SystemLogs.vue'),
          meta: { roles: ['Administrator'] },
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
        },
        {
          path: 'Issue/detail/:id',
          name: 'IssueDetail',
          component: () => import('../views/issue_detail.vue'),
        },
        {
          path: 'Issue/edit/:id',
          name: 'IssueEdit',
          component: () => import('../views/issue_edit.vue'),
        },
        {
          path: 'Issue-management',
          name: 'IssueManagement',
          component: () => import('../views/issue_management.vue'),
          meta: { roles: ['Administrator'] },
        },
        {
          path: 'Issue/edit-admin/:id',
          name: 'IssueEditAdmin',
          component: () => import('../views/issue_edit_admin.vue'),
          meta: { roles: ['Administrator'] },
        },
        {
          path: 'Servers-management',
          name: 'Servers-management',
          component: () => import('../views/server_management.vue'),
          meta: { roles: ['Administrator'] },
        },
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
