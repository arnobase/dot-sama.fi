import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { height } from '@mui/system';

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
  components: {
    MuiSelect: {
      styleOverrides: {
        root:{
          backgroundColor: 'transparent',
          color: '#bebebe',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        list: {
            backgroundColor: '#191b24',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
            backgroundColor: '#191b24',
            color: '#bebebe',
        },
      },
    },
    // Applied to the <li> elements
    MuiMenuItem: {
      styleOverrides: {
        root: {
            backgroundColor: '#191b24',
        },
      },
    },
    MuiOutlinedInput:  {
      styleOverrides: {
        root: {
          borderColor: 'transparent',
        },
        input: {
          borderColor: 'transparent',
          padding: '3px 0 2px 2px',
          height: 'inherit'
        }
      }
    }
    
  }
});

export default theme;
