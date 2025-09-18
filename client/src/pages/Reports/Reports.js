import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';

const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 4 }}>
        Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-hover">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <AssessmentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Student Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate comprehensive student reports
              </Typography>
              <Button variant="outlined" size="small">
                Generate
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-hover">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SchoolIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Class Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Class performance and attendance reports
              </Typography>
              <Button variant="outlined" size="small">
                Generate
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-hover">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <PeopleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Attendance Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Attendance summaries and patterns
              </Typography>
              <Button variant="outlined" size="small">
                Generate
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-hover">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <GradeIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Grade Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Academic performance analytics
              </Typography>
              <Button variant="outlined" size="small">
                Generate
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Advanced reporting features coming soon...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Detailed analytics, custom reports, and export functionality will be available here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;