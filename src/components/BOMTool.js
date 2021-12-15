import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import axios from 'axios';
import _ from 'lodash';

import {JsonArrayDisplayTable, BOMAPITable, BOMAPITableV2} from './Tables'; 
import {SimpleOffer} from './Offer';

import { RefreshIcon } from './Icons';

import './../css/temp.css';
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

const server_url = process.env.REACT_APP_SERVER_URL;

const apiAttrs = [
    {
        Header: 'Stock',
        accessor: 'available'
    },
    {
        Header: 'MOQ',
        accessor: 'moq'
    },
    {
        Header: 'Lead Time',
        accessor: 'leadtime'
    },{
        Header: 'Price',
        accessor: 'price'
    }
    //{
    //    accessor: 'price'
    //}
];

const numHeader = [{
    Header: 'N',
    accessor: 'n'
}];

function BOMTool(props){
    //console.log(props.BOMData);
    const [partLookupData, setPartLookupData] = useState(Array(props.BOMData.bom.length).fill(null));
    const [bomdata, setBomdata] = useState(props.BOMData.bom);
    const [bomAttrs, setBomAttrs] = useState(props.BOMData.bomAttrs.concat(numHeader));
    const [apiHeaders, setApiHeaders] = useState([]);

    const [apiHeaders2, setApiHeaders2] = useState([]);
    //console.log(process.env.REACT_APP_SERVER_URL);
    
    useEffect(() => {

        //call api
        /*const apis = ['futureelectronics', 'digikey'];
        const apiOffers = Array(props.BOMData.bom.length).fill(
            apis.reduce(function(map, api) {
            map[api] = null;
            return map;
        }, {}));*/

        callApis();

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
    useEffect(() => {
        /*
        setApiHeaders(props.BOMData.apis.map((api) => {
            const newAttrs = apiAttrs.map((attr) => {
                //const accessor = attr.accessor+'_'+api.accessor;
                return {
                    Header: attr.Header,
                    accessor: attr.accessor+'_'+api.accessor,
                    Cell: r => {
                        //console.log(r);
                        const apiAccessor = r.row.original[api.accessor];
                        if(apiAccessor){
                            const data = apiAccessor[attr.accessor];
                            if(data){
                                return (
                                <div className='Ver'>
                                    {data.map((val) => 
                                    <span>{val}</span>
                                    )}
                                </div>
                                );
                            }
                        }
                        return <>No Offer</>;
                    }
                }
            });
            return {
                Header: api.Header,
                columns: newAttrs,
                accessor: api.accessor,
                //id: api.accessor,
                PriceRender: props => {
                    //console.log(props);
                    return 'prices';
                }
            }
        }));
        */

        const newHeaders = props.BOMData.apis.map((api) => {
            return {
                Header: api.Header,
                accessor: api.accessor,
                Cell: props => {
                    //console.log(props);
                    return api.Header;
                }
            }
        });

        setApiHeaders2(newHeaders);

    }, [props.BOMData.apis])

    function callApis(){
        function updateBOM(api, i, info){
            ubom = update(ubom, {
                [i]: {$merge: {[api]: info} } 
            });
            setBomdata(ubom);
        }
        function updateBOMOffers(i, info){
            ubom = update(ubom, {
                [i]: {$merge: info}
            });
            setBomdata(ubom);
        }
        let ubom = bomdata;
        function callApi(line, i, n, api_name=null){
            const mpn = line.mpn;
            if(n <= 2){
                const callUrl = api_name!==null 
                ? server_url+'api/part?part='+mpn+'&api='+api_name
                : server_url+'api/part?part='+mpn;
                axios({
                    method: 'get',
                    url: callUrl
                }).then(response => {
                    console.log(response.data);
                    const apisOutput = {
                        maxOffers: 0
                    }
                    let maxOffers = 0;
                    for(const [api, apiresponse] of Object.entries(response.data)){
                        let offerOutput = {};
                        if(apiresponse.status === "success"){
                            const offers = apiresponse.data;
                            if(offers.length > 0){
                                const trimmedOffers = []
                                for(const offer of offers){
                                    trimmedOffers.push({
                                        available: offer.Quantity.Available,
                                        moq: offer.Quantity.MinimumOrder,
                                        leadtime: offer.LeadTime,
                                        pricing: offer.Pricing,
                                        price: bestPrice(line, offer.Quantity.MinimumOrder, offer.Pricing)
                                    });
                                }
                                offerOutput = {
                                    offers: trimmedOffers
                                    //length: offers.length
                                }
                                maxOffers = Math.max(offers.length, maxOffers);
                                apisOutput[api] = offerOutput;
                            }
                        }else if(apiresponse.status === "error"){
                            if(apiresponse.code === 400 || apiresponse.code === 500 || 
                            apiresponse.code === 403){
                                setTimeout(callApi(line, i, n+1, api), 1000);
                            }
                        }
                        /*
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
                        */
                        //console.log(i);
                        //updateBOMOffers(api, i, offerOutput, maxOffers);
                    }
                    apisOutput['maxOffers'] = maxOffers;
                    updateBOMOffers(i, apisOutput);
                });
            }else if(api_name !== null){
                //const offerOutput = (<div>API calls exceeded</div>);
                //updateBOM(api_name, i, offerOutput);
            }
        }
        props.BOMData.bom.forEach((line, i) => {
            if('mpn' in line) callApi(line, i, 0);
        });
    }
    function bestPrice(line, moq, pricing){
        const quantity = 'quantity' in line ? line.quantity : moq;
        let n = 0; //quantity bracket index
        while(n+1 < pricing.length && quantity >= pricing[n+1].BreakQuantity){
            n+=1;
        }
        return quantity < pricing[n].BreakQuantity ? 'No Price' : pricing[n].UnitPrice;
    }
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
    function handleReload(){
        callApis();
    }
    return (
        <div>
            <RefreshIcon onClick={handleReload} size={35}/>
            {/*<BOMAPITable data={bomdata} bomAttrs={bomAttrs}
             apis={props.BOMData.apis} apiHeaders={apiHeaders} apiAttrs={apiAttrs}/>
            {/*partLookupData.length > 0 && partLookupData[0]*/}
            <div className='Scroll'>
            <BOMAPITableV2 data={bomdata} bomAttrs={bomAttrs} apis={apiHeaders2} apiSubHeadings={apiAttrs}/>
            </div>
        </div>
    );
}

export default BOMTool;