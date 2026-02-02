<template>
  <a-layout style="min-height: 100vh; background: #f8f9fa;">

    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>

    <div v-else class="page-container">

      <div class="detail-header">
        <div class="header-left">
          <a-button @click="goBack" type="text" class="back-btn">
            <ArrowLeftOutlined /> Back
          </a-button>
          <div class="title-group">
            <span class="id-badge">#{{ issue.id || '...' }}</span>
            <h1 class="task-title">{{ issue.name }}</h1>
          </div>
        </div>
        <div class="header-right">
          <a-tag :color="getStatusColor(issue.status?.code)" class="status-pill">
            <component :is="getStatusIcon(issue.status?.code)" />
            {{ (issue.status?.name || 'Unknown').toUpperCase() }}
          </a-tag>
        </div>
      </div>

      <div class="detail-content">
        <a-row :gutter="24">

          <a-col :xs="24" :lg="17" :xl="18">

            <a-alert v-if="issue.status?.code === 'rejected'" message="งานถูกส่งกลับแก้ไข (Rejected)" type="error"
              show-icon class="mb-4">
              <template #description>
                <div style="margin-top: 8px;">
                  <p style="margin-bottom: 8px; font-weight: 500; color: #5c0011;">
                    "{{ issue.remarks || 'No remark provided.' }}"
                  </p>
                  <div v-if="issue.tester"
                    style="font-size: 13px; color: #ff4d4f; display: flex; align-items: center; gap: 6px;">
                    <UserOutlined /> ตรวจสอบโดย: <strong>{{ issue.tester.user_name }}</strong>
                  </div>
                </div>
              </template>
            </a-alert>

            <a-card :bordered="false" class="content-card">
              <div class="card-section">
                <h3 class="section-title">
                  <FileTextOutlined /> Description
                </h3>
                <div class="desc-text">{{ issue.detail || '-' }}</div>
              </div>

              <div class="card-section mt-4">
                <h3 class="section-title">
                  <PaperClipOutlined /> Attachments ({{ issue.images ? issue.images.length : 0 }})
                </h3>

                <div class="image-grid" v-if="issue.images && issue.images.length > 0">
                  <a-image v-for="img in issue.images" :key="img._id" :src="img.url" class="img-preview" />
                </div>
                <div v-else class="empty-attachments">
                  <span class="text-muted">No attachments available</span>
                </div>
              </div>
            </a-card>
          </a-col>

          <a-col :xs="24" :lg="7" :xl="6">
            <div class="sticky-sidebar">

              <a-card :bordered="false" class="meta-card mb-3">
                <div class="action-area">
                  <div v-if="!issue.assignee">
                    <div class="empty-assignee">
                      <UserAddOutlined class="icon-lg" />
                      <p>ยังไม่มีผู้รับผิดชอบ</p>
                    </div>
                    <a-button type="primary" block size="large" @click="claimIssue" :loading="actionLoading">
                      ✋ รับงานนี้ (Claim)
                    </a-button>
                  </div>

                  <div v-else>
                    <div class="assignee-profile">
                      <a-avatar size="large" :style="{ backgroundColor: stringToColor(issue.assignee.user_name) }">
                        {{ (issue.assignee.user_name || 'U')[0] }}
                      </a-avatar>
                      <div class="assignee-info">
                        <span class="label">Assignee</span>
                        <span class="name">{{ issue.assignee.user_name }}</span>
                      </div>
                    </div>

                    <div v-if="isMyTask" class="mt-3">
                      <label class="form-label">Update Status</label>
                      <a-select v-model:value="selectedStatus" style="width: 100%; margin-bottom: 12px;">
                        <a-select-option v-for="st in statusOptions" :key="st._id" :value="st._id">
                          <a-badge :status="getStatusBadgeType(st.code)" :text="st.name" />
                        </a-select-option>
                      </a-select>
                      <a-button type="primary" ghost block @click="updateStatus" :loading="actionLoading">
                        Save Status
                      </a-button>
                    </div>
                  </div>
                </div>
              </a-card>

              <a-card :bordered="false" class="meta-card">
                <h4 class="card-label">Ticket Info</h4>
                <div class="info-list">
                  <div class="info-item">
                    <span class="label">Type</span>
                    <span class="value">{{ issue.type?.name || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Urgency</span>
                    <a-tag :color="issue.urgency?.color" class="compact-tag">
                      {{ issue.urgency?.name }}
                    </a-tag>
                  </div>
                  <div class="info-item">
                    <span class="label">Reporter</span>
                    <div class="reporter-chip">
                      <UserOutlined /> {{ issue.reporter?.user_name || 'Unknown' }}
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="label">Created</span>
                    <span class="value date">{{ formatDate(issue.createdAt) }}</span>
                  </div>
                </div>
              </a-card>

            </div>
          </a-col>
        </a-row>
      </div>
    </div>
  </a-layout>
</template>

<script>
import {
  ArrowLeftOutlined, UserOutlined, ClockCircleOutlined, UserAddOutlined,
  FileTextOutlined, PaperClipOutlined, CheckCircleOutlined, SyncOutlined,
  CloseCircleOutlined, AlertOutlined, CloudUploadOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import dayjs from 'dayjs';

export default {
  name: 'DevelopmentDetailView',
  components: {
    ArrowLeftOutlined, UserOutlined, ClockCircleOutlined, UserAddOutlined,
    FileTextOutlined, PaperClipOutlined, CheckCircleOutlined, SyncOutlined,
    CloseCircleOutlined, AlertOutlined, CloudUploadOutlined
  },
  data() {
    return {
      loading: false,
      actionLoading: false,
      authProfile: null,
      selectedStatus: undefined,
      issue: {},
      statusOptions: []
    };
  },
  computed: {
    isMyTask() {
      if (!this.issue.assignee || !this.authProfile) return false;
      return this.issue.assignee._id === this.authProfile._id;
    }
  },
  async mounted() {
    this.loading = true;
    try {
      await this.getAuthProfile();
      await this.fetchDropdownStatusOptions();
      const issueId = this.$route.params.id;
      if (issueId) await this.fetchIssueDetail(issueId);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    goBack() { this.$router.go(-1); },
    formatDate(date) { return date ? dayjs(date).format('D MMM YYYY, HH:mm') : '-'; },

    // UI Helpers
    getStatusColor(code) {
      const map = { reported: 'red', inProgress: 'blue', finished: 'cyan', testing: 'orange', success: 'green', rejected: 'error', upserver: 'gold' };
      return map[code] || 'default';
    },
    getStatusIcon(code) {
      const map = { inProgress: 'SyncOutlined', success: 'CheckCircleOutlined', rejected: 'CloseCircleOutlined', testing: 'AlertOutlined', upserver: 'CloudUploadOutlined' };
      return map[code] || 'ClockCircleOutlined';
    },
    getStatusBadgeType(code) {
      const map = { received: 'default', inProgress: 'processing', finished: 'success', upserver: 'warning' };
      return map[code] || 'default';
    },
    stringToColor(str) {
      if (!str) return '#1890ff';
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    },

    // API Calls
    async getAuthProfile() {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      this.authProfile = res.data;
    },
    async fetchIssueDetail(id) {
      const token = localStorage.getItem('token');
      const res = await axios.get(import.meta.env.VITE_API_URL + `/issues/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      this.issue = res.data;
      if (this.issue.status?._id) this.selectedStatus = this.issue.status._id;
    },
    async fetchDropdownStatusOptions() {
      const token = localStorage.getItem('token');
      const res = await axios.get(import.meta.env.VITE_API_URL + '/items/statuses/dev', { headers: { Authorization: `Bearer ${token}` } });
      this.statusOptions = res.data;
    },
    async claimIssue() {
      if (!this.authProfile) return message.error('Please login again');
      this.actionLoading = true;
      try {
        const targetStatus = this.statusOptions.find(s => s.code === 'recived' || s.name.toLowerCase().includes('progress'));
        const statusIdToUse = targetStatus ? targetStatus._id : this.issue.status?._id;

        const token = localStorage.getItem('token');
        const payload = { assignee: this.authProfile._id, status: statusIdToUse };

        const res = await axios.put(import.meta.env.VITE_API_URL + `/issues/${this.issue._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });

        this.issue = res.data;
        this.selectedStatus = this.issue.status._id;
        message.success('Claimed successfully!');
      } catch (error) {
        console.error(error);
        message.error('Failed to claim issue');
      } finally {
        this.actionLoading = false;
        location.reload();
      }
    },
    async updateStatus() {
      this.actionLoading = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.put(import.meta.env.VITE_API_URL + `/issues/${this.issue._id}`, { status: this.selectedStatus }, { headers: { Authorization: `Bearer ${token}` } });
        this.issue = res.data;
        message.success('Status updated');
      } catch (error) {
        console.error(error);
        message.error('Update failed');
      } finally {
        this.actionLoading = false;
        location.reload();
      }
    }
  }
};
</script>

<style scoped>

.loading-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Header */
.detail-header {
  background: #fff;
  padding: 20px 40px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  color: #64748b;
  padding: 0;
}

.back-btn:hover {
  color: #0f172a;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.id-badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.task-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.status-pill {
  border-radius: 20px;
  font-weight: 600;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Layout */
.detail-content {
  padding: 32px 40px;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
}

/* Cards */
.content-card,
.meta-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.desc-text {
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
  font-size: 15px;
}

/* Image Grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

:deep(.img-preview) {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.empty-attachments {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #e0e0e0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Sidebar */
.sticky-sidebar {
  position: sticky;
  top: 88px;
}

.card-label {
  font-size: 12px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 16px;
}

/* Action Area */
.empty-assignee {
  text-align: center;
  color: #94a3b8;
  margin-bottom: 16px;
}

.icon-lg {
  font-size: 32px;
  margin-bottom: 8px;
  color: #cbd5e1;
}

.assignee-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 16px;
}

.assignee-info {
  display: flex;
  flex-direction: column;
}

.assignee-info .label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
}

.assignee-info .name {
  font-weight: 600;
  color: #0f172a;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 6px;
}

/* Info List */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.info-item .label {
  color: #64748b;
}

.info-item .value {
  font-weight: 500;
  color: #0f172a;
}

.compact-tag {
  border-radius: 4px;
  font-weight: 600;
  margin: 0;
}

.reporter-chip {
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mt-4 {
  margin-top: 24px;
}

.mt-3 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 24px;
}

.mb-3 {
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 992px) {

  .detail-header,
  .detail-content {
    padding: 20px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .sticky-sidebar {
    margin-top: 24px;
  }
}
</style>