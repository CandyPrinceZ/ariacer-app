<template>
    <a-layout style="min-height: 100vh; background: #f4f7fa;">
        <div class="page-header">
            <div class="header-content">
                <div>
                    <h2 class="page-title">🧪 QA/Tester Console</h2>
                    <p class="page-subtitle">จัดการและตรวจสอบความถูกต้องของระบบ (Quality Assurance)</p>
                </div>
            </div>
        </div>

        <a-layout-content style="padding: 24px; max-width: 1600px; margin: 0 auto; width: 100%;">

            <a-row :gutter="[20, 20]" class="mb-4">
                <a-col :xs="24" :sm="8">
                    <a-card :bordered="false" class="stat-card icon-orange-bg">
                        <a-statistic title="Ready to Test" :value="readyToTestTasks.length" suffix="Tasks">
                            <template #prefix>
                                <ExperimentOutlined />
                            </template>
                        </a-statistic>
                    </a-card>
                </a-col>
                <a-col :xs="24" :sm="8">
                    <a-card :bordered="false" class="stat-card icon-green-bg">
                        <a-statistic title="Passed Today" :value="passedCount" suffix="Tasks">
                            <template #prefix>
                                <CheckCircleOutlined />
                            </template>
                        </a-statistic>
                    </a-card>
                </a-col>
                <a-col :xs="24" :sm="8">
                    <a-card :bordered="false" class="stat-card icon-red-bg">
                        <a-statistic title="Returned (Bugs)" :value="returnedCount" suffix="Tasks">
                            <template #prefix>
                                <RollbackOutlined />
                            </template>
                        </a-statistic>
                    </a-card>
                </a-col>
            </a-row>

            <a-card :bordered="false" class="main-card">
                <template #title>
                    <span style="font-size: 16px; font-weight: 600;">
                        <UnorderedListOutlined /> รายการรอทดสอบ (Waiting for QA)
                    </span>
                </template>

                <a-table :dataSource="readyToTestTasks" :columns="columns" rowKey="_id" :pagination="{ pageSize: 10 }"
                    :locale="{ emptyText: 'เยี่ยมมาก! ไม่มีงานค้างรอตรวจสอบ' }">
                    <template #bodyCell="{ column, record }">

                        <template v-if="column.key === 'id'">
                            <span class="id-badge">{{ record.id }}</span>
                        </template>

                        <template v-if="column.key === 'name'">
                            <span style="font-weight: 500; color: #1f1f1f; font-size: 15px;">{{ record.name }}</span>
                            <div class="dev-info" v-if="record.assignee">
                                Dev: {{ record.assignee.user_name }}
                            </div>
                        </template>

                        <template v-if="column.key === 'status'">
                            <a-tag color="orange">
                                <template #icon>
                                    <ExperimentOutlined />
                                </template>
                                READY TO TEST
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'urgency'">
                            <a-tag :color="record.urgency?.color">{{ record.urgency?.name }}</a-tag>
                        </template>

                        <template v-if="column.key === 'action'">
                            <a-button type="primary" ghost size="small" @click="goToTestDetail(record._id)">
                                <AuditOutlined /> Start Testing
                            </a-button>
                        </template>

                    </template>
                </a-table>
            </a-card>
        </a-layout-content>
    </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import {
    ExperimentOutlined,
    CheckCircleOutlined,
    RollbackOutlined,
    AuditOutlined,
    UnorderedListOutlined
} from '@ant-design/icons-vue';

export default {
    name: 'ImplementView',
    components: {
        ExperimentOutlined, CheckCircleOutlined, RollbackOutlined, AuditOutlined, UnorderedListOutlined
    },
    data() {
        return {
            readyToTestTasks: [],
            authProfile: null,
            statusOptions: [],
            passedCount: 0,
            returnedCount: 0,
            columns: [
                { title: 'ID', dataIndex: 'id', key: 'id', width: 90, align: 'center' },
                { title: 'Task Name', dataIndex: 'name', key: 'name' },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 150, align: 'center' },
                { title: 'Urgency', dataIndex: 'urgency', key: 'urgency', width: 120, align: 'center' },
                { title: 'Submitted Date', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, customRender: ({ text }) => dayjs(text).format('DD/MM/YYYY HH:mm') },
                { title: 'Action', key: 'action', width: 160, align: 'center' },
            ]
        };
    },
    async mounted() {
        await this.getAuthProfile();
        await this.fetchTasks();
        await this.fetchDropdownStatusOptions();
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
        async fetchDropdownStatusOptions() {
            const token = localStorage.getItem('token');
            const res = await axios.get(import.meta.env.VITE_API_URL + '/items/statuses', { headers: { Authorization: `Bearer ${token}` } });
            this.statusOptions = res.data;
        },
        async fetchTasks() {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + `/issues`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // กรองเฉพาะงานที่สถานะเป็น 'testing' หรือ 'upserver' (คือ Dev ส่งงานมาแล้ว)
                this.readyToTestTasks = res.data.filter(task =>
                    task.status?.code === 'testing' || task.status?.code === 'upserver'
                );

                // (Mockup Stats) ถ้ามี API จริงให้ดึงจาก API
                this.passedCount = res.data.filter(t => t.status?.code === 'success').length;
                this.returnedCount = res.data.filter(t => t.status?.code === 'inProgress' && t.remark).length; // สมมติว่ามี remark คือโดนตีกลับ

            } catch (e) { console.error(e); }
        },
        async goToTestDetail(id) {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    console.error("No token found");
                    return;
                }

                const targetStatus = this.statusOptions.find(s => s.code === 'testing' || s.name.toLowerCase().includes('testing'));
                const statusIdToUse = targetStatus ? targetStatus._id : null;

                await axios.put(import.meta.env.VITE_API_URL + `/issues/${id}`, {
                    tester: this.authProfile?._id || null,
                    status: statusIdToUse
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                this.$router.push(`/implement/detail/${id}`);
            } catch (e) {
                console.error(e);
            }
        }
    }
};
</script>

<style scoped>
.page-header {
    background: #fff;
    padding: 24px 32px;
    border-bottom: 1px solid #e8e8e8;
}

.page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #1f1f1f;
}

.page-subtitle {
    margin: 4px 0 0;
    color: #8c8c8c;
    font-size: 14px;
}

.stat-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: 0.3s;
}

.stat-card:hover {
    transform: translateY(-3px);
}

.icon-orange-bg :deep(.ant-statistic-title) {
    color: #fa8c16;
    font-weight: 500;
}

.icon-green-bg :deep(.ant-statistic-title) {
    color: #52c41a;
    font-weight: 500;
}

.icon-red-bg :deep(.ant-statistic-title) {
    color: #ff4d4f;
    font-weight: 500;
}

.main-card {
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.id-badge {
    background: #f0f2f5;
    padding: 2px 8px;
    border-radius: 4px;
    color: #595959;
    font-weight: 600;
    font-size: 13px;
}

.dev-info {
    font-size: 12px;
    color: #8c8c8c;
    margin-top: 4px;
}

.mb-4 {
    margin-bottom: 24px;
}
</style>