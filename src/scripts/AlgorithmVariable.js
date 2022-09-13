
export function stockString(inStock){
    return inStock ? 'in_stock' : 'no_stock';
}

export const nullOfferStructure = {
    available: null,
    moq: null,
    leadtime: null,
    prices: {
        //stock: 
    }
};

export function algorithmsInitialStructure(value=null){
    return {
        in_stock: {
            price: value,
            leadtime: value
        },
        no_stock: {
            price: value,
            leadtime: value
        }
    }
}
export function algorithmsStockStructure(value=null){
    return {
        in_stock: value,
        no_stock: value
    }
}