const express = require('express');
const router = express.Router();
const { getProfile, createProfile, updateProfile } = require('../controllers/profileController');
const authenticate = require('../middlewares/authMiddleware'); // Middleware JWT

// Semua endpoint di-protect oleh token
router.get('/', authenticate, getProfile);        // Ambil profil posyandu
router.post('/', authenticate, createProfile);    // Buat profil baru
router.put('/', authenticate, updateProfile);     // Update profil

module.exports = router;
