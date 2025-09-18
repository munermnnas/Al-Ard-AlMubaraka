const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students
// @access  Private (Admin, Teacher)
router.get('/', auth, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.class) filter.currentClass = req.query.class;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { studentId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .populate('user', 'firstName lastName email phone profilePicture')
      .populate('currentClass', 'name grade section')
      .populate('parent', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(filter);

    res.json({
      students,
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

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'firstName lastName email phone dateOfBirth address profilePicture')
      .populate('currentClass', 'name grade section classTeacher')
      .populate('parent', 'firstName lastName email phone')
      .populate('currentClass.classTeacher', 'user')
      .populate('currentClass.classTeacher.user', 'firstName lastName');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if user has access to this student
    if (req.user.role === 'parent' && student.parent?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('currentClass').notEmpty().withMessage('Class is required'),
  body('admissionDate').isISO8601().withMessage('Please enter a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, dateOfBirth, currentClass, admissionDate, parent, emergencyContact, medicalInfo } = req.body;

    // Create user account
    const user = new User({
      firstName,
      lastName,
      email,
      password: 'defaultPassword123', // Should be changed on first login
      role: 'student',
      phone,
      dateOfBirth
    });

    await user.save();

    // Create student profile
    const student = new Student({
      user: user._id,
      currentClass,
      admissionDate: new Date(admissionDate),
      parent,
      emergencyContact,
      medicalInfo
    });

    await student.save();

    // Add student to class
    await Class.findByIdAndUpdate(currentClass, {
      $addToSet: { students: student._id }
    });

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { currentClass, parent, emergencyContact, medicalInfo, transport, status } = req.body;
    const updateData = {};

    if (currentClass !== undefined) updateData.currentClass = currentClass;
    if (parent !== undefined) updateData.parent = parent;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (medicalInfo !== undefined) updateData.medicalInfo = medicalInfo;
    if (transport !== undefined) updateData.transport = transport;
    if (status !== undefined) updateData.status = status;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove student from class
    await Class.findByIdAndUpdate(student.currentClass, {
      $pull: { students: student._id }
    });

    // Delete user account
    await User.findByIdAndDelete(student.user);

    // Delete student profile
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/:id/grades
// @desc    Get student grades
// @access  Private
router.get('/:id/grades', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access permissions
    if (req.user.role === 'parent' && student.parent?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Grade = require('../models/Grade');
    const grades = await Grade.find({ student: req.params.id })
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .sort({ academicYear: -1, term: -1 });

    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/:id/attendance
// @desc    Get student attendance
// @access  Private
router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access permissions
    if (req.user.role === 'parent' && student.parent?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Attendance = require('../models/Attendance');
    const { startDate, endDate, subject } = req.query;

    const filter = { student: req.params.id };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (subject) filter.subject = subject;

    const attendance = await Attendance.find(filter)
      .populate('subject', 'name code')
      .populate('class', 'name grade section')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;