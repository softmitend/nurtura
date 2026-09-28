const express = require('express');
const router = express.Router();
const {
  getAllStatusAnak,
  getAnakById,
  createAnak,
  updateAnakById,
  deleteAnakById,
} = require('../controllers/anakController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/status-anak', verifyToken, getAllStatusAnak);
router.post('/status-anak', verifyToken, createAnak);
router.get('/status-anak/:id', verifyToken, getAnakById);
router.put('/status-anak/:id', verifyToken, updateAnakById);
router.delete('/status-anak/:id', verifyToken, deleteAnakById);

module.exports = router;
