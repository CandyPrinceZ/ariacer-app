const axios = require("axios");
const SystemConfig = require("../models/SystemConfig");

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

exports.rotateWebhook = async () => {
  try {
    const oldConfig = await SystemConfig.findOne({ key: "discord_webhook" });

    if (oldConfig && oldConfig.value && oldConfig.value.id) {
      try {
        await axios.delete(
          `https://discord.com/api/v10/webhooks/${oldConfig.value.id}`,
          { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
        );
        console.log("🗑️ Deleted old webhook");
      } catch (err) {
        console.warn("⚠️ Could not delete old webhook (might be already deleted)");
      }
    }

    const response = await axios.post(
      `https://discord.com/api/v10/channels/${CHANNEL_ID}/webhooks`,
      { name: "My Daily Bot" }, // ชื่อ Webhook ที่จะแสดง
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    const newWebhook = {
      id: response.data.id,
      token: response.data.token,
      url: `https://discord.com/api/webhooks/${response.data.id}/${response.data.token}`
    };

    await SystemConfig.findOneAndUpdate(
      { key: "discord_webhook" },
      { value: newWebhook, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log("✅ New Webhook Generated:", newWebhook.url);
    return newWebhook.url;

  } catch (error) {
    console.error("❌ Error rotating webhook:", error.response?.data || error.message);
    throw error;
  }
};