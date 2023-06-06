import { best_price_finder_offer } from "./BOMAlgorithms";

export function bestPriceOffer(offerList, quantity=1, available=true){
    let p = null;
    offerList.map((offer) => {
        const bpf = best_price_finder_offer(offer, quantity, available);
        //console.log(bpf);
        if(p === null){
            p = bpf;
            //console.log(p);
        }else if(bpf.total_price < p.total_price){
            p = bpf;
        }
    });
    return p;
}
