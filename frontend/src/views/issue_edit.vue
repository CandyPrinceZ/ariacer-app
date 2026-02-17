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
                            <span class="title-text">แก้ไข: {{ originalName || 'Loading...' }}</span>
                        </h2>
                        <p class="page-subtitle">แก้ไขรายละเอียดข้อมูล #{{ originalId }}</p>
                    </div>
                </div>
                <div class="header-actions">
                    <a-button @click="handleCancel" :disabled="submitting" class="btn-cancel"
                        style="margin-right: 8px;">
                        ยกเลิก
                    </a-button>
                    <a-button type="primary" :loading="submitting" @click="onSubmit" class="btn-save">
                        <template #icon>
                            <SaveOutlined />
                        </template> บันทึก
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
                                <a-input v-model:value="form.title" placeholder="ระบุหัวข้อปัญหา" size="large"
                                    class="modern-input" />
                            </a-form-item>

                            <a-form-item label="เซิร์ฟเวอร์ (Server)" required class="form-item-mb">
                                <a-select v-model:value="form.server" placeholder="ระบุ Server ที่พบปัญหา"
                                    :options="formattedServerOptions" :loading="dropdownLoading" size="large"
                                    class="modern-select" allow-clear />
                            </a-form-item>

                            <a-row :gutter="16">
                                <a-col :xs="24" :sm="12">
                                    <a-form-item label="ประเภท (Category)" required class="mb-4">
                                        <a-select v-model:value="form.bugType" placeholder="เลือกประเภท"
                                            :options="options.types" :loading="dropdownLoading" size="large"
                                            class="modern-select" />
                                    </a-form-item>
                                </a-col>

                                <a-col :xs="24" :sm="12">
                                    <a-form-item label="ความเร่งด่วน (Priority)" required class="mb-4">
                                        <a-select v-model:value="form.priority" placeholder="เลือกระดับ" size="large"
                                            :style="selectStyle" class="custom-select"
                                            :class="{ 'has-priority': form.priority }">
                                            <a-select-option v-for="opt in urgencyOptions" :key="opt.value"
                                                :value="opt.value">
                                                <div class="priority-option">
                                                    <span class="dot" :style="{ background: opt.color }"></span>
                                                    <span :style="{ fontWeight: 500, color: opt.color }">{{ opt.label
                                                    }}</span>
                                                </div>
                                            </a-select-option>
                                        </a-select>
                                    </a-form-item>
                                </a-col>
                            </a-row>

                            <a-row :gutter="[12, 12]" v-if="isHighPriority">
                                <a-col :xs="24" :sm="24"> <a-form-item label="กำหนดวันและเวลาสิ้นสุด (Deadline)"
                                        required class="form-item-mb">
                                        <a-date-picker v-model:value="form.deadline" style="width: 100%"
                                            placeholder="เลือกวันและเวลา" :show-time="{ format: 'HH:mm' }"
                                            format="DD/MM/YYYY HH:mm" size="large" />
                                    </a-form-item>
                                </a-col>
                            </a-row>

                            <a-form-item label="รายละเอียด (Detail)" class="mb-4">
                                <a-textarea v-model:value="form.description" placeholder="ระบุรายละเอียด..." :rows="8"
                                    show-count :maxlength="2000" class="modern-textarea" />
                            </a-form-item>

                            <div class="assign-dev-box">
                                <div class="assign-header">
                                    <span class="label">
                                        <UserAddOutlined /> กำหนดผู้พัฒนา (Assign Developer)
                                    </span>
                                    <a-switch v-model:checked="form.isCustomDeveloper" size="small"
                                        :disabled="issue?.status?.code !== 'reported'" />
                                </div>

                                <div v-if="form.isCustomDeveloper" class="assign-body">
                                    <a-select v-model:value="form.developer" show-search
                                        placeholder="ค้นหาชื่อผู้พัฒนา..." option-filter-prop="label"
                                        :loading="dropdownLoading" size="large" class="modern-select"
                                        style="width: 100%;" :disabled="issue?.status?.code !== 'reported'">
                                        <a-select-option v-for="dev in options.developers" :key="dev._id"
                                            :value="dev._id" :label="dev.user_name">
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
                                </div>
                            </div>

                        </a-card>
                    </a-col>

                    <a-col :xs="24" :lg="7" :xl="6">
                        <div class="sticky-side">

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
                                    <a-upload-dragger v-model:fileList="fileList" :before-upload="beforeUpload"
                                        :multiple="true" accept="image/*" :show-upload-list="false"
                                        @change="handleUploadChange" class="mini-dragger">
                                        <div class="dragger-content">
                                            <p class="icon-wrap">
                                                <CloudUploadOutlined />
                                            </p>
                                            <p class="text-hint">คลิกหรือลากไฟล์</p>
                                        </div>
                                    </a-upload-dragger>

                                    <div class="image-grid" v-if="fileList.length">
                                        <div class="img-item new" v-for="file in fileList" :key="file.uid">
                                            <img :src="file.thumbUrl || file.url"
                                                @click="openPreview(file.thumbUrl || file.url)" />
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
                                        <a-avatar size="small" :src="originalReporter?.avatar" :style="{
                                            backgroundColor: !originalReporter?.avatar ? stringToColor(originalReporter?.user_name) : 'transparent'
                                        }">
                                            <span v-if="!originalReporter?.avatar">{{
                                                originalReporter?.user_name?.[0]?.toUpperCase()
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
    DeleteOutlined, SaveOutlined, PictureOutlined, UserAddOutlined
} from '@ant-design/icons-vue';
import { message, Upload, notification } from 'ant-design-vue';

export default {
    name: "IssueEdit",
    components: {
        EditOutlined, FormOutlined, CloudUploadOutlined,
        DeleteOutlined, SaveOutlined, PictureOutlined, UserAddOutlined
    },
    data() {
        return {
            issueId: null,
            loading: false,
            submitting: false,
            dropdownLoading: false,

            options: { types: [], urgencies: [], developers: [] }, // เพิ่ม developers

            // Original Data
            originalId: '',
            originalName: '',
            originalReporter: null,
            createdAt: null,
            existingImages: [],
            serversOptions: [],

            // Upload
            fileList: [],
            maxFiles: 5,
            preview: { open: false, src: '' },

            form: {
                title: '',
                priority: undefined,
                bugType: undefined,
                description: '',
                deadline: null,
                isCustomDeveloper: false, 
                developer: undefined,
                server: undefined
            },
        };
    },
    computed: {
        formattedServerOptions() {
            return (this.serversOptions || []).map((s) => ({
                value: s._id,
                label: `${s.name} (${s.url})`
            }));
        },
        urgencyOptions() {
            return (this.options.urgencies || []).map((u) => ({
                value: u.value,
                label: u.label,
                color: u.color,
                code: u.code
            }));
        },
        isHighPriority() {
            if (!this.form.priority) return false;
            if (!this.urgencyOptions || this.urgencyOptions.length === 0) return false;

            const selectedPriority = this.urgencyOptions.find(p => p.value === this.form.priority);
            const code = selectedPriority?.code || '';
            return ['critical', 'high'].includes(code.toLowerCase());
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
        this.issueId = this.$route.params.id;
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
        getColorWithOpacity(color, opacity) {
            const colorMap = {
                'red': '255, 77, 79', 'orange': '250, 140, 22', 'green': '82, 196, 26',
                'grey': '150, 150, 150', '#87d068': '135, 208, 104'
            };
            const rgb = colorMap[color] || '200, 200, 200';
            return `rgba(${rgb}, ${opacity})`;
        },

        // --- Fetch Data ---
        async fetchDropdowns() {
            this.dropdownLoading = true;
            try {
                const Token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${Token}` } };
                const [resType, resUrgency, resUserDev, resServer] = await Promise.all([
                    axios.get(import.meta.env.VITE_API_URL + '/items/issue-types', config),
                    axios.get(import.meta.env.VITE_API_URL + '/items/urgencies', config),
                    axios.get(import.meta.env.VITE_API_URL + '/auth/users-list/dev', config),
                    axios.get(import.meta.env.VITE_API_URL + '/servers/get-all-server', config)
                ]);

                this.options.types = this.mapOptions(resType.data);
                const urgList = Array.isArray(resUrgency.data) ? resUrgency.data : (resUrgency.data?.data || []);
                this.options.urgencies = urgList.map(item => ({
                    value: item._id, label: item.name, color: item.color, code: item.code
                }));
                this.serversOptions = resServer.data

                // Developers
                this.options.developers = Array.isArray(resUserDev.data) ? resUserDev.data : (resUserDev.data?.data || []);

            } catch (e) { console.error(e); } finally { this.dropdownLoading = false; }
        },
        mapOptions(data) {
            const list = Array.isArray(data) ? data : (data?.data || []);
            return list.map(item => ({ value: item._id, label: item.name }));
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

                // Validation: ให้แก้ไขได้เฉพาะเจ้าของเท่านั้น
                if (data.reporter?._id !== userId) {
                    message.error('คุณไม่มีสิทธิ์แก้ไขงานนี้');
                    this.$router.go(-1);
                    return;
                }

                this.originalServer = data.server?._id;
                this.originalName = data.name;
                this.originalId = data.id;
                this.createdAt = data.createdAt;
                this.form.title = data.name;
                this.form.description = data.detail;
                this.form.bugType = data.type?._id;
                this.form.priority = data.urgency?._id;
                this.form.deadline = data.deadline ? dayjs(data.deadline) : null;
                this.form.server = data.server?._id;

                if (data.assignee) {
                    this.form.isCustomDeveloper = true;
                    this.form.developer = data.assignee._id;
                } else {
                    this.form.isCustomDeveloper = false;
                    this.form.developer = undefined;
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
        removeExistingImage(index) { this.existingImages.splice(index, 1); },

        // --- Submit Logic ---
        async getDynamicWebhook() {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/config/discord-webhook-images', {
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
        async onSubmit() {
            if (!this.form.title) return message.warning('ระบุหัวข้อปัญหา');
            if (!this.form.priority) return message.warning('ระบุความเร่งด่วน');
            if (!this.form.bugType) return message.warning('ระบุประเภท');
            if (this.isHighPriority && !this.form.deadline) return message.warning('ระบุ DeadLine สำหรับงานเร่งด่วน');
            if (!this.form.server) return message.warning('ระบุ Server');

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
                    server: this.form.server,
                    detail: this.form.description || '-',
                    type: this.form.bugType,
                    urgency: this.form.priority,
                    deadline: this.form.deadline,
                    images: [...this.existingImages.map(img => img.url), ...newImageUrls].map(url => ({ url: url })),
                    assignee: (this.form.isCustomDeveloper && this.form.developer) ? this.form.developer : null
                };

                // ถ้าปิด switch ให้ส่ง null หรือ empty string เพื่อ clear assignee
                if (!this.form.isCustomDeveloper) {
                    payload.assignee = ""; // หรือ null ขึ้นอยู่กับ backend รับค่าแบบไหน (ปกติ null หรือ empty string)
                }

                await axios.put(import.meta.env.VITE_API_URL + `/issues/edit/${this.issueId}`, payload, config);

                notification.success({ message: 'บันทึกสำเร็จ', description: 'แก้ไขข้อมูลเรียบร้อยแล้ว', placement: 'topRight' });
                this.$router.push(`/issue/${this.issueId}`);
            } catch (e) {
                notification.error({ message: 'Error', description: e.response?.data?.message || e.message });
            } finally {
                this.submitting = false;
            }
        },
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

.form-item-mb {
    margin-bottom: 20px;
}


.custom-select.has-priority :deep(.ant-select-selector) {
    border-color: transparent !important;
    box-shadow: none !important;
}

/* 6. Image Grid */
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

/* 7. Metadata */
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

/* Sidebar Sticky */
.sticky-side {
    position: sticky;
    top: 12px;
}

/* Assign Dev Box */
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


/* ==========================================================================
   📱 Mobile Responsive Tweaks
   ========================================================================== */
@media (max-width: 768px) {

    .compact-header {
        padding: 10px 12px;
    }

    .header-content {
        flex-wrap: wrap;
        gap: 8px;
    }

    .header-left,
    .header-text {
        width: 100%;
    }

    .page-title {
        font-size: 18px;
    }

    .header-actions {
        width: 100%;
        display: flex;
        justify-content: space-between;
        gap: 8px;
    }

    .btn-save,
    .btn-cancel {
        flex: 1;
    }

    .sticky-side {
        position: static;
    }

    .image-grid {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}
</style>