import React, { useEffect, useState } from "react";
import { CircularProgress, Input, Select, Tooltip, Button, Box, MenuItem } from "@mui/material";

import {getSubqueryPoolData,getOnchainPoolData,lastBlockData,convertJsonDataToChartEntries, getOnchainPoolDataMultirequest} from '../lib/get-pooldata'
import {getSubstrateAPI} from '../lib/substrate-apis'
import {getPairByTokenName, getAllPairsWithRev} from '../lib/pairs'
import store from '../lib/store';
import { convertTimestamp } from '../lib/utils'

function Assets(props) {
   
    const assetlist = React.useRef();
    let loaded=false;
    const all_pairs = getAllPairsWithRev(); 
    const [rateStore, setRateStore] = useState();
    let actualRateStore = undefined
    //console.log("all_pairs",all_pairs)

    useEffect(() => {
        subscribeAssets()
    }, []);

    function PairName(props) {
       // console.log("function PairName")
        const pair = getPairByTokenName(props.t0,props.t1)
        const source = pair.source
        return(
            <span className="pair-name">
                <img src={"/img/logos/"+source+".png"} width="15" height="15" /><span>{pair.name}</span>
            </span>
        )
    }
   
    
    async function subscribeAssets() {
        let acala_pools = getAllPairsWithRev("acala"); 
        let args = [];
        acala_pools.forEach(element => {args.push(element.acalapool)});
        let api = await getSubstrateAPI("acala");
                
        const unsub = await api.query.dex.liquidityPool.multi(args, (pools) => {
            console.log("POOOOOOLS",pools,acala_pools)
            
            let i=0;
            pools.forEach(pool => {
                let pair = acala_pools[i];
                i++;
                let liquidity = pool
                //pool.then((data)=>{liquidity=data});
                let liquidity0 = liquidity[0].toString();
                let liquidity1 = liquidity[1].toString();
                let ratio_pair = liquidity0 / (liquidity1*pair.dec);
                let ratio_pair_rev = (liquidity1*pair.dec) / liquidity0;
                let ratio = pair.rev ? ratio_pair : ratio_pair_rev;
                console.log("ratio "+pair.name,ratio)
                
                actualRateStore = typeof actualRateStore !== "undefined" ? actualRateStore : [] ;
                actualRateStore[pair.name]=ratio
                setRateStore(actualRateStore) 
                console.log("actualRateStore",actualRateStore)
                store.set('PoolLastRatio', pair.name, ratio);
            });
        }); 

        const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
            console.log(`Chain is at block: #${header.number}`);
        });

    }

    function AssetList() {
        let res=[];
        console.log("all_pairs",all_pairs)
        //console.log("ALL PAIRS##############",all_pairs)
        all_pairs.forEach(pair => {
            let t0 = pair.token0name;
            let t1 = pair.token1name;
            let display_class = pair.display ? '' : 'pair-hide'
            res.push(<li key={pair.name}><PairName t0={`${t0}`} t1={`${t1}`} />{Rate(pair.name)}</li>)
        });
        console.log(res)
        return(
            <ul>
                {res}
            </ul>
        )
    }

    function Rate(name) {
        console.log("rateStore",rateStore);
        let rate;
        if (typeof(rateStore) !== "undefined" && typeof(rateStore[name] !== "undefined")) {
            rate = rateStore[name]
        }
        else rate = "-";
        return(
            <>{rate}</>
        )
       
    }

    return (  
        <Box className="asset-wrapper" sx={{position:"relative"}}>
                <Box ref={assetlist} sx={{position:"relative"}}>
                <Box sx={{pb:1, position:"relative"}}>
                    <AssetList/>     
                </Box>
            </Box>
        </Box>
    );
}

export default Assets;