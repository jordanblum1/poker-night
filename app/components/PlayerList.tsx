import Grid from '@mui/material/Grid';
import PlayerForm from './PlayerForm';

type PlayerListProps = {
  fields: any[];
  control: any;
  remove: (index: number) => void;
};

const PlayerList = ({ fields, control, remove }: PlayerListProps) => (
  <Grid container spacing={6} justifyContent="center" style={{ width: '100%', margin: '0 auto' }}>
    {fields.map((field, index) => (
      <Grid item xs={12} sm={6} md={4} key={field.id}>
        <PlayerForm
          control={control}
          index={index}
          remove={remove}
          isRemovable={fields.length > 2}
        />
      </Grid>
    ))}
  </Grid>
);

export default PlayerList;
