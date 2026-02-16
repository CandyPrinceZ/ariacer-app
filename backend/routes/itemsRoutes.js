const express = require('express');
const router = express.Router();
const { getRoles,getIssueTypes,getUrgencies,getStatusesForDev,getStatusesForImp,getStatuses,getServerStatus } = require('../controllers/itemsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/issue-types', protect, getIssueTypes); // GET /api/items/issue-types
router.get('/server-status', protect, getServerStatus); // GET /api/items/server-status
router.get('/roles', protect, getRoles); // GET /api/items/roles
router.get('/urgencies', protect, getUrgencies); // GET /api/items/urgencies
router.get('/statuses', protect, getStatuses); // GET /api/items/statuses
router.get('/statuses/dev', protect, getStatusesForDev); // GET /api/items/statuses/dev

module.exports = router;