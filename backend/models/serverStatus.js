const mongoose = require("mongoose");

const serverStatusSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  i: { type: String, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  color: { type: String, default: "gray" },
});

serverStatusSchema.pre("save", async function () {
  if (!this.isNew) return;

  try {
    const lastStatus = await this.constructor.findOne().sort({ _id: -1 });

    if (!lastStatus || !lastStatus.i) {
      this.i = "1";
    } else {
      const lastInt = parseInt(lastStatus.i);
      this.i = (lastInt + 1).toString();
    }
  } catch (error) {
    throw error;
  }
});

module.exports = mongoose.model("ServerStatus", serverStatusSchema);
