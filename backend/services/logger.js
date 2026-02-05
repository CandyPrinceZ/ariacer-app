const ActivityLog = require("../models/activityLog");

exports.saveLog = async (req, user, action, detail, metadata = {}) => {
  try {
    await ActivityLog.create({
      user: user ? user._id : null,
      action: action,
      detail: detail,
      metadata: metadata,
      ip_address: req.ip || req.headers["x-forwarded-for"] || "-",
      user_agent: req.headers["user-agent"] || "-",
    });
    console.log(`[LOG SAVED] ${action}: ${detail}`);
  } catch (error) {
    console.error("Failed to save log:", error);
  }
};