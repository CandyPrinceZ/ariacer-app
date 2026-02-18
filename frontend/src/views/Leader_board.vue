<template>
    <a-layout style="min-height: 100vh; background: #f0f2f5;">

        <div class="page-header compact-header">
            <div class="header-content">
                <div class="header-text">
                    <h2 class="page-title">
                        <span class="icon-box">🏆</span> Hall of Fame
                    </h2>
                    <p class="page-subtitle">ทำเนียบยอดฝีมือและสถิติประจำทีม</p>
                </div>
                <div class="header-actions">
                    <a-button class="refresh-btn" @click="fetchStats" :loading="loading">
                        <template #icon>
                            <ReloadOutlined />
                        </template>
                        <span class="hidden-xs">Refresh Data</span>
                    </a-button>
                </div>
            </div>
        </div>

        <div class="content-wrapper-fluid">
            <div v-if="loading" class="loading-container">
                <a-spin size="large" tip="Loading rankings..." />
            </div>

            <div v-else>

                <a-row :gutter="[12, 12]" class="mb-4">
                    <a-col :xs="24" :sm="8" :md="8" :lg="8">
                        <div class="kpi-card blue-border">
                            <div class="kpi-content">
                                <div class="kpi-label">Total Issues</div>
                                <div class="kpi-value">{{ stats.summary.total }}</div>
                            </div>
                            <div class="kpi-icon-bg">
                                <FileTextOutlined />
                            </div>
                        </div>
                    </a-col>
                    <a-col :xs="24" :sm="8" :md="8" :lg="8">
                        <div class="kpi-card orange-border">
                            <div class="kpi-content">
                                <div class="kpi-label">In Progress</div>
                                <div class="kpi-value text-orange">{{ stats.summary.active }}</div>
                            </div>
                            <div class="kpi-icon-bg text-orange">
                                <FireOutlined />
                            </div>
                        </div>
                    </a-col>
                    <a-col :xs="24" :sm="8" :md="8" :lg="8">
                        <div class="kpi-card green-border">
                            <div class="kpi-content">
                                <div class="kpi-label">Completed</div>
                                <div class="kpi-value text-success">{{ stats.summary.success }}</div>
                            </div>
                            <div class="kpi-icon-bg text-success">
                                <CheckCircleOutlined />
                            </div>
                        </div>
                    </a-col>
                </a-row>

                <a-card :bordered="false" class="main-card">
                    <a-tabs type="line" size="large" class="custom-tabs">

                        <a-tab-pane key="devs">
                            <template #tab><span>
                                    <TrophyOutlined /> Top Developers
                                </span></template>

                            <div class="podium-container" v-if="top3Devs.length > 0">

                                <div class="podium-col rank-2" v-if="top3Devs[1]">
                                    <div class="avatar-wrapper">
                                        <div class="badge-pill silver">2nd</div>
                                        <a-avatar :size="80" class="podium-avatar silver-ring"
                                            :src="isValidUrl(top3Devs[1].user.avatar) ? top3Devs[1].user.avatar : null"
                                            :style="{ backgroundColor: stringToColor(top3Devs[1].user.user_name) }">
                                            <template #icon v-if="!isValidUrl(top3Devs[1].user.avatar)">{{
                                                getInitials(top3Devs[1].user.user_name) }}</template>
                                        </a-avatar>
                                    </div>
                                    <div class="podium-details">
                                        <div class="p-name">{{ top3Devs[1].user.user_name }}</div>
                                        <div class="p-pts">{{ top3Devs[1].success }} Pts</div>
                                    </div>
                                    <div class="pillar silver-pillar"></div>
                                </div>

                                <div class="podium-col rank-1" v-if="top3Devs[0]">
                                    <div class="crown-floating">👑</div>
                                    <div class="avatar-wrapper">
                                        <div class="badge-pill gold">1st</div>
                                        <a-avatar :size="110" class="podium-avatar gold-ring"
                                            :src="isValidUrl(top3Devs[0].user.avatar) ? top3Devs[0].user.avatar : null"
                                            :style="{ backgroundColor: stringToColor(top3Devs[0].user.user_name) }">
                                            <template #icon v-if="!isValidUrl(top3Devs[0].user.avatar)">{{
                                                getInitials(top3Devs[0].user.user_name) }}</template>
                                        </a-avatar>
                                    </div>
                                    <div class="podium-details">
                                        <div class="p-name gold-text">{{ top3Devs[0].user.user_name }}</div>
                                        <div class="p-pts gold-text">{{ top3Devs[0].success }} Pts</div>
                                    </div>
                                    <div class="pillar gold-pillar">
                                        <div class="shine"></div>
                                    </div>
                                </div>

                                <div class="podium-col rank-3" v-if="top3Devs[2]">
                                    <div class="avatar-wrapper">
                                        <div class="badge-pill bronze">3rd</div>
                                        <a-avatar :size="70" class="podium-avatar bronze-ring"
                                            :src="isValidUrl(top3Devs[2].user.avatar) ? top3Devs[2].user.avatar : null"
                                            :style="{ backgroundColor: stringToColor(top3Devs[2].user.user_name) }">
                                            <template #icon v-if="!isValidUrl(top3Devs[2].user.avatar)">{{
                                                getInitials(top3Devs[2].user.user_name) }}</template>
                                        </a-avatar>
                                    </div>
                                    <div class="podium-details">
                                        <div class="p-name">{{ top3Devs[2].user.user_name }}</div>
                                        <div class="p-pts">{{ top3Devs[2].success }} Pts</div>
                                    </div>
                                    <div class="pillar bronze-pillar"></div>
                                </div>

                            </div>

                            <a-divider />

                            <div class="list-section">
                                <h4 class="list-title">Runner-ups Ranking</h4>
                                <a-table :dataSource="restDevs" :columns="devColumns" rowKey="user._id"
                                    :pagination="false" size="middle">
                                    <template #bodyCell="{ column, record, index }">
                                        <template v-if="column.key === 'rank'">
                                            <div class="rank-circle">{{ index + 4 }}</div>
                                        </template>
                                        <template v-if="column.key === 'user'">
                                            <div class="user-info">
                                                <a-avatar :size="36"
                                                    :src="isValidUrl(record.user.avatar) ? record.user.avatar : null"
                                                    :style="{ backgroundColor: stringToColor(record.user.user_name) }">
                                                    <template #icon v-if="!isValidUrl(record.user.avatar)">{{
                                                        getInitials(record.user.user_name) }}</template>
                                                </a-avatar>
                                                <div class="user-meta">
                                                    <span class="u-name">{{ record.user.user_name }}</span>
                                                    <span class="u-role hidden-xs">{{ record.user.role_name ||
                                                        'Developer' }}</span>
                                                </div>
                                            </div>
                                        </template>
                                        <template v-if="column.key === 'success'">
                                            <span class="score-text">{{ record.success }}</span>
                                        </template>
                                        <template v-if="column.key === 'rate'">
                                            <div class="progress-box">
                                                <a-progress :percent="calculateSuccessRate(record)" size="small"
                                                    status="active"
                                                    :stroke-color="{ '0%': '#108ee9', '100%': '#87d068' }" />
                                            </div>
                                        </template>
                                    </template>
                                </a-table>
                            </div>

                        </a-tab-pane>

                        <a-tab-pane key="reporters">
                            <template #tab><span>
                                    <NotificationOutlined /> Top Reporters
                                </span></template>
                            <a-table :dataSource="stats.byReporter" :columns="reporterColumns" rowKey="user._id"
                                :pagination="{ pageSize: 10 }" size="middle">
                                <template #bodyCell="{ column, record, index }">
                                    <template v-if="column.key === 'rank'">
                                        <div class="rank-medal-icon">
                                            <span v-if="index === 0">🥇</span>
                                            <span v-else-if="index === 1">🥈</span>
                                            <span v-else-if="index === 2">🥉</span>
                                            <span v-else class="rank-circle small">{{ index + 1 }}</span>
                                        </div>
                                    </template>
                                    <template v-if="column.key === 'user'">
                                        <div class="user-info">
                                            <a-avatar :size="36"
                                                :src="isValidUrl(record.user.avatar) ? record.user.avatar : null"
                                                :style="{ backgroundColor: stringToColor(record.user.user_name) }">
                                                <template #icon v-if="!isValidUrl(record.user.avatar)">{{
                                                    getInitials(record.user.user_name) }}</template>
                                            </a-avatar>
                                            <span class="u-name ml-2">{{ record.user.user_name }}</span>
                                        </div>
                                    </template>
                                    <template v-if="column.key === 'total'">
                                        <a-tag color="processing" class="bold-tag">{{ record.total }} Issues</a-tag>
                                    </template>
                                </template>
                            </a-table>
                        </a-tab-pane>

                    </a-tabs>
                </a-card>
            </div>
        </div>
    </a-layout>
</template>

<script>
import axios from 'axios';
import {
    ReloadOutlined, TrophyOutlined, NotificationOutlined,
    FileTextOutlined, FireOutlined, CheckCircleOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

export default {
    name: 'LeaderboardView',
    components: {
        ReloadOutlined, TrophyOutlined, NotificationOutlined,
        FileTextOutlined, FireOutlined, CheckCircleOutlined
    },
    data() {
        return {
            loading: false,
            stats: { summary: { total: 0, active: 0, success: 0 }, byReporter: [], byAssignee: [] },
            devColumns: [
                { title: '#', key: 'rank', width: 60, align: 'center' },
                { title: 'Developer', key: 'user' },
                { title: 'Completed', key: 'success', width: 120, align: 'center', sorter: (a, b) => a.success - b.success },
                { title: 'Active', dataIndex: 'active', width: 100, align: 'center', responsive: ['sm'] },
                { title: 'Success Rate', key: 'rate', width: 180, align: 'right', responsive: ['sm'] },
            ],
            reporterColumns: [
                { title: '#', key: 'rank', width: 60, align: 'center' },
                { title: 'User', key: 'user' },
                { title: 'Reported', key: 'total', width: 120, align: 'center', sorter: (a, b) => a.total - b.total },
                { title: 'Resolved', dataIndex: 'success', width: 100, align: 'center', responsive: ['sm'] }
            ]
        };
    },
    computed: {
        top3Devs() { return this.stats.byAssignee.slice(0, 3); },
        restDevs() { return this.stats.byAssignee.slice(3); }
    },
    mounted() { this.fetchStats(); },
    methods: {
        async fetchStats() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/issues/stats', { headers: { Authorization: `Bearer ${token}` } });
                this.stats = res.data;
            } catch (e) { console.error(e); message.error("Failed to load leaderboard."); } finally { this.loading = false; }
        },
        isValidUrl(url) { return url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image')); },
        calculateSuccessRate(record) { return record.total === 0 ? 0 : Math.round((record.success / record.total) * 100); },
        stringToColor(str) {
            if (!str) return '#1890ff';
            let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            return '#' + '00000'.substring(0, 6 - str.length) + (hash & 0x00FFFFFF).toString(16).toUpperCase();
        },
        getInitials(name) { return name ? name.charAt(0).toUpperCase() : '?'; }
    }
};
</script>

<style scoped>
/* 1. Header */
.compact-header {
    background: #fff;
    padding: 12px 24px;
    border-bottom: 1px solid #e0e0e0;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
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
    background: #e6f7ff;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 18px;
    color: #1890ff;
}

.refresh-btn {
    border-radius: 6px;
}

.content-wrapper-fluid {
    width: 100%;
    padding: 12px;
}

.loading-container {
    display: flex;
    justify-content: center;
    padding-top: 50px;
}

.mb-4 {
    margin-bottom: 24px;
}

/* 3. Modern KPI Cards */
.kpi-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s;
    border-left-width: 4px;
    border-left-style: solid;
    height: 100%;
    /* Ensure equal height */
}

.kpi-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.blue-border {
    border-left-color: #1890ff;
}

.orange-border {
    border-left-color: #fa8c16;
}

.green-border {
    border-left-color: #52c41a;
}

.kpi-label {
    font-size: 12px;
    color: #8c8c8c;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
}

.kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: #262626;
    line-height: 1.2;
    margin-top: 4px;
}

.kpi-icon-bg {
    font-size: 32px;
    color: #1890ff;
    opacity: 0.5;
}

.text-orange {
    color: #fa8c16;
}

.text-success {
    color: #52c41a;
}

/* 4. Podium Area */
.main-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.podium-container {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 20px;
    padding: 40px 0 20px;
    margin-bottom: 30px;
    /* Centering */
    width: 100%;
}

.podium-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 160px;
    position: relative;
}

.rank-1 {
    z-index: 2;
}

/* Avatar Styling */
.avatar-wrapper {
    position: relative;
    margin-bottom: 16px;
}

.podium-avatar {
    border: 4px solid #fff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    font-size: 24px;
    color: #fff;
}

.gold-ring {
    border-color: #ffec3d;
}

.silver-ring {
    border-color: #f0f0f0;
}

.bronze-ring {
    border-color: #ffe7ba;
}

.badge-pill {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 800;
    color: #fff;
    z-index: 5;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    border: 2px solid #fff;
}

.gold {
    background: linear-gradient(135deg, #fadb14, #d4b106);
}

.silver {
    background: linear-gradient(135deg, #d9d9d9, #999);
}

.bronze {
    background: linear-gradient(135deg, #fa8c16, #d46b08);
}

.crown-floating {
    font-size: 36px;
    position: absolute;
    top: -50px;
    animation: float 3s infinite ease-in-out;
}

/* Podium Info */
.podium-details {
    margin-bottom: 12px;
}

.p-name {
    font-weight: 700;
    font-size: 16px;
    color: #262626;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
}

.p-pts {
    font-size: 14px;
    font-weight: 600;
    color: #8c8c8c;
}

.gold-text {
    color: #d48806;
    font-size: 18px;
}

/* Pillars */
.pillar {
    width: 100%;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    position: relative;
    overflow: hidden;
}

.gold-pillar {
    height: 160px;
    background: linear-gradient(180deg, #fff1b8 0%, #ffe58f 100%);
}

.silver-pillar {
    height: 110px;
    background: linear-gradient(180deg, #f5f5f5 0%, #d9d9d9 100%);
}

.bronze-pillar {
    height: 80px;
    background: linear-gradient(180deg, #fff7e6 0%, #ffd591 100%);
}

.shine {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
    transform: skewX(-20deg) translateX(-150%);
    animation: shine 3s infinite;
}

/* 5. Lists */
.list-section {
    margin-top: 20px;
}

.list-title {
    font-size: 16px;
    font-weight: 700;
    color: #595959;
    margin-bottom: 16px;
    border-left: 4px solid #1890ff;
    padding-left: 12px;
}

.rank-circle {
    width: 28px;
    height: 28px;
    background: #f0f2f5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #8c8c8c;
}

.rank-circle.small {
    width: 24px;
    height: 24px;
    font-size: 11px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-meta {
    display: flex;
    flex-direction: column;
    text-align: left;
}

.u-name {
    font-weight: 600;
    font-size: 14px;
    color: #262626;
}

.u-role {
    font-size: 12px;
    color: #8c8c8c;
}

.score-text {
    font-weight: 700;
    color: #262626;
    font-size: 15px;
}

.progress-box {
    width: 120px;
}

.bold-tag {
    font-weight: 600;
    border: none;
    font-size: 13px;
    padding: 4px 10px;
}

.rank-medal-icon {
    font-size: 22px;
    display: flex;
    justify-content: center;
}

.ml-2 {
    margin-left: 10px;
}

/* Animations */
@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-8px);
    }
}

@keyframes shine {
    100% {
        transform: skewX(-20deg) translateX(200%);
    }
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .compact-header {
        padding: 12px 16px;
    }

    .content-wrapper-fluid {
        padding: 12px;
    }

    .kpi-card {
        padding: 12px;
    }

    .kpi-value {
        font-size: 20px;
    }

    .podium-container {
        width: 100%;
        gap: 8px;
        padding-top: 30px;
        margin-bottom: 20px;
    }

    .podium-col {
        width: 32%;
    }

    .gold-pillar {
        height: 100px;
    }

    .silver-pillar {
        height: 70px;
    }

    .bronze-pillar {
        height: 50px;
    }

    .podium-avatar {
        width: 54px !important;
        height: 54px !important;
        line-height: 54px !important;
        font-size: 20px !important;
    }

    .rank-1 .podium-avatar {
        width: 72px !important;
        height: 72px !important;
        font-size: 28px !important;
    }

    .hidden-xs {
        display: none;
    }

    .p-name {
        font-size: 12px;
    }
}
</style>