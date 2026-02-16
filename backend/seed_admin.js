require("dotenv").config();
const mongoose = require("mongoose");
const Auth = require("./models/auth"); 

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected...");

    const adminExists = await Auth.findOne({ role_code: "admin" });

    if (adminExists) {
      console.log("⚠️ Admin user already exists!");
      process.exit();
    }

    const adminUser = await Auth.create({
      username: "admin",
      password: "123456",
      user_name: "Super Admin",
      role_name: "Administrator",
      role_code: "admin",
    });

    console.log("🎉 Admin user created successfully!");
    console.log("-----------------------------------");
    console.log(`👤 Username: ${adminUser.username}`);
    console.log(`🔑 Password: 123456`);
    console.log("-----------------------------------");

    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();