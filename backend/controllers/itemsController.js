// ✅ 1. เปลี่ยนชื่อตัวแปร Model ให้เป็นตัวพิมพ์ใหญ่ (PascalCase) เพื่อไม่ให้ซ้ำกับตัวแปรข้อมูล
const Role = require("../models/roles");
const IssueType = require("../models/issue_type");
const Urgency = require("../models/urgency");
const Status = require("../models/status");
const ServerStatus = require("../models/serverStatus");

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    // Map ข้อมูลจัด Format
    const formattedRoles = roles.map((r) => ({
      _id: r._id,
      i: r.i,
      name: r.name,
      code: r.code,
    }));
    res.json(formattedRoles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getServerStatus = async (req, res) => {
  try {
    // ✅ 2. แก้ชื่อตัวแปรรับค่าไม่ให้ซ้ำกับ Model (ใช้ data หรือ serverStatuses ก็ได้)
    const data = await ServerStatus.find();

    const formattedServerStatus = data.map((ss) => ({
      _id: ss._id,
      i: ss.i,
      name: ss.name,
      code: ss.code,
      color: ss.color, // (เผื่ออยากส่ง color ไปด้วย)
    }));
    res.json(formattedServerStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIssueTypes = async (req, res) => {
  try {
    const issueTypes = await IssueType.find();
    const formattedIssueTypes = issueTypes.map((it) => ({
      _id: it._id,
      i: it.i,
      name: it.name,
      code: it.code,
    }));
    res.json(formattedIssueTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUrgencies = async (req, res) => {
  try {
    const urgencies = await Urgency.find();
    const formattedUrgencies = urgencies.map((u) => ({
      _id: u._id,
      i: u.i,
      name: u.name,
      code: u.code,
      color: u.color,
      desc: u.desc,
    }));
    res.json(formattedUrgencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find();
    const formattedStatuses = statuses.map((s) => ({
      _id: s._id,
      i: s.i,
      name: s.name,
      code: s.code,
    }));
    res.json(formattedStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStatusesForDev = async (req, res) => {
  try {
    // ค้นหา Status ที่มี field 'for' = 'dev'
    const statuses = await Status.find({ for: "dev" });
    const formattedStatuses = statuses.map((s) => ({
      _id: s._id,
      name: s.name,
      code: s.code,
    }));
    res.json(formattedStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
