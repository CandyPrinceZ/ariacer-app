const express = require("express");
const router = express.Router();
const {
  createIssue,
  getIssues,
  getUnassignedIssues,
  getIssuesByAssignee,
  getIssueById,
  updateIssue,
  deleteIssue,
} = require("../controllers/issueController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createIssue); // POST /api/issues
router.get("/", protect, getIssues); // GET  /api/issues
router.get("/unassigned", protect, getUnassignedIssues); // GET  /api/issues/unassigned
router.get("/assigned/:assigneeId", protect, getIssuesByAssignee); // GET  /api/issues/assigned/:assigneeId
router.get("/:id", protect, getIssueById); // GET  /api/issues/123
router.put("/:id", protect, updateIssue); // PUT  /api/issues/123
router.delete("/:id", protect, deleteIssue); // DELETE /api/issues/123

module.exports = router;
