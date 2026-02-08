require("dotenv").config();

console.log(
  "🔑 All Loaded Keys:",
  Object.keys(process.env).filter((k) => k.startsWith("DISCORD")),
);

const mongoose = require("mongoose");

const {
  rotateImageWebhook,
  rotateNotificationWebhook,
} = require("./services/discordService");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 DB Connected");

    console.log("🔄 Generating Image Webhook...");
    const imgUrl = await rotateImageWebhook();
    console.log("✅ SUCCESS! Image Webhook created at:", imgUrl);

    console.log("🔄 Generating Notification Webhook...");
    const notiUrl = await rotateNotificationWebhook();
    console.log("✅ SUCCESS! Notification Webhook created at:", notiUrl);

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
};

run();
