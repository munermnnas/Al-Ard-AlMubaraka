import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const TeacherDetails = () => {
  const { id } = useParams();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/teachers"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Teachers
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Teacher Details
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Teacher details for ID: {id}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Detailed teacher information and management features coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TeacherDetails;