import { makeRequest, toTimestamp, sortByKey } from './utils'
import { getSubstrateAPI } from './substrate-apis'
import { PoolBlockData } from '../types/models/PoolBlockData';

const sources = ["acala","karura"];
const ranges = ["Day","Hour","15Mn","1Mn","Block"];
export const lastBlockData = {"subquery":{"acala":0},"onchain":{"acala":0,"parallel":0}};
const fees={acala:0.003,karura:0.003}

export function convertJsonDataToChartEntries(jsondata,type,source,rev=false) {
    // TODO mettre dec dans la définition des pool
    let dec = 1
    let newJsonData = []
    jsondata.forEach(entry => {
        let newentry={}
        newentry.time = (entry.timestamp !== undefined) ? entry.timestamp : toTimestamp(entry.date);
        //newentry.datetime = new Date(entry.date*1000+7200000).toDateString();
        newentry.open = rev ? (entry.rateToken0Token1Open/dec) : (entry.rateToken1Token0Open/dec);
        newentry.high = rev ? (entry.rateToken0Token1High/dec) : (entry.rateToken1Token0High/dec);
        newentry.low = rev ? (entry.rateToken0Token1Low/dec) : (entry.rateToken1Token0Low/dec);
        newentry.close = rev ? (entry.rateToken0Token1Close/dec) : (entry.rateToken1Token0Close/dec);
        if (entry.blockNumber !== undefined) {
            newentry.block = entry.blockNumber
        }
        newJsonData.push(newentry)
        //("entry update",entry)
    });
    //(type+"lastBlock2",lastBlockData[type][source])
    console.log("convertJsonDataToChartEntries",newJsonData)
    return sortByKey(newJsonData,"time");
} 

async function subqueryRequest(source,range,pair,limit=100,offset=0) {
    let token0=pair.token0id;
    let token1=pair.token1id
    if (!sources.includes(source)) {throw "getPoolData: source invalide: "+source}
    if (!ranges.includes(range)) {throw "getPoolData: range invalide:"+range}
    var rangeName = 'pool' + range + 'Data';
    var block_query = range == "Block" ? " blockNumber" : "";
    var query = 'query=query{' + rangeName + '(filter:{token0Id:{equalTo:"' + token0 + '"} token1Id:{equalTo:"' + token1 + '"}} '+
    'first:'+limit+' offset:'+offset+' orderBy:DATE_DESC){nodes{ token0Id token1Id '+
    'rateToken0Token1 rateToken0Token1High rateToken0Token1Low rateToken0Token1Open rateToken0Token1Close '+
    'rateToken1Token0 rateToken1Token0High rateToken1Token0Low rateToken1Token0Open rateToken1Token0Close ' +
    'date'+block_query+'}}}';
    //console.log(query)
    var jsondata;
    var url = "https://api.subquery.network/sq/arnobase/"+source+"-pool-data";
    var data = await makeRequest('POST', url, query);

    jsondata = data.data[rangeName].nodes;
    var date = null;
    //console.log("JSONDATA",jsondata)
    return jsondata;
    //return convertJsonDataToChartEntries(jsondata,"subquery",source)
}

export async function getSubqueryPoolData(source,range,pair,limit=100,offset=0) {
    const limitGet = 100;
    let offsetGet = 0
    let length = limitGet;
    let full_data = []
    let data = []
    let full_counter = 0
    while (length == limitGet && full_counter < limit) {
        data = await subqueryRequest(source,range,pair,limitGet,offsetGet)
        //console.log("SUBQUERY DATA",data)
        offsetGet+=limitGet;
        length = data.length
        let prev = undefined;
        data.forEach(element => {
            if (full_counter <= limit) {
                full_data.push(element);
                //let pair = getPairByTokenId(token0,token1,"subquery",source)
                element.id = pair.name+"-"+toTimestamp(element.date);
                let pbd = PoolBlockData.create(element)
                pbd.save();
                ++full_counter;
                lastBlockData["subquery"][source] = (element.blockNumber !== undefined) ? Math.max(element.blockNumber,lastBlockData["subquery"][source]) : lastBlockData["subquery"][source];
                //console.log("SUBQUERY ELEMENT",element.blockNumber )
            }
            prev = element
        });

    }
    (full_counter+" entries imported from API")
    //return sortByKey(full_data,"time");

    return sortByKey(full_data,"time")
    //return convertJsonDataToChartEntries(sortByKey(full_data,"time"),"subquery",source)
}

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
 export async function getOnchainPoolData(pair,fromBlock=null,toBlock=null,nbBlock=30,step=0,papi=false) {
    console.log("PAIR-SOURCE",pair.source)
    let api = papi!=false ? papi : await getSubstrateAPI(pair.source);
    let current_header = await api.rpc.chain.getHeader() 
    let current_block_number = Number(current_header.number)
    console.log("CURRENT_BLOCK_NUYMBER",current_block_number)
    if (toBlock===null) { toBlock = current_block_number }
    else { if (fromBlock===null) throw "Can't specify toBlock without fromBlock" }

    if (fromBlock===null){fromBlock = (current_block_number - nbBlock)}
    else { if (toBlock < fromBlock) throw "fromBlock must be < toBlock" }
    if (fromBlock===0) {fromBlock=toBlock-nbBlock}
    nbBlock = toBlock-fromBlock

    console.log("FROMBLOCK",fromBlock)
    console.log("TOBLOCK",toBlock)
    console.log("NBBLOCK",nbBlock)
    console.log("PAPI",papi)

    //console.log("fromBlock",fromBlock)
    let fromBlockHash= await api.rpc.chain.getBlockHash(fromBlock);
    //console.log("fromBlockHash",fromBlockHash)
    let currentBlockHash = await api.rpc.chain.getBlockHash();
    let now1 = new Date().getTime()
    let data=[]
    let api_at = undefined;
  
    let blockNumberArray=Array.from({length:(toBlock - fromBlock)},(v,k)=>{
        return toBlock - k*step
    })
    //console.log("blockNumberArray",blockNumberArray)
    let arrayPromises = [];
    let nbBlockFetch = 0
    for (let current_block_number of blockNumberArray) {
        let promise = getOneBlockData(current_block_number,api,pair,data).then(()=>{
            ++nbBlockFetch;
            //console.log("ONCHAINFETCH",current_block_number)
        })
        arrayPromises.push(promise)
    };

    let allPromises = Promise.all(arrayPromises);
    await allPromises;
    let now2 = new Date().getTime()
    console.log("exécution en "+((now2-now1)/1000)+" secondes")

    //console.log("FULLDATA",data)
    return data;
}

async function getOneBlockData(current_block_number,api,pair,data) {
    console.log("getOneBlockData",current_block_number)
        let api_blockHashAtNumber = await api.rpc.chain.getBlockHash(current_block_number);
        let blockAtNumber = await api.rpc.chain.getBlock(api_blockHashAtNumber);
        let api_at = await api.at(blockAtNumber.createdAtHash);
        let block_timestamp = `${await api_at.query.timestamp.now()}`
        //let pair = getPairByTokenName(token0,token1,"onchain",source)
        let liquidity0;
        let liquidity1;
        let ratio_pair;
        let ratio_pair_rev;
        let is_find = false
        if (pair.source === "acala") {
            let pool = api_at.query.dex.liquidityPool(pair.acalapool) 
            let liquidity
            await pool.then((data)=>{liquidity=data});
            liquidity0 = liquidity[0].toString();
            liquidity1 = liquidity[1].toString();
            ratio_pair = liquidity0 / liquidity1;
            ratio_pair_rev = liquidity1 / liquidity0;
            is_find = true
        }
        if (pair.source === "parallel") {
            //console.log("PARALLEL",pair)
            const currency0 = pair.token0id //"101" //DOT
            const currency1 = pair.token1id //"200060013" //cDOT
            //console.log("query.amm",currency0,currency1)
            const res_rpc = await api_at.query.amm.pools(currency0,currency1)
            console.log("CURRENCIES",currency0,currency1)
            const liquidity = res_rpc.toJSON()
            console.log(liquidity)
            if (liquidity !== undefined && liquidity !== null) {
                liquidity0 = liquidity.quoteAmount;
                liquidity1 = liquidity.baseAmount;
                ratio_pair = liquidity0 / liquidity1;
                ratio_pair_rev = liquidity1 / liquidity0;
                is_find = true
            }
            
        }
        if (is_find) {
            let entry = new PoolBlockData(current_block_number)
            entry.id = pair.name+"-"+block_timestamp;
            entry.poolId = pair;
            entry.timestamp = block_timestamp/1000;
            entry.date = new Date(block_timestamp/1000);
            entry.blockNumber = current_block_number;
            entry.token0Id=pair.token0id;
            entry.token1Id=pair.token0id;
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
            lastBlockData["onchain"][pair.source] = Math.max(current_block_number,lastBlockData["onchain"][pair.source]);
        }
}