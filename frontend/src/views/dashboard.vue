<template>
  <a-layout style="min-height: 100vh; background: #f8f9fa; margin: -20px">
    <div class="dashboard-header">
      <div class="header-content">
        <div>
          <h2 class="page-title">🚀 Project Overview</h2>
          <p class="page-subtitle">Update latest stats and project progress.</p>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <a-row :gutter="[24, 24]" class="fade-in-up">
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
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
                <ArrowUpOutlined /> Live Data
              </span>
            </div>
          </a-card>
        </a-col>

        <a-col v-for="(stat, key, index) in statusCards" :key="key" :xs="24" :sm="12" :md="8" :lg="6"
          :style="{ animationDelay: `${(index + 1) * 0.1}s` }" class="fade-item">
          <a-card class="stat-card hover-lift" :bordered="false">
            <div class="stat-content">
              <div>
                <p class="stat-label">{{ stat.label }}</p>
                <h3 class="stat-number" :style="{ color: stat.textColor }">{{ stats[stat.key] }}</h3>
              </div>
              <div :class="['stat-icon-wrapper', stat.colorClass]">
                <component :is="stat.icon" />
              </div>
            </div>
            <div class="progress-line-bg">
              <div class="progress-line-fill"
                :style="{ width: getPercent(stats[stat.key]) + '%', backgroundColor: stat.hexColor }">
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row style="margin-top: 24px;" :gutter="[24, 24]">
        <a-col :span="24" class="fade-in-up" style="animation-delay: 0.4s;">
          <a-card :bordered="false" class="chart-card">
            <template #title>
              <div class="card-header simple-header">
                <div class="card-title-wrap">
                  <span class="card-title">Analytics Overview</span>
                  <span class="card-desc">Overall issue distribution status</span>
                </div>
              </div>
            </template>
            <div style="height: 380px; position: relative;">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row style="margin-top: 24px;">
        <a-col :span="24" class="fade-in-up" style="animation-delay: 0.5s;">
          <a-card :bordered="false" class="table-card">
            <template #title>
              <div class="card-header">
                <span class="card-title">Recent Issues</span>
              </div>
            </template>

            <a-table :dataSource="recentIssues" :columns="columns" rowKey="id" :pagination="{ pageSize: 5 }"
              class="custom-table">
              <template #bodyCell="{ column, record }">

                <template v-if="column.key === 'id'">
                  <span class="id-badge">{{ record.id }}</span>
                </template>

                <template v-if="column.key === 'name'">
                  <span style="font-weight: 500; color: #2c3e50;">{{ record.name }}</span>
                </template>

                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status)" class="status-tag">
                    <template #icon>
                      <component :is="getStatusIcon(record.status)" />
                    </template>
                    {{ (record.status?.name || 'UNKNOWN').toUpperCase() }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'assignee'">
                  <div v-if="record.assignee" class="assignee-cell">
                    <a-tooltip :title="record.assignee.user_name || record.assignee.username">
                      <a-avatar
                        :style="{ backgroundColor: stringToColor(record.assignee.user_name || record.assignee.username) }"
                        size="small">
                        {{ (record.assignee.user_name || record.assignee.username || 'U')[0].toUpperCase() }}
                      </a-avatar>
                    </a-tooltip>
                    <span class="assignee-name">{{ record.assignee.user_name || record.assignee.username }}</span>
                  </div>
                  <span v-else class="text-muted" style="color: #ccc;">-</span>
                </template>

                <template v-if="column.key === 'createdAt'">
                  <span class="date-text">{{ formatDate(record.createdAt) }}</span>
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
  ArrowUpOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'DashboardView',
  components: {
    AppstoreOutlined, InboxOutlined, SyncOutlined, CheckSquareOutlined,
    ExperimentOutlined, CheckCircleOutlined, AlertOutlined, CloudUploadOutlined,
    ArrowUpOutlined, Bar
  },
  data() {
    return {
      stats: {
        total: 0, reported: 0, recived: 0, inProgress: 0,
        finished: 0, upserver: 0, testing: 0, success: 0
      },
      statusCards: [
        { key: 'reported', label: 'Reported', icon: 'AlertOutlined', colorClass: 'icon-red', hexColor: '#ff4d4f', textColor: '#ff4d4f' },
        { key: 'recived', label: 'Received', icon: 'InboxOutlined', colorClass: 'icon-gray', hexColor: '#8c8c8c', textColor: '#595959' },
        { key: 'inProgress', label: 'In Progress', icon: 'SyncOutlined', colorClass: 'icon-blue', hexColor: '#1890ff', textColor: '#1890ff' },
        { key: 'finished', label: 'Finished', icon: 'CheckSquareOutlined', colorClass: 'icon-cyan', hexColor: '#13c2c2', textColor: '#13c2c2' },
        { key: 'upserver', label: 'Up Server', icon: 'CloudUploadOutlined', colorClass: 'icon-purple', hexColor: '#722ed1', textColor: '#722ed1' },
        { key: 'testing', label: 'Testing', icon: 'ExperimentOutlined', colorClass: 'icon-orange', hexColor: '#fa8c16', textColor: '#fa8c16' },
        { key: 'success', label: 'Success', icon: 'CheckCircleOutlined', colorClass: 'icon-green', hexColor: '#52c41a', textColor: '#52c41a' },
      ],
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, align: 'center' },
        { title: 'Task Title', dataIndex: 'name', key: 'name', ellipsis: true },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 160 },
        { title: 'Assignee', dataIndex: 'assignee', key: 'assignee', width: 220 },
        { title: 'Submitted', dataIndex: 'createdAt', key: 'createdAt', width: 150, align: 'right' },
      ],
      recentIssues: []
    };
  },
  computed: {
    chartData() {
      return {
        labels: ['Reported', 'Received', 'In Progress', 'Finished', 'Up Server', 'Testing'],
        datasets: [
          {
            label: 'Issues',
            data: [
              this.stats.reported, this.stats.recived, this.stats.inProgress,
              this.stats.finished, this.stats.upserver, this.stats.testing
            ],
            backgroundColor: [
              '#ff4d4f', '#8c8c8c', '#1890ff', '#13c2c2', '#722ed1', '#fa8c16'
            ],
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 45,
            hoverBackgroundColor: '#2c3e50'
          }
        ]
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: 12,
            titleFont: { size: 14, family: "'Prompt', sans-serif" },
            bodyFont: { size: 13, family: "'Prompt', sans-serif" },
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              label: (context) => ` ${context.parsed.y} Issues`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f0f0f0', drawBorder: false },
            ticks: { stepSize: 1, font: { family: "'Prompt', sans-serif" }, color: '#8c8c8c' },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Prompt', sans-serif" }, color: '#595959' },
            border: { display: false }
          }
        }
      }
    }
  },
  async mounted() {
    await this.fetchIssues();
  },
  methods: {
    async fetchIssues() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(import.meta.env.VITE_API_URL + '/issues', config);

        // JSON ของคุณคือ Array ของ Issues โดยตรง
        this.recentIssues = response.data;
        this.calculateStats(response.data);

      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    },
    calculateStats(issues) {
      const counts = {
        total: issues.length,
        reported: 0, recived: 0, inProgress: 0, finished: 0,
        upserver: 0, testing: 0, success: 0
      };

      issues.forEach(issue => {
        // ดึง code จาก object status
        const statusCode = issue.status?.code || '';
        if (Object.prototype.hasOwnProperty.call(counts, statusCode)) {
          counts[statusCode]++;
        }
      });
      this.stats = counts;
    },
    getPercent(val) {
      if (this.stats.total === 0) return 0;
      return (val / this.stats.total) * 100;
    },
    getStatusColor(status) {
      // รองรับทั้ง Object และ String (เผื่อไว้)
      const code = status?.code || status;
      const map = {
        reported: 'error', recived: 'default', inProgress: 'processing', rejected: 'error',
        finished: 'cyan', upserver: 'purple', testing: 'warning', success: 'success',
      };
      return map[code] || 'default';
    },
    getStatusIcon(status) {
      const code = status?.code || status;
      const map = {
        reported: 'AlertOutlined', recived: 'InboxOutlined', inProgress: 'SyncOutlined', rejected: 'AlertOutlined',
        finished: 'CheckSquareOutlined', upserver: 'CloudUploadOutlined', testing: 'ExperimentOutlined', success: 'CheckCircleOutlined',
      };
      return map[code] || null;
    },
    formatDate(date) {
      if (!date) return '-';
      const d = dayjs(date);
      if (!d.isValid()) return '-';
      return d.format('DD MMM, HH:mm');
    },
    stringToColor(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    }
  }
};
</script>

<style scoped>

/* Header Clean Style */
.dashboard-header {
  padding: 40px 40px 30px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  color: #8c8c8c;
  font-size: 15px;
  margin: 0;
}

.dashboard-content {
  padding: 32px 40px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Animations */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  opacity: 0;
  animation: fadeUp 0.6s ease-out forwards;
}

.fade-item {
  opacity: 0;
  animation: fadeUp 0.6s ease-out forwards;
}

/* Stat Cards */
.stat-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: #fff;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.hero-card {
  background: linear-gradient(135deg, #1890ff 0%, #003eb3 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(24, 144, 255, 0.3);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-number {
  font-size: 34px;
  font-weight: 700;
  color: #1f1f1f;
  margin: 0;
  line-height: 1;
}

/* Icons */
.stat-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.3s;
}

.hover-lift:hover .stat-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

/* Custom Colors */
.icon-red {
  background: rgba(255, 77, 79, 0.08);
  color: #ff4d4f;
}

.icon-gray {
  background: rgba(140, 140, 140, 0.08);
  color: #595959;
}

.icon-blue {
  background: rgba(24, 144, 255, 0.08);
  color: #1890ff;
}

.icon-cyan {
  background: rgba(19, 194, 194, 0.08);
  color: #13c2c2;
}

.icon-purple {
  background: rgba(114, 46, 209, 0.08);
  color: #722ed1;
}

.icon-orange {
  background: rgba(250, 140, 22, 0.08);
  color: #fa8c16;
}

.icon-green {
  background: rgba(82, 196, 26, 0.08);
  color: #52c41a;
}

/* Progress Line (Decoration) */
.progress-line-bg {
  height: 4px;
  width: 100%;
  background: #f5f5f5;
  border-radius: 2px;
  overflow: hidden;
  margin-top: auto;
}

.progress-line-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 1s ease-in-out;
}

/* Hero Text */
.text-white {
  color: #fff !important;
}

.text-white-70 {
  color: rgba(255, 255, 255, 0.7);
}

.bg-white-20 {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
}

.stat-footer {
  font-size: 13px;
  margin-top: 16px;
  display: flex;
  align-items: center;
}

.trend-indicator {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
  color: #fff;
  margin-right: 8px;
  font-size: 12px;
}

/* Card Headers */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.simple-header {
  justify-content: flex-start;
}

.card-title-wrap {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
}

.card-desc {
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 400;
  margin-top: 2px;
}

/* Table Elements */
.id-badge {
  background: #f7f7f7;
  color: #8c8c8c;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-tag {
  border-radius: 20px;
  padding: 4px 12px;
  border: none;
  font-weight: 600;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.assignee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assignee-name {
  font-weight: 500;
  color: #434343;
  font-size: 13px;
}

.date-text {
  color: #8c8c8c;
  font-size: 13px;
}

.chart-card,
.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

/* Responsive */
@media (max-width: 768px) {

  .dashboard-header,
  .dashboard-content {
    padding: 20px;
  }
}
</style>