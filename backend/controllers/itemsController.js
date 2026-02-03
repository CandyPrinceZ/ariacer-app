const role = require("../models/roles");
const issueType = require("../models/issue_type");
const urgency = require("../models/urgency");
const status = require("../models/status");

exports.getRoles = async (req, res) => {
  try {
    const roles = await role.find();
    const formattedRoles = roles.map((r) => {
      return {
        _id: r._id,
        i: r.i,
        name: r.name,
        code: r.code
      };
    });
    res.json(formattedRoles); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIssueTypes = async (req, res) => {
  try {
    const issueTypes = await issueType.find();
    const formattedIssueTypes = issueTypes.map((it) => {
      return {
        _id: it._id,
        i: it.i,
        name: it.name,
        code: it.code
      };
    });
    res.json(formattedIssueTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUrgencies = async (req, res) => {
  try {
    const urgencies = await urgency.find();
    const formattedUrgencies = urgencies.map((u) => {
      return {
        _id: u._id, 
        i: u.i,
        name: u.name,
        code: u.code,
        color: u.color,
        desc: u.desc
      };
    });
    res.json(formattedUrgencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStatuses = async (req, res) => {
  try {
    const statuses = await status.find();
    const formattedStatuses = statuses.map((s) => {
      return {
        _id: s._id, 
        i: s.i,
        name: s.name,
        code: s.code,
      };
    });
    res.json(formattedStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStatusesForDev = async (req, res) => {
  try {
    const forType = 'dev';
    const statuses = await status.find({ for: forType });
    const formattedStatuses = statuses.map((s) => {
      return {
        _id: s._id, 
        name: s.name,
        code: s.code,
      };
    });
    res.json(formattedStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStatusesForImp = async (req, res) => {
  try {
    const forType = 'imp';
    const statuses = await status.find({ for: forType });
    const formattedStatuses = statuses.map((s) => {
      return {
        _id: s._id, 
        name: s.name,
        code: s.code,
      };
    });
    res.json(formattedStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};