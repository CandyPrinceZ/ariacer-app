<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div class="page-header compact-header">
      <div class="header-content">
        <div class="header-text">
          <h2 class="page-title">
            <span class="icon-box">👨‍💻</span> Developer Console
          </h2>
          <p class="page-subtitle">ศูนย์รวมงานพัฒนา รับงาน (Claim) และอัปเดตสถานะงาน (Manage)</p>
        </div>
        <div class="header-actions">
          <a-button type="default" size="small" @click="refreshData" :loading="loading">
            <ReloadOutlined /> Refresh
          </a-button>
        </div>
      </div>
    </div>

    <div style="padding: 12px; width: 100%;">
      <a-card :bordered="false" class="main-card" :bodyStyle="{ padding: '0' }">
        
        <a-tabs 
          v-model:activeKey="activeTab" 
          @change="refreshData" 
          type="line" 
          size="large" 
          class="custom-tabs"
        >

          <a-tab-pane key="1">
            <template #tab>
              <span class="tab-label">
                <AppstoreAddOutlined /> งานรอรับ (Unassigned)
                <a-badge :count="filteredUnassigned.length" :offset="[8, -2]" color="#fa8c16" v-if="filteredUnassigned.length > 0" />
              </span>
            </template>

            <div v-if="unassignedIssues.length > 0" class="alert-section">
              <a-alert
                message="Available Tasks"
                type="info"
                show-icon
                class="full-width-alert"
              >
                <template #description>
                  ขณะนี้มีงานว่างทั้งหมด <strong>{{ unassignedIssues.length }} งาน</strong> ที่ยังไม่มีผู้รับผิดชอบ คุณสามารถกดปุ่ม <strong>Claim</strong> เพื่อเริ่มดำเนินการได้ทันที
                </template>
              </a-alert>
            </div>

            <div class="table-toolbar">
              <div class="toolbar-left">
                 <span class="section-title">รายการงานทั้งหมด</span>
              </div>
              <div class="toolbar-right">
                <a-input 
                  v-model:value="searchText" 
                  placeholder="Search ID or Subject..." 
                  style="width: 200px" 
                  allow-clear
                  size="small"
                  class="modern-input"
                >
                   <template #prefix><SearchOutlined class="text-muted"/></template>
                </a-input>
                <a-select 
                  v-model:value="filterUrgency" 
                  placeholder="Urgency" 
                  style="width: 120px" 
                  allow-clear 
                  size="small"
                  class="modern-select"
                >
                   <a-select-option v-for="u in urgencies" :key="u._id" :value="u._id">{{ u.name }}</a-select-option>
                </a-select>
              </div>
            </div>

            <a-table 
              :dataSource="filteredUnassigned" 
              :columns="columns" 
              rowKey="_id" 
              :pagination="{ pageSize: 10 }"
              size="middle" 
              :locale="{ emptyText: 'เยี่ยมมาก! ไม่มีงานค้างรอรับ' }"
            >
              <template #bodyCell="{ column, record }">
                
                <template v-if="column.key === 'id'">
                  <span class="id-badge">{{ record.issue_id || record.id || '-' }}</span>
                </template>

                <template v-if="column.key === 'type'">
                   <div class="type-cell">
                     <a-tag :color="record.urgency?.color" class="dot-tag">
                        <span class="dot" :style="{background: record.urgency?.color}"></span>
                        {{ record.urgency?.name }}
                     </a-tag>
                     <span class="text-muted" style="font-size: 12px;">{{ record.type?.name || '-' }}</span>
                  </div>
                </template>

                <template v-if="column.key === 'status'">
                   <a-tag :color="getStatusColor(record.status?.code)">
                      {{ record.status?.name || 'Unknown' }}
                   </a-tag>
                </template>

                <template v-if="column.key === 'createdAt'">
                   <span class="date-text">{{ formatDate(record.createdAt) }}</span>
                </template>

                <template v-if="column.key === 'action'">
                  <a-button type="primary" size="small" class="claim-btn" @click="goToDetail(record._id)">
                    <PlusCircleOutlined /> Claim
                  </a-button>
                </template>

              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="2">
            <template #tab>
              <span class="tab-label">
                <CodeOutlined /> งานของฉัน (My Tasks)
                <a-badge :count="filteredMyIssues.length" :offset="[8, -2]" color="#52c41a" v-if="filteredMyIssues.length > 0" />
              </span>
            </template>

            <div class="table-toolbar">
              <div class="toolbar-left">
                 <span class="section-title">งานที่กำลังทำ</span>
              </div>
              <div class="toolbar-right">
                <a-input 
                  v-model:value="searchText" 
                  placeholder="Search ID or Subject..." 
                  style="width: 200px" 
                  allow-clear
                  size="small"
                  class="modern-input"
                >
                   <template #prefix><SearchOutlined class="text-muted"/></template>
                </a-input>
                 <a-select 
                  v-model:value="filterStatus" 
                  placeholder="Status" 
                  style="width: 120px" 
                  allow-clear 
                  size="small"
                  class="modern-select"
                >
                   <a-select-option value="inProgress">In Progress</a-select-option>
                   <a-select-option value="finished">Finished</a-select-option>
                   <a-select-option value="upserver">Up Server</a-select-option>
                   <a-select-option value="success">Success</a-select-option>
                </a-select>
              </div>
            </div>

            <div v-if="filteredMyIssues.length === 0 && !loading" style="padding: 40px; text-align: center;">
              <a-empty description="ไม่พบรายการงาน">
                <a-button v-if="myIssues.length === 0" type="primary" @click="activeTab = '1'">ไปรับงานใหม่</a-button>
              </a-empty>
            </div>

            <a-table v-else :dataSource="filteredMyIssues" :columns="columns" rowKey="_id" :pagination="{ pageSize: 10 }" size="middle">
              <template #bodyCell="{ column, record }">

                <template v-if="column.key === 'id'">
                  <span class="id-badge">{{ record.issue_id || record.id || '-' }}</span>
                </template>

                <template v-if="column.key === 'type'">
                   <div class="type-cell">
                     <a-tag :color="record.urgency?.color" class="dot-tag">
                        <span class="dot" :style="{background: record.urgency?.color}"></span>
                        {{ record.urgency?.name }}
                     </a-tag>
                     <span class="text-muted" style="font-size: 12px;">{{ record.type?.name || '-' }}</span>
                  </div>
                </template>

                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status?.code)">
                    <template #icon>
                      <SyncOutlined v-if="record.status?.code === 'inProgress'" spin />
                      <CheckCircleOutlined v-else-if="record.status?.code === 'success'" />
                      <CloudUploadOutlined v-else-if="record.status?.code === 'upserver'" />
                      <FieldTimeOutlined v-else />
                    </template>
                    {{ record.status?.name || 'Unknown' }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'createdAt'">
                  <span class="date-text">{{ formatDate(record.createdAt) }}</span>
                </template>

                <template v-if="column.key === 'action'">
                   <a-button 
                      v-if="record.status?.code === 'success'" 
                      size="small" 
                      disabled
                      type="text"
                      class="text-muted"
                    >
                      <CheckCircleOutlined /> Done
                   </a-button>
                   <a-button 
                      v-else 
                      type="primary" 
                      size="small" 
                      ghost
                      class="manage-btn"
                      @click="goToDetail(record._id)"
                    >
                      <EditOutlined /> Manage
                   </a-button>
                </template>

              </template>
            </a-table>
          </a-tab-pane>

        </a-tabs>
      </a-card>
    </div>

  </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import {
  SyncOutlined, CheckCircleOutlined,
  AppstoreAddOutlined, CodeOutlined, FieldTimeOutlined, EditOutlined, ReloadOutlined,
  SearchOutlined, PlusCircleOutlined, CloudUploadOutlined
} from '@ant-design/icons-vue';

export default {
  name: 'DevelopmentView',
  components: {
    SyncOutlined, CheckCircleOutlined,
    AppstoreAddOutlined, CodeOutlined, FieldTimeOutlined, EditOutlined, ReloadOutlined,
    SearchOutlined, PlusCircleOutlined, CloudUploadOutlined
  },
  data() {
    return {
      activeTab: '1',
      user: null,
      loading: false,
      searchText: '',
      filterUrgency: undefined,
      filterStatus: undefined,
      urgencies: [], // สำหรับ Dropdown
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 90, align: 'center' },
        { title: 'Subject', dataIndex: 'name', key: 'name', ellipsis: true },
        { title: 'Type / Urgency', dataIndex: 'type', key: 'type', width: 180 },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 140, align: 'center' },
        { title: 'Submitted', dataIndex: 'createdAt', key: 'createdAt', width: 150, align: 'right' },
        { title: 'Action', key: 'action', width: 110, align: 'center' },
      ],
      unassignedIssues: [],
      myIssues: []
    };
  },
  computed: {
    filteredUnassigned() {
      return this.unassignedIssues.filter(issue => {
        const matchText = !this.searchText || 
          (issue.name && issue.name.toLowerCase().includes(this.searchText.toLowerCase())) ||
          (issue.issue_id && issue.issue_id.toLowerCase().includes(this.searchText.toLowerCase()));
        const matchUrgency = !this.filterUrgency || (issue.urgency?._id === this.filterUrgency);
        return matchText && matchUrgency;
      });
    },
    filteredMyIssues() {
      return this.myIssues.filter(issue => {
        const matchText = !this.searchText || 
          (issue.name && issue.name.toLowerCase().includes(this.searchText.toLowerCase())) ||
          (issue.issue_id && issue.issue_id.toLowerCase().includes(this.searchText.toLowerCase()));
        const matchStatus = !this.filterStatus || (issue.status?.code === this.filterStatus);
        return matchText && matchStatus;
      });
    }
  },
  async mounted() {
    await this.fetchProfile();
    await this.fetchUrgencies();
    if (this.user) {
      this.refreshData();
    }
  },
  methods: {
    async fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', config);
        this.user = response.data;
      } catch (error) {
        if (error.response?.status === 401) this.$router.push('/login');
      }
    },
    async fetchUrgencies() {
       const token = localStorage.getItem('token');
       const res = await axios.get(import.meta.env.VITE_API_URL + '/items/urgencies', { headers: { Authorization: `Bearer ${token}` } });
       this.urgencies = res.data;
    },
    async refreshData() {
      if (!this.user) return;
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [resUnassigned, resMyIssues] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/issues/unassigned', config),
          axios.get(import.meta.env.VITE_API_URL + '/issues/assigned/' + this.user._id, config)
        ]);

        this.unassignedIssues = resUnassigned.data;
        this.myIssues = resMyIssues.data;

      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        this.loading = false;
      }
    },
    getStatusColor(code) {
      const map = {
        reported: 'red', received: 'default', inProgress: 'blue',
        finished: 'cyan', testing: 'orange', success: 'green',
        upserver: 'purple', rejected: 'red'
      };
      return map[code] || 'default';
    },
    goToDetail(issueId) {
      this.$router.push(`/development/detail/${issueId}`);
    },
    formatDate(date) {
      if (!date) return '-';
      return dayjs(date).format('DD/MM/YYYY HH:mm');
    }
  },
  watch: {
    activeTab() {
      this.searchText = '';
      this.filterUrgency = undefined;
      this.filterStatus = undefined;
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
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.header-content { display: flex; justify-content: space-between; align-items: center; }
.header-text { display: flex; flex-direction: column; }
.page-title { margin: 0; font-size: 20px; font-weight: 600; color: #1f1f1f; display: flex; align-items: center; gap: 8px; }
.page-subtitle { margin: 2px 0 0; color: #8c8c8c; font-size: 13px; }
.icon-box { background: #e6f7ff; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 18px; }

/* 2. Main Card */
.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  min-height: 600px;
}

/* 3. Alert Section (Full Width) */
.alert-section {
  padding: 16px 24px 0 24px;
}
.full-width-alert {
  border-radius: 6px;
  border: 1px solid #91d5ff;
  background-color: #e6f7ff;
}

/* 4. Toolbar */
.table-toolbar {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
  margin-top: 10px;
}
.section-title { font-weight: 600; color: #1f1f1f; font-size: 14px; }
.toolbar-right { display: flex; gap: 8px; }

/* 5. Table & Tags */
.id-badge { background: #f5f5f5; color: #888; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 600; border: 1px solid #e8e8e8; font-family: monospace; }
.text-muted { color: #bfbfbf; }
.date-text { color: #8c8c8c; font-size: 12px; font-family: monospace; }

.type-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.dot-tag { border: none; font-size: 11px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; padding: 0 6px; margin: 0; }
.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

/* 6. Buttons */
.claim-btn { background-color: #52c41a; border-color: #52c41a; }
.claim-btn:hover { background-color: #73d13d; border-color: #73d13d; }
.manage-btn { border-color: #1890ff; color: #1890ff; }

/* 7. Tabs */
.custom-tabs :deep(.ant-tabs-nav) { margin-bottom: 0; border-bottom: 1px solid #f0f0f0; }
.custom-tabs :deep(.ant-tabs-tab) { margin: 0 0 0 24px; padding: 16px 0; font-size: 15px; }
.tab-label { display: flex; align-items: center; gap: 6px; font-weight: 500; }

/* Input */
.modern-input, .modern-select { border-radius: 4px; }
</style>