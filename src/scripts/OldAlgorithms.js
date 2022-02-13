function effectivePrice(offer, quantity){
    const moq = offer.moq; const mpq = offer.spq; 
    const available = offer.available; const pricing = offer.pricing;
    //find quantities
    let pQuantity = moq > quantity ? [moq] : [quantity]; //must be > moq
    if(pQuantity[0] % mpq != 0){
        pQuantity[0] += (mpq - (pQuantity % mpq)); // above quantity
        pQuantity.push(pQuantity[0] - (pQuantity[0] % mpq)); // below quantity
    }
    if(pQuantity[0] > available){ // limit to available
        pQuantity[0] = available;
    }
    if(available === 0){
        return [];
    }
    /*
    let n = 0; //quantity bracket index
    while(n+1 < pricing.length && pQuantity >= pricing[n+1].BreakQuantity){
        n+=1;
    }
    const pricePer = pricing[n].UnitPrice;
    const total = pQuantity*pricePer;
    */
    const prices = [];
    pQuantity.forEach((q) => {
        let n = 0; //quantity bracket index
        while(n+1 < pricing.length && q >= pricing[n+1].BreakQuantity){
            n+=1;
        }
        const pricePer = pricing[n].UnitPrice;
        const total = q*pricePer;
        const effectivePrice = q < quantity ? total/q : total/quantity;
        prices.push({
            'total': total, 'effective': effectivePrice, 
            'per': pricePer, 'quantity': q, 
            'api': offer.api, 'offerNum': offer.offerNum
        });
    });
    return prices;
}

function bestApiPrice(){
    //console.log(bomdata);
    const bestPrices = bomdata.map((line) => {
        const best = bestPriceLine(line);
        const total = best.reduce((p, offer) => {
            return {'price': p.price+offer.total, 'quantity': p.quantity+offer.quantity};
        }, {'price': 0, 'quantity': 0});
        const data = {
            'mpn': line.mpn,
            'total_price': total.price,
            'quantity': total.quantity,
            'offers': best
        }
        return data;
    });
    setBestPriceData(bestPrices);
}
function bestPriceLine(line, excluded_apis=[]){
    const quantity = line.quantity ? line.quantity : 0;
    const apiOffers = apis.reduce((offerList,api) => {
        if(api.accessor in line){
            line[api.accessor].offers.forEach((offer, i) => {
                offer['api'] = api.accessor;
                offer['offerNum'] = i;
                offerList.push(offer);
            });
        }
        return offerList;
    }, []);
    function bestOfferPerQuantity(q, usedOffers=[]){
        const priceOffers = [];
        apiOffers.forEach((offer) => {
            const isNotUsed = usedOffers.reduce((bool, used) => {
                if(used.offerNum === offer.offerNum && used.api === offer.api){
                    return false;
                }
                return bool;
            }, true); // checks whether offer is same as used offers
            if(isNotUsed){
                const bp = effectivePrice(offer, q);
                bp.forEach((p) => {
                    priceOffers.push({'effective': p, 'offer': offer});
                });
            }
        });
        const offers = priceOffers;
        // groups all by quantity offering (potentially wrong)
        /*
        const offers = priceOffers.reduce((obj, off) => {
            const eff = off.effective;
            if(eff.quantity in obj){
                if(eff.effective < obj[eff.quantity].effective){
                    obj[eff.quantity] = eff;
                }
            }else{
                obj[eff.quantity] = eff;
            }
            return obj;
        }, {});
        */
        //const offs = Object.values(offers);
        const offs = priceOffers.map((off) => off.effective);
        offs.sort((a,b) => a.effective-b.effective);
        //console.log(offs);
        return offs;
    }
    //const offs = bestOfferPerQuantity(quantity);
    //console.log(offs);
    //let purchases = [];
    function algo(quantityRemaining, quantityUsed, offersUsed=[]){
        if(quantityRemaining <= 0){
            return [];
        }
        const offers = bestOfferPerQuantity(quantityRemaining, offersUsed);
        /*
        if(offersUsed.length > 0){
            console.log(offers);
            console.log(quantityRemaining);
        };*/
        if(offers.length > 0){
            const minEff = offers.reduce((e, o) => {
                const qRem = quantityRemaining - o.quantity;
                const qUsed = quantityUsed + o.quantity > quantity ? quantity : quantityUsed + o.quantity;
                const used = [...offersUsed];
                used.push({'api': o.api, 'offerNum': o.offerNum});
                //console.log(offersUsed);
                const usingO = [o].concat(algo(qRem, qUsed, used));
                const totalPrice = usingO.reduce((p, o) => {
                    return p+o.total;
                }, 0);
                //console.log(totalPrice);
                const eff = totalPrice/qUsed;
                if(eff < e.effective){
                    //console.log(usingO);
                    return {'effective': eff, 'offer': usingO};
                }
                return e;
            }, {'effective': Number.MAX_SAFE_INTEGER, 'offer': []});
            return minEff.offer;
        }
        return [];
    }
    const purchases = algo(quantity, 0);
    console.log(purchases);
    /*
    if(offs.length === 0){
        //no offers
    }else{
        if(offs[0].quantity >= quantity){
            purchases.push(offs[0]);
        }else{
            algo()
        }
    }
    */

    return purchases;
}