import React from 'react';

function getPrice(pricing, quantity, ignore=false){
    let n = 0;
    while(n+1 < pricing.length && quantity >= pricing[n+1].BreakQuantity){
        n+=1;
    }
    if(ignore) return pricing[n].UnitPrice;
    return quantity < pricing[n].BreakQuantity ? null : pricing[n].UnitPrice;
}

export function sortOffers(offers, quantity){
    let allNull = true;
    let offerPrices = offers.map((offer) => {
        const q = quantity ? quantity : offers.moq;
        const p = getPrice(offer.pricing, q);
        if(p) allNull = false;
        return {
            offer: offer,
            price: p
        }
    });
    if(allNull){
        offerPrices = offers.map((offer) => {
            const q = quantity ? quantity : offers.moq;
            const p = getPrice(offer.pricing, q, true);
            return {offer: offer, price: p};
        });
    }
    offerPrices.sort((a,b) => {
        if(a.price == null) return 1;
        if(b.price == null) return -1;
        return a.price-b.price;
    });
    return offerPrices.map((op) => op.offer);
}

export function simpleBestPrice(line, api_list=[]){
    //find the best price of line regardless of quantity
    const quantity = line.quantity ? 
    (line.quantity < line.moq ? line.moq : line.quantity) : 0;
    //const pricing = line.pricing;
    //if(quantity < line.moq) quantity = line.moq;
    const apiOffers = api_list.reduce((offerList,api) => {
        if(api in line){
            line[api].offers.forEach((offer, i) => {
                const price = getPrice(offer.pricing, quantity);
                offer['priceComp'] = price;
                offer['api'] = api;
                offer['offerNum'] = i;
                if(price) offerList.push(offer);
            });
        }
        return offerList;
    }, []);
    apiOffers.sort((a,b) => a.priceComp-b.priceComp);
    return apiOffers.length > 0 ? 
    {api: apiOffers[0].api, offerNum: apiOffers[0].offerNum} : null;
    
}

export function bestPriceDisplay(line, moq, pricing, overQuantity=null){
    const quantity = overQuantity ? overQuantity : 'quantity' in line ? line.quantity : moq;
    let n = 0; //quantity bracket index
    while(n+1 < pricing.length && quantity >= pricing[n+1].BreakQuantity){
        n+=1;
    }
    return quantity < pricing[n].BreakQuantity ? pricing[0].UnitPrice : pricing[n].UnitPrice;
}