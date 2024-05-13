import { useState } from 'react';
import Grid from '@mui/material/Grid';
import PlayerForm from './PlayerForm';

type PlayerListProps = {
  fields: any[];
  control: any;
  remove: (index: number) => void;
  updateValidation: (isValid: boolean, unaccounted: number) => void;
};

const PlayerList = ({ fields, control, remove, updateValidation }: PlayerListProps) => {
  const [liveTotals, setLiveTotals] = useState<number[]>(Array(fields.length).fill(0));

  const updateLiveTotal = (index: number, total: number) => {
    const newTotals = [...liveTotals];
    newTotals[index] = total;
    setLiveTotals(newTotals);

    const totalBuyIn = fields.reduce((acc, field) => acc + Number(field.buyIn || 0), 0);
    const totalFinalAmount = fields.reduce((acc, field, index) => acc + Number(field.finalAmount || 0), 0);
    const unaccountedAmount = totalBuyIn - totalFinalAmount;

    updateValidation(unaccountedAmount === 0, unaccountedAmount);
  };

  return (
    <Grid container spacing={6} justifyContent="center" style={{ width: '100%', margin: '0 auto' }}>
      {fields.map((field, index) => (
        <Grid item xs={12} sm={6} md={4} key={field.id}>
          <PlayerForm
            control={control}
            index={index}
            remove={remove}
            isRemovable={fields.length > 2}
            updateLiveTotal={updateLiveTotal}
            updateValidation={() => {
              const totalBuyIn = fields.reduce((acc, field) => acc + Number(field.buyIn || 0), 0);
              const totalFinalAmount = fields.reduce((acc, field, index) => acc + Number(field.finalAmount || 0), 0);
              const unaccountedAmount = totalBuyIn - totalFinalAmount;

              updateValidation(unaccountedAmount === 0, unaccountedAmount);
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default PlayerList;
