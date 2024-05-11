import { ReactNode } from 'react';
import { CssVarsProvider, Box, Typography } from '@mui/joy';

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => (
  <CssVarsProvider>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        padding: 2,
      }}
    >
      <Typography level="h2">Poker Night</Typography>
      {children}
    </Box>
  </CssVarsProvider>
);

export default MainLayout;
