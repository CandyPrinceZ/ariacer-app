<template>
    <a-layout style="min-height: 100vh; background: #f0f2f5;">

        <div v-if="loading" class="loading-overlay">
            <div class="loading-content">
                <a-spin size="large" />
                <p>Processing...</p>
            </div>
        </div>

        <div class="page-container">

            <div class="detail-header">
                <div class="header-inner">
                    <div class="header-left">
                        <a-button @click="$router.go(-1)" type="text" class="back-btn">
                            <template #icon>
                                <ArrowLeftOutlined />
                            </template> Back to List
                        </a-button>
                        <div class="title-wrapper">
                            <div class="id-badge">#{{ issue.id || '...' }}</div>
                            <h1 class="task-title">{{ issue.name }}</h1>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="status-badge testing">
                            <ExperimentOutlined />
                            <span>UNDER TESTING</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-content">
                <a-row :gutter="24">

                    <a-col :xs="24" :lg="17" :xl="18">
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
                                    <span class="count-badge" v-if="issue.images?.length > 0">{{ issue.images.length
                                        }}</span>
                                </h3>

                                <div class="image-grid" v-if="issue.images && issue.images.length > 0">
                                    <div v-for="img in issue.images" :key="img._id" class="img-wrapper">
                                        <a-image :src="img.url" class="img-preview" />
                                    </div>
                                </div>
                                <div v-else class="empty-state small">
                                    <p>No attachments available</p>
                                </div>
                            </div>

                            <div class="card-section mt-6">
                                <h3 class="section-title">
                                    <CodeOutlined /> Note From Developer
                                </h3>
                                <div class="desc-box note">
                                    {{ issue.note || 'No note provided.' }}
                                </div>
                            </div>

                            <div class="divider"></div>

                            <div class="card-section">
                                <h3 class="section-title highlight">
                                    <AuditOutlined /> Test Result & Feedback
                                </h3>

                                <a-form layout="vertical" class="testing-form">
                                    <a-form-item label="Comment / Bug Report (จำเป็นหากไม่ผ่าน)">
                                        <a-textarea v-model:value="qcComment" :rows="5"
                                            placeholder="ระบุจุดที่พบปัญหา หรือสิ่งที่ต้องแก้ไข..."
                                            class="custom-textarea" />
                                    </a-form-item>

                                    <a-form-item label="Evidence Image (หลักฐาน)">
                                        <div class="upload-wrapper">
                                            <a-upload list-type="picture-card" :file-list="fileList"
                                                @preview="handlePreview" @change="handleChange"
                                                accept="image/png, image/jpeg, image/jpg" :before-upload="beforeUpload"
                                                class="custom-upload">
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

                            <a-card :bordered="false" class="side-card action-card mb-4">
                                <h4 class="side-title">Testing Actions</h4>
                                <div class="action-body">
                                    <div class="buttons-grid">
                                        <a-popconfirm title="Confirm System Pass?" ok-text="Yes, Pass"
                                            cancel-text="Check again" @confirm="submitResult('pass')">
                                            <button class="btn-main pass" :disabled="loading">
                                                <CheckCircleFilled /> PASS
                                            </button>
                                        </a-popconfirm>

                                        <a-popconfirm title="Reject & Return to Dev?" ok-text="Yes, Reject"
                                            cancel-text="No" ok-type="danger" @confirm="submitResult('fail')">
                                            <button class="btn-main fail" :disabled="loading">
                                                <CloseCircleFilled /> FAIL
                                            </button>
                                        </a-popconfirm>
                                    </div>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="side-card mb-4">
                                <h4 class="side-title">Responsible Developer</h4>
                                <div class="dev-profile">
                                    <a-avatar :size="48" style="background-color: #3b82f6; font-size: 18px;">
                                        {{ (issue.assignee?.user_name || 'D')[0]?.toUpperCase() }}
                                    </a-avatar>
                                    <div class="dev-details">
                                        <h4 class="dev-name">{{ issue.assignee?.user_name || 'Unassigned' }}</h4>
                                        <span class="dev-role">Developer</span>
                                    </div>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="side-card info-card">
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
    CloudUploadOutlined, ExperimentOutlined,
    CheckCircleFilled, CloseCircleFilled, PaperClipOutlined // อย่าลืม import Icon
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
        CheckCircleFilled, CloseCircleFilled
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
            // เช็คว่าเป็นไฟล์รูปภาพหรือไม่ (jpeg, png, etc.)
            const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';

            if (!isImage) {
                message.error('อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น!');
                // Return Upload.LIST_IGNORE เพื่อไม่ให้ไฟล์ที่ผิดไปโผล่ใน list (สำหรับ Ant Design Vue 3.x)
                // หรือ return false ถ้าใช้เวอร์ชั่นเก่า แต่ไฟล์อาจจะยังโชว์สีแดง
                return Upload.LIST_IGNORE || false;
            }

            // Return false เพื่อหยุดการ Auto Upload (เพื่อให้คุณกดปุ่ม Submit เองทีหลัง)
            return false;
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
                console.error("Failed to get webhook url", error);
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
    padding-bottom: 60px;
}

/* 2. Header */
.detail-header {
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.back-btn {
    padding: 0;
    color: #64748b;
    font-size: 14px;
    width: fit-content;
}

.back-btn:hover {
    color: #3b82f6;
}

.title-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}

.id-badge {
    background: #f1f5f9;
    color: #475569;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.task-title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
}

.status-badge {
    padding: 8px 16px;
    border-radius: 30px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #475569;
}

.status-badge.testing {
    background: #ffedd5;
    color: #f97316;
}

/* 3. Content Area */
.detail-content {
    max-width: 1400px;
    margin: 32px auto 0;
    padding: 0 24px;
}

/* 4. Cards */
.main-card,
.side-card {
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border: 1px solid #f1f5f9;
    transition: transform 0.2s;
}

.side-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

/* 5. Sections */
.card-section {
    position: relative;
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

.section-title.highlight {
    color: #0f172a;
    font-size: 18px;
}

.count-badge {
    background: #f1f5f9;
    color: #64748b;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
}

.desc-box {
    background: #fdfdfd;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    color: #475569;
    line-height: 1.7;
    white-space: pre-wrap;
    font-size: 15px;
}

.desc-box.note {
    background: #fffbeb;
    border-color: #fef3c7;
    color: #92400e;
}

.divider {
    height: 1px;
    background: #f1f5f9;
    margin: 32px 0;
}

/* ✅ Image Grid Styles */
.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    margin-top: 16px;
}

.img-wrapper {
    aspect-ratio: 16/9;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

:deep(.img-preview) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.empty-state.small {
    padding: 20px;
    text-align: center;
    background: #f8fafc;
    border-radius: 8px;
    color: #94a3b8;
    border: 1px dashed #e2e8f0;
}

/* 6. Form Elements */
.custom-textarea {
    border-radius: 12px;
    border-color: #e2e8f0;
    padding: 16px;
    font-size: 15px;
    background: #fff;
}

.custom-textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.upload-wrapper :deep(.ant-upload.ant-upload-select-picture-card) {
    border-radius: 12px;
    border: 2px dashed #e2e8f0;
    background: #fdfdfd;
    transition: all 0.3s;
}

.upload-wrapper :deep(.ant-upload.ant-upload-select-picture-card:hover) {
    border-color: #3b82f6;
    background: #eff6ff;
}

.upload-icon {
    font-size: 24px;
    color: #94a3b8;
    margin-bottom: 8px;
}

.upload-text {
    color: #64748b;
    font-weight: 500;
}

/* 7. Sidebar */
.sticky-sidebar {
    position: sticky;
    top: 100px;
}

.side-card {
    padding: 24px;
}

.side-title {
    font-size: 13px;
    text-transform: uppercase;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
}

/* Buttons */
.buttons-grid {
    display: grid;
    gap: 16px;
}

.btn-main {
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s;
    width: 100%;
    color: #fff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
    transform: translateY(-2px);
    box-shadow: 0 6px 12px -2px rgba(34, 197, 94, 0.3);
}

.btn-main.fail {
    background: #ef4444;
}

.btn-main.fail:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px -2px rgba(239, 68, 68, 0.3);
}

/* Developer Profile & Info */
.dev-profile {
    display: flex;
    align-items: center;
    gap: 16px;
}

.dev-details {
    display: flex;
    flex-direction: column;
}

.dev-name {
    margin: 0;
    font-weight: 600;
    color: #0f172a;
    font-size: 16px;
}

.dev-role {
    font-size: 13px;
    color: #64748b;
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
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
    padding: 2px 10px;
    border-radius: 6px;
    font-weight: 600;
}

.mt-6 {
    margin-top: 24px;
}

.mb-4 {
    margin-bottom: 24px;
}

@media (max-width: 992px) {
    .header-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .sticky-sidebar {
        margin-top: 24px;
    }
}
</style>