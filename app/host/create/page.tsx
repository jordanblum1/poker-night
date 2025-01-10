"use client";

import { Box, Button, Typography, Card } from '@mui/joy';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateSession() {
  const router = useRouter();

  const handleCreateSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const session = await response.json();
      toast.success('Session created successfully!');
      router.push(`/host/${session.id}`);
    } catch (error) {
      toast.error('Failed to create session');
      console.error('Failed to create session:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: '100vh',
        padding: 2,
      }}
    >
      <Typography level="h1">Create New Session</Typography>

      <Card
        variant="outlined"
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 3,
        }}
      >
        <Typography level="body-lg" mb={2}>
          Create a new poker session and get a shareable link for your players.
          Players will be able to submit their:
        </Typography>
        <ul>
          <Typography component="li">Name</Typography>
          <Typography component="li">Buy-in amount</Typography>
          <Typography component="li">Final amount</Typography>
          <Typography component="li">Venmo handle</Typography>
        </ul>
        <Button 
          fullWidth
          onClick={handleCreateSession}
          sx={{ mt: 2 }}
        >
          Create Session
        </Button>
      </Card>
    </Box>
  );
} 