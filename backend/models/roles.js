const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  i: { type: String, unique: true }, // 1, 2, 3...
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
});

roleSchema.pre("save", async function () {
  if (!this.isNew) return;

  try {
    const lastRole = await this.constructor.findOne().sort({ _id: -1 });

    if (!lastRole || !lastRole.i) {
      this.i = "1";
    } else {
      const lastInt = parseInt(lastRole.i);
      const nextNumberInt = lastInt + 1;
      this.i = nextNumberInt.toString();
    }
  } catch (error) {
    throw error;
  }
});

// ป้องกัน Error: Cannot overwrite model
module.exports = mongoose.models.Roles || mongoose.model("Roles", roleSchema);