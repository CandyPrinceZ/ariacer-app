<template>
    <a-layout style="min-height: 100vh; background: #f5f7fa;">

        <div class="page-header compact-header">
            <div class="header-content">
                <div class="header-text">
                    <h2 class="page-title">
                        <span class="icon-box">📋</span> Issue Management
                    </h2>
                    <p class="page-subtitle">จัดการรายการแจ้งปัญหา ติดตามสถานะ และมอบหมายงาน</p>
                </div>
                <div class="header-actions">
                    <a-button type="default" size="small" @click="deleteAllSuccess" :loading="loading">
                        <ReloadOutlined /> <span class="btn-text">Delete All Success Issues</span>
                    </a-button>
                </div>
            </div>
        </div>

        <div class="content-wrapper">
            <a-card :bordered="false" class="main-card" :bodyStyle="{ padding: '0' }">

                <div class="table-toolbar">

                    <div class="filters-wrapper">
                        <div class="filter-item search-box">
                            <a-input v-model:value="filters.search" placeholder="Search by title or detail..."
                                class="modern-input" allow-clear @pressEnter="fetchIssues" size="small">
                                <template #prefix>
                                    <SearchOutlined class="text-muted" />
                                </template>
                            </a-input>
                        </div>

                        <div class="filter-item">
                            <a-select v-model:value="filters.status" placeholder="Status" allow-clear
                                class="modern-select" @change="fetchIssues" :dropdownMatchSelectWidth="false"
                                size="small">
                                <a-select-option v-for="s in options.statuses" :key="s._id" :value="s._id">
                                    {{ s.name }}
                                </a-select-option>
                            </a-select>
                        </div>

                        <div class="filter-item">
                            <a-select v-model:value="filters.urgency" placeholder="Urgency" allow-clear
                                class="modern-select" @change="fetchIssues" :dropdownMatchSelectWidth="false"
                                size="small">
                                <a-select-option v-for="u in options.urgencies" :key="u._id" :value="u._id">
                                    <a-tag :color="u.color">{{ u.name }}</a-tag>
                                </a-select-option>
                            </a-select>
                        </div>

                        <div class="filter-actions">
                            <a-button type="primary" class="btn-filter" @click="fetchIssues" size="small">
                                <FilterOutlined /> Filter
                            </a-button>
                            <a-button v-if="hasFilters" type="dashed" class="btn-reset" @click="resetFilters">
                                Reset Filters
                            </a-button>
                        </div>
                    </div>

                    <div class="toolbar-footer">
                        <span class="total-badge">รายการทั้งหมด: <strong>{{ pagination.total }}</strong></span>
                    </div>

                </div>

                <a-table :columns="columns" :data-source="issues" :loading="loading" rowKey="_id"
                    :pagination="pagination" @change="handleTableChange" size="middle" :scroll="{ x: 900 }">
                    <template #bodyCell="{ column, record }">

                        <template v-if="column.key === 'id'">
                            <span class="id-badge" @click="$router.push(`Issue/detail/${record._id}`)">
                                {{ record.issue_id || record.id || '...' }}
                            </span>
                        </template>

                        <template v-if="column.key === 'name'">
                            <div class="title-cell">
                                <a class="issue-link" @click="$router.push(`Issue/detail/${record._id}`)">
                                    {{ record.name }}
                                </a>
                                <span class="issue-type-badge">{{ record.type?.name }}</span>
                            </div>
                        </template>

                        <template v-if="column.key === 'status'">
                            <a-tag :color="getStatusColor(record.status?.code)">
                                {{ record.status?.name }}
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'urgency'">
                            <a-tag :color="record.urgency?.color || 'default'">
                                {{ record.urgency?.name }}
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'assignee'">
                            <div v-if="record.assignee" style="display: flex; align-items: center; gap: 8px;">
                                <a-tooltip :title="record.assignee.user_name">
                                    <a-avatar size="small" :src="record.assignee.avatar"
                                        :style="{ backgroundColor: !record.assignee.avatar ? stringToColor(record.assignee.user_name) : 'transparent' }">
                                        <span v-if="!record.assignee.avatar">{{ record.assignee.user_name?.[0] }}</span>
                                    </a-avatar>
                                </a-tooltip>
                                <span class="assignee-name">{{ record.assignee.user_name }}</span>
                            </div>
                            <span v-else class="unassigned-text">Unassigned</span>
                        </template>

                        <template v-if="column.key === 'updatedAt'">
                            <span class="date-text">{{ formatDate(record.updatedAt) }}</span>
                        </template>

                        <template v-if="column.key === 'actions'">
                            <a-space>
                                <a-tooltip title="View">
                                    <a-button type="text" size="small" class="btn-icon"
                                        @click="$router.push(`Issue/detail/${record._id}`)">
                                        <EyeOutlined />
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip title="Edit">
                                    <a-button type="text" size="small" class="btn-icon text-blue"
                                        @click="$router.push(`Issue/edit-admin/${record._id}`)">
                                        <EditOutlined />
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip title="Delete">
                                    <a-button type="text" size="small" class="btn-icon text-red"
                                        @click="handleDelete(record)">
                                        <DeleteOutlined />
                                    </a-button>
                                </a-tooltip>
                            </a-space>
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
import Swal from 'sweetalert2';
import {
    SearchOutlined, FilterOutlined,
    EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

export default {
    name: 'IssueManagement',
    components: {
        SearchOutlined, FilterOutlined,
        EyeOutlined, EditOutlined, DeleteOutlined
    },
    data() {
        return {
            loading: false,
            issues: [],
            options: {
                statuses: [],
                urgencies: []
            },
            filters: {
                search: '',
                status: undefined,
                urgency: undefined
            },
            pagination: {
                current: 1,
                pageSize: 10,
                total: 0,
                showSizeChanger: true,
                showTotal: total => `Total ${total} items`
            },
            columns: [
                { title: 'ID', key: 'id', width: 100, fixed: 'left' },
                { title: 'Subject', key: 'name', width: 250 },
                { title: 'Status', key: 'status', width: 120 },
                { title: 'Priority', key: 'urgency', width: 120 },
                { title: 'Assignee', key: 'assignee', width: 180 },
                { title: 'Last Update', key: 'updatedAt', width: 140 },
                { title: 'Actions', key: 'actions', width: 120, align: 'center', fixed: 'right' },
            ]
        };
    },
    computed: {
        hasFilters() {
            return this.filters.search || this.filters.status || this.filters.urgency;
        }
    },
    mounted() {
        this.fetchOptions();
        this.fetchIssues();
    },
    methods: {
        async fetchOptions() {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [resStatus, resUrgency] = await Promise.all([
                    axios.get(import.meta.env.VITE_API_URL + '/items/statuses', config),
                    axios.get(import.meta.env.VITE_API_URL + '/items/urgencies', config)
                ]);
                this.options.statuses = resStatus.data;
                this.options.urgencies = resUrgency.data;
            } catch (e) { console.error("Error fetching options", e); }
        },
        async fetchIssues() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        page: this.pagination.current,
                        limit: this.pagination.pageSize,
                        search: this.filters.search,
                        status: this.filters.status,
                        urgency: this.filters.urgency
                    }
                };
                const response = await axios.get(import.meta.env.VITE_API_URL + '/issues', config);
                if (response.data.docs) {
                    this.issues = response.data.docs;
                    this.pagination.total = response.data.totalDocs;
                } else {
                    this.issues = response.data;
                    this.pagination.total = response.data.length;
                }
            } catch (error) {
                console.error(error);
                message.error('โหลดข้อมูลไม่สำเร็จ');
            } finally {
                this.loading = false;
            }
        },
        handleTableChange(pag) {
            this.pagination.current = pag.current;
            this.pagination.pageSize = pag.pageSize;
            this.fetchIssues();
        },
        resetFilters() {
            this.filters = { search: '', status: undefined, urgency: undefined };
            this.fetchIssues();
        },
        async deleteAllSuccess() {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(import.meta.env.VITE_API_URL + '/issues/delete-success-status', config);
                message.success('ลบข้อมูลเรียบร้อยแล้ว');
                this.fetchIssues();
            } catch (e) {
                console.error(e);
                message.error('ลบข้อมูลไม่สำเร็จ');
            }
        },
        async handleDelete(record) {
            Swal.fire({
                title: 'ยืนยันการลบ?',
                text: `ต้องการลบ Issue #${record.issue_id || record.id} หรือไม่?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'ใช่, ลบเลย!',
                cancelButtonText: 'ยกเลิก'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const token = localStorage.getItem('token');
                        await axios.delete(import.meta.env.VITE_API_URL + `/issues/${record._id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        Swal.fire('Deleted!', 'ลบข้อมูลเรียบร้อยแล้ว', 'success');
                        this.fetchIssues();
                    } catch (e) {
                        console.error(e);
                        Swal.fire('Error', 'ลบข้อมูลไม่สำเร็จ', 'error');
                    }
                }
            });
        },
        formatDate(date) { return date ? dayjs(date).format('D MMM YY HH:mm') : '-' },
        getStatusColor(code) {
            const map = { reported: 'red', received: 'blue', inProgress: 'processing', finished: 'cyan', upserver: 'purple', testing: 'orange', success: 'success', rejected: 'error' };
            return map[code] || 'default';
        },
        stringToColor(str) {
            if (!str) return '#ccc';
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + '00000'.substring(0, 6 - c.length) + c;
        }
    }
};
</script>

<style scoped>
/* 1. Compact Header */
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

.header-text {
    display: flex;
    flex-direction: column;
}

.page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
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
    background: #fff7e6;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 18px;
}

/* 2. Content & Card */
.content-wrapper {
    padding: 16px;
    width: 100%;
}

.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
    min-height: 600px;
}

/* 3. ✅ New Toolbar Style */
.table-toolbar {
    padding: 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 16px;
}

.filters-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    flex: 1;
}

.filter-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.filter-item .label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
}

.search-box {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
}

.modern-input,
.modern-select {
    width: 100%;
    border-radius: 6px;
}

.modern-select {
    width: 160px;
    /* Fixed width for dropdowns */
}

.filter-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 2px;
    /* Align with inputs */
}

.btn-filter {
    border-radius: 6px;
    font-weight: 500;
}

.toolbar-footer {
    margin-bottom: 6px;
}

.total-badge {
    color: #64748b;
    font-size: 13px;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 500;
}

/* 4. Table Elements */
.id-badge {
    background: #f5f5f5;
    color: #888;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid #e8e8e8;
    cursor: pointer;
    white-space: nowrap;
}

.title-cell {
    display: flex;
    flex-direction: column;
}

.issue-link {
    font-weight: 500;
    color: #262626;
    cursor: pointer;
    transition: 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
}

.issue-link:hover {
    color: #1890ff;
    text-decoration: underline;
}

.issue-type-badge {
    font-size: 11px;
    color: #8c8c8c;
    background: #f5f5f5;
    padding: 0 6px;
    border-radius: 4px;
    width: fit-content;
    margin-top: 2px;
}

.assignee-name {
    font-size: 13px;
    color: #595959;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
}

.unassigned-text {
    color: #bfbfbf;
    font-style: italic;
    font-size: 12px;
}

.date-text {
    font-size: 12px;
    white-space: nowrap;
}

.btn-icon {
    color: #8c8c8c;
}

.btn-icon:hover {
    color: #40a9ff;
    background: #e6f7ff;
}

.btn-icon.text-blue:hover {
    color: #1890ff;
}

.btn-icon.text-red:hover {
    color: #ff4d4f;
    background: #fff1f0;
}

.text-muted {
    color: #bfbfbf;
}

/* ==========================================================================
   📱 Mobile Responsive Tweaks
   ========================================================================== */
@media (max-width: 768px) {
    .compact-header {
        padding: 12px 16px;
    }

    .page-title {
        font-size: 18px;
    }

    .page-subtitle {
        display: none;
    }

    .content-wrapper {
        padding: 10px;
    }

    .main-card {
        min-height: auto;
    }

    /* Stack Filters on Mobile */
    .table-toolbar {
        flex-direction: column;
        align-items: stretch;
        padding: 12px;
        gap: 12px;
    }

    .filters-wrapper {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: 12px;
    }

    .search-box,
    .modern-select {
        max-width: none;
        width: 100%;
    }

    .filter-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
        margin-top: 4px;
    }

    .btn-filter,
    .btn-reset {
        width: 100%;
    }

    .toolbar-footer {
        width: 100%;
        text-align: right;
        margin-top: 8px;
    }

    :deep(.ant-table-cell) {
        padding: 10px !important;
    }

    .btn-text {
        display: none;
    }
}
</style>