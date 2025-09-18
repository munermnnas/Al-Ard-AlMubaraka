const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  remarks: {
    type: String
  },
  period: {
    type: Number,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    enum: ['first', 'second', 'third', 'final'],
    required: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
attendanceSchema.index({ student: 1, date: 1, class: 1 });
attendanceSchema.index({ class: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);