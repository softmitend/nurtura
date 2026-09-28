const express = require('express');
const router = express.Router();
// Dokumentasi berada di folder public agar disajikan melalui CDN Vercel.
router.get('/doc', (req, res) => {
  res.redirect('/api-doc.html');
});

module.exports = router;
