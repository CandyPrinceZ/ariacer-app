const axios = require("axios");
const SystemConfig = require("../models/SystemConfig");

// Constants
const CHANNEL_ID_FOR_IMAGES = process.env.DISCORD_CHANNEL_ID_FOR_IMAGES;
const CHANNEL_ID_FOR_NOTIFICATIONS =
  process.env.DISCORD_CHANNEL_ID_FOR_NOTIFICATIONS;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * ฟังก์ชันกลางสำหรับ Rotate Webhook (Private Function)
 * @param {string} channelId - ID ของห้อง Discord ที่จะสร้าง Webhook
 * @param {string} dbKey - Key ที่จะเก็บใน Database (ต้องไม่ซ้ำกัน)
 * @param {string} webhookName - ชื่อของ Webhook ที่จะโชว์ใน Discord
 */

const rotateWebhookCore = async (channelId, dbKey, webhookName) => {
  try {
    const oldConfig = await SystemConfig.findOne({ key: dbKey });

    if (oldConfig && oldConfig.value && oldConfig.value.id) {
      try {
        await axios.delete(
          `https://discord.com/api/v10/webhooks/${oldConfig.value.id}`,
          { headers: { Authorization: `Bot ${BOT_TOKEN}` } },
        );
        console.log(`🗑️ Deleted old webhook for [${dbKey}]`);
      } catch (err) {
        console.warn(
          `⚠️ Could not delete old webhook for [${dbKey}] (might be already deleted)`,
        );
      }
    }

    // 3. สร้าง Webhook ใหม่ใน Channel ที่กำหนด
    const response = await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/webhooks`,
      { name: webhookName },
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } },
    );

    const newWebhook = {
      id: response.data.id,
      token: response.data.token,
      url: `https://discord.com/api/webhooks/${response.data.id}/${response.data.token}`,
    };

    // 4. บันทึกลง Database ด้วย Key ที่แยกกัน
    await SystemConfig.findOneAndUpdate(
      { key: dbKey },
      { value: newWebhook, updatedAt: new Date() },
      { upsert: true, new: true },
    );

    console.log(`✅ New Webhook Generated for [${dbKey}]:`, newWebhook.url);
    return newWebhook.url;
  } catch (error) {
    console.error(
      `❌ Error rotating webhook [${dbKey}]:`,
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ==========================================
// Exports Functions (เรียกใช้จากภายนอก)
// ==========================================

// 1. สำหรับหมุนเวียน Webhook รูปภาพ
exports.rotateImageWebhook = async () => {
  if (!CHANNEL_ID_FOR_IMAGES)
    throw new Error("Missing DISCORD_CHANNEL_ID_FOR_IMAGES");
  return await rotateWebhookCore(
    CHANNEL_ID_FOR_IMAGES,
    "discord_webhook_images", // Key ใน DB สำหรับ Images
    "Image Bot", // ชื่อบอท
  );
};

// 2. สำหรับหมุนเวียน Webhook แจ้งเตือน
exports.rotateNotificationWebhook = async () => {
  if (!CHANNEL_ID_FOR_NOTIFICATIONS)
    throw new Error("Missing DISCORD_CHANNEL_ID_FOR_NOTIFICATIONS");
  return await rotateWebhookCore(
    CHANNEL_ID_FOR_NOTIFICATIONS,
    "discord_webhook_notifications", // Key ใน DB สำหรับ Notifications
    "Noti Bot", // ชื่อบอท
  );
};

// 3. (Optional) ถ้าอยากหมุนพร้อมกันทั้งคู่
exports.rotateAllWebhooks = async () => {
  const [imgUrl, notiUrl] = await Promise.all([
    exports.rotateImageWebhook(),
    exports.rotateNotificationWebhook(),
  ]);
  return { imgUrl, notiUrl };
};
