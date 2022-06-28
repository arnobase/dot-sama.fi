const pairs = [
    {name:"DOT/LCDOT",token0id:"DOT",token1id:"lc://13",rev:false,types:["subquery","onchain"],sources:["acala"],acalapool:[{TOKEN: "DOT"},{liquidcrowdloan:"13"}]},
    {name:"LCDOT/DOT",token0id:"DOT",token1id:"lc://13",rev:true,types:["subquery","onchain"],sources:["acala"],acalapool:[{TOKEN: "DOT"},{liquidcrowdloan:"13"}]},
    {name:"AUSD/LDOT",token0id:"AUSD",token1id:"LDOT",rev:false,types:["subquery","onchain"],sources:["acala"]},
    {name:"LDOT/AUSD",token0id:"AUSD",token1id:"LDOT",rev:true,types:["subquery","onchain"],sources:["acala"]},
    {name:"DOT/cDOT613",token0id:"101",token1id:"200060013",rev:false,types:["onchain"],sources:["parallel"]},
    {name:"cDOT613/DOT",token0id:"101",token1id:"200060013",rev:true,types:["onchain"],sources:["parallel"]},
]



export function getPairNameByTokenId(token0,token1) {
    const resultat = pairs.find( element => 
         ! element.rev 
            && (element.token0id === token0 && element.token1id === token1) 
        || element.rev 
            && (element.token1id === token0 && element.token0id === token1)
    );
    return resultat.name === undefined ? null : resultat.name;
}

export function getAllPairObjects() {
    return pairs
}

export function getPairByTokenName(token0,token1,type=undefined,source=undefined) {
    const pairName = token0+"/"+token1
    let resultat = null
    resultat = pairs.find( element => 
        pairName === element.name
            && ( (type!==undefined && element.types.includes(type))||(type===undefined) )
            && ( (source!==undefined && element.sources.includes(source))||(source===undefined) )
    )
   return resultat === undefined ? null : resultat;
}

export function getPairByTokenId(token0,token1,type=undefined,source=undefined) {
    let resultat = null
    resultat = pairs.find( element => 
        ! element.rev 
            && ( element.token0id === token0 && element.token1id === token1 )
            && ( (type!==undefined && element.types.includes(type))||(type===undefined) )
            && ( (source!==undefined && element.sources.includes(source))||(source===undefined) )
        || element.rev 
            && ( element.token1id === token0 && element.token0id === token1 )
            && ( (type!==undefined && element.types.includes(type))||(type===undefined) )
            && ( (source!==undefined && element.sources.includes(source))||(source===undefined) )
    )
   return resultat === undefined ? null : resultat;
}