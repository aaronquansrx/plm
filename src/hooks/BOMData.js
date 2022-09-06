import {useState, useEffect, useMemo} from 'react';

import update from 'immutability-helper';
import axios from 'axios';

import {useServerUrl} from './../hooks/Urls';

import {algorithmsInitialStructure} from './../scripts/AlgorithmVariable';

export function useApiData(mpnList, mpnListWithQuantity, apisList, updateApiDataMap, 
    store, currency, apiData, bomType, loadData, appLock){
    //const [dataProcessing, setDataProcessing] = useState([]);
    const serverUrl = useServerUrl();
    const expireTime = 1000000;
    useEffect(() => {
        const controller = new AbortController();
        console.log(currency);
        appLock(true);
        if(bomType !== 'saved'){
            //console.log(store);
            //const controller = new AbortController();
            const apiDataMap = new Map();
            function apiCallback(mpn, apiData, maxOffers, apis, bests){
                const now = Date.now();
                const da = {
                    apis: apiData,
                    bests: bests,
                    max_offers: maxOffers
                };
                apiDataMap.set(mpn, {data:da, date: now});
                updateApiDataMap(apiDataMap);
                //dataProcessing
            }
            function errorCallback(mpn){
                const now = Date.now();
                const errorApiData = apisList.reduce((obj, api) => {
                    obj[api] = {
                        offers: [],
                        message: 'Server Error',
                        offer_order: algorithmsInitialStructure(),
                        retry: false
                    }
                    return obj;
                }, {});
                const da = {
                    apis: errorApiData,
                    bests: algorithmsInitialStructure(),
                    maxOffers: 0
                }
                apiDataMap.set(mpn, {data: da, date: now});
                updateApiDataMap(apiDataMap);
            }
            const dt = Date.now();
            //setDataProcessing(mpnList);
            /*
            mpnList.forEach(mpn => {
                if(apiData.has(mpn)){
                    if(dt > apiData.get(mpn).date + expireTime){
                        //console.log('recall');
                        callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency);
                    }
                }else{
                    callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency);
                }
            });*/
            mpnListWithQuantity.forEach((mq) => {
                const mpn = mq.mpn;
                const quantity = mq.quantity;
                if(apiData.has(mpn)){
                    if(dt > apiData.get(mpn).date + expireTime){
                        //console.log('recall');
                        callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency, quantity);
                    }
                }else{
                    callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency, quantity);
                }
            });
        }else{
            //check keys of loaddata
            console.log('load data');
            const ad = loadData.api_data;
            //const kk = Object.keys(ad);
            //console.log(kk);
            //console.log(mpnList);
            //if(kk.length === mpnList.length){
                //console.log(loadData);
                const now = Date.now();
                const apiDataMap = new Map();
                for(const mpn in ad){
                    const da = {
                        apis: apisList.reduce((obj, api) => {
                            obj[api] = ad[mpn][api];
                            return obj;
                        }, {}),
                        maxOffers: ad[mpn].maxOffers
                    };
                    apiDataMap.set(mpn, {data: da, date: now});
                }
                updateApiDataMap(apiDataMap);
            //}
        }
        //setDataProcessing(false);
        return () => {
            controller.abort();
        }
    }, [store, currency]);
    function callApiRetry(cmpn, api, onComplete){
        const controller = new AbortController();
        function apiCallbackSingle(mpn, data, maxOffers){
            const now = Date.now();
            if(apiData.has(mpn)){
                const mpnDt = apiData.get(mpn);
                const mo = Math.max(mpnDt.data.maxOffers, maxOffers);
                const newDa = update(mpnDt.data, {
                    apis: {
                        [api]: {$set: data[api]}
                    },
                    max_offers: {$set: mo}
                });
                const nm = new Map();
                nm.set(mpn, {data:newDa, date: mpnDt.date});
                updateApiDataMap(nm);
                onComplete({apis: {[api]: data[api]}, maxOffers: mo});
            }

        }
        callApi(cmpn, serverUrl, controller, [api], apiCallbackSingle, () => {}, store, currency);
    }
    function callApisRetry(mpnRetrys, onComplete=null){
        const apiRetryDataMap = new Map();
        const controller = new AbortController();
        function apiCallbackMulti(mpn, data, maxOffers, apis){
            if(apiData.has(mpn)){
                const mpnDt = apiData.get(mpn);
                const mo = Math.max(mpnDt.data.maxOffers, maxOffers);
                const apisUpdate = apis.reduce((obj, api) => {
                    obj[api] = {$set: data[api]};
                    return obj;
                }, {});
                console.log(apisUpdate);
                const newDa = update(mpnDt.data, {
                    apis: apisUpdate,
                    maxOffers: {$set: mo}
                });
                //const nm = new Map();
                apiRetryDataMap.set(mpn, {data:newDa, date: mpnDt.date});
                updateApiDataMap(apiRetryDataMap);
                onComplete(mpn);
            }
        }
        mpnRetrys.forEach((mr) => {
            //console.log(mr.mpn);
            callApi(mr.mpn, serverUrl, controller, mr.apis, apiCallbackMulti, () => {onComplete(mr.mpn)}, store, currency);
        })
    }
    function callMpn(cmpn, onComplete){
        const controller = new AbortController();
        function apiCallbackSingle(mpn, data, maxOffers){
            const now = Date.now();
            const apiDataMap = new Map();
            const da = {
                apis: data,
                max_offers: maxOffers
            };
            apiDataMap.set(mpn, {data:da, date: now});
            updateApiDataMap(apiDataMap);
            onComplete(da);
        }
        if(!apiData.has(cmpn)){
            callApi(cmpn, serverUrl, controller, apisList, apiCallbackSingle , () => {}, store, currency);
        }
    }
    return [callApiRetry, callMpn, callApisRetry];
}

export function useApiDataProgress(mpnList, apiData, store, currency){
    const [progress, setProgress] = useState({
        finished: false,
        mpnsNotEvaluated: new Set(
            mpnList.reduce((arr, mpn) => {
                if(!apiData.has(mpn)) arr.push(mpn);
                return arr;
            }, [])
        )
    });
    const [mpnsInProgress, setMpnsInProgress] = useState(new Set(
        mpnList.reduce((arr, mpn) => {
            if(!apiData.has(mpn)) arr.push(mpn);
            return arr;
        }, []))
    );
    const [showProgress, setShowProgress] = useState(true);
    const [numMpns, setNumMpns] = useState(mpnList.length);
    const [initialDataFlag, setInitialDataFlag] = useState(true); // run initial data bom collection first time
    const [dataProcessingLock, setDataProcessingLock] = useState(true);
    const [retryMpns, setRetryMpns] = useState(new Set()); 
    //const [mpnsToDo, setMpnsToDo] = useState(new Set([...mpnList]));
    useEffect(() => {
        /*
        const retMpns = [];
        //console.log(apiData);
        apiData.forEach((val, mpn) => {
            //if(!retryMpns.has(mpn)){
                //console.log(val);
            const hasRetry = Object.entries(val.data.apis).reduce((b, [api, v]) => {
                if(v.retry) return true;
                return b;
            }, false);
            if(hasRetry){
                retMpns.push(mpn);
            }
            //}
        });
        setRetryMpns(update(retryMpns, {
            $add: retMpns
        }));*/
        //console.log(apiData);
        if(initialDataFlag){
            /*
            const leftMpns = [...progress.mpnsNotEvaluated].reduce((arr, mpn) => {
                if(apiData.has(mpn)){
                    arr.push(mpn);
                }
                return arr;
            }, []);*/
            const remMpns = [...mpnsInProgress].reduce((arr, mpn) => {
                if(apiData.has(mpn)){
                    arr.push(mpn);
                }
                return arr;
            }, []);
            //change to mpnsinprogress
            const fin = mpnsInProgress.size - remMpns.length === 0;
            /*
            const newProgress = update(progress, {
                finished: {$set: fin},
                mpnsNotEvaluated: {$remove: leftMpns}
            });*/
            setMpnsInProgress(update(mpnsInProgress, {
                $remove: remMpns
            }));
            //console.log(newProgress);
            //setProgress(newProgress);
            if(fin){
                console.log('end');
                setInitialDataFlag(false);
                setDataProcessingLock(false);
            }
        }
    }, [apiData]);
    useEffect(() => {
        if(!dataProcessingLock){
            const retMpns = new Set();
            apiData.forEach((val, mpn) => {
                const hasRetry = Object.entries(val.data.apis).reduce((b, [api, v]) => {
                    if(v.retry) return true;
                    return b;
                }, false);
                if(hasRetry){
                    retMpns.add(mpn);
                }
            });
            //console.log(retMpns);
            setRetryMpns(new Set(retMpns));
        }
    }, [dataProcessingLock]);
    useEffect(() => {
        const mpnsEvaled = new Set(
            mpnList.reduce((arr, mpn) => {
                if(!apiData.has(mpn)) arr.push(mpn);
                return arr;
            }, [])
        );
        setInitialDataFlag(true);
        setDataProcessingLock(true);
        if(mpnsEvaled.size > 0){
            setShowProgress(true);
        }
        setMpnsInProgress(mpnsEvaled);
    }, [store, currency]);
    useEffect(() => {
        if(mpnsInProgress.size === 0){
            setDataProcessingLock(false);
            //may not have apiData updated 
            /*
            console.log(apiData);
            const retMpns = [];
            apiData.forEach((val, mpn) => {
                const hasRetry = Object.entries(val.data.apis).reduce((b, [api, v]) => {
                    if(v.retry) return true;
                    return b;
                }, false);
                if(hasRetry){
                    retMpns.push(mpn);
                }
            });
            console.log(retMpns);
            setRetryMpns(new Set(retMpns));
            */
        }
    }, [mpnsInProgress])
    function retryAllStart(retrySet){
        setNumMpns(retrySet.size);
        setMpnsInProgress(retrySet);
        if(retrySet.size > 0){ 
            setDataProcessingLock(true);
            setShowProgress(true);
        }
    }
    function handleHideBar(){
        setShowProgress(false);
    }
    return [showProgress, handleHideBar, numMpns, mpnsInProgress, retryMpns, dataProcessingLock, retryAllStart, setDataProcessingLock, setMpnsInProgress];
}
function callApi(mpn, serverUrl, controller, apis, callback, errorCallback, store, currency, quantity=null){
    const apiStr = apis.join(',');
    const params = {part: mpn, api:apiStr, store: store, currency: currency};
    if(quantity !== null) params.quantity = quantity;
    axios({
        method: 'GET',
        url: serverUrl+'api/part',
        params: params,
        signal: controller.signal
    }).then(response => {
        console.log(response.data);
        if(typeof response.data !== 'object'){
            console.log(mpn); //catch problematic mpns
            errorCallback(mpn);
            axios({
                method: 'GET',
                url: serverUrl+'api/errormail',
                params: {mpn: mpn},
                signal: controller.signal
            });
        }else{
            const resp = response.data;
            const formattedApiData = formatApiData(resp.apis);
            const bests = resp.bests;
            callback(mpn, formattedApiData, resp.max_offers, apis, bests);
        }
    });
}

function formatApiData(rawApiData){
    const formattedData = Object.entries(rawApiData).reduce((obj, [k,v]) => {
        const success = v.status === 'success';
        const offers = success 
        ? v.offers.map((offer) => {
            return {
                available: offer.available,
                moq: offer.moq,
                spq: offer.spq,
                leadtime: offer.leadtime,
                //pricing: offer.pricing,
                packaging: offer.packaging,
                /*prices: {
                    price: offer.best_price.price_per,
                    pricing: offer.pricing,
                    pricing_index: offer.best_price.index,
                    total_price: offer.best_price.total
                },*/
                prices: offer.prices,
                adjusted_quantity: offer.adjusted_quantity,
                excess_quantity: offer.excess_quantity,
                excess_price: offer.excess_price,
                total_price: offer.total_price,
                selected: null,
                best: false
            }
        }) : [];
        obj[k] = {
            offers: offers,
            message: v.message,
            retry: v.retry,
            offer_order: v.offer_order
        };
        return obj;
    }, {});
    return formattedData;
}