const SystemConfig = require("../models/SystemConfig");
const ActivityLog = require("../models/activityLog");

exports.getSystemLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("user", "user_name role_name avatar")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error("Error fetching system logs:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDiscordWebhookForImages = async (req, res) => {
  try {
    const config = await SystemConfig.findOne({
      key: "discord_webhook_images",
    });

    if (!config || !config.value || !config.value.url) {
      return res
        .status(404)
        .json({ message: "Image Webhook not found/generated yet" });
    }

    res.json({ url: config.value.url });
  } catch (error) {
    console.error("Error fetching webhook:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDiscordWebhookForNotifications = async (req, res) => {
  try {
    const config = await SystemConfig.findOne({
      key: "discord_webhook_notifications",
    });

    if (!config || !config.value || !config.value.url) {
      return res
        .status(404)
        .json({ message: "Notification Webhook not found/generated yet" });
    }

    res.json({ url: config.value.url });
  } catch (error) {
    console.error("Error fetching webhook:", error);
    res.status(500).json({ message: error.message });
  }
};
