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

export function sortPrice(offers){
    offers.sort((a,b)=>a.prices.price-b.prices.price);
    return offers;
}

export function sortLeadTime(offers){
    offers.sort((a,b)=>a.leadtime-b.leadtime);
    return offers;
}

export function sortOrderPrice(offers, quantity){
    const offersToSort = offers.map((offer, i) => {
        return {offer: offer, i: i};
    });
    offersToSort.sort((a,b) => {
        const aOff = a.offer;
        const bOff = b.offer;
        if(quantity >= bOff.moq && quantity < aOff.moq){
            return 1;
        }else if(quantity >= aOff.moq && quantity < bOff.moq){
            return -1;
        }
        return aOff.prices.price-bOff.prices.price;
    });
    return offersToSort.map((ofs) => ofs.i);
}

export function sortOrderLeadTime(offers){
    const offersToSort = offers.map((offer, i) => {
        return {offer: offer, i: i};
    });
    offersToSort.sort((a,b) => {
        const aOff = a.offer;
        const bOff = b.offer;
        if(aOff.leadtime == null && bOff.leadtime == null){
            return aOff.prices.price-bOff.prices.price;
        }
        if(aOff.leadtime == null && bOff.leadtime != null){
            return 1;
        }
        if(aOff.leadtime != null && bOff.leadtime == null){
            return -1;
        }
        if(aOff.leadtime === bOff.leadtime){
            return aOff.prices.price-bOff.prices.price;
        }
        return aOff.leadtime-bOff.leadtime;
    });
    return offersToSort.map((ofs) => ofs.i);
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

export function findPartialComplete(best){
    const partialComplete = best.reduce((v, line) => {
        const mo = line.multioffers;
        if(mo.complete && mo.quantity_offered >= 0){
            return v+1;
        }
        return v;
    }, 0);
    return partialComplete;
}

export function findPriceBracket(pricing, qu, moq){
    if(pricing.length === 0) return {price: 0, index: null};
    const quantity = moq > qu ? moq : qu;
    let n = 0; //quantity bracket index
    while(n+1 < pricing.length && quantity >= pricing[n+1].BreakQuantity){
        n+=1;
    }
    const price = quantity < pricing[n].BreakQuantity ? pricing[0].UnitPrice : pricing[n].UnitPrice;
    return {price: price, index: n};
}