import store from '../../lib/store';
import assert from 'assert';

export class PoolData {

    constructor(id) {
        this.id = id;
    }

    id;
    poolId;
    timestamp;
    range;
    date;
    blockNumber;
    token0Id;
    token1Id;
    token0Amount;
    token1Amount;
    rateToken0Token1;
    rateToken0Token1High;
    rateToken0Token1Low;
    rateToken0Token1Open;
    rateToken0Token1Close;
    rateToken1Token0;
    rateToken1Token0High;
    rateToken1Token0Low;
    rateToken1Token0Open;
    rateToken1Token0Close;
    volumeToken0;
    volumeToken1;
    volumeUSD;
    txCount;
    tvlUSD;

    async save(){
        let id = this.id;
        assert(id !== null, "Cannot save PoolData entity without an ID");
        store.set('PoolData', id.toString(), this);
    }
    static async remove(id){
        assert(id !== null, "Cannot remove PoolData entity without an ID");
        store.remove('PoolData', id.toString());
    }

    static async get(id){
        assert((id !== null && id !== undefined), "Cannot get PoolData entity without an ID");
        const record = store.get('PoolData', id.toString());
        if (record !== undefined){
            return PoolData.create(record);
        }else{
            return;
        }
    }
    static create(record) {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new PoolData(record.id);
        Object.assign(entity,record);
        return entity;
    }
/*
    static async getByPoolId(poolId: string): Promise<PoolData[] | undefined>{
      
      const records = await store.getByField('PoolData', 'poolId', poolId);
      return records.map(record => PoolData.create(record));
      
    }

    static async getByToken0Id(token0Id: string): Promise<PoolData[] | undefined>{
      
      const records = await store.getByField('PoolData', 'token0Id', token0Id);
      return records.map(record => PoolData.create(record));
      
    }

    static async getByToken1Id(token1Id: string): Promise<PoolData[] | undefined>{
      
      const records = await store.getByField('PoolData', 'token1Id', token1Id);
      return records.map(record => PoolData.create(record));
      
    }

*/


}
