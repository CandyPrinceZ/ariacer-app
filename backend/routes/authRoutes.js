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

router.post("/register", register); // POST /api/auth/register
router.post("/login", login); // POST /api/auth/login
router.get("/profile", protect, getProfile); // GET /api/auth/profile
router.put("/update-user-name", protect, updateUserName); // PUT /api/auth/update-user-name
router.put("/update-password", protect, updatePassword); // PUT /api/auth/update-password
router.get("/users-list", protect, getUsers); // GET /api/auth/users-list
router.get("/users-list/:role", protect, getUserByRole); // GET /api/auth/users-list
router.delete("/delete-user/:user_id", protect, deleteUser); // DELETE /api/auth/delete-user
router.put("/update-user-by-admin", protect, updateUserByAdmin); // PUT /api/auth/update-user

module.exports = router;
