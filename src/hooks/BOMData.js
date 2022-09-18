import {useState, useEffect, useMemo} from 'react';

import update from 'immutability-helper';
import axios from 'axios';

import {useServerUrl} from './../hooks/Urls';

import {algorithmsInitialStructure} from './../scripts/AlgorithmVariable';

export function useApiData(mpnList, mpnListWithQuantity, apisList, updateApiDataMap, 
    store, currency, apiData, bomType, loadData, appLock, octopartData, updateOctopartDataMap){
    //const [dataProcessing, setDataProcessing] = useState([]);
    const serverUrl = useServerUrl();
    const expireTime = 1000000;
    const [multiRetryData, setMultiRetryData] = useState(new Map()); // a subset of apiData in real time (required due to delays in setState)
    const [singleRetryData, setSingleRetryData] = useState(null);
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
            
            mpnList.forEach(mpn => {
                if(apiData.has(mpn)){
                    if(dt > apiData.get(mpn).date + expireTime){
                        //console.log('recall');
                        callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency);
                    }
                }else{
                    callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency);
                }
            });
            /*
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
            */
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
    function callApiRetry(cmpn, api, rowNum, onComplete){
        const controller = new AbortController();
        function apiCallbackSingle(mpn, data, maxOffers){
            const now = Date.now();
            if(apiData.has(mpn)){
                const mpnDt = apiData.get(mpn);
                const mo = Math.max(mpnDt.data.max_offers, maxOffers);
                const newDa = update(mpnDt.data, {
                    apis: {
                        [api]: {$set: data[api]}
                    },
                    max_offers: {$set: mo}
                });
                const nm = new Map();
                nm.set(mpn, {data:newDa, date: mpnDt.date});
                const newData = updateApiDataMap(nm);
                const singData = {apis: {[api]: data[api]}, max_offers: mo};
                //console.log(singData);
                setSingleRetryData({data: singData, api: api, row: rowNum});
                onComplete(newData);
            }

        }
        callApi(cmpn, serverUrl, controller, [api], apiCallbackSingle, () => {}, store, currency);
    }
    function callApisRetry(mpnRetrys, onComplete=null){
        setMultiRetryData(new Map());
        const apiRetryDataMap = new Map();
        const mpnsComplete = new Set();
        const controller = new AbortController();
        function apiCallbackMulti(mpn, data, maxOffers, apis){
            if(apiData.has(mpn)){
                const mpnDt = apiData.get(mpn);
                const mo = Math.max(mpnDt.data.maxOffers, maxOffers);
                const apisUpdate = apis.reduce((obj, api) => {
                    obj[api] = {$set: data[api]};
                    return obj;
                }, {});
                //console.log(apisUpdate);
                const newDa = update(mpnDt.data, {
                    apis: apisUpdate,
                    max_offers: {$set: mo}
                });
                //const nm = new Map();
                apiRetryDataMap.set(mpn, {data:newDa, date: mpnDt.date});
                updateApiDataMap(apiRetryDataMap);
                mpnsComplete.add(mpn);
                setMultiRetryData(apiRetryDataMap);
                onComplete(mpn, mpnsComplete, apiRetryDataMap);
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
            const newData = updateApiDataMap(apiDataMap);
            onComplete(newData);
        }
        if(!apiData.has(cmpn)){
            callApi(cmpn, serverUrl, controller, apisList, apiCallbackSingle , () => {}, store, currency);
        }
    }
    function callOctopart(mpn, row, octopartLineChange){
        if(!octopartData.has(mpn)){
            const octoTempMap = new Map();
            axios({
                method: 'GET',
                url: serverUrl+'api/octopart',
                params: {part:mpn, currency: currency, store: store},
                //signal: controller.signal
            }).then(response => {
                console.log(response.data);
                const octoData = response.data.data;
                octoTempMap.set(mpn, octoData);
                updateOctopartDataMap(octoTempMap);
                octopartLineChange(octoData, row);
            });
        }
            /*
            const octoData = response.data;
            const findMpnData = octoData.data.find((octo) => octo.mpn === mpn);
            if(findMpnData !== undefined){
                const dists = findMpnData.data.map((d) => {
                    const offers = d.offers.reduce((arr, offer) => {
                        if(Object.keys(offer.pricing).length > 0){
                            if(props.currency in offer.pricing){
                                const pricing = offer.pricing[props.currency].map((pr) => {
                                    return pr;
                                });
                                const obj = {
                                    available: offer.available,
                                    moq: offer.moq,
                                    leadtime: offer.leadtime,
                                    spq: offer.spq,
                                    //pricing: pricing,
                                    prices: {
                                        price: offer.price,
                                        pricing: pricing,
                                        pricingIndex: offer.price_index,
                                    },
                                    packaging: offer.packaging
                                }
                                arr.push(obj);
                            }else{
                                console.log(offer.pricing);
                            }
                        }
                        return arr;
                    }, []);
                    return {
                        distributor: d.company,
                        offers: offers
                    };
                });
                console.log(dists);
                callback(dists);
            }*/
    }

    return [callApiRetry, callMpn, callApisRetry, multiRetryData, singleRetryData, callOctopart];
}

export function useApiDataProgress(mpnList, apisList, apiData, callApiRetry, callApisRetry, store, currency){
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
    //const [fullRetryMpns, setFullRetryMpns] = useState([]); //for full retry
    const [retryMpns, setRetryMpns] = useState([]); 
    const [retryLock, setRetryLock] = useState(false); //testing
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
            const remMpns = [...mpnsInProgress].reduce((arr, mpn) => {
                if(apiData.has(mpn)){
                    arr.push(mpn);
                }
                return arr;
            }, []);
            //change to mpnsinprogress
            const fin = mpnsInProgress.size - remMpns.length === 0;
            setMpnsInProgress(update(mpnsInProgress, {
                $remove: remMpns
            }));
            if(fin){
                setInitialDataFlag(false);
                setDataProcessingLock(false);
                const mpnRetrys = findMpnRetrys();
                setRetryMpns(mpnRetrys);
            }
        }else if(retryLock){
            /*
            if(mpnsInProgress.size === 0){
                setDataProcessingLock(false);
                const mpnRetrys = mpnList.reduce((arr, mpn) => {
                    if(apiData.has(mpn)){
                        const mpnApisData = apiData.get(mpn).data.apis;
                        const retryApis = apisList.reduce((arrApi, api)=> {
                            if(mpnApisData[api].retry) arrApi.push(api);
                            return arrApi;
                        }, []);
                        if(retryApis.length > 0){
                            arr.push({mpn: mpn, apis: retryApis});
                        }
                        return arr;
                    }
                }, []);
                console.log(mpnRetrys);
                setRetryMpns(mpnRetrys);
            }*/
        }
    }, [apiData]);
    useEffect(() => {
        if(!dataProcessingLock){
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
    function retrySingle(mpn, api, row){
        setDataProcessingLock(true);
        setShowProgress(true);
        setMpnsInProgress(new Set([mpn]));
        function onComplete(newData){
            console.log(newData);
            setMpnsInProgress(new Set());
            setDataProcessingLock(false);
            setRetryMpns(findMpnRetrys(newData));
            //setTimeout(() => {setRetryMpns(findMpnRetrys(newData))}, 200); //find better solution for these timeouts
        }
        callApiRetry(mpn, api, row, onComplete);
    }
    //function 
    function findMpnRetrys(apDt=null){
        const ad = apDt !== null ? apDt : apiData;
        return mpnList.reduce((arr, mpn) => {
            if(ad.has(mpn)){
                const mpnApisData = ad.get(mpn).data.apis;
                const retryApis = apisList.reduce((arrApi, api)=> {
                    if(mpnApisData[api].retry) arrApi.push(api);
                    return arrApi;
                }, []);
                if(retryApis.length > 0){
                    arr.push({mpn: mpn, apis: retryApis});
                }
                return arr;
            }
        }, []);
    }
    function retryAll(){
        console.log('start retry');
        setNumMpns(retryMpns.length);
        const retMpns = new Set(retryMpns.map((ret) => ret.mpn));
        console.log(retMpns);
        setMpnsInProgress(retMpns);
        //const mpnProgress = retMpns;
        function onComplete(mpn, mpns, apiDataFull){
            const newMpnsInProgress = new Set([...retMpns].filter(m => !mpns.has(m)));
            setMpnsInProgress(newMpnsInProgress);
            if(newMpnsInProgress.size === 0){
                setDataProcessingLock(false);
                const retrys = [...apiDataFull.entries()].reduce((arr, [mpn, val]) => {
                    const apis = Object.entries(val.data.apis).reduce((a, [k,v]) => {
                        if(v.retry) a.push(k);
                        return a;
                    }, []);
                    if(apis.length > 0){
                        arr.push({mpn: mpn, apis: apis});
                    }
                    return arr;
                }, []);
                console.log(retrys);
                setRetryMpns(retrys);
            }
        }
        if(retryMpns.length > 0){
            callApisRetry(retryMpns, onComplete);
            setRetryLock(true);
            setDataProcessingLock(true);
            setShowProgress(true);
        }
    }
    function handleHideBar(){
        setShowProgress(false);
    }
    return [showProgress, handleHideBar, numMpns, mpnsInProgress, retryMpns, dataProcessingLock, retrySingle, 
        retryAll, setDataProcessingLock, setMpnsInProgress, 
        {get:retryLock, set:setRetryLock}];
}
function callApi(mpn, serverUrl, controller, apis, callback, errorCallback, store, currency, quantity=null){
    const apiStr = apis.join(',');
    const params = {part: mpn, api:apiStr, store: store, currency: currency};
    //if(quantity !== null) params.quantity = quantity;
    //console.log('calling '+mpn);
    axios({
        method: 'GET',
        url: serverUrl+'api/part',
        params: params,
        signal: controller.signal
    }).then(response => {
        //console.log(response.data);
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
            //console.log(mpn);
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
                pricing: offer.pricing,
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
                selected: false,
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