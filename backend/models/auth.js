const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const authSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    user_name: { type: String, required: true },
    avatar: { type: String, required: false },
    user_id: { type: String, unique: true },
    role_name: { type: String, required: true },
    role_code: { type: String, required: true },
  },
  { timestamps: true },
);

authSchema.pre("save", async function () {
  if (this.user_id) {
    return;
  }

  try {
    const lastauth = await this.constructor.findOne().sort({ user_id: -1 });

    if (!lastauth) {
      this.user_id = "UID0001";
    } else {
      const lastId = lastauth.user_id;
      const number = parseInt(lastId.substring(3));
      const nextNumber = (number + 1).toString().padStart(4, "0");
      this.user_id = `UID${nextNumber}`;
    }
  } catch (error) {
    throw new Error(error);
  }
});

authSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error(error);
  }
});

authSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Auth || mongoose.model("Auth", authSchema);
