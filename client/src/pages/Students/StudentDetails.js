import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Tab,
  Tabs,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const StudentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const [studentRes, gradesRes, attendanceRes] = await Promise.all([
        axios.get(`/api/students/${id}`),
        axios.get(`/api/students/${id}/grades`),
        axios.get(`/api/students/${id}/attendance`)
      ]);

      setStudent(studentRes.data);
      setGrades(gradesRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
      setError('Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Alert severity="error">
        {error || 'Student not found'}
      </Alert>
    );
  }

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/students"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Students
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Student Details
        </Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            component={Link}
            to={`/students/${id}/edit`}
          >
            Edit Student
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Student Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {student.user.firstName[0]}{student.user.lastName[0]}
              </Avatar>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                {student.user.firstName} {student.user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {student.user.email}
              </Typography>
              <Chip
                label={student.status}
                color={student.status === 'active' ? 'success' : 'default'}
                sx={{ mb: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Student ID:</strong> {student.studentId}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Phone:</strong> {student.user.phone || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Date of Birth:</strong> {student.user.dateOfBirth ? new Date(student.user.dateOfBirth).toLocaleDateString() : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Admission Date:</strong> {new Date(student.admissionDate).toLocaleDateString()}
                </Typography>
                {student.currentClass && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Current Class:</strong> {student.currentClass.name}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {student.emergencyContact && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Emergency Contact
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Name:</strong> {student.emergencyContact.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Relationship:</strong> {student.emergencyContact.relationship}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Phone:</strong> {student.emergencyContact.phone}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Details Tabs */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ px: 3, pt: 2 }}>
                <Tab icon={<PersonIcon />} label="Overview" />
                <Tab icon={<GradeIcon />} label="Grades" />
                <Tab icon={<AssignmentIcon />} label="Attendance" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          Contact Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: {student.user.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {student.user.phone || 'N/A'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          Academic Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Student ID: {student.studentId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Class: {student.currentClass?.name || 'Not Assigned'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Recent Grades
                  </Typography>
                  {grades.length > 0 ? (
                    <List>
                      {grades.slice(0, 5).map((grade, index) => (
                        <ListItem key={index} divider={index < grades.slice(0, 5).length - 1}>
                          <ListItemText
                            primary={grade.subject.name}
                            secondary={`Grade: ${grade.letterGrade} (${grade.percentage.toFixed(1)}%) - ${grade.term}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">No grades available</Typography>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Recent Attendance
                  </Typography>
                  {attendance.length > 0 ? (
                    <List>
                      {attendance.slice(0, 5).map((record, index) => (
                        <ListItem key={index} divider={index < attendance.slice(0, 5).length - 1}>
                          <ListItemText
                            primary={new Date(record.date).toLocaleDateString()}
                            secondary={`${record.subject?.name || 'General'} - ${record.status}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">No attendance records available</Typography>
                  )}
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDetails;