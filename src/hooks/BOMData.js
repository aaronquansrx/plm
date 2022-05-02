import {useState, useEffect, useMemo} from 'react';

import update from 'immutability-helper';
import axios from 'axios';

import {useServerUrl} from './../hooks/Urls';

export function useApiData(req, mpnList, apisList, updateApiDataMap, 
    store, currency, changeLock, apiData){
    const serverUrl = useServerUrl();
    const expireTime = 1000000;
    useEffect(() => {
        //console.log(store);
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
            changeLock(true);
            const dt = Date.now();
            mpnList.forEach(mpn => {
                if(apiData.has(mpn)){
                    if(dt > apiData.get(mpn).date + expireTime){
                        console.log('recall');
                        callApi(mpn, serverUrl, controller, apisList, apiCallback, store, currency);
                    }
                }else{
                    callApi(mpn, serverUrl, controller, apisList, apiCallback, store, currency);
                }
            });
        }

        return () => {
            controller.abort();
        }
    }, [req, store, currency]);
}

export function useApiDataProgress(mpnList, apiData, store, currency, changeLock){
    const [progress, setProgress] = useState({
        finished: false,
        mpnsNotEvaluated: new Set(
            mpnList.reduce((arr, mpn) => {
                if(!apiData.has(mpn)) arr.push(mpn);
                return arr;
            }, [])
        )
    });

    //const [mpnsToDo, setMpnsToDo] = useState(new Set([...mpnList]));
    useEffect(() => {
        const leftMpns = [...progress.mpnsNotEvaluated].reduce((arr, mpn) => {
            if(apiData.has(mpn)){
                arr.push(mpn);
            }
            return arr;
        }, []);
        const fin = progress.mpnsNotEvaluated.size - leftMpns.length === 0;

        const newProgress = update(progress, {
            finished: {$set: fin},
            mpnsNotEvaluated: {$remove: leftMpns}
        });
        setProgress(newProgress);
        if(fin){
            changeLock(false);
        }
    }, [apiData]);
    useEffect(() => {
        const mpnsEvaled = new Set(
            mpnList.reduce((arr, mpn) => {
                if(!apiData.has(mpn)) arr.push(mpn);
                return arr;
            }, [])
        );
        const fin = mpnsEvaled.size === 0;
        const resetProgress = update(progress, {
            $set: {finished: fin, mpnsNotEvaluated: mpnsEvaled}
        });
        setProgress(resetProgress);
    }, [store, currency]);

    function mpnIsEvaluated(mpn){
        return progress.mpnsNotEvaluated.has(mpn);
    }
    return progress;
}

function callApi(mpn, serverUrl, controller, apis, callback, store, currency){
    axios({
        method: 'GET',
        url: serverUrl+'api/part',
        params: {part: mpn, store: store, currency: currency},
        signal: controller.signal
    }).then(response => {
        if(typeof response.data !== 'object'){
            console.log(mpn); //catch problematic mpns
        }
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
                //leadtime: offer.LeadTime,
                leadtime: offer.LeadTimeWeeks,
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