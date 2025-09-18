const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String
  },
  credits: {
    type: Number,
    default: 1
  },
  department: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  isElective: {
    type: Boolean,
    default: false
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  syllabus: [{
    topic: String,
    duration: Number, // in weeks
    description: String
  }],
  assessment: {
    exams: {
      weight: Number,
      count: Number
    },
    assignments: {
      weight: Number,
      count: Number
    },
    projects: {
      weight: Number,
      count: Number
    },
    participation: {
      weight: Number
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);