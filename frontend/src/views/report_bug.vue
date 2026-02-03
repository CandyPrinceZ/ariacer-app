<template>
  <a-layout style="min-height: 100vh; background: #f0f2f5;">
    <div class="page-header">
      <div class="header-inner">
        <div class="header-title">
          <BugOutlined class="title-icon" />
          <span>Report Issues</span>
        </div>
        <p class="header-subtitle">แจ้งปัญหาการใช้งานเพื่อให้ทีมพัฒนาตรวจสอบและแก้ไข</p>
      </div>
    </div>

    <div class="page-content">
      <a-form layout="vertical" :model="form" class="h-100">
        <a-row :gutter="[24, 24]" class="h-100">

          <a-col :xs="24" :lg="15" :xl="16">
            <a-card :bordered="false" class="main-card h-100">
              <template #title>
                <span class="card-title">
                  <FormOutlined /> รายละเอียดปัญหา
                </span>
              </template>

              <a-form-item label="หัวข้อปัญหา (Subject)" required>
                <a-input v-model:value="form.title" placeholder="สรุปปัญหาใน 1 ประโยค" size="large"
                  class="modern-input" />
              </a-form-item>

              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="ประเภท (Category)" required>
                    <a-select v-model:value="form.bugType" placeholder="เลือกประเภท" :options="issueTypeOptions"
                      :loading="dropdownLoading" size="large" class="modern-select" />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="ความเร่งด่วน (Priority)" required>
                    <a-select v-model:value="form.priority" placeholder="เลือกระดับ" size="large" :style="selectStyle"
                      class="custom-select" :class="{ 'has-priority': form.priority }">
                      <a-select-option v-for="opt in urgencyOptions" :key="opt.value" :value="opt.value">
                        <div class="priority-option">
                          <span class="dot" :style="{ background: opt.color }"></span>
                          <span :style="{ fontWeight: 500, color: opt.color }">{{ opt.label }}</span>
                        </div>
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item label="คำอธิบายเพิ่มเติม (Description)">
                <a-textarea v-model:value="form.description"
                  placeholder="ระบุรายละเอียด, ขั้นตอนการเกิดปัญหา (Steps to reproduce), หรือสิ่งที่คาดหวัง" :rows="12"
                  show-count :maxlength="2000" class="modern-textarea" />
              </a-form-item>

              <div class="assign-dev-box">
                <div class="assign-header">
                  <span class="label">
                    <UserAddOutlined /> กำหนดผู้พัฒนาเอง (Assign Developer)
                  </span>
                  <a-switch v-model:checked="form.isCustomDeveloper" size="small" />
                </div>

                <transition name="slide-fade">
                  <div v-if="form.isCustomDeveloper" class="assign-body">
                    <a-select v-model:value="form.developer" show-search placeholder="ค้นหาชื่อผู้พัฒนา..."
                      option-filter-prop="label" :loading="dropdownLoading" size="large" class="modern-select" style="width: 100%;">
                      <a-select-option v-for="dev in developers" :key="dev._id" :value="dev._id" :label="dev.user_name">
                        <div class="dev-option-item">
                          <a-avatar size="small" :style="{ backgroundColor: stringToColor(dev.user_name) }">
                            {{ dev.user_name?.[0]?.toUpperCase() }}
                          </a-avatar>
                          <span class="dev-name">[{{ dev.role_name }}] {{ dev.user_name }}</span>
                        </div>
                      </a-select-option>
                    </a-select>

                    <span class="helper-text">หากไม่ระบุ ระบบจะส่งแจ้งเตือนไปยังกลุ่ม Dev กลาง</span>
                  </div>
                </transition>
              </div>
              </a-card>
          </a-col>

          <a-col :xs="24" :lg="9" :xl="8">
            <div class="sticky-side">

              <a-card :bordered="false" class="main-card">
                <template #title>
                  <span class="card-title">
                    <CameraOutlined /> หลักฐาน (Screenshot)
                  </span>
                </template>

                <div class="upload-wrapper">
                  <a-upload-dragger v-model:fileList="fileList" :before-upload="beforeUpload" :multiple="true"
                    accept="image/*" :show-upload-list="false" class="clean-dragger" @change="handleUploadChange">
                    <div class="dragger-content">
                      <p class="icon-wrap">
                        <CloudUploadOutlined />
                      </p>
                      <p class="text-primary">คลิกหรือลากไฟล์รูปภาพ</p>
                      <p class="text-secondary">รองรับ JPG, PNG (Max 5)</p>
                    </div>
                  </a-upload-dragger>

                  <div class="image-grid" v-if="fileList.length">
                    <div class="img-item" v-for="file in fileList" :key="file.uid">
                      <img :src="file.thumbUrl || file.url" @click="openPreview(file)" />
                      <div class="img-overlay" @click.stop="removeFile(file)">
                        <DeleteOutlined />
                      </div>
                    </div>
                  </div>
                </div>

                <a-divider style="margin: 24px 0;" />

                <div class="action-area">
                  <div class="reporter-info" v-if="Authprofile">
                    <span>ผู้แจ้ง : </span>
                    <strong>{{ Authprofile.user_name || 'Unknown' }}</strong>
                  </div>

                  <a-button type="primary" block size="large" class="submit-btn" :loading="submitting"
                    @click="onSubmit">
                    <SendOutlined /> ส่งแจ้งปัญหา
                  </a-button>

                  <a-button type="text" block class="reset-btn" @click="onReset">
                    <ReloadOutlined /> ล้างข้อมูล
                  </a-button>
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
import {
  BugOutlined, FormOutlined, CameraOutlined, CloudUploadOutlined,
  DeleteOutlined, SendOutlined, ReloadOutlined, UserAddOutlined // ✅ Added UserAddOutlined
} from '@ant-design/icons-vue';
import { message, Upload } from 'ant-design-vue';

export default {
  name: "ReportBugFull",
  components: {
    BugOutlined, FormOutlined, CameraOutlined, CloudUploadOutlined,
    DeleteOutlined, SendOutlined, ReloadOutlined, UserAddOutlined
  },
  data() {
    return {
      submitting: false,
      dropdownLoading: false,
      fileList: [],
      maxFiles: 5,
      preview: { open: false, src: '' },
      Authprofile: {},
      issues: [],
      urgencies: [],
      developers: [],
      form: {
        title: '',
        priority: undefined,
        bugType: undefined,
        description: '',
        isCustomDeveloper: false,
        developer: undefined
      },
    };
  },
  computed: {
    issueTypeOptions() {
      return (this.issues || []).map((it) => ({
        value: it._id, label: it.name,
      }));
    },
    urgencyOptions() {
      return (this.urgencies || []).map((u) => ({
        value: u._id, label: u.name, color: u.color,
      }));
    },
    selectStyle() {
      const selected = this.urgencyOptions.find(u => u.value === this.form.priority);
      if (selected && selected.color) {
        return {
          border: `1px solid ${selected.color}`,
          backgroundColor: this.getColorWithOpacity(selected.color, 0.15),
          borderRadius: '8px',
          color: '#333',
          fontWeight: '500'
        }
      }
      return {};
    }
  },
  async mounted() {
    await this.getAuthprofile();
    await this.fetchDropdowns();
  },
  methods: {
    stringToColor(str) {
      if (!str) return '#1890ff';
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return '#' + '00000'.substring(0, 6 - c.length) + c;
    },
    getColorWithOpacity(color, opacity) {
      const colorMap = {
        'red': '255, 77, 79',
        'orange': '250, 140, 22',
        'green': '82, 196, 26',
        'grey': '150, 150, 150',
        '#87d068': '135, 208, 104'
      };
      const rgb = colorMap[color] || '200, 200, 200';
      return `rgba(${rgb}, ${opacity})`;
    },
    async getAuthprofile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', config);
        this.Authprofile = response.data;
      } catch (error) { console.error(error); }
    },
    async fetchDropdowns() {
      this.dropdownLoading = true;
      try {
        const Token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${Token}` } };
        const [resType, resUrgency, resUserdev] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/items/issue-types', config),
          axios.get(import.meta.env.VITE_API_URL + '/items/urgencies', config),
          axios.get(import.meta.env.VITE_API_URL + '/auth/users-list/dev', config)
        ]);
        this.issues = Array.isArray(resType.data) ? resType.data : (resType.data?.data || []);
        this.urgencies = Array.isArray(resUrgency.data) ? resUrgency.data : (resUrgency.data?.data || []);
        this.developers = Array.isArray(resUserdev.data) ? resUserdev.data : (resUserdev.data?.data || []);
      } catch (e) {
        console.error(e);
        message.error('Load Failed');
      } finally {
        this.dropdownLoading = false;
      }
    },
    beforeUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
      if (!isImage) {
        message.error('อัปโหลดได้เฉพาะไฟล์รูปภาพ (JPG/PNG) เท่านั้น');
        return Upload.LIST_IGNORE;
      }
      return false; // กัน Auto Upload
    },
    handleUploadChange(info) {
      let list = [...info.fileList];

      // จำกัดจำนวนไฟล์
      if (list.length > this.maxFiles) {
        message.warning(`อัปโหลดได้สูงสุด ${this.maxFiles} รูป`);
        list = list.slice(0, this.maxFiles);
      }

      // สร้าง URL สำหรับแสดงรูปตัวอย่าง (เพราะเราปิด show-upload-list)
      list = list.map(file => {
        if (file.originFileObj && !file.thumbUrl) {
          file.thumbUrl = URL.createObjectURL(file.originFileObj);
        }
        return file;
      });

      this.fileList = list;
    },
    removeFile(file) {
      if (file.thumbUrl) URL.revokeObjectURL(file.thumbUrl);
      this.fileList = this.fileList.filter((f) => f.uid !== file.uid);
    },
    openPreview(file) {
      this.preview.src = file.thumbUrl || file.url || '';
      this.preview.open = true;
    },

    async getDynamicWebhook() {
      try {
        const token = localStorage.getItem('token');
        // ยิงไปที่ API ที่เราสร้างไว้ใน Backend (configController)
        const res = await axios.get(import.meta.env.VITE_API_URL + '/config/discord-webhook', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.url;
      } catch (error) {
        console.error("Failed to get webhook url", error);
        throw new Error("Unable to fetch webhook URL");
      }
    },

    async uploadImageToDiscord(fileObj, webhookUrl) {
      const formData = new FormData();
      formData.append('file', fileObj);

      // ใช้ webhookUrl ที่ส่งเข้ามา (ซึ่งเป็นตัวล่าสุดเสมอ)
      const response = await axios.post(webhookUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.attachments[0].url;
    },

    async onSubmit() {
      if (!this.form.title) return message.warning('Please enter a title');
      if (!this.form.priority) return message.warning('Please select priority');
      if (!this.form.bugType) return message.warning('Please select category');

      this.submitting = true;
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        let imageUrls = [];

        // ถ้ามีรูป ต้องไปดึง URL Webhook ล่าสุดมาก่อน
        if (this.fileList.length > 0) {
          message.loading({ content: 'Fetching upload server...', key: 'up', duration: 0 });

          // 1. ดึง URL ล่าสุด
          const currentWebhookUrl = await this.getDynamicWebhook();

          message.loading({ content: 'Uploading images...', key: 'up', duration: 0 });

          // 2. ส่ง URL นั้นไปให้ฟังก์ชัน upload
          imageUrls = await Promise.all(
            this.fileList.map(f => this.uploadImageToDiscord(f.originFileObj, currentWebhookUrl))
          );

          message.success({ content: 'Images uploaded', key: 'up', duration: 2 });
        }

        const payload = {
          name: this.form.title,
          detail: this.form.description || '-',
          type: this.form.bugType,
          status: "65b000000000000000000001", // Waiting
          urgency: this.form.priority,
          reporter: this.Authprofile._id,
          images: imageUrls
        };

        if (this.form.isCustomDeveloper && this.form.developer) {
          payload.assignee = this.form.developer;
        }

        const res = await axios.post(import.meta.env.VITE_API_URL + '/issues', payload, config);

        message.success('Bug reported successfully! ID: ' + (res.data.id || ''));
        this.onReset();
      } catch (e) {
        console.error(e);
        message.error('Submission failed: ' + (e.response?.data?.message || e.message));
      } finally {
        this.submitting = false;
      }
    },
    onReset() {
      this.form = { title: '', priority: undefined, bugType: undefined, description: '', isCustomDeveloper: false, developer: undefined };
      this.fileList = [];
    }
  }
};
</script>

<style scoped>
/* --- Override for Priority Select (Transparent when selected) --- */
.custom-select.has-priority :deep(.ant-select-selector) {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.custom-select.has-priority:hover :deep(.ant-select-selector) {
  background-color: transparent !important;
  border-color: transparent !important;
}

.custom-select :deep(.ant-select-arrow) {
  color: rgba(0, 0, 0, 0.45);
}

/* Page Structure */
.page-header {
  background: #fff;
  padding: 20px 40px;
  border-bottom: 1px solid #e8e8e8;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: #ff4d4f;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
}

.header-subtitle {
  color: #8c8c8c;
  margin: 4px 0 0 38px;
  font-size: 14px;
}

.page-content {
  padding: 24px 40px;
}

/* Cards */
.main-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.card-title {
  font-weight: 600;
  color: #1f1f1f;
  font-size: 16px;
}

/* Inputs Modernization */
.modern-input,
.modern-select,
.modern-textarea {
  border-radius: 8px;
}

.modern-textarea {
  resize: none;
  font-size: 14px;
  line-height: 1.6;
}

/* Priority Option Item */
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

/* Sticky Sidebar */
.sticky-side {
  position: sticky;
  top: 24px;
}

/* Upload Area - Clean Look */
.clean-dragger {
  background-color: #fafafa !important;
  border-radius: 8px !important;
}

.clean-dragger:hover {
  background-color: #fff1f0 !important;
}

.dragger-content {
  padding: 20px 0;
}

.icon-wrap {
  font-size: 32px;
  color: #ff4d4f;
  margin-bottom: 8px;
}

.text-primary {
  color: #595959;
  font-weight: 500;
  margin-bottom: 4px;
}

.text-secondary {
  color: #bfbfbf;
  font-size: 12px;
}

/* Image Grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.img-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
  transition: transform 0.3s;
}

.img-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 18px;
}

.img-item:hover .img-overlay {
  opacity: 1;
}

/* Actions */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: #ff4d4f;
  border-color: #ff4d4f;
  box-shadow: 0 4px 10px rgba(255, 77, 79, 0.2);
}

.submit-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

.reset-btn {
  color: #8c8c8c;
}

.reset-btn:hover {
  color: #ff4d4f;
}

.reporter-info {
  text-align: center;
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

/* --- NEW: Assign Dev Box Styles --- */
.assign-dev-box {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.assign-dev-box:hover {
  border-color: #d1d5db;
}

.assign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assign-header .label {
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.assign-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e5e7eb;
}

.dev-option-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dev-name {
  font-weight: 500;
  color: #1f2937;
}

.helper-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

/* Animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Mobile Adjustments */
@media (max-width: 992px) {
  .page-content {
    padding: 16px;
  }
}
</style>