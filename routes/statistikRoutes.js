const express = require('express');
const router = express.Router();
const { getStatistik } = require('../controllers/statistikController');
const authMiddleware = require('../middlewares/authMiddleware');
const verifyToken = require('../middlewares/authMiddleware'); // ✅ import middleware

router.get('/statistik', authMiddleware, getStatistik);

module.exports = router;
