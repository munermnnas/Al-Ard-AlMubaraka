const express = require('express');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private (Admin)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { teacherId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(filter)
      .populate('user', 'firstName lastName email phone profilePicture')
      .populate('subjects', 'name code')
      .populate('classes', 'name grade section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Teacher.countDocuments(filter);

    res.json({
      teachers,
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

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'firstName lastName email phone dateOfBirth address profilePicture')
      .populate('subjects', 'name code department')
      .populate('classes', 'name grade section')
      .populate('classes.classTeacher', 'user')
      .populate('classes.classTeacher.user', 'firstName lastName');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('department').notEmpty().withMessage('Department is required'),
  body('hireDate').isISO8601().withMessage('Please enter a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, dateOfBirth, department, hireDate, qualification, subjects } = req.body;

    // Create user account
    const user = new User({
      firstName,
      lastName,
      email,
      password: 'defaultPassword123', // Should be changed on first login
      role: 'teacher',
      phone,
      dateOfBirth
    });

    await user.save();

    // Create teacher profile
    const teacher = new Teacher({
      user: user._id,
      department,
      hireDate: new Date(hireDate),
      qualification,
      subjects
    });

    await teacher.save();

    res.status(201).json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { department, subjects, classes, qualification, experience, salary, workingHours, status } = req.body;
    const updateData = {};

    if (department !== undefined) updateData.department = department;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (classes !== undefined) updateData.classes = classes;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (experience !== undefined) updateData.experience = experience;
    if (salary !== undefined) updateData.salary = salary;
    if (workingHours !== undefined) updateData.workingHours = workingHours;
    if (status !== undefined) updateData.status = status;

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Remove teacher from classes
    await Class.updateMany(
      { classTeacher: teacher._id },
      { $unset: { classTeacher: 1 } }
    );

    // Delete user account
    await User.findByIdAndDelete(teacher.user);

    // Delete teacher profile
    await Teacher.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers/:id/classes
// @desc    Get teacher's classes
// @access  Private
router.get('/:id/classes', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const classes = await Class.find({
      $or: [
        { classTeacher: teacher._id },
        { 'subjects.teacher': teacher._id }
      ]
    })
    .populate('classTeacher', 'user')
    .populate('classTeacher.user', 'firstName lastName')
    .populate('subjects.subject', 'name code')
    .populate('students', 'user')
    .populate('students.user', 'firstName lastName');

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers/:id/students
// @desc    Get teacher's students
// @access  Private
router.get('/:id/students', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const classes = await Class.find({
      $or: [
        { classTeacher: teacher._id },
        { 'subjects.teacher': teacher._id }
      ]
    });

    const classIds = classes.map(cls => cls._id);
    const Student = require('../models/Student');

    const students = await Student.find({
      currentClass: { $in: classIds }
    })
    .populate('user', 'firstName lastName email phone')
    .populate('currentClass', 'name grade section')
    .populate('parent', 'firstName lastName email');

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;