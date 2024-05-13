
import { useState, useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { Box, Button, Input, Typography } from '@mui/joy';

type PlayerFormProps = {
  control: any;
  index: number;
  remove: (index: number) => void;
  isRemovable: boolean;
  updateLiveTotal: (index: number, total: number) => void;
  updateValidation: () => void;
};

const PlayerForm = ({ control, index, remove, isRemovable, updateLiveTotal, updateValidation }: PlayerFormProps) => {
  const [buyIn, setBuyIn] = useState<number | undefined>(undefined);
  const [finalAmount, setFinalAmount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const total = (finalAmount || 0) - (buyIn || 0);
    updateLiveTotal(index, total);
    updateValidation();
  }, [buyIn, finalAmount, index, updateLiveTotal, updateValidation]);

  const liveTotal = useMemo(() => (finalAmount || 0) - (buyIn || 0), [finalAmount, buyIn]);

  const formattedLiveTotal = useMemo(() => {
    const sign = liveTotal > 0 ? '+' : '';
    const color = liveTotal > 0 ? 'green' : liveTotal < 0 ? 'red' : 'black';
    return { value: `${sign}${liveTotal}`, color };
  }, [liveTotal]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 2,
        margin: 2,
        border: '1px solid #ddd',
        borderRadius: 15,
        backgroundColor: '#f9f9f9',
      }}
    >
      <Controller
        name={`players.${index}.name`}
        control={control}
        render={({ field }) => <Input {...field} placeholder="Player Name" required />}
      />
      <Controller
        name={`players.${index}.buyIn`}
        control={control}
        render={({ field }) => (
          <Input
            type="number"
            {...field}
            placeholder="Buy In"
            onChange={(e) => {
              field.onChange(e);
              setBuyIn(Number(e.target.value) || undefined);
              updateValidation();
            }}
          />
        )}
      />
      <Controller
        name={`players.${index}.finalAmount`}
        control={control}
        render={({ field }) => (
          <Input
            type="number"
            {...field}
            placeholder="Final Amount"
            onChange={(e) => {
              field.onChange(e);
              setFinalAmount(Number(e.target.value) || undefined);
              updateValidation();
            }}
          />
        )}
      />
      <Typography variant="plain" style={{ color: formattedLiveTotal.color }}>
        Live Total: {formattedLiveTotal.value}
      </Typography>
      {isRemovable && (
        <Button variant="outlined" color="danger" onClick={() => remove(index)}>
          Remove Player
        </Button>
      )}
    </Box>
  );
};

export default PlayerForm;
