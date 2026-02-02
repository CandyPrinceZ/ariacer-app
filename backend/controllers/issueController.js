const Issue = require("../models/issue");
const IssueType = require("../models/issue_type");
const Urgency = require("../models/urgency");
const User = require("../models/auth"); // ถ้ามี Model User ให้ Import มาด้วย
const mongoose = require("mongoose");

exports.createIssue = async (req, res) => {
  try {
    let issueData = { ...req.body };

    const inputImages = req.body.images || req.body.image;

    if (inputImages) {
      if (Array.isArray(inputImages)) {
        issueData.images = inputImages.map(url => ({ url: url }));
      } else if (typeof inputImages === 'string') {
        issueData.images = [{ url: inputImages }];
      }
    }

    const newIssue = new Issue(issueData);
    const savedIssue = await newIssue.save();

    const populatedIssue = await savedIssue.populate([
      "type",
      "urgency",
      "status",
      "reporter"
    ]);

    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(400).json({ message: error.message });
  }
};

// --- 2. Get All Issues (รองรับ Filter) ---
exports.getIssues = async (req, res) => {
  try {
    const { status, assignee, unassigned } = req.query;
    let query = {};

    // Filter: ตามสถานะ
    if (status) {
      query.status_code = status; // หรือ query.status แล้วแต่ Schema
    }

    // Filter: งานของฉัน (Assignee)
    if (assignee) {
      query.assignee = assignee;
    }

    // Filter: งานที่ยังไม่มีเจ้าของ (Unassigned)
    if (unassigned === "true") {
      query.assignee = { $in: [null, ""] }; // หาที่ assignee เป็น null หรือ string ว่าง
    }

    // ค้นหาและ Populate ข้อมูลที่เชื่อมโยง (Join Tables)
    const issues = await Issue.find(query)
      .populate("type", "name code") // map เอาแค่ชื่อ Type
      .populate("urgency", "name color code") // map เอาชื่อและความเร่งด่วน
      .populate("status", "name code") // map สถานะ
      .populate("tester", "username user_name role_name")
      .populate("reporter", "username user_name role_name")
      .populate("assignee", "username user_name role_name")
      .sort({ createdAt: -1 }); // เรียงจากใหม่ไปเก่า

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIssueById = async (req, res) => {
  try {
    let issue;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      issue = await Issue.findById(req.params.id)
        .populate("type")
        .populate("urgency")
        .populate("status")
        .populate("reporter", "username user_name role_name")
        .populate("assignee", "username user_name role_name")
        .populate("tester", "username user_name role_name");
    }

    if (!issue) {
      issue = await Issue.findOne({ id: req.params.id }) 
        .populate("type")
        .populate("urgency")
        .populate("status")
        .populate("reporter", "username user_name role_name")
        .populate("assignee", "username user_name role_name")
        .populate("tester", "username user_name role_name");
    }

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getIssuesByAssignee = async (req, res) => {
  try {
    const assigneeId = req.params.assigneeId;

    const issues = await Issue.find({ assignee: assigneeId })
      .populate("type", "name code")
      .populate("urgency", "name color code")
      .populate("status", "name code")
      .populate("reporter", "username user_name role_name")
      .populate("assignee", "username user_name role_name")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnassignedIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ assignee: null })
      .populate("type", "name code")
      .populate("urgency", "name color")
      .populate("status", "name code")
      .populate("reporter", "username user_name role_name")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateIssue = async (req, res) => {
  try {
    // ค้นหาและอัปเดต (validate ก่อน save)
    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body, // รับค่า status, assignee, etc. มาจาก Frontend
      { new: true, runValidators: true },
    )
      .populate("type")
      .populate("urgency")
      .populate("status");

    if (!updatedIssue) {
      // ลองหาด้วย Custom ID กรณี Frontend ส่งมาเป็น IS-001
      const updatedIssueCustom = await Issue.findOneAndUpdate(
        { issue_id: req.params.id },
        req.body,
        { new: true, runValidators: true },
      ).populate("type status urgency");

      if (!updatedIssueCustom)
        return res.status(404).json({ message: "Issue not found" });
      return res.json(updatedIssueCustom);
    }

    res.json(updatedIssue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteIssue = async (req, res) => {
  try {
    const deletedIssue = await Issue.findByIdAndDelete(req.params.id);

    if (!deletedIssue) {
      const deletedCustom = await Issue.findOneAndDelete({
        issue_id: req.params.id,
      });
      if (!deletedCustom)
        return res.status(404).json({ message: "Issue not found" });
      return res.json({ message: "Issue deleted successfully" });
    }

    res.json({ message: "Issue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};