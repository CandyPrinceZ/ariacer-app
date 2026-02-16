const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: false,
    },
    action: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
    },
    metadata: {
      type: Object,
    },
    ip_address: String,
    user_agent: String,
  },
  { timestamps: true } 
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);