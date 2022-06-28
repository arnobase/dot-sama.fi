import { makeRequest, toTimestamp, sortByKey } from './utils'
import { getPairNameByTokenId, getPairByTokenName, getPairByTokenId } from './pairs'
import { getSubstrateAPI } from './substrate-apis'
import { PoolBlockData } from '../types/models/PoolBlockData';

const sources = ["acala","karura"];
const ranges = ["Day","Hour","15Mn","1Mn","Block"];
export const lastBlockData = {"subquery":{"acala":0},"onchain":{"acala":0}};

export function convertJsonDataToChartEntries(jsondata,type,source) {
    // TODO mettre dec dans la définition des pool
    let dec = 1
    let newJonData = []
    jsondata.forEach(entry => {
        let newentry={}
        newentry.time = (entry.timestamp !== undefined) ? entry.timestamp : toTimestamp(entry.date);
        //console.log("DATE",type,source,newentry.time,entry.date)
        //newentry.datetime = new Date(entry.date*1000+7200000).toDateString();
        newentry.open = entry.rateToken0Token1Open/dec;
        newentry.high = entry.rateToken0Token1High/dec;
        newentry.low = entry.rateToken0Token1Low/dec;
        newentry.close = entry.rateToken0Token1Close/dec;
        if (entry.blockNumber !== undefined) {
            newentry.block = entry.blockNumber
        }
        newJonData.push(newentry)
        //("entry update",entry)
    });
    //(type+"lastBlock2",lastBlockData[type][source])
    return sortByKey(newJonData,"time");
} 

export async function subqueryPoolData(source,range,token0,token1,dec,limit=100,offset=0) {
    if (!sources.includes(source)) {throw "getPoolData: source invalide: "+source}
    if (!ranges.includes(range)) {throw "getPoolData: range invalide:"+range}
    var rangeName = 'pool' + range + 'Data';
    var block_query = range == "Block" ? " blockNumber" : "";
    var query = 'query=query{' + rangeName + '(filter:{token0Id:{equalTo:"' + token0 + '"} token1Id:{equalTo:"' + token1 + '"}} first:'+limit+' offset:'+offset+' orderBy:DATE_DESC){nodes{token0Id token1Id  rateToken0Token1 rateToken0Token1High rateToken0Token1Low rateToken0Token1Open rateToken0Token1Close date'+block_query+'}}}';
    console.log(query)
    var jsondata;
    var url = "https://api.subquery.network/sq/arnobase/"+source+"-pool-data";
    var data = await makeRequest('POST', url, query);

    jsondata = data.data[rangeName].nodes;
    var date = null;
    console.log("JSONDATA",jsondata)
    return jsondata;
    //return convertJsonDataToChartEntries(jsondata,"subquery",source)
}

export async function getSubqueryPoolData(source,range,token0,token1,dec,limit=100,offset=0) {
    const limitGet = 100;
    let offsetGet = 0
    let length = limitGet;
    let full_data = []
    let data = []
    let full_counter = 0
    while (length == limitGet && full_counter < limit) {
        data = await subqueryPoolData(source,range,token0,token1,dec,limitGet,offsetGet)
        offsetGet+=limitGet;
        length = data.length
        data.forEach(element => {
            if (full_counter <= limit) {
                full_data.push(element);
                let pair = getPairByTokenId(token0,token1,"subquery",source)
                element.id = pair.name+"-"+toTimestamp(element.date);
                let pbd = PoolBlockData.create(element)
                pbd.save();
                ++full_counter;
                lastBlockData["subquery"][source] = (element.blockNumber !== undefined) ? Math.max(element.blockNumber,lastBlockData["subquery"][source]) : lastBlockData["subquery"][source];
            }
        });

    }
    (full_counter+" entries imported from API")
    //console.log("SUBQUERY FULL DATA",full_data)
    //return sortByKey(full_data,"time");

    return sortByKey(full_data,"time")
    //return convertJsonDataToChartEntries(sortByKey(full_data,"time"),"subquery",source)
}


/*export async function getOnchainPoolData(source,range,token0,token1,dec,limit=100,offset=0) {
}*/

/**
 * Returns the onchain data related to the pool tokens requested
 * return the last ["limit"] results, starting at the [current - ("offset" + "limit")] period (range) 
 * 
 * @param source {String} The source network, like "acala", or "parallel"
 * @param range {String} Range to group the data (Day,Hour,15Mn,1Mn,Block)
 * @param token0 {String} Token in the left part of the ratio returned
 * @param token1 {String} Token in the right part of the ratio returned
 * @param dec {Number} Number of dec to multiply the ratio results
 * @param fromBlock {Number} from block number (default current - 30) - override nbBlock
 * @param toBlock {Number} to block number (default current)
 * @param nbBlock {Number} nbBlock to get from the API, not used if fromBlock specified
 * @param api {ApiPromise} The Api to get the data, idf specified, override the "source" param
 */
export async function getOnchainPoolData(source,range,token0,token1,dec,fromBlock=null,toBlock=null,nbBlock=30,papi=false) {

    // Si l'API n'est pas passée en parametre, on se connecte à celle par défaut
    let api = papi!=false ? papi : await getSubstrateAPI(source);
    //let original_api = api;
    //console.log("------API",api.rpc.chain)
    let current_header = await api.rpc.chain.getHeader()
    
    let current_block_number = Number(current_header.number)
    //console.log("lastBlock01",lastBlockData["onchain"][source])

    // Maj au début seulement car on décrémente lastBlockData
    lastBlockData["onchain"][source] = Math.max(current_block_number,lastBlockData["onchain"][source]);
    //console.log("lastBlock02",lastBlockData["onchain"][source])
    if (toBlock===null) {
        toBlock = current_block_number
    }
    else {
        if (fromBlock===null) throw "Can't specify toBlock without fromBlock"
    }
    
    if (fromBlock===null){
        fromBlock = (current_block_number - nbBlock)
    }
    else {
        if (toBlock < fromBlock) throw "fromBlock must be < toBlock"
    }

    nbBlock = toBlock-fromBlock

    console.log("FROMBLOCK",fromBlock)
    console.log("TOBLOCK",toBlock)
    console.log("NBBLOCK",nbBlock)
    console.log("PAPI",papi)

    let fromBlockHash= await api.rpc.chain.getBlockHash(fromBlock);
    let currentBlockHash = await api.rpc.chain.getBlockHash();
    let pair;
    let pool;
    let block_timestamp;
    let liquidity;
    let liquidity0;
    let liquidity1;
    let ratio_pair;
    let ratio_pair_rev;
    let rounded_ratio;
    let rounded_ratio_rev;
    let api_at = undefined;
    let now1 = new Date().getTime()
    let data=[]

    while (fromBlockHash.toString() !== currentBlockHash.toString()) { // parcours de tous les blocks depuis toBlock jusqu'a remonter à fromBlock
        // La premiere fois, on récupère l'api de base, sinon on utilise api_at mis à jour dans la boucle
        api_at = api_at === undefined ? api : api_at
        block_timestamp = `${await api_at.query.timestamp.now()}`
   
        pair = getPairByTokenName(token0,token1,"onchain",source)

        pool = api_at.query.dex.liquidityPool(pair.acalapool) // Acala only pour le moment
        //liquidity = null;
        await pool.then((data)=>liquidity=data);

        liquidity0 = liquidity[0].toString();
        liquidity1 = liquidity[1].toString();
        ratio_pair = liquidity0 / liquidity1;
        ratio_pair_rev = liquidity1 / liquidity0;
        rounded_ratio = ratio_pair.toFixed(4);
        rounded_ratio_rev = ratio_pair_rev.toFixed(4);

		let entry = new PoolBlockData(current_block_number)
        entry.id = pair.name+"-"+block_timestamp;
        entry.poolId = pair;
        entry.timestamp = block_timestamp/1000;
        entry.date = new Date(block_timestamp/1000);
        //console.log(entry.date = new Date(Number(block_timestamp)))
        entry.blockNumber = current_block_number;
        entry.token0Id=token0;
        entry.token1Id=token1;
        entry.token0Amount=liquidity0;
        entry.token1Amount=liquidity1;
        entry.rateToken0Token1=ratio_pair;
        entry.rateToken0Token1High=ratio_pair;
        entry.rateToken0Token1Low=ratio_pair;
        entry.rateToken0Token1Open=ratio_pair;
        entry.rateToken0Token1Close=ratio_pair;
        entry.rateToken1Token0=ratio_pair_rev
        entry.rateToken1Token0High=ratio_pair_rev
        entry.rateToken1Token0Low=ratio_pair_rev
        entry.rateToken1Token0Open=ratio_pair_rev
        entry.rateToken1Token0Close=ratio_pair_rev
        await entry.save()
        data.push(entry)
        /*
        volumeToken0?: string;
        volumeToken1?: string;
        volumeUSD?: string;
        txCount?: bigint;
        tvlUSD?: string;
        */

        // rotation de currentBlockHash et de l'API pour passer au block précédent
        currentBlockHash = await api_at.query.system.parentHash()
        --current_block_number;
        api_at = await api.at(currentBlockHash);    
    }
    let now2 = new Date().getTime()
    console.log("exécution en "+((now2-now1)/1000)+" secondes")
    return data;
  
}
