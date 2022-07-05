import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
      contrastText: "#fff",
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
  overrides: {
    MuiButton: {
      raisedPrimary: {
        color: 'white',
      },
    },
    MuiSelect: {
      '& .MuiMenuItem-root': {
        backgroundColor: 'black',
      },
    },
    MuiMenu: {
      list: {
          backgroundColor: "#cccccc",
      },
    },
    // Applied to the <li> elements
    MuiMenuItem: {
        root: {
            fontSize: 12,
        },
    },
  }
});

export default theme;
