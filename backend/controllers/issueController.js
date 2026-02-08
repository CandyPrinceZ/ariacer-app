const mongoose = require("mongoose");
const Issue = require("../models/issue");
const IssueType = require("../models/issue_type");
const Urgency = require("../models/urgency");
const Status = require("../models/status");
const User = require("../models/auth");
const { saveLog } = require("../services/logger");
const SystemConfig = require("../models/SystemConfig");
const axios = require("axios");

// --- Create Issue ---
exports.createIssue = async (req, res) => {
  try {
    let issueData = { ...req.body };

    const inputImages = req.body.images || req.body.image;

    if (inputImages) {
      if (Array.isArray(inputImages)) {
        issueData.images = inputImages.map((url) => ({ url: url }));
      } else if (typeof inputImages === "string") {
        issueData.images = [{ url: inputImages }];
      }
    }

    const newIssue = new Issue(issueData);
    const savedIssue = await newIssue.save();

    const populatedIssue = await Issue.findById(savedIssue._id)
      .populate("type", "name")
      .populate("urgency", "name")
      .populate("status", "name")
      .populate("reporter", "user_name");

    saveLog(
      req,
      req.user,
      "CREATE_ISSUE",
      `Issue ${populatedIssue.name} created`,
      {
        issue_id: populatedIssue._id,
        issue_name: populatedIssue.name,
      },
    );

    sendNewIssueNotification(populatedIssue, req.user);

    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(400).json({ message: error.message });
  }
};

// --- Get All Issues ---
exports.getIssues = async (req, res) => {
  try {
    const { status, assignee, unassigned } = req.query;
    let query = {};

    if (status) {
      // ระวังเรื่องการส่ง status เป็น ID หรือ Code
      // ถ้า Frontend ส่ง ID มา ใช้ query.status = status ได้เลย
      // แต่ถ้าส่ง Code อาจต้องไปหา ID จาก Table Status ก่อน (ขึ้นอยู่กับ DB Design)
      query.status = status;
    }

    if (assignee) {
      query.assignee = assignee;
    }

    if (unassigned === "true") {
      query.assignee = { $in: [null, ""] };
    }

    const issues = await Issue.find(query)
      .populate("type", "name code")
      .populate("urgency", "name color code")
      .populate("status", "name code")
      .populate("tester", "username user_name role_name avatar")
      .populate("reporter", "username user_name role_name avatar")
      .populate("assignee", "username user_name role_name avatar")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Get Issue By ID ---
exports.getIssueById = async (req, res) => {
  try {
    let issue;
    const id = req.params.id;

    // หาด้วย _id (ObjectId)
    if (mongoose.Types.ObjectId.isValid(id)) {
      issue = await Issue.findById(id)
        .populate("type")
        .populate("urgency")
        .populate("status")
        .populate("reporter", "username user_name role_name avatar")
        .populate("assignee", "username user_name role_name avatar")
        .populate("tester", "username user_name role_name avatar");
    }

    // ถ้าไม่เจอ หรือไม่ใช่ ObjectId ให้หาด้วย id (Custom ID)
    if (!issue) {
      issue = await Issue.findOne({ id: id })
        .populate("type")
        .populate("urgency")
        .populate("status")
        .populate("reporter", "username user_name role_name avatar")
        .populate("assignee", "username user_name role_name avatar")
        .populate("tester", "username user_name role_name avatar");
    }

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Get Issues by Assignee (Active Only) ---
exports.getIssuesByAssignee = async (req, res) => {
  try {
    const assigneeId = req.params.assigneeId;

    let issues = await Issue.find({ assignee: assigneeId })
      .populate("type", "name code")
      .populate("urgency", "name color code")
      .populate("status", "name code") // ต้อง populate เพื่อเช็ค code ด้านล่าง
      .populate("reporter", "username user_name role_name avatar")
      .populate("assignee", "username user_name role_name avatar")
      .sort({ createdAt: -1 });

    // Filter งานที่ยังไม่เสร็จ (Success) ออก
    issues = issues.filter(
      (issue) => issue.status && issue.status.code !== "success",
    );

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIssuesByHighUrgency = async (req, res) => {
  try {
    const targetUrgencyCodes = ["high", "critical"];
    const targetUrgencies = await Urgency.find({
      code: { $in: targetUrgencyCodes },
    });

    if (!targetUrgencies.length) {
      return res
        .status(404)
        .json({ message: "High/Critical urgency levels not found" });
    }

    const urgencyIds = targetUrgencies.map((u) => u._id);

    const successStatus = await Status.findOne({ code: "success" });

    const query = {
      urgency: { $in: urgencyIds },
    };

    if (successStatus) {
      query.status = { $ne: successStatus._id };
    }

    const issues = await Issue.find(query)
      .populate("type", "name code")
      .populate("urgency", "name color code")
      .populate("status", "name code")
      .populate("reporter", "username user_name role_name")
      .populate("assignee", "username user_name role_name")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error("Error fetching high urgency issues:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getIssuesforTester = async (req, res) => {
  try {
    const upserverStatus = await Status.findOne({ code: "upserver" });
    const successStatus = await Status.findOne({ code: "success" });
    const testingStatus = await Status.findOne({ code: "testing" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let conditions = [];

    if (upserverStatus) {
      conditions.push({ status: upserverStatus._id });
    }

    if (testingStatus) {
      conditions.push({ status: testingStatus._id });
    }

    if (successStatus) {
      conditions.push({
        status: successStatus._id,
        updatedAt: { $gte: todayStart, $lte: todayEnd },
      });
    }

    if (conditions.length === 0) {
      return res.json([]);
    }

    // 4. ค้นหาด้วย $or
    const issues = await Issue.find({ $or: conditions })
      .populate("type", "name code")
      .populate("urgency", "name color code")
      .populate("status", "name code")
      .populate("reporter", "username user_name role_name avatar")
      .populate("assignee", "username user_name role_name avatar")
      .populate("tester", "username user_name role_name avatar")
      .sort({ updatedAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error("Error get issues for tester:", error);
    res.status(500).json({ message: error.message });
  }
};
// --- Get Unassigned Issues ---
exports.getUnassignedIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ assignee: null })
      .populate("type", "name code")
      .populate("urgency", "name color code")
      .populate("status", "name code")
      .populate("reporter", "username user_name role_name avatar")
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Update Issue ---
exports.updateIssue = async (req, res) => {
  try {
    const issueId = req.params.id;
    let issueToUpdate;

    // 1. หา Issue เก่าก่อน (เพื่อเปรียบเทียบค่าเก่าสำหรับ Log)
    if (mongoose.Types.ObjectId.isValid(issueId)) {
      issueToUpdate = await Issue.findById(issueId);
    }
    if (!issueToUpdate) {
      issueToUpdate = await Issue.findOne({ id: issueId });
    }

    if (!issueToUpdate) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // เก็บสถานะเก่าไว้ Log
    const oldStatus = issueToUpdate.status;
    const oldAssignee = issueToUpdate.assignee;

    // 2. อัปเดตข้อมูล
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueToUpdate._id,
      req.body,
      { new: true, runValidators: true },
    )
      .populate("type")
      .populate("urgency")
      .populate("status")
      .populate("assignee", "user_name");

    // ✅ Log: Update Issue
    let logDetail = `Updated issue: ${updatedIssue.name}`;
    let metadata = { issue_id: updatedIssue._id };

    // เช็คว่ามีการเปลี่ยนสถานะไหม
    if (
      req.body.status &&
      req.body.status.toString() !== oldStatus?.toString()
    ) {
      logDetail += ` (Status changed to ${updatedIssue.status?.name})`;
      metadata.old_status = oldStatus;
      metadata.new_status = updatedIssue.status?._id;
    }

    // เช็คว่ามีการ Assign งานไหม
    if (
      req.body.assignee &&
      req.body.assignee.toString() !== oldAssignee?.toString()
    ) {
      logDetail += ` (Assigned to ${updatedIssue.assignee?.user_name})`;
      metadata.assignee = updatedIssue.assignee?._id;
    }

    if (req.body.status && updatedIssue.status) {
      if (updatedIssue.status.code === "success") {
        sendSuccessStatusNotification(updatedIssue, req.user);
      } else if (updatedIssue.status.code === "upserver") {
        sendUpserverNotification(updatedIssue, req.user);
      }
    }
    saveLog(req, req.user, "UPDATE_ISSUE", logDetail, metadata);

    res.json(updatedIssue);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.editIssue = async (req, res) => {
  try {
    const issueId = req.params.id;
    let issueToEdit;

    if (mongoose.Types.ObjectId.isValid(issueId)) {
      issueToEdit = await Issue.findById(issueId);
    }
    if (!issueToEdit) {
      issueToEdit = await Issue.findOne({ id: issueId });
    }

    if (!issueToEdit) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const oldStatus = issueToEdit.status;
    const oldAssignee = issueToEdit.assignee;

    let updateData = { ...req.body };

    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = updateData.images.map((img) => {
        return typeof img === "string" ? { url: img } : img;
      });
    }

    if (updateData.assignee === "null" || updateData.assignee === "") {
      updateData.assignee = null;
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      issueToEdit._id,
      updateData,
      { new: true, runValidators: true },
    )
      .populate("type")
      .populate("urgency")
      .populate("status")
      .populate("assignee", "user_name");

    let logDetail = `Edited issue: ${updatedIssue.name}`;
    let metadata = { issue_id: updatedIssue._id };

    if (
      updateData.status &&
      updateData.status.toString() !== oldStatus?.toString()
    ) {
      logDetail += ` (Status changed to ${updatedIssue.status?.name})`;
      metadata.old_status = oldStatus;
      metadata.new_status = updatedIssue.status?._id;
    }

    const newAssigneeId = updatedIssue.assignee
      ? updatedIssue.assignee._id.toString()
      : null;
    const oldAssigneeId = oldAssignee ? oldAssignee.toString() : null;

    if (
      updateData.hasOwnProperty("assignee") &&
      newAssigneeId !== oldAssigneeId
    ) {
      if (updatedIssue.assignee) {
        logDetail += ` (Assigned to ${updatedIssue.assignee.user_name})`;
      } else {
        logDetail += ` (Unassigned)`;
      }
      metadata.assignee = updatedIssue.assignee?._id;
    }

    if (updateData.status && updatedIssue.status) {
      if (updatedIssue.status.code === "success") {
        sendSuccessStatusNotification(updatedIssue, req.user);
      } else if (updatedIssue.status.code === "upserver") {
        sendUpserverNotification(updatedIssue, req.user);
      }
    }

    saveLog(req, req.user, "EDIT_ISSUE", logDetail, metadata);

    res.json(updatedIssue);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// --- Delete Issue ---
exports.deleteIssue = async (req, res) => {
  try {
    const issueId = req.params.id;
    let deletedIssue;

    if (mongoose.Types.ObjectId.isValid(issueId)) {
      deletedIssue = await Issue.findByIdAndDelete(issueId);
    }

    if (!deletedIssue) {
      deletedIssue = await Issue.findOneAndDelete({ id: issueId });
    }

    if (!deletedIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    saveLog(
      req,
      req.user,
      "DELETE_ISSUE",
      `Deleted issue: ${deletedIssue.name}`,
      {
        issue_id: deletedIssue._id,
        issue_custom_id: deletedIssue.id,
      },
    );

    res.json({ message: "Issue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ============================================================
// ✅ Discord Notification Helpers (Bulletproof + Auto Retry)
// ============================================================

// 1. ฟังก์ชันหน่วงเวลา (Sleep)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 2. ฟังก์ชันกลางสำหรับยิง Discord (รองรับ Retry เมื่อเจอ 429)
async function postToDiscord(webhookUrl, payload, retryCount = 0) {
  try {
    await axios.post(webhookUrl, payload);
    // console.log("✅ Discord sent successfully.");
  } catch (err) {
    // ถ้าเจอ 429 (Too Many Requests) และยัง Retry ไม่เกิน 3 ครั้ง
    if (err.response && err.response.status === 429 && retryCount < 3) {
      // ดึงเวลาที่ต้องรอจาก Header หรือ Body (Discord ส่งมาเป็นวินาที แปลงเป็น ms)
      // ถ้าไม่มีค่ามา ให้รอ 1 วินาทีเป็นอย่างน้อย
      const retryAfter = (err.response.data.retry_after || 1) * 1000;

      console.warn(
        `⏳ Rate Limited! Waiting ${retryAfter}ms before retry (Attempt ${retryCount + 1}/3)...`,
      );

      // รอจนกว่าจะครบเวลา + เผื่อไปอีก 500ms
      await sleep(retryAfter + 500);

      // เรียกตัวเองซ้ำ (Recursive)
      return postToDiscord(webhookUrl, payload, retryCount + 1);
    }

    // ถ้าเป็น Error อื่น หรือ Retry ครบแล้ว ให้โยน Error ออกไปให้ฟังก์ชันหลักจัดการ
    throw err;
  }
}

// ------------------------------------------------------------

// 3. แจ้งเตือน Issue ใหม่
async function sendNewIssueNotification(issue, reporter) {
  try {
    const config = await SystemConfig.findOne({
      key: "discord_webhook_notifications",
    });
    if (!config?.value?.url) return;

    const issueUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/issue/detail/${issue._id}`
      : null;

    const embed = {
      title: `🆕 New Issue Created: ${issue.name || "Untitled"}`,
      description: (issue.detail || issue.description || "-").substring(
        0,
        4096,
      ),
      color: 3447003, // Blue
      fields: [
        {
          name: "Priority",
          value: String(issue.urgency?.name || "-"),
          inline: true,
        },
        { name: "Type", value: String(issue.type?.name || "-"), inline: true },
        {
          name: "Reporter",
          value: String(reporter?.user_name || "Unknown"),
          inline: true,
        },
        {
          name: "Status",
          value: String(issue.status?.name || "Reported"),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    if (issueUrl) embed.url = issueUrl;

    if (issue.images?.length > 0 && issue.images[0].url.startsWith("http")) {
      embed.image = { url: issue.images[0].url };
    }

    // ✅ ใช้ postToDiscord แทน axios.post
    await postToDiscord(config.value.url, {
      username: "Issue Bot",
      embeds: [embed],
    });
    console.log(`✅ New Issue Notification Sent: ${issue.name}`);
  } catch (err) {
    console.error("❌ Discord New Issue Error:", err.message);
  }
}

// 4. แจ้งเตือนเมื่อสถานะเป็น Upserver 🚀
async function sendUpserverNotification(issue, user) {
  try {
    const config = await SystemConfig.findOne({
      key: "discord_webhook_notifications",
    });
    if (!config?.value?.url) return;

    const issueUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/issue/detail/${issue._id}`
      : null;

    const embed = {
      title: `🚀 Ready for Server (Upserver): ${issue.name}`,
      description: `User **${user?.user_name || "Unknown"}** has updated status to **Upserver**.\nReady for testing/deployment.`,
      color: 10181046, // Purple
      fields: [
        {
          name: "Assignee",
          value: String(issue.assignee?.user_name || "Unassigned"),
          inline: true,
        },
        {
          name: "Priority",
          value: String(issue.urgency?.name || "-"),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "System Deployment Update" },
    };

    if (issueUrl) embed.url = issueUrl;

    // ✅ ใช้ postToDiscord แทน axios.post
    await postToDiscord(config.value.url, {
      username: "Deploy Bot",
      embeds: [embed],
    });
    console.log(`✅ Upserver Notification Sent: ${issue.name}`);
  } catch (err) {
    console.error("❌ Discord Upserver Error:", err.message);
  }
}

// 5. แจ้งเตือนเมื่อ Success (แบบคำนวณยอดคงเหลือ)
async function sendSuccessStatusNotification(issue, user) {
  try {
    const config = await SystemConfig.findOne({
      key: "discord_webhook_notifications",
    });
    if (!config?.value?.url) return;

    const successStatus = await Status.findOne({ code: "success" });
    if (!successStatus) return;

    // ✅ ใช้ .find() แบบธรรมดาแล้วนับใน JS (แก้ปัญหา aggregate ได้ค่าว่าง)
    const allActiveIssues = await Issue.find({
      status: { $ne: successStatus._id, $exists: true, $ne: null },
    }).populate("status");

    const statsMap = {};
    allActiveIssues.forEach((item) => {
      if (!item.status?.name) return;
      const name = item.status.name;
      statsMap[name] = (statsMap[name] || 0) + 1;
    });

    let remainingText =
      Object.keys(statsMap).length > 0
        ? Object.entries(statsMap)
            .map(([k, v]) => `• **${k}**: ${v}`)
            .join("\n")
        : "🎉 No active issues remaining!";

    const totalRemaining = allActiveIssues.length;

    const embed = {
      title: `✅ Issue Resolved: ${issue.name || "Untitled"}`,
      description: `User **${user?.user_name || "Unknown"}** marked this issue as **Success**.`,
      color: 3066993, // Green
      fields: [
        {
          name: "📉 Remaining Issues",
          value: `Total: **${totalRemaining}**\n${remainingText}`.substring(
            0,
            1024,
          ),
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "System Status Update" },
    };

    // ✅ ใช้ postToDiscord แทน axios.post
    await postToDiscord(config.value.url, {
      username: "Status Bot",
      embeds: [embed],
    });
    console.log(`✅ Success Notification Sent: ${issue.name}`);
  } catch (err) {
    console.error("❌ Discord Success Error:", err.message);
  }
}
