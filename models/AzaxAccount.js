const mongoose = require('mongoose');
const Transaction = require('./Transaction.js');
const { Schema, model } = mongoose;
const { Types } = Schema;

const cryptoTransactionSchema = new Schema({
  transactionId: String, // Unique identifier for the transaction && Transaction hash on the Ethereum blockchain
  timeStamp: String, // Timestamp of the transaction
  type: String, // Type of transaction (e.g., buy, sell, transfer)
  pair: String, // Asset pair involved in the transaction (e.g., BTC/USD)
  amount: Number, // Amount of the asset involved in the transaction
  pricePerUnit: Number, // Price per unit of the asset
  total: Number, // Total value of the transaction (amount * pricePerUnit)
  blockNumber: Number, // Block number on which the transaction is included
  gasUsed: Number, // Amount of gas used for the transaction
  from: String, // Sender address of the transaction
  to: String, // Receiver address of the transaction
  value: String, // Value transferred in the transaction (e.g., '1.5 Ether')
});

const azaxAccountSchema = new Schema({
  accountId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fiatBalance: {
    type: Number,
    default: 0,
  },
  bitcoinWallet: {
    publicKey: String,
    privateKey: String,
    address: String,
    balance: String,
    seedPhrase: String,
    transactions: {
      type: [cryptoTransactionSchema],
      default: [],
    },
  },
  ethereumWallet: {
    privateKey: String,
    address: String,
    balance: String,
    seedPhrase: String,
    transactions: {
      type: [cryptoTransactionSchema],
      default: [],
    },
  },
  solanaWallet: {
    publicKey: {
      type: String,
      set: (publicKeyArray) => Buffer.from(publicKeyArray).toString('hex'),
      get: (publicKeyHex) => Uint8Array.from(Buffer.from(publicKeyHex, 'hex')),
    },
    secretKey: {
      type: String,
      set: (secretKeyArray) => Buffer.from(secretKeyArray).toString('hex'),
      get: (secretKeyHex) => Uint8Array.from(Buffer.from(secretKeyHex, 'hex')),
    },
    address: String,
    balance: String,
    seedPhrase: String,
    transactions: {
      type: [cryptoTransactionSchema],
      default: [],
    },
  },
  tetherWallet: {
    privateKey: String,
    address: String,
    balance: String,
    seedPhrase: String,
    transactions: {
      type: [cryptoTransactionSchema],
      default: [],
    },
  },
  transactionHistory: {
    type: [Transaction.schema],
    default: [],
  },
});

const AzaxAccount = model('AzaxAccount', azaxAccountSchema);

module.exports = AzaxAccount;
