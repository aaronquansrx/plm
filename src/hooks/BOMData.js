import {useState, useEffect} from 'react';

import update from 'immutability-helper';
import axios from 'axios';

import {useServerUrl} from './../hooks/Urls';

export function useApiData(req, mpnList, apisList, updateApiDataMap){
    const serverUrl = useServerUrl();
    useEffect(() => {
        const controller = new AbortController();
        if(req > 0){
            const apiDataMap = new Map();
            function apiCallback(mpn, apiData, maxOffers){
                const now = Date.now();
                const data = {
                    apis: apiData,
                    maxOffers: maxOffers
                };

                apiDataMap.set(mpn, {data:data, date: now});
                updateApiDataMap(apiDataMap);
            }

            mpnList.forEach(mpn => {
                callApi(mpn, serverUrl, controller, apisList, apiCallback);
            });
        }

        return () => {
            controller.abort();
        }
    }, [req]);
}

export function useApiProgress(mpnList, apiData){

}

function callApi(mpn, serverUrl, controller, apis, callback){
    axios({
        method: 'GET',
        url: serverUrl+'api/part',
        params: {part: mpn},
        signal: controller.signal
    }).then(response => {
        const formattedApiData = formatApiData(response.data.apis);
        callback(mpn, formattedApiData, response.data.maxOffers);
    });
}

function formatApiData(rawApiData){
    const formattedData = Object.entries(rawApiData).reduce((obj, [k,v]) => {
        const success = v.status === 'success';
        const offers = success 
        ? v.offers.map((offer) => {
            return {
                available: offer.Quantity.Available,
                moq: offer.Quantity.MinimumOrder,
                spq: offer.Quantity.OrderMulti,
                leadtime: offer.LeadTime,
                leadtimedays: offer.LeadTimeDays,
                pricing: offer.Pricing,
                currency: offer.Currency
            }
        }) : [];
        obj[k] = {
            offers: offers,
            message: v.message
        };
        //console.log(obj[k]);
        return obj;
    }, {});
    return formattedData;
}