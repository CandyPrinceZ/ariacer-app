<template>
  <a-layout style="min-height: 100vh; background: #f0f2f5;">

    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <a-spin size="large" />
        <p>Loading Task...</p>
      </div>
    </div>

    <div v-else class="page-container">

      <div class="detail-header">
        <div class="header-inner">
          <div class="header-left">
            <a-button @click="goBack" type="text" class="back-btn">
              <template #icon><ArrowLeftOutlined /></template> Back
            </a-button>
            <div class="title-wrapper">
              <div class="id-badge">#{{ issue.id || '...' }}</div>
              <h1 class="task-title">{{ issue.name }}</h1>
            </div>
          </div>
          <div class="header-right">
            <div :class="['status-badge', issue.status?.code]">
              <component :is="getStatusIcon(issue.status?.code)" />
              <span>{{ (issue.status?.name || 'Unknown') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <a-row :gutter="24">

          <a-col :xs="24" :lg="17" :xl="18">

            <transition name="fade">
              <div v-if="issue.status?.code === 'rejected'" class="custom-alert error">
                <div class="alert-icon"><CloseCircleOutlined /></div>
                <div class="alert-content">
                  <h4 class="alert-title">งานถูกส่งกลับแก้ไข (Rejected)</h4>
                  <p class="alert-desc">"{{ issue.remarks || 'No remark provided.' }}"</p>
                  
                  <div v-if="issue.remarks_images && issue.remarks_images.length > 0" class="mini-gallery">
                    <div v-for="img in issue.remarks_images" :key="img._id" class="mini-img-wrapper">
                      <a-image :src="img.url" class="mini-img" />
                    </div>
                  </div>

                  <div v-if="issue.tester" class="alert-meta">
                    <UserOutlined /> ตรวจสอบโดย: <strong>{{ issue.tester.user_name }}</strong>
                  </div>
                </div>
              </div>
            </transition>

            <a-card :bordered="false" class="main-card">
              <div class="card-section">
                <h3 class="section-title">
                  <FileTextOutlined /> Requirement Detail
                </h3>
                <div class="desc-box">
                  {{ issue.detail || 'No description provided.' }}
                </div>
              </div>

              <div class="card-section mt-6">
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
                  <div class="empty-icon"><FileTextOutlined /></div>
                  <p>No attachments available</p>
                </div>
              </div>

              <div class="card-section mt-6">
                <h3 class="section-title">
                  <UserOutlined /> Developer Note
                </h3>
                <div class="note-input-wrapper">
                  <a-textarea 
                    v-model:value="form.note" 
                    placeholder="Add a note or comment for this task..." 
                    :rows="4"
                    class="custom-textarea" 
                  />
                  <div class="input-hint">Note will be saved automatically when you claim or update status.</div>
                </div>
              </div>
            </a-card>
          </a-col>

          <a-col :xs="24" :lg="7" :xl="6">
            <div class="sticky-sidebar">

              <a-card :bordered="false" class="side-card action-card mb-4">
                
                <div v-if="!issue.assignee">
                  <div class="unassigned-state">
                    <div class="icon-circle pulse">
                      <UserAddOutlined />
                    </div>
                    <h3>Unassigned Task</h3>
                    <p>This task needs a developer.</p>
                    <a-button type="primary" block size="large" class="btn-claim" @click="claimIssue" :loading="actionLoading">
                      ✋ Claim Task
                    </a-button>
                  </div>
                </div>

                <div v-else>
                  <div class="assignee-card">
                    <div class="assignee-header">
                      <div class="avatar-wrapper">
                        <a-avatar :size="52" :style="{ backgroundColor: stringToColor(issue.assignee.user_name), fontSize: '20px' }">
                          {{ (issue.assignee.user_name || 'U')[0] }}
                        </a-avatar>
                      </div>
                      <div class="assignee-details">
                        <span class="label">Responsible</span>
                        <h4 class="name">{{ issue.assignee.user_name }}</h4>
                      </div>
                    </div>

                    <div v-if="isMyTask" class="action-area">
                      <div class="divider"></div>

                      <div v-if="issue.status?.code === 'testing'" class="status-locked">
                        <div class="locked-content">
                          <div class="locked-icon"><ExperimentOutlined spin /></div>
                          <h4>Under QA Review</h4>
                          <p>You cannot update status while QA is testing.</p>
                        </div>
                      </div>

                      <div v-else class="status-updater">
                        <label class="form-label">Update Progress</label>
                        <a-select v-model:value="selectedStatus" class="custom-select" dropdownClassName="status-dropdown">
                          <a-select-option v-for="st in statusOptions" :key="st._id" :value="st._id">
                            <div class="status-option">
                              <span :class="['dot', getStatusBadgeType(st.code)]"></span>
                              {{ st.name }}
                            </div>
                          </a-select-option>
                        </a-select>
                        
                        <a-button type="primary" block class="btn-save" @click="updateStatus" :loading="actionLoading">
                          Save Changes
                        </a-button>
                      </div>
                    </div>
                  </div>
                </div>
              </a-card>

              <a-card :bordered="false" class="side-card info-card">
                <h4 class="side-title">Ticket Information</h4>
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
                      <UserOutlined /> {{ issue.reporter?.user_name || 'Unknown' }}
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
  CloseCircleOutlined, AlertOutlined, CloudUploadOutlined, ExperimentOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import dayjs from 'dayjs';

export default {
  name: 'DevelopmentDetailView',
  components: {
    ArrowLeftOutlined, UserOutlined, ClockCircleOutlined, UserAddOutlined,
    FileTextOutlined, PaperClipOutlined, CheckCircleOutlined, SyncOutlined,
    CloseCircleOutlined, AlertOutlined, CloudUploadOutlined, ExperimentOutlined
  },
  data() {
    return {
      loading: false,
      actionLoading: false,
      authProfile: null,
      selectedStatus: undefined,
      issue: {},
      statusOptions: [],
      form: {
        note: ''
      }
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

    // UI Helpers
    getStatusColor(code) { return code || 'default'; },
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
      this.form.note = this.issue.note || ''; // Default empty string
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
/* --- 1. Global & Layout --- */
.loading-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255,255,255,0.8); z-index: 999;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
}
.loading-content { text-align: center; color: #64748b; font-weight: 500; }
.page-container { padding-bottom: 60px; }

/* --- 2. Header --- */
.detail-header {
  background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.header-inner {
  max-width: 1400px; margin: 0 auto; padding: 0 24px;
  display: flex; justify-content: space-between; align-items: center;
}
.header-left { display: flex; flex-direction: column; gap: 8px; }
.back-btn { padding: 0; color: #64748b; font-size: 14px; width: fit-content; }
.back-btn:hover { color: #3b82f6; }
.title-wrapper { display: flex; align-items: center; gap: 12px; }
.id-badge {
  background: #f1f5f9; color: #475569; padding: 4px 10px;
  border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
}
.task-title { margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.2; }

/* Status Badge */
.status-badge {
  padding: 8px 16px; border-radius: 30px; font-weight: 600;
  display: flex; align-items: center; gap: 8px; font-size: 14px; background: #f1f5f9; color: #475569;
}
.status-badge.reported { background: #fee2e2; color: #ef4444; }
.status-badge.inProgress { background: #dbeafe; color: #3b82f6; }
.status-badge.testing { background: #ffedd5; color: #f97316; }
.status-badge.success { background: #dcfce7; color: #22c55e; }
.status-badge.rejected { background: #fee2e2; color: #dc2626; }
.status-badge.upserver { background: #fef9c3; color: #ca8a04; }

/* --- 3. Content Area --- */
.detail-content { max-width: 1400px; margin: 32px auto 0; padding: 0 24px; }

/* --- 4. Cards --- */
.main-card, .side-card {
  border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden; border: 1px solid #f1f5f9; transition: transform 0.2s;
}
.side-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }

/* --- 5. Alerts --- */
.custom-alert { padding: 20px; border-radius: 12px; display: flex; gap: 16px; margin-bottom: 24px; }
.custom-alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.alert-icon { font-size: 24px; color: #ef4444; }
.alert-title { margin: 0 0 8px; font-weight: 700; color: #991b1b; }
.alert-desc { margin: 0 0 12px; font-size: 15px; line-height: 1.6; }
.alert-meta { font-size: 13px; color: #ef4444; margin-top: 12px; display: flex; align-items: center; gap: 6px; }
.mini-gallery { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.mini-img-wrapper { width: 60px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; }
.mini-img { width: 100%; height: 100%; object-fit: cover; }

/* --- 6. Sections --- */
.card-section { position: relative; }
.section-title {
  font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 16px;
  display: flex; align-items: center; gap: 8px;
}
.count-badge { background: #f1f5f9; color: #64748b; font-size: 12px; padding: 2px 8px; border-radius: 10px; }
.desc-box {
  background: #fdfdfd; padding: 20px; border-radius: 12px;
  border: 1px solid #f1f5f9; color: #475569; line-height: 1.7; white-space: pre-wrap; font-size: 15px;
}

/* --- 7. Images --- */
.image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.img-wrapper {
  border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;
  aspect-ratio: 16/9; background: #f8fafc; transition: transform 0.2s;
}
.img-wrapper:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
:deep(.img-preview) { width: 100%; height: 100%; object-fit: cover; }
.empty-state { text-align: center; padding: 40px; background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0; color: #94a3b8; }
.empty-icon { font-size: 32px; margin-bottom: 8px; color: #cbd5e1; }

/* --- 8. Inputs --- */
.custom-textarea {
  border-radius: 12px; border-color: #e2e8f0; padding: 16px; font-size: 15px; background: #fff; transition: all 0.2s;
}
.custom-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.input-hint { font-size: 12px; color: #94a3b8; margin-top: 8px; text-align: right; }

/* --- 9. Sidebar --- */
.sticky-sidebar { position: sticky; top: 100px; }
.side-card { padding: 24px; }
.side-title { font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 20px; }

/* State: Unassigned */
.unassigned-state { text-align: center; padding: 10px 0; }
.icon-circle {
  width: 72px; height: 72px; background: #eff6ff; color: #3b82f6;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 28px; margin: 0 auto 16px; border: 4px solid #fff; box-shadow: 0 0 0 2px #dbeafe;
}
.unassigned-state h3 { font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 18px; }
.unassigned-state p { color: #64748b; font-size: 14px; margin-bottom: 24px; }

/* State: Assignee Card */
.assignee-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.assignee-details { display: flex; flex-direction: column; }
.assignee-details .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }
.assignee-details .name { font-weight: 700; color: #0f172a; font-size: 18px; margin: 0; line-height: 1.2; }

/* State: Locked (Testing) */
.status-locked {
  background: #fff7ed; border: 1px dashed #fdba74; border-radius: 12px; padding: 24px; text-align: center;
}
.locked-icon { font-size: 32px; color: #f97316; margin-bottom: 12px; }
.locked-content h4 { color: #9a3412; font-weight: 700; margin-bottom: 4px; }
.locked-content p { color: #c2410c; font-size: 13px; line-height: 1.5; margin: 0; }

/* Status Updater */
.divider { height: 1px; background: #f1f5f9; margin: 24px 0; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
.custom-select { width: 100%; margin-bottom: 16px; }
.status-option { display: flex; align-items: center; gap: 10px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot.processing { background: #3b82f6; box-shadow: 0 0 0 2px #dbeafe; }
.dot.success { background: #22c55e; box-shadow: 0 0 0 2px #dcfce7; }
.dot.warning { background: #f59e0b; box-shadow: 0 0 0 2px #fef3c7; }
.dot.default { background: #cbd5e1; }

/* Buttons */
.btn-claim {
  height: 48px; border-radius: 12px; font-weight: 600; font-size: 16px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); border: none; transition: all 0.3s ease;
}
.btn-claim:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }

.btn-save {
  height: 44px; border-radius: 10px; font-weight: 600; border: none;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: all 0.2s;
}
.btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 12px -2px rgba(59, 130, 246, 0.3); }

/* Info List */
.info-list { display: flex; flex-direction: column; gap: 16px; }
.info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.info-row .label { color: #64748b; }
.val-text { font-weight: 500; color: #1e293b; }
.tag-pill { border: none; padding: 2px 10px; border-radius: 6px; font-weight: 600; }
.reporter-pill { background: #f8fafc; padding: 4px 12px; border-radius: 20px; color: #475569; font-size: 13px; border: 1px solid #f1f5f9; }

/* Utilities */
.mt-6 { margin-top: 24px; }
.mb-4 { margin-bottom: 24px; }

/* Responsive */
@media (max-width: 992px) {
  .header-inner { flex-direction: column; align-items: flex-start; gap: 16px; }
  .sticky-sidebar { margin-top: 24px; }
}
</style>