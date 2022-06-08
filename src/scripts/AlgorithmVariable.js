
export function stockString(inStock){
    return inStock ? 'stock' : 'noStock';
}

export const nullOfferStructure = {
    available: null,
    moq: null,
    leadtime: null,
    prices: {
        //stock: 
    }
};

function algorithmsInitialStructure(value=null){
    return {
        stock: {
            price: value,
            leadTime: value
        },
        noStock: {
            price: value,
            leadTime: value
        }
    }
}
function algorithmsStockStructure(value=null){
    return {
        stock: value,
        noStock: value
    }
}