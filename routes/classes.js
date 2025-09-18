const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { section: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const classes = await Class.find(filter)
      .populate('classTeacher', 'user')
      .populate('classTeacher.user', 'firstName lastName')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacher', 'user')
      .populate('subjects.teacher.user', 'firstName lastName')
      .sort({ grade: 1, section: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Class.countDocuments(filter);

    res.json({
      classes,
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

// @route   GET /api/classes/:id
// @desc    Get class by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('classTeacher', 'user')
      .populate('classTeacher.user', 'firstName lastName email')
      .populate('subjects.subject', 'name code description')
      .populate('subjects.teacher', 'user')
      .populate('subjects.teacher.user', 'firstName lastName email')
      .populate('students', 'user')
      .populate('students.user', 'firstName lastName email phone')
      .populate('students.parent', 'firstName lastName email phone');

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/classes
// @desc    Create new class
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Class name is required'),
  body('grade').notEmpty().withMessage('Grade is required'),
  body('section').notEmpty().withMessage('Section is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, grade, section, academicYear, classTeacher, subjects, room, description } = req.body;

    const classData = new Class({
      name,
      grade,
      section,
      academicYear,
      classTeacher,
      subjects,
      room,
      description
    });

    await classData.save();

    // Update teacher's classes if class teacher is assigned
    if (classTeacher) {
      await Teacher.findByIdAndUpdate(classTeacher, {
        $addToSet: { classes: classData._id }
      });
    }

    res.status(201).json(classData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, grade, section, academicYear, classTeacher, subjects, room, description, maxStudents, status } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (grade !== undefined) updateData.grade = grade;
    if (section !== undefined) updateData.section = section;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (classTeacher !== undefined) updateData.classTeacher = classTeacher;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (room !== undefined) updateData.room = room;
    if (description !== undefined) updateData.description = description;
    if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
    if (status !== undefined) updateData.status = status;

    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('classTeacher', 'user')
     .populate('classTeacher.user', 'firstName lastName');

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove class from teachers
    await Teacher.updateMany(
      { classes: classData._id },
      { $pull: { classes: classData._id } }
    );

    // Remove students from class
    await Student.updateMany(
      { currentClass: classData._id },
      { $unset: { currentClass: 1 } }
    );

    // Delete class
    await Class.findByIdAndDelete(req.params.id);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/classes/:id/students
// @desc    Add student to class
// @access  Private (Admin)
router.post('/:id/students', auth, authorize('admin'), [
  body('studentId').notEmpty().withMessage('Student ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if class is full
    if (classData.students.length >= classData.maxStudents) {
      return res.status(400).json({ message: 'Class is full' });
    }

    // Remove student from previous class
    await Class.findByIdAndUpdate(student.currentClass, {
      $pull: { students: studentId }
    });

    // Add student to new class
    await Class.findByIdAndUpdate(req.params.id, {
      $addToSet: { students: studentId }
    });

    // Update student's current class
    await Student.findByIdAndUpdate(studentId, {
      currentClass: req.params.id
    });

    res.json({ message: 'Student added to class successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/classes/:id/students/:studentId
// @desc    Remove student from class
// @access  Private (Admin)
router.delete('/:id/students/:studentId', auth, authorize('admin'), async (req, res) => {
  try {
    const classData = await Class.findByIdAndUpdate(req.params.id, {
      $pull: { students: req.params.studentId }
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Update student's current class
    await Student.findByIdAndUpdate(req.params.studentId, {
      $unset: { currentClass: 1 }
    });

    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes/:id/schedule
// @desc    Get class schedule
// @access  Private
router.get('/:id/schedule', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacher', 'user')
      .populate('subjects.teacher.user', 'firstName lastName');

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Organize schedule by day
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    classData.subjects.forEach(subject => {
      if (subject.schedule) {
        const day = subject.schedule.day;
        schedule[day].push({
          subject: subject.subject,
          teacher: subject.teacher,
          startTime: subject.schedule.startTime,
          endTime: subject.schedule.endTime,
          room: subject.schedule.room
        });
      }
    });

    // Sort by start time for each day
    Object.keys(schedule).forEach(day => {
      schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;