const store = {
    items: {},
    

    set(storeType,idElement,element) {
        this.items[storeType] = this.items[storeType] === undefined ? {} : this.items[storeType]
        let storeObj = this.items[storeType]
        storeObj[idElement]=element
    },

    remove(storeType,idElement) {
        let storeObj = this.items[storeType]
        delete storeObj[idElement]
    },

    get(storeType,idElement) {

    },

    getByField(storeType, fieldName, fieldValue) {
        let subStore = this.items[storeType]
        for (const [key, value] of Object.entries(subStore)) {
            //console.log(key, value);
            if (key === fieldName) return value
        }
        return undefined;
    },

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