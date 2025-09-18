// MongoDB initialization script
db = db.getSiblingDB('school_management');

// Create collections with initial data
db.createCollection('users');
db.createCollection('students');
db.createCollection('teachers');
db.createCollection('classes');
db.createCollection('subjects');
db.createCollection('grades');
db.createCollection('attendances');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.students.createIndex({ studentId: 1 }, { unique: true });
db.teachers.createIndex({ teacherId: 1 }, { unique: true });
db.teachers.createIndex({ employeeId: 1 }, { unique: true });

// Create compound indexes
db.attendances.createIndex({ student: 1, date: 1, class: 1 });
db.attendances.createIndex({ class: 1, date: 1 });
db.grades.createIndex({ student: 1, subject: 1, academicYear: 1, term: 1 });

print('Database initialized successfully!');