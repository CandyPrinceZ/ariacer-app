<template>
  <a-layout style="min-height: 100vh; background: #f5f7fa;">

    <div class="page-header compact-header">
      <div class="header-content">
        <div class="header-text">
          <h2 class="page-title">
            <span class="icon-box">
              <BugOutlined />
            </span>
            <span class="title-text">Report Issues</span>
          </h2>
          <p class="page-subtitle">แจ้งปัญหาการใช้งานเพื่อให้ทีมพัฒนาตรวจสอบ</p>
        </div>

        <div class="header-actions">
          <a-button type="text" size="small" @click="onReset" class="btn-reset">
            <ReloadOutlined /> <span class="reset-text">ล้างข้อมูล</span>
          </a-button>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <a-form layout="vertical" :model="form">
        <a-row :gutter="[16, 16]">

          <a-col :xs="24" :lg="16" :xl="18">
            <a-card :bordered="false" class="main-card">
              <template #title>
                <span class="card-header-text">
                  <FormOutlined /> รายละเอียดปัญหา
                </span>
              </template>

              <a-form-item label="หัวข้อปัญหา (Subject)" required class="form-item-mb">
                <a-input v-model:value="form.title" placeholder="สรุปปัญหาใน 1 ประโยค" size="large"
                  class="modern-input" />
              </a-form-item>

              <a-form-item label="เซิร์ฟเวอร์ (Server)" required class="form-item-mb">
                <a-select v-model:value="form.server" placeholder="ระบุ Server ที่พบปัญหา"
                  :options="formattedServerOptions" :loading="dropdownLoading" size="large" class="modern-select"
                  allow-clear />
              </a-form-item>

              <a-row :gutter="[12, 12]">
                <a-col :xs="24" :sm="12">
                  <a-form-item label="ประเภท (Category)" required class="form-item-mb">
                    <a-select v-model:value="form.bugType" placeholder="เลือกประเภท" :options="issueTypeOptions"
                      :loading="dropdownLoading" size="large" class="modern-select" />
                  </a-form-item>
                </a-col>

                <a-col :xs="24" :sm="12">
                  <a-form-item label="ความเร่งด่วน (Priority)" required class="form-item-mb">
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

              <a-row :gutter="[12, 12]" v-if="isHighPriority">
                <a-col :xs="24" :sm="24"> <a-form-item label="กำหนดวันและเวลาสิ้นสุด (Deadline)" required
                    class="form-item-mb">
                    <a-date-picker v-model:value="form.deadline" style="width: 100%" placeholder="เลือกวันและเวลา"
                      :show-time="{ format: 'HH:mm' }" format="DD/MM/YYYY HH:mm" size="large" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item label="คำอธิบายเพิ่มเติม (Description)" class="form-item-mb">
                <a-textarea v-model:value="form.description"
                  placeholder="ระบุรายละเอียด, ขั้นตอนการเกิดปัญหา (Steps to reproduce), หรือสิ่งที่คาดหวัง" :rows="8"
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
                          <a-avatar size="small" :src="dev.avatar" :style="{
                            backgroundColor: dev.avatar ? 'transparent' : stringToColor(dev.user_name),
                            fontSize: '12px',
                            border: dev.avatar ? '1px solid #f0f0f0' : 'none'
                          }">
                            <span v-if="!dev.avatar">
                              {{ dev.user_name?.[0]?.toUpperCase() }}
                            </span>
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

          <a-col :xs="24" :lg="8" :xl="6">
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

              <a-card :bordered="false" class="main-card side-card" :bodyStyle="{ padding: '20px' }">
                <div class="reporter-info" v-if="Authprofile">
                  <a-avatar size="large" :src="Authprofile.avatar" :style="{
                    backgroundColor: Authprofile.avatar ? 'transparent' : stringToColor(Authprofile.user_name),
                    border: Authprofile.avatar ? '1px solid #f0f0f0' : 'none',
                    flexShrink: 0
                  }">
                    <span v-if="!Authprofile.avatar && Authprofile.user_name">
                      {{ Authprofile.user_name[0]?.toUpperCase() }}
                    </span>
                    <UserOutlined v-else-if="!Authprofile.avatar" />
                  </a-avatar>

                  <div class="reporter-detail">
                    <span class="label">ผู้แจ้ง (Reporter)</span>
                    <span class="name">
                      {{ Authprofile.user_name || 'ไม่ระบุตัวตน' }}
                    </span>
                  </div>
                </div>

                <a-divider style="margin: 0 0 16px 0;" />

                <a-button type="primary" block size="large" class="submit-btn" :loading="submitting" @click="onSubmit">
                  <SendOutlined /> <span class="submit-text">ส่งแจ้งปัญหา</span>
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
// (Script ส่วนนี้เหมือนเดิม ไม่ต้องแก้ครับ ใช้ Logic เดิมได้เลย)
import axios from 'axios';
import {
  BugOutlined, FormOutlined, CameraOutlined, CloudUploadOutlined,
  DeleteOutlined, SendOutlined, ReloadOutlined, UserAddOutlined, UserOutlined
} from '@ant-design/icons-vue';
import { message, Upload, notification } from 'ant-design-vue';

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
      server: [],
      serversOptions: [],
      form: {
        title: '',
        priority: undefined,
        bugType: undefined,
        description: '',
        isCustomDeveloper: false,
        developer: undefined,
        deadline: null,
        server: undefined
      },
    };
  },
  computed: {
    formattedServerOptions() {
      return (this.serversOptions || []).map((s) => ({
        value: s._id,
        label: `${s.name}`
      }));
    },
    isHighPriority() {
      if (!this.form.priority) return false;

      if (!this.urgencyOptions || this.urgencyOptions.length === 0) return false;

      const selectedPriority = this.urgencyOptions.find(p => p.value === this.form.priority);

      const code = selectedPriority?.code || '';
      return ['critical', 'high'].includes(code.toLowerCase());
    },
    issueTypeOptions() {
      return (this.issues || []).map((it) => ({
        value: it._id, label: it.name,
      }));
    },
    urgencyOptions() {
      return (this.urgencies || []).map((u) => ({
        value: u._id, label: u.name, color: u.color, code: u.code
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
        const [resType, resUrgency, resUserdev, resServer] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/items/issue-types', config),
          axios.get(import.meta.env.VITE_API_URL + '/items/urgencies', config),
          axios.get(import.meta.env.VITE_API_URL + '/auth/users-list/dev', config),
          axios.get(import.meta.env.VITE_API_URL + '/servers/get-all-server', config)
        ]);
        this.issues = Array.isArray(resType.data) ? resType.data : (resType.data?.data || []);
        this.urgencies = Array.isArray(resUrgency.data) ? resUrgency.data : (resUrgency.data?.data || []);
        this.developers = Array.isArray(resUserdev.data) ? resUserdev.data : (resUserdev.data?.data || []);
        this.serversOptions = Array.isArray(resServer.data) ? resServer.data : (resServer.data?.data || []);
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
    async uploadImageToServer(fileObj) {
      try {
        const formData = new FormData();
        formData.append("file", fileObj);
        const token = localStorage.getItem("token");

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/config/upload-image`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data;
        // คืนค่าเฉพาะตัวหนังสือ URL ออกไป
        return (data && typeof data === 'object') ? data.url : data;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },

    async onSubmit() {
      if (!this.form.title) return message.warning('ระบุหัวข้อปัญหา');
      if (!this.form.priority) return message.warning('ระบุความเร่งด่วน');
      if (!this.form.bugType) return message.warning('ระบุประเภท');
      if (!this.form.server) return message.warning('ระบุ Server');
      if (this.isHighPriority && !this.form.deadline) return message.warning('ระบุ DeadLine');

      this.submitting = true;

      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        let imagesArray = []; 

        if (this.fileList && this.fileList.length > 0) {
          message.loading({ content: 'Uploading images to Cloud...', key: 'up', duration: 0 });

          const uploadResults = await Promise.all(
            this.fileList.map(f => this.uploadImageToServer(f.originFileObj))
          );
          imagesArray = uploadResults.map(urlStr => String(urlStr));

          message.success({ content: 'Images Uploaded!', key: 'up', duration: 2 });
        }

        const payload = {
          name: this.form.title,
          detail: this.form.description || '-',
          type: this.form.bugType,
          status: "65b000000000000000000001",
          urgency: this.form.priority,
          reporter: this.Authprofile._id,
          deadline: this.form.deadline || null,
          server: this.form.server,
          images: imagesArray
        };

        if (this.form.isCustomDeveloper && this.form.developer) {
          payload.assignee = this.form.developer;
        }

        await axios.post(`${import.meta.env.VITE_API_URL}/issues`, payload, config);

        notification.success({
          message: 'ส่งแจ้งปัญหาเรียบร้อย!',
          description: 'ข้อมูลถูกบันทึกเข้าระบบแล้ว',
          placement: 'topRight'
        });

        this.onReset();
      } catch (e) {
        console.error("Submit error:", e);
        notification.error({
          message: 'เกิดข้อผิดพลาด',
          description: e.response?.data?.message || e.message
        });
      } finally {
        this.submitting = false;
      }
    },
    onReset() {
      this.form = { title: '', priority: undefined, bugType: undefined, description: '', server: undefined, isCustomDeveloper: false, developer: undefined };
      this.fileList = [];
    },
  }
};
</script>

<style scoped>
.compact-header {
  background: #fff;
  padding: 12px 24px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 auto;
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
  gap: 10px;
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

.content-wrapper {
  padding: 12px;
  margin: 0 auto;
  width: 100%;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  height: 100%;
}

.side-card {
  margin-bottom: 16px;
}

.card-header-text {
  font-weight: 600;
  color: #1f1f1f;
  font-size: 15px;
}

.form-item-mb {
  margin-bottom: 20px;
}

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
  padding: 16px 0;
}

.icon-wrap {
  font-size: 28px;
  color: #ff4d4f;
  margin-bottom: 8px;
}

.text-primary {
  color: #595959;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 0;
}

.text-secondary {
  color: #bfbfbf;
  font-size: 12px;
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
  cursor: pointer;
}

.img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.img-item:hover img {
  transform: scale(1.05);
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
  transition: opacity 0.2s;
  font-size: 18px;
}

.img-item:hover .img-overlay {
  opacity: 1;
}

.assign-dev-box {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
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
  font-size: 12px;
  color: #9ca3af;
}

.reporter-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.reporter-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  overflow: hidden;
}

.reporter-detail .label {
  font-size: 12px;
  color: #8c8c8c;
}

.reporter-detail .name {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.submit-btn {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  background: #ff4d4f;
  border-color: #ff4d4f;
  box-shadow: 0 4px 10px rgba(255, 77, 79, 0.2);
  border-radius: 6px;
}

.submit-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

.sticky-side {
  top: 70px;
}

@media (max-width: 992px) {
  .sticky-side {
    position: static;
  }
}

@media (max-width: 768px) {
  .compact-header {
    padding: 12px 16px;
  }

  .content-wrapper {
    padding: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .reset-text {
    display: none;
    /* ซ่อนข้อความปุ่ม Reset เหลือแต่ Icon */
  }

  .image-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .submit-btn {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .image-grid {
    grid-template-columns: repeat(2, 1fr);
    /* 2 คอลัมน์บนมือถือเล็ก */
  }
}

/* Transitions */
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