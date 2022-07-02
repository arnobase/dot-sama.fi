import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Image from 'next/image'
import { createChart, CrosshairMode } from "lightweight-charts";
import {getSubqueryPoolData,getOnchainPoolData,lastBlockData,convertJsonDataToChartEntries, getOnchainPoolDataMultirequest} from '../lib/get-pooldata'
import {getSubstrateAPI} from '../lib/substrate-apis'
import {getPairByTokenName, getPairByTokenId} from '../lib/pairs'
import store from '../lib/store';

function Chart(props) {
    var {
		source,
        timeframe,
        token0,
        token1,
        dec,
	} = props;
    const chart = React.useRef();
    const ref = React.useRef();
    const refLimit = React.useRef()
    const [pooldata, setPoolData] = useState([]);
    const [graphData, setGraphData] = useState();
    const [update, setUpdate] = useState(false);
    const [propSource, setSource] = useState(source);
    const [propTimeframe, setTimeframe] = useState(timeframe);
    const [propToken0, setToken0] = useState(token0);
    const [propToken1, setToken1] = useState(token1);
    const [candleSeries, setCandleSeries] = useState([]);
    const [datemaj,setDate] = useState(new Date().toTimeString())
    const [lastblockOnchain,setLastBlockOnchain] = useState(lastBlockData['onchain'][source])
    const [lastblockSubquery,setLastBlockSubquery] = useState(lastBlockData['subquery'][source])   
    let loaded=false;

    useEffect(() => {
        const chartOptions = { 
            width: ref.current.clientWidth, 
            height: 300,
            layout: {
                backgroundColor: 'rgba(32,34,43,1)',
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
        };
        const handleResize = () => {
            console.log("resize")
            chart.current.applyOptions({ width: ref.current.clientWidth });
        }; 
        window.addEventListener('resize', handleResize);

        chart.current = createChart(ref.current, chartOptions);
        let cs = chart.current.addCandlestickSeries({
            priceFormat: {
                type: "price",
                minMove: Math.pow(10, -6),
                precision: 6
            }
        });
        
        var toolTipWidth = 100;
        var toolTipHeight = 50;
        var toolTipMargin = 15;
        var width = ref.current.clientWidth;
        var height = ref.current.clientHeight;
        var toolTip = document.createElement('div');
        toolTip.className = 'floating-tooltip';
        ref.current.appendChild(toolTip);

        // update tooltip
        chart.current.subscribeCrosshairMove(function(param) {
            console.log(propTimeframe)
            if (propTimeframe !== "Block" || !param.time || param.point.x < 0 || param.point.x > width || param.point.y < 0 || param.point.y > height) {
                toolTip.style.display = 'none';
                return;
            }
            console.log(store)
            var id = token0+"/"+token1+"-"+param.time
            var tooltipBlockNumber = store.getByIdInPair("PoolBlockData",id).blockNumber
            console.log("tooltipBlockNumber",tooltipBlockNumber)
            if (tooltipBlockNumber === undefined) {
                toolTip.style.display = 'none';
                return;
            }
            
            toolTip.style.display = 'block';
            toolTip.innerHTML = '<div>Block number</div>' +
                '<div class="block">' + tooltipBlockNumber + '</div>'

            var y = param.point.y;
            var left = param.point.x + toolTipMargin;
            if (left > width - toolTipWidth) {
                left = param.point.x - toolTipMargin - toolTipWidth;
            }
            var top = y + toolTipMargin + ref.current.offsetTop;
            if (top > height - toolTipHeight) {
                top = y + toolTipMargin + ref.current.offsetTop;
            }
            toolTip.style.left = left + 'px';
            toolTip.style.top = top + 'px';
        });
        

        //console.log("USE_EFFECT POOL DATA",pooldata)
        //candleSeries.setData(pooldata);
        setCandleSeries(cs)
        //console.log("candleSeries",candleSeries,cs)
        if (!loaded) {load("Block");loaded=true;}
        return () => {
            // Nettoyage 
			window.removeEventListener('resize', handleResize);
			chart.current.remove();
        };

    }, []);

    useEffect(() => {
        if (chart.current !== undefined && candleSeries !== undefined && graphData !== undefined && update === false) {
            //load("Block")
            console.log(candleSeries)
            candleSeries.setData(graphData);
        }
        if (chart.current !== undefined && candleSeries !== undefined && graphData !== undefined && update === true) {
            //load("Block")
            console.log(candleSeries)
            candleSeries.update(graphData);
            setUpdate(false)
        }
    }, [graphData,candleSeries]);


    function load(tf=propTimeframe,src=propSource,t0=propToken0,t1=propToken1) {
        console.log("LOAD\n\n\n##########")
        setTimeframe(tf);
        console.log("propTimeframe",propTimeframe)
        setSource(src);
        setToken0(t0);
        setToken1(t1);
        let pair = getPairByTokenName(t0,t1)
        //console.log("PAIR",pair)
        if (pair.types.includes("subquery")) {
            getSubqueryPoolData(src,tf,pair,refLimit.current.value).then((dataSubquery)=>{
                setLastBlockSubquery(lastBlockData["subquery"][src])
                setPoolData(dataSubquery); 
                setDate(dataSubquery[dataSubquery.length-1].datetime)
                //console.log("DATA SUBQUERY",dataSubquery);
                //candleSeries.setData(pooldata);
                let graphDataSubquery = convertJsonDataToChartEntries(dataSubquery,"subquery",src)
                //console.log("candleSeries2",candleSeries)
                let lastData = graphDataSubquery[graphDataSubquery.length-1]
                console.log("LASTDATA",lastData)
                setGraphData(graphDataSubquery)
                //candleSeries.setData(graphDataSubquery);
                //("lastblock subquery acala",lastBlockData["subquery"]['acala'])
                //console.log("GRAPHDATAS SUBQUERY",graphDataSubquery)
                //getOnchainPoolData("acala","Block","DOT","LCDOT",2,lastBlockData["subquery"]['acala'],null).then( () => {
                if (pair.types.includes("onchain")) {
                    loadOnchain(tf,src,pair,false)
                }
            }); 
        } else if (pair.types.includes("onchain")) {
            console.log("ONCHAIN")
            loadOnchain(tf,src,pair,true)
        }
        
    }  

    function loadOnchain(tf=timeframe,src=source,pair,init=false) {
        //let pair = getPairByTokenName(t0,t1)
        let arrayLastBlocks=[0]
        if (lastBlockData["subquery"][src] !== undefined) {arrayLastBlocks.push(lastBlockData["subquery"][src])}
        if (lastBlockData["onchain"][src] !== undefined) {arrayLastBlocks.push(lastBlockData["onchain"][src])}
        let last_block = Math.max(...arrayLastBlocks)
        getOnchainPoolData(src,tf,pair,last_block,null,500,50).then( (dataOnchain) => {
            setLastBlockOnchain(lastBlockData["onchain"][src])
            let graphDataOnchain = convertJsonDataToChartEntries(dataOnchain,"onchain",src)
            if (init){
                setGraphData(graphDataSubquery)
                //candleSeries.setData(graphDataOnchain);
            }
            else {
                let prevEntry;
                graphDataOnchain.forEach(entry => {
                    if (prevEntry !== undefined && prevEntry.close !== entry.close) {
                        setUpdate(true)
                        setGraphData(entry)
                        //candleSeries.update(entry)
                    }
                    prevEntry=entry;
                }); 
            }
            
            
            console.log("loadonchain")
            setInterval(function() {
                //loadOnchain(tf,cs)
            }, 6000);
            
        })
    }

    function loadPair(token0,token1){
        const pair = getPairByTokenName(token0,token1)
        console.log("PAIR",pair)
        load("Block",pair.sources[0],pair.token0name,pair.token1name)
    }

    function PairName() {
        const pair = getPairByTokenName(token0,token1)
        const source = pair.sources[0]
        return(
            <span className="pair-name">
                <img src={"/img/logos/"+source+".png"} /><span>{pair.name}</span>
            </span>
        )
    }
   
    return (  
        <Box className="graph-wrapper">
            <Box ref={ref}>
                <Box sx={{pb:1}}>
                    <PairName/>
                    <Box style={{float:"right"}} className="graph-legend">
                        <BlockNumber type="onchain" blocknumber={lastblockOnchain}></BlockNumber>
                        <BlockNumber type="subquery" blocknumber={lastblockSubquery}></BlockNumber>
                    </Box>
                </Box>
            </Box>
            
            <Box display="flex" justifyContent="flex-end" className="graph-options">
                <input className="req-limit" ref={refLimit} type="text" defaultValue="200"></input>
                <Button onClick={() => {load("Day")}}>D</Button>
                <Button onClick={() => load("Hour")}>H</Button>
                <Button onClick={() => load("15Mn")}>15m</Button>
                <Button onClick={() => load("1Mn")}>1m</Button>
                <Button onClick={() => load("Block")}>B</Button>
                <Button onClick={() => loadPair("DOT","cDOT613")}>Parallel</Button>
            </Box>
            
        </Box>
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