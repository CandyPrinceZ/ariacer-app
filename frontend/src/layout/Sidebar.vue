<template>
  <a-drawer v-if="isMobile" placement="left" :closable="false" :open="mobileOpen" @close="closeMobileMenu" width="260"
    :bodyStyle="{ padding: 0, background: '#001529' }" class="mobile-drawer-sider">
    <div class="drawer-content">
      <div class="logo-area">
        <img src="/CES_logo.png" alt="Logo" class="logo-img" />
        <span class="brand-text">Ariacer</span>
        <a-button type="text" class="close-btn" @click="closeMobileMenu">
          <CloseOutlined />
        </a-button>
      </div>
      <AppMenu :selectedKeys="selectedKeys" @menuClick="handleMenuClick" />
    </div>
  </a-drawer>

  <div v-if="isMobile" class="mobile-hamburger" @click="openMobileMenu">
    <MenuUnfoldOutlined />
  </div>

  <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible :width="260"
    :collapsedWidth="isMobile ? 0 : 80" breakpoint="lg" @breakpoint="onBreakpoint" class="desktop-sider"
    :class="{ 'hidden-sider': isMobile && collapsed }">
    <div class="logo-area" v-if="!isMobile || !collapsed">
      <img src="/CES_logo.png" alt="Logo" class="logo-img" />
      <transition name="fade">
        <span v-if="!collapsed" class="brand-text">Ariacer</span>
      </transition>
    </div>

    <div class="menu-scroll-wrapper" v-if="!isMobile || !collapsed">
      <AppMenu :selectedKeys="selectedKeys" />
    </div>

    <div v-if="!isMobile" class="sider-footer" @click="toggleCollapse">
      <component :is="collapsed ? 'MenuUnfoldOutlined' : 'MenuFoldOutlined'" />
    </div>
  </a-layout-sider>
</template>

<script>
import { defineComponent, h, resolveComponent, ref, watch, } from 'vue';
import { useRoute } from 'vue-router';
import {
  DashboardOutlined, BugOutlined, TeamOutlined, SafetyCertificateOutlined,
  FileProtectOutlined, CodeOutlined, DeploymentUnitOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, CloseOutlined, CloudServerOutlined, AppstoreOutlined, AlignCenterOutlined
} from '@ant-design/icons-vue';

// --- Sub-Component: AppMenu (เมนูกลาง ใช้ร่วมกัน) ---
const AppMenu = defineComponent({
  props: ['selectedKeys'],
  emits: ['menuClick'],
  setup(props, { emit }) {
    const isAdmin = localStorage.getItem('user_role') === 'Administrator';

    return () => h(resolveComponent('a-menu'), {
      selectedKeys: props.selectedKeys,
      theme: 'dark',
      mode: 'inline',
      class: 'custom-ant-menu',
      onClick: () => emit('menuClick')
    }, () => [
      h('div', { class: 'menu-group-title' }, 'GENERAL'),
      h(resolveComponent('a-menu-item'), { key: 'dashboard' }, {
        icon: () => h(DashboardOutlined),
        default: () => h(resolveComponent('router-link'), { to: { name: 'dashboard' } }, () => 'Dashboard')
      }),
      h(resolveComponent('a-menu-item'), { key: 'report-bug' }, {
        icon: () => h(BugOutlined),
        default: () => h(resolveComponent('router-link'), { to: { name: 'report-bug' } }, () => 'Report Issue')
      }),
      h(resolveComponent('a-menu-item'), { key: 'developer-overview' }, {
        icon: () => h(AppstoreOutlined),
        default: () => h(resolveComponent('router-link'), { to: { name: 'DeveloperOverview' } }, () => 'Developer Overview')
      }),
      h(resolveComponent('a-menu-item'), { key: 'leaderboard' }, {
        icon: () => h(AlignCenterOutlined),
        default: () => h(resolveComponent('router-link'), { to: { name: 'leaderboard' } }, () => 'Leaderboard')
      }),

      h('div', { class: 'menu-divider' }),

      h('div', { class: 'menu-group-title' }, 'DEV TOOLS'),
      h(resolveComponent('a-menu-item'), { key: 'development' }, {
        icon: () => h(CodeOutlined),
        default: () => h(resolveComponent('router-link'), { to: { name: 'development' } }, () => 'Development')
      }),
      h(resolveComponent('a-menu-item'), { key: 'Implement' }, {
        icon: () => h(DeploymentUnitOutlined),
        default: () => h(resolveComponent('router-link'), { to: { name: 'Implement' } }, () => 'Implementation')
      }),

      ...(isAdmin ? [
        h('div', { class: 'menu-divider' }),
        h('div', { class: 'menu-group-title' }, 'ADMINISTRATION'),
        h(resolveComponent('a-menu-item'), { key: 'IssueManagement' }, {
          icon: () => h(FileProtectOutlined),
          default: () => h(resolveComponent('router-link'), { to: { name: 'IssueManagement' } }, () => 'Issue Management')
        }),
        h(resolveComponent('a-menu-item'), { key: 'usermanagement' }, {
          icon: () => h(TeamOutlined),
          default: () => h(resolveComponent('router-link'), { to: { name: 'usermanagement' } }, () => 'User Management')
        }),
        h(resolveComponent('a-menu-item'), { key: 'system-logs' }, {
          icon: () => h(SafetyCertificateOutlined),
          default: () => h(resolveComponent('router-link'), { to: { name: 'system-logs' } }, () => 'System Logs')
        }),
        h(resolveComponent('a-menu-item'), { key: 'servers-management' }, {
          icon: () => h(CloudServerOutlined),
          default: () => h(resolveComponent('router-link'), { to: { name: 'Servers-management' } }, () => 'Server Management')
        })
      ] : [])
    ]);
  }
});

// --- Main Sidebar Component ---
export default defineComponent({
  name: 'AppSidebar',
  components: {
    AppMenu,
    MenuUnfoldOutlined, MenuFoldOutlined, AppstoreOutlined, CloseOutlined
  },
  setup() {
    const route = useRoute();
    const collapsed = ref(false);
    const mobileOpen = ref(false);
    const selectedKeys = ref([]);
    const isMobile = ref(false);

    const onBreakpoint = (broken) => {
      isMobile.value = broken;
      if (broken) {
        collapsed.value = true;
      } else {
        collapsed.value = false;
      }
    };

    const openMobileMenu = () => { mobileOpen.value = true; };
    const closeMobileMenu = () => { mobileOpen.value = false; };
    const handleMenuClick = () => {
      if (isMobile.value) closeMobileMenu();
    };
    const toggleCollapse = () => { collapsed.value = !collapsed.value; };

    watch(
      () => route.name,
      (val) => { if (val) selectedKeys.value = [val]; },
      { immediate: true }
    );

    return {
      collapsed, mobileOpen, selectedKeys, isMobile,
      openMobileMenu, closeMobileMenu, handleMenuClick, toggleCollapse, onBreakpoint
    };
  }
});
</script>

<style scoped>
/* --- DESKTOP SIDER --- */
.desktop-sider {
  background: #001529;
  background: linear-gradient(180deg, #001529 0%, #000c17 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  height: 100vh;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 10;
  overflow: hidden;
}

/* 🔥 KEY FIX: เมื่อเป็นมือถือและพับอยู่ ให้ซ่อน Sider ไปเลย ไม่กินพื้นที่ */
.hidden-sider {
  position: absolute;
  /* หลบออกจาก Flow */
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  flex: 0 0 0 !important;
  overflow: hidden;
}

/* --- MOBILE HAMBURGER --- */
.mobile-hamburger {
  position: fixed;
  bottom: 18px;
  left: 18px;
  z-index: 1000;
  width: 40px;
  height: 40px;
  background: #001529;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.mobile-hamburger:active {
  transform: scale(0.95);
}

/* --- LOGO --- */
.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.02);
  white-space: nowrap;
  overflow: hidden;
}

.logo-img {
  height: 32px;
  width: 32px;
  object-fit: contain;
  margin-right: 12px;
}

.brand-text {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-family: 'Segoe UI', sans-serif;
}

.close-btn {
  color: #fff;
  margin-left: auto;
  font-size: 16px;
}

.close-btn:hover {
  color: #ff4d4f;
}

/* --- MENU --- */
:deep(.custom-ant-menu) {
  background: transparent;
  border-right: none;
}

:deep(.menu-group-title) {
  padding: 16px 0 8px 24px;
  font-size: 11px;
  color: #5c6b7f;
  font-weight: 800;
  letter-spacing: 1px;
  user-select: none;
}

.ant-layout-sider-collapsed :deep(.menu-group-title) {
  display: none;
}

:deep(.menu-divider) {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 8px 16px;
}

:deep(.ant-menu-item) {
  margin: 4px 8px !important;
  width: auto !important;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
}

:deep(.ant-menu-item-selected) {
  background-color: #1890ff !important;
  color: #fff !important;
  font-weight: 500;
}

/* --- SCROLL AREA --- */
.menu-scroll-wrapper {
  height: calc(100vh - 64px - 48px);
  overflow-y: auto;
}

.menu-scroll-wrapper::-webkit-scrollbar {
  width: 4px;
}

.menu-scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

/* --- FOOTER --- */
.sider-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: background 0.3s;
}

.sider-footer:hover {
  background: #1890ff;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>