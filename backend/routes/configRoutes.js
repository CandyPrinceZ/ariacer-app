const express = require("express");
const router = express.Router();
const { getDiscordWebhook, getSystemLogs } = require("../controllers/configController");
const { protect } = require("../middleware/authMiddleware");

router.get("/discord-webhook", protect, getDiscordWebhook); // GET /api/config/discord-webhook
router.get("/system-logs", protect, getSystemLogs); // GET /api/config/system-logs

module.exports = router;