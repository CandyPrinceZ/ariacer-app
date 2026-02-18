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
                                    <p class="alert-desc">"{{ issue.remarks }}"</p>
                                    <div v-if="issue.remarks_images?.length" class="mini-gallery">
                                        <div v-for="img in issue.remarks_images" :key="img._id"
                                            class="mini-img-wrapper">
                                            <a-image :src="img.url" class="mini-img" />
                                        </div>
                                    </div>
                                    <div v-if="issue.tester" class="alert-meta">
                                        <a-avatar size="small" :src="issue.tester.avatar" />
                                        Rejected by: <strong>{{ issue.tester.user_name }}</strong>
                                    </div>
                                </div>
                            </div>
                        </transition>

                        <a-card :bordered="false" class="main-card content-card">

                            <div class="card-section">
                                <h3 class="section-title">
                                    <FileTextOutlined /> Requirement Detail
                                </h3>
                                <div class="desc-box">{{ issue.detail || '-' }}</div>
                            </div>

                            <a-divider style="margin: 24px 0;" />

                            <div class="card-section">
                                <h3 class="section-title">
                                    <PaperClipOutlined /> Attachments
                                    <span class="count-badge" v-if="issue.images">{{ issue.images.length }}</span>
                                </h3>
                                <div class="image-grid" v-if="issue.images?.length">
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
                                    <CodeOutlined /> Developer Note
                                </h3>
                                <div class="desc-box note-bg">{{ issue.note || 'No note provided from developer.' }}
                                </div>
                            </div>

                            <a-divider style="margin: 24px 0;" />

                            <div class="card-section highlight-bg">
                                <h3 class="section-title primary-color">
                                    <AuditOutlined /> QA / Test Result
                                </h3>
                                <a-form layout="vertical" class="qa-form">
                                    <a-form-item label="Comment / Bug Report">
                                        <a-textarea v-model:value="qcComment" :rows="4"
                                            placeholder="ระบุรายละเอียดผลการทดสอบ หรือจุดที่ต้องแก้ไข..."
                                            class="modern-textarea" />
                                    </a-form-item>

                                    <a-form-item label="Evidence Images (หลักฐานการทดสอบ)">
                                        <div class="upload-container">
                                            <a-upload list-type="picture-card" :file-list="fileList"
                                                @preview="handlePreview" @change="handleChange"
                                                :before-upload="beforeUpload" accept="image/*" class="premium-upload">
                                                <div v-if="fileList.length < 5" class="upload-placeholder">
                                                    <CloudUploadOutlined style="font-size: 20px" />
                                                    <div style="font-size: 11px; margin-top: 4px">Upload</div>
                                                </div>
                                            </a-upload>
                                        </div>
                                    </a-form-item>
                                </a-form>
                            </div>

                        </a-card>
                    </a-col>

                    <a-col :xs="24" :lg="7" :xl="6">
                        <div class="sticky-sidebar">

                            <a-card :bordered="false" class="main-card side-card mb-3">
                                <h4 class="side-title">QA Actions</h4>
                                <div class="action-grid-vertical">
                                    <a-popconfirm title="Confirm System Pass?" @confirm="submitResult('pass')">
                                        <button class="btn-action pass" :disabled="loading">
                                            <CheckCircleFilled /> PASS (ปิดงาน)
                                        </button>
                                    </a-popconfirm>

                                    <a-popconfirm title="ส่งกลับให้ Dev คนเดิมแก้ไข?"
                                        @confirm="submitResult('fail-keep-assignee')">
                                        <button class="btn-action reopen" :disabled="loading">
                                            <SyncOutlined /> RE-OPEN (ส่งกลับคนเดิม)
                                        </button>
                                    </a-popconfirm>

                                    <a-popconfirm title="Reject และล้างคนรับผิดชอบ?" ok-type="danger"
                                        @confirm="submitResult('fail')">
                                        <button class="btn-action fail" :disabled="loading">
                                            <CloseCircleFilled /> REJECT (ส่งกลับกองกลาง)
                                        </button>
                                    </a-popconfirm>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="main-card side-card mb-3">
                                <h4 class="side-title">Assignee</h4>
                                <div class="assignee-header">
                                    <a-avatar :size="48" :src="issue.assignee?.avatar"
                                        :style="{ backgroundColor: stringToColor(issue.assignee?.user_name) }">
                                        {{ issue.assignee?.user_name?.[0]?.toUpperCase() }}
                                    </a-avatar>
                                    <div class="assignee-details">
                                        <span class="label">Responsible</span>
                                        <h4 class="name text-ellipsis">{{ issue.assignee?.user_name || 'Unassigned' }}
                                        </h4>
                                    </div>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="main-card side-card">
                                <h4 class="side-title">Ticket Info</h4>
                                <div class="info-list">
                                    <div class="info-row">
                                        <span class="label">Server</span>
                                        <span class="val-text link" @click="openServerLink(issue.server?.url)">
                                            {{ issue.server?.name || '-' }}
                                            <ExportOutlined />
                                        </span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">Type</span>
                                        <span class="val-text">{{ issue.type?.name || '-' }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">Priority</span>
                                        <a-tag :color="issue.urgency?.color" class="tag-pill">{{ issue.urgency?.name
                                            }}</a-tag>
                                    </div>

                                    <div class="info-row">
                                        <span class="label">Deadline</span>
                                        <span class="val-text"
                                            :style="{ color: deadlineInfo?.color === 'error' ? 'red' : 'inherit' }">
                                            {{ formatDate(issue.deadline) }}
                                        </span>
                                    </div>

                                    <div v-if="issue.deadline" class="info-row" style="margin-top: 8px;">
                                        <span class="label">Time Left</span>
                                        <a-tag :color="deadlineInfo.color" style="margin: 0; font-weight: 600;">
                                            <component :is="deadlineInfo.icon" /> {{ deadlineInfo.text }}
                                        </a-tag>
                                    </div>

                                    <a-divider style="margin: 12px 0;" />
                                    <div class="info-row">
                                        <span class="label">Reporter</span>
                                        <div class="reporter-pill">
                                            <a-avatar size="small" :src="issue.reporter?.avatar"
                                                style="margin-right: 4px" />
                                            {{ issue.reporter?.user_name || 'Unknown' }}
                                        </div>
                                    </div>
                                </div>
                            </a-card>

                        </div>
                    </a-col>
                </a-row>
            </div>

            <a-modal v-model:open="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancelModal">
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
    ExclamationCircleOutlined, SyncOutlined, UserOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

export default {
    name: 'ImplementDetail',
    components: {
        ArrowLeftOutlined, FileTextOutlined, CodeOutlined, AuditOutlined,
        CloudUploadOutlined, PaperClipOutlined, InboxOutlined,
        CheckCircleFilled, CloseCircleFilled, ClockCircleOutlined, ExportOutlined,
        ExclamationCircleOutlined, SyncOutlined, UserOutlined
    },
    data() {
        return {
            currentTime: dayjs(),
            timerInterval: null,
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
    computed: {
        // เพิ่ม Computed เหมือนหน้า Dev
        deadlineInfo() {
            if (!this.issue.deadline) return null;

            const now = this.currentTime;
            const end = dayjs(this.issue.deadline);
            const diffMs = end.diff(now);

            const isOverdue = diffMs < 0;
            const absDiff = Math.abs(diffMs);

            const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

            let text = '';
            if (days > 0) text += `${days}d `;
            if (hours > 0) text += `${hours}h `;
            text += `${minutes}m`;

            if (isOverdue) {
                return {
                    text: `Overdue by ${text}`,
                    color: 'error',
                    icon: 'CloseCircleOutlined'
                };
            } else {
                const isUrgent = days === 0;
                return {
                    text: `${text} remaining`,
                    color: isUrgent ? 'warning' : 'success',
                    icon: 'ClockCircleOutlined'
                };
            }
        }
    },
    async mounted() {
        this.loading = true;
        try {
            await this.getAuthProfile();
            const id = this.$route.params.id;
            await this.fetchIssue(id);
            await this.fetchStatuses();

            this.timerInterval = setInterval(() => {
                this.currentTime = dayjs();
            }, 60000);
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    },
    beforeUnmount() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    },
    methods: {
        goBack() { this.$router.go(-1); },
        formatDate(date) { return date ? dayjs(date).format('D MMM YYYY, HH:mm') : '-'; },
        isOverdue(date) {
            return date ? dayjs().isAfter(dayjs(date)) : false;
        },
        handleCancelModal() { this.previewVisible = false; },
        async handlePreview(file) {
            this.previewImage = file.url || file.thumbUrl;
            this.previewVisible = true;
            this.previewTitle = file.name || 'Preview';
        },
        handleChange({ fileList }) { this.fileList = fileList; },
        beforeUpload() { return false; }, // Prevent auto upload

        async getAuthProfile() {
            const token = localStorage.getItem('token');
            const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.authProfile = res.data;
        },
        async fetchIssue(id) {
            const token = localStorage.getItem('token');
            const res = await axios.get(import.meta.env.VITE_API_URL + `/issues/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.issue = res.data;
        },
        async fetchStatuses() {
            const token = localStorage.getItem('token');
            const res = await axios.get(import.meta.env.VITE_API_URL + '/items/statuses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.statusOptions = res.data;
        },
        stringToColor(str) {
            if (!str) return '#3b82f6';
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            return `hsl(${hash % 360}, 60%, 60%)`;
        },
        getStatusColor(code) {
            const map = { reported: 'red', inProgress: 'blue', testing: 'orange', success: 'green', rejected: 'red' };
            return map[code] || 'default';
        },
        getStatusIcon(code) {
            const map = { inProgress: 'SyncOutlined', testing: 'ClockCircleOutlined', success: 'CheckCircleOutlined', rejected: 'CloseCircleOutlined' };
            return map[code] || 'ClockCircleOutlined';
        },
        openServerLink(url) { if (url) window.open(url, '_blank'); },

        async uploadImageToServer(fileObj) {
            const formData = new FormData();
            formData.append("file", fileObj);
            const token = localStorage.getItem("token");
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/config/upload-image`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data.url;
        },

        async submitResult(resultType) {
            const token = localStorage.getItem('token');
            let targetStatus = null;

            if (resultType === 'pass') {
                targetStatus = this.statusOptions.find(s => s.code === 'success');
            } else {
                targetStatus = this.statusOptions.find(s => s.code === 'rejected');
                if (!this.qcComment) return message.error('กรุณาระบุเหตุผลที่ไม่ผ่าน');
            }

            this.loading = true;
            try {
                let imageUrls = [];
                if (this.fileList.length > 0) {
                    message.loading({ content: 'Uploading images...', key: 'up' });
                    imageUrls = await Promise.all(this.fileList.map(f => this.uploadImageToServer(f.originFileObj)));
                    message.success({ content: 'Uploaded!', key: 'up' });
                }

                const payload = {
                    status: targetStatus._id,
                    remarks: this.qcComment || '-',
                    remarks_images: imageUrls.map(url => ({ url: String(url) })),
                    tester: this.authProfile._id
                };

                if (resultType === 'fail') {
                    payload.assignee = null;
                    payload.co_assignee = null;
                } else if (resultType === 'fail-keep-assignee') {
                    payload.assignee = this.issue.assignee?._id;
                }

                await axios.put(`${import.meta.env.VITE_API_URL}/issues/${this.issue._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                message.success('ดำเนินการเรียบร้อย');
                this.$router.push('/implement');
            } catch (e) {
                message.error('Error: ' + e.message);
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped>
/* Copy All CSS from DevDetail to maintain 100% consistency */
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

.compact-header {
    background: #fff;
    padding: 16px 24px;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
}

.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
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

.note-bg {
    background: #fffbeb;
    border-color: #fef3c7;
    color: #92400e;
}

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
    transition: 0.2s;
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

.highlight-bg {
    background: #f0f9ff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #bae6fd;
}

.modern-textarea {
    border-radius: 6px;
    padding: 12px;
}

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

.action-grid-vertical {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.btn-action {
    border: none;
    width: 100%;
    padding: 10px;
    border-radius: 6px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-action.pass {
    background: #22c55e;
}

.btn-action.reopen {
    background: #3b82f6;
}

.btn-action.fail {
    background: #ef4444;
}

.assignee-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 8px;
}

.info-row .label {
    color: #64748b;
}

.info-row .link {
    color: #0284c7;
    cursor: pointer;
}

.custom-alert.error {
    background: #fff1f0;
    border: 1px solid #ffccc7;
    padding: 16px;
    border-radius: 8px;
    display: flex;
    gap: 16px;
}

.alert-title {
    font-weight: 700;
    color: #cf1322;
}

.alert-meta {
    font-size: 12px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.mini-gallery {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.mini-img-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #ddd;
}
</style>