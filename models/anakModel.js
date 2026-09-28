// models/anakModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // sesuaikan path config-mu

const Anak = sequelize.define('Anak', {
  nama: DataTypes.STRING,
  jenis_kelamin: DataTypes.STRING,
  umur_bulan: DataTypes.INTEGER,
  tinggi_badan: DataTypes.FLOAT,
  berat_badan: DataTypes.FLOAT,
  predicted_class: DataTypes.INTEGER,
  label: DataTypes.STRING
}, {
  tableName: 'anak',
  timestamps: true
});

module.exports = Anak;
