const express = require("express");
const router = express.Router();
const { getDiscordWebhook } = require("../controllers/configController");
const { protect } = require("../middleware/authMiddleware");

router.get("/discord-webhook", protect, getDiscordWebhook); // GET /api/config/discord-webhook

module.exports = router;