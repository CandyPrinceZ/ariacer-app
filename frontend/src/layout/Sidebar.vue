<template>
  <a-layout-sider v-model:collapsed="collapsed" collapsible :width="250" class="app-sider">
    <div class="logo-container">
      <img src="/CES_logo.png" alt="Logo" class="sidebar-logo" />
      <transition name="fade">
        <h1 v-if="!collapsed" class="sidebar-title">Ariacer</h1>
      </transition>
    </div>

    <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline" class="custom-menu">
      <a-menu-item key="dashboard">
        <template #icon>
          <DashboardOutlined />
        </template>
        <router-link :to="{ name: 'dashboard' }">Dashboard</router-link>
      </a-menu-item>

      <a-menu-item key="report-bug">
        <template #icon>
          <BugOutlined />
        </template>
        <router-link :to="{ name: 'report-bug' }">Report Issue</router-link>
      </a-menu-item>

      <a-menu-item key="development">
        <template #icon>
          <HddOutlined />
        </template>
        <router-link :to="{ name: 'development' }">Development</router-link>
      </a-menu-item>

      <a-menu-item key="implementation">
        <template #icon>
          <PieChartOutlined />
        </template>
        <router-link :to="{ name: 'Implement' }">Implementation</router-link> 
      </a-menu-item>

      <a-menu-item key="users">
        <template #icon>
          <TeamOutlined />
        </template>
        <router-link :to="{ name: 'usermanagement' }">User Management</router-link>
      </a-menu-item>


    </a-menu>
  </a-layout-sider>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  DashboardOutlined,
  BugOutlined,
  TeamOutlined,
  HddOutlined,
  PieChartOutlined
} from '@ant-design/icons-vue';

export default defineComponent({
  name: 'SideBar',
  components: {
    DashboardOutlined,
    BugOutlined,
    TeamOutlined,
    HddOutlined,
    PieChartOutlined
  },
  setup() {
    const route = useRoute();
    const collapsed = ref(false);
    const selectedKeys = ref([]);

    watch(
      () => route.name,
      (newRouteName) => {
        if (newRouteName) {
          selectedKeys.value = [newRouteName];
        }
      },
      { immediate: true }
    );

    return {
      collapsed,
      selectedKeys,
    };
  },
});
</script>

<style scoped>
.app-sider {
  background: #111827 !important;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  z-index: 10;
}

.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 8px;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-logo {
  height: 32px;
  width: auto;
  margin: 0 10px;
}

.sidebar-title {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

:deep(.ant-layout-sider-children),
:deep(.ant-menu.ant-menu-dark),
:deep(.ant-menu-dark .ant-menu-sub),
:deep(.ant-menu.ant-menu-dark .ant-menu-sub) {
  background: #141b2d !important;
}

:deep(.ant-layout-sider-trigger) {
  background: #111827 !important;
}

:deep(.ant-menu-dark .ant-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.ant-menu-dark .ant-menu-item-selected) {
  background: linear-gradient(90deg, #3e34ff, #69247C) !important;
  color: white !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>