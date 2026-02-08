const express = require("express");
const router = express.Router();
const { getDiscordWebhookForImages, getDiscordWebhookForNotifications, getSystemLogs } = require("../controllers/configController");
const { protect } = require("../middleware/authMiddleware");

router.get("/discord-webhook-images", protect, getDiscordWebhookForImages); // GET /api/config/discord-webhook
router.get("/discord-webhook-notifications", protect, getDiscordWebhookForNotifications); // GET /api/config/discord-webhook
router.get("/system-logs", protect, getSystemLogs); // GET /api/config/system-logs

module.exports = router;