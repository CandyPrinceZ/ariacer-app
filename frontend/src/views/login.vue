<template>
    <div class="page">
        <div class="container">
            <div class="form-box">
                <form>
                    <h2>Sign In</h2>

                    <div class="input-box">
                        <a-input placeholder="Username" v-model:value="username"/>
                    </div>

                    <div class="input-box">
                        <a-input-password placeholder="Password" v-model:value="password"/>
                    </div>

                    <a-button type="primary" block class="login-btn" @click="handleSubmit">
                        Login
                    </a-button>
                </form>
            </div>

            <div class="form-bg">
                <span class="shape shape4"></span>
                <span class="shape shape3"></span>
                <span class="shape shape2"></span>
                <span class="shape shape1"></span>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'; 
import Swal from 'sweetalert2';

export default {
  name: 'UserLogin', // Solves "multi-word-component-names" error
  data() {
    return {
      username: '',
      password: '',
      loading: false, // For button loading state
    }
  },
  methods: {
    async handleSubmit() {
      // 1. Basic Validation
      if (!this.username || !this.password) {
        Swal.fire({
          icon: 'warning',
          title: 'Oops...',
          text: 'Please fill in both fields.',
          showConfirmButton: true
        })
        return;
      }

      this.loading = true;

      try {
        // 2. Send data to your backend (Replace URL with your API)
        const response = await axios.post(import.meta.env.VITE_API_URL + '/auth/login', {
          username: this.username,
          password: this.password
        });

        // 3. Handle Success
        console.log('Login Success:', response.data);
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          showConfirmButton: false,
          timer: 1500
        })
        
        // Example: Save token and redirect
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user_role', response.data.role);
        this.$router.push('/dashboard');

      } catch (error) {
        // 4. Handle Error
        console.error('Login Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: error.response?.data?.message || error.message,
          showConfirmButton: true
        })
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(#FFFAFA, #F8F8FF, #F5F5F5);
  overflow: hidden;
  padding: 24px;
}

.container {
  background: linear-gradient(90deg, #131346, #000080);
  position: relative;
  height: 600px;
  width: 360px;
  box-shadow: 0 0 24px #000;
  overflow: hidden;
  border-radius: 26px;
}


form {
  position: relative;
  height: 100%;
  width: 320px;
  padding: 30px;
  z-index: 1;
}

h2 {
  color: #000000;
  font-size: 35px;
  margin: 0 0 24px;
}

.input-box {
  padding: 12px 0;
}

:deep(.ant-input),
:deep(.ant-input-affix-wrapper) {
  background: transparent;
  border: none;
  border-bottom: 2px solid #d1d1d4;
  border-radius: 0;
  color: #000000;
}
:deep(.ant-input-affix-wrapper input) {
  color: #111;
}

:deep(.ant-input::placeholder) {
  color: #000
}

:deep(.ant-input-affix-wrapper:hover),
:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-input:hover),
:deep(.ant-input:focus) {
  border-bottom-color: #00ffa2;
  box-shadow: none;
}

.login-btn {
  margin-top: 22px;
  border-radius: 26px;
  font-weight: 700;
  text-transform: uppercase;
  background: #131346;
  color: #FFF;
}

.form-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.form-bg .shape {
  transform: rotate(45deg);
  position: absolute;
}

.form-bg .shape1 {
  height: 520px;
  width: 520px;
  background-color: #fff;
  top: -50px;
  right: 120px;
  border-radius: 0 72px 0 0;
}

.form-bg .shape2 {
  height: 220px;
  width: 220px;
  background-color: #150c33;
  top: -172px;
  right: 0;
  border-radius: 32px;
}

</style>