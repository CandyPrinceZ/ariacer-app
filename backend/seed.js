require("dotenv").config();
const mongoose = require("mongoose");

// Import Models
const IssueType = require("./models/issue_type");
const Urgency = require("./models/urgency");
const Status = require("./models/status");
const Roles = require("./models/roles"); // 

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connected to DB...");

    const statuses = [
      { _id: "65b000000000000000000001", name: "Reported", code: "reported", for: "None" },
      { _id: "65b000000000000000000002", name: "Received", code: "recived", for: "dev" },
      { _id: "65b000000000000000000003", name: "In Progress", code: "inProgress", for: "dev" },
      { _id: "65b000000000000000000004", name: "Testing", code: "testing", for: "imp" },
      { _id: "65b000000000000000000005", name: "Finished", code: "finished", for: "dev" },
      { _id: "65b000000000000000000006", name: "Up Server", code: "upserver", for: "dev" },
      { _id: "65b000000000000000000007", name: "Success", code: "success", for: "act" },
      { _id: "65b000000000000000000008", name: "Rejected", code: "rejected", for: "act" }
    ];

    await Status.deleteMany({});
    for (const s of statuses) {
      await Status.create(s);
    }
    console.log("✅ Statuses Added");

    const types = [
      { _id: "65b100000000000000000001", name: "Bug", code: "bug", desc: "ข้อผิดพลาดของระบบ" },
      { _id: "65b100000000000000000002", name: "Feature Request", code: "feature", desc: "ขอฟีเจอร์ใหม่" },
      { _id: "65b100000000000000000003", name: "Question", code: "question", desc: "สอบถามข้อมูล" },
      { _id: "65b100000000000000000004", name: "Design", code: "design", desc: "ออกแบบระบบ" },
    ];

    await IssueType.deleteMany({});
    for (const t of types) {
      await IssueType.create(t);
    }
    console.log("✅ Issue Types Added");

    const urgencies = [
      { _id: "65b200000000000000000001", name: "Critical", code: "critical", color: "red", desc: "ระบบล่ม, ใช้งานไม่ได้" },
      { _id: "65b200000000000000000002", name: "High", code: "high", color: "orange", desc: "กระทบงานหลัก" },
      { _id: "65b200000000000000000003", name: "Medium", code: "medium", color: "green", desc: "รอได้" },
      { _id: "65b200000000000000000004", name: "Low", code: "low", color: "grey", desc: "ข้อเสนอแนะทั่วไป" },
    ];

    await Urgency.deleteMany({});
    for (const u of urgencies) {
      await Urgency.create(u);
    }
    console.log("✅ Urgencies Added");

    const roleData = [
      { _id: "65b300000000000000000001", name: "Administrator", code: "admin" },
      { _id: "65b300000000000000000002", name: "Developer", code: "dev" },
      { _id: "65b300000000000000000003", name: "Implement", code: "imp" },
    ];

    await Roles.deleteMany({});
    for (const r of roleData) {
      await Roles.create(r);
    }
    console.log("✅ Roles Added");

    console.log("🎉 All Data Seeded Successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedData();