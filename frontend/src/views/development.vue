<template>
  <a-layout style="min-height: 100vh; background: #f0f2f5;">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">👨‍💻 Developer Console</h2>
        <p class="page-subtitle">จัดการงานพัฒนาและติดตามสถานะ Issue ของคุณ</p>
      </div>
    </div>

    <a-layout-content style="padding: 24px; margin: 0 auto; width: 100%; max-width: 1600px;">

      <a-card :bordered="false" class="main-card">
        <a-tabs v-model:activeKey="activeTab" @change="fetchIssues" type="card" :tabBarGutter="10">

          <a-tab-pane key="1">
            <template #tab>
              <span>
                <AppstoreAddOutlined /> งานที่รอคนรับ
                <a-badge :count="unassignedIssues.length" :offset="[10, -5]" class="custom-badge" color="#1890ff"
                  v-if="unassignedIssues.length > 0" />
              </span>
            </template>

            <a-alert v-if="unassignedIssues.length > 0" message="Available Tasks"
              description="งานเหล่านี้ยังไม่มีผู้รับผิดชอบ คุณสามารถกด 'รับงาน' เพื่อเริ่มดำเนินการได้ทันที" type="info"
              show-icon class="mb-4" />

            <a-table :dataSource="unassignedIssues" :columns="columns" rowKey="_id" :pagination="{ pageSize: 10 }"
              size="middle" :locale="{ emptyText: 'ไม่มีงานที่รอคนรับในขณะนี้' }">
              <template #bodyCell="{ column, record }">

                <template v-if="column.key === 'type'">
                  <div class="type-cell">
                    <a-tooltip :title="`ระดับความเร่งด่วน: ${record.urgency?.name}`">
                      <a-tag :color="record.urgency?.color" class="urgency-tag">
                        {{ record.urgency?.name }}
                      </a-tag>
                    </a-tooltip>
                    <span class="type-text">{{ record.type?.name || '-' }}</span>
                  </div>
                </template>

                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status?.code)" style="border: 0; background-color: #fff7e6;">
                    <template #icon>
                      <ClockCircleOutlined />
                    </template>
                    <span>{{ record.status?.name.toUpperCase() || 'UNKNOWN' }}</span>
                  </a-tag>
                </template>

                <template v-if="column.key === 'createdAt'">
                  <span class="date-text">
                    {{ formatDate(record.createdAt) }}
                  </span>
                </template>

                <template v-if="column.key === 'action'">
                  <a-button type="primary" size="small" ghost class="action-btn-claim" @click="goToDetail(record._id)">
                    รับงาน
                    <RightOutlined />
                  </a-button>
                </template>
              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="2">
            <template #tab>
              <span>
                <CodeOutlined /> งานของฉัน
                <a-badge :count="myIssues.length" :offset="[10, -5]" color="#52c41a" v-if="myIssues.length > 0" />
              </span>
            </template>

            <a-empty v-if="myIssues.length === 0" description="คุณยังไม่มีงานที่รับผิดชอบในขณะนี้">
              <a-button type="primary" @click="activeTab = '1'">ไปที่หน้ารับงาน</a-button>
            </a-empty>

            <a-table v-else :dataSource="myIssues" :columns="columns" rowKey="_id" :pagination="{ pageSize: 10 }">
              <template #bodyCell="{ column, record }">

                <template v-if="column.key === 'type'">
                  <div class="type-cell">
                    <a-tag :color="record.urgency?.color" class="urgency-tag">
                      {{ record.urgency?.name }}
                    </a-tag>
                    <span class="type-text">{{ record.type?.name || '-' }}</span>
                  </div>
                </template>

                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status?.code)" class="status-tag">
                    <template #icon>
                      <SyncOutlined v-if="record.status?.code === 'inProgress'" spin />
                      <CheckCircleOutlined v-else-if="record.status?.code === 'success'" />
                      <FieldTimeOutlined v-else />
                    </template>
                    {{ (record.status?.name || 'Unknown').toUpperCase() }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'createdAt'">
                  <span class="date-text">{{ formatDate(record.createdAt) }}</span>
                </template>

                <template v-if="column.key === 'action'">
                  <a-button v-if="record.status?.code === 'success'" type="primary" size="small" class="action-btn-manage" @click="goToDetail(record._id)"
                    disabled>
                    <EditOutlined /> จัดการ
                  </a-button>
                  <a-button v-else type="primary" size="small" class="action-btn-manage" @click="goToDetail(record._id)">
                    <EditOutlined /> จัดการ
                  </a-button>
                </template>

              </template>
            </a-table>
          </a-tab-pane>

        </a-tabs>
      </a-card>
    </a-layout-content>
  </a-layout>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import {
  ClockCircleOutlined,
  RightOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  AppstoreAddOutlined,
  CodeOutlined,
  FieldTimeOutlined,
  EditOutlined
} from '@ant-design/icons-vue';

export default {
  name: 'DevelopmentView',
  components: {
    ClockCircleOutlined,
    RightOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    AppstoreAddOutlined,
    CodeOutlined,
    FieldTimeOutlined,
    EditOutlined
  },
  data() {
    return {
      activeTab: '1',
      user: null,
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 90,
          align: 'center',
          fixed: 'left',
          customRender: ({ text }) => text ? `#${text}` : '-'
        },
        {
          title: 'หัวข้อ (Title)',
          dataIndex: 'name',
          key: 'name',
          ellipsis: true,
          width: '30%'
        },
        {
          title: 'ประเภท & ความเร่งด่วน',
          dataIndex: 'type',
          key: 'type',
          width: 220,
        },
        {
          title: 'สถานะ',
          dataIndex: 'status',
          key: 'status',
          width: 160,
          align: 'center',
        },
        {
          title: 'วันที่แจ้ง',
          dataIndex: 'createdAt',
          key: 'createdAt',
          width: 150,
          align: 'center',
        },
        {
          title: 'ดำเนินการ',
          key: 'action',
          width: 120,
          align: 'center',
          fixed: 'right'
        },
      ],
      unassignedIssues: [],
      myIssues: []
    };
  },
  methods: {
    async fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(import.meta.env.VITE_API_URL + '/auth/profile', config);
        this.user = response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        }
      }
    },
    async fetchIssues() {
      if (!this.user) return;

      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Unassigned
        const resUnassigned = await axios.get(import.meta.env.VITE_API_URL + '/issues/unassigned', config);
        this.unassignedIssues = resUnassigned.data;

        // 2. My Issues
        const resMyIssues = await axios.get(import.meta.env.VITE_API_URL + '/issues/assigned/' + this.user._id, config);
        this.myIssues = resMyIssues.data;

      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    },
    getStatusColor(code) {
      const map = {
        reported: 'warning',
        recived: 'default',
        inProgress: 'processing', // สีฟ้า
        finished: 'cyan',
        testing: 'warning',       // สีส้ม
        success: 'success',       // สีเขียว
        upserver: 'purple',
        rejected: 'red'           // สีแดง
      };
      return map[code] || 'default';
    },
    goToDetail(id) {
      this.$router.push(`/development/detail/${id}`);
    },
    formatDate(date) {
      if (!date) return '-';
      const d = dayjs(date);
      if (!d.isValid()) return '-';
      return d.format('DD/MM/YYYY HH:mm'); // ใช้ BBBB ถ้าลง plugin พ.ศ. หรือใช้ YYYY
    }
  },
  async mounted() {
    await this.fetchProfile();
    if (this.user) {
      this.fetchIssues();
    }
  }
};
</script>

<style scoped>
/* Page Header Style */
.page-header {
  background: #fff;
  padding: 24px 32px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
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

/* Card Style */
.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  transition: all 0.3s;
}

.main-card:hover {
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.05);
}

/* Table Cells */
.type-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-text {
  font-weight: 500;
  color: #262626;
}

.urgency-tag {
  margin-right: 0;
  border-radius: 4px;
  min-width: 60px;
  text-align: center;
  font-size: 12px;
}

.status-tag {
  min-width: 100px;
  text-align: center;
  border-radius: 4px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.date-text {
  color: #8c8c8c;
  font-size: 13px;
}

/* Utilities */
.mb-4 {
  margin-bottom: 16px;
}

/* Buttons */
.action-btn-manage {
  background-color: #1890ff;
  border-radius: 4px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
}

.action-btn-claim:hover {
  background-color: #e6f7ff;
}

/* Customize Tabs */
:deep(.ant-tabs-nav) {
  margin-bottom: 24px;
}
</style>