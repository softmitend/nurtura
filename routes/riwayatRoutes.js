const express = require('express');
const router = express.Router();

const {
  createRiwayat,
  getRiwayatReport,
  getRiwayatByAnakId,
  deleteRiwayatById
} = require('../controllers/riwayatController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/riwayat', verifyToken, createRiwayat);
router.get('/riwayat-report', verifyToken, getRiwayatReport);
router.get('/riwayat/:anak_id', verifyToken, getRiwayatByAnakId);
router.delete('/riwayat/:id', verifyToken, deleteRiwayatById);

module.exports = router;
