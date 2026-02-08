<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <a-spin size="large" />
        <p>Loading Task...</p>
      </div>
    </div>

    <div v-else class="page-container">

      <div class="page-header compact-header">
        <div class="header-content">
          <div class="header-left">
            <div class="header-text">
              <div class="title-row">
                <span class="id-badge">#{{ issue.issue_id || issue.id || '...' }}</span>
                <h1 class="page-title">{{ issue.name }}</h1>
              </div>
              <div class="status-row">
                <a-tag :color="getStatusColor(issue.status?.code)" class="status-tag">
                  <template #icon>
                    <component :is="getStatusIcon(issue.status?.code)" />
                  </template>
                  {{ (issue.status?.name || 'Unknown') }}
                </a-tag>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <a-button @click="goBack" type="default" size="small">
              <template #icon>
                <ArrowLeftOutlined />
              </template> Back
            </a-button>
          </div>
        </div>
      </div>

      <div style="padding: 12px; width: 100%;">
        <a-row :gutter="[12, 12]">

          <a-col :xs="24" :lg="17" :xl="18">

            <transition name="fade">
              <div v-if="issue.remarks" class="custom-alert error mb-3">
                <div class="alert-icon">
                  <CloseCircleFilled />
                </div>
                <div class="alert-content">
                  <h4 class="alert-title">งานถูกส่งกลับแก้ไข (Rejected)</h4>
                  <p class="alert-desc">"{{ issue.remarks || 'ไม่ได้ระบุเหตุผล' }}"</p>

                  <div v-if="issue.remarks_images?.length" class="mini-gallery">
                    <div v-for="img in issue.remarks_images" :key="img._id" class="mini-img-wrapper">
                      <a-image :src="img.url" class="mini-img" />
                    </div>
                  </div>

                  <div v-if="issue.tester" class="alert-meta">
                    <a-avatar size="small" :src="issue.tester.avatar" style="margin-right: 6px;">
                      <span v-if="!issue.tester.avatar">{{ issue.tester.user_name?.[0]?.toUpperCase()
                      }}</span>
                    </a-avatar>
                    ตรวจสอบโดย: <strong>{{ issue.tester.user_name }}</strong>
                    <span class="divider">|</span>
                    <ClockCircleOutlined /> {{ formatDate(issue.updatedAt) }}
                  </div>
                </div>
              </div>
            </transition>

            <a-card :bordered="false" class="main-card content-card">

              <div class="card-section">
                <h3 class="section-title">
                  <FileTextOutlined /> Requirement Detail
                </h3>
                <div class="desc-box">
                  {{ issue.detail || 'No description provided.' }}
                </div>
              </div>

              <a-divider style="margin: 24px 0;" />

              <div class="card-section">
                <h3 class="section-title">
                  <PaperClipOutlined /> Attachments
                  <span class="count-badge" v-if="issue.images">{{ issue.images.length }}</span>
                </h3>

                <div class="image-grid" v-if="issue.images && issue.images.length > 0">
                  <div v-for="img in issue.images" :key="img._id" class="img-wrapper">
                    <a-image :src="img.url" class="img-preview" />
                  </div>
                </div>
                <div v-else class="empty-state">
                  <p class="text-muted">
                    <FileTextOutlined /> No attachments
                  </p>
                </div>
              </div>

              <a-divider style="margin: 24px 0;" />

              <div class="card-section">
                <h3 class="section-title">
                  <UserOutlined /> Developer Note
                </h3>
                <div class="note-input-wrapper">
                  <a-textarea v-model:value="form.note" placeholder="Add a note or comment for this task..." :rows="6"
                    class="modern-textarea" />
                  <div class="input-hint">Note saves automatically on status update.</div>
                </div>
              </div>

            </a-card>
          </a-col>

          <a-col :xs="24" :lg="7" :xl="6">
            <div class="sticky-sidebar">

              <a-card :bordered="false" class="main-card side-card mb-3">

                <div v-if="!issue.assignee">
                  <div class="unassigned-state">
                    <div class="icon-circle pulse">
                      <UserAddOutlined />
                    </div>
                    <h3>Unassigned Task</h3>
                    <p>งานนี้ยังไม่มีผู้รับผิดชอบ</p>
                    <a-button type="primary" block size="large" class="btn-claim" @click="claimIssue"
                      :loading="actionLoading">
                      ✋ Claim Task
                    </a-button>
                  </div>
                </div>

                <div v-else>
                  <div class="assignee-header">
                    <a-avatar :size="48" :src="issue.assignee.avatar"
                      :style="{ backgroundColor: !issue.assignee.avatar ? stringToColor(issue.assignee.user_name) : 'transparent' }">
                      <span v-if="!issue.assignee.avatar">{{ (issue.assignee.user_name || 'U')[0] }}</span>
                    </a-avatar>

                    <div class="assignee-details">
                      <span class="label">Responsible</span>
                      <h4 class="name text-ellipsis">{{ issue.assignee.user_name }}</h4>
                    </div>
                  </div>

                  <div v-if="isMyTask" class="action-area">
                    <a-divider style="margin: 16px 0;" />

                    <div v-if="issue.status?.code === 'testing'" class="status-locked">
                      <div class="locked-content">
                        <div class="locked-icon">
                          <ExperimentOutlined spin />
                        </div>
                        <h4>Under QA Review</h4>
                        <p>รอ QA ตรวจสอบงาน</p>
                      </div>
                    </div>

                    <div v-else class="status-updater">
                      <label class="form-label">Update Status</label>
                      <a-select v-model:value="selectedStatus" class="modern-select w-100 mb-2">
                        <a-select-option v-for="st in statusOptions" :key="st._id" :value="st._id">
                          <div class="status-option">
                            <span :class="['dot', getStatusBadgeType(st.code)]"></span> {{ st.name }}
                          </div>
                        </a-select-option>
                      </a-select>

                      <a-button type="primary" block class="btn-save" @click="updateStatus" :loading="actionLoading">
                        Save Changes
                      </a-button>
                    </div>
                  </div>
                </div>
              </a-card>

              <a-card :bordered="false" class="main-card side-card">
                <h4 class="side-title">Ticket Info</h4>
                <div class="info-list">
                  <div class="info-row">
                    <span class="label">Type</span>
                    <span class="val-text">{{ issue.type?.name || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Urgency</span>
                    <a-tag :color="issue.urgency?.color" class="tag-pill">{{ issue.urgency?.name }}</a-tag>
                  </div>
                  <div class="info-row">
                    <span class="label">Reporter</span>
                    <div class="reporter-pill">
                      <a-avatar v-if="issue.reporter?.avatar" size="small" :src="issue.reporter.avatar"
                        style="margin-right: 4px;" />
                      <UserOutlined v-else style="margin-right: 4px;" />
                      {{ issue.reporter?.user_name || 'Unknown' }}
                    </div>
                  </div>
                  <div class="info-row">
                    <span class="label">Created</span>
                    <span class="val-text">{{ formatDate(issue.createdAt) }}</span>
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
  CloseCircleFilled, AlertOutlined, CloudUploadOutlined, ExperimentOutlined, CloseCircleOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import dayjs from 'dayjs';

export default {
  name: 'DevelopmentDetailView',
  components: {
    ArrowLeftOutlined, UserOutlined, ClockCircleOutlined, UserAddOutlined,
    FileTextOutlined, PaperClipOutlined, CheckCircleOutlined, SyncOutlined,
    CloseCircleFilled, AlertOutlined, CloudUploadOutlined, ExperimentOutlined, CloseCircleOutlined
  },
  data() {
    return {
      loading: false,
      actionLoading: false,
      authProfile: null,
      selectedStatus: undefined,
      issue: {},
      statusOptions: [],
      form: { note: '' }
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
      message.error("Failed to load data");
    } finally {
      this.loading = false;
    }
  },
  methods: {
    goBack() { this.$router.go(-1); },
    formatDate(date) { return date ? dayjs(date).format('D MMM YYYY, HH:mm') : '-'; },

    getStatusColor(code) {
      const map = { reported: 'red', received: 'default', inProgress: 'blue', finished: 'cyan', testing: 'orange', success: 'green', upserver: 'purple', rejected: 'red' };
      return map[code] || 'default';
    },
    getStatusIcon(code) {
      const map = { inProgress: 'SyncOutlined', success: 'CheckCircleOutlined', rejected: 'CloseCircleOutlined', testing: 'AlertOutlined', upserver: 'CloudUploadOutlined' };
      return map[code] || 'ClockCircleOutlined';
    },
    getStatusBadgeType(code) {
      const map = { received: 'default', inProgress: 'processing', finished: 'success', upserver: 'warning', rejected: 'error' };
      return map[code] || 'default';
    },
    stringToColor(str) {
      if (!str) return '#3b82f6';
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    },

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
      this.form.note = this.issue.note || '';
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
        const targetStatus = this.statusOptions.find(s => s.code === 'received' || s.name.toLowerCase().includes('progress'));
        const statusIdToUse = targetStatus ? targetStatus._id : this.issue.status?._id;
        const token = localStorage.getItem('token');
        const payload = {
          assignee: this.authProfile._id,
          status: statusIdToUse,
          note: this.form.note
        };
        await axios.put(import.meta.env.VITE_API_URL + `/issues/${this.issue._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        message.success('Claimed successfully!');
        await this.fetchIssueDetail(this.issue._id);
      } catch (error) {
        console.error(error);
        message.error('Failed to claim issue');
      } finally {
        this.actionLoading = false;
      }
    },
    async updateStatus() {
      this.actionLoading = true;
      try {
        const token = localStorage.getItem('token');
        await axios.put(import.meta.env.VITE_API_URL + `/issues/${this.issue._id}`, { status: this.selectedStatus, note: this.form.note }, { headers: { Authorization: `Bearer ${token}` } });
        message.success('Status updated');
        await this.fetchIssueDetail(this.issue._id);
      } catch (error) {
        console.error(error);
        message.error('Update failed');
      } finally {
        this.actionLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* 1. Global Layout */
.page-container {
  width: 100%;
  padding-bottom: 40px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
}

.loading-content {
  text-align: center;
  color: #64748b;
  font-weight: 500;
}

/* 2. Compact Header */
.compact-header {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  margin-bottom: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  /* Allow left part to take available space */
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  /* Wrap on small screens */
}

.id-badge {
  background: #f5f5f5;
  color: #888;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #e8e8e8;
  white-space: nowrap;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.2;
}

.status-row {
  margin-top: 4px;
}

.status-tag {
  border-radius: 4px;
  border: none;
  font-weight: 600;
  font-size: 12px;
}

/* 3. Main Cards (Clean) */
.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.content-card {
  min-height: 600px;
}

.side-card {
  margin-bottom: 12px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.w-100 {
  width: 100%;
}

/* 4. Sections */
.card-section {
  position: relative;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
}

.desc-box {
  background: #fdfdfd;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 14px;
}

/* 5. Attachments */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.img-wrapper {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  aspect-ratio: 16/9;
  background: #f8fafc;
  transition: transform 0.2s;
}

.img-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.img-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-state {
  text-align: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px dashed #e2e8f0;
  color: #94a3b8;
}

/* 6. Inputs */
.modern-textarea {
  border-radius: 6px;
  border-color: #d9d9d9;
  padding: 12px;
  font-size: 14px;
}

.modern-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.input-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  text-align: right;
}

.modern-select {
  border-radius: 6px;
}

/* 7. Sidebar & Actions */
.sticky-sidebar {
  position: sticky;
  top: 12px;
}

.side-title {
  font-size: 12px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  margin-bottom: 12px;
}

/* Unassigned */
.unassigned-state {
  text-align: center;
  padding: 10px 0;
}

.icon-circle {
  width: 56px;
  height: 56px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 12px;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px #dbeafe;
}

.unassigned-state h3 {
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
  font-size: 16px;
}

.unassigned-state p {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 16px;
}

/* Assignee */
.assignee-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.assignee-details .label {
  font-size: 10px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
}

.assignee-details .name {
  font-weight: 700;
  color: #0f172a;
  font-size: 16px;
  margin: 0;
  line-height: 1.2;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

/* Status Logic */
.status-locked {
  background: #fff7ed;
  border: 1px dashed #fdba74;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
}

.locked-icon {
  font-size: 24px;
  color: #f97316;
  margin-bottom: 8px;
}

.locked-content h4 {
  color: #9a3412;
  font-weight: 700;
  margin-bottom: 2px;
  font-size: 14px;
}

.locked-content p {
  color: #c2410c;
  font-size: 12px;
  margin: 0;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.processing {
  background: #3b82f6;
}

.dot.success {
  background: #22c55e;
}

.dot.warning {
  background: #f59e0b;
}

.dot.default {
  background: #cbd5e1;
}

.btn-claim {
  height: 40px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-save {
  height: 36px;
  border-radius: 6px;
  font-weight: 600;
}

/* Info List */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-row .label {
  color: #64748b;
}

.val-text {
  font-weight: 500;
  color: #1e293b;
}

.tag-pill {
  border: none;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
}

.reporter-pill {
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 12px;
  color: #475569;
  font-size: 12px;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
}

/* Alert */
.custom-alert {
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  gap: 12px;
}

.custom-alert.error {
  background: #fff1f0;
  border: 1px solid #ffccc7;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  color: #a8071a;
}

.alert-icon {
  font-size: 24px;
  color: #ff4d4f;
}

.alert-content {
  flex: 1;
}

.alert-title {
  margin: 0 0 4px;
  font-weight: 700;
  color: #cf1322;
  font-size: 15px;
}

.alert-desc {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #5c0011;
}

.alert-meta {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.5);
  padding: 4px 8px;
  border-radius: 4px;
  width: fit-content;
}


.mini-gallery {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}


.mini-img-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.mini-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==========================================================================
   📱 Mobile Responsive Tweaks (Added Logic)
   ========================================================================== */
@media (max-width: 768px) {

  /* Header */
  .compact-header {
    padding: 12px 16px;
    /* ลด Padding Header */
  }

  .page-title {
    font-size: 18px;
    /* ลดขนาด Font Title */
  }

  /* Content Card Height */
  .content-card {
    min-height: auto;
    /* ยกเลิก Fixed Height บนมือถือ */
  }

  /* Sidebar */
  .sticky-sidebar {
    position: static;
    /* ปิด Sticky บนมือถือ */
  }

  /* Image Grid */
  .image-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    /* เหลือ 2 คอลัมน์บนมือถือ */
  }

  /* Alert */
  .custom-alert.error {
    flex-direction: column;
    /* เรียง Alert แนวตั้งถ้ายาว */
    gap: 8px;
  }
}
</style>