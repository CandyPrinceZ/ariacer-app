const Auth = require("../models/auth");
const Issue = require("../models/issue");
const jwt = require("jsonwebtoken");

// ฟังก์ชันสร้าง Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token มีอายุ 30 วัน
  });
};

// Register
exports.register = async (req, res) => {
  const { username, password, user_name, role_name, role_code } = req.body;

  try {
    // เช็คว่ามี username นี้หรือยัง
    const userExists = await Auth.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // สร้าง User (Password จะถูก Hash อัตโนมัติใน Model)
    const user = await Auth.create({
      username,
      password,
      user_name,
      role_name,
      role_code,
    });

    res.status(201).json({
      _id: user._id,
      user_id: user.user_id,
      username: user.username,
      token: generateToken(user._id, user.role_name), // ส่ง Token กลับไปด้วย
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login (เข้าสู่ระบบ)
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await Auth.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        user_id: user.user_id,
        username: user.username,
        role: user.role_name,
        token: generateToken(user._id, user.role_name),
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await Auth.findById(req.user.id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserName = async (req, res) => {
  const { user_name } = req.body;

  if (!user_name) {
    return res.status(400).json({ message: "Please provide a user name" });
  }

  try {
    const user = await Auth.findById(req.user.id);

    if (user) {
      user.user_name = user_name;
      await user.save();

      res.json({
        _id: user._id,
        user_name: user.user_name,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role_name: user.role_name,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Please provide both current and new passwords" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters" });
  }

  try {
    const user = await Auth.findById(req.user.id);

    if (user) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect current password" }); // รหัสเดิมผิด
      }

      user.password = newPassword;

      await user.save();

      res.json({ message: "Password updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await Auth.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserByRole = async (req, res) => {
  try {
    const targetRole = req.params.role;
    const requesterRole = req.user.role_code;

    // 👇 เพิ่ม 2 บรรทัดนี้เพื่อเช็คค่าใน Terminal
    console.log("Target Role:", targetRole);
    console.log("Requester Role:", requesterRole);

    if (requesterRole === "admin") {
      // ค้นหาทั้ง Admin และ Role เป้าหมาย
      const users = await Auth.find({
        role_code: { $in: ["admin", targetRole] },
      })
        .select("-password")
        .sort({ user_name: 1 });

      console.log("Found Users (Admin Mode):", users.length); // เช็คว่าเจอกี่คน
      return res.json(users);
    }

    const users = await Auth.find({ role_code: targetRole })
      .select("-password")
      .sort({ user_name: 1 });

    console.log("Found Users (Normal Mode):", users.length);
    res.json(users);
  } catch (error) {
    console.error("Error get user by role:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserByAdmin = async (req, res) => {
  const { _id, user_name, role_code, role_name, password } = req.body;

  try {
    const user = await Auth.findById(_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.user_name = user_name || user.user_name;

    if (role_code && role_code !== user.role_code) {
      
      const activeIssue = await Issue.findOne({
        assignee: user._id,
      }).populate('status');

      console.log("Checking User:", user.user_name);
      console.log("Found Issue:", activeIssue);

      if (activeIssue && activeIssue.status && activeIssue.status.code !== 'success') {
         return res.status(400).json({
           message: `Cannot change role. User has active issue: ${activeIssue.name}`
         });
      }

      user.role_code = role_code;
      user.role_name = role_name;
    }

    if (password && password.length >= 6) {
      user.password = password; 
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      user_id: updatedUser.user_id,
      user_name: updatedUser.user_name,
      role_code: updatedUser.role_code,
      role_name: updatedUser.role_name,
      updatedAt: updatedUser.updatedAt,
    });

  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: error.message });
  }
};

// --- Update Profile Name ---
exports.updateUserName = async (req, res) => {
  const { user_name } = req.body;

  if (!user_name) {
    return res.status(400).json({ message: "Please provide a user name" });
  }

  try {
    const user = await Auth.findById(req.user.id);

    if (user) {
      user.user_name = user_name;
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        user_name: updatedUser.user_name,
        username: updatedUser.username,
        role_name: updatedUser.role_name,
        updatedAt: updatedUser.updatedAt,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Update Password ---
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Please provide both current and new passwords" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters" });
  }

  try {
    const user = await Auth.findById(req.user.id);

    if (user) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect current password" });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: "Password updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Get Users List ---
exports.getUsers = async (req, res) => {
  try {
    const users = await Auth.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const targetUserIdString = req.params.user_id;

    const userToDelete = await Auth.findOne({ user_id: targetUserIdString });

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.id === userToDelete._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await Auth.findByIdAndDelete(userToDelete._id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};