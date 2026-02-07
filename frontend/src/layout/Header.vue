<template>
  <a-layout-header class="modern-header">

    <div class="header-left">
      <router-link to="/dashboard" class="brand-link">
        <span class="brand-text">Ariacer <span class="highlight">System</span></span>
      </router-link>
    </div>

    <div class="header-right">
      <a-dropdown :trigger="['click']" placement="bottomRight" overlayClassName="custom-dropdown-overlay">
        <div class="user-profile-card">

          <div class="user-details">
            <span class="user-name">{{ username || 'Guest' }}</span>
            <span class="user-role-text">{{ userrole || 'Visitor' }}</span>
          </div>

          <a-avatar size="large" class="user-avatar" :src="useravatar"
            :style="{ backgroundColor: !useravatar ? stringToColor(username) : 'transparent' }">
            <span v-if="!useravatar && username">{{ username.charAt(0).toUpperCase() }}</span>
            <UserOutlined v-else-if="!useravatar" />
          </a-avatar>

          <DownOutlined class="dropdown-arrow" />
        </div>

        <template #overlay>
          <a-menu class="styled-dropdown-menu">
            <div class="menu-header-info">
              <div class="info-content">
                <p class="info-name">{{ username }}</p>
                <p class="info-email">Logged in as {{ userrole }}</p>
              </div>
            </div>

            <a-menu-divider />

            <a-menu-item key="1" class="menu-item-custom">
              <router-link :to="{ name: 'profile' }">
                <UserOutlined /> <span>My Profile</span>
              </router-link>
            </a-menu-item>

            <a-menu-divider />

            <a-menu-item key="2" danger class="menu-item-custom" @click="handleLogout">
              <LogoutOutlined /> <span>Sign Out</span>
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
  name: 'AppHeader',
  components: {
    UserOutlined,
    DownOutlined,
    LogoutOutlined,
  },
  data() {
    return {
      userdata: null,
      username: '',
      userrole: '',
      useravatar: '' // ✅ เพิ่มตัวแปรเก็บ Avatar URL
    };
  },
  async mounted() {
    await this.fetchUserProfile();
  },
  methods: {
    stringToColor(str) {
      if (!str) return '#1890ff';
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    },
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
        this.useravatar = this.userdata.avatar || ''; // ✅ ดึง avatar จาก API

      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    }
  }
};
</script>

<style scoped>
/* Main Header Container */
.modern-header {
  background: #ffffff;
  padding: 0 32px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 50;
  transition: all 0.3s ease;
}

/* Left Side Styling */
.brand-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-text {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.highlight {
  color: #3b82f6;
}

/* Right Side Styling */
.user-profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px 6px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.user-profile-card:hover {
  background-color: #f8fafc;
  border-color: #e2e8f0;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #334155;
}

.user-role-text {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.user-avatar {
  border: 2px solid #ffffff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-profile-card:hover .user-avatar {
  transform: scale(1.05);
}

.dropdown-arrow {
  font-size: 10px;
  color: #94a3b8;
  margin-left: 4px;
}

/* Dropdown Menu Styling */
:deep(.styled-dropdown-menu) {
  border-radius: 12px;
  padding: 8px;
  width: 240px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.menu-header-info {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.info-name {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
  font-size: 15px;
}

.info-email {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.menu-item-custom {
  border-radius: 6px;
  margin: 2px 0;
}

.menu-item-custom a {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modern-header {
    padding: 0 16px;
    height: 64px;
  }

  .user-details {
    display: none;
  }

  .user-profile-card {
    padding: 4px;
    gap: 0;
  }

  .dropdown-arrow {
    display: none;
  }
}
</style>