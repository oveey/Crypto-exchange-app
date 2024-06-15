const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const transactionSchema = new Schema({
  userId: {
    type: String, // required
  },
  accountId: {
    type: String, // required
  },
  transactionType: {
    type: String, // required
  },
  transactionCategory: {
    type: String, //fiat, crypto // required
    enums: ['fiat', 'crypto'],
  },
  transactionId: {
    type: String, // required
  },
  amount: {
    type: Number, // required
  },
  status: {
    type: String,
    default: 'Completed', //Pending, Completed // required
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Transaction = model('Transaction', transactionSchema);

module.exports = Transaction;
