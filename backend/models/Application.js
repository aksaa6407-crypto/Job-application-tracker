const mongoose = require('mongoose');

const TRANSITIONS = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Rejected: [],
  Accepted: [],
  Declined: [],
};
const FINAL = ['Rejected', 'Accepted', 'Declined'];

const schema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Contract'],
      required: true,
    },
    appliedDate: { type: Date, required: true },
    followUpDate: { type: Date },
    salary: { type: Number, min: 0 },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.keys(TRANSITIONS),
      default: 'Applied',
    },
    history: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

schema.virtual('isOverdue').get(function () {
  return this.status === 'Applied' && new Date() > this.followUpDate;
});

schema.virtual('nextStatuses').get(function () {
  return TRANSITIONS[this.status] || [];
});

schema.set('toJSON', { virtuals: true });
schema.set('toObject', { virtuals: true });

const Application = mongoose.model('Application', schema);
module.exports = Application;
module.exports.TRANSITIONS = TRANSITIONS;
module.exports.FINAL = FINAL;