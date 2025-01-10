"use client";

import { Box, Button, Typography } from '@mui/joy';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

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
      <Image
        src="/pokernight.png"
        alt="Poker Night Logo"
        width={200}
        height={200}
        priority
      />
      
      <Typography level="h1">
        Poker Night
      </Typography>
      
      <Typography level="body-lg" textAlign="center">
        Create a poker session and let us handle the settlements through Venmo.
      </Typography>

      <Button 
        size="lg"
        onClick={() => router.push('/host/create')}
      >
        Create New Session
      </Button>
    </Box>
  );
}
