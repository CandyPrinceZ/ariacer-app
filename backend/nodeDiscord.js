require("dotenv").config(); // โหลดค่าจาก .env (จำเป็นต้องมีบรรทัดนี้ถ้ารันไฟล์แยก)
const axios = require("axios");

// ฟังก์ชันสำหรับทดสอบยิงแจ้งเตือน
const runTest = async () => {
  try {
    // URL ของ API หลังบ้านเรา (เช็คให้แน่ใจว่า port ถูกต้อง)
    const apiBaseUrl = process.env.VITE_API_URL || "http://localhost:3000/api";

    console.log("1️⃣ กำลังดึง Webhook URL จาก API...");

    // 1. ดึง URL จาก Backend เราก่อน
    // *** ต้องแน่ใจว่าคุณสร้าง Route '/config/discord-webhook-notifications' แล้วนะครับ ***
    // ถ้ายังไม่ได้สร้าง ให้ใช้ endpoint เดิม หรือแก้ controller ให้รองรับ
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

    // 2. ยิงเข้า Discord โดยตรง
    await axios.post(webhookUrl, {
      content:
        "📢 สวัสดีครับ! นี่คือการทดสอบแจ้งเตือนจากระบบ (Notification Check)",
      username: "System Test Bot",
    });

    console.log("✅ ส่งเรียบร้อย!");
  } catch (error) {
    // 👇 แก้บรรทัดนี้ให้ปริ้นท์ละเอียดขึ้น
    if (error.response) {
      // Server ตอบกลับมา (เช่น 404, 500)
      console.error(
        "❌ Server Error:",
        error.response.status,
        error.response.data,
      );
    } else if (error.request) {
      // ส่งไปแล้วเงียบ (Server ไม่ตอบ)
      console.error("❌ No Response from Server. เช็คว่า Backend รันอยู่ไหม?");
    } else {
      // Error อื่นๆ (เช่น Syntax)
      console.error("❌ Error Message:", error.message);
    }
  }
};

// รันฟังก์ชัน
runTest();
