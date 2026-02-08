<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div class="page-header compact-header">
      <div class="header-content">
        <div class="header-text">
          <h2 class="page-title">
            <span class="icon-box">🧪</span> QA/Tester Console
          </h2>
          <p class="page-subtitle">จัดการและตรวจสอบความถูกต้องของระบบ</p>
        </div>
        <div class="header-actions">
          <a-button type="default" size="small" @click="fetchTasks" :loading="loading">
            <ReloadOutlined /> <span class="btn-text">Refresh</span>
          </a-button>
        </div>
      </div>
    </div>

    <div class="content-wrapper">

      <a-row :gutter="[10, 10]" class="fade-in-up" style="margin-bottom: 10px;">
        <a-col :xs="24" :sm="8">
          <a-card :bordered="false" class="stat-card icon-orange-bg">
            <a-statistic title="Ready to Test" :value="statReady">
              <template #prefix>
                <ExperimentOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card :bordered="false" class="stat-card icon-blue-bg">
            <a-statistic title="In Testing (My Tasks)" :value="statTesting">
              <template #prefix>
                <AuditOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-card :bordered="false" class="stat-card icon-green-bg">
            <a-statistic title="Passed Today" :value="statPassed">
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <a-card :bordered="false" class="main-card"
        :bodyStyle="{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }">

        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="section-title">
              <UnorderedListOutlined /> Testing Queue
            </span>
          </div>
          <div class="toolbar-right">
            <a-radio-group v-model:value="filterMode" button-style="solid" size="small">
              <a-radio-button value="all">All Pending</a-radio-button>
              <a-radio-button value="upserver">Ready</a-radio-button>
              <a-radio-button value="testing">My Testing</a-radio-button>
            </a-radio-group>
          </div>
        </div>

        <a-table :dataSource="filteredTableData" :columns="columns" rowKey="_id"
          :pagination="{ pageSize: 10, showSizeChanger: false }" :loading="loading" size="middle"
          :scroll="{ x: 800, y: 'calc(100vh - 280px)' }" :locale="{ emptyText: 'เยี่ยมมาก! ไม่มีงานค้างรอตรวจสอบ' }"
          class="qa-table">
          <template #bodyCell="{ column, record }">

            <template v-if="column.key === 'id'">
              <span class="id-badge">{{ record.issue_id || record.id || 'N/A' }}</span>
            </template>

            <template v-if="column.key === 'name'">
              <div class="task-name text-ellipsis">{{ record.name }}</div>
              <div class="meta-info">
                <span v-if="record.assignee">
                  <UserOutlined /> {{ record.assignee.user_name }}
                </span>
                <a-tooltip v-if="record.reporter" :title="'Reporter: ' + record.reporter.user_name">
                  <span class="ml-2">
                    <InfoCircleOutlined />
                  </span>
                </a-tooltip>
              </div>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status?.code)" class="status-tag">
                <template #icon>
                  <SyncOutlined spin v-if="record.status?.code === 'testing'" />
                  <ExperimentOutlined v-else />
                </template>
                {{ record.status?.name || record.status?.code || 'UNKNOWN' }}
              </a-tag>
            </template>

            <template v-if="column.key === 'urgency'">
              <a-tag :color="record.urgency?.color || 'default'" class="dot-tag">
                <span class="dot" :style="{ background: record.urgency?.color }"></span>
                {{ record.urgency?.name }}
              </a-tag>
            </template>

            <template v-if="column.key === 'action'">
              <a-button v-if="record.status?.code === 'upserver'" type="primary" size="small"
                class="action-btn start-btn" @click="startTesting(record)">
                Start
                <AuditOutlined />
              </a-button>

              <a-button v-else-if="record.status?.code === 'testing'" type="default" size="small"
                class="action-btn continue-btn" @click="goToTestDetail(record._id)">
                Continue
                <RightOutlined />
              </a-button>
            </template>

          </template>
        </a-table>
      </a-card>

    </div>
  </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';
import {
  ExperimentOutlined, CheckCircleOutlined, AuditOutlined,
  UnorderedListOutlined, ReloadOutlined, UserOutlined, InfoCircleOutlined,
  SyncOutlined, RightOutlined
} from '@ant-design/icons-vue';

export default {
  name: 'ImplementView',
  components: {
    ExperimentOutlined, CheckCircleOutlined, AuditOutlined,
    UnorderedListOutlined, ReloadOutlined, UserOutlined, InfoCircleOutlined,
    SyncOutlined, RightOutlined
  },
  data() {
    return {
      loading: false,
      allTasks: [],
      authProfile: null,
      statusOptions: [],
      filterMode: 'all',
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, align: 'center', fixed: 'left' }, // Fix ID column on mobile
        { title: 'Task / Subject', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 120, align: 'center' },
        { title: 'Urgency', dataIndex: 'urgency', key: 'urgency', width: 100, align: 'center' },
        { title: 'Submitted', dataIndex: 'updatedAt', key: 'updatedAt', width: 130, align: 'center', customRender: ({ text }) => dayjs(text).format('DD/MM/YY HH:mm') },
        { title: 'Action', key: 'action', width: 100, align: 'center', fixed: 'right' }, // Fix Action column on mobile
      ]
    };
  },
  computed: {
    filteredTableData() {
      if (this.filterMode === 'all') {
        return this.allTasks.filter(t => ['upserver', 'testing'].includes(t.status?.code));
      }
      return this.allTasks.filter(t => t.status?.code === this.filterMode);
    },
    statReady() { return this.allTasks.filter(t => t.status?.code === 'upserver').length; },
    statTesting() { return this.allTasks.filter(t => t.status?.code === 'testing').length; },
    statPassed() { return this.allTasks.filter(t => t.status?.code === 'success').length; }
  },
  async mounted() {
    this.loading = true;
    await Promise.all([
      this.getAuthProfile(),
      this.fetchDropdownStatusOptions()
    ]);
    await this.fetchTasks();
    this.loading = false;
  },
  methods: {
    async getAuthProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.authProfile = res.data;
      } catch (e) { console.error(e); }
    },
    async fetchDropdownStatusOptions() {
      const token = localStorage.getItem('token');
      const res = await axios.get(import.meta.env.VITE_API_URL + '/items/statuses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.statusOptions = res.data;
    },
    async fetchTasks() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(import.meta.env.VITE_API_URL + `/issues/tester/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.allTasks = res.data;
      } catch (e) {
        console.error(e);
        message.error('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },
    getStatusColor(code) {
      if (code === 'upserver') return 'orange';
      if (code === 'testing') return 'blue';
      if (code === 'success') return 'green';
      return 'default';
    },
    async startTesting(record) {
      try {
        const token = localStorage.getItem('token');
        const testingStatus = this.statusOptions.find(s => s.code === 'testing');
        if (!testingStatus) {
          message.error('ไม่พบสถานะ Testing ในระบบ');
          return;
        }
        await axios.put(import.meta.env.VITE_API_URL + `/issues/${record._id}`, {
          tester: this.authProfile._id,
          status: testingStatus._id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success(`เริ่มทดสอบงาน: ${record.name}`);
        this.goToTestDetail(record._id);
      } catch (e) {
        console.error(e);
        message.error('เกิดข้อผิดพลาดในการรับงาน');
      }
    },
    goToTestDetail(id) {
      this.$router.push(`/implement/detail/${id}`);
    }
  }
};
</script>

<style scoped>
/* 1. Header & Layout */
.compact-header {
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  margin-bottom: 0;
}

.content-wrapper {
  padding: 10px;
  width: 100%;
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

/* 2. Stat Cards */
.stat-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

/* 3. Main Card & Toolbar */
.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  height: 100%;
}

.table-toolbar {
  padding: 12px 16px;
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

/* 4. Table Elements */
.id-badge {
  background: #f5f5f5;
  color: #888;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #e8e8e8;
}

.task-name {
  font-weight: 500;
  color: #262626;
  font-size: 13px;
  margin-bottom: 2px;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.meta-info {
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
}

.status-tag {
  min-width: 90px;
  text-align: center;
  border-radius: 4px;
  font-weight: 500;
  font-size: 11px;
  border: none;
}

.dot-tag {
  border: none;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  margin: 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.action-btn {
  font-size: 12px;
  height: 28px;
  border-radius: 4px;
}

.start-btn {
  font-weight: 500;
}

.continue-btn {
  color: #1890ff;
  border-color: #1890ff;
}

/* Animation */
.fade-in-up {
  animation: fadeUp 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Colors for Stats */
.icon-orange-bg :deep(.ant-statistic-title) {
  color: #fa8c16;
  font-size: 12px;
  margin-bottom: 4px;
}

.icon-blue-bg :deep(.ant-statistic-title) {
  color: #1890ff;
  font-size: 12px;
  margin-bottom: 4px;
}

.icon-green-bg :deep(.ant-statistic-title) {
  color: #52c41a;
  font-size: 12px;
  margin-bottom: 4px;
}

:deep(.ant-statistic-content) {
  font-size: 22px;
  font-weight: 700;
}

/* ==========================================================================
   📱 Mobile Responsive Tweaks
   ========================================================================== */
@media (max-width: 768px) {

  /* Header */
  .compact-header {
    padding: 10px 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    display: none;
    /* Hide subtitle on mobile to save space */
  }

  /* Toolbar */
  .table-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .toolbar-right {
    width: 100%;
    overflow-x: auto;
    /* Allow scrolling for filters if needed */
  }

  .btn-text {
    display: none;
  }

  /* Table */
  :deep(.ant-table-cell) {
    padding: 8px 6px !important;
  }
}
</style>