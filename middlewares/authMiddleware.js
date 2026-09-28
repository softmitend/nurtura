const { verifyToken } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token missing' });

  const [scheme, token] = authHeader.trim().split(/\s+/);
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  try {
    const decoded = verifyToken(token);
    const userId = Number(decoded.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = { ...decoded, userId };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
