import { createTheme } from '@mui/material/styles';

export const folioMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E3A8A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#14532D',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F6F1',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#18181B',
      secondary: '#52525B',
    },
    divider: '#E4E0D8',
    error: {
      main: '#DC2626',
    },
    warning: {
      main: '#78350F',
    },
    success: {
      main: '#14532D',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderColor: '#E4E0D8',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          whiteSpace: 'nowrap',
          minHeight: 48,
        },
      },
    },
  },
});
