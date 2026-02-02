<template>
    <a-layout style="min-height: 100vh; background: #fdfdfd;">

        <div class="detail-header">
            <div class="header-content">
                <a-button @click="$router.go(-1)" type="text" class="back-btn">
                    <ArrowLeftOutlined /> Back to List
                </a-button>

                <div class="header-main">
                    <div class="title-group">
                        <span class="id-tag">#{{ issue.id }}</span>
                        <h1 class="page-title">{{ issue.name }}</h1>
                    </div>
                    <a-tag color="orange" class="status-pill">
                        <ExperimentOutlined /> UNDER TESTING
                    </a-tag>
                </div>
            </div>
        </div>

        <div class="detail-content">
            <a-row :gutter="32">

                <a-col :xs="24" :lg="16" :xl="18">

                    <div class="section-box">
                        <div class="section-header">
                            <FileTextOutlined class="section-icon" />
                            <h3>Requirement Detail</h3>
                        </div>
                        <div class="section-body">
                            <p class="desc-text">{{ issue.detail || 'No description provided.' }}</p>
                        </div>
                    </div>

                    <div class="section-box">
                        <div class="section-header">
                            <CodeOutlined class="section-icon" />
                            <h3>Assigned Developer</h3>
                        </div>
                        <div class="section-body">
                            <div class="dev-card">
                                <a-avatar size="64" style="background-color: #3b82f6; font-size: 24px;">
                                    {{ (issue.assignee?.user_name || 'D')[0]?.toUpperCase() }}
                                </a-avatar>
                                <div class="dev-info">
                                    <h4 class="dev-name">{{ issue.assignee?.user_name || 'Unassigned' }}</h4>
                                    <span class="dev-role">Responsible Developer</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section-box">
                        <div class="section-header">
                            <AuditOutlined class="section-icon" />
                            <h3>Test Result & Feedback</h3>
                        </div>
                        <div class="section-body">
                            <a-form layout="vertical">
                                <a-form-item label="Comment / Bug Report (หากไม่ผ่าน)">
                                    <a-textarea v-model:value="qcComment" :rows="5"
                                        placeholder="ระบุจุดที่พบปัญหา หรือสิ่งที่ต้องแก้ไข..."
                                        class="clean-textarea" />
                                </a-form-item>

                                <a-form-item label="Evidence Image (หลักฐาน)">
                                    <a-upload class="upload-zone">
                                        <div class="upload-content">
                                            <CloudUploadOutlined class="upload-icon" />
                                            <p>Click to Upload Screenshot</p>
                                        </div>
                                    </a-upload>
                                </a-form-item>
                            </a-form>
                        </div>
                    </div>

                </a-col>

                <a-col :xs="24" :lg="8" :xl="6">
                    <div class="sticky-panel">
                        <div class="action-card">
                            <div class="action-header">
                                <h3>Testing Actions</h3>
                            </div>
                            <div class="action-body">

                                <div class="buttons-grid">
                                    <a-popconfirm title="Confirm System Pass?" ok-text="Yes, Pass"
                                        cancel-text="Check again" @confirm="submitResult('pass')">
                                        <button class="btn-main pass">
                                            <CheckCircleFilled /> PASS
                                        </button>
                                    </a-popconfirm>

                                    <a-popconfirm title="Reject & Return to Dev?" ok-text="Yes, Reject" cancel-text="No"
                                        ok-type="danger" @confirm="submitResult('fail')">
                                        <button class="btn-main fail">
                                            <CloseCircleFilled /> FAIL
                                        </button>
                                    </a-popconfirm>
                                </div>

                                <div class="divider"></div>

                                <div class="meta-list">
                                    <div class="meta-item">
                                        <span class="label">Type</span>
                                        <span class="value">{{ issue.type?.name || '-' }}</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="label">Urgency</span>
                                        <a-tag :color="issue.urgency?.color" class="tag-pill">{{ issue.urgency?.name
                                            }}</a-tag>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </a-col>

            </a-row>
        </div>

    </a-layout>
</template>

<script>
import axios from 'axios';
import {
    ArrowLeftOutlined, FileTextOutlined, CodeOutlined, AuditOutlined,
    CloudUploadOutlined, ExperimentOutlined,
    CheckCircleFilled, CloseCircleFilled
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

export default {
    name: 'ImplementDetail',
    components: {
        ArrowLeftOutlined, FileTextOutlined, CodeOutlined, AuditOutlined,
        CloudUploadOutlined, ExperimentOutlined,
        CheckCircleFilled, CloseCircleFilled
    },
    data() {
        return {
            issue: {},
            qcComment: '',
            statusOptions: [],
            authProfile: null,
        };
    },
    async mounted() {
        await this.getAuthProfile();
        await this.fetchIssue();
        await this.fetchStatuses();
    },
    methods: {
        async getAuthProfile() {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.authProfile = res.data;
            } catch (e) {
                console.error(e);
            }
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
                // ดึง Status ทั้งหมดมาเตรียมไว้
                const res = await axios.get(import.meta.env.VITE_API_URL + '/items/statuses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.statusOptions = res.data;
            } catch (e) { console.error(e); }
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

            if (targetStatus) {
                try {
                    const payload = {
                        status: targetStatus._id,
                        remarks: this.qcComment,
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
                    message.error('Error updating status');
                }
            } else {
                message.error('ไม่พบสถานะปลายทาง (Target Status not found)');
            }
        }
    }
};
</script>

<style scoped>
/* Header - Full Width */
.detail-header {
    background: #fff;
    padding: 24px 0;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 40px;
}

.header-content {
    width: 100%;
    /* เต็มจอ */
    padding: 0 40px;
    /* Padding ซ้ายขวา */
}

.back-btn {
    padding-left: 0;
    color: #94a3b8;
    font-weight: 500;
}

.back-btn:hover {
    color: #3b82f6;
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 16px;
}

.id-tag {
    background: #eff6ff;
    color: #3b82f6;
    padding: 4px 10px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.5px;
}

.page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: -0.5px;
}

.status-pill {
    border-radius: 30px;
    padding: 6px 16px;
    font-weight: 600;
    font-size: 12px;
    border: none;
    letter-spacing: 0.5px;
}

/* Content Layout - Full Width */
.detail-content {
    width: 100%;
    /* เต็มจอ */
    padding: 0 40px 80px;
    /* Padding ซ้ายขวาเท่ากับ Header */
}

/* Section Box Style (Clean Card) */
.section-box {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
    border: 1px solid #f1f5f9;
    overflow: hidden;
    margin-bottom: 24px;
    transition: transform 0.2s;
}

.section-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.section-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
}

.section-icon {
    color: #3b82f6;
    font-size: 18px;
}

.section-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #334155;
}

.section-body {
    padding: 24px;
}

/* Text Content */
.desc-text {
    color: #475569;
    line-height: 1.8;
    white-space: pre-wrap;
    font-size: 15px;
}

/* Developer Card Style */
.dev-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
}

.dev-info {
    display: flex;
    flex-direction: column;
}

.dev-name {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.dev-role {
    font-size: 14px;
    color: #64748b;
    margin-top: 4px;
}

/* Form Elements */
.clean-textarea {
    border-radius: 12px;
    border-color: #e2e8f0;
    padding: 16px;
    font-size: 15px;
    background: #fdfdfd;
    resize: none;
}

.clean-textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.upload-zone {
    width: 100%;
    display: block;
}

.upload-content {
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    color: #94a3b8;
    cursor: pointer;
    transition: 0.3s;
    background: #fdfdfd;
}

.upload-content:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
}

.upload-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 12px;
}

/* Sticky Right Panel */
.sticky-panel {
    position: sticky;
    top: 24px;
}

.action-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.action-header {
    padding: 20px 24px;
    background: #1e293b;
    color: #fff;
}

.action-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
}

.action-body {
    padding: 24px;
}

.buttons-grid {
    display: grid;
    gap: 16px;
}

.btn-main {
    border: none;
    padding: 16px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: 0.2s;
    width: 100%;
    color: #fff;
}

.btn-main.pass {
    background: #22c55e;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-main.pass:hover {
    background: #16a34a;
    transform: translateY(-2px);
}

.btn-main.fail {
    background: #ef4444;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-main.fail:hover {
    background: #dc2626;
    transform: translateY(-2px);
}

.divider {
    height: 1px;
    background: #f1f5f9;
    margin: 24px 0;
}

.meta-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.meta-item .label {
    color: #64748b;
    font-weight: 500;
}

.meta-item .value {
    font-weight: 600;
    color: #1e293b;
}

.tag-pill {
    border-radius: 6px;
    font-weight: 600;
    border: none;
    padding: 4px 10px;
}

/* Responsive Adjustments */
@media (max-width: 992px) {
    .sticky-panel {
        position: static;
        margin-top: 32px;
    }

    .header-content,
    .detail-content {
        padding: 0 20px;
    }

    /* ลด Padding ในจอเล็ก */
}
</style>