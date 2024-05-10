import { Typography, Box } from '@mui/joy';

type ValidationMessageProps = {
  isValid: boolean;
  unaccounted: number;
};

const ValidationMessage = ({ isValid, unaccounted }: ValidationMessageProps) => (
  <Box>
    {!isValid && (
      <>
        <Typography color="danger">Total Buy In and Final Amounts must be equal.</Typography>
        <Typography color="danger">${unaccounted} unaccounted for.</Typography>
      </>
    )}
  </Box>
);

export default ValidationMessage;
