<template>
    <a-layout style="min-height: 100vh; background: #f0f2f5;">
        <div style="padding: 24px 24px 0;">
            <h2 style="margin-bottom: 0; font-weight: 600; color: #1f1f1f;">My Profile</h2>
            <p style="color: #8c8c8c;">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
        </div>

        <div style="padding: 24px;">
            <a-row :gutter="[24, 24]">

                <a-col :xs="24" :md="8" :lg="7">
                    <a-card :bordered="false" class="profile-card">
                        <div class="profile-header">
                            <div class="avatar-wrapper">
                                <a-avatar :size="100" class="main-avatar"
                                    :style="{ backgroundColor: getAvatarColor(user.username) }">
                                    <template #icon v-if="!user.user_name">
                                        <UserOutlined />
                                    </template>
                                    <span style="font-size: 42px;">{{ getInitial(user.user_name) }}</span>
                                </a-avatar>
                                <a-upload :show-upload-list="false" :before-upload="beforeUploadAvatar">
                                    <div class="camera-icon">
                                        <CameraOutlined />
                                    </div>
                                </a-upload>
                            </div>

                            <h3 class="profile-name">{{ user.user_name || 'Loading...' }}</h3>
                            <p class="profile-username">@{{ user.username }}</p>

                            <a-tag :color="getRoleColor(user.role_code)" class="role-badge">
                                {{ user.role_name || 'Member' }}
                            </a-tag>
                        </div>

                        <a-divider />

                        <div class="info-list">
                            <div class="info-item">
                                <span class="label">
                                    <IdcardOutlined /> User ID:
                                </span>
                                <span class="value">{{ user.user_id || '-' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">
                                    <CalendarOutlined /> Joined:
                                </span>
                                <span class="value">{{ formatDate(user.createdAt) }}</span>
                            </div>
                        </div>
                    </a-card>
                </a-col>

                <a-col :xs="24" :md="16" :lg="17">
                    <a-card :bordered="false" class="settings-card">
                        <a-tabs v-model:activeKey="activeTab">

                            <a-tab-pane key="general" tab="ข้อมูลทั่วไป">
                                <a-form layout="vertical" :model="formProfile" class="setting-form">
                                    <a-row :gutter="16">
                                        <a-col :span="24">
                                            <a-form-item label="Full Name (ชื่อที่ใช้แสดง)">
                                                <a-input v-model:value="formProfile.user_name" size="large"
                                                    placeholder="ระบุชื่อ-นามสกุล">
                                                    <template #prefix>
                                                        <UserOutlined style="color: rgba(0,0,0,.25)" />
                                                    </template>
                                                </a-input>
                                            </a-form-item>
                                        </a-col>
                                        <a-col :span="24">
                                            <a-form-item label="Username (เปลี่ยนไม่ได้)">
                                                <a-input v-model:value="user.username" size="large" disabled>
                                                    <template #prefix>
                                                        <LockOutlined style="color: rgba(0,0,0,.25)" />
                                                    </template>
                                                </a-input>
                                            </a-form-item>
                                        </a-col>
                                    </a-row>
                                    <div class="form-actions">
                                        <a-button type="primary" size="large" :loading="loading" @click="updateProfile">
                                            บันทึกการเปลี่ยนแปลง
                                        </a-button>
                                    </div>
                                </a-form>
                            </a-tab-pane>

                            <a-tab-pane key="security" tab="ความปลอดภัย & รหัสผ่าน">
                                <a-alert message="คำแนะนำ"
                                    description="รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร เพื่อความปลอดภัยของบัญชี"
                                    type="info" show-icon style="margin-bottom: 24px;" />

                                <a-form layout="vertical" :model="formPassword" :rules="passwordRules"
                                    ref="passwordForm">
                                    <a-form-item label="รหัสผ่านปัจจุบัน" name="currentPassword">
                                        <a-input-password v-model:value="formPassword.currentPassword" size="large"
                                            placeholder="••••••" />
                                    </a-form-item>

                                    <a-form-item label="รหัสผ่านใหม่" name="newPassword">
                                        <a-input-password v-model:value="formPassword.newPassword" size="large"
                                            placeholder="••••••" />
                                    </a-form-item>

                                    <a-form-item label="ยืนยันรหัสผ่านใหม่" name="confirmPassword">
                                        <a-input-password v-model:value="formPassword.confirmPassword" size="large"
                                            placeholder="••••••" />
                                    </a-form-item>

                                    <div class="form-actions">
                                        <a-button type="primary" danger ghost size="large" :loading="loading"
                                            @click="updatePassword">
                                            เปลี่ยนรหัสผ่าน
                                        </a-button>
                                    </div>
                                </a-form>
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
import {
    UserOutlined,
    CameraOutlined,
    IdcardOutlined,
    CalendarOutlined,
    LockOutlined
} from '@ant-design/icons-vue';

export default {
    name: 'MyProfile',
    components: {
        UserOutlined,
        CameraOutlined,
        IdcardOutlined,
        CalendarOutlined,
        LockOutlined
    },
    data() {
        // Validator สำหรับเช็คว่ารหัสผ่านตรงกันไหม
        const validatePass2 = async (_rule, value) => {
            if (value === '') {
                return Promise.reject('กรุณายืนยันรหัสผ่านใหม่');
            } else if (value !== this.formPassword.newPassword) {
                return Promise.reject("รหัสผ่านไม่ตรงกัน!");
            } else {
                return Promise.resolve();
            }
        };

        return {
            loading: false,
            activeTab: 'general',

            user: {
                user_name: '',
                username: '',
                role_name: '',
                role_code: '',
                user_id: '',
                created_at: null
            },

            formProfile: {
                user_name: ''
            },

            formPassword: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            },

            passwordRules: {
                currentPassword: [{ required: true, message: 'กรุณาระบุรหัสผ่านปัจจุบัน', trigger: 'blur' }],
                newPassword: [{ required: true, message: 'กรุณาระบุรหัสผ่านใหม่', trigger: 'blur' }, { min: 6, message: 'ต้องมีอย่างน้อย 6 ตัวอักษร', trigger: 'blur' }],
                confirmPassword: [{ validator: validatePass2, trigger: 'change' }]
            }
        };
    },
    async mounted() {
        await this.fetchProfile();
    },
    methods: {
        async fetchProfile() {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', config);

                this.user = response.data;
                this.formProfile.user_name = this.user.user_name;

            } catch (error) {
                console.error('Error fetching profile:', error);
                // ถ้า Token หมดอายุหรือไม่ถูกต้อง อาจจะดีดไปหน้า Login
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    this.$router.push('/login');
                }
            }
        },

        async updateProfile() {
            if (!this.formProfile.user_name) {
                Swal.fire('Warning', 'กรุณาระบุชื่อ', 'warning');
                return;
            }

            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // --- ยิง API จริง ---
                const res = await axios.put(import.meta.env.VITE_API_URL + '/auth/update-user-name', {
                    user_name: this.formProfile.user_name
                }, config);

                // อัปเดตข้อมูลหน้าจอจากสิ่งที่ Server ตอบกลับมา (หรือจากฟอร์ม)
                this.user.user_name = res.data.user_name || this.formProfile.user_name;

                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: 'ข้อมูลส่วนตัวถูกแก้ไขแล้ว',
                    timer: 1500,
                    showConfirmButton: false
                });

            } catch (error) {
                console.error(error);
                const errMsg = error.response?.data?.message || 'บันทึกไม่สำเร็จ';
                Swal.fire('Error', errMsg, 'error');
            } finally {
                this.loading = false;
            }
        },

        updatePassword() {
            this.$refs.passwordForm.validate().then(async () => {
                this.loading = true;
                try {
                    const token = localStorage.getItem('token');
                    const config = { headers: { Authorization: `Bearer ${token}` } };

                    // --- ยิง API จริง ---
                    await axios.put(import.meta.env.VITE_API_URL + '/auth/update-password', {
                        currentPassword: this.formPassword.currentPassword,
                        newPassword: this.formPassword.newPassword
                    }, config);

                    Swal.fire({
                        icon: 'success',
                        title: 'สำเร็จ',
                        text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    // เคลียร์ฟอร์ม
                    this.$refs.passwordForm.resetFields();

                } catch (error) {
                    console.error(error);
                    const errMsg = error.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
                    Swal.fire('Error', errMsg, 'error');
                } finally {
                    this.loading = false;
                }
            }).catch(() => {
                // Validation Failed
            });
        },

        getInitial(name) {
            return name ? name.charAt(0).toUpperCase() : '?';
        },
        getAvatarColor(username) {
            const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff', '#52c41a'];
            if (!username) return colors[0];
            const index = username.length % colors.length;
            return colors[index];
        },
        getRoleColor(code) {
            if (code === 'admin' || code === 'administrator') return 'red';
            if (code === 'dev') return 'blue';
            return 'green';
        },
        formatDate(date) {
            if (!date) return '-';
            return dayjs(date).format('DD MMM YYYY');
        },
        beforeUploadAvatar(file) {
            const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
            if (!isJpgOrPng) {
                Swal.fire('Error', 'อัปโหลดได้เฉพาะไฟล์ JPG/PNG เท่านั้น', 'error');
                return false;
            }
            // ถ้าจะทำ Upload รูปจริง ต้องเขียน API เพิ่มแล้วยิง axios.post ตรงนี้
            Swal.fire('Info', 'ระบบอัปโหลดรูปโปรไฟล์ยังไม่เปิดใช้งานใน Demo นี้', 'info');
            return false;
        }
    }
};
</script>

<style scoped>
.profile-card {
    text-align: center;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.profile-header {
    padding: 20px 0 10px;
}

.avatar-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
}

.main-avatar {
    border: 4px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.camera-icon {
    position: absolute;
    bottom: 0;
    right: 0;
    background: #1890ff;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px solid white;
    transition: all 0.2s;
}

.camera-icon:hover {
    background: #40a9ff;
    transform: scale(1.1);
}

.profile-name {
    font-size: 20px;
    font-weight: 700;
    color: #1f1f1f;
    margin-bottom: 4px;
}

.profile-username {
    color: #8c8c8c;
    margin-bottom: 12px;
}

.role-badge {
    padding: 2px 12px;
    border-radius: 12px;
    font-size: 12px;
}

/* Info List Styles */
.info-list {
    text-align: left;
    padding: 0 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
    border-bottom: none;
}

.info-item .label {
    color: #8c8c8c;
    display: flex;
    align-items: center;
    gap: 8px;
}

.info-item .value {
    font-weight: 500;
    color: #262626;
}

/* Settings Card Styles */
.settings-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    min-height: 400px;
}

.setting-form {
    max-width: 600px;
    margin-top: 20px;
}

.form-actions {
    margin-top: 32px;
}

/* Ant Design Override (Optional) */
:deep(.ant-tabs-nav) {
    margin-bottom: 24px;
}
</style>