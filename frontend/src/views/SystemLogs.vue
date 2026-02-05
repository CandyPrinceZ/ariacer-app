<template>
  <a-layout style="min-height: 100vh; background: #f0f2f5;">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <SafetyCertificateOutlined /> System Activity Logs
        </h2>
        <p class="page-subtitle">ตรวจสอบประวัติการใช้งานและการแก้ไขข้อมูลในระบบ</p>
      </div>
      <a-button type="primary" @click="fetchLogs" :loading="loading">
        <ReloadOutlined /> Refresh Data
      </a-button>
    </div>

    <div class="page-content">
      <a-card :bordered="false" class="main-card">
        
        <div class="filter-bar">
          <a-input-search
            v-model:value="searchText"
            placeholder="ค้นหา (ชื่อผู้ใช้, รายละเอียด, Action)"
            style="width: 300px"
            allow-clear
          />

          <a-select
            v-model:value="filterAction"
            placeholder="Filter by Action"
            style="width: 200px"
            allow-clear
          >
            <a-select-option value="LOGIN">Login</a-select-option>
            <a-select-option value="UPDATE_USER">Update User</a-select-option>
            <a-select-option value="DELETE_ISSUE">Delete Issue</a-select-option>
            <a-select-option value="CREATE_ISSUE">Create Issue</a-select-option>
            <a-select-option value="REGISTER">Register</a-select-option>
          </a-select>
        </div>

        <a-table
          :columns="columns"
          :data-source="filteredLogs"
          :loading="loading"
          :pagination="{ pageSize: 10, showSizeChanger: true }"
          row-key="_id"
          class="log-table"
        >
          <template #bodyCell="{ column, record }">
            
            <template v-if="column.key === 'user'">
              <div class="user-cell">
                <a-avatar 
                  :style="{ backgroundColor: stringToColor(record.user?.user_name) }" 
                  size="small"
                >
                  {{ record.user?.user_name?.[0] || '?' }}
                </a-avatar>
                <span class="username">
                  {{ record.user?.user_name || 'System / Unknown' }}
                </span>
                <span v-if="record.user?.role_name" class="role-tag">
                  ({{ record.user.role_name }})
                </span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <a-tag :color="getActionColor(record.action)">
                {{ record.action }}
              </a-tag>
            </template>

            <template v-if="column.key === 'createdAt'">
              <span class="date-text">
                {{ formatDate(record.createdAt) }}
              </span>
              <div class="time-sub">
                {{ formatTime(record.createdAt) }}
              </div>
            </template>

            <template v-if="column.key === 'metadata'">
              <a-button 
                v-if="record.metadata && Object.keys(record.metadata).length > 0"
                size="small" 
                type="dashed"
                @click="openMetadata(record)"
              >
                <CodeOutlined /> View Data
              </a-button>
              <span v-else class="text-muted">-</span>
            </template>

          </template>
        </a-table>
      </a-card>
    </div>

    <a-modal
      v-model:open="modal.visible"
      title="Transaction Metadata"
      :footer="null"
      width="600px"
    >
      <div class="metadata-content">
        <p><strong>Action:</strong> {{ modal.data?.action }}</p>
        <p><strong>Detail:</strong> {{ modal.data?.detail }}</p>
        <div class="json-viewer">
          <pre>{{ JSON.stringify(modal.data?.metadata, null, 2) }}</pre>
        </div>
      </div>
    </a-modal>

  </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import { 
  SafetyCertificateOutlined, ReloadOutlined, CodeOutlined 
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

export default {
  name: 'SystemLogs',
  components: {
    SafetyCertificateOutlined, ReloadOutlined, CodeOutlined
  },
  data() {
    return {
      loading: false,
      logs: [],
      searchText: '',
      filterAction: undefined,
      modal: {
        visible: false,
        data: null
      },
      columns: [
        { title: 'Date/Time', key: 'createdAt', width: 180 },
        { title: 'User (Actor)', key: 'user', width: 250 },
        { title: 'Action', key: 'action', width: 150, filters: [] },
        { title: 'Detail', dataIndex: 'detail', key: 'detail' },
        { title: 'Metadata', key: 'metadata', width: 120, align: 'center' },
      ]
    };
  },
  computed: {
    filteredLogs() {
      return this.logs.filter(log => {
        const matchesSearch = 
          this.searchText === '' ||
          log.detail?.toLowerCase().includes(this.searchText.toLowerCase()) ||
          log.user?.user_name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
          log.action?.toLowerCase().includes(this.searchText.toLowerCase());

        const matchesAction = 
          !this.filterAction || 
          log.action === this.filterAction;

        return matchesSearch && matchesAction;
      });
    }
  },
  mounted() {
    this.fetchLogs();
  },
  methods: {
    async fetchLogs() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        // 👇 ยิงไป API ที่เราสร้างไว้ (getSystemLogs)
        const res = await axios.get(import.meta.env.VITE_API_URL + '/config/system-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.logs = res.data;
      } catch (error) {
        console.error(error);
        message.error('Failed to load logs');
      } finally {
        this.loading = false;
      }
    },
    getActionColor(action) {
      if (action.includes('DELETE')) return 'red';
      if (action.includes('UPDATE')) return 'orange';
      if (action.includes('CREATE') || action.includes('REGISTER')) return 'green';
      if (action.includes('LOGIN_FAILED')) return 'volcano';
      if (action.includes('LOGIN')) return 'blue';
      return 'default';
    },
    openMetadata(record) {
      this.modal.data = record;
      this.modal.visible = true;
    },
    formatDate(date) {
      return dayjs(date).format('DD MMM YYYY');
    },
    formatTime(date) {
      return dayjs(date).format('HH:mm:ss');
    },
    stringToColor(str) {
      if (!str) return '#ccc';
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    }
  }
};
</script>

<style scoped>
.page-header {
  background: #fff;
  padding: 20px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #1f1f1f;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-subtitle {
  margin: 4px 0 0 34px;
  color: #8c8c8c;
}

.page-content {
  padding: 24px 32px;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

/* User Cell Styling */
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.username {
  font-weight: 500;
  color: #1f1f1f;
}
.role-tag {
  font-size: 11px;
  color: #8c8c8c;
}

/* Date Styling */
.date-text {
  font-weight: 500;
  color: #262626;
}
.time-sub {
  font-size: 12px;
  color: #8c8c8c;
}

.text-muted {
  color: #d9d9d9;
}

/* JSON Viewer in Modal */
.json-viewer {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  margin-top: 10px;
  max-height: 400px;
  overflow: auto;
}
.json-viewer pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}
</style>