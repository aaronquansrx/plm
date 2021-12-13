import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import axios from 'axios';

import {JsonArrayDisplayTable, ReactTable} from './Tables'; 
import {SimpleOffer} from './Offer';
/*
Main tool for working with BOMs
Functions: 
Part lookup
*/

/*
const testHeaders = [{Header: 'MPN', accessor: 'MPN'}, 
{Header: 'Future Electronics', accessor: 'futureelectronics'}, 
{Header: 'Digikey', accessor: 'digikey'}];
*/

function BOMTool(props){
    //console.log(props.BOMData);
    const [partLookupData, setPartLookupData] = useState(Array(props.BOMData.bom.length).fill(null));
    const [bomdata, setBomdata] = useState(props.BOMData.bom);
    const [tableHeader, setTableHeader] = useState(props.BOMData.headers);
    //console.log(process.env.REACT_APP_SERVER_URL);
    useEffect(() => {
        //call api
        
        const server_url = process.env.REACT_APP_SERVER_URL;
        //const server_url = 'http://localhost:8080/PLMServerTest/';
        let ubom = bomdata;
        const apis = ['futureelectronics', 'digikey'];
        const apiOffers = Array(props.BOMData.bom.length).fill(
            apis.reduce(function(map, api) {
            map[api] = null;
            return map;
        }, {}));
        function updateBOM(api, i, info){
            ubom = update(ubom, {
                [i]: {$merge: {[api]: info} } 
            });
            setBomdata(ubom);
        }
        function callApi(mpn, i, n, api_name=null){
            if(n <= 2){
                const callUrl = api_name!==null 
                ? server_url+'api/part?part='+mpn+'&api='+api_name
                : server_url+'api/part?part='+mpn;
                axios({
                    method: 'get',
                    url: callUrl
                }).then(response => {
                    console.log(response.data);
                    for(const [api, apiresponse] of Object.entries(response.data)){
                        //const apiresponse = response.data[api];
                        let offerOutput;
                        if(apiresponse.status === "success"){
                            const offers = apiresponse.data;
                            if(offers.length > 0){
                                offerOutput = <SimpleOffer offers={offers}/>
                            }else{
                                offerOutput = (<div>No offers</div>);
                            }
                        }else if(apiresponse.status === "error"){
                            if(apiresponse.code === 400 || apiresponse.code === 500 || 
                                apiresponse.code === 403){
                                //try again
                                offerOutput = (<div>Trying Again</div>);
                                console.log('retry api: '+api+' mpn: '+mpn);
                                setTimeout(callApi(mpn, i, n+1, api), 1000);
                            }else{
                                offerOutput = (<div>Server Unavailable</div>);
                            }
                        }
                        updateBOM(api, i, offerOutput);
                    }
                });
            }else if(api_name !== null){
                const offerOutput = (<div>API Timeout</div>);
                updateBOM(api_name, i, offerOutput);
            }
        }
        props.BOMData.bom.forEach((line, i) => {
            callApi(line.mpn, i, 0);
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
        
    }, [props.BOMData.bom]);
    /*
    function BOMDataToArray(data, headers){
        return data.map((line) => {
            const out = headers.map((header) => {
                //line 
            });
        });
    }*/
    function handleEditBOM(){
        props.changeState(1);
    }
    function handleUploadBOM(){
        props.changeState(0);
    }
    return (
        <div>
            This is where BOMs are viewed
            <button onClick={handleEditBOM}>Edit BOM</button>
            <button onClick={handleUploadBOM}>Upload BOM</button>
            <ReactTable data={bomdata} headers={tableHeader}/>
            {/*partLookupData.length > 0 && partLookupData[0]*/}
        </div>
    );
}

export default BOMTool;