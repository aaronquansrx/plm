import { useState } from "react";
import { useServerUrl } from "./Urls";

import axios from "axios";


export function useSaveBom(bom, user){
    const serverUrl = useServerUrl();
    const [showSaveModal, setShowSaveModal] = useState(false);
    function toggleSavedBomModal(){
        setShowSaveModal(!showSaveModal);
    }
    function trimBom(){
        return bom.map(line => {
            return {
                mpn: line.mpns.current,
                quantity: line.quantities.multi,
                mpn_options: line.mpnOptions
            }
        });
    }
    function saveBom(name){
        const bom = trimBom();
        if(user){
            axios({
                method: 'POST',
                url: serverUrl+'api/saveBom',
                data: {bom: bom, username: user, name: name},
            }).then(response => {
                console.log(response.data);
            });
        }
    }
    return [showSaveModal, toggleSavedBomModal, saveBom];
}