const cron = require("node-cron");
// ✅ 1. เปลี่ยนการ import ให้เรียกใช้ฟังก์ชันใหม่ทั้ง 2 ตัว
const {
  rotateImageWebhook,
  rotateNotificationWebhook,
} = require("./services/discordService");
const ActivityLog = require("./models/activityLog");

// ตั้งเวลา: รันทุกวัน ตอนเที่ยงคืน (0 0 0 * * *)
cron.schedule(
  "0 0 0 * * *",
  async () => {
    console.log(
      "🔄 Running Daily Webhook Rotation... " + new Date().toLocaleString(),
    );

    try {
      // ✅ 2. สั่งหมุน Webhook สำหรับรูปภาพ
      console.log("   - Rotating Image Webhook...");
      const imgUrl = await rotateImageWebhook();
      console.log("   ✅ Image Webhook Success");

      // ✅ 3. สั่งหมุน Webhook สำหรับแจ้งเตือน
      console.log("   - Rotating Notification Webhook...");
      const notiUrl = await rotateNotificationWebhook();
      console.log("   ✅ Notification Webhook Success");
    } catch (err) {
      console.error("❌ Error during webhook rotation:", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Bangkok",
  },
);

// ตั้งเวลา: รันทุกวัน ตอนตี 3 (0 3 * * *)
cron.schedule(
  "0 3 * * *",
  async () => {
    console.log("🧹 Running Auto Log Cleanup...");
    try {
      const d = new Date();
      d.setDate(d.getDate() - 30);

      // ลบ Log ที่เก่ากว่า 30 วัน
      const result = await ActivityLog.deleteMany({
        createdAt: { $lt: d }, // $lt = Less Than (น้อยกว่า/เก่ากว่า)
      });

      console.log(
        `✅ Cleanup Success: Deleted ${result.deletedCount} old logs.`,
      );
    } catch (err) {
      console.error("❌ Cleanup Error:", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Bangkok",
  },
);
