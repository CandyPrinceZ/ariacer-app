<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div class="page-header compact-header">
      <div class="header-content">
        <div class="header-text">
          <h2 class="page-title">
            <span class="icon-box">🛡️</span> System Activity Logs
          </h2>
          <p class="page-subtitle">ตรวจสอบประวัติการใช้งานและการแก้ไขข้อมูลในระบบ</p>
        </div>
        <div class="header-actions">
          <a-button type="default" size="small" @click="fetchLogs" :loading="loading">
            <ReloadOutlined /> Refresh Data
          </a-button>
        </div>
      </div>
    </div>

    <div style="padding: 12px; width: 100%;">

      <a-card :bordered="false" class="main-card" :bodyStyle="{ padding: '0' }">

        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="section-title">Transaction History</span>
          </div>
          <div class="toolbar-right">
            <a-input v-model:value="searchText" placeholder="Search User, Detail..." style="width: 220px" allow-clear
              size="small" class="modern-input">
              <template #prefix>
                <SearchOutlined class="text-muted" />
              </template>
            </a-input>

            <a-select v-model:value="filterAction" placeholder="Filter Action" style="width: 140px" allow-clear
              size="small" class="modern-select">
              <a-select-option value="LOGIN">Login</a-select-option>
              <a-select-option value="LOGIN_FAILED">Login Failed</a-select-option>
              <a-select-option value="UPDATE_USER">Update User</a-select-option>
              <a-select-option value="DELETE_ISSUE">Delete Issue</a-select-option>
              <a-select-option value="CREATE_ISSUE">Create Issue</a-select-option>
              <a-select-option value="CREATE_USER">Create User</a-select-option>
              <a-select-option value="UPDATE_ISSUE">Update Issue</a-select-option>
              <a-select-option value="REGISTER">Register</a-select-option>
            </a-select>
          </div>
        </div>

        <a-table :columns="columns" :data-source="filteredLogs" :loading="loading" rowKey="_id"
          :pagination="{ pageSize: 15, showSizeChanger: true, showTotal: total => `Total ${total} logs` }" size="middle"
          class="log-table">
          <template #bodyCell="{ column, record }">

            <template v-if="column.key === 'user'">
              <div class="user-cell">
                <a-avatar :style="{ backgroundColor: stringToColor(record.user?.user_name), fontSize: '12px' }"
                  size="small">
                  {{ record.user?.user_name?.[0] || '?' }}
                </a-avatar>
                <div class="user-info">
                  <span class="username">{{ record.user?.user_name || 'System / Unknown' }}</span>
                  <span v-if="record.user?.role_name" class="role-text">{{ record.user.role_name }}</span>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <a-tag :color="getActionColor(record.action)" class="action-tag">
                {{ record.action }}
              </a-tag>
            </template>

            <template v-if="column.key === 'createdAt'">
              <div class="date-wrapper">
                <span class="date-text">{{ formatDate(record.createdAt) }}</span>
                <span class="time-sub">{{ formatTime(record.createdAt) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'metadata'">
              <a-button v-if="record.metadata && Object.keys(record.metadata).length > 0" size="small" type="dashed"
                class="view-btn" @click="openMetadata(record)">
                <CodeOutlined /> Data
              </a-button>
              <span v-else class="text-muted">-</span>
            </template>

          </template>
        </a-table>
      </a-card>
    </div>

    <a-modal v-model:open="modal.visible" title="Transaction Metadata" :footer="null" width="600px" centered
      class="json-modal">
      <div class="metadata-content">
        <div class="meta-row">
          <span class="label">Action:</span>
          <span class="value">{{ modal.data?.action }}</span>
        </div>
        <div class="meta-row">
          <span class="label">Detail:</span>
          <span class="value">{{ modal.data?.detail }}</span>
        </div>
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
  ReloadOutlined, CodeOutlined, SearchOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

export default {
  name: 'SystemLogs',
  components: {
    ReloadOutlined, CodeOutlined, SearchOutlined
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
        { title: 'Date/Time', key: 'createdAt', width: 160 },
        { title: 'Actor', key: 'user', width: 220 },
        { title: 'Action', key: 'action', width: 160, align: 'center' },
        { title: 'Detail', dataIndex: 'detail', key: 'detail' },
        { title: 'Data', key: 'metadata', width: 100, align: 'center' },
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
/* 1. Compact Header */
.compact-header {
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  margin-bottom: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f1f1f;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-subtitle {
  margin: 2px 0 0;
  color: #8c8c8c;
  font-size: 13px;
}

.icon-box {
  background: #e6f7ff;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
}

/* 2. Main Card */
.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  min-height: 600px;
}

/* 3. Toolbar */
.table-toolbar {
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
  background: #fafafa;
}

.section-title {
  font-weight: 600;
  color: #1f1f1f;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

/* 4. Table Elements */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.username {
  font-weight: 500;
  color: #1f1f1f;
  font-size: 13px;
}

.role-text {
  font-size: 11px;
  color: #8c8c8c;
}

.action-tag {
  min-width: 90px;
  text-align: center;
  border-radius: 4px;
  font-weight: 500;
  font-size: 11px;
  border: none;
}

.date-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.date-text {
  font-weight: 500;
  color: #262626;
  font-size: 13px;
}

.time-sub {
  font-size: 11px;
  color: #8c8c8c;
}

.text-muted {
  color: #d9d9d9;
}

.view-btn {
  font-size: 11px;
  border-radius: 4px;
}

/* 5. Inputs */
.modern-input,
.modern-select {
  border-radius: 4px;
}

/* 6. Metadata Modal */
.metadata-content {
  font-size: 14px;
  color: #1f1f1f;
}

.meta-row {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.meta-row .label {
  font-weight: 600;
  color: #595959;
}

.json-viewer {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  margin-top: 12px;
  max-height: 400px;
  overflow: auto;
  border: 1px solid #333;
}

.json-viewer pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}
</style>