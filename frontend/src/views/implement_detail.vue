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
                                <a-tag color="orange" class="status-tag">
                                    <template #icon>
                                        <ExperimentOutlined />
                                    </template>
                                    UNDER TESTING
                                </a-tag>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <a-button @click="$router.go(-1)" type="default" size="small">
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
                                    <CloseCircleOutlined />
                                </div>
                                <div class="alert-content">
                                    <h4 class="alert-title">งานถูกส่งกลับแก้ไข (Rejected History)</h4>
                                    <p class="alert-desc">"{{ issue.remarks || 'No remark provided.' }}"</p>

                                    <div v-if="issue.remarks_images?.length" class="mini-gallery">
                                        <div v-for="img in issue.remarks_images" :key="img._id"
                                            class="mini-img-wrapper">
                                            <a-image :src="img.url" class="mini-img" />
                                        </div>
                                    </div>
                                    <div v-if="issue.tester" class="alert-meta">
                                        <a-avatar size="small" :src="issue.tester.avatar" style="margin-right: 6px;">
                                            <span v-if="!issue.tester.avatar">{{
                                                issue.tester.user_name?.[0]?.toUpperCase()
                                                }}</span>
                                        </a-avatar>
                                        ตรวจสอบโดย: <strong>{{ issue.tester.user_name }}</strong>
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

                            <div class="card-section mt-4">
                                <h3 class="section-title">
                                    <PaperClipOutlined /> Attachments
                                    <span class="count-badge" v-if="issue.images">{{ issue.images?.length || 0 }}</span>
                                </h3>
                                <div class="image-grid" v-if="issue.images && issue.images.length > 0">
                                    <div v-for="img in issue.images" :key="img._id" class="img-wrapper">
                                        <a-image :src="img.url" class="img-preview" />
                                    </div>
                                </div>
                                <div v-else class="empty-state small">
                                    <p class="text-muted">No attachments</p>
                                </div>
                            </div>

                            <div class="card-section mt-4">
                                <h3 class="section-title">
                                    <CodeOutlined /> Note From Developer
                                </h3>
                                <div class="desc-box note">
                                    {{ issue.note || 'No note provided.' }}
                                </div>
                            </div>

                            <a-divider style="margin: 24px 0;" />

                            <div class="card-section">
                                <h3 class="section-title highlight">
                                    <AuditOutlined /> Test Result & Feedback
                                </h3>

                                <a-form layout="vertical" class="testing-form">
                                    <a-form-item label="Comment / Bug Report (จำเป็นหากเลือก Fail)">
                                        <a-textarea v-model:value="qcComment" :rows="5"
                                            placeholder="ระบุจุดที่พบปัญหา หรือสิ่งที่ต้องแก้ไข..."
                                            class="modern-textarea" />
                                    </a-form-item>

                                    <a-form-item label="Evidence Image (หลักฐาน)">
                                        <div class="upload-wrapper">
                                            <a-upload list-type="picture-card" :file-list="fileList"
                                                @preview="handlePreview" @change="handleChange"
                                                accept="image/png, image/jpeg, image/jpg" :before-upload="beforeUpload"
                                                class="modern-upload">
                                                <div v-if="fileList.length < 5">
                                                    <CloudUploadOutlined class="upload-icon" />
                                                    <div class="upload-text">Upload</div>
                                                </div>
                                            </a-upload>
                                        </div>
                                        <a-modal :visible="previewVisible" :title="previewTitle" :footer="null"
                                            @cancel="handleCancel">
                                            <img alt="example" style="width: 100%" :src="previewImage" />
                                        </a-modal>
                                    </a-form-item>
                                </a-form>
                            </div>

                        </a-card>
                    </a-col>

                    <a-col :xs="24" :lg="7" :xl="6">
                        <div class="sticky-sidebar">

                            <a-card :bordered="false" class="main-card side-card mb-3">
                                <h4 class="side-title">Testing Actions</h4>
                                <div class="buttons-grid">
                                    <a-popconfirm title="Confirm System Pass?" ok-text="Yes, Pass"
                                        cancel-text="Check again" @confirm="submitResult('pass')">
                                        <button class="btn-main pass" :disabled="loading">
                                            <CheckCircleFilled /> PASS
                                        </button>
                                    </a-popconfirm>

                                    <a-popconfirm title="Reject & Return to Dev?" ok-text="Yes, Reject" cancel-text="No"
                                        ok-type="danger" @confirm="submitResult('fail')">
                                        <button class="btn-main fail" :disabled="loading">
                                            <CloseCircleFilled /> FAIL
                                        </button>
                                    </a-popconfirm>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="main-card side-card mb-3">
                                <h4 class="side-title">Responsible Developer</h4>
                                <div class="dev-profile">
                                    <a-avatar :size="40" :src="issue.assignee?.avatar"
                                        :style="{ backgroundColor: !issue.assignee?.avatar ? stringToColor(issue.assignee?.user_name) : 'transparent' }">
                                        <span v-if="!issue.assignee?.avatar">{{ (issue.assignee?.user_name || 'U')[0]
                                            }}</span>
                                    </a-avatar>
                                    <div class="dev-details">
                                        <h4 class="dev-name text-ellipsis">{{ issue.assignee?.user_name || 'Unassigned'
                                            }}</h4>
                                        <span class="dev-role">Developer</span>
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
                                        <a-tag :color="issue.urgency?.color" class="tag-pill">{{ issue.urgency?.name
                                            }}</a-tag>
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
import axios from 'axios';
import {
    ArrowLeftOutlined, FileTextOutlined, CodeOutlined, AuditOutlined,
    CloudUploadOutlined, ExperimentOutlined, CheckCircleFilled, CloseCircleFilled,
    PaperClipOutlined, CloseCircleOutlined
} from '@ant-design/icons-vue';
import { message, Upload } from 'ant-design-vue';

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

export default {
    name: 'ImplementDetail',
    components: {
        ArrowLeftOutlined, FileTextOutlined, CodeOutlined, AuditOutlined,
        CloudUploadOutlined, ExperimentOutlined, PaperClipOutlined,
        CheckCircleFilled, CloseCircleFilled, CloseCircleOutlined
    },
    data() {
        return {
            loading: false,
            issue: {},
            qcComment: '',
            statusOptions: [],
            authProfile: null,
            fileList: [],
            previewVisible: false,
            previewImage: '',
            previewTitle: '',
        };
    },
    async mounted() {
        this.loading = true;
        try {
            await this.getAuthProfile();
            await this.fetchIssue();
            await this.fetchStatuses();
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        handleCancel() { this.previewVisible = false; },
        async handlePreview(file) {
            if (!file.url && !file.preview) {
                file.preview = await getBase64(file.originFileObj);
            }
            this.previewImage = file.url || file.preview;
            this.previewVisible = true;
            this.previewTitle = file.name || file.url.substring(file.url.lastIndexOf('/') + 1);
        },
        handleChange({ fileList }) { this.fileList = fileList; },
        beforeUpload(file) {
            const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
            if (!isImage) {
                message.error('อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น!');
                return Upload.LIST_IGNORE;
            }
            return false;
        },
        stringToColor(str) {
            if (!str) return '#3b82f6';
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + '00000'.substring(0, 6 - c.length) + c;
        },
        async getAuthProfile() {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.authProfile = res.data;
            } catch (e) { console.error(e); }
        },
        async fetchIssue() {
            const id = this.$route.params.id;
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(import.meta.env.VITE_API_URL + `/issues/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.issue = res.data;
            } catch (e) { console.error(e); }
        },
        async fetchStatuses() {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(import.meta.env.VITE_API_URL + '/items/statuses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.statusOptions = res.data;
            } catch (e) { console.error(e); }
        },
        async getDynamicWebhook() {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/config/discord-webhook', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                return res.data.url;
            } catch (error) {
                console.error(error);
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
        async submitResult(result) {
            const token = localStorage.getItem('token');
            let targetStatus = null;
            let msg = '';

            if (result === 'pass') {
                targetStatus = this.statusOptions.find(s => s.code === 'success');
                msg = 'Testing Passed! Issue Closed.';
            } else {
                targetStatus = this.statusOptions.find(s => s.code === 'rejected');
                if (!this.qcComment) {
                    message.error('กรุณาระบุเหตุผลที่ไม่ผ่านในช่อง Comment');
                    return;
                }
                msg = 'Testing Failed. Returned to Developer.';
            }

            if (!targetStatus) {
                message.error('Target Status not found');
                return;
            }

            this.loading = true;
            try {
                let imageUrls = [];
                if (this.fileList.length > 0) {
                    message.loading({ content: 'Uploading images...', key: 'up' });
                    const currentWebhookUrl = await this.getDynamicWebhook();
                    imageUrls = await Promise.all(
                        this.fileList.map(f => this.uploadImageToDiscord(f.originFileObj, currentWebhookUrl))
                    );
                    message.success({ content: 'Images uploaded!', key: 'up' });
                }

                const payload = {
                    status: targetStatus._id,
                    remarks: this.qcComment || '-',
                    remarks_images: imageUrls.map(url => ({ url: url })),
                };

                if (targetStatus.code === 'rejected') {
                    payload.assignee = null;
                }
                if (this.authProfile && this.authProfile._id) {
                    payload.tester = this.authProfile._id;
                }

                await axios.put(import.meta.env.VITE_API_URL + `/issues/${this.issue._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                message.success(msg);
                this.$router.push('/implement');

            } catch (e) {
                console.error(e);
                message.error('Error: ' + (e.message || 'Unknown error'));
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped>
/* 1. Global & Layout */
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

.page-container {
    width: 100%;
    padding-bottom: 40px;
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
}

.title-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.id-badge {
    background: #f5f5f5;
    color: #888;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid #e8e8e8;
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

/* 3. Cards */
.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
}

.side-card {
    margin-bottom: 12px;
}

.mb-3 {
    margin-bottom: 12px;
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

.section-title.highlight {
    color: #0f172a;
    font-size: 16px;
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
    color: #475569;
    line-height: 1.6;
    white-space: pre-wrap;
    font-size: 14px;
}

.desc-box.note {
    background: #fffbeb;
    border-color: #fef3c7;
    color: #92400e;
}

/* 5. Images */
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

.empty-state.small {
    padding: 16px;
    text-align: center;
    background: #f8fafc;
    border-radius: 6px;
    color: #94a3b8;
    border: 1px dashed #e2e8f0;
    font-size: 13px;
}

/* 6. Form & Inputs */
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

.modern-upload :deep(.ant-upload.ant-upload-select-picture-card) {
    border-radius: 8px;
    border: 1px dashed #d9d9d9;
    background: #fafafa;
    transition: all 0.3s;
}

.modern-upload :deep(.ant-upload.ant-upload-select-picture-card:hover) {
    border-color: #3b82f6;
    background: #f0f7ff;
}

.upload-icon {
    font-size: 20px;
    color: #94a3b8;
    margin-bottom: 4px;
}

.upload-text {
    color: #64748b;
    font-weight: 500;
    font-size: 12px;
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

.buttons-grid {
    display: grid;
    gap: 12px;
}

.btn-main {
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
    width: 100%;
    color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-main:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-main.pass {
    background: #22c55e;
}

.btn-main.pass:hover:not(:disabled) {
    background: #16a34a;
    transform: translateY(-1px);
}

.btn-main.fail {
    background: #ef4444;
}

.btn-main.fail:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-1px);
}

/* Dev Profile */
.dev-profile {
    display: flex;
    align-items: center;
    gap: 12px;
}

.dev-details {
    display: flex;
    flex-direction: column;
}

.dev-name {
    margin: 0;
    font-weight: 600;
    color: #0f172a;
    font-size: 14px;
}

.dev-role {
    font-size: 12px;
    color: #64748b;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
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

/* Alert */
.custom-alert {
    padding: 12px 16px;
    border-radius: 6px;
    display: flex;
    gap: 12px;
}

.custom-alert.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
}

.alert-icon {
    font-size: 20px;
    color: #ef4444;
}

.alert-title {
    margin: 0 0 4px;
    font-weight: 700;
    color: #991b1b;
    font-size: 14px;
}

.alert-desc {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.5;
}

.alert-meta {
    font-size: 12px;
    color: #ef4444;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.mini-gallery {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 6px;
}

.mini-img-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.mini-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.mt-4 {
    margin-top: 16px;
}

.mb-3 {
    margin-bottom: 12px;
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
</style>