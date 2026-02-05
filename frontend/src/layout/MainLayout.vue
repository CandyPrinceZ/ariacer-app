<template>
  <div class="app-layout">
    <SideBar class="sidebar-container" />

    <div class="main-content">
      <Headers />

      <div class="page-view">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import Headers from './Header.vue'
import SideBar from './Sidebar.vue'
import axios from 'axios';
import { notification } from 'ant-design-vue';

export default {
  name: 'MainLayout',
  components: {
    Headers,
    SideBar
  },
  data() {
    return {
      Myissue: [],
      HighIssue: [],      
      CriticalIssue: [],  
    };
  },
  async mounted() {
    console.log("MainLayout Mounted");
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');

      // ถ้าไม่มี Token หรือ UserID ให้หยุดทำงาน (ไม่ต้องแจ้งเตือน)
      if (!token || !userId) {
        return;
      }

      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const urgencyRes = await axios.get(import.meta.env.VITE_API_URL + '/issues/high-urgency', config);
        const allUrgentIssues = urgencyRes.data || [];

        this.HighIssue = allUrgentIssues.filter(issue => issue.urgency?.code === 'high');
        this.CriticalIssue = allUrgentIssues.filter(issue => issue.urgency?.code === 'critical');

        const myIssueRes = await axios.get(import.meta.env.VITE_API_URL + '/issues/assigned/' + userId, config);
        this.Myissue = myIssueRes.data || [];

        console.log("API Success", { 
            Critical: this.CriticalIssue.length, 
            High: this.HighIssue.length, 
            My: this.Myissue.length 
        });

        // 3. เรียกฟังก์ชันแจ้งเตือน
        this.checkAndAlert();

      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          this.$router.push('/login');
        }
      }
    },

    checkAndAlert() {
      // ตรวจสอบจำนวนงาน
      const criticalCount = this.CriticalIssue.length;
      const highCount = this.HighIssue.length;
      const myCount = this.Myissue.length;

      if (criticalCount > 0) {
        notification.error({
          message: '🚨 แจ้งเตือนงานวิกฤต (Critical)',
          description: `มีงานระดับ Critical เข้ามาในระบบจำนวน ${criticalCount} งาน กรุณาตรวจสอบทันที`,
          placement: 'topRight',
          duration: 6, 
        });
      }
      if (highCount > 0) {
        notification.warning({
          message: '⚠️ แจ้งเตือนงานด่วน (High)',
          description: `มีงานระดับ High รอการแก้ไขจำนวน ${highCount} งาน`,
          placement: 'topRight',
          duration: 5,
        });
      }

      if (myCount > 0) {
        setTimeout(() => {
            notification.success({
            message: '📌 อัปเดตงานของคุณ',
            description: `คุณมีงานที่ได้รับมอบหมายทั้งหมด ${myCount} งาน`,
            placement: 'topRight',
            duration: 4.5,
            });
        }, 500);
      }
    }
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.sidebar-container {
  width: 250px;
  flex-shrink: 0;
  background-color: #001529;
  color: white;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  overflow: hidden;
}

.page-view {
  flex: 1;
  overflow-y: auto;
}
</style>