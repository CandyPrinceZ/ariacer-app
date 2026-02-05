const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateUserName,
  updatePassword,
  getUsers,
  getUserByRole,
  deleteUser,
  updateUserByAdmin,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", protect, register); 
router.post("/login", login); 
router.get("/profile", protect, getProfile);
router.put("/update-user-name", protect, updateUserName);
router.put("/update-password", protect, updatePassword);
router.get("/users-list", protect, getUsers);
router.get("/users-list/:role", protect, getUserByRole);
router.delete("/delete-user/:user_id", protect, deleteUser);
router.put("/update-user-by-admin", protect, updateUserByAdmin);

module.exports = router;