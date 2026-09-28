require('dotenv').config();

const jwt = require('jsonwebtoken');

const getSecret = () => {
  // SECRET_KEY dan SECRET dipertahankan agar instalasi lama tetap kompatibel.
  const secret = process.env.JWT_SECRET || process.env.SECRET_KEY || process.env.SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum dikonfigurasi.');
  }
  return secret;
};

exports.generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: '1d' });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};
