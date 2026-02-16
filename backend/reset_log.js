require("dotenv").config();
const mongoose = require("mongoose");
const Log = require("./models/activityLog");

const resetLog = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connected to DB...");

    await Log.deleteMany({});
    console.log("✅ Log deleted successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error deleting log:", err);
    process.exit(1); 
  }
};

resetLog();
