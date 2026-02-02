<template>
    <a-layout style="min-height: 100vh; background: #f4f7fa;">
        <div class="page-header">
            <div class="header-content">
                <div>
                    <h2 class="page-title">👥 User Management</h2>
                    <p class="page-subtitle">Manage system users, roles, and permissions.</p>
                </div>
                <div>
                    <a-button type="primary" size="large" class="create-btn" @click="openCreateModal">
                        <template #icon>
                            <UserAddOutlined />
                        </template>
                        Add New User
                    </a-button>
                </div>
            </div>
        </div>

        <div class="page-content">
            <a-card :bordered="false" class="main-card">

                <div class="table-toolbar">
                    <a-input v-model:value="searchText" placeholder="Search by username or name..."
                        style="width: 100%; max-width: 400px;" allow-clear size="large">
                        <template #prefix>
                            <SearchOutlined class="text-muted" />
                        </template>
                    </a-input>
                </div>

                <a-table :columns="columns" :data-source="filteredUsers" :loading="loading" rowKey="_id"
                    :pagination="{ pageSize: 10, showSizeChanger: true }" size="middle" :scroll="{ x: 1000 }">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'role'">
                            <a-tag :color="getRoleColor(record.role_code)" class="role-tag">
                                {{ formatRoleName(record) }}
                            </a-tag>
                        </template>

                        <template v-if="column.key === 'created_at'">
                            <span class="text-date">{{ formatDate(record.createdAt || record.created_at) }}</span>
                        </template>

                        <template v-if="column.key === 'action'">
                            <a-space>
                                <a-tooltip title="Edit User">
                                    <a-button type="primary" ghost size="small" shape="circle"
                                        @click="openEditModal(record)">
                                        <EditOutlined />
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip title="Delete User">
                                    <a-button type="primary" danger ghost size="small" shape="circle"
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
            @ok="handleModalSubmit" :confirmLoading="modal.loading" width="500px" centered class="user-modal">
            <a-form layout="vertical" ref="userForm" :model="form" :rules="rules" class="pt-2">
                <a-form-item label="Username" name="username">
                    <a-input v-model:value="form.username" :disabled="modal.mode === 'edit'" placeholder="e.g. admin_01"
                        size="large">
                        <template #prefix>
                            <UserOutlined class="text-muted" />
                        </template>
                    </a-input>
                </a-form-item>

                <a-form-item label="Full Name" name="user_name">
                    <a-input v-model:value="form.user_name" placeholder="Enter full name" size="large" />
                </a-form-item>

                <a-form-item label="Role" name="role_code">
                    <a-select v-model:value="form.role_code" placeholder="Select user role" size="large">
                        <a-select-option v-for="role in roleList" :key="role.code" :value="role.code">
                            <span class="role-option">
                                <a-badge :status="getRoleBadgeStatus(role.code)" /> {{ role.name }}
                            </span>
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <div v-if="modal.mode === 'create'">
                    <a-form-item label="Password" name="password">
                        <a-input-password v-model:value="form.password" placeholder="Set password" size="large" />
                    </a-form-item>
                </div>

                <div v-if="modal.mode === 'edit'" class="reset-pwd-section">
                    <a-divider style="margin: 12px 0;" />
                    <a-checkbox v-model:checked="isResetPassword">Reset Password</a-checkbox>
                    <transition name="fade">
                        <div v-if="isResetPassword" class="mt-3">
                            <a-form-item label="New Password" name="password" class="mb-0">
                                <a-input-password v-model:value="form.password" placeholder="Enter new password"
                                    size="large" />
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
    UserAddOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined
} from '@ant-design/icons-vue';

export default {
    name: 'UserManagement',
    components: {
        UserAddOutlined,
        SearchOutlined,
        EditOutlined,
        DeleteOutlined,
        UserOutlined
    },
    data() {
        return {
            loading: false,
            users: [],
            searchText: '',
            roleList: [],
            columns: [
                { title: 'User ID', dataIndex: 'user_id', key: 'user_id', width: 100, align: 'center' },
                { title: 'Username', dataIndex: 'username', key: 'username', width: 150 },
                { title: 'Full Name', dataIndex: 'user_name', key: 'user_name' },
                { title: 'Role', dataIndex: 'role_code', key: 'role', width: 150, align: 'center' },
                { title: 'Joined Date', dataIndex: 'createdAt', key: 'created_at', width: 180, align: 'right' },
                { title: 'Action', key: 'action', width: 120, align: 'center', fixed: 'right' },
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
        getToken() {
            return localStorage.getItem('token');
        },
        getConfig() {
            return { headers: { Authorization: `Bearer ${this.getToken()}` } };
        },
        formatDate(date) {
            return date ? dayjs(date).format('D MMM YYYY, HH:mm') : '-';
        },
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
            return record.role_name ? record.role_name.toUpperCase() : (record.role_code ? record.role_code.toUpperCase() : 'USER');
        },
        async fetchRoles() {
            try {
                const res = await axios.get(import.meta.env.VITE_API_URL + '/items/roles', this.getConfig());
                this.roleList = Array.isArray(res.data) ? res.data : (res.data.data || []);
            } catch (e) {
                console.error('Fetch Roles Error', e);
            }
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
            // 1. Validation ส่วนนี้เหมือนเดิม
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
                // 2. Prepare Payload
                const payload = { ...this.form };

                // 🔥 [จุดสำคัญที่แก้ไข] 🔥
                // ค้นหา Role Name จาก Role Code ที่เลือกเสมอ (ทำก่อนแยก Case Create/Edit)
                // เพื่อให้มั่นใจว่า role_name เป็นค่าปัจจุบันที่ถูกต้อง
                const selectedRole = this.roleList.find(r => r.code === payload.role_code);
                if (selectedRole) {
                    payload.role_name = selectedRole.name;
                }

                // 3. แยก Case การทำงาน
                if (this.modal.mode === 'create') {
                    // --- CREATE MODE ---
                    const registerPayload = {
                        username: payload.username,
                        password: payload.password,
                        user_name: payload.user_name,
                        role_code: payload.role_code,
                        role_name: payload.role_name // ส่งค่าที่ถูกต้องไป
                    };

                    await axios.post(import.meta.env.VITE_API_URL + '/auth/register', registerPayload, this.getConfig());

                    Swal.fire({
                        icon: 'success',
                        title: 'User Created',
                        showConfirmButton: false,
                        timer: 1500
                    });

                    this.modal.visible = false;
                    this.fetchUsers();

                } else {
                    // --- EDIT MODE ---
                    if (!this.isResetPassword) delete payload.password;

                    // ส่ง payload ที่มี role_name ที่อัปเดตแล้วไปด้วย
                    const res = await axios.put(
                        import.meta.env.VITE_API_URL + '/auth/update-user-by-admin',
                        payload,
                        this.getConfig()
                    );

                    // อัปเดตข้อมูลในตารางทันทีโดยไม่ต้องโหลดใหม่
                    const index = this.users.findIndex(u => u._id === payload._id);
                    if (index !== -1) {
                        this.users[index] = { ...this.users[index], ...res.data };
                        // หรือถ้า res.data ไม่คืน role_name มา ก็บังคับค่าเองเพื่อให้ UI อัปเดต
                        this.users[index].role_name = payload.role_name;
                        this.users[index].role_code = payload.role_code;
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'User Updated',
                        showConfirmButton: false,
                        timer: 1500
                    });

                    this.modal.visible = false;
                }

            } catch (e) {
                console.error(e);
                Swal.fire('Error', e.response?.data?.message || 'Operation failed', 'error');
            } finally {
                this.modal.loading = false;
            }
        }, handleDelete(record) {
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
                        console.error(e)
                        Swal.fire('Error', 'Delete failed', 'error');
                    }
                }
            });
        }
    }
};
</script>

<style scoped>

/* Page Header */
.page-header {
    background: #fff;
    padding: 24px 32px;
    border-bottom: 1px solid #e8e8e8;
    /* Sticky Header (Optional: ถ้าอยากให้หัวค้างไว้เวลาเลื่อนลง) */
    /* position: sticky; top: 0; z-index: 10; */
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

.create-btn {
    box-shadow: 0 4px 10px rgba(24, 144, 255, 0.2);
    font-weight: 500;
}

/* Content Area - Full Width */
.page-content {
    padding: 24px;
    /* Padding รอบๆ ตาราง */
    width: 100%;
    /* บังคับเต็มจอ */
}

.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.table-toolbar {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.text-muted {
    color: #bfbfbf;
}

/* Table Styles */
.role-tag {
    min-width: 80px;
    text-align: center;
    font-weight: 600;
    font-size: 11px;
    border: none;
    padding: 2px 8px;
    border-radius: 4px;
}

.text-date {
    color: #8c8c8c;
    font-size: 13px;
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