import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: {
    type: String
  },
  chatId: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    default: 'pending'
  },
  clientPhone: {
    type: String
  }
}, { timestamps: true });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
