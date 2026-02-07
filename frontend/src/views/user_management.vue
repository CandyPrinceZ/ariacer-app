<template>
    <a-layout style="min-height: 100vh; background: #f5f7fa;">

        <div class="page-header compact-header">
            <div class="header-content">
                <div class="header-text">
                    <h2 class="page-title">
                        <span class="icon-box">👥</span> User Management
                    </h2>
                    <p class="page-subtitle">จัดการผู้ใช้งาน, สิทธิ์การเข้าถึง และบทบาทหน้าที่</p>
                </div>
                <div class="header-actions">
                    <a-button type="primary" class="create-btn" @click="openCreateModal">
                        <template #icon>
                            <UserAddOutlined />
                        </template>
                        Add New User
                    </a-button>
                </div>
            </div>
        </div>

        <div style="padding: 12px; width: 100%;">

            <a-card :bordered="false" class="main-card" :bodyStyle="{ padding: '0' }">

                <div class="table-toolbar">
                    <div class="search-area">
                        <a-input v-model:value="searchText" placeholder="Search by username or name..."
                            style="width: 300px;" allow-clear>
                            <template #prefix>
                                <SearchOutlined class="text-muted" />
                            </template>
                        </a-input>
                    </div>

                    <div class="filter-area">
                    </div>
                </div>

                <a-table :columns="columns" :data-source="filteredUsers" :loading="loading" rowKey="_id"
                    :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} users` }"
                    size="middle" :scroll="{ x: 1000 }">
                    <template #bodyCell="{ column, record }">

                        <template v-if="column.key === 'user_id'">
                            <span class="id-badge">
                                {{ record.user_id || '...' }}
                            </span>
                        </template>

                        <template v-if="column.key === 'username'">
                            <div class="user-cell">
                                <a-avatar size="small" :src="record.avatar"
                                    :style="{ backgroundColor: !record.avatar ? stringToColor(record.username) : 'transparent' }">
                                    <span v-if="!record.avatar">{{ record.username?.[0]?.toUpperCase() }}</span>
                                </a-avatar>
                                <span class="username-text">{{ record.username }}</span>
                            </div>
                        </template>

                        <template v-if="column.key === 'role'">
                            <a-tag :color="getRoleColor(record.role_code)" class="role-tag">
                                <template #icon>
                                    <CodeOutlined v-if="record.role_code === 'dev'" />
                                    <SafetyCertificateOutlined
                                        v-else-if="['admin', 'administrator'].includes(record.role_code)" />
                                    <UserOutlined v-else />
                                </template>
                                {{ formatRoleName(record) }}
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'created_at'">
                            <span class="text-date">{{ formatDate(record.createdAt || record.created_at) }}</span>
                        </template>

                        <template v-if="column.key === 'action'">
                            <a-space>
                                <a-tooltip title="Edit User">
                                    <a-button type="text" size="small" class="action-btn edit-btn"
                                        @click="openEditModal(record)">
                                        <EditOutlined />
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip title="Delete User">
                                    <a-button type="text" danger size="small" class="action-btn delete-btn"
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

        <a-modal v-model:open="modal.visible" :title="modal.mode === 'create' ? 'Create New User' : 'Edit User'"
            @ok="handleModalSubmit" :confirmLoading="modal.loading" width="480px" centered class="user-modal">
            <a-form layout="vertical" ref="userForm" :model="form" :rules="rules" class="pt-2">

                <a-form-item label="Username" name="username">
                    <a-input v-model:value="form.username" :disabled="modal.mode === 'edit'" placeholder="e.g. admin_01"
                        class="modern-input">
                        <template #prefix>
                            <UserOutlined class="text-muted" />
                        </template>
                    </a-input>
                </a-form-item>

                <a-form-item label="Full Name" name="user_name">
                    <a-input v-model:value="form.user_name" placeholder="Enter full name" class="modern-input" />
                </a-form-item>

                <a-form-item label="Role" name="role_code">
                    <a-select v-model:value="form.role_code" placeholder="Select user role" class="modern-select">
                        <a-select-option v-for="role in roleList" :key="role.code" :value="role.code">
                            <span class="role-option">
                                <a-badge :status="getRoleBadgeStatus(role.code)" /> {{ role.name }}
                            </span>
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <div v-if="modal.mode === 'create'">
                    <a-form-item label="Password" name="password">
                        <a-input-password v-model:value="form.password" placeholder="Set password"
                            class="modern-input" />
                    </a-form-item>
                </div>

                <div v-if="modal.mode === 'edit'" class="reset-pwd-section">
                    <a-divider style="margin: 16px 0;" />
                    <a-checkbox v-model:checked="isResetPassword">Reset Password</a-checkbox>
                    <transition name="fade">
                        <div v-if="isResetPassword" class="mt-3">
                            <a-form-item label="New Password" name="password" class="mb-0">
                                <a-input-password v-model:value="form.password" placeholder="Enter new password"
                                    class="modern-input" />
                            </a-form-item>
                        </div>
                    </transition>
                </div>
            </a-form>
        </a-modal>

    </a-layout>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import {
    UserAddOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
    UserOutlined, SafetyCertificateOutlined, CodeOutlined
} from '@ant-design/icons-vue';

export default {
    name: 'UserManagement',
    components: {
        UserAddOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
        UserOutlined, SafetyCertificateOutlined, CodeOutlined
    },
    data() {
        return {
            loading: false,
            users: [],
            searchText: '',
            roleList: [],
            columns: [
                { title: 'User ID', dataIndex: 'user_id', key: 'user_id', width: 100 },
                { title: 'Username', dataIndex: 'username', key: 'username', width: 200 }, // เพิ่ม width ให้แสดง Avatar พอดี
                { title: 'Full Name', dataIndex: 'user_name', key: 'user_name' },
                { title: 'Role', dataIndex: 'role_code', key: 'role', width: 160 },
                { title: 'Joined Date', dataIndex: 'createdAt', key: 'created_at', width: 160, align: 'right' },
                { title: 'Action', key: 'action', width: 100, align: 'center', fixed: 'right' },
            ],
            modal: {
                visible: false,
                mode: 'create',
                loading: false
            },
            isResetPassword: false,
            form: {
                username: '',
                user_name: '',
                role_name: '',
                role_code: undefined,
                password: ''
            },
            rules: {
                username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
                user_name: [{ required: true, message: 'Please enter full name', trigger: 'blur' }],
                role_code: [{ required: true, message: 'Please select role', trigger: 'change' }],
                password: [
                    { required: true, message: 'Please enter password', trigger: 'blur' },
                    { min: 6, message: 'Minimum 6 characters', trigger: 'blur' }
                ]
            }
        };
    },
    computed: {
        filteredUsers() {
            if (!this.searchText) return this.users;
            const lower = this.searchText.toLowerCase();
            return this.users.filter(u =>
                (u.username && u.username.toLowerCase().includes(lower)) ||
                (u.user_name && u.user_name.toLowerCase().includes(lower))
            );
        }
    },
    async mounted() {
        await this.fetchRoles();
        await this.fetchUsers();
    },
    methods: {
        getToken() { return localStorage.getItem('token'); },
        getConfig() { return { headers: { Authorization: `Bearer ${this.getToken()}` } }; },
        formatDate(date) { return date ? dayjs(date).format('DD MMM YYYY, HH:mm') : '-'; },

        getRoleColor(code) {
            if (code === 'admin' || code === 'administrator') return 'red';
            if (code === 'dev') return 'geekblue';
            return 'green';
        },
        getRoleBadgeStatus(code) {
            if (code === 'admin') return 'error';
            if (code === 'dev') return 'processing';
            return 'success';
        },
        formatRoleName(record) {
            return record.role_name ? record.role_name : (record.role_code ? record.role_code.toUpperCase() : 'USER');
        },
        stringToColor(str) {
            if (!str) return '#1890ff';
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return '#' + '00000'.substring(0, 6 - c.length) + c;
        },

        async fetchRoles() {
            try {
                const res = await axios.get(import.meta.env.VITE_API_URL + '/items/roles', this.getConfig());
                this.roleList = Array.isArray(res.data) ? res.data : (res.data.data || []);
            } catch (e) { console.error('Fetch Roles Error', e); }
        },

        async fetchUsers() {
            this.loading = true;
            try {
                const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/users-list', this.getConfig());
                this.users = res.data;
            } catch (e) {
                console.error(e);
                Swal.fire('Error', 'Failed to load users', 'error');
            } finally {
                this.loading = false;
            }
        },

        openCreateModal() {
            this.modal.mode = 'create';
            this.modal.visible = true;
            this.isResetPassword = false;
            this.form = { _id: null, username: '', user_name: '', role_name: '', role_code: undefined, password: '' };
            if (this.$refs.userForm) this.$refs.userForm.clearValidate();
        },

        openEditModal(record) {
            this.modal.mode = 'edit';
            this.modal.visible = true;
            this.isResetPassword = false;
            this.form = {
                _id: record._id,
                username: record.username,
                user_name: record.user_name,
                role_name: record.role_name,
                role_code: record.role_code,
                password: ''
            };
            if (this.$refs.userForm) this.$refs.userForm.clearValidate();
        },

        async handleModalSubmit() {
            try {
                if (this.modal.mode === 'edit' && !this.isResetPassword) {
                    await this.$refs.userForm.validateFields(['username', 'user_name', 'role_code']);
                } else {
                    await this.$refs.userForm.validate();
                }
            } catch (err) {
                console.error(err);
                return;
            }

            this.modal.loading = true;
            try {
                const payload = { ...this.form };
                const selectedRole = this.roleList.find(r => r.code === payload.role_code);
                if (selectedRole) payload.role_name = selectedRole.name;

                if (this.modal.mode === 'create') {
                    const registerPayload = {
                        username: payload.username,
                        password: payload.password,
                        user_name: payload.user_name,
                        role_code: payload.role_code,
                        role_name: payload.role_name
                    };
                    await axios.post(import.meta.env.VITE_API_URL + '/auth/register', registerPayload, this.getConfig());
                    Swal.fire({ icon: 'success', title: 'User Created', showConfirmButton: false, timer: 1500 });
                    this.modal.visible = false;
                    this.fetchUsers();
                } else {
                    if (!this.isResetPassword) delete payload.password;
                    const res = await axios.put(import.meta.env.VITE_API_URL + '/auth/update-user-by-admin', payload, this.getConfig());

                    const index = this.users.findIndex(u => u._id === payload._id);
                    if (index !== -1) {
                        this.users[index] = { ...this.users[index], ...res.data };
                        this.users[index].role_name = payload.role_name;
                        this.users[index].role_code = payload.role_code;
                    }
                    Swal.fire({ icon: 'success', title: 'User Updated', showConfirmButton: false, timer: 1500 });
                    this.modal.visible = false;
                }
            } catch (e) {
                console.error(e);
                Swal.fire('Error', e.response?.data?.message || 'Operation failed', 'error');
            } finally {
                this.modal.loading = false;
            }
        },

        handleDelete(record) {
            Swal.fire({
                title: 'Are you sure?',
                text: `Delete user "${record.username}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ff4d4f',
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await axios.delete(import.meta.env.VITE_API_URL + '/auth/delete-user' + `/${record.user_id}`, this.getConfig());
                        this.fetchUsers();
                        Swal.fire('Deleted!', 'User has been deleted.', 'success');
                    } catch (e) {
                        console.error(e);
                        Swal.fire('Error', 'Delete failed', 'error');
                    }
                }
            });
        }
    }
};
</script>

<style scoped>
/* 1. Compact Header */
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
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 18px;
}

/* 2. Main Card & Layout */
.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
    height: 100%;
}

/* 3. Toolbar (Inside Card) */
.table-toolbar {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
}

/* 4. Table Customization */
.user-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.username-text {
    font-weight: 500;
    color: #262626;
}

.role-tag {
    min-width: 90px;
    text-align: center;
    font-weight: 500;
    font-size: 12px;
    border-radius: 4px;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 2px 8px;
}

.id-badge {
    background: #f5f5f5;
    color: #888;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid #e8e8e8;
}

.text-date {
    font-size: 13px;
}

.text-muted {
    color: #bfbfbf;
}

/* 5. Buttons */
.create-btn {
    height: 36px;
    font-weight: 500;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
}

.action-btn {
    color: #8c8c8c;
    transition: color 0.3s;
}

.action-btn:hover {
    color: #1890ff;
    background: #f0f5ff;
}

.action-btn.delete-btn:hover {
    color: #ff4d4f;
    background: #fff1f0;
}

/* 6. Form Elements */
.modern-input,
.modern-select {
    border-radius: 6px;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.pt-2 {
    padding-top: 0.5rem;
}

.mt-3 {
    margin-top: 1rem;
}

.mb-0 {
    margin-bottom: 0;
}
</style>