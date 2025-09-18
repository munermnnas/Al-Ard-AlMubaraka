const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: String,
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  hireDate: {
    type: Date,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  qualification: {
    degree: String,
    institution: String,
    year: Number,
    specialization: String
  },
  experience: [{
    school: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  salary: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    routingNumber: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  workingHours: {
    start: String,
    end: String,
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  }
}, {
  timestamps: true
});

// Generate teacher ID before saving
teacherSchema.pre('save', async function(next) {
  if (!this.teacherId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Teacher').countDocuments();
    this.teacherId = `TCH${year}${String(count + 1).padStart(4, '0')}`;
  }
  if (!this.employeeId) {
    const count = await mongoose.model('Teacher').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);