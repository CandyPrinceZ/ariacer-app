require("dotenv").config();

console.log("🔑 All Loaded Keys:", Object.keys(process.env).filter(k => k.startsWith("DISCORD"))); 
console.log("TARGET ID:", process.env.DISCORD_CHANNEL_ID);

const mongoose = require("mongoose");
const { rotateWebhook } = require("./services/discordService");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 DB Connected");

    console.log("🔄 Generating first webhook...");
    const url = await rotateWebhook();
    
    console.log("✅ SUCCESS! Webhook created at:", url);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
};

run();