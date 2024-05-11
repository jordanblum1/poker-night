"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import MainLayout from './components/MainLayout';
import PlayerList from './components/PlayerList';
import ValidationMessage from './components/ValidationMessage';
import { Box, Button, Input } from '@mui/joy';

type PlayerData = {
  name: string;
  buyIn: number;
  finalAmount: number;
};

type FormData = {
  date: string;
  players: PlayerData[];
};

export default function Home() {
  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      players: [
        { name: '', buyIn: 0, finalAmount: 0 },
        { name: '', buyIn: 0, finalAmount: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'players',
  });

  const players = watch('players');
  const [validation, setValidation] = useState({ isValid: true, unaccounted: 0 });

  useEffect(() => {
    const totalBuyIn = players.reduce((total, player) => total + (player.buyIn || 0), 0);
    const totalFinalAmount = players.reduce((total, player) => total + (player.finalAmount || 0), 0);
    const unaccounted = totalBuyIn - totalFinalAmount;

    setValidation({ isValid: unaccounted === 0, unaccounted });
  }, [players]);

  const onSubmit = async (data: FormData) => {
    console.log(data);

    try {
      const response = await fetch('/api/update-google-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Sheet updated successfully', result);
    } catch (error) {
      console.error('Failed to update sheet', error);
    }
  };

  const handleAddPlayer = () => {
    append({ name: '', buyIn: 0, finalAmount: 0 });
  };

  return (
    <MainLayout>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          maxWidth: 800,
        }}
      >
        <Controller
          name="date"
          control={control}
          render={({ field }) => <Input {...field} type="date" required />}
        />
        <PlayerList fields={fields} control={control} remove={remove} />
        <ValidationMessage isValid={validation.isValid} unaccounted={validation.unaccounted} />
        <Button type="button" onClick={handleAddPlayer}>
          Add Player
        </Button>
        <Button type="submit">End Game</Button>
      </Box>
    </MainLayout>
  );
}
