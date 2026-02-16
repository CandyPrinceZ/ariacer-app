const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    name: { type: String, required: true },
    detail: { type: String, required: true },

    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IssueType",
      required: true,
    },

    urgency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Urgency",
      required: true,
    },

    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: true,
    },

    deadline: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: null,
    },

    remarks_images: [
      {
        url: { type: String },
      },
    ],

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },

    assistant: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
      },
    ],

    note: {
      type: String,
      default: null,
    },

    tester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },

    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: true,
    },

    images: [
      {
        url: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  },
);

issueSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  try {
    const lastIssue = await this.constructor.findOne().sort({ id: -1 });
    if (!lastIssue) {
      this.id = "I0001";
    } else {
      const lastId = lastIssue.id;
      const number = parseInt(lastId.substring(1));
      const nextNumber = (number + 1).toString().padStart(4, "0");
      this.id = `I${nextNumber}`;
    }
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = mongoose.model("Issue", issueSchema);
