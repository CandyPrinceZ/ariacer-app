const cron = require("node-cron");
const { rotateWebhook } = require("./services/discordService");
const ActivityLog = require("./models/activityLog");

cron.schedule("0 0 0 * * *", async () => {
  console.log("🔄 Running Daily Webhook Rotation... " + new Date().toLocaleString());
  try {
      await rotateWebhook();
      console.log("✅ Success");
  } catch (err) {
      console.error("❌ Error:", err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Bangkok"
});

// ตั้งเวลา: รันทุกวัน ตอนตี 3 (0 3 * * *)
cron.schedule("0 3 * * *", async () => {
  console.log("🧹 Running Auto Log Cleanup...");
  try {
    const d = new Date();
    d.setDate(d.getDate() - 30);

    // ลบ Log ที่เก่ากว่า 30 วัน
    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: d } // $lt = Less Than (น้อยกว่า/เก่ากว่า)
    });

    console.log(`✅ Cleanup Success: Deleted ${result.deletedCount} old logs.`);
  } catch (err) {
    console.error("❌ Cleanup Error:", err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Bangkok"
});