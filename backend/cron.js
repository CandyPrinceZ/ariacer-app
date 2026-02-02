const cron = require("node-cron");
const { rotateWebhook } = require("./services/discordService");

cron.schedule("0 0 0 * * *", async () => {
  console.log("🔄 Running Daily Webhook Rotation...");
  await rotateWebhook();
});