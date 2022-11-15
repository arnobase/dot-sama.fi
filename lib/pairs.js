const pairs = [
    // une pair "rev" a les propriétés token0name et token1name inversées
    // la propriété name est générée lors de l'appel à getAllPairsWithRev
    {
        token0name:"lcDOT",token1name:"DOT",
        dec:1,
        token0id:"DOT",token1id:"lc://13",
        rev:true,
        //types:["subquery","onchain"],
        types:["onchain"],
        source:"acala",
        acalapool:[{TOKEN: "DOT"},{liquidcrowdloan:"13"}]
    },
    {
        token0name:"lcDOT",token1name:"aUSD",
        dec:100,
        token0id:"AUSD",token1id:"lc://13",
        rev:true,
        //types:["subquery","onchain"],
        types:["onchain"],
        source:"acala",
        acalapool:[{TOKEN: "AUSD"},{liquidcrowdloan:"13"}]
    },
    {
        token0name:"LDOT",token1name:"aUSD",
        dec:100,
        token0id:"AUSD",token1id:"LDOT",
        rev:true,
        //types:["subquery","onchain"],
        types:["onchain"],
        source:"acala",
        acalapool:[{TOKEN: "AUSD"},{TOKEN:"LDOT"}]
    },
    {
        token0name:"cDOT613",token1name:"DOT",
        dec:1,
        token0id:"200060013",token1id:"101",
        rev:false,
        types:["onchain"],
        source:"parallel"
    },
]

export function getAllPairsWithRev(source=undefined) {
    let res = []
    pairs.forEach(element => {
        if (source === undefined || source === element.source) {
            element.name=element.token0name+"/"+element.token1name
            element.display=true
            res.push(element)
            let newelement = {...element}
            newelement.name=element.token1name+"/"+element.token0name
            newelement.display=false
            newelement.rev=!element.rev
            newelement.token0name=element.token1name
            newelement.token1name=element.token0name
            res.push(newelement);
        }
    });
    return res
}

export function getPairByTokenName(token0,token1,type=undefined,source=undefined) {
    let resultat = null
    let all_pairs = getAllPairsWithRev()
    resultat = all_pairs.find( element => 
        (token0.toUpperCase() === element.token0name.toUpperCase() && token1.toUpperCase() === element.token1name.toUpperCase())
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