"use client";

import { Suspense } from 'react';
import { Box, Typography, Button } from '@mui/joy';
import { useSearchParams } from 'next/navigation';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
      <Typography level="h1" mb={3}>Error</Typography>
      <Typography mb={3}>{error || 'An error occurred'}</Typography>
      <Button
        onClick={() => window.location.href = '/'}
        variant="solid"
        color="primary"
      >
        Return Home
      </Button>
    </Box>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
} 