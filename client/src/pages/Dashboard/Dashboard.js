import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  People,
  School,
  Class,
  Grade,
  TrendingUp,
  TrendingDown,
  Refresh,
  Assignment,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBasedStats = () => {
    if (!dashboardData) return [];

    const stats = [
      {
        title: 'Total Students',
        value: dashboardData.overview.totalStudents,
        icon: <People />,
        color: '#1976d2',
        change: '+12%',
        trend: 'up',
      },
      {
        title: 'Total Teachers',
        value: dashboardData.overview.totalTeachers,
        icon: <School />,
        color: '#dc004e',
        change: '+5%',
        trend: 'up',
      },
      {
        title: 'Active Classes',
        value: dashboardData.overview.totalClasses,
        icon: <Class />,
        color: '#2e7d32',
        change: '+2%',
        trend: 'up',
      },
      {
        title: 'Total Subjects',
        value: dashboardData.overview.totalSubjects,
        icon: <Assignment />,
        color: '#ed6c02',
        change: '+8%',
        trend: 'up',
      },
    ];

    // Filter stats based on user role
    if (user?.role === 'teacher') {
      return stats.slice(0, 2); // Show only students and classes for teachers
    } else if (user?.role === 'parent') {
      return stats.slice(0, 1); // Show only students for parents
    }

    return stats;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            {getGreeting()}, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening at your school today
          </Typography>
        </Box>
        <IconButton onClick={fetchDashboardData} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getRoleBasedStats().map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card className="card-hover">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {stat.trend === 'up' ? (
                        <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                      ) : (
                        <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        color={stat.trend === 'up' ? 'success.main' : 'error.main'}
                      >
                        {stat.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Class Distribution Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Class Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData?.distributions.classes || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Grade Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Grade Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData?.distributions.grades || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(dashboardData?.distributions.grades || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Students */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Recent Students
              </Typography>
              <List>
                {(dashboardData?.recent.students || []).map((student, index) => (
                  <ListItem key={index} divider={index < dashboardData.recent.students.length - 1}>
                    <ListItemAvatar>
                      <Avatar>
                        {student.user.firstName[0]}{student.user.lastName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${student.user.firstName} ${student.user.lastName}`}
                      secondary={student.user.email}
                    />
                    <Chip
                      label="New"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Teachers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Recent Teachers
              </Typography>
              <List>
                {(dashboardData?.recent.teachers || []).map((teacher, index) => (
                  <ListItem key={index} divider={index < dashboardData.recent.teachers.length - 1}>
                    <ListItemAvatar>
                      <Avatar>
                        {teacher.user.firstName[0]}{teacher.user.lastName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${teacher.user.firstName} ${teacher.user.lastName}`}
                      secondary={teacher.user.email}
                    />
                    <Chip
                      label="New"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;