const express = require('express');
const { body, validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(filter)
      .populate('prerequisites', 'name code')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Subject.countDocuments(filter);

    res.json({
      subjects,
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

// @route   GET /api/subjects/:id
// @desc    Get subject by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('prerequisites', 'name code description');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Subject name is required'),
  body('code').notEmpty().withMessage('Subject code is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('grade').notEmpty().withMessage('Grade is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description, credits, department, grade, isElective, prerequisites, syllabus, assessment } = req.body;

    const subject = new Subject({
      name,
      code,
      description,
      credits,
      department,
      grade,
      isElective,
      prerequisites,
      syllabus,
      assessment
    });

    await subject.save();

    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, code, description, credits, department, grade, isElective, prerequisites, syllabus, assessment, status } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (credits !== undefined) updateData.credits = credits;
    if (department !== undefined) updateData.department = department;
    if (grade !== undefined) updateData.grade = grade;
    if (isElective !== undefined) updateData.isElective = isElective;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (syllabus !== undefined) updateData.syllabus = syllabus;
    if (assessment !== undefined) updateData.assessment = assessment;
    if (status !== undefined) updateData.status = status;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subjects/grade/:grade
// @desc    Get subjects by grade
// @access  Private
router.get('/grade/:grade', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ 
      grade: req.params.grade,
      status: 'active'
    })
    .populate('prerequisites', 'name code')
    .sort({ name: 1 });

    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subjects/department/:department
// @desc    Get subjects by department
// @access  Private
router.get('/department/:department', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ 
      department: req.params.department,
      status: 'active'
    })
    .populate('prerequisites', 'name code')
    .sort({ grade: 1, name: 1 });

    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;