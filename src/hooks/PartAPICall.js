import { useEffect, useState, useMemo } from "react";

import axios from 'axios';
import update from 'immutability-helper';

import { useServerUrl } from '../hooks/Urls';
//import {useCallPart} from './../scripts/PartAPI';

export function useBOMCallAPIs(call, mpns, apis, savedApiData, updateApiData){
    const server_url = useServerUrl();
    //const apiList = apis.map(api=>api.accessor);
    const [bomCallState, setBomCallState] = useState({
        data: {},
        progress: mpns.reduce((obj, mpn) => {
            obj[mpn] = {apis: apis, called: false, timesCalled: 0};
            return obj;
        }, {}),
        //mpnsToUpdate: []
    });
    useEffect(() => {
        const controller = new AbortController();
        if(call){
            let bomCall = bomCallState;
            //const progress = 
            const dataMap = new Map();
            function addData(mpn, rawApiData){
                const errorApis = Object.entries(rawApiData).reduce((arr, [k,v]) => {
                    if(v.status == 'error'){
                        arr.push(k);
                    }   
                    return arr;
                }, []);
                const apiData = parseApisData(rawApiData);
                const partProg = {
                    apis: errorApis,
                    called: true,
                    timesCalled: bomCall.progress[mpn].timesCalled+1
                }
                bomCall = update(bomCall, {
                    data: {[mpn]: {$set: apiData}},
                    progress: {[mpn]: {$set: partProg}},
                });
                setBomCallState(bomCall);
                dataMap.set(mpn, {data: apiData, date: Date.now()});
                updateApiData(dataMap);
            }
            mpns.forEach((mpn) => {
                if(!savedApiData.has(mpn)){
                    singlePartApi(mpn, server_url, addData, controller);
                }
            });          
        }
        return () => {
            controller.abort();
        }
    }, [call, mpns]);

    return [bomCallState.progress];
}

export function useApiProgress(apiData, mpnList, tableData){
    const [progress, setProgress] = useState({
        allCalled: findAllCalled()
    });
    useEffect(() => {
        const allCalled = findAllCalled();
        const newProgress = {
            allCalled: allCalled
        }
        setProgress(newProgress);
    }, [apiData]);
    function findAllCalled(){
        return mpnList.reduce((b, mpn) => {
            if(!apiData.has(mpn)) return false
            return b;
        }, true);
    }
    return progress;
}

export function useApiMpnData(rawApiData, bomLines){
    const [apiMpnData, setApiMpnData] = useState({});

    useEffect(() => {
        const fullData = bomLines.reduce((obj, line) => {
            line.mpnOptions.forEach((mpn) => {
                obj[mpn] = parseApisData(line.quantities.single, rawApiData[mpn]);
            });
            return obj;
        }, {});
        return fullData;
    }, [rawApiData, bomLines]);

}

/*
export function useApiPartProgress(apiPartsProgress){
    const 
}
*/

/*
export function useSinglePartAPI(mpn){
    const [data, setData] = useState({});
    useEffect(() => {
        axios({
            method: 'get',
            url: server_url+'part',
            params: {part: mpn},
            signal: controller ? controller.signal : null
        }).then(response => {
            console.log(response.data);
            //setData();
            const pd = partData(response.data);
            setData(pd);
        });
    }, []);
    return data;
}*/

function singlePartApi(mpn, server_url, callback, controller){
    //const server_url = useServerUrl();
    axios({
        method: 'GET',
        url: server_url+'part',
        params: {part: mpn},
        signal: controller ? controller.signal : null
    }).then(response => {
        //console.log(response.data);
        const pd = partData(response.data);
        callback(mpn, pd);
    });
}

function singlePartApiCount(mpn, apis, server_url, callback, controller){

}

function partData(data){
    if(data.status == 'success'){
        return data.apis;
    }
    return null;
}

function parseApisData(rawData){
    let maxOffers = 0;
    //const output = {};
    if(!rawData) return {};
    const output = Object.entries(rawData).reduce((obj, [api, data]) => {
        if(data.status == 'success'){
            const offers = data.offers;
            const parsedOffers = offers.map((offer) => {
                //const {price: displayPrice, index: tableIndex} = bestPriceDisplay(quantity, offer.Quantity.MinimumOrder, offer.Pricing);
                return {
                    available: offer.Quantity.Available,
                    moq: offer.Quantity.MinimumOrder,
                    spq: offer.Quantity.OrderMulti,
                    leadtime: offer.LeadTime,
                    leadtimedays: offer.LeadTimeDays,
                    pricing: offer.Pricing,
                    //price: displayPrice,
                    /*
                    prices: {//displayPrice,
                        table: offer.Pricing,
                        price: displayPrice,
                        tableIndex: tableIndex
                    },
                    */
                    currency: offer.Currency
                }
            });
            //const sortedOffers = sortOffers(parsedOffers, quantity);
            const offerOutput = {
                offers: parsedOffers, //sortedOffers
                success: true,
                message: data.message
                //length: offers.length
            }
            maxOffers = Math.max(offers.length, maxOffers);
            obj[api] = offerOutput;
        }else{
            obj[api] = {
                offers: [],
                success: false,
                message: 'No Offers'
            }
        }
        obj.maxOffers = maxOffers;
        return obj;
    }, {});
    return output;
}