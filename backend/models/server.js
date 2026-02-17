const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["online", "offline", "maintenance"],
      default: "online",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.server || mongoose.model("Server", serverSchema);
