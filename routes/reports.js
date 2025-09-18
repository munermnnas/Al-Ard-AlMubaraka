const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      activeStudents,
      activeTeachers,
      recentStudents,
      recentTeachers,
      classDistribution,
      gradeDistribution
    ] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Teacher.countDocuments({ status: 'active' }),
      Class.countDocuments({ status: 'active' }),
      Subject.countDocuments({ status: 'active' }),
      Student.countDocuments({ status: 'active' }),
      Teacher.countDocuments({ status: 'active' }),
      Student.find({ status: 'active' })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5),
      Teacher.find({ status: 'active' })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5),
      Class.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Grade.aggregate([
        { $group: { _id: '$letterGrade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const stats = {
      overview: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        activeStudents,
        activeTeachers
      },
      recent: {
        students: recentStudents,
        teachers: recentTeachers
      },
      distributions: {
        classes: classDistribution,
        grades: gradeDistribution
      }
    };

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/student-report/:studentId
// @desc    Generate comprehensive student report
// @access  Private
router.get('/student-report/:studentId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('user', 'firstName lastName email phone dateOfBirth')
      .populate('currentClass', 'name grade section classTeacher')
      .populate('parent', 'firstName lastName email phone');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check access permissions
    if (req.user.role === 'parent' && student.parent?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { academicYear, term } = req.query;

    // Get grades
    const gradeFilter = { student: req.params.studentId };
    if (academicYear) gradeFilter.academicYear = academicYear;
    if (term) gradeFilter.term = term;

    const grades = await Grade.find(gradeFilter)
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate('teacher.user', 'firstName lastName')
      .sort({ academicYear: -1, term: -1 });

    // Get attendance
    const attendanceFilter = { student: req.params.studentId };
    if (academicYear) attendanceFilter.academicYear = academicYear;

    const attendance = await Attendance.find(attendanceFilter)
      .populate('subject', 'name code')
      .populate('class', 'name grade section')
      .sort({ date: -1 });

    // Calculate statistics
    const attendanceStats = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };

    attendanceStats.attendancePercentage = attendanceStats.totalDays > 0 
      ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.totalDays) * 100 
      : 0;

    const gradeStats = {
      totalSubjects: grades.length,
      averageGPA: grades.length > 0 ? grades.reduce((sum, g) => sum + (g.gpa || 0), 0) / grades.length : 0,
      averagePercentage: grades.length > 0 ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length : 0
    };

    const report = {
      student,
      academicYear: academicYear || 'All',
      term: term || 'All',
      grades,
      attendance,
      statistics: {
        attendance: attendanceStats,
        grades: gradeStats
      },
      generatedAt: new Date()
    };

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/class-report/:classId
// @desc    Generate class report
// @access  Private
router.get('/class-report/:classId', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId)
      .populate('classTeacher', 'user')
      .populate('classTeacher.user', 'firstName lastName email')
      .populate('students', 'user')
      .populate('students.user', 'firstName lastName email')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacher', 'user')
      .populate('subjects.teacher.user', 'firstName lastName');

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const { academicYear, term } = req.query;

    // Get student grades for the class
    const gradeFilter = { class: req.params.classId };
    if (academicYear) gradeFilter.academicYear = academicYear;
    if (term) gradeFilter.term = term;

    const grades = await Grade.find(gradeFilter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('subject', 'name code')
      .sort({ 'student.user.firstName': 1 });

    // Get attendance for the class
    const attendanceFilter = { class: req.params.classId };
    if (academicYear) attendanceFilter.academicYear = academicYear;

    const attendance = await Attendance.find(attendanceFilter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    // Calculate class statistics
    const studentIds = classData.students.map(s => s._id);
    const studentStats = {};

    studentIds.forEach(studentId => {
      const studentGrades = grades.filter(g => g.student._id.toString() === studentId.toString());
      const studentAttendance = attendance.filter(a => a.student._id.toString() === studentId.toString());

      const avgGPA = studentGrades.length > 0 
        ? studentGrades.reduce((sum, g) => sum + (g.gpa || 0), 0) / studentGrades.length 
        : 0;

      const attendancePercentage = studentAttendance.length > 0
        ? ((studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length) / studentAttendance.length) * 100
        : 0;

      studentStats[studentId] = {
        averageGPA: avgGPA,
        attendancePercentage,
        totalGrades: studentGrades.length,
        totalAttendance: studentAttendance.length
      };
    });

    const classAverageGPA = Object.values(studentStats).length > 0
      ? Object.values(studentStats).reduce((sum, s) => sum + s.averageGPA, 0) / Object.values(studentStats).length
      : 0;

    const classAverageAttendance = Object.values(studentStats).length > 0
      ? Object.values(studentStats).reduce((sum, s) => sum + s.attendancePercentage, 0) / Object.values(studentStats).length
      : 0;

    const report = {
      class: classData,
      academicYear: academicYear || 'All',
      term: term || 'All',
      grades,
      attendance,
      statistics: {
        totalStudents: classData.students.length,
        classAverageGPA,
        classAverageAttendance,
        studentStats
      },
      generatedAt: new Date()
    };

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/teacher-report/:teacherId
// @desc    Generate teacher report
// @access  Private
router.get('/teacher-report/:teacherId', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId)
      .populate('user', 'firstName lastName email phone')
      .populate('subjects', 'name code')
      .populate('classes', 'name grade section');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const { academicYear, term } = req.query;

    // Get teacher's grades
    const gradeFilter = { teacher: req.params.teacherId };
    if (academicYear) gradeFilter.academicYear = academicYear;
    if (term) gradeFilter.term = term;

    const grades = await Grade.find(gradeFilter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('subject', 'name code')
      .populate('class', 'name grade section')
      .sort({ academicYear: -1, term: -1 });

    // Get teacher's attendance records
    const attendanceFilter = { teacher: req.params.teacherId };
    if (academicYear) attendanceFilter.academicYear = academicYear;

    const attendance = await Attendance.find(attendanceFilter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('class', 'name grade section')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    // Calculate statistics
    const subjectStats = {};
    teacher.subjects.forEach(subject => {
      const subjectGrades = grades.filter(g => g.subject._id.toString() === subject._id.toString());
      const subjectAttendance = attendance.filter(a => a.subject && a.subject._id.toString() === subject._id.toString());

      const avgGrade = subjectGrades.length > 0
        ? subjectGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / subjectGrades.length
        : 0;

      subjectStats[subject._id] = {
        subject: subject,
        totalGrades: subjectGrades.length,
        averageGrade: avgGrade,
        totalAttendance: subjectAttendance.length
      };
    });

    const report = {
      teacher,
      academicYear: academicYear || 'All',
      term: term || 'All',
      grades,
      attendance,
      statistics: {
        totalGrades: grades.length,
        totalAttendanceRecords: attendance.length,
        subjectStats
      },
      generatedAt: new Date()
    };

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/attendance-summary
// @desc    Get attendance summary
// @access  Private
router.get('/attendance-summary', auth, async (req, res) => {
  try {
    const { classId, startDate, endDate, academicYear } = req.query;
    const filter = {};

    if (classId) filter.class = classId;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (academicYear) filter.academicYear = academicYear;

    const attendance = await Attendance.find(filter)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName')
      .populate('class', 'name grade section')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    // Group by student
    const studentAttendance = {};
    attendance.forEach(record => {
      const studentId = record.student._id.toString();
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          student: record.student,
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          records: []
        };
      }

      studentAttendance[studentId].totalDays++;
      studentAttendance[studentId][record.status]++;
      studentAttendance[studentId].records.push(record);
    });

    // Calculate percentages
    Object.keys(studentAttendance).forEach(studentId => {
      const data = studentAttendance[studentId];
      const presentDays = data.present + data.late;
      data.attendancePercentage = data.totalDays > 0 ? (presentDays / data.totalDays) * 100 : 0;
    });

    const summary = {
      totalRecords: attendance.length,
      dateRange: { startDate, endDate },
      academicYear: academicYear || 'All',
      studentAttendance,
      generatedAt: new Date()
    };

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;