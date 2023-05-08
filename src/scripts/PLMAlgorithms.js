import { best_price_finder_offer } from "./BOMAlgorithms";

export function bestPriceOffer(offerList, quantity=1){
    let p = null;
    offerList.map((offer) => {
        const bpf = best_price_finder_offer(offer, quantity);
        //console.log(bpf);
        if(p === null){
            p = bpf;
        }else if(bpf.total_price < p.total_price){
            p = bpf;
        }
    });
    return p;
}
