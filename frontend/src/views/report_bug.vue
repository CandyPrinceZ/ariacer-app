<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div class="page-header compact-header">
      <div class="header-content">
        <div class="header-text">
          <h2 class="page-title">
            <span class="icon-box">
              <BugOutlined />
            </span> Report Issues
          </h2>
          <p class="page-subtitle">แจ้งปัญหาการใช้งานเพื่อให้ทีมพัฒนาตรวจสอบ</p>
        </div>

        <div class="header-actions">
          <a-button type="text" size="small" @click="onReset">
            <ReloadOutlined /> ล้างข้อมูล
          </a-button>
        </div>
      </div>
    </div>

    <div style="padding: 12px; width: 100%;">
      <a-form layout="vertical" :model="form">
        <a-row :gutter="[12, 12]">

          <a-col :xs="24" :lg="17" :xl="18">
            <a-card :bordered="false" class="main-card">
              <template #title>
                <span class="card-header-text">
                  <FormOutlined /> รายละเอียดปัญหา
                </span>
              </template>

              <a-form-item label="หัวข้อปัญหา (Subject)" required style="margin-bottom: 16px;">
                <a-input v-model:value="form.title" placeholder="สรุปปัญหาใน 1 ประโยค" size="large"
                  class="modern-input" />
              </a-form-item>

              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="ประเภท (Category)" required style="margin-bottom: 16px;">
                    <a-select v-model:value="form.bugType" placeholder="เลือกประเภท" :options="issueTypeOptions"
                      :loading="dropdownLoading" size="large" class="modern-select" />
                  </a-form-item>
                </a-col>

                <a-col :span="12">
                  <a-form-item label="ความเร่งด่วน (Priority)" required style="margin-bottom: 16px;">
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

              <a-form-item label="คำอธิบายเพิ่มเติม (Description)" style="margin-bottom: 16px;">
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
                      option-filter-prop="label" :loading="dropdownLoading" size="large" class="modern-select"
                      style="width: 100%;">
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

          <a-col :xs="24" :lg="7" :xl="6">
            <div class="sticky-side">

              <a-card :bordered="false" class="main-card side-card">
                <template #title>
                  <span class="card-header-text">
                    <CameraOutlined /> หลักฐาน (Screenshot)
                  </span>
                </template>

                <div class="upload-wrapper">
                  <a-upload-dragger v-model:fileList="fileList" :before-upload="beforeUpload" :multiple="true"
                    accept="image/*" :show-upload-list="false" @change="handleUploadChange">
                    <div class="dragger-content">
                      <p class="icon-wrap">
                        <CloudUploadOutlined />
                      </p>
                      <p class="text-primary">คลิก/ลากรูปภาพ</p>
                      <p class="text-secondary">JPG, PNG (Max 5)</p>
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
              </a-card>

              <a-card :bordered="false" class="main-card side-card" bodyStyle="padding: 16px;">
                <div class="reporter-info" v-if="Authprofile">
                  <a-avatar size="small" style="background-color: #87d068; margin-right: 8px;">
                    <UserOutlined />
                  </a-avatar>
                  <div class="reporter-text">
                    <span style="font-size: 11px; color: #888;">ผู้แจ้ง</span>
                    <strong style="display: block; line-height: 1;">{{ Authprofile.user_name || 'Unknown' }}</strong>
                  </div>
                </div>

                <a-button type="primary" block size="large" class="submit-btn" :loading="submitting" @click="onSubmit">
                  <SendOutlined /> ส่งแจ้งปัญหา
                </a-button>
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
  DeleteOutlined, SendOutlined, ReloadOutlined, UserAddOutlined, UserOutlined
} from '@ant-design/icons-vue';
import { message, Upload } from 'ant-design-vue';

export default {
  name: "ReportBugFull",
  components: {
    BugOutlined, FormOutlined, CameraOutlined, CloudUploadOutlined,
    DeleteOutlined, SendOutlined, ReloadOutlined, UserAddOutlined, UserOutlined
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
        'red': '255, 77, 79', 'orange': '250, 140, 22', 'green': '82, 196, 26',
        'grey': '150, 150, 150', '#87d068': '135, 208, 104'
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
        message.error('เฉพาะไฟล์รูปภาพ (JPG/PNG)');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    handleUploadChange(info) {
      let list = [...info.fileList];
      if (list.length > this.maxFiles) {
        message.warning(`สูงสุด ${this.maxFiles} รูป`);
        list = list.slice(0, this.maxFiles);
      }
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
        const res = await axios.get(import.meta.env.VITE_API_URL + '/config/discord-webhook', {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.url;
      } catch (error) {
        console.error('Error fetching webhook URL:', error);
        throw new Error("Unable to fetch webhook URL");
      }
    },
    async uploadImageToDiscord(fileObj, webhookUrl) {
      const formData = new FormData();
      formData.append('file', fileObj);
      const response = await axios.post(webhookUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.attachments[0].url;
    },
    async onSubmit() {
      if (!this.form.title) return message.warning('ระบุหัวข้อปัญหา');
      if (!this.form.priority) return message.warning('ระบุความเร่งด่วน');
      if (!this.form.bugType) return message.warning('ระบุประเภท');

      this.submitting = true;
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        let imageUrls = [];

        if (this.fileList.length > 0) {
          message.loading({ content: 'Uploading...', key: 'up', duration: 0 });
          const currentWebhookUrl = await this.getDynamicWebhook();
          imageUrls = await Promise.all(
            this.fileList.map(f => this.uploadImageToDiscord(f.originFileObj, currentWebhookUrl))
          );
          message.success({ content: 'Uploaded', key: 'up', duration: 2 });
        }

        const payload = {
          name: this.form.title,
          detail: this.form.description || '-',
          type: this.form.bugType,
          status: "65b000000000000000000001",
          urgency: this.form.priority,
          reporter: this.Authprofile._id,
          images: imageUrls
        };

        if (this.form.isCustomDeveloper && this.form.developer) {
          payload.assignee = this.form.developer;
        }

        await axios.post(import.meta.env.VITE_API_URL + '/issues', payload, config);
        message.success('ส่งแจ้งปัญหาเรียบร้อย!');
        this.onReset();
      } catch (e) {
        console.error(e);
        message.error('Failed: ' + (e.response?.data?.message || e.message));
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
/* 1. COMPACT HEADER */
.compact-header {
  background: #fff;
  padding: 12px 16px;
  /* ลด Padding */
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
  background: #fff1f0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
}

/* 2. MAIN CARD & LAYOUT */
.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  height: 100%;
  /* เอา Margin ออก เพราะ Grid Gutter จัดการให้แล้ว */
}

.side-card {
  margin-bottom: 12px;
}

/* เว้นระยะห่างเฉพาะการ์ดด้านขวาที่เรียงกัน */

.card-header-text {
  font-weight: 600;
  color: #1f1f1f;
  font-size: 15px;
}

/* 3. INPUTS & SELECTS */
.modern-input,
.modern-select,
.modern-textarea {
  border-radius: 6px;
}

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

.custom-select.has-priority :deep(.ant-select-selector) {
  border-color: transparent !important;
  box-shadow: none !important;
}

.dragger-content {
  padding: 12px 0;
}

.icon-wrap {
  font-size: 24px;
  color: #ff4d4f;
  margin-bottom: 4px;
}

.text-primary {
  color: #595959;
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 0;
}

.text-secondary {
  color: #bfbfbf;
  font-size: 11px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
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

/* 5. ASSIGN BOX */
.assign-dev-box {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  margin-top: 8px;
}

.assign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assign-header .label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.assign-body {
  margin-top: 12px;
  padding-top: 12px;
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
  font-size: 13px;
}

.helper-text {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #9ca3af;
}

/* 6. SUBMIT BUTTON & INFO */
.reporter-info {
  display: flex;
  align-items: center;
  background: #f9f9f9;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
}

.submit-btn {
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  background: #ff4d4f;
  border-color: #ff4d4f;
  box-shadow: 0 4px 10px rgba(255, 77, 79, 0.2);
}

.submit-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

/* Sticky & Animation */
.sticky-side {
  position: sticky;
  top: 12px;
}

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
</style>