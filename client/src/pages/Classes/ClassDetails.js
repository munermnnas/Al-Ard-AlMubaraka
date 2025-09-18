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

const ClassDetails = () => {
  const { id } = useParams();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/classes"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Classes
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Class Details
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Class details for ID: {id}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Detailed class information, student lists, and schedules coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClassDetails;