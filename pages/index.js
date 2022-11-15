import React, { useEffect, useRef } from 'react';
import dynamic from "next/dynamic";
import { CircularProgress, Box } from '@mui/material';
import store from '../lib/store';
import Assets from '../components/assets';

const Chart = dynamic(() => import("../components/chart"), {
  loading: () => <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                    <CircularProgress />
                </Box>,
  ssr: false
});

export default function App(props) {
    
    return (
        <>
            <Assets />
            {/*<Chart {...props} source="acala" timeframe="15Mn" token0="lcDOT" token1="DOT" />*/}
        </>
    );
}