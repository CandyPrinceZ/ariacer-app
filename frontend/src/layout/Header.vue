<template>
  <a-layout-header class="header-container">

    <div class="header-left">
      <router-link to="/dashboard" class="logo-link">
        <span class="app-title">Ariacer System</span>
      </router-link>
    </div>

    <div class="header-right">
      <a-dropdown :trigger="['click']">
        <div class="user-profile-trigger">
          
          <a-avatar size="large" class="user-avatar">
            <template #icon v-if="!username">
              <UserOutlined />
            </template>
            <span>{{ username.charAt(0).toUpperCase() }}</span>
          </a-avatar>

          <div class="user-info">
            <span class="username">{{ username || 'Guest' }}</span>
            <a-tag color="blue" class="role-tag" v-if="userrole">
              {{ userrole.toUpperCase() }}
            </a-tag>
          </div>

          <DownOutlined class="dropdown-icon" />
        </div>

        <template #overlay>
          <a-menu class="custom-dropdown-menu">
            <div class="dropdown-header">
              <p>Signed in as <strong>{{ username }}</strong></p>
            </div>
            <a-menu-divider />
            <a-menu-item key="1">
              <UserOutlined /> <router-link :to="{ name: 'profile' }">My Profile</router-link>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="2" danger @click="handleLogout">
              <LogoutOutlined /> Logout
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

  </a-layout-header>
</template>

<script>
import axios from 'axios';
import { 
  UserOutlined, 
  DownOutlined, 
  LogoutOutlined, 
} from '@ant-design/icons-vue';
import Swal from 'sweetalert2';

export default {
  name: 'HeadersLayout',
  components: {
    UserOutlined,
    DownOutlined,
    LogoutOutlined,
  },
  data() {
    return {
      userdata: null,
      username: '',
      userrole: ''
    };
  },
  async mounted() {
    await this.fetchUserProfile();
  },
  methods: {
    handleLogout() {
      Swal.fire({
        title: 'Sign Out?',
        text: "Are you sure you want to log out?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        }
      });
    },
    async fetchUserProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', config);
        
        this.userdata = response.data;
        this.username = this.userdata.user_name || 'Unknown User'; 
        this.userrole = this.userdata.role_name || 'User';

      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    }
  }
};
</script>

<style scoped>
.header-container {
  background: #ffffff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); /* เงานุ่มขึ้น */
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  gap: 12px;
}

.logo-img {
  height: 36px;
  width: auto;
  border-radius: 6px;
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: -0.5px; 
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-profile-trigger {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 30px;
  transition: all 0.3s ease;
  background-color: transparent;
  border: 1px solid transparent;
}

.user-profile-trigger:hover {
  background-color: #f5f5f5;
  border-color: #e8e8e8;
}

.user-avatar {
  background-color: #1890ff;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.2);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 12px;
  margin-right: 8px;
  line-height: 1.2;
}

.username {
  font-weight: 600;
  font-size: 14px;
  color: #262626;
}

.role-tag {
  margin: 0;
  margin-top: 2px;
  font-size: 10px;
  line-height: 14px;
  padding: 0 6px;
  border-radius: 4px;
  border: none;
}

.dropdown-icon {
  font-size: 12px;
  color: #8c8c8c;
  margin-left: 4px;
}

.custom-dropdown-menu {
  padding: 8px 0;
  border-radius: 8px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

.dropdown-header {
  padding: 8px 16px;
  color: #595959;
  font-size: 13px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
}

.dropdown-header strong {
  color: #262626;
}
</style>