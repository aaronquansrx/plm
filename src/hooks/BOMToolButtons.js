import { useState } from "react";
import { useServerUrl } from "./Urls";

import axios from "axios";


export function useSaveBom(bom, apiData, apisList, mpnList, user, currency, store){
    const serverUrl = useServerUrl();
    const [showSaveModal, setShowSaveModal] = useState(false);
    function toggleSavedBomModal(){
        setShowSaveModal(!showSaveModal);
    }
    function trimBom(){
        return bom.map(line => {
            /*
            const offers = [];
            apiList.forEach((api) => {
                //console.log(line[api]);
                console.log(line[api]);
                line[api].offers.forEach((offer) => {
                    const savedOffer = {...offer};
                    offers.push();
                });
            });
            */
            return {
                mpn: line.mpns.current,
                quantity: line.quantities.multi,
                manufacturer: line.manufacturer,
                ipn: line.ipn,
                cpn: line.cpn,
                description: line.description,
                reference: line.reference,
                mpn_options: line.mpnOptions
            }
        });
    }
    function getMpnData(){
        const mpnData = mpnList.map((mpn) => {
            const data = apiData.get(mpn).data;
            return {mpn: mpn, data: data};
        }, []);
        return mpnData;
    }
    function saveBom(name, include_data=true){
        const nm = name === '' ? 'bom' : name;
        const bom = trimBom();
        console.log(include_data);
        //console.log(bom);
        const mpnData = include_data ? getMpnData() : null;
        //console.log(mpnData);
        if(user){
            axios({
                method: 'POST',
                url: serverUrl+'api/saveBom',
                data: {bom: bom, mpn_data: mpnData, username: user, name: nm, currency: currency, store: store},
            }).then(response => {
                console.log(response.data);
            });
        }
        
    }
    return [showSaveModal, toggleSavedBomModal, saveBom];
}