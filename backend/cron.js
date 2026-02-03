const cron = require("node-cron");
const { rotateWebhook } = require("./services/discordService");

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
  timezone: "Asia/Bangkok" // 👈 บรรทัดนี้สำคัญมาก
});