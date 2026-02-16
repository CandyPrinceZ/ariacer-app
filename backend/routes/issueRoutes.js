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
  DeleteSuccessStatusIssues,
  getIssuesforTester,
  getIssuesByHighUrgency,
  editIssue,
} = require("../controllers/issueController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createIssue);
router.get("/", protect, getIssues);

router.get("/high-urgency", protect, getIssuesByHighUrgency);
router.get("/unassigned", protect, getUnassignedIssues);
router.get("/tester/list", protect, getIssuesforTester);

router.delete("/delete-success-status", protect, DeleteSuccessStatusIssues);

router.get("/assigned/:assigneeId", protect, getIssuesByAssignee);
router.put("/edit/:id", protect, editIssue); 

router.get("/:id", protect, getIssueById);
router.put("/:id", protect, updateIssue);
router.delete("/:id", protect, deleteIssue);

module.exports = router;