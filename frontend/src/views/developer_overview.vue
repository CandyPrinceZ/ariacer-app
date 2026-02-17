<template>
    <a-layout style="min-height: 100vh; background: #f0f2f5;">

        <div class="page-header compact-header">
            <div class="header-content">
                <div class="header-text">
                    <h2 class="page-title">
                        <span class="icon-box">📊</span> Developer Overview
                    </h2>
                    <p class="page-subtitle">ภาพรวมภาระงานและสถานะ Developer</p>
                </div>
                <div class="header-actions">
                    <a-input v-model:value="searchText" placeholder="ค้นหาชื่อ..." style="width: 200px" size="small"
                        allow-clear>
                        <template #prefix>
                            <SearchOutlined class="text-muted" />
                        </template>
                    </a-input>
                    <a-button type="default" size="small" @click="refreshData" :loading="loading">
                        <ReloadOutlined />
                    </a-button>
                </div>
            </div>
        </div>

        <div class="content-wrapper">
            <div v-if="loading" class="loading-container">
                <a-spin size="large" />
            </div>

            <a-row v-else :gutter="[8, 8]">
                <a-col :xs="24" :md="12" :lg="8" :xl="6" v-for="dev in filteredDevelopers" :key="dev._id">
                    <a-card :bordered="false" class="dev-card" hoverable size="small">

                        <div class="dev-header">
                            <div class="dev-info">
                                <div class="avatar-wrapper">
                                    <a-avatar :size="40" :src="dev.avatar"
                                        :style="{ backgroundColor: !dev.avatar ? stringToColor(dev.user_name) : 'transparent' }">
                                        {{ dev.avatar ? '' : dev.user_name?.[0]?.toUpperCase() }}
                                    </a-avatar>
                                    <span class="status-dot" :class="getOnlineStatus(dev)"></span>
                                </div>
                                <div class="dev-meta">
                                    <h4 class="dev-name text-ellipsis">{{ dev.user_name }}</h4>
                                    <span class="dev-role">{{ dev.role_name }}</span>
                                </div>
                            </div>
                            <div class="workload-tag">
                                <a-tag :color="getWorkloadColor(dev.totalActive)" class="mini-tag">
                                    {{ getWorkloadLabel(dev.totalActive) }}
                                </a-tag>
                            </div>
                        </div>

                        <div class="stats-bar">
                            <div class="stat-box">
                                <span class="val text-primary">{{ dev.activeTasks.length }}</span>
                                <span class="lbl">Main</span>
                            </div>
                            <div class="stat-line"></div>
                            <div class="stat-box">
                                <span class="val text-purple">{{ dev.coTasks.length }}</span>
                                <span class="lbl">Co-Op</span>
                            </div>
                            <div class="stat-line"></div>
                            <div class="stat-box">
                                <span class="val text-success">{{ dev.finishedCount }}</span>
                                <span class="lbl">Done</span>
                            </div>
                        </div>

                        <a-divider style="margin: 8px 0" />

                        <div class="task-container custom-scrollbar">

                            <div v-if="dev.totalActive === 0" class="empty-state">
                                <SmileOutlined class="empty-icon" />
                                <span>No active tasks</span>
                            </div>

                            <div v-for="task in dev.activeTasks" :key="task._id" class="task-item main-task"
                                @click="goToDetail(task._id)">
                                <div class="task-top">
                                    <span class="task-id">#{{ task.id || task.issue_id }}</span>
                                    <a-tag v-if="task.urgency" :color="task.urgency.color" class="tiny-tag">
                                        {{ task.urgency.name }}
                                    </a-tag>
                                </div>
                                <div class="task-subject text-ellipsis-2">{{ task.name }}</div>
                                <div class="task-bot">
                                    <span class="status-txt" :class="task.status?.code">
                                        <component :is="getStatusIcon(task.status?.code)"
                                            :spin="task.status?.code === 'inProgress'" />
                                        {{ task.status?.name }}
                                    </span>
                                    <span v-if="task.deadline" class="due-date"
                                        :class="{ 'overdue': isOverdue(task.deadline) }">
                                        {{ formatDate(task.deadline) }}
                                    </span>
                                </div>
                            </div>

                            <div v-for="task in dev.coTasks" :key="task._id" class="task-item co-task"
                                @click="goToDetail(task._id)">
                                <div class="task-top">
                                    <span class="task-id text-purple">
                                        <TeamOutlined /> #{{ task.id || task.issue_id }}
                                    </span>
                                    <a-tag color="purple" class="tiny-tag">Co-Op</a-tag>
                                </div>
                                <div class="task-subject text-ellipsis-2">{{ task.name }}</div>
                                <div class="task-bot">
                                    <span class="owner-txt">
                                        Main: {{ task.assignee?.user_name || '?' }}
                                    </span>
                                </div>
                            </div>

                        </div>

                    </a-card>
                </a-col>
            </a-row>
        </div>
    </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import {
    SearchOutlined, ReloadOutlined, SmileOutlined, SyncOutlined, TeamOutlined,
    CheckCircleOutlined, ClockCircleOutlined, CloudUploadOutlined, AlertOutlined
} from '@ant-design/icons-vue';

export default {
    name: 'DeveloperOverview',
    components: {
        SearchOutlined, ReloadOutlined, SmileOutlined, SyncOutlined, TeamOutlined,
        CheckCircleOutlined, ClockCircleOutlined, CloudUploadOutlined, AlertOutlined
    },
    data() {
        return {
            loading: false,
            searchText: '',
            developers: [],
            issues: [],
            processedDevelopers: []
        };
    },
    computed: {
        filteredDevelopers() {
            if (!this.searchText) return this.processedDevelopers;
            const lower = this.searchText.toLowerCase();
            return this.processedDevelopers.filter(d =>
                d.user_name.toLowerCase().includes(lower) ||
                (d.role_name && d.role_name.toLowerCase().includes(lower))
            );
        }
    },
    async mounted() {
        await this.refreshData();
    },
    methods: {
        async refreshData() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [resDevs, resIssues] = await Promise.all([
                    axios.get(import.meta.env.VITE_API_URL + '/auth/users-list/dev', config),
                    axios.get(import.meta.env.VITE_API_URL + '/issues', config)
                ]);

                this.developers = Array.isArray(resDevs.data) ? resDevs.data : (resDevs.data?.data || []);
                this.issues = Array.isArray(resIssues.data) ? resIssues.data : (resIssues.data?.data || []);

                this.processData();
            } catch (error) {
                console.error("Error loading overview:", error);
            } finally {
                this.loading = false;
            }
        },

        processData() {
            this.processedDevelopers = this.developers.map(dev => {
                const devId = dev._id;

                const activeTasks = [];
                const coTasks = [];
                let finishedCount = 0;

                this.issues.forEach(issue => {
                    const status = issue.status?.code;
                    const isDone = status === 'success' || status === 'finished' || status === 'rejected';

                    const assigneeId = issue.assignee?._id || issue.assignee;
                    const isMain = assigneeId === devId;

                    const coList = issue.co_assignee || [];
                    const isCo = Array.isArray(coList) && coList.some(u => {
                        const uId = u._id || u;
                        return uId === devId;
                    });

                    if (isMain) {
                        if (isDone) finishedCount++;
                        else activeTasks.push(issue);
                    } else if (isCo) {
                        if (!isDone) coTasks.push(issue);
                    }
                });

                const totalActive = activeTasks.length + coTasks.length;

                return {
                    ...dev,
                    activeTasks,
                    coTasks,
                    finishedCount,
                    totalActive
                };
            });

            this.processedDevelopers.sort((a, b) => b.totalActive - a.totalActive);
        },

        getOnlineStatus(dev) {
            // Mock logic: ถ้างานเยอะ = สีแดง, งานน้อย = สีเขียว (ปรับตามจริงได้ถ้ามี field online)
            return dev.totalActive > 3 ? 'busy' : 'online';
        },
        getWorkloadLabel(count) {
            if (count === 0) return 'Free';
            if (count <= 2) return 'Good';
            if (count <= 4) return 'Busy';
            return 'Full';
        },
        getWorkloadColor(count) {
            if (count === 0) return 'success';
            if (count <= 2) return 'blue';
            if (count <= 4) return 'orange';
            return 'red';
        },
        getStatusIcon(code) {
            const map = { inProgress: 'SyncOutlined', success: 'CheckCircleOutlined', testing: 'AlertOutlined', upserver: 'CloudUploadOutlined' };
            return map[code] || 'ClockCircleOutlined';
        },
        isOverdue(date) { return dayjs().isAfter(dayjs(date)); },
        formatDate(date) { return dayjs(date).format('DD/MM'); },
        stringToColor(str) {
            let hash = 0;
            for (let i = 0; i < (str?.length || 0); i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + '00000'.substring(0, 6 - c.length) + c;
        },
        goToDetail(id) {
            this.$router.push(`/Issue/detail/${id}`);
        }
    }
};
</script>

<style scoped>
/* Layout & Header */
.compact-header {
    background: #fff;
    padding: 10px 16px;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1f1f1f;
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-subtitle {
    margin: 0;
    color: #8c8c8c;
    font-size: 12px;
}

.icon-box {
    background: #e6f7ff;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 16px;
}

.header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.content-wrapper {
    padding: 8px;
}

.loading-container {
    display: flex;
    justify-content: center;
    padding-top: 50px;
}

/* Developer Card */
.dev-card {
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.dev-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #d9d9d9;
}

/* Header Profile */
.dev-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.dev-info {
    display: flex;
    gap: 8px;
    align-items: center;
    overflow: hidden;
}

.avatar-wrapper {
    position: relative;
}

.status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #fff;
}

.status-dot.online {
    background-color: #52c41a;
}

.status-dot.busy {
    background-color: #ff4d4f;
}

.dev-name {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #262626;
    line-height: 1.2;
}

.dev-role {
    font-size: 11px;
    color: #8c8c8c;
    display: block;
}

.mini-tag {
    font-size: 10px;
    padding: 0 4px;
    height: 18px;
    line-height: 16px;
    cursor: default;
}

/* Stats Bar */
.stats-bar {
    display: flex;
    justify-content: space-between;
    background: #f8fafc;
    border-radius: 6px;
    padding: 4px 8px;
    border: 1px solid #f0f0f0;
}

.stat-box {
    text-align: center;
    flex: 1;
}

.stat-line {
    width: 1px;
    background: #e2e8f0;
    height: 20px;
    margin: 0 4px;
}

.val {
    display: block;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
}

.lbl {
    font-size: 9px;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
}

.text-primary {
    color: #1890ff;
}

.text-purple {
    color: #722ed1;
}

.text-success {
    color: #52c41a;
}

/* Tasks Area */
.task-container {
    flex: 1;
    min-height: 120px;
    max-height: 350px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 2px;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 4px;
}

/* Task Items */
.task-item {
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 8px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
}

/* Color Coding */
.main-task {
    border-left: 3px solid #1890ff;
}

.main-task:hover {
    background: #f0f5ff;
    border-color: #adc6ff;
    border-left-color: #1890ff;
}

.co-task {
    border-left: 3px solid #722ed1;
    background: #f9f0ff;
}

.co-task:hover {
    background: #efdbff;
    border-color: #d3adf7;
    border-left-color: #722ed1;
}

/* Task Content */
.task-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
}

.task-id {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
}

.task-subject {
    font-size: 12px;
    font-weight: 500;
    color: #334155;
    margin-bottom: 4px;
    line-height: 1.3;
}

.task-bot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
}

.tiny-tag {
    font-size: 9px;
    padding: 0 3px;
    line-height: 14px;
    border: none;
    margin: 0;
}

.status-txt {
    display: flex;
    align-items: center;
    gap: 3px;
    font-weight: 600;
}

.status-txt.inProgress {
    color: #1890ff;
}

.status-txt.success {
    color: #52c41a;
}

.status-txt.testing {
    color: #fa8c16;
}

.due-date {
    color: #94a3b8;
}

.due-date.overdue {
    color: #ff4d4f;
    font-weight: 700;
}

.owner-txt {
    color: #64748b;
    font-style: italic;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 110px;
}

.text-ellipsis-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -moz-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 20px 0;
    color: #cbd5e1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-top: auto;
    margin-bottom: auto;
}

.empty-icon {
    font-size: 20px;
}

/* Mobile */
@media (max-width: 768px) {
    .compact-header {
        padding: 10px;
    }

    .content-wrapper {
        padding: 8px;
    }

    .page-subtitle {
        display: none;
    }
}
</style>