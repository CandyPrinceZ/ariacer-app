<template>
  <a-layout class="login-layout">
    <a-row type="flex" justify="center" align="middle" style="min-height: 100vh;">
      <a-col :xs="22" :sm="16" :md="12" :lg="8" :xl="6">

        <div class="header-content">
          <a-space direction="vertical" align="center" size="small">
            <div class="logo-wrapper">
              <SafetyCertificateTwoTone two-tone-color="#1890ff" class="logo-icon" />
            </div>

            <a-typography-title :level="2" class="app-title">
              Ariacer Admin
            </a-typography-title>
            <a-typography-text type="secondary" class="app-subtitle">
              ระบบจัดการข้อมูลและแจ้งปัญหาออนไลน์
            </a-typography-text>
          </a-space>
        </div>

        <a-card :bordered="false" class="login-card">
          <a-typography-title :level="4" class="form-title">
            เข้าสู่ระบบ
          </a-typography-title>

          <a-form layout="vertical" :model="formState">

            <a-form-item name="username" style="margin-bottom: 24px;">
              <a-input v-model:value="username" placeholder="Username" size="large" @keyup.enter="handleSubmit">
                <template #prefix>
                  <UserOutlined style="color: rgba(0,0,0,.25)" />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item name="password" style="margin-bottom: 24px;">
              <a-input-password v-model:value="password" placeholder="Password" size="large"
                @keyup.enter="handleSubmit">
                <template #prefix>
                  <LockOutlined style="color: rgba(0,0,0,.25)" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item style="margin-bottom: 0;">
              <a-button type="primary" block size="large" :loading="loading" @click="handleSubmit" class="submit-btn">
                Sign In
              </a-button>
            </a-form-item>

          </a-form>
        </a-card>

        <div class="footer-content">
          <a-typography-text type="secondary" style="font-size: 12px;">
            Copyright © 2026 Ariacer Tech. All rights reserved.
          </a-typography-text>
        </div>

      </a-col>
    </a-row>
  </a-layout>
</template>

<script>
// (Script เหมือนเดิม ไม่มีการเปลี่ยนแปลง Logic)
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateTwoTone
} from '@ant-design/icons-vue';

export default {
  name: 'UserLogin',
  components: {
    UserOutlined,
    LockOutlined,
    SafetyCertificateTwoTone
  },
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      formState: {}
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.username || !this.password) {
        Swal.fire({
          icon: 'warning',
          title: 'ข้อมูลไม่ครบถ้วน',
          text: 'กรุณาระบุ Username และ Password',
          confirmButtonColor: '#001529'
        });
        return;
      }

      this.loading = true;

      try {
        const response = await axios.post(import.meta.env.VITE_API_URL + '/auth/login', {
          username: this.username,
          password: this.password
        });

        console.log('Login Success:', response.data);

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        Toast.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ'
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data._id);
        localStorage.setItem('user_role', response.data.role);

        this.$router.push('/dashboard');

      } catch (error) {
        console.error('Login Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: error.response?.data?.message || 'Username หรือ Password ไม่ถูกต้อง',
          confirmButtonColor: '#d33'
        });
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
/* พื้นหลังและ Layout หลัก */
.login-layout {
  background-color: #f0f2f5;
  background-image: url('https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg');
  background-repeat: no-repeat;
  background-position: center 110px;
  background-size: 100%;
}

/* ส่วน Header (Logo & Title) */
.header-content {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 48px;
}

.app-title {
  margin-bottom: 0 !important;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

/* การ์ด Login */
.login-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-title {
  text-align: center;
  margin-bottom: 24px !important;
  color: #001529;
}

/* ปุ่ม Sign In */
.submit-btn {
  background-color: #001529;
  border-color: #001529;
  height: 40px;
  font-weight: 500;
}

.submit-btn:hover,
.submit-btn:focus {
  background-color: #002c52;
  border-color: #002c52;
}

/* Footer */
.footer-content {
  margin-top: 48px;
  text-align: center;
}

/* ==========================================================================
   📱 Mobile Responsive Tweaks (Added)
   ========================================================================== */
@media (max-width: 768px) {

  /* ซ่อน Background Image บนมือถือเพื่อให้สะอาดตา */
  .login-layout {
    background-image: none;
    background-color: #f5f7fa;
  }

  /* ลดขนาด Logo และ Title */
  .logo-icon {
    font-size: 40px !important;
  }

  .app-title {
    font-size: 24px !important;
  }

  .app-subtitle {
    font-size: 12px;
  }

  /* ปรับระยะห่าง Header */
  .header-content {
    margin-bottom: 24px;
    margin-top: 40px;
  }

  /* ปรับ Card */
  .login-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    /* ลดเงา */
  }

  /* ปรับ Footer */
  .footer-content {
    margin-top: 32px;
    padding-bottom: 20px;
  }
}
</style>