const db = require('../config/database');

exports.findByUsername = async (username) => {
  const result = await db.query('SELECT * FROM admin WHERE username = $1', [username]);
  return result.rows[0];
};

exports.createUser = async (username, hashedPassword) => {
  await db.query('INSERT INTO admin (username, password) VALUES ($1, $2)', [username, hashedPassword]);
};
