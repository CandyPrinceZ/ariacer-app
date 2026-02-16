const Server = require("../models/server"); // ✅ 1. เปลี่ยนชื่อ Model เป็นตัวใหญ่ (Server) เพื่อไม่ให้ชื่อชนกับตัวแปรด้านล่าง
const { saveLog } = require("../services/logger");

exports.getAllServers = async (req, res) => {
  try {
    const servers = await Server.find(); // ใช้ Server (Model)
    res.status(200).json(servers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.CreateServer = async (req, res) => {
  try {
    const user = req.user;
    if (user.role_code !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newServer = await Server.create(req.body);
    res.status(201).json(newServer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getServer = async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    res.status(200).json(server);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.DeleteServer = async (req, res) => {
  try {
    const user = req.user;
    if (user.role_code !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const server = await Server.findByIdAndDelete(req.params.id);

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    res
      .status(200)
      .json({ message: "Server deleted successfully", data: server });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.UpdateServer = async (req, res) => {
  try {
    const user = req.user;
    if (user.role_code !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const server = await Server.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    res.status(200).json(server);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
