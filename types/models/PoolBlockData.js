import store from '../../lib/store';
import assert from 'assert';

export class PoolBlockData {

    constructor(id) {
        this.id = id;
    }

    id;
    poolId;
    timestamp;
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
        assert(id !== null, "Cannot save PoolBlockData entity without an ID");
        store.set('PoolBlockData', id.toString(), this);
    }
    static async remove(id){
        assert(id !== null, "Cannot remove PoolBlockData entity without an ID");
        store.remove('PoolBlockData', id.toString());
    }

    static async get(id){
        assert((id !== null && id !== undefined), "Cannot get PoolBlockData entity without an ID");
        const record = store.get('PoolBlockData', id.toString());
        if (record !== undefined){
            return PoolBlockData.create(record);
        }else{
            return;
        }
    }
    static create(record) {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new PoolBlockData(record.id);
        Object.assign(entity,record);
        return entity;
    }
/*
    static async getByPoolId(poolId: string): Promise<PoolBlockData[] | undefined>{
      
      const records = await store.getByField('PoolBlockData', 'poolId', poolId);
      return records.map(record => PoolBlockData.create(record));
      
    }

    static async getByToken0Id(token0Id: string): Promise<PoolBlockData[] | undefined>{
      
      const records = await store.getByField('PoolBlockData', 'token0Id', token0Id);
      return records.map(record => PoolBlockData.create(record));
      
    }

    static async getByToken1Id(token1Id: string): Promise<PoolBlockData[] | undefined>{
      
      const records = await store.getByField('PoolBlockData', 'token1Id', token1Id);
      return records.map(record => PoolBlockData.create(record));
      
    }

*/


}
