const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const bankSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

const Bank = model('Bank', bankSchema);

module.exports = Bank;
