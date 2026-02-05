const Auth = require("../models/auth");
const Issue = require("../models/issue");
const jwt = require("jsonwebtoken");
const { saveLog } = require("../services/logger");

// ฟังก์ชันสร้าง Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// --- Register (Create User) ---
exports.register = async (req, res) => {
  const { username, password, user_name, role_name, role_code } = req.body;

  try {
    const userExists = await Auth.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const newUserObj = {
      username,
      password,
      user_name,
      role_name,
      role_code,
    };

    if (req.user) {
        newUserObj.createdBy = req.user._id; 
    }

    const user = await Auth.create(newUserObj);

    let actor = user;
    let action = "REGISTER";
    let detail = "New user self-registered";

    if (req.user) {
      actor = req.user; 
      action = "CREATE_USER";
      detail = `Admin (${req.user.user_name}) created user: ${user.username}`;
    }

    saveLog(req, actor, action, detail, { 
      new_user_id: user._id,
      new_username: user.username 
    });

    res.status(201).json({
      _id: user._id,
      user_id: user.user_id,
      username: user.username,
      message: "User created successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Login ---
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await Auth.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      saveLog(req, user, "LOGIN", "User logged in successfully");

      res.json({
        _id: user._id,
        user_id: user.user_id,
        username: user.username,
        role: user.role_name,
        token: generateToken(user._id, user.role_name),
      });
    } else {
      saveLog(req, null, "LOGIN_FAILED", `Failed login attempt for: ${username}`);
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Get Profile ---
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

// --- Get All Users ---
exports.getUsers = async (req, res) => {
  try {
    const users = await Auth.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Get Users By Role ---
exports.getUserByRole = async (req, res) => {
  try {
    const targetRole = req.params.role;
    const requesterRole = req.user.role_code;

    if (requesterRole === "admin") {
      const users = await Auth.find({
        role_code: { $in: ["admin", targetRole] },
      })
        .select("-password")
        .sort({ user_name: 1 });
      return res.json(users);
    }

    const users = await Auth.find({ role_code: targetRole })
      .select("-password")
      .sort({ user_name: 1 });

    res.json(users);
  } catch (error) {
    console.error("Error get user by role:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- Update Profile Name (User Own) ---
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
      
      saveLog(req, user, "UPDATE_USER_NAME", `Updated user name to: ${user_name}`);

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

// --- Update Password (User Own) ---
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please provide both current and new passwords" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
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
      
      saveLog(req, user, "UPDATE_PASSWORD", "User updated their password");
      
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Admin Update User ---
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
      }).populate("status");

      if (activeIssue && activeIssue.status && activeIssue.status.code !== "success") {
        return res.status(400).json({
          message: `Cannot change role. User has active issue: ${activeIssue.name}`,
        });
      }

      user.role_code = role_code;
      user.role_name = role_name;
    }

    if (password && password.length >= 6) {
      user.password = password;
    }

    const updatedUser = await user.save();

    saveLog(req, req.user, "UPDATE_USER_BY_ADMIN", `Admin updated user: ${updatedUser.username}`, {
      target_user_id: updatedUser._id
    });

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

// --- Admin Delete User ---
exports.deleteUser = async (req, res) => {
  try {
    const targetUserIdString = req.params.user_id;

    // ค้นหา User เป้าหมายก่อน
    const userToDelete = await Auth.findOne({ user_id: targetUserIdString });

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // ป้องกันการลบตัวเอง (เทียบ _id)
    if (req.user.id === userToDelete._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await Auth.findByIdAndDelete(userToDelete._id);
    
    saveLog(req, req.user, "DELETE_USER", `Admin deleted user: ${userToDelete.username}`, {
       deleted_user_id: userToDelete.user_id 
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};