import { Controller } from 'react-hook-form';
import { Box, Button, Input } from '@mui/joy';

type PlayerFormProps = {
  control: any;
  index: number;
  remove: (index: number) => void;
  isRemovable: boolean;
};

const PlayerForm = ({ control, index, remove, isRemovable }: PlayerFormProps) => (
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
      render={({ field }) => <Input type="number" {...field} placeholder="Buy In" required />}
    />
    <Controller
      name={`players.${index}.finalAmount`}
      control={control}
      render={({ field }) => <Input type="number" {...field} placeholder="Final Amount" required />}
    />
    {isRemovable && (
      <Button variant="outlined" color="danger" onClick={() => remove(index)}>
        Remove Player
      </Button>
    )}
  </Box>
);

export default PlayerForm;
