<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div class="page-header compact-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-text">
            <h2 class="page-title">
              <span class="icon-box">
                <EditOutlined />
              </span>
              แก้ไข: {{ originalName || 'Loading...' }}
            </h2>
            <p class="page-subtitle">
              <span v-if="isAdmin" class="admin-badge">ADMIN MODE</span>
              แก้ไขรายละเอียดข้อมูล  #{{ originalId }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <a-button @click="handleCancel" :disabled="submitting" class="btn-cancel" style="margin-right: 8px;">
            ยกเลิก
          </a-button>
          <a-button type="primary" :loading="submitting" @click="onSubmit" class="btn-save">
            <template #icon>
              <SaveOutlined />
            </template> บันทึกการแก้ไข
          </a-button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <a-spin size="large" tip="กำลังโหลดข้อมูล..." />
    </div>

    <div v-else style="padding: 12px; width: 100%;">
      <a-form layout="vertical" :model="form">
        <a-row :gutter="[12, 12]">

          <a-col :xs="24" :lg="17" :xl="18">
            <a-card :bordered="false" class="main-card">

              <template #title>
                <div class="card-title">
                  <FormOutlined /> ข้อมูลหลัก (Main Info)
                </div>
              </template>

              <a-form-item label="หัวข้อปัญหา (Subject)" required class="mb-4">
                <a-input v-model:value="form.title" placeholder="ระบุหัวข้อปัญหา" size="large" class="modern-input" />
              </a-form-item>

              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="ประเภท (Category)" required class="mb-4">
                    <a-select v-model:value="form.bugType" placeholder="เลือกประเภท" :options="options.types"
                      :loading="dropdownLoading" size="large" class="modern-select" />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="ความเร่งด่วน (Priority)" required class="mb-4">
                    <a-select v-model:value="form.priority" placeholder="เลือกระดับ" size="large" :style="selectStyle"
                      class="custom-select" :class="{ 'has-priority': form.priority }">
                      <a-select-option v-for="opt in options.urgencies" :key="opt.value" :value="opt.value">
                        <div class="priority-option">
                          <span class="dot" :style="{ background: opt.color }"></span>
                          <span :style="{ fontWeight: 500, color: opt.color }">{{ opt.label }}</span>
                        </div>
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item label="รายละเอียด (Detail)" class="mb-4">
                <a-textarea v-model:value="form.description" placeholder="ระบุรายละเอียด..." :rows="8" show-count
                  :maxlength="2000" class="modern-textarea" />
              </a-form-item>

              <div v-if="isAdmin" class="admin-zone">
                <div class="admin-zone-header">
                  <UnlockOutlined /> Admin Zone: Force Status Change
                </div>
                <div class="admin-zone-body">
                  <a-row :gutter="16" align="middle">
                    <a-col :span="12">
                      <a-form-item label="สถานะปัจจุบัน" style="margin: 0;">
                        <a-tag :color="getStatusColor(currentStatusCode)" style="font-size: 14px; padding: 4px 10px;">
                          {{ currentStatusName || 'Unknown' }}
                        </a-tag>
                      </a-form-item>
                    </a-col>
                    <a-col :span="12">
                      <a-form-item label="เปลี่ยนเป็น (Override)" style="margin: 0;">
                        <a-select v-model:value="form.status" placeholder="-- เลือกสถานะใหม่ --" size="large"
                          class="status-select">
                          <a-select-option v-for="s in options.statuses" :key="s._id" :value="s._id">
                            <div class="status-option">
                              <a-badge :status="getStatusBadge(s.code)" /> {{ s.name }}
                            </div>
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <div class="admin-helper">
                    * การเปลี่ยนสถานะตรงนี้จะมีผลทันทีโดยไม่ต้องผ่าน Workflow ปกติ
                  </div>
                </div>
              </div>

            </a-card>
          </a-col>

          <a-col :xs="24" :lg="7" :xl="6">
            <div class="sticky-side">

              <a-card :bordered="false" class="main-card side-card">
                <div class="assign-box">
                  <div class="assign-header">
                    <span class="label">
                      <UserAddOutlined /> ผู้รับผิดชอบ
                    </span>
                    <a-switch v-model:checked="form.isCustomDeveloper" size="small" />
                  </div>

                  <transition name="fade">
                    <div v-if="form.isCustomDeveloper" class="assign-body">
                      <a-select v-model:value="form.developer" show-search placeholder="ค้นหา Dev..."
                        option-filter-prop="label" :loading="dropdownLoading" size="large" style="width: 100%;"
                        class="modern-select">
                        <a-select-option v-for="dev in options.developers" :key="dev._id" :value="dev._id"
                          :label="dev.user_name">
                          <div class="dev-item">
                            <a-avatar size="small" :src="dev.avatar"
                              :style="{ backgroundColor: !dev.avatar ? stringToColor(dev.user_name) : 'transparent' }">
                              <span v-if="!dev.avatar">{{ dev.user_name?.[0]?.toUpperCase() }}</span>
                            </a-avatar>
                            <span class="dev-name">[{{ dev.role_name }}] {{ dev.user_name }}</span>
                          </div>
                        </a-select-option>
                      </a-select>
                    </div>
                    <div v-else class="assign-placeholder">
                      ยังไม่ได้ระบุ (Unassigned)
                    </div>
                  </transition>
                </div>
              </a-card>

              <a-card :bordered="false" class="main-card side-card">
                <template #title>
                  <div class="card-title">
                    <PictureOutlined /> รูปภาพ (Images)
                  </div>
                </template>

                <div v-if="existingImages.length > 0" class="img-section">
                  <div class="section-label">รูปภาพเดิม</div>
                  <div class="image-grid">
                    <div class="img-item" v-for="(img, index) in existingImages" :key="index">
                      <img :src="img.url" @click="openPreview(img.url)" />
                      <div class="img-overlay delete" @click.stop="removeExistingImage(index)">
                        <DeleteOutlined />
                      </div>
                    </div>
                  </div>
                </div>

                <a-divider style="margin: 12px 0;" v-if="existingImages.length > 0" />

                <div class="img-section">
                  <div class="section-label">เพิ่มรูปใหม่</div>
                  <a-upload-dragger v-model:fileList="fileList" :before-upload="beforeUpload" :multiple="true"
                    accept="image/*" :show-upload-list="false" @change="handleUploadChange" class="mini-dragger">
                    <p class="icon-wrap">
                      <CloudUploadOutlined />
                    </p>
                    <p class="text-hint">คลิกหรือลากไฟล์</p>
                  </a-upload-dragger>

                  <div class="image-grid" v-if="fileList.length">
                    <div class="img-item new" v-for="file in fileList" :key="file.uid">
                      <img :src="file.thumbUrl || file.url" @click="openPreview(file.thumbUrl || file.url)" />
                      <div class="img-overlay" @click.stop="removeFile(file)">
                        <DeleteOutlined />
                      </div>
                    </div>
                  </div>
                </div>
              </a-card>

              <a-card :bordered="false" class="main-card side-card">
                <div class="meta-row" style="align-items: center;">
                  <span class="meta-label">Reporter:</span>
                  <span class="meta-val" style="display: flex; align-items: center; gap: 6px;">
                    <a-avatar size="small" :src="originalReporter?.avatar"
                      :style="{ backgroundColor: !originalReporter?.avatar ? stringToColor(originalReporter?.user_name) : 'transparent' }">
                      <span v-if="!originalReporter?.avatar">{{ originalReporter?.user_name?.[0]?.toUpperCase()
                        }}</span>
                    </a-avatar>
                    {{ originalReporter?.user_name || '-' }}
                  </span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Created:</span>
                  <span class="meta-val">{{ formatDate(createdAt) }}</span>
                </div>
              </a-card>

            </div>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <a-modal v-model:open="preview.open" :title="null" :footer="null" centered width="800px" class="preview-modal">
      <img :src="preview.src" style="width: 100%; border-radius: 4px;" />
    </a-modal>

  </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import {
  EditOutlined, FormOutlined, CloudUploadOutlined,
  DeleteOutlined, SaveOutlined, UserAddOutlined, PictureOutlined,
  UnlockOutlined
} from '@ant-design/icons-vue';
import { message, Upload, notification } from 'ant-design-vue';

export default {
  name: "IssueEdit",
  components: {
    EditOutlined, FormOutlined, CloudUploadOutlined,
    DeleteOutlined, SaveOutlined, UserAddOutlined, PictureOutlined,
    UnlockOutlined
  },
  data() {
    return {
      issueId: null,
      loading: false,
      submitting: false,
      dropdownLoading: false,
      isAdmin: false,

      options: { types: [], urgencies: [], statuses: [], developers: [] },

      // Original Data
      originalId: '',
      originalName: '',
      originalReporter: null,
      createdAt: null,
      currentStatusCode: '',
      currentStatusName: '',
      existingImages: [],

      // Upload
      fileList: [],
      maxFiles: 5,
      preview: { open: false, src: '' },

      form: {
        title: '',
        priority: undefined,
        bugType: undefined,
        status: undefined,
        description: '',
        isCustomDeveloper: false,
        developer: undefined
      },
    };
  },
  computed: {
    // ✅ เพิ่ม computed สำหรับ Style ของ Priority Dropdown
    selectStyle() {
      const selected = this.options.urgencies.find(u => u.value === this.form.priority);
      if (selected && selected.color) {
        return {
          border: `1px solid ${selected.color}`,
          backgroundColor: this.getColorWithOpacity(selected.color, 0.1),
          borderRadius: '8px',
          color: '#333',
          fontWeight: '500'
        }
      }
      return {};
    }
  },
  async mounted() {
    this.issueId = this.$route.params.id;
    this.checkPermission();
    await this.fetchDropdowns();
    await this.fetchIssueDetail();
  },
  methods: {
    // --- Utility Methods ---
    stringToColor(str) {
      if (!str) return '#1890ff';
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    },
    // ✅ Helper สำหรับสร้างสีจางๆ
    getColorWithOpacity(color, opacity) {
      const colorMap = {
        'red': '255, 77, 79', 'orange': '250, 140, 22', 'green': '82, 196, 26',
        'grey': '150, 150, 150', '#87d068': '135, 208, 104'
      };
      const rgb = colorMap[color] || '200, 200, 200';
      return `rgba(${rgb}, ${opacity})`;
    },
    checkPermission() {
      const role = localStorage.getItem('user_role');
      this.isAdmin = (role === 'Administrator');
    },
    async fetchDropdowns() {
      this.dropdownLoading = true;
      try {
        const Token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${Token}` } };
        const [resType, resUrgency, resStatus, resUserdev] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/items/issue-types', config),
          axios.get(import.meta.env.VITE_API_URL + '/items/urgencies', config),
          axios.get(import.meta.env.VITE_API_URL + '/items/statuses', config),
          axios.get(import.meta.env.VITE_API_URL + '/auth/users-list/dev', config)
        ]);
        this.options.types = this.mapOptions(resType.data);
        this.options.urgencies = this.mapOptions(resUrgency.data, true);
        this.options.statuses = resStatus.data || [];
        this.options.developers = resUserdev.data || [];
      } catch (e) { console.error(e); } finally { this.dropdownLoading = false; }
    },
    mapOptions(data, hasColor = false) {
      const list = Array.isArray(data) ? data : (data?.data || []);
      return list.map(item => ({ value: item._id, label: item.name, color: hasColor ? item.color : undefined }));
    },
    async fetchIssueDetail() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(import.meta.env.VITE_API_URL + `/issues/${this.issueId}`, config);
        const data = response.data;

        if (!this.isAdmin && data.reporter?._id !== userId && data.assignee?._id !== userId) {
          message.error('คุณไม่มีสิทธิ์แก้ไขงานนี้');
          this.$router.go(-1);
          return;
        }

        this.originalName = data.name;
        this.originalId = data.id;
        this.createdAt = data.createdAt;
        this.form.title = data.name;
        this.form.description = data.detail;
        this.form.bugType = data.type?._id;
        this.form.priority = data.urgency?._id;

        // Status Info
        this.currentStatusCode = data.status?.code;
        this.currentStatusName = data.status?.name;

        // Assignee
        if (data.assignee) {
          this.form.isCustomDeveloper = true;
          this.form.developer = data.assignee._id;
        }
        this.originalReporter = data.reporter;
        this.existingImages = (data.images || []).map(img => typeof img === 'string' ? { url: img } : img);

      } catch (error) {
        console.error(error);
        this.$router.go(-1);
      } finally {
        this.loading = false;
      }
    },
    // --- Image Logic ---
    removeExistingImage(index) { this.existingImages.splice(index, 1); },
    async getDynamicWebhook() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(import.meta.env.VITE_API_URL + '/config/discord-webhook', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.url;
      } catch { return null; }
    },
    async uploadImageToDiscord(fileObj, webhookUrl) {
      if (!webhookUrl) return null;
      const formData = new FormData();
      formData.append('file', fileObj);
      const response = await axios.post(webhookUrl, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data.attachments[0].url;
    },
    // --- Submit Logic ---
    async onSubmit() {
      if (!this.form.title) return message.warning('ระบุหัวข้อปัญหา');
      if (!this.form.priority) return message.warning('ระบุความเร่งด่วน');
      if (!this.form.bugType) return message.warning('ระบุประเภท');

      this.submitting = true;
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        let newImageUrls = [];
        if (this.fileList.length > 0) {
          const webhookUrl = await this.getDynamicWebhook();
          if (webhookUrl) {
            newImageUrls = await Promise.all(this.fileList.map(f => this.uploadImageToDiscord(f.originFileObj, webhookUrl)));
          }
        }

        const payload = {
          name: this.form.title,
          detail: this.form.description || '-',
          type: this.form.bugType,
          urgency: this.form.priority,
          images: [...this.existingImages.map(img => img.url), ...newImageUrls].map(url => ({ url: url }))
        };

        if (this.isAdmin && this.form.status) payload.status = this.form.status;
        if (this.form.isCustomDeveloper && this.form.developer) payload.assignee = this.form.developer;
        else if (!this.form.isCustomDeveloper) payload.assignee = 'null';

        await axios.put(import.meta.env.VITE_API_URL + `/issues/edit/${this.issueId}`, payload, config);

        notification.success({ message: 'บันทึกสำเร็จ', description: 'แก้ไขข้อมูลเรียบร้อยแล้ว', placement: 'topRight' });
        this.$router.push(`/issue/${this.issueId}`);
      } catch (e) {
        notification.error({ message: 'Error', description: e.response?.data?.message || e.message });
      } finally {
        this.submitting = false;
      }
    },

    // --- Helpers ---
    handleCancel() { this.$router.go(-1); },
    beforeUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
      if (!isImage) {
        message.error('เฉพาะไฟล์รูปภาพ (JPG/PNG)');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    handleUploadChange(info) {
      let list = [...info.fileList];
      list = list.slice(0, this.maxFiles).map(file => {
        if (file.originFileObj && !file.thumbUrl) file.thumbUrl = URL.createObjectURL(file.originFileObj);
        return file;
      });
      this.fileList = list;
    },
    removeFile(file) { this.fileList = this.fileList.filter(f => f.uid !== file.uid); },
    openPreview(url) { this.preview.src = url; this.preview.open = true; },
    formatDate(date) { return date ? dayjs(date).format('DD MMM YY HH:mm') : '-' },
    getStatusColor(code) {
      const map = { reported: 'red', received: 'blue', inProgress: 'processing', finished: 'cyan', upserver: 'purple', testing: 'orange', success: 'success', rejected: 'red' };
      return map[code] || 'default';
    },
    getStatusBadge(code) {
      const map = { reported: 'error', received: 'processing', inProgress: 'processing', success: 'success', rejected: 'error', testing: 'warning' };
      return map[code] || 'default';
    }
  }
};
</script>

<style scoped>
/* 1. Header */
.compact-header {
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-badge {
  background: #faad14;
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.icon-box {
  background: #e6f7ff;
  color: #1890ff;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
}

/* 2. Main Layout */
.loading-container {
  display: flex;
  justify-content: center;
  padding-top: 50px;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  height: 100%;
}

.side-card {
  margin-bottom: 12px;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
  color: #1f1f1f;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 3. Inputs */
.modern-input,
.modern-select,
.modern-textarea {
  border-radius: 6px;
}

.mb-4 {
  margin-bottom: 16px;
}

/* 4. Priority Dot */
.priority-option {
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

/* ✅ Style สำหรับ Priority Dropdown */
.custom-select.has-priority :deep(.ant-select-selector) {
  border-color: transparent !important;
  box-shadow: none !important;
}

/* 5. Admin Zone */
.admin-zone {
  border: 1px solid #ffe58f;
  background: #fffbe6;
  border-radius: 6px;
  margin-top: 16px;
  overflow: hidden;
}

.admin-zone-header {
  background: #fff1b8;
  padding: 8px 16px;
  color: #d48806;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-zone-body {
  padding: 16px;
}

.admin-helper {
  font-size: 11px;
  color: #d48806;
  margin-top: 8px;
}

/* 6. Assignee Box */
.assign-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assign-header .label {
  font-weight: 600;
  color: #595959;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.assign-placeholder {
  color: #bfbfbf;
  font-style: italic;
  font-size: 13px;
  text-align: center;
  padding: 8px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.dev-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dev-name {
  font-weight: 500;
  font-size: 13px;
}

/* 7. Image Grid */
.img-section {
  margin-bottom: 8px;
}

.section-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: 500;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.img-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}

.img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: 0.2s;
  cursor: pointer;
}

.img-item:hover .img-overlay {
  opacity: 1;
}

.img-overlay.delete {
  background: rgba(255, 77, 79, 0.7);
}

/* Mini Dragger */
.mini-dragger :deep(.ant-upload-drag) {
  border: 1px dashed #d9d9d9;
  background: #fafafa;
  border-radius: 6px;
}

.mini-dragger :deep(.ant-upload-btn) {
  padding: 8px 0 !important;
}

.icon-wrap {
  font-size: 20px;
  color: #1890ff;
  margin-bottom: 0;
}

.text-hint {
  font-size: 11px;
  color: #8c8c8c;
}

/* 8. Metadata */
.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.meta-label {
  color: #8c8c8c;
}

.meta-val {
  font-weight: 500;
  color: #262626;
}
</style>