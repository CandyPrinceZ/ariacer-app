<template>
    <a-layout style="min-height: 100vh; background: #f5f7fa;">

        <div class="page-header compact-header">
            <div class="header-content">
                <div class="header-text">
                    <h2 class="page-title">
                        <span class="icon-box">🧪</span> QA/Tester Console
                    </h2>
                    <p class="page-subtitle">จัดการและตรวจสอบความถูกต้องของระบบ</p>
                </div>

                <div class="header-actions">
                    <a-button type="default" @click="fetchTasks" :loading="loading">
                        <ReloadOutlined /> Refresh
                    </a-button>
                </div>
            </div>
        </div>

        <div style="padding: 12px; height: calc(100vh - 80px); display: flex; flex-direction: column;">

            <a-row :gutter="[12, 12]" style="margin-bottom: 12px; flex-shrink: 0;">
                <a-col :xs="24" :sm="8">
                    <a-card :bordered="false" class="stat-card icon-orange-bg" bodyStyle="padding: 16px;">
                        <a-statistic title="Ready to Test" :value="statReady">
                            <template #prefix>
                                <ExperimentOutlined />
                            </template>
                        </a-statistic>
                    </a-card>
                </a-col>
                <a-col :xs="24" :sm="8">
                    <a-card :bordered="false" class="stat-card icon-blue-bg" bodyStyle="padding: 16px;">
                        <a-statistic title="In Testing (My Tasks)" :value="statTesting">
                            <template #prefix>
                                <AuditOutlined />
                            </template>
                        </a-statistic>
                    </a-card>
                </a-col>
                <a-col :xs="24" :sm="8">
                    <a-card :bordered="false" class="stat-card icon-green-bg" bodyStyle="padding: 16px;">
                        <a-statistic title="Passed Today" :value="statPassed">
                            <template #prefix>
                                <CheckCircleOutlined />
                            </template>
                        </a-statistic>
                    </a-card>
                </a-col>
            </a-row>

            <a-card :bordered="false" class="main-card full-height-card"
                bodyStyle="padding: 16px 16px 0 16px; height: 100%; display: flex; flex-direction: column;">
                <template #title>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                        <span style="font-size: 15px; font-weight: 600;">
                            <UnorderedListOutlined /> Testing Queue
                        </span>
                        <a-radio-group v-model:value="filterMode" button-style="solid" size="small">
                            <a-radio-button value="all">All Pending</a-radio-button>
                            <a-radio-button value="upserver">Ready</a-radio-button>
                            <a-radio-button value="testing">Mine</a-radio-button>
                        </a-radio-group>
                    </div>
                </template>

                <a-table :dataSource="filteredTableData" :columns="columns" rowKey="_id"
                    :pagination="{ pageSize: 10, size: 'small' }" :loading="loading" size="middle"
                    :scroll="{ y: 'calc(100vh - 300px)' }" :locale="{ emptyText: 'เยี่ยมมาก! ไม่มีงานค้างรอตรวจสอบ' }"
                    style="flex-grow: 1; overflow: hidden;">
                    <template #bodyCell="{ column, record }">

                        <template v-if="column.key === 'id'">
                            <span class="id-badge">{{ record.issue_id || record.id || 'N/A' }}</span>
                        </template>

                        <template v-if="column.key === 'name'">
                            <div class="task-name text-ellipsis">{{ record.name }}</div>
                            <div class="meta-info">
                                <span v-if="record.assignee" style="margin-right: 8px;">
                                    <UserOutlined /> {{ record.assignee.user_name }}
                                </span>
                                <a-tooltip v-if="record.reporter" :title="'Reporter: ' + record.reporter.user_name">
                                    <span>
                                        <InfoCircleOutlined />
                                    </span>
                                </a-tooltip>
                            </div>
                        </template>

                        <template v-if="column.key === 'status'">
                            <a-tag :color="getStatusColor(record.status?.code)"
                                style="min-width: 80px; text-align: center;">
                                <template #icon>
                                    <SyncOutlined spin v-if="record.status?.code === 'testing'" />
                                    <ExperimentOutlined v-else />
                                </template>
                                {{ record.status?.name || record.status?.code || 'UNKNOWN' }}
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'urgency'">
                            <a-tag :color="record.urgency?.color || 'default'">
                                {{ record.urgency?.name }}
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'action'">
                            <a-button v-if="record.status?.code === 'upserver'" type="primary" size="small"
                                @click="startTesting(record)" style="font-size: 12px;">
                                <AuditOutlined /> Start
                            </a-button>

                            <a-button v-else-if="record.status?.code === 'testing'" type="default" size="small"
                                class="continue-btn" @click="goToTestDetail(record._id)" style="font-size: 12px;">
                                Continue
                                <RightOutlined />
                            </a-button>
                        </template>

                    </template>
                </a-table>
            </a-card>
        </div>
    </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';
import {
    ExperimentOutlined, CheckCircleOutlined, AuditOutlined,
    UnorderedListOutlined, ReloadOutlined, UserOutlined, InfoCircleOutlined,
    SyncOutlined, RightOutlined
} from '@ant-design/icons-vue';

export default {
    name: 'ImplementView',
    components: {
        ExperimentOutlined, CheckCircleOutlined, AuditOutlined,
        UnorderedListOutlined, ReloadOutlined, UserOutlined, InfoCircleOutlined,
        SyncOutlined, RightOutlined
    },
    data() {
        return {
            loading: false,
            allTasks: [],
            authProfile: null,
            statusOptions: [],
            filterMode: 'all',
            columns: [
                { title: 'ID', dataIndex: 'id', key: 'id', width: 90, align: 'center' },
                { title: 'Task / Subject', dataIndex: 'name', key: 'name', ellipsis: true }, // เพิ่ม ellipsis
                { title: 'Status', dataIndex: 'status', key: 'status', width: 130, align: 'center' },
                { title: 'Urgency', dataIndex: 'urgency', key: 'urgency', width: 90, align: 'center' },
                // ปรับ format วันที่ให้สั้นลง
                { title: 'Submitted', dataIndex: 'updatedAt', key: 'updatedAt', width: 140, align: 'center', customRender: ({ text }) => dayjs(text).format('DD/MM/YY HH:mm') },
                { title: 'Action', key: 'action', width: 100, align: 'center' },
            ]
        };
    },
    computed: {
        filteredTableData() {
            if (this.filterMode === 'all') {
                return this.allTasks.filter(t => ['upserver', 'testing'].includes(t.status?.code));
            }
            return this.allTasks.filter(t => t.status?.code === this.filterMode);
        },
        statReady() { return this.allTasks.filter(t => t.status?.code === 'upserver').length; },
        statTesting() { return this.allTasks.filter(t => t.status?.code === 'testing').length; },
        statPassed() { return this.allTasks.filter(t => t.status?.code === 'success').length; }
    },
    async mounted() {
        this.loading = true;
        await Promise.all([
            this.getAuthProfile(),
            this.fetchDropdownStatusOptions()
        ]);
        await this.fetchTasks();
        this.loading = false;
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
            } catch (e) { console.error(e); }
        },
        async fetchDropdownStatusOptions() {
            const token = localStorage.getItem('token');
            const res = await axios.get(import.meta.env.VITE_API_URL + '/items/statuses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.statusOptions = res.data;
        },
        async fetchTasks() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + `/issues/tester/list`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.allTasks = res.data;
            } catch (e) {
                console.error(e);
                message.error('โหลดข้อมูลไม่สำเร็จ');
            } finally {
                this.loading = false;
            }
        },
        getStatusColor(code) {
            if (code === 'upserver') return 'orange';
            if (code === 'testing') return 'blue';
            if (code === 'success') return 'green';
            return 'default';
        },
        async startTesting(record) {
            try {
                const token = localStorage.getItem('token');
                const testingStatus = this.statusOptions.find(s => s.code === 'testing');
                if (!testingStatus) {
                    message.error('ไม่พบสถานะ Testing ในระบบ');
                    return;
                }
                await axios.put(import.meta.env.VITE_API_URL + `/issues/${record._id}`, {
                    tester: this.authProfile._id,
                    status: testingStatus._id
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success(`เริ่มทดสอบงาน: ${record.name}`);
                this.goToTestDetail(record._id);
            } catch (e) {
                console.error(e);
                message.error('เกิดข้อผิดพลาดในการรับงาน');
            }
        },
        goToTestDetail(id) {
            this.$router.push(`/implement/detail/${id}`);
        }
    }
};
</script>

<style scoped>
/* Compact Header */
.compact-header {
    background: #fff;
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    margin-bottom: 16px;
}

/* Flex Container เพื่อจัดซ้าย-ขวา */
.header-content {
    display: flex;
    justify-content: space-between;
    /* ดันข้อความไปซ้าย ปุ่มไปขวา */
    align-items: center;
    /* จัดกึ่งกลางแนวตั้ง */
    gap: 16px;
    /* ระยะห่างขั้นต่ำเผื่อจอเล็ก */
}

.header-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    /* ระยะห่างระหว่าง Title กับ Subtitle */
}

.page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f1f1f;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.2;
}

.page-subtitle {
    margin: 0;
    color: #8c8c8c;
    font-size: 13px;
    line-height: 1.5;
}

/* ตกแต่ง Icon ให้ดูดีขึ้น (Optional) */
.icon-box {
    background: #f0f5ff;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 18px;
}

/* Tighter Cards */
.stat-card {
    border-radius: 8px;
    /* ลดความโค้งมน */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: 0.2s;
    border: 1px solid #f0f0f0;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

/* Custom Colors for Stats (Adjusted for tighter layout) */
.icon-orange-bg :deep(.ant-statistic-title) {
    color: #fa8c16;
    font-size: 13px;
    margin-bottom: 4px;
}

.icon-blue-bg :deep(.ant-statistic-title) {
    color: #1890ff;
    font-size: 13px;
    margin-bottom: 4px;
}

.icon-green-bg :deep(.ant-statistic-title) {
    color: #52c41a;
    font-size: 13px;
    margin-bottom: 4px;
}

:deep(.ant-statistic-content) {
    font-size: 20px;
    font-weight: 600;
}

/* Main Card Full Height */
.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
    flex-grow: 1;
    /* ยืดเต็มพื้นที่ */
}

/* ปรับ header ของ main card ให้อยู่ชิดขอบมากขึ้น */
:deep(.ant-card-head) {
    padding: 0 16px;
    min-height: 48px;
    border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-card-head-title) {
    padding: 12px 0;
}

/* Table Elements */
.id-badge {
    background: #f5f7fa;
    border: 1px solid #d9d9d9;
    padding: 1px 6px;
    border-radius: 4px;
    color: #666;
    font-weight: 600;
    font-size: 11px;
    font-family: monospace;
}

.task-name {
    font-weight: 500;
    color: #262626;
    font-size: 14px;
    margin-bottom: 2px;
}

/* Utility class for text truncation */
.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.meta-info {
    font-size: 11px;
    color: #999;
    display: flex;
    align-items: center;
}

.continue-btn {
    border-color: #1890ff;
    color: #1890ff;
}

/* ปรับ scrollbar ของตารางให้ดูดีขึ้น */
:deep(.ant-table-body::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
}

:deep(.ant-table-body::-webkit-scrollbar-thumb) {
    background: #ccc;
    border-radius: 3px;
}

/* Responsive: ถ้าจอเล็กมากให้เรียงลงมาแนวตั้ง */
@media (max-width: 576px) {
    .header-content {
        flex-direction: column;
        align-items: flex-start;
    }

    .header-actions {
        width: 100%;
        margin-top: 12px;
    }

    .header-actions button {
        width: 100%;
        /* ปุ่มเต็มจอในมือถือ */
    }
}
</style>