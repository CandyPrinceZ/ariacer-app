const mongoose = require("mongoose");

const urgencySchema = new mongoose.Schema({
  i: { type: String, unique: true },
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  color: { type: String, required: true },
  desc: { type: String, required: true },
});

urgencySchema.pre("save", async function () {
  if (!this.isNew) return ;

  try {
    const lastUrgency = await this.constructor.findOne().sort({  _id: -1 });

    if (!lastUrgency || !lastUrgency.i) {
      this.i = "1";
    } else {
      const lastInt = parseInt(lastUrgency.i);
      this.i = (lastInt + 1).toString();
    }
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = mongoose.model("Urgency", urgencySchema);