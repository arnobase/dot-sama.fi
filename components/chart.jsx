import React, { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
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
    const refLimit = React.useRef(200)
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

        const handleResize = () => {
            console.log("resize")
            chart.current.applyOptions({ width: ref.current.clientWidth });
        }; 
        window.addEventListener('resize', handleResize);

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


    function load(tf=propTimeframe) {
        let t0=propToken0
        let t1=propToken1
        let pair = getPairByTokenName(t0,t1)
        let src = pair.sources[0]
        setTimeframe(tf);
        setSource(src);

        console.log("t0:t1",t0,t1)
        console.log("Load PAIR:",pair)
        
        if (pair.types.includes("subquery")) {
            getSubqueryPoolData(src,tf,pair,refLimit.current.value).then((dataSubquery)=>{
                setLastBlockSubquery(lastBlockData["subquery"][src])
                setPoolData(dataSubquery); 
                setDate(dataSubquery[dataSubquery.length-1].datetime)
                //console.log("DATA SUBQUERY",dataSubquery);
                //candleSeries.setData(pooldata);
                let graphDataSubquery = convertJsonDataToChartEntries(dataSubquery,"subquery",src,pair.rev)
                //console.log("candleSeries2",candleSeries)
                let lastData = graphDataSubquery[graphDataSubquery.length-1]
                console.log("LASTDATA",lastData)
                setGraphData(graphDataSubquery)
                //candleSeries.setData(graphDataSubquery);
                //("lastblock subquery acala",lastBlockData["subquery"]['acala'])
                console.log("GRAPHDATAS SUBQUERY",graphDataSubquery)
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
        getOnchainPoolData(src,tf,pair,last_block,null,200,10).then( (dataOnchain) => {
            setLastBlockOnchain(lastBlockData["onchain"][src])
            let graphDataOnchain = convertJsonDataToChartEntries(dataOnchain,"onchain",src,pair.rev)
            console.log("graphDataOnchain",graphDataOnchain,pair.rev)
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

    // Inversion des tokens dans la fonction loadPair, avant l'appel de load
    function loadPair(token0,token1){
        const pair = getPairByTokenName(token0,token1)
        console.log("loadPair pair:",pair)
        let t0name = pair.rev ? pair.token1name : pair.token0name
        let t1name = pair.rev ? pair.token0name : pair.token1name
        setToken0(t0name)
        setToken1(t1name)
        load(propTimeframe)
    }

    function PairName(props) {
        const pair = getPairByTokenName(props.t0,props.t1)
        const source = pair.sources[0]
        return(
            <span className="pair-name">
                <img src={"/img/logos/"+source+".png"} /><span>{pair.name}</span>
            </span>
        )
    }
   
    const handleChange = (event) => {
        setAge(event.target.value);
    };

    return (  
        <Box className="graph-wrapper">
            <Box ref={ref}>
                <Box sx={{pb:1}}>
                    <FormControl fullWidth>
                        <InputLabel id="pair-select-label">Age</InputLabel>
                        <Select
                            labelId="pair-select-label"
                            id="pair-select"
                            value={`${propToken0}/${propToken1}`}
                            label="Pair"
                            onChange={handleChange}
                        >
                            <MenuItem value="DOT/LCDOT">DOT/LCDOT</MenuItem>
                            <MenuItem value="LCDOT/DOT">LCDOT/DOT</MenuItem>
                            <MenuItem value="DOT/cDOT613">DOT/cDOT613</MenuItem>
                        </Select>
                    </FormControl>
                    <PairName t0={propToken0} t1={propToken1} />
                    <Box component="span" className="graph-options">
                        <Tooltip title="Reverse pair"><Button onClick={() => {loadPair(propToken1,propToken0)}}><CompareArrowsIcon /></Button></Tooltip>
                        {/*<input className="req-limit" ref={refLimit} type="text" defaultValue="200"></input>*/}
                        <Tooltip title="Day"><Button onClick={() => {load("Day")}}>D</Button></Tooltip>
                        <Tooltip title="Hour"><Button onClick={() => load("Hour")}>H</Button></Tooltip>
                        <Tooltip title="15 minutes"><Button onClick={() => load("15Mn")}>15m</Button></Tooltip>
                        <Tooltip title="1 minute"><Button onClick={() => load("1Mn")}>1m</Button></Tooltip>
                        <Tooltip title="Block"><Button onClick={() => load("Block")}>B</Button></Tooltip>
                        {/*<Button onClick={() => loadPair("DOT","cDOT613")}>Parallel</Button>*/}
                        <Tooltip title="LCDOT/DOT"><Button onClick={() => loadPair("LCDOT","DOT")}>LCDOT/DOT</Button></Tooltip>
                    </Box>
                    <Box style={{float:"right"}} className="graph-legend">
                        <BlockNumber type="onchain" blocknumber={lastblockOnchain}></BlockNumber>
                        <BlockNumber type="subquery" blocknumber={lastblockSubquery}></BlockNumber>
                    </Box>
                </Box>
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