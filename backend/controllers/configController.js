const SystemConfig = require("../models/SystemConfig");
const ActivityLog = require("../models/activityLog");

// --- 1. ดึง Log การใช้งานระบบ (System Activity Logs) ---
exports.getSystemLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("user", "user_name role_name")
      .sort({ createdAt: -1 }) 
      .limit(100); // ดึงแค่ 100 รายการล่าสุด

    res.json(logs);
  } catch (error) {
    console.error("Error fetching system logs:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- 2. ดึง Webhook URL ปัจจุบัน (สำหรับ Frontend ใช้อัปโหลดรูป) ---
exports.getDiscordWebhook = async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ key: "discord_webhook" });

    if (!config || !config.value || !config.value.url) {
      return res.status(404).json({ message: "Webhook not found/generated yet" });
    }

    res.json({ url: config.value.url });
  } catch (error) {
    console.error("Error fetching webhook:", error);
    res.status(500).json({ message: error.message });
  }
};