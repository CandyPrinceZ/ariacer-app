require("dotenv").config();
const mongoose = require("mongoose");

const Issue = require("./models/issue");

const reset = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔌 Connected to DB...");

        await Issue.deleteMany({});
        console.log("✅ All Issues deleted successfully");

        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

reset();