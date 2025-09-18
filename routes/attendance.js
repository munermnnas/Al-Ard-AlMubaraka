const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.date) filter.date = new Date(req.query.date);
    if (req.query.startDate && req.query.endDate) {
      filter.date = { 
        $gte: new Date(req.query.startDate), 
        $lte: new Date(req.query.endDate) 
      };
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.semester) filter.semester = req.query.semester;

    const attendance = await Attendance.find(filter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('class', 'name grade section')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    res.json({
      attendance,
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

// @route   POST /api/attendance
// @desc    Mark attendance
// @access  Private (Teacher, Admin)
router.post('/', auth, authorize('teacher', 'admin'), [
  body('class').notEmpty().withMessage('Class is required'),
  body('date').isISO8601().withMessage('Date is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('semester').isIn(['first', 'second', 'third', 'final']).withMessage('Invalid semester'),
  body('attendance').isArray().withMessage('Attendance must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class: classId, subject, date, academicYear, semester, attendance, period } = req.body;

    // Get teacher ID
    let teacherId;
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      teacherId = teacher._id;
    } else {
      teacherId = req.body.teacher;
    }

    // Delete existing attendance for the same date, class, and period
    await Attendance.deleteMany({
      class: classId,
      date: new Date(date),
      period: period || { $exists: false }
    });

    // Create attendance records
    const attendanceRecords = attendance.map(record => ({
      student: record.student,
      class: classId,
      subject: subject,
      date: new Date(date),
      status: record.status,
      teacher: teacherId,
      remarks: record.remarks,
      period: period,
      academicYear,
      semester
    }));

    const createdAttendance = await Attendance.insertMany(attendanceRecords);

    res.status(201).json(createdAttendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/class/:classId
// @desc    Get attendance for a specific class
// @access  Private
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { date, startDate, endDate, subject, period } = req.query;
    const filter = { class: req.params.classId };
    
    if (date) {
      filter.date = new Date(date);
    } else if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    if (subject) filter.subject = subject;
    if (period) filter.period = period;

    const attendance = await Attendance.find(filter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .sort({ date: -1, 'student.user.firstName': 1 });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for a specific student
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

    const { startDate, endDate, subject, class: classId } = req.query;
    const filter = { student: req.params.studentId };
    
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    if (subject) filter.subject = subject;
    if (classId) filter.class = classId;

    const attendance = await Attendance.find(filter)
      .populate('class', 'name grade section')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/statistics/:studentId
// @desc    Get attendance statistics for a student
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

    const { academicYear, semester, startDate, endDate } = req.query;
    const filter = { student: req.params.studentId };
    
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('subject', 'name code')
      .populate('class', 'name grade section')
      .sort({ date: -1 });

    // Calculate statistics
    const statistics = {
      totalDays: attendance.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendancePercentage: 0,
      subjectAttendance: {},
      monthlyAttendance: {}
    };

    if (attendance.length > 0) {
      attendance.forEach(record => {
        // Count by status
        statistics[record.status]++;

        // Count by subject
        const subjectName = record.subject?.name || 'General';
        if (!statistics.subjectAttendance[subjectName]) {
          statistics.subjectAttendance[subjectName] = {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          };
        }
        statistics.subjectAttendance[subjectName].total++;
        statistics.subjectAttendance[subjectName][record.status]++;

        // Count by month
        const month = record.date.toISOString().substring(0, 7); // YYYY-MM
        if (!statistics.monthlyAttendance[month]) {
          statistics.monthlyAttendance[month] = {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          };
        }
        statistics.monthlyAttendance[month].total++;
        statistics.monthlyAttendance[month][record.status]++;
      });

      // Calculate attendance percentage
      const totalPresent = statistics.present + statistics.late;
      statistics.attendancePercentage = (totalPresent / statistics.totalDays) * 100;

      // Calculate percentages for subjects
      Object.keys(statistics.subjectAttendance).forEach(subject => {
        const data = statistics.subjectAttendance[subject];
        const present = data.present + data.late;
        data.percentage = (present / data.total) * 100;
      });

      // Calculate percentages for months
      Object.keys(statistics.monthlyAttendance).forEach(month => {
        const data = statistics.monthlyAttendance[month];
        const present = data.present + data.late;
        data.percentage = (present / data.total) * 100;
      });
    }

    res.json(statistics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private (Teacher, Admin)
router.put('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const updateData = {};

    if (status !== undefined) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('student', 'user')
    .populate('student.user', 'firstName lastName')
    .populate('class', 'name grade section')
    .populate('subject', 'name code')
    .populate('teacher', 'user')
    .populate('teacher.user', 'firstName lastName');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;