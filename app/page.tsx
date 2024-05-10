"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import MainLayout from './components/MainLayout';
import PlayerList from './components/PlayerList';
import ValidationMessage from './components/ValidationMessage';
import { Box, Button } from '@mui/joy';

type PlayerData = {
  name: string;
  buyIn: number;
  finalAmount: number;
};

export default function Home() {
  const { control, handleSubmit, watch } = useForm<{ players: PlayerData[] }>({
    defaultValues: {
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

  const onSubmit = (data: { players: PlayerData[] }) => {
    console.log(data.players);
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
        <PlayerList fields={fields} control={control} remove={remove} />
      </Box>
      <ValidationMessage isValid={validation.isValid} unaccounted={validation.unaccounted} />
      <Button type="button" onClick={handleAddPlayer}>
        Add Player
      </Button>
      <Button type="submit">End Game</Button>
    </MainLayout>
  );
}
