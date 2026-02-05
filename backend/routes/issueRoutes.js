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
  getIssuesforTester,
  getIssuesByHighUrgency,
} = require("../controllers/issueController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createIssue); // POST /api/issues
router.get("/", protect, getIssues); // GET  /api/issues
router.get("/high-urgency", protect, getIssuesByHighUrgency); // GET  /api/issues/high-urgency
router.get("/unassigned", protect, getUnassignedIssues); // GET  /api/issues/unassigned
router.get("/assigned/:assigneeId", protect, getIssuesByAssignee); // GET  /api/issues/assigned/:assigneeId
router.get("/:id", protect, getIssueById); // GET  /api/issues/123
router.get("/tester/list", protect, getIssuesforTester); // GET  /api/issues/tester/list
router.put("/:id", protect, updateIssue); // PUT  /api/issues/123
router.delete("/:id", protect, deleteIssue); // DELETE /api/issues/123

module.exports = router;
