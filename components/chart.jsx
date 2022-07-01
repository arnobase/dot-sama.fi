import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import { createChart, CrosshairMode } from "lightweight-charts";
import {getSubqueryPoolData,getOnchainPoolData,lastBlockData,convertJsonDataToChartEntries, getOnchainPoolDataMultirequest} from '../lib/get-pooldata'
import {getSubstrateAPI} from '../lib/substrate-apis'
import {getPairByTokenName, getPairByTokenId} from '../lib/pairs'
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
    const [lastblockOnchain,setLastBlockOnchain] = useState(lastBlockData['onchain'][source])
    const [lastblockSubquery,setLastBlockSubquery] = useState(lastBlockData['subquery'][source])   
    let loaded=false;

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
        let cs = chart.addCandlestickSeries({
            priceFormat: {
                type: "price",
                minMove: Math.pow(10, -6),
                precision: 6
            }
        });
        
        /*
        var toolTipWidth = 100;
        var toolTipHeight = 80;
        var toolTipMargin = 15;
        var width = ref.current.clientWidth;
        var height = 300;
        var toolTip = document.createElement('div');
        toolTip.className = 'floating-tooltip-2';
        ref.current.appendChild(toolTip);

        // update tooltip
        chart.subscribeCrosshairMove(function(param) {
            if (!param.time || param.point.x < 0 || param.point.x > width || param.point.y < 0 || param.point.y > height) {
                toolTip.style.display = 'none';
                return;
            }

            toolTip.style.display = 'block';
            console.log("STORE",store)
            var tooltipBlockNumber = store.getByField("PoolBlockData","time",param.time)
            toolTip.innerHTML = '<div style="color: rgba(255, 70, 70, 1)">Apple Inc.</div>' +
                '<div style="font-size: 24px; margin: 4px 0px">' + tooltipBlockNumber + '</div>'

            var y = param.point.y;

            var left = param.point.x + toolTipMargin;
            if (left > width - toolTipWidth) {
                left = param.point.x - toolTipMargin - toolTipWidth;
            }

            var top = y + toolTipMargin;
            if (top > height - toolTipHeight) {
                top = y - toolTipHeight - toolTipMargin;
            }

            toolTip.style.left = left + 'px';
            toolTip.style.top = top + 'px';
        });
        */

        //console.log("USE_EFFECT POOL DATA",pooldata)
        //candleSeries.setData(pooldata);
        setCandleSeries(cs)
        //console.log("candleSeries",candleSeries,cs)
        //if (!loaded) {load("Block",cs);loaded=true;}
        return () => {
            // Nettoyage 
			window.removeEventListener('resize', handleResize);
			chart.remove();
        };

    }, []);

    function load(tf=timeframe,cs=candleSeries,src=source,t0=token0,t1=token1) {
        
        let pair = getPairByTokenName(t0,t1)
        //console.log("PAIR",pair)
        if (pair.types.includes("subquery")) {
            getSubqueryPoolData(source,tf,pair.token0id,pair.token1id,pair.dec,refLimit.current.value).then((dataSubquery)=>{
                setLastBlockSubquery(lastBlockData["subquery"][src])
                setPoolData(dataSubquery); 
                setDate(dataSubquery[dataSubquery.length-1].datetime)
                //console.log("DATA SUBQUERY",dataSubquery);
                //candleSeries.setData(pooldata);
                let graphDataSubquery = convertJsonDataToChartEntries(dataSubquery,"subquery",src)
                //console.log("candleSeries2",candleSeries)
                let lastData = graphDataSubquery[graphDataSubquery.length-1]
                console.log("LASTDATA",lastData)
                cs.setData(graphDataSubquery);
                //("lastblock subquery acala",lastBlockData["subquery"]['acala'])
                //console.log("GRAPHDATAS SUBQUERY",graphDataSubquery)
                //getOnchainPoolData("acala","Block","DOT","LCDOT",2,lastBlockData["subquery"]['acala'],null).then( () => {
                if (pair.types.includes("onchain")) {
                    loadOnchain(tf,cs)
                }
            }); 
        } else if (pair.types.includes("onchain")) {
            loadOnchain(tf,cs)
        }
        
    }  

    function loadOnchain(tf=timeframe,cs=candleSeries,src=source,t0=token0,t1=token1) {
        let pair = getPairByTokenName(t0,t1)
        let last_block = Math.max(lastBlockData["subquery"][src],lastBlockData["onchain"][src])
        getOnchainPoolData(source,tf,pair.token0name,pair.token1name,pair.dec,last_block).then( (dataOnchain) => {
            setLastBlockOnchain(lastBlockData["onchain"][src])
            let graphDataOnchain = convertJsonDataToChartEntries(dataOnchain,"onchain",src)
            //setPoolData(graphData); 
            //console.log("CANDLESERIE",candleSeries)
            //console.log("GRAPHDATA ONCHAIN",graphDataOnchain)
            let prevEntry;
            graphDataOnchain.forEach(entry => {
                if (prevEntry !== undefined && prevEntry.close !== entry.close) {
                    cs.update(entry)
                }
                prevEntry=entry;
            }); 
            
            console.log("loadonchain")
            setInterval(function() {
                //loadOnchain(tf,cs)
            }, 6000);
            
        })
    }

    function loadPair(token0,token1){
        const pair = getPairByTokenName(token0,token1)
        load("Block",candleSeries,pair.sources[0],pair.token0name,pair.token1name)
    }

    function PairName() {
        const pair = getPairByTokenName(token0,token1)
        return(
            <span>{pair.name}</span>
        )
    }
   
    return (
        <>
            <PairName/> - <span>{datemaj}</span><br />
            <BlockNumber type="onchain" blocknumber={lastblockOnchain}></BlockNumber><br />
            <BlockNumber type="subquery" blocknumber={lastblockSubquery}></BlockNumber><br />
            <input ref={refLimit} type="text" defaultValue="200"></input>
            <button id="btDay" onClick={() => {load("Day")}}>Day</button>
            <button id="btHour" onClick={() => load("Hour")}>Hour</button>
            <button id="bt15mn" onClick={() => load("15Mn")}>15Mn</button>
            <button id="bt1Mn" onClick={() => load("1Mn")}>1Mn</button>
            <button id="btBlock" onClick={() => load("Block")}>Block</button>
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