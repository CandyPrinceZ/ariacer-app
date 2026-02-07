<template>
    <a-layout style="min-height: 100vh; background: #f5f7fa;">

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
                                    <component :is="getStatusIcon(issue.status?.code)"
                                        :spin="issue.status?.code === 'inProgress'" />
                                </template>
                                {{ (issue.status?.name || getStatusLabel(issue.status?.code)) }}
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

        <div v-if="loading" class="loading-container">
            <a-spin size="large" />
        </div>

        <div v-else style="padding: 12px; width: 100%;">
            <a-row :gutter="[12, 12]">

                <a-col :xs="24" :lg="17" :xl="18">

                    <transition name="fade">
                        <div v-if="issue.status?.code === 'rejected'" class="custom-alert error mb-3">
                            <div class="alert-icon">
                                <CloseCircleFilled />
                            </div>
                            <div class="alert-content">
                                <h4 class="alert-title">งานถูกส่งกลับแก้ไข (Rejected)</h4>
                                <p class="alert-desc">"{{ issue.remarks || 'ไม่ได้ระบุเหตุผล' }}"</p>

                                <div v-if="issue.remarks_images?.length" class="mini-gallery">
                                    <div v-for="img in issue.remarks_images" :key="img._id" class="mini-img-wrapper">
                                        <a-image :src="img.url" class="mini-img" />
                                    </div>
                                </div>

                                <div v-if="issue.tester" class="alert-meta">
                                    <a-avatar size="small" :src="issue.tester.avatar" style="margin-right: 6px;">
                                        <span v-if="!issue.tester.avatar">{{ issue.tester.user_name?.[0]?.toUpperCase()
                                            }}</span>
                                    </a-avatar>
                                    ตรวจสอบโดย: <strong>{{ issue.tester.user_name }}</strong>
                                    <span class="divider">|</span>
                                    <ClockCircleOutlined /> {{ formatDate(issue.updatedAt) }}
                                </div>
                            </div>
                        </div>
                    </transition>

                    <a-card :bordered="false" class="main-card content-card">
                        <div class="card-section">
                            <h3 class="section-title">
                                <FileTextOutlined /> รายละเอียด (Detail)
                            </h3>
                            <div class="desc-box">{{ issue.detail || '-' }}</div>
                        </div>

                        <a-divider style="margin: 24px 0;" />

                        <div class="card-section">
                            <h3 class="section-title">
                                <PaperClipOutlined /> รูปภาพแนบ
                                <span class="count-badge" v-if="issue.images">{{ issue.images?.length || 0 }}</span>
                            </h3>
                            <div class="image-grid" v-if="issue.images && issue.images.length > 0">
                                <div v-for="img in issue.images" :key="img._id" class="img-wrapper">
                                    <a-image :src="img.url" class="img-preview" />
                                </div>
                            </div>
                            <div v-else class="empty-state">
                                <p class="text-muted">ไม่มีรูปภาพแนบ</p>
                            </div>
                        </div>

                        <a-divider style="margin: 24px 0;" />

                        <div class="card-section">
                            <h3 class="section-title">
                                <CodeOutlined /> Developer Note
                            </h3>
                            <div class="desc-box note">{{ issue.note || 'ยังไม่มีบันทึกจาก Developer' }}</div>
                        </div>
                    </a-card>
                </a-col>

                <a-col :xs="24" :lg="7" :xl="6">
                    <div class="sticky-sidebar">

                        <a-card :bordered="false" class="main-card side-card mb-3"
                            :class="{ 'view-only-card': !hasPermission && issue.assignee }">

                            <div v-if="!issue.assignee">
                                <div class="unassigned-state">
                                    <div class="icon-circle pulse">
                                        <ExclamationCircleOutlined />
                                    </div>
                                    <h3>งานรอผู้รับผิดชอบ</h3>

                                    <div v-if="authProfile?.role_code !== 'imp'">
                                        <p>กดปุ่มด้านล่างเพื่อรับงานนี้</p>
                                        <a-button type="primary" block size="large" class="btn-claim"
                                            :loading="actionLoading" @click="goToDevDetail">
                                            ✋ รับงาน (Claim)
                                        </a-button>
                                    </div>
                                    <div v-else>
                                        <p class="text-muted">รอ Developer รับงาน</p>
                                    </div>
                                </div>
                            </div>

                            <div v-else>
                                <div class="assignee-header">
                                    <a-avatar :size="48" :src="issue.assignee.avatar"
                                        :style="{ backgroundColor: !issue.assignee.avatar ? stringToColor(issue.assignee.user_name) : 'transparent' }">
                                        <span v-if="!issue.assignee.avatar">{{ (issue.assignee.user_name || 'U')[0]
                                            }}</span>
                                    </a-avatar>
                                    <div class="assignee-details">
                                        <span class="label">ผู้รับผิดชอบ {{ isAssignee ? '(You)' : '' }}</span>
                                        <h4 class="name text-ellipsis">{{ issue.assignee.user_name }}</h4>
                                    </div>
                                </div>

                                <div v-if="!hasPermission" class="readonly-badge">
                                    <EyeOutlined /> View Only
                                </div>
                            </div>

                            <div class="action-area" v-if="hasPermission || (!issue.assignee && isReporter)">

                                <template v-if="isAssignee">
                                    <a-button v-if="issue.status?.code === 'rejected'" type="primary" block
                                        class="btn-fix mb-2" @click="goToDevDetail">
                                        <ToolOutlined /> แก้ไขงาน (Fix)
                                    </a-button>
                                    <a-button v-else-if="issue.status?.code === 'received'" type="primary" block
                                        class="btn-start mb-2" @click="goToDevDetail">
                                        <SyncOutlined /> เริ่มงาน (Start)
                                    </a-button>
                                </template>

                                <a-button v-if="isReporter" type="dashed" block @click="goToEditDetail">
                                    <EditOutlined /> แก้ไขรายละเอียด
                                </a-button>
                            </div>

                        </a-card>

                        <a-card :bordered="false" class="main-card side-card">
                            <h4 class="side-title">ข้อมูล Ticket</h4>
                            <div class="info-list">
                                <div class="info-row">
                                    <span class="label">Type</span>
                                    <a-tag color="blue">{{ issue.type?.name || '-' }}</a-tag>
                                </div>
                                <div class="info-row">
                                    <span class="label">Urgency</span>
                                    <a-tag :color="issue.urgency?.color || 'default'">{{ issue.urgency?.name }}</a-tag>
                                </div>
                                <div class="info-row">
                                    <span class="label">Reporter</span>
                                    <div class="reporter-pill">
                                        <a-avatar v-if="issue.reporter?.avatar" size="small"
                                            :src="issue.reporter.avatar" style="margin-right: 4px;" />
                                        <UserOutlined v-else style="margin-right: 4px;" />
                                        {{ issue.reporter?.user_name || 'Unknown' }}
                                    </div>
                                </div>
                                <div class="info-row">
                                    <span class="label">Updated</span>
                                    <span class="val-text">{{ formatDate(issue.updatedAt) }}</span>
                                </div>
                            </div>
                        </a-card>

                    </div>
                </a-col>
            </a-row>
        </div>

    </a-layout>
</template>

<script>
import dayjs from 'dayjs';
import axios from 'axios';
import { message } from 'ant-design-vue';
import {
    ArrowLeftOutlined, FileTextOutlined, PaperClipOutlined, CodeOutlined,
    UserOutlined, ClockCircleOutlined, CloseCircleFilled,
    ExclamationCircleOutlined, ToolOutlined, EditOutlined, EyeOutlined,

    SoundOutlined, InboxOutlined, SyncOutlined, CheckSquareOutlined,
    CloudUploadOutlined, ExperimentOutlined, CheckCircleOutlined, CloseCircleOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons-vue';

export default {
    name: 'IssueDetail',
    components: {
        ArrowLeftOutlined, FileTextOutlined, PaperClipOutlined, CodeOutlined,
        UserOutlined, ClockCircleOutlined, CloseCircleFilled,
        ExclamationCircleOutlined, ToolOutlined, EditOutlined, EyeOutlined,

        SoundOutlined, InboxOutlined, SyncOutlined, CheckSquareOutlined,
        CloudUploadOutlined, ExperimentOutlined, CheckCircleOutlined, CloseCircleOutlined,
        QuestionCircleOutlined
    },
    data() {
        return {
            loading: false,
            actionLoading: false,
            issue: {},
            authProfile: null
        };
    },
    computed: {
        isAssignee() {
            return this.authProfile && this.issue.assignee && (this.authProfile._id === this.issue.assignee._id);
        },
        isReporter() {
            return this.authProfile && this.issue.reporter && (this.authProfile._id === this.issue.reporter._id);
        },
        hasPermission() {
            // Permission to see Action Buttons (Fix/Start/Edit)
            return this.isAssignee || this.isReporter;
        }
    },
    async mounted() {
        this.loading = true;
        try {
            await this.getAuthProfile();
            await this.fetchIssue();
        } finally {
            this.loading = false;
        }
    },
    methods: {
        formatDate(date) { return date ? dayjs(date).format('D MMM YY, HH:mm') : '-'; },

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
            try {
                const issueId = this.$route.params.id;
                const token = localStorage.getItem('token');

                if (!token) {
                    this.$router.push('/login');
                    return;
                }

                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(import.meta.env.VITE_API_URL + `/issues/${issueId}`, config);
                this.issue = response.data;

            } catch (error) {
                console.error('Error fetching issue:', error);
                message.error('ไม่สามารถโหลดข้อมูล Ticket ได้');
                if (error.response && error.response.status === 401) {
                    this.$router.push('/login');
                }
            }
        },

        getStatusColor(code) {
            const colorMap = { reported: 'error', received: 'blue', inProgress: 'processing', finished: 'cyan', upserver: 'purple', testing: 'orange', success: 'success', rejected: 'red' };
            return colorMap[code] || 'default';
        },
        getStatusIcon(code) {
            const iconMap = { reported: 'SoundOutlined', received: 'InboxOutlined', inProgress: 'SyncOutlined', finished: 'CheckSquareOutlined', upserver: 'CloudUploadOutlined', testing: 'ExperimentOutlined', success: 'CheckCircleOutlined', rejected: 'CloseCircleOutlined' };
            return iconMap[code] || 'QuestionCircleOutlined';
        },
        getStatusLabel(code) {
            const labelMap = { reported: 'Reported', received: 'Received', inProgress: 'In Progress', finished: 'Dev Finished', upserver: 'Ready to Test', testing: 'Testing', success: 'Success', rejected: 'Rejected' };
            return labelMap[code] || code;
        },
        stringToColor(str) {
            if (!str) return '#3b82f6';
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + '00000'.substring(0, 6 - c.length) + c;
        },
        goToDevDetail() {
            this.$router.push({ name: 'DevelopmentDetail', params: { id: this.issue._id } });
        },
        goToEditDetail() {
            this.$router.push({ name: 'IssueEdit', params: { id: this.issue._id } });
        }
    }
};
</script>

<style scoped>
/* Compact Header */
.compact-header {
    background: #fff;
    padding: 12px 16px;
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

.status-tag {
    border-radius: 4px;
    border: none;
    font-weight: 600;
    font-size: 12px;
}

/* Layout & Cards */
.loading-container {
    display: flex;
    justify-content: center;
    padding-top: 50px;
}

.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
    background: #fff;
}

.content-card {
    min-height: 600px;
}

.side-card {
    margin-bottom: 12px;
}

.mb-3 {
    margin-bottom: 12px;
}

.mb-2 {
    margin-bottom: 8px;
}

/* View Only Card */
.view-only-card {
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    opacity: 0.9;
}

.readonly-badge {
    margin-top: 12px;
    text-align: center;
    color: #8c8c8c;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #eee;
    padding: 4px;
    border-radius: 4px;
}

/* Rejected Alert */
.custom-alert.error {
    background: #fff1f0;
    border: 1px solid #ffccc7;
    padding: 16px;
    border-radius: 8px;
    display: flex;
    gap: 16px;
    color: #a8071a;
}

.alert-icon {
    font-size: 24px;
    color: #ff4d4f;
}

.alert-content {
    flex: 1;
}

.alert-title {
    margin: 0 0 4px;
    font-weight: 700;
    color: #cf1322;
    font-size: 15px;
}

.alert-desc {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.5;
    color: #5c0011;
}

.alert-meta {
    font-size: 12px;
    color: #ff4d4f;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.5);
    padding: 4px 8px;
    border-radius: 4px;
    width: fit-content;
}

.divider {
    color: #ffccc7;
    margin: 0 4px;
}

/* Mini Gallery */
.mini-gallery {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
}

.mini-img-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

.mini-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Sections */
.section-title {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
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
    color: #334155;
    line-height: 1.6;
    white-space: pre-wrap;
    font-size: 14px;
}

.desc-box.note {
    background: #fffbe6;
    border-color: #ffe58f;
    color: #d48806;
}

/* Attachments */
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
}

.img-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.empty-state {
    text-align: center;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 6px;
    border: 1px dashed #e2e8f0;
    color: #94a3b8;
}

/* Sidebar & Actions */
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

/* Unassigned State */
.unassigned-state {
    text-align: center;
    padding: 10px 0;
}

.icon-circle {
    width: 56px;
    height: 56px;
    background: #fff1f0;
    color: #ff4d4f;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin: 0 auto 12px;
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px #ffccc7;
}

.unassigned-state h3 {
    font-weight: 700;
    color: #cf1322;
    margin-bottom: 4px;
    font-size: 16px;
}

.unassigned-state p {
    color: #ff4d4f;
    font-size: 13px;
    margin-bottom: 16px;
    opacity: 0.8;
}

.btn-claim {
    background-color: #ff4d4f;
    border-color: #ff4d4f;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(255, 77, 79, 0.2);
}

.btn-claim:hover {
    background-color: #ff7875;
    border-color: #ff7875;
}

/* Assigned State */
.assignee-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.assignee-details .label {
    font-size: 10px;
    text-transform: uppercase;
    color: #94a3b8;
    font-weight: 700;
}

.assignee-details .name {
    font-weight: 700;
    color: #0f172a;
    font-size: 16px;
    margin: 0;
    line-height: 1.2;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
}

.btn-fix {
    background-color: #1890ff;
    font-weight: 600;
}

.btn-start {
    background-color: #13c2c2;
    border-color: #13c2c2;
    font-weight: 600;
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

.reporter-pill {
    background: #f8fafc;
    padding: 2px 8px;
    border-radius: 12px;
    color: #475569;
    font-size: 12px;
    border: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.pulse {
    animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
    }
}
</style>