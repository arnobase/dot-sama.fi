import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import { createChart, CrosshairMode } from "lightweight-charts";
import {getSubqueryPoolData,getOnchainPoolData,lastBlockData,convertJsonDataToChartEntries} from '../lib/get-pooldata'
import {getSubstrateAPI} from '../lib/substrate-apis'
import {getPairNameByTokenId, getPairByTokenName, getPairByTokenId} from '../lib/pairs'
import store from '../lib/store';

function Chart(props) {
    const {
		source,
        timeframe,
        token0,
        token1,
        dec,
	} = props;
    const ref = React.useRef();
    const refLimit = React.useRef()
    const [pooldata, setPoolData] = useState([]);
    const [candleSeries, setCandleSeries] = useState([]);
    const [datemaj,setDate] = useState(new Date().toTimeString())
    const [lastblockOnchainAcala,setLastBlockOnchainAcala] = useState(lastBlockData['onchain']['acala'])
    const [lastblockSubqueryAcala,setLastBlockSubqueryAcala] = useState(lastBlockData['subquery']['acala'])   


    useEffect(() => {
        const handleResize = () => {
            chart.applyOptions({ width: ref.current.clientWidth });
        }; 
         
        const chart = createChart(ref.current, { 
            width: ref.current.clientWidth, 
            height: 300,
            layout: {
                backgroundColor: '#000000',
                textColor: 'rgba(255, 255, 255, 0.9)',
            },
            grid: {
                vertLines: {
                    color: 'rgba(197, 203, 206, 0.5)',
                },
                horzLines: {
                    color: 'rgba(197, 203, 206, 0.5)',
                },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
                timeVisible: true,
                secondsVisible: true,
            },
        });
        let candleSeries = chart.addCandlestickSeries({
            priceFormat: {
                type: "price",
                minMove: Math.pow(10, -6),
                precision: 6
            }
        });
        //console.log("USE_EFFECT POOL DATA",pooldata)
        //candleSeries.setData(pooldata);
        setCandleSeries(candleSeries)
        //load("Block")
        return () => {
            // Nettoyage 
			window.removeEventListener('resize', handleResize);
			chart.remove();
        };

    }, []);



    function load(tf=timeframe) {
        
        getSubqueryPoolData(source,tf,token0,token1,dec,refLimit.current.value).then((dataSubquery)=>{
            setLastBlockSubqueryAcala(lastBlockData["subquery"]['acala'])
            setPoolData(dataSubquery); 
            setDate(dataSubquery[dataSubquery.length-1].datetime)
            console.log("DATA SUBQUERY",dataSubquery);
            //candleSeries.setData(pooldata);
            let graphDataSubquery = convertJsonDataToChartEntries(dataSubquery,"subquery",source)
            candleSeries.setData(graphDataSubquery);
            //("lastblock subquery acala",lastBlockData["subquery"]['acala'])
            console.log("GRAPHDATAS SUBQUERY",graphDataSubquery)
            //getOnchainPoolData("acala","Block","DOT","LCDOT",2,lastBlockData["subquery"]['acala'],null).then( () => {
            getOnchainPoolData("acala","Block","DOT","LCDOT",2,lastBlockData["subquery"]['acala']).then( (dataOnchain) => {
                setLastBlockOnchainAcala(lastBlockData["onchain"]['acala'])
                let graphDataOnchain = convertJsonDataToChartEntries(dataOnchain,"onchain","acala")
                //setPoolData(graphData); 
                //console.log("CANDLESERIE",candleSeries)
                console.log("GRAPHDATA ONCHAIN",graphDataOnchain)
                graphDataOnchain.forEach(entry => {candleSeries.update(entry)}); 
                
                //setInterval(function() {
                    
                    //console.log(lastBlocks)
                    //let last = lastBlocks.pop()
                    console.log("DATAS ONCHAIN",graphDataOnchain)
                    JSON.toString(graphDataOnchain)
                     
                    //
                //}, 10000);
            })
        }); 
    }  

    
    
    

    function PairName() {
        const pairName = getPairNameByTokenId(token0,token1)
        return(
            <span>{pairName}</span>
        )
    }
   
    return (
        <>
            <PairName/> - <span>{datemaj}</span><br />
            <BlockNumber type="onchain" blocknumber={lastblockOnchainAcala}></BlockNumber><br />
            <BlockNumber type="subquery" blocknumber={lastblockSubqueryAcala}></BlockNumber><br />
            <input ref={refLimit} type="text" defaultValue="200"></input>
            <button id="btDay" onClick={() => {load("Day")}}>Day</button>
            <button id="btHour" onClick={() => load("Hour")}>Hour</button>
            <button id="bt15mn" onClick={() => load("15Mn")}>15Mn</button>
            <button id="bt1Mn" onClick={() => load("1Mn")}>1Mn</button>
            <button id="btBlock" onClick={() => load("Block")}>Block</button>
            <div ref={ref} />
        </>
    );
}

function BlockNumber (props) {
    return(
        <>
            <Box component="span" sx={{ pr: 1, width: 80, display:"inline-block", textAlign:"right" }}>
                {props.type}
            </Box>
            <span>{props.blocknumber}</span>
        </>
    )
}

export default Chart;