import React, { useEffect, useRef } from 'react';
import dynamic from "next/dynamic";


const Chart = dynamic(() => import("../components/chart"), {
  loading: () => <p>Loading ...</p>,
  ssr: false
});

export default function App(props) {
    
    return (
        <>
            <Chart {...props} source="acala" timeframe="15Mn" token0="DOT" token1="LCDOT" dec ="1" />
        </>
    );  
}