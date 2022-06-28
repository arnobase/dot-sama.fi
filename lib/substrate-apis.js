import { ApiPromise, WsProvider } from "@polkadot/api";
import { options as acalaOptions } from "@acala-network/api";
import { options as parallelOptions } from '@parallel-finance/api';

const substrate_apis = [
    {name:"acala",endpoints:["wss://acala-polkadot.api.onfinality.io/public-ws"]},
    {name:"karura",endpoints:["wss://karura.api.onfinality.io/public-ws"]},
    {name:"parallel",endpoints:["wss://rpc.parallel.fi"]}
]
const getOptions = (network,provider) => {
    switch(network) {
    case 'acala':
        return acalaOptions({ provider });
    case 'karura':
        return acalaOptions({ provider });
    case 'parallel':
        return parallelOptions({ provider })
    }
    return undefined
}
let active_apis = []

export async function getSubstrateAPI(network,renew=false) {
    if (active_apis[network] != null && renew === false) {
        return active_apis[network]
    }
    const api_info = substrate_apis.find(element => network===element.name);
    const nodeUri = api_info.endpoints[0]
    try {
        const provider = new WsProvider(nodeUri)
        provider.on('error',(error)=>{
            console.error("PROVIDER error ("+network+")")
            console.error(error)
        })
        //process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
        let apiOptions = getOptions(network,provider);
        
        const api = await ApiPromise.create(apiOptions)
        active_apis[network] = api;
        api.on('error',(error)=>{
            console.error("API error ("+network+")")
            console.error(error)
        })
        return api
    } catch (error) {
        console.error("WsProvider Error ("+network+")")
        console.error(error);
       // setTimeout(() => {active_apis[network] = getSubstrateAPI(network,true)}, 5000);
    }
}

export async function getParentApiAt(api) {

}