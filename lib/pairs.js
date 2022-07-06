const pairs = [
    {token0name:"DOT",token1name:"LCDOT",token0id:"DOT",token1id:"lc://13",rev:false,types:["subquery","onchain"],sources:["acala"],acalapool:[{TOKEN: "DOT"},{liquidcrowdloan:"13"}]},
    {token0name:"AUSD",token1name:"LDOT",token0id:"AUSD",token1id:"LDOT",rev:false,types:["subquery","onchain"],sources:["acala"]},
    {token0name:"DOT",token1name:"cDOT613",token0id:"101",token1id:"200060013",rev:false,types:["onchain"],sources:["parallel"]},
]

export function getAllPairsWithRev() {
    let res = []
    pairs.forEach(element => {
        element.name=element.token0name+"/"+element.token1name
        res.push(element)
        let newelement = {...element}
        newelement.name=element.token1name+"/"+element.token0name
        newelement.rev=true
        newelement.token0name=element.token1name
        newelement.token1name=element.token0name
        res.push(newelement)
    });
    return res
}

export function getPairByTokenName(token0,token1,type=undefined,source=undefined) {
    let resultat = null
    let all_pairs = getAllPairsWithRev()
    resultat = all_pairs.find( element => 
        (token0 === element.token0name && token1 === element.token1name)
            && ( (type!==undefined && element.types.includes(type))||(type===undefined) )
            && ( (source!==undefined && element.sources.includes(source))||(source===undefined) )
    )
    
    if (resultat !== undefined) {
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
    return pair.token0name+"/"+pair.token1name;
}
export function getToken0id(pair) {
    return pair.token0id;
}
export function getToken1id(pair) {
    return pair.token1id;
}