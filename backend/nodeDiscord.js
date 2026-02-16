require("dotenv").config();
const axios = require("axios");

// ฟังก์ชันสำหรับทดสอบยิงแจ้งเตือน
const runTest = async () => {
  try {
    const apiBaseUrl = process.env.VITE_API_URL || "http://localhost:3000/api";

    console.log("1️⃣ กำลังดึง Webhook URL จาก API...");


    const configResponse = await axios.get(
      `${apiBaseUrl}/config/discord-webhook-notifications`,
      {
        headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NmI1YzYzYmRhMGZhYzk2M2EzZGMyMyIsInJvbGUiOiJBZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzcwNTE0MDUxLCJleHAiOjE3NzA3NzMyNTF9.AdRs8kIdczqmVsAfJEap5HqHtDYC8iQAyqaYymb-lI8` },
      },
    );

    const webhookUrl = configResponse.data.url;

    if (!webhookUrl) {
      throw new Error("ไม่พบ Webhook URL ในการตอบกลับ");
    }

    console.log("✅ ได้รับ Webhook URL:", webhookUrl);
    console.log("2️⃣ กำลังส่งข้อความไปยัง Discord...");

    await axios.post(webhookUrl, {
      content:
        "📢 สวัสดีครับ! นี่คือการทดสอบแจ้งเตือนจากระบบ (Notification Check)",
      username: "System Test Bot",
    });

    console.log("✅ ส่งเรียบร้อย!");
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ Server Error:",
        error.response.status,
        error.response.data,
      );
    } else if (error.request) {
      console.error("❌ No Response from Server. เช็คว่า Backend รันอยู่ไหม?");
    } else {
      console.error("❌ Error Message:", error.message);
    }
  }
};

runTest();
