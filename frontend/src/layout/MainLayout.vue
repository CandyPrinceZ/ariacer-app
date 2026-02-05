<template>
  <div class="app-layout">
    <SideBar class="sidebar-container" />

    <div class="main-content">
      <Headers />

      <div class="page-view">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import Headers from './Header.vue'
import SideBar from './Sidebar.vue'

export default {
  name: 'MainLayout',
  components: {
    Headers,
    SideBar
  },
};
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.sidebar-container {
  width: 250px;
  flex-shrink: 0;
  background-color: #001529;
  color: white;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  overflow: hidden;
}

.page-view {
  flex: 1;
  overflow-y: auto;
}
</style>