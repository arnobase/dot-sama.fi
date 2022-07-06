const store = {
    items: {},
    

    /*
    add(...items) {
      this.items.push(...items);
    },
    get(index) {
      return this.items[index];
    }
    */

    //set('PoolBlockData', id.toString(), this)
    set(storeType,idElement,element) {
        this.items[storeType] = this.items[storeType] === undefined ? {} : this.items[storeType]
        let storeObj = this.items[storeType]
        storeObj[idElement]=element
    },
    //remove('PoolBlockData', id.toString())
    remove(storeType,idElement) {
        let storeObj = this.items[storeType]
        delete storeObj[idElement]
    },
    //get('PoolBlockData', id.toString())
    get(storeType,idElement) {

    },
    //getByField('PoolBlockData', 'token0Id', token0Id)
    getByField(storeType, fieldName, fieldValue) {
        let subStore = this.items[storeType]
        for (const [key, value] of Object.entries(subStore)) {
            //console.log(key, value);
            if (key === fieldName) return value
        }
        return undefined;
    },
    //getByField('PoolBlockData', 'token0Id', token0Id)
    getByIdInPair(storeType, id) {
        let subStore = this.items[storeType]
        for (const [key, value] of Object.entries(subStore)) {
            if (key === id) return value
        }
        return;
    },
    getByType(storeType) {
        return this.items[storeType] !== undefined ? Object.values(this.items[storeType]) : null
    }
  };

  export default store;