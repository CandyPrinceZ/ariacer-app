const SystemConfig = require("../models/SystemConfig");

exports.getDiscordWebhook = async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ key: "discord_webhook" });
    
    if (!config || !config.value || !config.value.url) {
      return res.status(404).json({ message: "Webhook not found/generated yet" });
    }

    res.json({ url: config.value.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};