<template>
    <a-layout style="min-height: 100vh; background: #f8f9fa;">

        <div v-if="loading" class="loading-overlay">
            <a-spin size="large" />
            <p class="mt-2 text-muted">Loading Task...</p>
        </div>

        <div v-else class="page-container">

            <div class="header-wrapper">
                <div class="header-content">
                    <div class="header-left">
                        <div class="breadcrumb">
                            <span class="back-link" @click="goBack">
                                <ArrowLeftOutlined /> Back to Board
                            </span>
                        </div>
                        <div class="title-group">
                            <span class="id-tag">#{{ issue.issue_id || issue.id }}</span>
                            <h1 class="page-title">{{ issue.name }}</h1>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="status-bar">
                            <a-tag :color="getStatusColor(issue.status?.code)" class="status-badge">
                                <component :is="getStatusIcon(issue.status?.code)" />
                                {{ issue.status?.name || 'Unknown' }}
                            </a-tag>
                            <span class="updated-text">
                                <ClockCircleOutlined /> Last update: {{ formatDate(issue.updatedAt) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content-body">
                <a-row :gutter="[20, 20]">

                    <a-col :xs="24" :lg="17" :xl="18">

                        <transition name="slide-fade">
                            <div v-if="issue.remarks" class="alert-box error mb-4">
                                <div class="alert-icon">
                                    <CloseCircleFilled />
                                </div>
                                <div class="alert-info">
                                    <h4>งานถูกส่งกลับแก้ไข (Rejected)</h4>
                                    <p>"{{ issue.remarks }}"</p>

                                    <div v-if="issue.remarks_images?.length" class="reject-gallery">
                                        <a-image v-for="img in issue.remarks_images" :key="img._id" :src="img.url"
                                            class="reject-thumb" />
                                    </div>

                                    <div v-if="issue.tester" class="alert-footer">
                                        Rejected by: <strong>{{ issue.tester.user_name }}</strong>
                                    </div>
                                </div>
                            </div>
                        </transition>

                        <a-card :bordered="false" class="modern-card">

                            <div class="section-block">
                                <h3 class="section-head">
                                    <FileTextOutlined /> Requirement Detail
                                </h3>
                                <div class="text-content">
                                    {{ issue.detail || '-' }}
                                </div>
                            </div>

                            <a-divider />

                            <div class="section-block">
                                <h3 class="section-head">
                                    <PaperClipOutlined /> Attachments
                                    <span class="count-bubble" v-if="issue.images">{{ issue.images.length }}</span>
                                </h3>
                                <div class="attachment-grid" v-if="issue.images && issue.images.length > 0">
                                    <div v-for="img in issue.images" :key="img._id" class="attach-item">
                                        <a-image :src="img.url" class="attach-img" />
                                    </div>
                                </div>
                                <div v-else class="empty-placeholder">
                                    <InboxOutlined style="font-size: 24px; margin-bottom: 8px;" />
                                    <p>No attachments available</p>
                                </div>
                            </div>

                            <a-divider />

                            <div class="section-block">
                                <h3 class="section-head">
                                    <CodeOutlined /> Developer Note
                                </h3>
                                <div class="text-content note-bg">
                                    {{ issue.note || 'No note provided from developer.' }}
                                </div>
                            </div>

                            <a-divider />

                            <div class="section-block highlight-bg">
                                <h3 class="section-head primary-color">
                                    <AuditOutlined /> QA / Test Result
                                </h3>

                                <a-form layout="vertical" class="qa-form">
                                    <a-form-item label="Comment / Bug Report">
                                        <a-textarea v-model:value="qcComment" :rows="4"
                                            placeholder="ระบุรายละเอียดผลการทดสอบ หรือจุดที่ต้องแก้ไข..."
                                            class="custom-input" />
                                    </a-form-item>

                                    <a-form-item label="Evidence Images (หลักฐานการทดสอบ)">
                                        <div class="upload-container">
                                            <a-upload list-type="picture-card" :file-list="fileList"
                                                @preview="handlePreview" @change="handleChange"
                                                :before-upload="beforeUpload" accept="image/*" class="premium-upload">
                                                <div v-if="fileList.length < 5" class="upload-placeholder">
                                                    <div class="icon-wrap">
                                                        <CloudUploadOutlined />
                                                    </div>
                                                    <div class="text-wrap">Upload</div>
                                                </div>
                                            </a-upload>
                                        </div>
                                        <div class="upload-hint">รองรับไฟล์รูปภาพ: JPG, PNG (Max 5 รูป)</div>
                                    </a-form-item>
                                </a-form>
                            </div>

                        </a-card>
                    </a-col>

                    <a-col :xs="24" :lg="7" :xl="6">
                        <div class="sidebar-wrapper">

                            <a-card :bordered="false" class="modern-card action-card mb-3">
                                <h4 class="card-label">Actions</h4>
                                <div class="action-grid">
                                    <a-popconfirm title="Confirm System Pass?" ok-text="Yes, Pass" cancel-text="Cancel"
                                        @confirm="submitResult('pass')">
                                        <button class="btn-action pass" :disabled="loading">
                                            <CheckCircleFilled /> PASS
                                        </button>
                                    </a-popconfirm>

                                    <a-popconfirm title="Reject back to Dev?" ok-text="Yes, Reject" cancel-text="Cancel"
                                        ok-type="danger" @confirm="submitResult('fail')">
                                        <button class="btn-action fail" :disabled="loading">
                                            <CloseCircleFilled /> FAIL
                                        </button>
                                    </a-popconfirm>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="modern-card mb-3">
                                <h4 class="card-label">Assignee</h4>
                                <div class="user-card">
                                    <a-avatar :size="48" :src="issue.assignee?.avatar"
                                        :style="{ backgroundColor: stringToColor(issue.assignee?.user_name) }">
                                        {{ (issue.assignee?.user_name || 'U')[0] }}
                                    </a-avatar>
                                    <div class="user-info">
                                        <span class="u-name">{{ issue.assignee?.user_name || 'Unassigned' }}</span>
                                        <span class="u-role">{{ issue.assignee?.role_name || 'Developer' }}</span>
                                    </div>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="modern-card">
                                <h4 class="card-label">Ticket Info</h4>
                                <div class="info-list">
                                    <div class="info-item">
                                        <span class="label">Server</span>
                                        <span class="value link" @click="openServerLink(issue.server?.url)">
                                            {{ issue.server?.name || '-' }}
                                            <ExportOutlined />
                                        </span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">Type</span>
                                        <span class="value">{{ issue.type?.name || '-' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">Priority</span>
                                        <a-tag :color="issue.urgency?.color || 'blue'" class="mini-tag">
                                            {{ issue.urgency?.name || '-' }}
                                        </a-tag>
                                    </div>

                                    <div class="info-item">
                                        <span class="label">Deadline</span>
                                        <span class="value" :class="{ 'text-danger': isOverdue(issue.deadline) }">
                                            {{ formatDate(issue.deadline) }}
                                            <ExclamationCircleOutlined v-if="isOverdue(issue.deadline)" />
                                        </span>
                                    </div>

                                    <a-divider style="margin: 8px 0;" />

                                    <div class="info-item">
                                        <span class="label">Reporter</span>
                                        <div class="reporter-val">
                                            <a-avatar size="small" :src="issue.reporter?.avatar" />
                                            <span>{{ issue.reporter?.user_name || '-' }}</span>
                                        </div>
                                    </div>

                                    <div class="info-item">
                                        <span class="label">Created</span>
                                        <span class="value text-muted">{{ formatDate(issue.createdAt) }}</span>
                                    </div>
                                </div>
                            </a-card>

                        </div>
                    </a-col>

                </a-row>
            </div>

            <a-modal :visible="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel">
                <img alt="preview" style="width: 100%" :src="previewImage" />
            </a-modal>

        </div>
    </a-layout>
</template>

<script>
import axios from 'axios';
import {
    ArrowLeftOutlined, FileTextOutlined, CodeOutlined, AuditOutlined,
    CloudUploadOutlined, CheckCircleFilled, CloseCircleFilled,
    PaperClipOutlined, ClockCircleOutlined, ExportOutlined, InboxOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons-vue';
import { message, Upload } from 'ant-design-vue';
import dayjs from 'dayjs';

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
        CloudUploadOutlined, PaperClipOutlined, InboxOutlined,
        CheckCircleFilled, CloseCircleFilled, ClockCircleOutlined, ExportOutlined, ExclamationCircleOutlined
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
        goBack() { this.$router.go(-1); },
        formatDate(date) { return date ? dayjs(date).format('D MMM YYYY, HH:mm') : '-'; },
        // ✅ Check Overdue
        isOverdue(date) {
            if (!date) return false;
            return dayjs().isAfter(dayjs(date)) && this.issue.status?.code !== 'success';
        },
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
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
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
        getStatusColor(code) {
            const map = { reported: 'red', received: 'default', inProgress: 'blue', finished: 'cyan', testing: 'orange', success: 'green', upserver: 'purple', rejected: 'red' };
            return map[code] || 'default';
        },
        getStatusIcon(code) {
            const iconMap = { reported: 'SoundOutlined', received: 'InboxOutlined', inProgress: 'SyncOutlined', finished: 'CheckSquareOutlined', upserver: 'CloudUploadOutlined', testing: 'ExperimentOutlined', success: 'CheckCircleOutlined', rejected: 'CloseCircleOutlined' };
            return iconMap[code] || 'QuestionCircleOutlined';
        },
        openServerLink(url) {
            if (url) {
                window.open(url, '_blank');
            } else {
                message.warning('ไม่พบลิงก์ Server');
            }
        },
        async getDynamicWebhook() {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/config/discord-webhook-images', {
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
                msg = 'Testing Passed!';
            } else {
                targetStatus = this.statusOptions.find(s => s.code === 'rejected');
                if (!this.qcComment) {
                    message.error('กรุณาระบุเหตุผลที่ไม่ผ่าน');
                    return;
                }
                msg = 'Job Rejected.';
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
                    payload.co_assignee = null;
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
/* =========== Global & Layout =========== */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.85);
    z-index: 999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
}

.page-container {
    width: 100%;
    padding-bottom: 40px;
}

/* ✅ Fluid Full Width */
.content-body {
    padding: 20px;
    width: 100%;
}

/* =========== Header (Compact) =========== */
.header-wrapper {
    background: #fff;
    padding: 12px 24px;
    border-bottom: 1px solid #eaeaea;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.breadcrumb {
    font-size: 12px;
    color: #64748b;
}

.back-link {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.back-link:hover {
    color: #1890ff;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.id-tag {
    background: #f1f5f9;
    color: #475569;
    padding: 1px 8px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 13px;
}

.page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
}

.status-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: #64748b;
}

.status-badge {
    padding: 2px 10px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 12px;
    border: none;
    display: flex;
    align-items: center;
    gap: 6px;
}

.updated-text {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* =========== Cards & Sections =========== */
.modern-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s;
    background: #fff;
    overflow: hidden;
}

.section-block {
    padding: 0 4px;
}

.section-head {
    font-size: 15px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.count-bubble {
    background: #e2e8f0;
    color: #475569;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 700;
    margin-left: auto;
}

.text-content {
    color: #475569;
    line-height: 1.6;
    font-size: 14px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
}

.text-content.note-bg {
    background: #fffbeb;
    border-color: #fef3c7;
    color: #92400e;
}

/* =========== Attachments =========== */
.attachment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
}

.attach-item {
    aspect-ratio: 16/10;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    cursor: pointer;
}

.attach-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
}

.attach-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s;
}

.empty-placeholder {
    text-align: center;
    color: #94a3b8;
    padding: 24px;
    font-style: italic;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px dashed #e2e8f0;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* =========== Upload Section (Tight) =========== */
.highlight-bg {
    background: #f0f9ff;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #bae6fd;
    margin: 0 -8px;
}

.primary-color {
    color: #0284c7;
}

.qa-form .custom-input {
    border-radius: 8px;
    border-color: #cbd5e1;
    padding: 12px;
    font-size: 14px;
}

/* ✅ Compact Upload Style */
.upload-container {
    margin-top: 8px;
}

.premium-upload :deep(.ant-upload.ant-upload-select-picture-card) {
    width: 100px;
    height: 100px;
    background: #fff;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    margin-bottom: 8px;
    margin-right: 8px;
    transition: all 0.3s;
}

.premium-upload :deep(.ant-upload.ant-upload-select-picture-card:hover) {
    border-color: #3b82f6;
    background: #eff6ff;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #64748b;
}

.icon-wrap {
    font-size: 24px;
    color: #94a3b8;
    margin-bottom: 6px;
}

.text-wrap {
    font-size: 11px;
    font-weight: 600;
}

.upload-hint {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
}

/* =========== Sidebar Elements =========== */
.card-label {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
    color: #94a3b8;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
}

.mb-3 {
    margin-bottom: 12px;
}

/* Action Buttons */
.action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.btn-action {
    border: none;
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-action.pass {
    background: #22c55e;
}

.btn-action.pass:hover {
    background: #16a34a;
    transform: translateY(-2px);
}

.btn-action.fail {
    background: #ef4444;
}

.btn-action.fail:hover {
    background: #dc2626;
    transform: translateY(-2px);
}

/* User Card */
.user-card {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.u-name {
    font-weight: 600;
    color: #0f172a;
    font-size: 14px;
}

.u-role {
    font-size: 12px;
    color: #64748b;
}

/* Info List */
.info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}

.info-item .label {
    color: #64748b;
    font-weight: 500;
}

.info-item .value {
    font-weight: 600;
    color: #334155;
}

.info-item .link {
    color: #0284c7;
    cursor: pointer;
}

.info-item .link:hover {
    text-decoration: underline;
}

.info-item .text-muted {
    color: #94a3b8;
}

.info-item .text-danger {
    color: #ef4444;
}

.mini-tag {
    border: none;
    font-weight: 600;
    font-size: 11px;
    padding: 0 8px;
    border-radius: 4px;
}

.reporter-val {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Alerts */
.alert-box {
    padding: 16px;
    border-radius: 8px;
    display: flex;
    gap: 16px;
}

.alert-box.error {
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: #991b1b;
}

.alert-icon {
    font-size: 24px;
    color: #ef4444;
}

.alert-info h4 {
    margin: 0 0 4px;
    font-weight: 700;
    font-size: 15px;
    color: #7f1d1d;
}

.alert-info p {
    margin: 0;
    font-size: 14px;
}

.reject-gallery {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    flex-wrap: wrap;
}

.reject-thumb {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    border: 1px solid #fecaca;
}

.alert-footer {
    margin-top: 8px;
    font-size: 12px;
    color: #b91c1c;
    opacity: 0.8;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
    .content-body {
        padding: 16px;
    }

    .header-wrapper {
        padding: 16px;
    }

    .title-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .status-bar {
        flex-wrap: wrap;
    }

    .sidebar-wrapper {
        margin-top: 20px;
    }

    .action-grid {
        grid-template-columns: 1fr;
    }
}
</style>