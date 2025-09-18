const express = require('express');
const { body, validationResult } = require('express-validator');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/grades
// @desc    Get all grades
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.term) filter.term = req.query.term;
    if (req.query.status) filter.status = req.query.status;

    // Teachers can only see grades for their subjects
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      if (teacher) {
        filter.subject = { $in: teacher.subjects };
      }
    }

    const grades = await Grade.find(filter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .populate('class', 'name grade section')
      .sort({ academicYear: -1, term: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Grade.countDocuments(filter);

    res.json({
      grades,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/grades/:id
// @desc    Get grade by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('subject', 'name code description')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .populate('class', 'name grade section');

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check access permissions
    if (req.user.role === 'parent') {
      const student = await Student.findById(grade.student._id);
      if (student.parent?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(grade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/grades
// @desc    Create new grade
// @access  Private (Teacher, Admin)
router.post('/', auth, authorize('teacher', 'admin'), [
  body('student').notEmpty().withMessage('Student is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('class').notEmpty().withMessage('Class is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('term').isIn(['first', 'second', 'third', 'final']).withMessage('Invalid term'),
  body('grades').isArray().withMessage('Grades must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student, subject, class: classId, academicYear, term, grades, comments } = req.body;

    // Get teacher ID
    let teacherId;
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      teacherId = teacher._id;
    } else {
      teacherId = req.body.teacher;
    }

    const grade = new Grade({
      student,
      subject,
      teacher: teacherId,
      class: classId,
      academicYear,
      term,
      grades,
      comments
    });

    await grade.save();

    res.status(201).json(grade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/grades/:id
// @desc    Update grade
// @access  Private (Teacher, Admin)
router.put('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { grades, comments, status } = req.body;
    const updateData = {};

    if (grades !== undefined) updateData.grades = grades;
    if (comments !== undefined) updateData.comments = comments;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published') {
        updateData.publishedAt = new Date();
      }
    }

    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('student', 'user')
    .populate('student.user', 'firstName lastName')
    .populate('subject', 'name code')
    .populate('teacher', 'user')
    .populate('teacher.user', 'firstName lastName')
    .populate('class', 'name grade section');

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.json(grade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/grades/:id
// @desc    Delete grade
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    await Grade.findByIdAndDelete(req.params.id);

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/grades/student/:studentId
// @desc    Get grades for a specific student
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access permissions
    if (req.user.role === 'parent' && student.parent?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { academicYear, term, subject } = req.query;
    const filter = { student: req.params.studentId };
    
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (subject) filter.subject = subject;

    const grades = await Grade.find(filter)
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .populate('class', 'name grade section')
      .sort({ academicYear: -1, term: -1 });

    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/grades/class/:classId
// @desc    Get grades for a specific class
// @access  Private
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { subject, academicYear, term } = req.query;
    const filter = { class: req.params.classId };
    
    if (subject) filter.subject = subject;
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;

    const grades = await Grade.find(filter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .sort({ 'student.user.firstName': 1, 'student.user.lastName': 1 });

    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/grades/statistics/:studentId
// @desc    Get grade statistics for a student
// @access  Private
router.get('/statistics/:studentId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access permissions
    if (req.user.role === 'parent' && student.parent?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { academicYear } = req.query;
    const filter = { student: req.params.studentId };
    if (academicYear) filter.academicYear = academicYear;

    const grades = await Grade.find(filter)
      .populate('subject', 'name code')
      .sort({ academicYear: -1, term: -1 });

    // Calculate statistics
    const statistics = {
      totalSubjects: grades.length,
      averageGPA: 0,
      averagePercentage: 0,
      letterGradeDistribution: {},
      subjectGrades: [],
      termAverages: {}
    };

    if (grades.length > 0) {
      let totalGPA = 0;
      let totalPercentage = 0;

      grades.forEach(grade => {
        totalGPA += grade.gpa || 0;
        totalPercentage += grade.percentage || 0;

        // Letter grade distribution
        statistics.letterGradeDistribution[grade.letterGrade] = 
          (statistics.letterGradeDistribution[grade.letterGrade] || 0) + 1;

        // Subject grades
        statistics.subjectGrades.push({
          subject: grade.subject,
          gpa: grade.gpa,
          percentage: grade.percentage,
          letterGrade: grade.letterGrade,
          term: grade.term,
          academicYear: grade.academicYear
        });

        // Term averages
        if (!statistics.termAverages[grade.term]) {
          statistics.termAverages[grade.term] = { totalGPA: 0, count: 0 };
        }
        statistics.termAverages[grade.term].totalGPA += grade.gpa || 0;
        statistics.termAverages[grade.term].count += 1;
      });

      statistics.averageGPA = totalGPA / grades.length;
      statistics.averagePercentage = totalPercentage / grades.length;

      // Calculate term averages
      Object.keys(statistics.termAverages).forEach(term => {
        const termData = statistics.termAverages[term];
        statistics.termAverages[term].averageGPA = termData.totalGPA / termData.count;
      });
    }

    res.json(statistics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;