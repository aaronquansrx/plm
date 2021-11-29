import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import axios from 'axios';

import {JsonArrayDisplayTable, ReactTable} from './Tables'; 
/*
Main tool for working with BOMs
Functions: 
Part lookup
*/

function BOMTool(props){
    const [partLookupData, setPartLookupData] = useState(Array(props.BOMData.BOM.length).fill(null));
    const [bomdata, setBomdata] = useState(props.BOMData.BOM);
    const [tableHeader, setTableHeader] = useState([{Header: 'MPN', accessor: 'MPN'}, 
    {Header: 'Future Electronics', accessor: 'futureelectronics'}, 
    {Header: 'Digikey', accessor: 'digikey'}]);
    useEffect(() => {
        //call api
        
        
        var ubom = bomdata;
        const apis = ['futureelectronics', 'digikey'];
        props.BOMData.BOM.forEach((line, i) => {
            axios({
                method: 'get',
                url: 'https://localhost/plmserver/api/part?part='+line['MPN']
            }).then(response => {
                console.log(response.data);
                for(const api of apis){
                    const offers = response.data[api];
                    if(offers.length > 0){
                        ubom = update(ubom, {
                            [i]: {$merge: {[api]:'Quantity Available: '+offers[0].Quantity.Available} } 
                        });
                        setBomdata(ubom);
                    }
                }
                /*
                const future_offers = response.data.futureelectronics
                if(future_offers.length > 0){
                    ubom = update(ubom, {
                        [i]: {$merge: {'futureelectronics':future_offers[0].Quantity.Available} } 
                    });
                }
                const digikey_offers = response.data.digikey
                if(digikey_offers.length > 0){
                    console.log(digikey_offers[0].Quantity.Available);
                    ubom = update(ubom, {
                        [i]: {$merge: {'digikey':digikey_offers[0].Quantity.Available} } 
                    });
                }*/
                //setBomdata(ubom);
                //console.log(ubom);
            });
        });
        //Working Promise
        /*
        const partRequests = props.BOMData.BOM.map(line => {
            return axios({
                method: 'get',
                url: 'https://localhost/plmserver/api/part?part='+line['MPN']
            });
        });
        Promise.all(partRequests).then((results) => {
            var ubom = bomdata; 
            //console.log(results);
            for(var i=0;i<results.length;i++){
                const offers = results[i].data.futureelectronics.offers;
                if(offers.length > 0){
                    ubom = update(ubom, {
                        [i]: {$merge: {'URL':offers[0].part_id.web_url} } 
                    });
                    //console.log(offers[0].part_id.web_url);
                }
            }
            //console.log(ubom);
            setBomdata(ubom);
        });
        */
        
    }, [props.BOMData.BOM]);
    function BOMDataToArray(){

    }
    return (
        <div>
            This is where BOMs are viewed
            <ReactTable data={bomdata} headers={tableHeader}/>
            {/*<JsonArrayDisplayTable jsonArray={props.BOMData.BOM} 
            headings={props.BOMData.columnFields}/>*/}
            {partLookupData.length > 0 && partLookupData[0]}
        </div>
    );
}

export default BOMTool;