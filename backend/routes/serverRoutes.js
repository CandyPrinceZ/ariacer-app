const express = require('express');
const router = express.Router();
const { getAllServers,CreateServer,getServer,DeleteServer,UpdateServer } = require('../controllers/serverController');
const { protect } = require('../middleware/authMiddleware');

router.get('/get-all-server', protect, getAllServers);
router.post('/', protect, CreateServer);
router.put('/:id', protect, UpdateServer);
router.delete('/:id', protect, DeleteServer);
router.get('/:id', protect, getServer);

module.exports = router;