import {useState, useEffect, useMemo} from 'react';

import update from 'immutability-helper';
import axios from 'axios';

import {useServerUrl} from './../hooks/Urls';

import {algorithmsInitialStructure} from './../scripts/AlgorithmVariable';
import { set } from 'lodash';

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
            function apiCallback(mpn, apiData, mpnVars, apis){
                const now = Date.now();
                const da = {
                    apis: apiData,
                    ...mpnVars
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
                        retry: true
                    }
                    return obj;
                }, {});
                const da = {
                    apis: errorApiData,
                    ...refinedMpnVars()
                }
                apiDataMap.set(mpn, {data: da, date: now});
                updateApiDataMap(apiDataMap);
            }
            const dt = Date.now();

            //mpns with no quantity
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
            });
            */
            //mpns with quantity
            mpnListWithQuantity.forEach((mq) => {
                const mpn = mq.mpn;
                const quantity = mq.quantity;
                if(apiData.has(mpn)){
                    if(dt > apiData.get(mpn).date + expireTime){
                        callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency, quantity);
                    }
                }else{
                    callApi(mpn, serverUrl, controller, apisList, apiCallback, errorCallback, store, currency, quantity);
                }
            });
            //callParts(mpnList, serverUrl, controller, apisList, null, null, store, currency);
            //not better with high amounts of external api calls
        }else{
            //check keys of loaddata
            console.log('load data');
            const ad = loadData.api_data;
            const now = Date.now();
            const apiDataMap = new Map();
            for(const mpn in ad){
                const da = {
                    apis: apisList.reduce((obj, api) => {
                        obj[api] = ad[mpn][api];
                        return obj;
                    }, {}),
                    max_offers: ad[mpn].maxOffers,
                    //manufacturers:
                };
                apiDataMap.set(mpn, {data: da, date: now});
            }
            updateApiDataMap(apiDataMap);
        }
        //setDataProcessing(false);
        return () => {
            controller.abort();
        }
    }, [store, currency]);
    function callApiRetry(cmpn, api, rowNum, onComplete){
        const controller = new AbortController();
        function apiCallbackSingle(mpn, data, rmv, apis){
            const now = Date.now();
            if(apiData.has(mpn)){
                const mpnDt = apiData.get(mpn);
                const mo = Math.max(mpnDt.data.max_offers, rmv.max_offers);
                const manus = new Set([...mpnDt.data.found_manufacturers], [...rmv.found_manufacturers]);
                const status = getRetryStatusString(mpnDt.data, rmv.status, true);
                const newDa = update(mpnDt.data, {
                    apis: {
                        [api]: {$set: data[api]}
                    },
                    max_offers: {$set: mo},
                    found_manufacturers: {$set: manus},
                    status: {$set: status}
                });
                const nm = new Map();
                nm.set(mpn, {data:newDa, date: mpnDt.date});
                const newData = updateApiDataMap(nm);
                const singData = {apis: {[api]: data[api]}, max_offers: mo, found_manufacturers: [...manus], status: status};
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
        function apiCallbackMulti(mpn, data, rmv, apis){
            if(apiData.has(mpn)){
                const mpnDt = apiData.get(mpn);
                const mo = Math.max(mpnDt.data.max_offers, rmv.max_offers);
                const manus = new Set([...mpnDt.data.found_manufacturers], [...rmv.found_manufacturers]);
                const apisUpdate = apis.reduce((obj, api) => {
                    obj[api] = {$set: data[api]};
                    return obj;
                }, {});
                const status = getRetryStatusString(mpnDt.data, rmv.status, true);
                const newDa = update(mpnDt.data, {
                    apis: apisUpdate,
                    max_offers: {$set: mo},
                    found_manufacturers: {$set: [...manus]},
                    status: {$set: status}
                });
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
    //api param used for single to check for other retries
    function getRetryStatusString(dt, newStatus, api=false){
        if(newStatus === 'no_offers' && dt.status === 'complete'){
            return 'complete'
        }
        if(api){
            const rets = Object.entries(dt.apis).reduce((arr, [api, v]) => {
                if(v.retry) arr.push(v);
                return arr;
            }, []);
            if(rets.length > 1){
                return 'retry';
            }
        }
        return newStatus;
    }
    function callMpn(cmpn, onComplete){
        const controller = new AbortController();
        function apiCallbackSingle(mpn, data, rmv, apis){
            const now = Date.now();
            const apiDataMap = new Map();
            const da = {
                apis: data,
                ...rmv
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
                const ocd = octoData.sellers.map(seller => {
                    seller.offers = seller.offers.map((offer) => {
                        offer.selected = false;
                        return offer;
                    });
                    return seller;
                });
                octoTempMap.set(mpn, ocd);
                updateOctopartDataMap(octoTempMap);
                octopartLineChange(octoData, row);
            });
        }
    }
    function testNewMpns(){
        callParts(mpnList, serverUrl, null, apisList, null, null, store, currency);
    }
    return [callApiRetry, callMpn, callApisRetry, multiRetryData, singleRetryData, callOctopart, testNewMpns];
}

export function useApiDataProgress(mpnList, apisList, apiData, callApiRetry, callApisRetry, store, currency){
    const [mpnsInProgress, setMpnsInProgress] = useState(new Set(
        mpnList.reduce((arr, mpn) => {
            if(!apiData.has(mpn)) arr.push(mpn);
            return arr;
        }, []))
    );
    const [showProgress, setShowProgress] = useState(true);
    const [numMpns, setNumMpns] = useState(mpnList.length);
    const [initialDataFlag, setInitialDataFlag] = useState(true); // run initial data bom collection first time
    //const [dataProcessingLock, setDataProcessingLock] = useState(true);
    const [retryMpns, setRetryMpns] = useState([]); 
    const [retryLock, setRetryLock] = useState(false);
    const [testRetryMpns, setTestRetryMpns] = useState(new Set());
    const [retryAgain, setRetryAgain] = useState(false);
    useEffect(() => {
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
                //setDataProcessingLock(false);
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
        //test
    }, [apiData]);
    /*
    useEffect(() => {
        if(!dataProcessingLock){
        }
    }, [dataProcessingLock]);*/
    useEffect(() => {
        const mpnsEvaled = new Set(
            mpnList.reduce((arr, mpn) => {
                if(!apiData.has(mpn)) arr.push(mpn);
                return arr;
            }, [])
        );
        setRetryMpns([]);
        setInitialDataFlag(true);
        //setDataProcessingLock(true);
        if(mpnsEvaled.size > 0){
            setShowProgress(true);
        }
        setMpnsInProgress(mpnsEvaled);
    }, [store, currency]);
    useEffect(() => {
        if(retryAgain && !retryLock){
            retryAll();
            setRetryAgain(false);
        }
    }, [retryAgain, retryLock]);
    function retrySingle(mpn, api, row){
        //setDataProcessingLock(true);
        setShowProgress(true);
        setMpnsInProgress(new Set([mpn]));
        function onComplete(newData){
            console.log(newData);
            setMpnsInProgress(new Set());
            //setDataProcessingLock(false);
            setRetryMpns(findMpnRetrys(newData));
            //setTimeout(() => {setRetryMpns(findMpnRetrys(newData))}, 200); //find better solution for these timeouts
        }
        callApiRetry(mpn, api, row, onComplete);
    }
    function findMpnRetrys(apDt=null){
        const ad = apDt !== null ? apDt : apiData;
        return mpnList.reduce((arr, mpn) => {
            if(ad.has(mpn)){
                const data = ad.get(mpn).data;
                const mpnApisData = ad.get(mpn).data.apis;
                const retryApis = apisList.reduce((arrApi, api)=> {
                    if(mpnApisData[api].retry) arrApi.push(api);
                    return arrApi;
                }, []);
                //const quantity = data.
                if(retryApis.length > 0){
                    arr.push({mpn: mpn, apis: retryApis});
                }
                return arr;
            }
        }, []);
    }
    function retryAll(ra=false, n=null, newRetrys=null){
        console.log('start retry');
        setNumMpns(retryMpns.length);
        const retMpns = newRetrys !== null ? new Set(newRetrys.map((ret) => ret.mpn)) : new Set(retryMpns.map((ret) => ret.mpn));
        console.log(retMpns);
        setMpnsInProgress(retMpns);
        //const mpnProgress = retMpns;
        function onComplete(mpn, mpns, apiDataFull){
            console.log(apiDataFull);
            const newMpnsInProgress = new Set([...retMpns].filter(m => !mpns.has(m)));
            setMpnsInProgress(newMpnsInProgress);
            if(newMpnsInProgress.size === 0){
                //setDataProcessingLock(false);
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
                if(ra && retrys.length < n && retrys.length > 0){
                    console.log('ret again');
                    //setTimeout(() => {retryAll(ra, retrys.length, retrys)}, 1200); // use delay
                    setRetryAgain(ra);
                }
            }
        }
        if(retryMpns.length > 0){
            callApisRetry(retryMpns, onComplete);
            setRetryLock(true);
            //setDataProcessingLock(true);
            setShowProgress(true);
        }
    }
    function handleHideBar(){
        setShowProgress(false);
    }
    return [showProgress, handleHideBar, numMpns, mpnsInProgress, retrySingle, 
        retryAll, {get:retryLock, set:setRetryLock}, {get:retryMpns, set:setRetryMpns}];
}

export function useManufacturers(bom){
    const serverUrl = useServerUrl();
    const uniqueManufacturers = useMemo(() => {
        const manus = bom.reduce((st, line) => {
            if(line.manufacturer !== null) st.add(line.manufacturer);
            return st;
        }, new Set());
        return manus;
    }, [bom]);
    const [manufacturerData, setManufacturerData] = useState(new Map());
    useEffect(() => {
        axios({
            method: 'GET',
            url: serverUrl+'api/manufacturer',
            data: {}
        }).then((response) => {
            console.log(response.data);
        });
    }, [uniqueManufacturers]);
    return [uniqueManufacturers];
}

function callApi(mpn, serverUrl, controller, apis, callback, errorCallback, store, currency, quantity=null){
    const apiStr = apis.join(',');
    const params = {part: mpn, api:apiStr, store: store, currency: currency};
    if(quantity !== null) params.quantity = quantity;
    //console.log('calling '+mpn);
    /*
    axios({
        method: 'GET',
        url: serverUrl+'api/part',
        params: params,
        signal: controller.signal
    }).then(response => {
        //console.log(response.data);
        if(typeof response.data !== 'object'){
            console.log(response.data);
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
            const mpnVars = {
                bests: resp.bests,
                max_offers: resp.max_offers
            }
            const bests = resp.bests;
            callback(mpn, formattedApiData, mpnVars, apis);
        }
    });
    */
    const pars = {mpn: mpn, api: apiStr};
    axios({
        method: 'GET',
        url: serverUrl+'api/part',
        params: pars,
        signal: controller.signal
    }).then(response => {
        //console.log(response.data);
        if(typeof response.data !== 'object'){
            console.log(response.data);

            console.log(mpn); //catch problematic mpns
            errorCallback(mpn);
            axios({
                method: 'POST',
                url: serverUrl+'api/errorreport',
                data: {report: response.data, mpn: mpn}
            }).then(res => {
                console.log(res);
            });
        }else{
            console.log(response.data);
            const data = response.data;
            const formattedApiData = formatApiData(data.refined.apis);
            //const manufacturers = data.refined.found_manufacturers;
            const rmv = refinedMpnVars(data.refined);
            callback(mpn, formattedApiData, rmv, apis);
        }
    });
}

function callParts(parts, serverUrl, controller, apis, callback, errorCallback, store, currency){
    axios({
        method: 'POST',
        url: serverUrl+'api/part',
        data: {parts: parts, apis: apis, store: store, currency: currency},
        signal: controller ? controller.signal : null
    }).then(response => {
        console.log(response.data);
    });
}

function formatApiData(rawApiData){
    const formattedData = Object.entries(rawApiData).reduce((obj, [k,v]) => {
        const success = v.status === 'success';
        const offers = success
        ? v.offers.map((offer) => {
            //console.log(offer.fees);
            return {
                available: offer.available,
                moq: offer.moq,
                spq: offer.spq,
                leadtime: offer.leadtime,
                pricing: offer.pricing,
                packaging: offer.packaging,
                api_manufacturer: 'manufacturer' in offer ? offer.manufacturer : null,
                /*prices: {
                    price: offer.best_price.price_per,
                    pricing: offer.pricing,
                    pricing_index: offer.best_price.index,
                    total_price: offer.best_price.total
                },*/
                //prices: offer.prices,
                //adjusted_quantity: offer.adjusted_quantity,
                //excess_quantity: offer.excess_quantity,
                //excess_price: offer.excess_price,
                //total_price: offer.total_price,
                distributor_code: offer.distributor_code,
                fees: 'fees' in offer ? offer.fees : null,
                url: offer.url,
                selected: false,
                best: false
            }
        }) : [];
        obj[k] = {
            offers: offers,
            message: v.message,
            retry: v.retry,
            //offer_order: v.offer_order
        };
        return obj;
    }, {});
    return formattedData;
}

function refinedMpnVars(data=null){
    if(data===null){
        return {
            //bests: algorithmsInitialStructure(),
            max_offers: 0,
            found_manufacturers: [],
            status: 'error'
        }
    }
    return {
        found_manufacturers: data.found_manufacturers,
        max_offers: data.max_offers,
        status: data.status,
    }
}