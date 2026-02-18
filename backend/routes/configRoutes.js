const express = require("express");
const router = express.Router();
const {
  getDiscordWebhookForImages,
  getDiscordWebhookForNotifications,
  getSystemLogs,
} = require("../controllers/configController");
const {
  uploadImage,
  uploadMiddleware,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

router.post("/upload-image", uploadMiddleware, uploadImage);  // POST /api/config/upload-image
router.get("/discord-webhook-images", protect, getDiscordWebhookForImages); // GET /api/config/discord-webhook
router.get(
  "/discord-webhook-notifications",
  protect,
  getDiscordWebhookForNotifications,
); // GET /api/config/discord-webhook
router.get("/system-logs", protect, getSystemLogs); // GET /api/config/system-logs

module.exports = router;
