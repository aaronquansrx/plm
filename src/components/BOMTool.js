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


const testHeaders = [{Header: 'MPN', accessor: 'MPN'}, 
{Header: 'Future Electronics', accessor: 'futureelectronics'}, 
{Header: 'Digikey', accessor: 'digikey'}];

function BOMTool(props){
    //console.log(props.BOMData);
    const [partLookupData, setPartLookupData] = useState(Array(props.BOMData.bom.length).fill(null));
    const [bomdata, setBomdata] = useState(props.BOMData.bom);
    const [tableHeader, setTableHeader] = useState(props.BOMData.headers);
    //console.log(process.env.REACT_APP_SERVER_URL);
    useEffect(() => {
        //call api
        
        const server_url = process.env.REACT_APP_SERVER_URL;
        //const server_url = 'http://localhost:8080/PLMServer/'
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
                        if(apiresponse.status == "success"){
                            const offers = apiresponse.data;
                            if(offers.length > 0){
                                /*
                                offerOutput = (
                                <div>
                                <span>
                                    {'Quantity Available: '+offers[0].Quantity.Available}
                                </span>
                                {offers[0].Pricing.length > 0 &&
                                <span>
                                    {'Price: '+offers[0].Pricing[0].UnitPrice}
                                </span>
                                }
                                <span>
                                    {'Lead Time: '+offers[0].LeadTime}
                                </span>
                                </div>);*/
                                offerOutput = <SimpleOffer offers={offers}/>
                            }else{
                                offerOutput = (<div>No offers</div>);
                            }
                        }else if(apiresponse.status == "error"){
                            if(apiresponse.code == 400 || apiresponse.code == 500){
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
            }else if(api_name!==null){
                const offerOutput = (<div>API Timeout</div>);
                updateBOM(api_name, i, offerOutput);
            }
        }
        props.BOMData.bom.forEach((line, i) => {
            callApi(line.mpn, i, 0);
            /*
            axios({
                method: 'get',
                url: server_url+'api/part?part='+line['MPN']
            }).then(response => {
                console.log(response.data);
                for(const api of apis){
                    const apiresponse = response.data[api];
                    if(apiresponse.status == "success"){
                        const offers = apiresponse.data;
                        if(offers.length > 0){
                            const offerOutput = <div>
                            <span>
                                {'Quantity Available: '+offers[0].Quantity.Available}
                            </span>
                            {offers[0].Pricing.length > 0 &&
                            <span>
                                {'Price: '+offers[0].Pricing[0].UnitPrice}
                            </span>
                            }
                            <span>
                                {'Lead Time: '+offers[0].LeadTime}
                            </span>
                            </div>;
                            ubom = update(ubom, {
                                [i]: {$merge: {[api]: offerOutput} } 
                            });
                            setBomdata(ubom);
                        }
                    }else if(apiresponse.status == "error"){
                        if(apiresponse.code == 400){
                            //try again
                        }
                    }
                }
            */
            
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
            //});
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
    function BOMDataToArray(data, headers){
        return data.map((line) => {
            const out = headers.map((header) => {
                //line 
            });
        });
    }
    function handleEditBOM(){
        props.changeState(1);
    }
    function handleUploadBOM(){
        props.changeState(0);
    }
    return (
        <div>
            This is where BOMs are viewed
            <ReactTable data={bomdata} headers={tableHeader}/>
            {partLookupData.length > 0 && partLookupData[0]}
            <button onClick={handleEditBOM}>Edit BOM</button>
            <button onClick={handleUploadBOM}>Upload BOM</button>
        </div>
    );
}

export default BOMTool;