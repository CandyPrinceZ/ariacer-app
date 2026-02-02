const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema(
  {
    i: { type: String, unique: true },
    name: { type: String, required: true },
    code: { type: String, unique: true, required: true },
    for: { type: String, required: true }, 
  },
  { timestamps: false } 
);

StatusSchema.pre("save", async function () {
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

module.exports = mongoose.models.Status || mongoose.model("Status", StatusSchema);