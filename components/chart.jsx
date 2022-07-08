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
import {getPairByTokenName, getAllPairsWithRev} from '../lib/pairs'
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
    const [propPairName, setPairName] = useState("");
    const [propToken0, setToken0] = useState(token0);
    const [propToken1, setToken1] = useState(token1);
    const [candleSeries, setCandleSeries] = useState([]);
    const [datemaj,setDate] = useState(new Date().toTimeString())
    const [lastblockOnchain,setLastBlockOnchain] = useState(lastBlockData['onchain'][source])
    const [lastblockSubquery,setLastBlockSubquery] = useState(lastBlockData['subquery'][source])   
    let loaded=false;

    useEffect(() => {

        const handleResize = () => {

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
            if (propTimeframe !== "Block" || !param.time || param.point.x < 0 || param.point.x > width || param.point.y < 0 || param.point.y > height) {
                toolTip.style.display = 'none';
                return;
            }

            var id = token0+"/"+token1+"-"+param.time
            var tooltipBlockNumber = store.getByIdInPair("PoolBlockData",id).blockNumber
    
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
        


        //candleSeries.setData(pooldata);
        setCandleSeries(cs)

        if (!loaded) {

            //let all_pairs = getAllPairsWithRev();

            setPairName(token0+"/"+token1)
            load("Block");
            loaded=true;
        }

        return () => {
            // Nettoyage 
			window.removeEventListener('resize', handleResize);
			chart.current.remove();
        };

    }, []);

    /** 
     * useEffect qui déclenche la MAJ des data du graphique,
     * apellé quand graphData est mis à jour
    **/
    useEffect(() => {
        if (chart.current !== undefined && candleSeries !== undefined && graphData !== undefined && update === false) {
            //load("Block")
            candleSeries.setData(graphData);
        }
        if (chart.current !== undefined && candleSeries !== undefined && graphData !== undefined && update === true) {
            //load("Block")
            candleSeries.update(graphData);
            setUpdate(false)
        }
    }, [graphData,candleSeries]);


    function load(tf=propTimeframe,t0=propToken0,t1=propToken1) {
        let pair = getPairByTokenName(t0,t1)
        console.log("LAOD---",pair)
        let src = pair.source
        setTimeframe(tf);
        setSource(src);

        
        if (pair.types.includes("subquery")) {
            getSubqueryPoolData(src,tf,pair,refLimit.current.value).then((dataSubquery)=>{
                setLastBlockSubquery(lastBlockData["subquery"][src])
                setPoolData(dataSubquery); 
                setDate(dataSubquery[dataSubquery.length-1].datetime)

                //candleSeries.setData(pooldata);
                let graphDataSubquery = convertJsonDataToChartEntries(dataSubquery,"subquery",src,pair.rev)
    
                let lastData = graphDataSubquery[graphDataSubquery.length-1]
        
                setGraphData(graphDataSubquery)
                //candleSeries.setData(graphDataSubquery);
                //("lastblock subquery acala",lastBlockData["subquery"]['acala'])
                console.log("GRAPHDATAS SUBQUERY",graphDataSubquery)
                //getOnchainPoolData("acala","Block","DOT","LCDOT",2,lastBlockData["subquery"]['acala'],null).then( () => {
                if (pair.types.includes("onchain")) {
                    loadOnchain(tf,pair,false)
                }
            }); 
        } else if (pair.types.includes("onchain")) {
            console.log("ONCHAIN")
            loadOnchain(tf,pair,true)
        }
        
    }  

    function loadOnchain(tf=timeframe,pair,init=false) {
        let src=pair.source
        let arrayLastBlocks=[0]
        if (lastBlockData["subquery"][src] !== undefined) {arrayLastBlocks.push(lastBlockData["subquery"][src])}
        if (lastBlockData["onchain"][src] !== undefined) {arrayLastBlocks.push(lastBlockData["onchain"][src])}
        let last_block = Math.max(...arrayLastBlocks)
        console.log("LAST BLOCK "+pair.source,last_block)
        getOnchainPoolData(pair,last_block,null,200,10).then( (dataOnchain) => {
            console.log("DATAONCHAIN",dataOnchain)
            setLastBlockOnchain(lastBlockData["onchain"][src])
            let graphDataOnchain = convertJsonDataToChartEntries(dataOnchain,"onchain",src,pair.rev)
            console.log("graphDataOnchain",graphDataOnchain)
            if (init){
                setGraphData(graphDataOnchain)
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
        let t0name = pair.token0name
        let t1name = pair.token1name
        setToken0(t0name)
        setToken1(t1name)
        setPairName(pair.name)
        load(propTimeframe,pair.token0name,pair.token1name)
    }

    function PairName(props) {
        console.log("function PairName")
        const pair = getPairByTokenName(props.t0,props.t1)
        const source = pair.source
        return(
            <span className="pair-name">
                <img src={"/img/logos/"+source+".png"} width="15" height="15" /><span>{pair.name}</span>
            </span>
        )
    }
   
    const handleChange = (event) => {
        let split = event.target.value.split("/")
        let t0 = split[0]
        let t1 = split[1]
        setToken0(t0)
        setToken1(t1)
        loadPair(t0,t1);
    };

    function SelectPair() {
        let res=[];
        let all_pairs = getAllPairsWithRev();
        console.log("ALL PAIRS##############",all_pairs)
        all_pairs.forEach(pair => {
            let t0 = pair.token0name;
            let t1 = pair.token1name;
            let rev_class = pair.rev ? 'pair-rev' : ''
            res.push(<MenuItem key={`${pair.name}`} value={`${pair.name}`} className={rev_class}><PairName t0={`${t0}`} t1={`${t1}`} /></MenuItem>)
        });
        return(
            <Select
                className="pair-select"
                id="pair-select"
                value={propPairName}
                onChange={handleChange} >
                    {res}
            </Select>
        )
    }

    return (  
        <Box className="graph-wrapper">
            <Box ref={ref}>
                <Box sx={{pb:1}}>
                    
                    <SelectPair/>    
                    
                    <Box component="span" className="graph-options">
                        <Tooltip title="Reverse pair"><Button onClick={() => {loadPair(propToken1,propToken0)}}><CompareArrowsIcon /></Button></Tooltip>
                        {/*<input className="req-limit" ref={refLimit} type="text" defaultValue="200"></input>*/}
                        <Tooltip title="Day"><Button onClick={() => {load("Day")}}>D</Button></Tooltip>
                        <Tooltip title="Hour"><Button onClick={() => load("Hour")}>H</Button></Tooltip>
                        <Tooltip title="15 minutes"><Button onClick={() => load("15Mn")}>15m</Button></Tooltip>
                        <Tooltip title="1 minute"><Button onClick={() => load("1Mn")}>1m</Button></Tooltip>
                        <Tooltip title="Block"><Button onClick={() => load("Block")}>B</Button></Tooltip>
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