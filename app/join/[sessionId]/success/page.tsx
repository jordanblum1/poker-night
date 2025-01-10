"use client";

import { Box, Button, Typography, Card, Stack } from '@mui/joy';
import { useRouter } from 'next/navigation';

export default function SubmissionSuccess() {
  const router = useRouter();

  const handleClose = () => {
    // This method is more reliable for closing tabs
    window.open('', '_self')?.close();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'success.softBg',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'success.main',
              fontSize: '2rem',
            }}
          >
            ✓
          </Box>
          
          <Typography level="h1">
            Information Submitted!
          </Typography>

          <Typography level="body-lg">
            Your information has been successfully recorded. The host will calculate settlements once all players have submitted their information.
          </Typography>

          <Typography level="body-md" sx={{ color: 'neutral.500' }}>
            You can close this tab and wait for the host to share the settlement details.
          </Typography>

          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{ mt: 2 }}
          >
            Close Tab
          </Button>
        </Stack>
      </Card>
    </Box>
  );
} 