"use client";

import { useState } from 'react';
import { Box, Button, Typography, Card, FormControl, FormLabel, Input, Stack, Alert } from '@mui/joy';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface PlayerFormData {
  name: string;
  buyInAmount: string;
  finalAmount: string;
  venmoHandle: string;
}

export default function JoinSession() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    buyInAmount: '',
    finalAmount: '',
    venmoHandle: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Venmo handle
    if (!formData.venmoHandle.startsWith('@')) {
      toast.error('Venmo handle must start with @');
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          buyInAmount: parseFloat(formData.buyInAmount),
          finalAmount: parseFloat(formData.finalAmount),
          venmoHandle: formData.venmoHandle,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join session');
      }

      toast.success('Successfully joined session!');
      // Could redirect to a "waiting for settlement" page
      router.push(`/join/${sessionId}/success`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join session');
    }
  };

  const handleChange = (field: keyof PlayerFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;
    
    // Auto-add @ for Venmo handle if not present
    if (field === 'venmoHandle' && value && !value.startsWith('@')) {
      value = `@${value}`;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography level="h1" mb={3}>Join Poker Session</Typography>
      
      <Card variant="outlined">
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <FormControl required>
              <FormLabel>Name</FormLabel>
              <Input
                value={formData.name}
                onChange={handleChange('name')}
                placeholder="Your name"
              />
            </FormControl>

            <FormControl required>
              <FormLabel>Buy-in Amount ($)</FormLabel>
              <Input
                type="number"
                value={formData.buyInAmount}
                onChange={handleChange('buyInAmount')}
                placeholder="100"
                slotProps={{
                  input: {
                    min: 0,
                    step: 0.01,
                  },
                }}
              />
            </FormControl>

            <FormControl required>
              <FormLabel>Final Amount ($)</FormLabel>
              <Input
                type="number"
                value={formData.finalAmount}
                onChange={handleChange('finalAmount')}
                placeholder="150"
                slotProps={{
                  input: {
                    min: 0,
                    step: 0.01,
                  },
                }}
              />
            </FormControl>

            <FormControl required>
              <FormLabel>Venmo Handle</FormLabel>
              <Input
                value={formData.venmoHandle}
                onChange={handleChange('venmoHandle')}
                placeholder="@your-venmo-handle"
              />
              <Typography level="body-sm" mt={0.5}>
                Must start with @ (will be added automatically)
              </Typography>
            </FormControl>

            <Button type="submit" size="lg">
              Submit
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
} 