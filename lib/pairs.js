const pairs = [
    {token0name:"DOT",token1name:"LCDOT",token0id:"DOT",token1id:"lc://13",rev:false,types:["subquery","onchain"],sources:["acala"],acalapool:[{TOKEN: "DOT"},{liquidcrowdloan:"13"}]},
    {name:"AUSD/LDOT",token0name:"AUSD",token1name:"LDOT",token0id:"AUSD",token1id:"LDOT",rev:false,types:["subquery","onchain"],sources:["acala"]},
    {name:"LDOT/AUSD",token0name:"AUSD",token1name:"LDOT",token0id:"AUSD",token1id:"LDOT",rev:true,types:["subquery","onchain"],sources:["acala"]},
    {name:"DOT/cDOT613",token0name:"DOT",token1name:"cDOT613",token0id:"101",token1id:"200060013",rev:true,types:["onchain"],sources:["parallel"]},
    {name:"cDOT613/DOT",token0name:"DOT",token1name:"cDOT613",token0id:"101",token1id:"200060013",rev:false,types:["onchain"],sources:["parallel"]},
]

export function getPairByTokenName(token0,token1,type=undefined,source=undefined) {
    //console.log("PAIRNAME",pairName)
    console.log("getPairByTokenName",token0,token1)
    let resultat = null
    resultat = pairs.find( element => 
        (token0 === element.token0name && token1 === element.token1name || token0 === element.token1name && token1 === element.token0name)
            && ( (type!==undefined && element.types.includes(type))||(type===undefined) )
            && ( (source!==undefined && element.sources.includes(source))||(source===undefined) )
    )
    console.log("RESULTAT",resultat)
    if (resultat !== undefined) {
        resultat.rev = token0 !== resultat.token0name 
        resultat.name = getName(resultat)
        console.log("RESULTAT rev?",resultat)
        return resultat 
    }
    else { return null }
}

export function getPairByTokenId(token0,token1,type=undefined,source=undefined) {
    //console.log("PAIRNAME",pairName)
    let resultat = null
    resultat = pairs.find( element => 
        (token0 === element.token0id && token1 === element.token1id || token0 === element.token1id && token1 === element.token0id)
            && ( (type!==undefined && element.types.includes(type))||(type===undefined) )
            && ( (source!==undefined && element.sources.includes(source))||(source===undefined) )
    )
    //console.log("RESULTAT",resultat)
    if (resultat !== undefined) {
        resultat.rev = token0 !== resultat.token0id 
        resultat.name = getName(resultat)
        return resultat 
    }
    else { return null }
}

export function isOnchain(pair) {
    return pair.types.includes("onchain")
}
export function isSubquery(pair) {
    return pair.types.includes("subquery")
}
export function getName(pair) {
    return !pair.rev ? pair.token0name+"/"+pair.token1name : pair.token1name+"/"+pair.token0name;
}
export function getToken0id(pair) {
    return !pair.rev ? pair.token0id : pair.token1id;
}
export function getToken1id(pair) {
    return !pair.rev ? pair.token1id : pair.token0id;
}