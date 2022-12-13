import { stockString } from "./AlgorithmVariable";
import {trimObject} from './General';

const all_apis = ['futureelectronics', 'digikey', 'mouser', 'element14', 'verical'];

export function offerEvaluation(offer, min_quantity){
    const is = best_price_finder_offer(offer, min_quantity, true);
    const ns = best_price_finder_offer(offer, min_quantity, false);
    function both_stock(i, n){
        return {in_stock:i, no_stock:n};
    }
    const out_obj = Object.entries(is).reduce((obj, [key, value]) => {
        obj[key] = {in_stock: value, no_stock: ns[key]}
        return obj;
    }, {});
    out_obj.prices = {
        price: both_stock(is.price_per, ns.price_per),
        pricing: offer.pricing,
        index: both_stock(is.index, ns.index),
        total_price: both_stock(is.total_price, ns.total_price)
    };
    return out_obj;
    /*{
        total_price: {in_stock: is.total_price, no_stock: ns.total_price},
        price_per: {in_stock: is.price_per, no_stock: ns.price_per},
        adjusted_quantity: {in_stock: is.adjusted_quantity, no_stock: ns.adjusted_quantity},
        prices: {
            price: {in_stock: is.price_per, no_stock: ns.price_per},
            pricing: offer.pricing,
            index: {in_stock: is.index, no_stock: ns.index},
            total_price: {in_stock: is.total_price, no_stock: ns.total_price}
        },
        display_total_price: 0,
        excess_quantity: {in_stock: is.excess_quantity, no_stock: ns.excess_quantity},
        excess_price: {in_stock: is.excess_price, no_stock: ns.excess_price},
    };  */
}

function best_price_finder_offer(offer, min_quantity, include_available=true){
    //console.log(offer);
    const ret = best_price_finder_full(offer.pricing, offer.moq, offer.spq, min_quantity, offer.available, offer.fees ? offer.fees.total : 0, include_available);
    return ret;
}

function best_price_finder_full(pricing, moq, spq, min_quantity, available, fee_total, include_available=true, excess_rule=null){
    //if(pricing.length === 0) return price_return(0, 0, 0, null);
    if(isNaN(spq) || spq <= 0){
        spq = 1;
    }
    let quantity = min_quantity;
    if(min_quantity % spq !== 0){
        quantity = quantity + (spq - (quantity % spq));
    }
    if(min_quantity < moq){
        quantity = moq;
    }
    if(include_available && quantity > available && 
    available < min_quantity){
        quantity = available;
        if(quantity % spq !== 0){
            quantity = quantity - (quantity % spq);
        }
    }
    else if(quantity % spq !== 0){
        quantity = quantity - (quantity % spq);
    };
    const bracket_index = get_pricing_bracket_index(pricing, quantity);
    let price_per = pricing[bracket_index].unit_price;
    let ret = price_return(price_per, quantity, min_quantity, bracket_index, fee_total);
    const quantity_post_rule = apply_excess_rule(quantity, excess_rule);
    console.log(quantity_post_rule);
    if(quantity !== pricing[bracket_index].break_quantity && bracket_index+1 < pricing.length){
        price_per = pricing[bracket_index+1].unit_price;
        quantity = pricing[bracket_index+1].break_quantity;
        const p2 = quantity*price_per;
        if(p2 < ret.total_price){
            price_per = pricing[bracket_index+1].unit_price;
            quantity = pricing[bracket_index+1].break_quantity;
            ret = price_return(price_per, quantity, min_quantity, bracket_index+1, fee_total);
        } 
    }
    return ret;
}

function get_pricing_bracket_index(pricing, quantity){
    let n = 0;
    while(n+1 < pricing.length && quantity >= pricing[n+1].break_quantity){
        n = n+1;
    }
    return n;
}

function price_return(price_per, quantity, min_quantity, bracket_index, fee_total){
    const price = price_per * quantity;
    const excess_quantity = quantity - min_quantity > 0 ? quantity - min_quantity : 0;
    const excess_price = price_per * excess_quantity;
    const total_price = price + fee_total;
    return {
        adjusted_quantity:quantity, 
        price_per:price_per,
        total_price: total_price,
        /*
        total_price: {
            prices: {
                part_price: price,
                fees: fee_total,
            },
            total: price + fee_total,
        },*/
        display_total_price: {
            prices: [{name: 'Part Price', value: price}, {name: 'Fees', value: fee_total}],
            total: total_price,
        },
        index:bracket_index,
        excess_quantity:excess_quantity,
        excess_price:excess_price
    };
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

export function findBestOffer(line, lead_time_cut_off=null, options=[]){
    const quantity = line.quantities.multi;
    const apis = line.activeApis.reduce((arr, actApi) => {
        if(actApi.active) arr.push(actApi.accessor);
        return arr;
    }, []);
    const bpa_no_stock = best_price_algorithm(line, quantity, apis, false, lead_time_cut_off, options);
    const lta_no_stock = best_leadtime_algorithm(line, quantity, apis, false, lead_time_cut_off, options);
    const bpa_in_stock = best_price_algorithm(line, quantity, apis, true, lead_time_cut_off, options);
    const lta_in_stock = best_leadtime_algorithm(line, quantity, apis, true, lead_time_cut_off, options);
    return {
        no_stock:{
            price:bpa_no_stock,
            leadtime:lta_no_stock
        },
        in_stock:{
            price:bpa_in_stock,
            leadtime:lta_in_stock
        }
    };
}

function best_price_algorithm(line, quantity, apis=all_apis, in_stock=false, lead_time_cut_off=null, options=[]){
    //const apis = all_apis;
    let min_offer = null;
    const stock_str = stockString(in_stock);
    apis.forEach((api) => {
        if(api in line){
            line[api].offers.forEach((offer, i) => {
                const fullOffer = {api: api, offer_num: i};
                Object.assign(fullOffer, offer);
                const adj_quantity = fullOffer.adjusted_quantity[stock_str];
                if(lead_time_cut_off === null || 
                (lead_time_cut_off !== null && fullOffer.leadtime < lead_time_cut_off)){
                    if(!(in_stock && adj_quantity < quantity)){
                        if(min_offer === null){
                            min_offer = fullOffer;
                        }else{
                            if(fullOffer.total_price[stock_str] === min_offer.total_price[stock_str] && fullOffer.leadtime < min_offer.leadtime){
                                min_offer = fullOffer;
                            }
                            else if(fullOffer.total_price[stock_str] <= min_offer.total_price[stock_str]){
                                min_offer = fullOffer;
                            }
                        }
                    }
                }
            });
        }
    });
    const elems = ['api', 'offer_num'];
    const out = trimObject(min_offer, elems);
    if(min_offer !== null){
        out.total_price = min_offer.total_price[stock_str];
        out.adjusted_quantity = min_offer.adjusted_quantity[stock_str];
        out.excess_quantity = min_offer.excess_quantity[stock_str];
        out.excess_price = min_offer.excess_price[stock_str];
    }
    return out;
}

function best_leadtime_algorithm(line, quantity, apis=all_apis, in_stock=false, lead_time_cut_off=null, options=[]){
    //const apis = all_apis;
    let min_offer = null;
    //const stock_str = stockString(in_stock);
    const stock_str = 'no_stock';
    apis.forEach((api) => {
        if(api in line){
            line[api].offers.forEach((offer, i) => {
                const fullOffer = {api: api, offer_num: i};
                Object.assign(fullOffer, offer);
                const adj_quantity = offer.adjusted_quantity[stock_str];
                if(fullOffer.leadtime !== null){
                    //if(!(in_stock && adj_quantity < quantity)){ 
                    if(min_offer === null){
                        min_offer = fullOffer;
                    }else if(fullOffer.leadtime === min_offer.leadtime){
                        if(fullOffer.total_price[stock_str] < min_offer.total_price[stock_str]){
                            min_offer = fullOffer;
                        }
                    }else if(fullOffer.leadtime < min_offer.leadtime){
                        min_offer = fullOffer;
                    }
                    //}
                }
            });
        }
    });
    const elems = ['api', 'offer_num'];
    const out = trimObject(min_offer, elems);
    if(min_offer !== null){
        out.total_price = min_offer.total_price[stock_str];
        out.adjusted_quantity = min_offer.adjusted_quantity[stock_str];
        out.excess_quantity = min_offer.excess_quantity[stock_str];
        out.excess_price = min_offer.excess_price[stock_str];
    }
    return out;
}


export function allSortApiOffers(offers, quantity){
    const bp_in_stock_order = [];
    const bp_no_stock_order = [];
    const lt_in_stock_order = [];
    const lt_no_stock_order = [];
    offers.forEach((offer, i) =>{
        let ind = 0;
        while(ind < bp_in_stock_order.length && compare_offer_best_price(offer, bp_in_stock_order[ind].offer, true, quantity)){
            ind = ind + 1;
        }
        bp_in_stock_order.splice(ind, 0, {offer:offer,index:i});

        ind = 0;
        while(ind < bp_no_stock_order.length && compare_offer_best_price(offer, bp_no_stock_order[ind].offer, false, quantity)){
            ind = ind + 1;
        }
        bp_no_stock_order.splice(ind, 0, {offer:offer,index:i});

        ind = 0;
        while(ind < lt_in_stock_order.length && compare_offer_lead_time(offer, lt_in_stock_order[ind].offer, true)){
            ind = ind + 1;
        }
        lt_in_stock_order.splice(ind, 0, {offer:offer,index:i});

        ind = 0;
        while(ind < lt_no_stock_order.length && compare_offer_lead_time(offer, lt_no_stock_order[ind].offer, false)){
            ind = ind + 1;
        }
        lt_no_stock_order.splice(ind, 0, {offer:offer,index:i});
    });
    const bp_iso = bp_in_stock_order.map((o) => o.index);
    const bp_nso = bp_no_stock_order.map((o) => o.index);
    const lt_iso = lt_in_stock_order.map((o) => o.index);
    const lt_nso = lt_no_stock_order.map((o) => o.index);
    return {
        no_stock: {
            price:bp_nso,
            leadtime:lt_nso
        },
        in_stock: {
            price:bp_iso,
            leadtime:lt_iso
        }
    }
}


function compare_offer_best_price(o1, o2, s, q, ltco=null){
    const stock_str = stockString(s);
    const o1_adj_quantity = o1.adjusted_quantity[stock_str];
    const o2_adj_quantity = o2.adjusted_quantity[stock_str];
    if(ltco !== null){
        if(o1.leadtime !== null && o1.leadtime < ltco) return true;
        else if(o2.leadtime !== null && o2.leadtime < ltco) return false;
    }
    if(s && (o1_adj_quantity < q || o2_adj_quantity < q)){
        //if(o1['quantity'] === o2['quantity'])
        return o1_adj_quantity < o2_adj_quantity;
    }
    if(o1.total_price[stock_str] === o2.total_price[stock_str]){
        return o1.leadtime > o2.leadtime;
    }
    return o1.total_price[stock_str] > o2.total_price[stock_str];
}

function compare_offer_lead_time(o1, o2, s){
    //const stock_str = stockString(s);
    const stock_str = 'no_stock';
    if(o1.leadtime === o2.leadtime){
        return o1.total_price[stock_str] > o2.total_price[stock_str];
    }
    return o1.leadtime > o2.leadtime;
}

function apply_excess_rule(quantity, excess_rule){
    if(excess_rule){
        return excess_rule.evaluate(quantity);
    }
    return quantity;
}