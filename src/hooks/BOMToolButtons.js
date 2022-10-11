import { useEffect, useState } from "react";
import { useServerUrl } from "./Urls";

import axios from "axios";


export function useSaveBom(bom, apiData, apisList, mpnList, user, currency, store, bomId){
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
    function saveBom(name, include_data=true, overwrite=false){
        const nm = name === '' ? 'bom' : name;
        const bom = trimBom();
        //console.log(include_data);
        //console.log(bom);
        const mpnData = include_data ? getMpnData() : null;
        //console.log(mpnData);
        //console.log(bomId);
        console.log(mpnData);
        const bd = overwrite ? bomId : null;
        if(user){
            axios({
                method: 'POST',
                url: serverUrl+'api/saveBom',
                data: {bom: bom, mpn_data: mpnData, username: user, 
                    name: nm, currency: currency, store: store, bom_id: bd},
            }).then(response => {
                console.log(response.data);
            });
        }
        
    }
    return [showSaveModal, toggleSavedBomModal, saveBom];
}

export function useLoadBom(){
    const serverUrl = useServerUrl();
    const [savedBoms, setSavedBoms] = useState([]);
    //const [currentSavedBomIndex, setCurrentSavedBomIndex] = useState(null);
    const [selectedBom, setSelectedBom] = useState(null);
    //const findSelectedBom = currentSavedBomIndex ? savedBoms[currentSavedBomIndex] : null;
    useEffect(() =>{
        if(savedBoms.length > 0){
            console.log(savedBoms[0]);
            setSelectedBom(savedBoms[0]);
        }
    }, [savedBoms]);

    
    function changeSelectedBom(i){
        //console.log(i);
        //setCurrentSavedBomIndex(i);
        const selBom = i < savedBoms.length ? savedBoms[i] : null;
        //console.log(selBom);
        setSelectedBom(selBom);
    }
    function deleteSelectedBom(name){
        axios({
            method: 'GET',
            url: serverUrl+'api/deletebom',
            params: {username: name, bom_id: selectedBom.id},
        }).then(response => {
            console.log(response.data);
            setSavedBoms(response.data.boms);
        });
    }
    function loadSelectedBom(postLoad){
        //console.log(selectedBom);
        axios({
            method: 'GET',
            url: serverUrl+'api/loadbom',
            params: {bom_id: selectedBom.id, /*include_data: true*/},
        }).then(response => {
            console.log(response.data); //make sure this contains bom id to load
            //setSavedBoms(response.data.boms);
            postLoad(response.data);
        });
        
    }
    return [savedBoms, setSavedBoms, selectedBom, 
        changeSelectedBom, loadSelectedBom, deleteSelectedBom];
}
