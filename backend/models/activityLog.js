const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth", // อ้างอิงไปที่ตาราง User ของคุณ
      required: false, // เผื่อกรณี Login fail หรือ System action
    },
    action: {
      type: String,
      required: true, // เช่น "LOGIN", "UPDATE_USER", "DELETE_ISSUE"
    },
    detail: {
      type: String, // คำอธิบายเพิ่มเติม เช่น "Changed role for User UID001"
    },
    metadata: {
      type: Object, // เก็บข้อมูลดิบ เช่น ค่าเก่า vs ค่าใหม่ (เอาไว้ดู Diff)
    },
    ip_address: String,
    user_agent: String, // เก็บว่าใช้ Browser อะไร / มือถือรุ่นไหน
  },
  { timestamps: true } // จะได้ createdAt (เวลาที่ทำรายการ) อัตโนมัติ
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);