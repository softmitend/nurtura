const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const verifyToken = require('../middlewares/authMiddleware'); // ✅ import middleware

router.post('/predict',verifyToken, mlController.predictData);

module.exports = router;
