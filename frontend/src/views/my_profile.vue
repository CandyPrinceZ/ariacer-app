<template>
    <a-layout style="min-height: 100vh; background: #f5f7fa;">

        <div class="page-header compact-header">
            <div class="header-content">
                <div class="header-text">
                    <h2 class="page-title">
                        <span class="icon-box">👤</span> My Profile
                    </h2>
                    <p class="page-subtitle">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
                </div>
            </div>
        </div>

        <div style="padding: 12px; width: 100%;">
            <a-row :gutter="[12, 12]">

                <a-col :xs="24" :lg="8" :xl="6">
                    <a-card :bordered="false" class="main-card profile-card" :bodyStyle="{ padding: 0 }">
                        <div class="profile-cover"></div>
                        <div class="profile-body">
                            <div class="avatar-container">
                                <a-avatar :size="100" class="user-avatar"
                                    :style="{ backgroundColor: getAvatarColor(user.username), fontSize: '40px' }">
                                    <template #icon v-if="!user.user_name">
                                        <UserOutlined />
                                    </template>
                                    <span>{{ getInitial(user.user_name) }}</span>
                                </a-avatar>
                            </div>

                            <div class="user-info">
                                <h3 class="user-name">{{ user.user_name || 'Loading...' }}</h3>
                                <p class="user-handle">@{{ user.username }}</p>
                                <div class="role-badge" :class="user.role_code">
                                    {{ user.role_name || 'Member' }}
                                </div>
                            </div>

                            <a-divider style="margin: 24px 0;" />

                            <div class="details-list">
                                <div class="detail-item">
                                    <div class="icon-wrap">
                                        <IdcardOutlined />
                                    </div>
                                    <div class="detail-content">
                                        <span class="label">User ID</span>
                                        <span class="value">{{ user.user_id || '-' }}</span>
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="icon-wrap">
                                        <CalendarOutlined />
                                    </div>
                                    <div class="detail-content">
                                        <span class="label">Joined Date</span>
                                        <span class="value">{{ formatDate(user.createdAt) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a-card>
                </a-col>

                <a-col :xs="24" :lg="16" :xl="18">
                    <a-card :bordered="false" class="main-card settings-card">
                        <a-tabs v-model:activeKey="activeTab" type="line" size="large" class="custom-tabs">

                            <a-tab-pane key="general" tab="ข้อมูลทั่วไป">
                                <div class="tab-content">
                                    <div class="section-header">
                                        <h4>
                                            <UserOutlined /> แก้ไขข้อมูลส่วนตัว
                                        </h4>
                                        <p>อัปเดตข้อมูลชื่อที่ใช้แสดงในระบบ</p>
                                    </div>

                                    <a-form layout="vertical" :model="formProfile">
                                        <a-row :gutter="16">
                                            <a-col :xs="24" :md="12">
                                                <a-form-item label="Full Name (ชื่อที่ใช้แสดง)">
                                                    <a-input v-model:value="formProfile.user_name" size="large"
                                                        placeholder="ระบุชื่อ-นามสกุล" class="modern-input">
                                                        <template #prefix>
                                                            <UserOutlined class="text-muted" />
                                                        </template>
                                                    </a-input>
                                                </a-form-item>
                                            </a-col>
                                            <a-col :xs="24" :md="12">
                                                <a-form-item label="Username">
                                                    <a-input v-model:value="user.username" size="large" disabled
                                                        class="modern-input disabled">
                                                        <template #prefix>
                                                            <LockOutlined class="text-muted" />
                                                        </template>
                                                    </a-input>
                                                    <span class="input-hint">Username ไม่สามารถเปลี่ยนแปลงได้</span>
                                                </a-form-item>
                                            </a-col>
                                        </a-row>

                                        <div class="form-actions">
                                            <a-button type="primary" size="large" :loading="loading"
                                                @click="updateProfile" class="btn-save">
                                                บันทึกการเปลี่ยนแปลง
                                            </a-button>
                                        </div>
                                    </a-form>
                                </div>
                            </a-tab-pane>

                            <a-tab-pane key="security" tab="ความปลอดภัย">
                                <div class="tab-content">
                                    <div class="section-header">
                                        <h4>
                                            <LockOutlined /> เปลี่ยนรหัสผ่าน
                                        </h4>
                                        <p>จัดการความปลอดภัยของบัญชีของคุณ</p>
                                    </div>

                                    <a-alert message="คำแนะนำ"
                                        description="รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร เพื่อความปลอดภัยสูงสุด"
                                        type="info" show-icon class="mb-4 modern-alert" />

                                    <a-form layout="vertical" :model="formPassword" :rules="passwordRules"
                                        ref="passwordForm">
                                        <a-row :gutter="16">
                                            <a-col :xs="24" :md="12">
                                                <a-form-item label="รหัสผ่านปัจจุบัน" name="currentPassword">
                                                    <a-input-password v-model:value="formPassword.currentPassword"
                                                        size="large" placeholder="ระบุรหัสผ่านเดิม"
                                                        class="modern-input" />
                                                </a-form-item>
                                            </a-col>
                                        </a-row>
                                        <a-row :gutter="16">
                                            <a-col :xs="24" :md="12">
                                                <a-form-item label="รหัสผ่านใหม่" name="newPassword">
                                                    <a-input-password v-model:value="formPassword.newPassword"
                                                        size="large" placeholder="ระบุรหัสผ่านใหม่"
                                                        class="modern-input" />
                                                </a-form-item>
                                            </a-col>
                                            <a-col :xs="24" :md="12">
                                                <a-form-item label="ยืนยันรหัสผ่านใหม่" name="confirmPassword">
                                                    <a-input-password v-model:value="formPassword.confirmPassword"
                                                        size="large" placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                                                        class="modern-input" />
                                                </a-form-item>
                                            </a-col>
                                        </a-row>

                                        <div class="form-actions">
                                            <a-button type="primary" danger ghost size="large" :loading="loading"
                                                @click="updatePassword" class="btn-danger">
                                                ยืนยันเปลี่ยนรหัสผ่าน
                                            </a-button>
                                        </div>
                                    </a-form>
                                </div>
                            </a-tab-pane>

                        </a-tabs>
                    </a-card>
                </a-col>

            </a-row>
        </div>
    </a-layout>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { UserOutlined, IdcardOutlined, CalendarOutlined, LockOutlined } from '@ant-design/icons-vue';

export default {
    name: 'MyProfile',
    components: { UserOutlined, IdcardOutlined, CalendarOutlined, LockOutlined },
    data() {
        const validatePass2 = async (_rule, value) => {
            if (value === '') return Promise.reject('กรุณายืนยันรหัสผ่านใหม่');
            else if (value !== this.formPassword.newPassword) return Promise.reject("รหัสผ่านไม่ตรงกัน!");
            else return Promise.resolve();
        };

        return {
            loading: false,
            activeTab: 'general',
            user: { user_name: '', username: '', role_name: '', role_code: '', user_id: '', createdAt: null },
            formProfile: { user_name: '' },
            formPassword: { currentPassword: '', newPassword: '', confirmPassword: '' },
            passwordRules: {
                currentPassword: [{ required: true, message: 'กรุณาระบุรหัสผ่านปัจจุบัน', trigger: 'blur' }],
                newPassword: [{ required: true, message: 'กรุณาระบุรหัสผ่านใหม่', trigger: 'blur' }, { min: 6, message: 'ต้องมีอย่างน้อย 6 ตัวอักษร', trigger: 'blur' }],
                confirmPassword: [{ validator: validatePass2, trigger: 'change' }]
            }
        };
    },
    async mounted() { await this.fetchProfile(); },
    methods: {
        async fetchProfile() {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
                this.user = res.data;
                this.formProfile.user_name = this.user.user_name;
            } catch (error) {
                if (error.response?.status === 401) { localStorage.removeItem('token'); this.$router.push('/login'); }
            }
        },
        async updateProfile() {
            if (!this.formProfile.user_name) { Swal.fire('Warning', 'กรุณาระบุชื่อ', 'warning'); return; }
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const res = await axios.put(import.meta.env.VITE_API_URL + '/auth/update-user-name', { user_name: this.formProfile.user_name }, { headers: { Authorization: `Bearer ${token}` } });
                this.user.user_name = res.data.user_name || this.formProfile.user_name;
                Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'ข้อมูลส่วนตัวถูกแก้ไขแล้ว', timer: 1500, showConfirmButton: false });
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'บันทึกไม่สำเร็จ', 'error');
            } finally { this.loading = false; }
        },
        updatePassword() {
            this.$refs.passwordForm.validate().then(async () => {
                this.loading = true;
                try {
                    const token = localStorage.getItem('token');
                    await axios.put(import.meta.env.VITE_API_URL + '/auth/update-password', {
                        currentPassword: this.formPassword.currentPassword,
                        newPassword: this.formPassword.newPassword
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
                    this.$refs.passwordForm.resetFields();
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
                } finally { this.loading = false; }
            }).catch(() => { });
        },
        getInitial(name) { return name ? name.charAt(0).toUpperCase() : '?'; },
        getAvatarColor(username) {
            const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff', '#52c41a'];
            if (!username) return colors[0];
            return colors[username.length % colors.length];
        },
        formatDate(date) { return date ? dayjs(date).format('DD MMM YYYY') : '-'; }
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

/* 2. Main Cards */
.main-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
    height: 100%;
}

/* 3. Left Profile Column */
.profile-cover {
    height: 100px;
    background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
    border-radius: 8px 8px 0 0;
}

.profile-body {
    padding: 0 24px 32px;
    text-align: center;
    margin-top: -50px;
}

.user-avatar {
    border: 4px solid #fff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.user-info {
    margin-top: 12px;
}

.user-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1f1f1f;
}

.user-handle {
    color: #8c8c8c;
    font-size: 13px;
    margin-bottom: 8px;
}

.role-badge {
    display: inline-block;
    padding: 2px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    background: #f5f5f5;
    color: #595959;
}

.role-badge.admin,
.role-badge.administrator {
    background: #fff1f0;
    color: #ff4d4f;
}

.role-badge.dev {
    background: #e6f7ff;
    color: #1890ff;
}

.role-badge.member {
    background: #f6ffed;
    color: #52c41a;
}

.details-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
}

.icon-wrap {
    width: 36px;
    height: 36px;
    background: #f5f7fa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8c8c8c;
}

.detail-content {
    display: flex;
    flex-direction: column;
}

.detail-content .label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
}

.detail-content .value {
    font-size: 14px;
    font-weight: 500;
    color: #334155;
}

/* 4. Right Settings Column */
.tab-content {
    padding: 8px 0;
}

.section-header {
    margin-bottom: 24px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 16px;
}

.section-header h4 {
    font-size: 16px;
    font-weight: 600;
    color: #1f1f1f;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-header p {
    color: #8c8c8c;
    font-size: 13px;
    margin: 0;
}

/* Inputs */
.modern-input {
    border-radius: 6px;
}

.modern-input.disabled {
    background: #fafafa;
    color: #bfbfbf;
    cursor: not-allowed;
}

.text-muted {
    color: #bfbfbf;
}

.input-hint {
    font-size: 12px;
    color: #ff4d4f;
    margin-top: 4px;
    display: block;
}

/* Buttons */
.form-actions {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #f0f0f0;
    padding-top: 24px;
}

.btn-save {
    height: 40px;
    border-radius: 6px;
    font-weight: 600;
    padding: 0 24px;
}

.btn-danger {
    height: 40px;
    border-radius: 6px;
    font-weight: 600;
    padding: 0 24px;
}

/* Alert */
.modern-alert {
    border-radius: 6px;
    border: 1px solid #e6f7ff;
    background: #f0f5ff;
}

.mb-4 {
    margin-bottom: 24px;
}

/* Tabs Customization */
.custom-tabs :deep(.ant-tabs-nav) {
    margin-bottom: 24px;
}

.custom-tabs :deep(.ant-tabs-tab) {
    margin: 0 32px 0 0;
    padding: 12px 0;
    font-size: 15px;
}
</style>