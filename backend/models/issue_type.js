const mongoose = require("mongoose");

const issueTypeSchema = new mongoose.Schema({
  i: { type: String, unique: true },
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
});

issueTypeSchema.pre("save", async function () {
  if (!this.isNew) return ;

  try {
    const lastType = await this.constructor.findOne().sort({  _id: -1 });

    if (!lastType || !lastType.i) {
      this.i = "1";
    } else {
      const lastInt = parseInt(lastType.i);
      this.i = (lastInt + 1).toString();
    }
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = mongoose.model("IssueType", issueTypeSchema);