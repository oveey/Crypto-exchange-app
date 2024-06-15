const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const deletedUserSchema = new Schema({
  accId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  email: {
    type: String,
    required: true,
    // unique: true,
  },
  username: {
    type: String,
    // unique: true,
  },
  fullName: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: true,
  },
  deletedAt: {
    type: Date,
    default: Date.now(),
  },
});

const DeletedUser = model('DeletedUser', deletedUserSchema);

module.exports = DeletedUser;
