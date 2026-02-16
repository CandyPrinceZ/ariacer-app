<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div class="page-header compact-header">
      <div class="header-content">
        <div class="header-text">
          <h2 class="page-title">
            <span class="icon-box">🚀</span> Project Overview
          </h2>
          <p class="page-subtitle">ภาพรวมสถานะโครงการและสถิติการแจ้งปัญหา</p>
        </div>
        <div class="header-actions">
          <a-button type="default" size="small" @click="refreshData" :loading="loading">
            <ReloadOutlined /> <span class="btn-text">Refresh Data</span>
          </a-button>
        </div>
      </div>
    </div>

    <div class="dashboard-content">

      <a-row :gutter="[8, 8]" class="fade-in-up">
        <a-col :xs="24" :sm="24" :md="6" :lg="24">
          <a-card class="stat-card hero-card" :bordered="false">
            <div class="stat-content">
              <div>
                <p class="stat-label text-white-70">Total Issues</p>
                <h3 class="stat-number text-white">{{ stats.total }}</h3>
              </div>
              <div class="stat-icon-wrapper bg-white-20">
                <AppstoreOutlined class="text-white" />
              </div>
            </div>
            <div class="stat-footer text-white-70">
              <span class="trend-indicator">
                <ArrowUpOutlined /> Live
              </span>
            </div>
          </a-card>
        </a-col>

        <a-col v-for="(stat, key) in statusCards" :key="key" :xs="12" :sm="12" :md="6" :lg="3">
          <a-card class="stat-card hover-lift" :bordered="false">
            <div class="stat-content-mini">
              <div :class="['stat-icon-mini', stat.colorClass]">
                <component :is="stat.icon" />
              </div>
              <div class="stat-text-mini">
                <h3 class="stat-number-mini" :style="{ color: stat.textColor }">{{ stats[stat.key] || 0 }}</h3>
                <p class="stat-label-mini">{{ stat.label }}</p>
              </div>
            </div>
            <div class="progress-line-bg">
              <div class="progress-line-fill"
                :style="{ width: getPercent(stats[stat.key]) + '%', backgroundColor: stat.hexColor }"></div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[8, 8]" style="margin-top: 12px;">

        <a-col :xs="24" :lg="8">
          <a-card :bordered="false" class="main-card chart-card">
            <template #title>
              <div class="card-header-wrap">
                <span class="card-header-text">Issue Status Breakdown</span>
                <span class="card-header-sub">Distribution by Status</span>
              </div>
            </template>

            <div class="chart-wrapper">
              <div class="chart-container">
                <Pie :data="chartData" :options="chartOptions" />
              </div>
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="16">
          <a-card :bordered="false" class="main-card table-card" :bodyStyle="{ padding: '0' }">

            <div class="table-toolbar">
              <div class="toolbar-left">
                <span class="card-header-text">Issue List</span>
              </div>
              <div class="toolbar-right">
                <a-input v-model:value="filters.text" placeholder="Search..." size="small"
                  class="modern-input filter-item" allow-clear>
                  <template #prefix>
                    <SearchOutlined class="text-muted" />
                  </template>
                </a-input>

                <a-select v-model:value="filters.status" placeholder="Status" size="small" allow-clear
                  class="modern-select filter-item">
                  <a-select-option v-for="s in dropdowns.statuses" :key="s._id" :value="s._id">{{ s.name
                    }}</a-select-option>
                </a-select>

                <a-select v-model:value="filters.urgency" placeholder="Urgency" size="small" allow-clear
                  class="modern-select filter-item">
                  <a-select-option v-for="u in dropdowns.urgencies" :key="u._id" :value="u._id">{{ u.name
                    }}</a-select-option>
                </a-select>
                <a-select v-model:value="filters.type" placeholder="Type" size="small" allow-clear
                  class="modern-select filter-item">
                  <a-select-option v-for="t in dropdowns.types" :key="t._id" :value="t._id">{{ t.name
                    }}</a-select-option>
                </a-select>
              </div>
            </div>

            <a-table :dataSource="filteredIssues" :columns="columns" rowKey="_id"
              :pagination="{ pageSize: 6, showSizeChanger: false }" size="middle" :scroll="{ x: 800 }">
              <template #bodyCell="{ column, record }">

                <template v-if="column.key === 'id'">
                  <span class="id-badge">{{ record.issue_id || record.id }}</span>
                </template>

                <template v-if="column.key === 'name'">
                  <div class="text-ellipsis" style="max-width: 200px;">
                    <span style="font-weight: 500; color: #2c3e50;">{{ record.name }}</span>
                  </div>
                </template>

                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status?.code)">
                    <template #icon>
                      <component :is="getStatusIcon(record.status?.code)" />
                    </template>
                    {{ record.status?.name || 'Unknown' }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'urgency'">
                  <a-tag :color="record.urgency?.color" class="dot-tag">
                    <span class="dot" :style="{ background: record.urgency?.color }"></span>
                    {{ record.urgency?.name }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'assignee'">
                  <div v-if="record.assignee">
                    <a-tooltip :title="record.assignee.user_name">
                      <a-avatar size="small" :src="record.assignee.avatar" :style="{
                        backgroundColor: record.assignee.avatar ? 'transparent' : stringToColor(record.assignee.user_name),
                        fontSize: '12px',
                        border: record.assignee.avatar ? '1px solid #f0f0f0' : 'none'
                      }">
                        <span v-if="!record.assignee.avatar">
                          {{ record.assignee.user_name?.[0]?.toUpperCase() }}
                        </span>
                      </a-avatar>
                    </a-tooltip>
                  </div>
                  <span v-else class="text-muted" style="color: #bfbfbf;">-</span>
                </template>

                <template v-if="column.key === 'createdAt'">
                  <span class="date-text">{{ formatDate(record.createdAt) || '-' }}</span>
                </template>

                <template v-if="column.key === 'action'">
                  <a-button type="link" size="small" @click="goToIssueDetail(record._id)">View</a-button>
                </template>

              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </a-layout>
</template>

<script>
import axios from 'axios';
import {
  AppstoreOutlined, InboxOutlined, SyncOutlined, CheckSquareOutlined,
  ExperimentOutlined, CheckCircleOutlined, AlertOutlined, CloudUploadOutlined,
  ArrowUpOutlined, SearchOutlined, ReloadOutlined, CloseCircleOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

export default {
  name: 'DashboardView',
  components: {
    AppstoreOutlined, InboxOutlined, SyncOutlined, CheckSquareOutlined,
    ExperimentOutlined, CheckCircleOutlined, AlertOutlined, CloudUploadOutlined,
    ArrowUpOutlined, SearchOutlined, ReloadOutlined, CloseCircleOutlined,
    Pie 
  },
  data() {
    return {
      loading: false,
      allIssues: [],
      dropdowns: { statuses: [], urgencies: [], types: [] },
      filters: { text: '', status: undefined, urgency: undefined, type: undefined },

      stats: {
        total: 0, reported: 0, received: 0, inProgress: 0,
        finished: 0, upserver: 0, testing: 0, success: 0, rejected: 0
      },

      statusCards: [
        { key: 'reported', label: 'Reported', icon: 'AlertOutlined', colorClass: 'icon-red', hexColor: '#ff4d4f', textColor: '#ff4d4f' },
        { key: 'received', label: 'Received', icon: 'InboxOutlined', colorClass: 'icon-gray', hexColor: '#8c8c8c', textColor: '#595959' },
        { key: 'inProgress', label: 'In Dev', icon: 'SyncOutlined', colorClass: 'icon-blue', hexColor: '#1890ff', textColor: '#1890ff' },
        { key: 'finished', label: 'Dev Done', icon: 'CheckSquareOutlined', colorClass: 'icon-cyan', hexColor: '#13c2c2', textColor: '#13c2c2' },
        { key: 'upserver', label: 'Up Server', icon: 'CloudUploadOutlined', colorClass: 'icon-purple', hexColor: '#722ed1', textColor: '#722ed1' },
        { key: 'testing', label: 'Testing', icon: 'ExperimentOutlined', colorClass: 'icon-orange', hexColor: '#fa8c16', textColor: '#fa8c16' },
        { key: 'rejected', label: 'Rejected', icon: 'CloseCircleOutlined', colorClass: 'icon-red-dark', hexColor: '#cf1322', textColor: '#cf1322' },
        { key: 'success', label: 'Success', icon: 'CheckCircleOutlined', colorClass: 'icon-green', hexColor: '#52c41a', textColor: '#52c41a' },
      ],
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 90, fixed: 'left' },
        { title: 'Subject', dataIndex: 'name', key: 'name', width: 200 },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
        { title: 'Urgency', dataIndex: 'urgency', key: 'urgency', width: 110 },
        { title: 'Submitted', dataIndex: 'createdAt', key: 'createdAt', width: 140, align: 'right' },
        { title: 'Dev', dataIndex: 'assignee', key: 'assignee', width: 80, align: 'center' },
        { title: 'Action', key: 'action', width: 80, align: 'center', fixed: 'right' },
      ]
    };
  },
  computed: {
    filteredIssues() {
      return this.allIssues.filter(issue => {
        const searchText = this.filters.text.toLowerCase();
        const matchText = !searchText ||
          (issue.name && issue.name.toLowerCase().includes(searchText)) ||
          (issue.issue_id && issue.issue_id.toLowerCase().includes(searchText));
        const matchStatus = !this.filters.status || (issue.status?._id === this.filters.status);
        const matchUrgency = !this.filters.urgency || (issue.urgency?._id === this.filters.urgency);
        const matchType = !this.filters.type || (issue.type?._id === this.filters.type);
        return matchText && matchStatus && matchUrgency && matchType;
      });
    },
    chartData() {
      return {
        labels: ['Report', 'Inbox', 'Dev', 'Done', 'Server', 'Test', 'Reject', 'Success'],
        datasets: [
          {
            data: [
              this.stats.reported, this.stats.received, this.stats.inProgress,
              this.stats.finished, this.stats.upserver, this.stats.testing,
              this.stats.rejected, this.stats.success
            ],
            backgroundColor: [
              '#ff4d4f', '#8c8c8c', '#1890ff', '#13c2c2',
              '#722ed1', '#fa8c16', '#cf1322', '#52c41a'
            ],
            hoverOffset: 4,
            borderWidth: 0,
          }
        ]
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 15,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || '';
                if (label) { label += ': '; }
                let value = context.parsed;
                let total = context.chart._metasets[context.datasetIndex].total;
                let percentage = ((value / total) * 100).toFixed(1) + "%";
                return label + value + ' (' + percentage + ')';
              }
            }
          }
        }
      }
    }
  },
  async mounted() {
    this.refreshData();
  },
  methods: {
    async refreshData() {
      this.loading = true;
      await Promise.all([this.fetchDropdowns(), this.fetchIssues()]);
      this.loading = false;
    },
    async fetchDropdowns() {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const [resStatus, resUrgency, resType] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/items/statuses', config),
          axios.get(import.meta.env.VITE_API_URL + '/items/urgencies', config),
          axios.get(import.meta.env.VITE_API_URL + '/items/issue-types', config)
        ]);
        this.dropdowns.statuses = resStatus.data;
        this.dropdowns.urgencies = resUrgency.data;
        this.dropdowns.types = resType.data;
      } catch (e) { console.error(e); }
    },
    async fetchIssues() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(import.meta.env.VITE_API_URL + '/issues', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.allIssues = response.data;
        this.calculateStats(response.data);
      } catch (error) { console.error(error); }
    },
    calculateStats(issues) {
      const counts = { total: issues.length, reported: 0, received: 0, inProgress: 0, finished: 0, upserver: 0, testing: 0, success: 0, rejected: 0 };
      issues.forEach(issue => {
        const code = issue.status?.code || '';
        if (Object.prototype.hasOwnProperty.call(counts, code)) counts[code]++;
      });
      this.stats = counts;
    },
    getPercent(val) {
      return this.stats.total === 0 ? 0 : (val / this.stats.total) * 100;
    },
    getStatusColor(code) {
      if (code === 'success') return 'green';
      if (code === 'testing') return 'orange';
      if (code === 'upserver') return 'purple';
      if (code === 'finished') return 'cyan';
      if (code === 'inProgress') return 'blue';
      if (code === 'rejected') return 'red';
      if (code === 'reported') return 'red';
      return 'default';
    },
    getStatusIcon(code) {
      if (code === 'success') return 'CheckCircleOutlined';
      if (code === 'testing') return 'ExperimentOutlined';
      if (code === 'upserver') return 'CloudUploadOutlined';
      if (code === 'finished') return 'CheckSquareOutlined';
      if (code === 'inProgress') return 'SyncOutlined';
      if (code === 'rejected') return 'CloseCircleOutlined';
      if (code === 'received') return 'InboxOutlined';
      if (code === 'reported') return 'AlertOutlined';
      return 'InboxOutlined';
    },
    stringToColor(str) {
      if (!str) return '#ccc';
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    },
    goToIssueDetail(id) {
      this.$router.push(`Issue/detail/${id}`);
    },
    formatDate(date) {
      if (!date) return '-';
      return dayjs(date).format('DD/MM/YY');
    }
  }
};
</script>

<style scoped>
/* Chart CSS */
.chart-wrapper {
  position: relative;
  height: 350px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.chart-container {
  height: 100%;
  width: 100%;
  position: relative;
  z-index: 2;
}

.dashboard-content {
  padding: 12px;
  width: 100%;
}

/* 1. Compact Header */
.compact-header {
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
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

/* Mobile responsive header */
@media (max-width: 768px) {
  .compact-header {
    padding: 10px 12px;
  }

  .page-title {
    font-size: 16px;
  }

  .page-subtitle {
    display: none;
    /* Hide subtitle on mobile to save space */
  }

  .btn-text {
    display: none;
    /* Show only icon on mobile */
  }
}

/* 2. Stat Cards */
.stat-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  height: 100%;
}

.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08);
}

/* Hero Card */
.hero-card {
  background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
  color: white;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.text-white {
  color: #fff;
}

.text-white-70 {
  color: rgba(255, 255, 255, 0.7);
}

.bg-white-20 {
  background: rgba(255, 255, 255, 0.2);
}

.stat-footer {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.trend-indicator {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 11px;
}

/* Mini Stat Cards */
.stat-content-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.stat-icon-mini {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-number-mini {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.stat-label-mini {
  font-size: 11px;
  color: #8c8c8c;
  margin: 0;
}

.progress-line-bg {
  height: 3px;
  width: 100%;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-line-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s;
}

/* Colors */
.icon-red {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

.icon-red-dark {
  background: rgba(207, 19, 34, 0.1);
  color: #cf1322;
}

.icon-gray {
  background: rgba(140, 140, 140, 0.1);
  color: #595959;
}

.icon-blue {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.icon-cyan {
  background: rgba(19, 194, 194, 0.1);
  color: #13c2c2;
}

.icon-purple {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
}

.icon-orange {
  background: rgba(250, 140, 22, 0.1);
  color: #fa8c16;
}

.icon-green {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

/* 3. Main Cards & Toolbar */
.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.card-header-wrap {
  display: flex;
  flex-direction: column;
}

.card-header-text {
  font-weight: 600;
  color: #1f1f1f;
  font-size: 15px;
}

.card-header-sub {
  font-size: 11px;
  color: #8c8c8c;
  font-weight: 400;
}

.table-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  min-width: 110px;
}

/* Mobile responsive toolbar */
@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .toolbar-left {
    margin-bottom: 8px;
  }

  .toolbar-right {
    width: 100%;
    gap: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    /* 2 columns on mobile */
  }

  .filter-item {
    width: 100% !important;
    min-width: 0;
  }

  /* Make search input full width */
  .toolbar-right .ant-input-affix-wrapper {
    grid-column: 1 / -1;
  }
}

/* 4. Table Elements */
.id-badge {
  background: #f5f5f5;
  color: #888;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #e8e8e8;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot-tag {
  border: none;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.text-muted {
  color: #bfbfbf;
}

.date-text {
  font-size: 11px;
  color: #595959;
}

/* Animations */
.fade-in-up {
  animation: fadeUp 0.6s ease-out forwards;
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

@media (max-width: 768px) {
  .stat-number {
    font-size: 22px;
  }

  .stat-number-mini {
    font-size: 18px;
  }

  .stat-label-mini {
    font-size: 10px;
  }

  :deep(.ant-card) {
    border-radius: 6px;
  }

  :deep(.ant-table) {
    font-size: 12px;
  }

  :deep(.ant-table-cell) {
    padding: 8px 6px !important;
  }
}
</style>