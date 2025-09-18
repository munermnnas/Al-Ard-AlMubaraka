const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['first', 'second', 'third', 'final'],
    required: true
  },
  grades: [{
    type: {
      type: String,
      enum: ['exam', 'quiz', 'assignment', 'project', 'participation'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1
    },
    weight: {
      type: Number,
      default: 1
    },
    date: {
      type: Date,
      default: Date.now
    },
    comments: String
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  letterGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'final'],
    default: 'draft'
  },
  publishedAt: Date,
  comments: String
}, {
  timestamps: true
});

// Calculate totals before saving
gradeSchema.pre('save', function(next) {
  if (this.grades && this.grades.length > 0) {
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    this.grades.forEach(grade => {
      totalScore += (grade.score * grade.weight);
      maxPossibleScore += (grade.maxScore * grade.weight);
    });
    
    this.totalScore = totalScore;
    this.maxPossibleScore = maxPossibleScore;
    this.percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    // Calculate letter grade based on percentage
    if (this.percentage >= 97) this.letterGrade = 'A+';
    else if (this.percentage >= 93) this.letterGrade = 'A';
    else if (this.percentage >= 90) this.letterGrade = 'A-';
    else if (this.percentage >= 87) this.letterGrade = 'B+';
    else if (this.percentage >= 83) this.letterGrade = 'B';
    else if (this.percentage >= 80) this.letterGrade = 'B-';
    else if (this.percentage >= 77) this.letterGrade = 'C+';
    else if (this.percentage >= 73) this.letterGrade = 'C';
    else if (this.percentage >= 70) this.letterGrade = 'C-';
    else if (this.percentage >= 67) this.letterGrade = 'D+';
    else if (this.percentage >= 63) this.letterGrade = 'D';
    else if (this.percentage >= 60) this.letterGrade = 'D-';
    else this.letterGrade = 'F';
    
    // Calculate GPA
    switch (this.letterGrade) {
      case 'A+':
      case 'A':
        this.gpa = 4.0;
        break;
      case 'A-':
        this.gpa = 3.7;
        break;
      case 'B+':
        this.gpa = 3.3;
        break;
      case 'B':
        this.gpa = 3.0;
        break;
      case 'B-':
        this.gpa = 2.7;
        break;
      case 'C+':
        this.gpa = 2.3;
        break;
      case 'C':
        this.gpa = 2.0;
        break;
      case 'C-':
        this.gpa = 1.7;
        break;
      case 'D+':
        this.gpa = 1.3;
        break;
      case 'D':
        this.gpa = 1.0;
        break;
      case 'D-':
        this.gpa = 0.7;
        break;
      default:
        this.gpa = 0.0;
    }
  }
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);