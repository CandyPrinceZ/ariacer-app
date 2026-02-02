<template>
    <a-layout style="min-height: 100vh; background: #f8fafc;margin: -20px;">

        <div class="page-header-section">
            <div class="header-container">
                <h2 class="page-title">My Profile</h2>
                <p class="page-subtitle">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
            </div>
        </div>

        <div class="full-content-container">
            <a-row :gutter="[4,4]" class="match-height-row">

                <a-col :xs="24" :md="8" :lg="6" :xl="5">
                    <a-card :bordered="false" class="modern-card profile-summary-card">
                        <div class="profile-cover"></div>
                        <div class="profile-content">
                            <div class="avatar-box">
                                <a-avatar :size="120" class="user-avatar"
                                    :style="{ backgroundColor: getAvatarColor(user.username), fontSize: '48px' }">
                                    <template #icon v-if="!user.user_name">
                                        <UserOutlined />
                                    </template>
                                    <span>{{ getInitial(user.user_name) }}</span>
                                </a-avatar>
                            </div>

                            <h3 class="user-name">{{ user.user_name || 'Loading...' }}</h3>
                            <p class="user-handle">@{{ user.username }}</p>

                            <div class="badge-area">
                                <span :class="['role-pill', user.role_code]">
                                    {{ user.role_name || 'Member' }}
                                </span>
                            </div>

                            <div class="divider"></div>

                            <div class="details-list">
                                <div class="detail-item">
                                    <div class="icon-wrap">
                                        <IdcardOutlined />
                                    </div>
                                    <div class="detail-text">
                                        <span class="label">User ID</span>
                                        <span class="val">{{ user.user_id || '-' }}</span>
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="icon-wrap">
                                        <CalendarOutlined />
                                    </div>
                                    <div class="detail-text">
                                        <span class="label">Joined Date</span>
                                        <span class="val">{{ formatDate(user.createdAt) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a-card>
                </a-col>

                <a-col :xs="24" :md="16" :lg="18" :xl="19">
                    <a-card :bordered="false" class="modern-card settings-panel-card">
                        <a-tabs v-model:activeKey="activeTab" class="modern-tabs" size="large">

                            <a-tab-pane key="general" tab="ข้อมูลทั่วไป">
                                <div class="tab-inner">
                                    <div class="section-head">
                                        <h4>แก้ไขข้อมูลส่วนตัว</h4>
                                        <p>อัปเดตข้อมูลชื่อที่ใช้แสดงในระบบ</p>
                                    </div>

                                    <a-form layout="vertical" :model="formProfile" class="modern-form">
                                        <a-row :gutter="32">
                                            <a-col :xs="24" :lg="12">
                                                <a-form-item label="Full Name (ชื่อที่ใช้แสดง)">
                                                    <a-input v-model:value="formProfile.user_name" size="large"
                                                        placeholder="ระบุชื่อ-นามสกุล" class="clean-input">
                                                        <template #prefix>
                                                            <UserOutlined class="field-icon" />
                                                        </template>
                                                    </a-input>
                                                </a-form-item>
                                            </a-col>
                                            <a-col :xs="24" :lg="12">
                                                <a-form-item label="Username">
                                                    <a-input v-model:value="user.username" size="large" disabled
                                                        class="clean-input disabled-field">
                                                        <template #prefix>
                                                            <LockOutlined class="field-icon" />
                                                        </template>
                                                    </a-input>
                                                    <span class="input-hint">ชื่อผู้ใช้งานไม่สามารถเปลี่ยนแปลงได้</span>
                                                </a-form-item>
                                            </a-col>
                                        </a-row>

                                        <div class="form-footer">
                                            <a-button type="primary" size="large" :loading="loading"
                                                @click="updateProfile" class="btn-primary-glow">
                                                บันทึกการเปลี่ยนแปลง
                                            </a-button>
                                        </div>
                                    </a-form>
                                </div>
                            </a-tab-pane>

                            <a-tab-pane key="security" tab="ความปลอดภัย">
                                <div class="tab-inner">
                                    <div class="section-head">
                                        <h4>เปลี่ยนรหัสผ่าน</h4>
                                        <p>จัดการความปลอดภัยของบัญชีของคุณ</p>
                                    </div>

                                    <a-alert message="คำแนะนำความปลอดภัย"
                                        description="รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร และประกอบด้วยตัวเลขหรือสัญลักษณ์เพื่อความปลอดภัยสูงสุด"
                                        type="info" show-icon class="security-tip" />

                                    <a-form layout="vertical" :model="formPassword" :rules="passwordRules"
                                        ref="passwordForm" class="modern-form mt-6">
                                        <a-row :gutter="32">
                                            <a-col :xs="24" :lg="12">
                                                <a-form-item label="รหัสผ่านปัจจุบัน" name="currentPassword">
                                                    <a-input-password v-model:value="formPassword.currentPassword"
                                                        size="large" placeholder="ระบุรหัสผ่านเดิม"
                                                        class="clean-input" />
                                                </a-form-item>
                                            </a-col>
                                        </a-row>

                                        <a-row :gutter="32">
                                            <a-col :xs="24" :lg="12">
                                                <a-form-item label="รหัสผ่านใหม่" name="newPassword">
                                                    <a-input-password v-model:value="formPassword.newPassword"
                                                        size="large" placeholder="ระบุรหัสผ่านใหม่"
                                                        class="clean-input" />
                                                </a-form-item>
                                            </a-col>
                                            <a-col :xs="24" :lg="12">
                                                <a-form-item label="ยืนยันรหัสผ่านใหม่" name="confirmPassword">
                                                    <a-input-password v-model:value="formPassword.confirmPassword"
                                                        size="large" placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                                                        class="clean-input" />
                                                </a-form-item>
                                            </a-col>
                                        </a-row>

                                        <div class="form-footer">
                                            <a-button type="primary" danger ghost size="large" :loading="loading"
                                                @click="updatePassword" class="btn-danger-outline">
                                                เปลี่ยนรหัสผ่าน
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
        formatDate(date) { return date ? dayjs(date).format('D MMM YYYY') : '-'; }
    }
};
</script>

<style scoped>
/* Layout */
.page-header-section {
    background: #fff;
    padding: 32px 40px 60px;
    /* Padding bottom เยอะหน่อยเพื่อให้ Content เกยขึ้นมา */
    border-bottom: 1px solid #edf2f7;
}

.page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: -0.5px;
}

.page-subtitle {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 15px;
}

.full-content-container {
    padding: 0 40px;
    margin-top: -40px;
    /* ดึงขึ้นมาซ้อน Header */
    position: relative;
    z-index: 10;
    width: 100%;
}

/* Modern Card */
.modern-card {
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: none;
    height: 100%;
    transition: all 0.3s ease;
}

.modern-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
}

/* Left Profile Column */
.profile-summary-card :deep(.ant-card-body) {
    padding: 0;
}

.profile-cover {
    height: 120px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 16px 16px 0 0;
}

.profile-content {
    padding: 0 24px 32px;
    text-align: center;
    margin-top: -60px;
}

.user-avatar {
    border: 5px solid #fff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.user-name {
    margin: 16px 0 4px;
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
}

.user-handle {
    color: #64748b;
    font-size: 15px;
    margin-bottom: 16px;
}

.role-pill {
    display: inline-block;
    padding: 4px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.role-pill.admin,
.role-pill.administrator {
    background: #fee2e2;
    color: #ef4444;
}

.role-pill.dev {
    background: #eff6ff;
    color: #3b82f6;
}

.role-pill.member {
    background: #dcfce7;
    color: #22c55e;
}

.divider {
    height: 1px;
    background: #f1f5f9;
    margin: 24px 0;
}

.details-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 16px;
    text-align: left;
}

.icon-wrap {
    width: 44px;
    height: 44px;
    background: #f8fafc;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 20px;
}

.detail-text {
    display: flex;
    flex-direction: column;
}

.detail-text .label {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
}

.detail-text .val {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
}

/* Right Settings Column */
.tab-inner {
    padding: 12px 8px;
}

.section-head h4 {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px;
}

.section-head p {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 24px;
}

/* Inputs */
.clean-input {
    border-radius: 8px;
    border-color: #e2e8f0;
    font-size: 15px;
    padding: 10px 14px;
    box-shadow: none;
}

.clean-input:hover,
.clean-input:focus {
    border-color: #3b82f6;
}

.clean-input.disabled-field {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
}

.field-icon {
    color: #cbd5e1;
}

.input-hint {
    display: block;
    margin-top: 6px;
    color: #94a3b8;
    font-size: 13px;
}

/* Alert */
.security-tip {
    border-radius: 8px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1e40af;
    margin-bottom: 24px;
}

/* Buttons */
.form-footer {
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #f1f5f9;
    padding-top: 24px;
}

.btn-primary-glow {
    height: 46px;
    padding: 0 32px;
    border-radius: 8px;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
    border: none;
}

.btn-primary-glow:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.btn-danger-outline {
    height: 46px;
    padding: 0 32px;
    border-radius: 8px;
    font-weight: 600;
}

/* Ant Overrides */
:deep(.ant-tabs-nav) {
    margin-bottom: 32px;
    border-bottom: 1px solid #f1f5f9;
}

:deep(.ant-tabs-tab) {
    font-size: 16px;
    font-weight: 500;
    padding: 16px 0;
    margin-right: 32px;
    transition: color 0.2s;
}

:deep(.ant-tabs-tab-active) {
    font-weight: 700;
    color: #3b82f6;
}

:deep(.ant-tabs-ink-bar) {
    background: #3b82f6;
    height: 3px;
    border-radius: 3px;
}

:deep(.ant-form-item-label > label) {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
}

/* Responsive */
@media (max-width: 768px) {
    .full-content-container {
        padding: 0 16px;
        margin-top: -20px;
    }

    .page-header-section {
        padding: 24px 24px 50px;
    }
}
</style>