<template>
    <a-layout style="min-height: 100vh; background: #f5f7fa;">

        <div class="page-header compact-header">
            <div class="header-content">
                <div class="header-left">
                    <div class="header-text">
                        <h2 class="page-title">
                            <span class="icon-box">
                                <CloudServerOutlined />
                            </span>
                            Server Management
                        </h2>
                        <p class="page-subtitle">จัดการรายการเซิร์ฟเวอร์และสถานะการทำงาน</p>
                    </div>
                </div>
                <div class="header-actions">
                    <a-button @click="fetchServers" :loading="loading" class="btn-refresh">
                        <template #icon>
                            <ReloadOutlined />
                        </template>
                    </a-button>
                    <a-button type="primary" @click="openAddModal" class="btn-add">
                        <template #icon>
                            <PlusOutlined />
                        </template> เพิ่มเซิร์ฟเวอร์
                    </a-button>
                </div>
            </div>
        </div>

        <div style="padding: 12px; width: 100%;">
            <a-card :bordered="false" class="main-card">

                <a-table :dataSource="servers" :columns="columns" :loading="loading" rowKey="_id"
                    :pagination="{ pageSize: 10 }" size="middle">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'status'">
                            <a-tag :color="getStatusColor(record.status)">
                                <template #icon>
                                    <component :is="getStatusIcon(record.status)" />
                                </template>
                                {{ getStatusLabel(record.status) }}
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'action'">
                            <a-space>
                                <a-button type="primary" ghost size="small" @click="openEditModal(record)">
                                    <EditOutlined /> แก้ไข
                                </a-button>
                                <a-popconfirm title="คุณแน่ใจหรือไม่ที่จะลบ Server นี้?" ok-text="ลบ"
                                    cancel-text="ยกเลิก" @confirm="handleDelete(record._id)">
                                    <a-button danger size="small">
                                        <DeleteOutlined /> ลบ
                                    </a-button>
                                </a-popconfirm>
                            </a-space>
                        </template>
                    </template>
                </a-table>
            </a-card>
        </div>

        <a-modal v-model:open="modalVisible" :title="isEditMode ? 'แก้ไขข้อมูล Server' : 'เพิ่ม Server ใหม่'"
            @ok="handleSave" :confirmLoading="submitting" okText="บันทึก" cancelText="ยกเลิก">
            <a-form layout="vertical" :model="form">
                <a-form-item label="Server Name" required>
                    <a-input v-model:value="form.name" placeholder="เช่น App Server 01" />
                </a-form-item>

                <a-form-item label="Url" required>
                    <a-input v-model:value="form.url" placeholder="เช่น http://127.0.0.1" />
                </a-form-item>

                <a-form-item label="Status" required>
                    <a-select v-model:value="form.status" placeholder="เลือกสถานะ">
                        <a-select-option v-for="option in statusOptions" :key="option.value" :value="option.value">
                            <a-badge :color="option.color" :text="option.label" />
                        </a-select-option>
                    </a-select>
                </a-form-item>
            </a-form>
        </a-modal>

    </a-layout>
</template>

<script>
import axios from 'axios';
import {
    CloudServerOutlined, PlusOutlined, ReloadOutlined,
    EditOutlined, DeleteOutlined, CheckCircleOutlined,
    CloseCircleOutlined, ToolOutlined, QuestionCircleOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

export default {
    name: 'ServerManagement',
    components: {
        CloudServerOutlined, PlusOutlined, ReloadOutlined,
        EditOutlined, DeleteOutlined, CheckCircleOutlined,
        CloseCircleOutlined, ToolOutlined, QuestionCircleOutlined
    },
    data() {
        return {
            loading: false,
            submitting: false,
            modalVisible: false,
            isEditMode: false,
            editingId: null,
            statusOptions: [],
            servers: [],

            form: {
                name: '',
                url: '',
                status: undefined // เปลี่ยนเป็น undefined เพื่อให้ Placeholder ทำงาน
            },

            columns: [
                { title: 'Server Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
                { title: 'URL', dataIndex: 'url', key: 'url' },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 150 },
                { title: 'Last Updated', dataIndex: 'updatedAt', key: 'updatedAt', customRender: ({ text }) => new Date(text).toLocaleString() },
                { title: 'Action', key: 'action', width: 200, align: 'center' }
            ]
        };
    },
    mounted() {
        // โหลด Dropdown ก่อนเพื่อเอาค่าสีมาใช้แสดงผล
        this.fectdropdowns().then(() => {
            this.fetchServers();
        });
    },
    methods: {
        // --- API Calls ---
        async fetchServers() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/servers/get-all-server', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                this.servers = res.data;
            } catch (error) {
                console.error(error);
                message.error('โหลดข้อมูลไม่สำเร็จ');
            } finally {
                this.loading = false;
            }
        },

        async fectdropdowns() {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(import.meta.env.VITE_API_URL + '/items/server-status', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data) {
                    this.statusOptions = res.data.map(s => ({
                        label: s.name,
                        value: s.code,
                        color: s.color
                    }));
                }
            } catch (error) {
                console.error(error);
            }
        },

        async handleSave() {
            if (!this.form.name || !this.form.url) {
                return message.warning('กรุณากรอกชื่อและ URL');
            }
            if (!this.form.status) {
                return message.warning('กรุณาเลือกสถานะ');
            }

            this.submitting = true;
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const payload = { ...this.form };

                if (this.isEditMode) {
                    await axios.put(import.meta.env.VITE_API_URL + `/servers/${this.editingId}`, payload, config);
                    message.success('แก้ไขข้อมูลสำเร็จ');
                } else {
                    await axios.post(import.meta.env.VITE_API_URL + '/servers', payload, config);
                    message.success('เพิ่ม Server สำเร็จ');
                }

                this.modalVisible = false;
                this.fetchServers();

            } catch (error) {
                console.error(error);
                message.error(error.response?.data?.message || 'ทำรายการไม่สำเร็จ');
            } finally {
                this.submitting = false;
            }
        },

        async handleDelete(id) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(import.meta.env.VITE_API_URL + `/servers/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('ลบข้อมูลเรียบร้อย');
                this.fetchServers();
            } catch (error) {
                console.error(error);
                message.error('ลบข้อมูลไม่สำเร็จ');
            }
        },

        openAddModal() {
            this.isEditMode = false;
            this.editingId = null;
            this.form = { name: '', url: '', status: undefined };
            this.modalVisible = true;
        },
        openEditModal(record) {
            this.isEditMode = true;
            this.editingId = record._id;
            this.form = {
                name: record.name,
                url: record.url,
                status: record.status 
            };
            this.modalVisible = true;
        },

        getStatusColor(statusCode) {
            if (!statusCode) return 'default';
            const status = this.statusOptions.find(s => s.value === statusCode);
            return status ? status.color : 'default';
        },

        getStatusLabel(statusCode) {
            if (!statusCode) return '-';
            const status = this.statusOptions.find(s => s.value === statusCode);
            return status ? status.label : statusCode.toUpperCase();
        },

        getStatusIcon(statusCode) {
            const map = {
                online: 'CheckCircleOutlined',
                offline: 'CloseCircleOutlined',
                maintenance: 'ToolOutlined'
            };
            return map[statusCode] || 'QuestionCircleOutlined';
        }
    }
};
</script>

<style scoped>
.compact-header {
    background: #fff;
    padding: 12px 16px;
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
    background: #e6f7ff;
    color: #1890ff;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 18px;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
    .compact-header {
        padding: 10px 12px;
    }

    .page-subtitle {
        display: none;
    }
}
</style>