import {useState, useEffect, useMemo} from 'react';

import axios from 'axios';
import update from 'immutability-helper';

import { findPriceBracket, sortPrice, sortLeadTime, 
    sortOrderPrice, sortOrderLeadTime } from '../scripts/Offer';
import {useServerUrl} from '../hooks/Urls';
import { BOMAPITable } from '../components/Tables';

export function useTableBOM(req, bom, tableHeaders, apis, apiData, 
    apiDataProgress, testCall, store, currency){
    const serverUrl = useServerUrl();
    const lenBOM = bom.length;
    const initTableBOM = useMemo(() => {
        return bom.map((line) => {
            line.mpns = {
                current: line.mpn,
                options: line.mpnOptions
            };
            line.quantities = {
                initial: line.quantity,
                single: line.quantity,
                multi: line.quantity,
            };
            line.activeApis = apis.map(api => {
                return{
                    Header: api.Header,
                    accessor: api.accessor,
                    active: true
                }
            });
            line.highlights = {
                price: null,
                lead_time: null
            }
            //have offer evaluation for best price and lead time
            line.offerEvaluation = {
                bestprice: {
                    offers: [],
                    quantity_found: 0,
                    total_price: 0,
                    fully_evaluated: 0 >= line.quantities.multi
                },
                leadtime: {
                    offers: [],
                    quantity_found: 0,
                    total_price: 0,
                    fully_evaluated: 0 >= line.quantities.multi
                }
            }
            line.lineLock = false;
            return line;
        })
    });
    const apisList = apis.map(api => api.accessor);
    const [tableBOM, setTableBOM] = useState(initTableBOM);
    const headers = useMemo(() => {
        const headerChangeMap = {
            mpn: 'mpns',
            quantity: 'quantities'
        };
        const newHeaders = tableHeaders.concat([{Header: 'Apis', accessor: 'activeApis'}]);
        return newHeaders.map((header) => {
            if(header.accessor in headerChangeMap){
                header.accessor = headerChangeMap[header.accessor];
            }
            return header;
        });
    }, [tableHeaders]);
    const [initUpdateTable, setInitUpdateTable] = useState(0);
    const [lineNumsToEvaluate, setLineNumsToEvaluate] = useState(new Set([...Array(lenBOM)].keys()));
    const linesComplete = lenBOM - lineNumsToEvaluate.size;
    useEffect(() => {
        const updateTimeout = lineNumsToEvaluate.size !== 0 
        ? setTimeout(() => setInitUpdateTable(initUpdateTable+1), 1000)
        : null;
        //test new table (also put in new function)
        const newMpns = [];
        const newTable = [...tableBOM].map((line, i) => {
            const newLine = {...line};
            const mpn = newLine.mpns.current;
            if(lineNumsToEvaluate.has(i)){
                if(apiData.has(mpn)){
                    newMpns.push(i);
                    const lineApiData = evalLineApis(newLine, apisList, apiData);
                    lineApiData.forEach((ad) => {
                        newLine[ad.api] = {
                            offers: ad.offers,
                            offerOrder: ad.offerOrder, 
                            message: ad.message,
                            retry: apiData.get(mpn).data.apis[ad.api].retry
                        };
                    });
                    newLine.maxOffers = apiData.get(mpn).data.maxOffers;
                }
            }
            return newLine;
        });
        const newLineNumsEval = update(lineNumsToEvaluate, {
            $remove: newMpns
        });
        setTableBOM(newTable);
        setLineNumsToEvaluate(newLineNumsEval);
        return () => {
            clearTimeout(updateTimeout);
        }
    }, [initUpdateTable]);
    useEffect(() => {
        setLineNumsToEvaluate(new Set([...Array(lenBOM)].keys()));
        setInitUpdateTable(initUpdateTable+1);
    }, [store, currency]);
    useEffect(() => {
        runBOMAlgorithms(tableBOM);
    }, [testCall]);
    useEffect(() => {
        runBOMAlgorithms(tableBOM);
    }, [lineNumsToEvaluate]);
    function setTable(table){
        setTableBOM(table);
    }
    function retryForApi(row, api, newRowData){
        console.log(newRowData);
        const newLine = {...tableBOM[row]};
        const newEvalData = newEvalApi(newLine, api, newRowData);
        console.log(newEvalData);
        newLine[api] = {
            offers: newEvalData.offers,
            offerOrder: newEvalData.offerOrder,
            message: newRowData.message,
            retry: newRowData.retry
        }
        newLine.maxOffers = Math.max(newLine.maxOffers, newRowData.offers.length);
        //try something else here
        /*
        const lineApiData = evalLineApis(newLine, apisList, newRowData);
        lineApiData.forEach((ad) => {
            newLine[ad.api] = {
                offers: ad.offers,
                offerOrder: ad.offerOrder, 
                message: ad.message
            };
        });
        newLine.maxOffers = apiData.get(newLine.mpns.current).data.maxOffers;
        */
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        runBOMLineAlgorithms(row, newBOM);
    }
    function resortOffers(sort){
        const newTable = [...tableBOM].map((line) => {
            apisList.forEach((api) => {
                if(line[api].offers.length > 1){
                    const sortedOffers = sortAlgorithm(sort, line[api].offers);
                    line[api].offers = sortedOffers;
                }
            });
            return line;
        });
        return newTable;
    }
    function lineAlgorithmsModify(line, algoData){
        //const algos = i===null ? algoData : algoData[]
        const bestPrice = algoData.bestprice;
        const leadTime = algoData.leadtime;
        const priceHL = bestPrice ? 
        {api: bestPrice.api, offerNum: bestPrice.offerNum} : null;
        const leadtimeHL = leadTime ? 
        {api: leadTime.api, offerNum: leadTime.offerNum} : null;
        line.highlights = {
            price: priceHL,
            lead_time: leadtimeHL
        }
        if(bestPrice){
            line.offerEvaluation.bestprice = {
                offers: [bestPrice],
                quantity_found: bestPrice.quantity,
                total_price: bestPrice.total,
                fully_evaluated: bestPrice.quantity >= line.quantities.multi
            }
        }
        if(leadTime){
            line.offerEvaluation.leadtime = {
                offers: [leadTime],
                quantity_found: leadTime.quantity,
                total_price: leadTime.total,
                fully_evaluated: leadTime.quantity >= line.quantities.multi
            }
        }
        return line;
    }
    function runBOMAlgorithms(bom){
        if(lineNumsToEvaluate.size === 0){
            axios({
                method: 'POST',
                url: serverUrl+'api/algorithms',
                data: {
                    bom: bom,
                    algorithms: ['simplebestprice', 'leadtime', 'bestprice']
                }
            }).then(response => {
                console.log(response.data);
                const algos = response.data.data; 
                const newTableBOM = [...bom].map((line,i) => {
                    const newLine = lineAlgorithmsModify({...line}, algos[i]);
                    //const newLine = {...line};
                    /*newLine.highlights = {
                        price: algos[i].simplebestprice,
                        lead_time: algos[i].leadtime
                    }*/
                    return newLine;
                });
                setTable(newTableBOM);
            });
        }
    }
    function runBOMLineAlgorithms(row, b=null){
        const bom = b === null ? tableBOM : b;
        if(lineNumsToEvaluate.size === 0){
            axios({
                method: 'POST',
                url: serverUrl+'api/algorithms',
                data: {
                    line: bom[row],
                    algorithms: ['simplebestprice', 'leadtime', 'bestprice']
                }
            }).then((response) => {
                const algos = response.data.data;
                //const newLine = {...tableBOM[row]};
                const newLine = lineAlgorithmsModify({...bom[row]}, algos);
                /*
                newLine.highlights = {
                    price: algos.simplebestprice,
                    lead_time: algos.leadtime
                }*/
                setTable(update(bom, {
                    [row]: {$set: newLine}
                }));
            });
        }
    }
    function waitingRowApi(row, api){
        const newLine = {...tableBOM[row]};
        newLine[api].retry = false;
        newLine[api].message = 'Waiting...';
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTable(newBOM);
    }
    return [tableBOM, setTable, headers, runBOMAlgorithms, 
        runBOMLineAlgorithms, resortOffers, linesComplete, retryForApi,
        waitingRowApi
    ];
}

export function useApiAttributes(){
    const initApiAttrs = [
        {Header: 'Stock', accessor: 'available'},
        {Header: 'MOQ', accessor: 'moq'},
        {Header: 'Lead Time', accessor: 'leadtime'},
        {Header: 'Price', accessor: 'prices'},
        {Header: 'SPQ', accessor: 'spq'},
        {Header: 'Currency', accessor: 'currency'},
        {Header: 'Packaging', accessor: 'packaging'}
    ];
    const [apiAttrs, setApiAttrs] = useState(initApiAttrs);
    return apiAttrs;
}


export function useQuantityMultiplier(tableBOM, apiData, apisList, 
    runBOMAlgorithms, runBOMLineAlgorithms, apiDataProgress){
    const [multiplier, setMultiplier] = useState(1);
    function newLineChangeQuantity(line, single, multi){
        const newLine = {...line};
        newLine.quantities.single = single
        newLine.quantities.multi = multi;
        //const mpnApiData = apiData.get(newLine.mpns.current).data;
        const lineApiData = evalLineApis(newLine, apisList, apiData);
        lineApiData.forEach((lad) => {
            newLine[lad.api].offers = lad.offers;
            newLine[lad.api].offerOrder = lad.offerOrder;
        });
        return newLine;
    }
    function adjustQuantity(newQuantity, row){
        if(newQuantity !== tableBOM[row].quantities.single){
            if(!apiDataProgress.mpnsNotEvaluated.has(tableBOM[row].mpns.current)){
                const newLine = newLineChangeQuantity(tableBOM[row], newQuantity, 
                    newQuantity*multiplier);
                const newTable = update(tableBOM, {
                    [row]: {$set: newLine}
                });
                runBOMLineAlgorithms(row, newTable);
            }
        }
    }
    function handleNewMulti(newMulti){
        if(apiDataProgress.finished){
            if(multiplier !== newMulti){
                const newTable = [...tableBOM].map((line) => {
                    const newLine = newLineChangeQuantity(line, line.quantities.initial,
                        line.quantities.initial*newMulti);
                    return newLine;
                });
                runBOMAlgorithms(newTable);
                setMultiplier(newMulti);
            }
        }
    }
    return [multiplier, adjustQuantity, handleNewMulti];
}

export function evalLineApis(line, apis, apiData, sort='price'){
    const mpn = line.mpns.current;
    const mpnData = apiData.get(mpn).data;
    const outApiData = apis.map((api) => {
        const newOffers = mpnData.apis[api].offers.map((offer) => {
            const {price, index} = findPriceBracket(offer.pricing, 
                line.quantities.multi, offer.moq);
            offer.price = price;
            offer.prices = {
                price: price,
                pricing: offer.pricing,
                pricingIndex: index
            }
            return offer;
        });
        const priceOrder = sortOrderPrice(newOffers);
        const leadTimeOrder = sortOrderLeadTime(newOffers);
        return {
            api: api,
            offers: newOffers, //sortedOffers,
            offerOrder: {
                price: priceOrder,
                lead_time: leadTimeOrder
            },
            message: mpnData.apis[api].message,
            retry: mpnData.apis[api].retry
        };
    });
    return outApiData;
}

function newEvalApi(line, api, singleApiData){
    const newOffers = singleApiData.offers.map((offer) => {
        const {price, index} = findPriceBracket(offer.pricing, 
            line.quantities.multi, offer.moq);
        offer.price = price;
        offer.prices = {
            price: price,
            pricing: offer.pricing,
            pricingIndex: index
        }
        return offer;
    });
    const priceOrder = sortOrderPrice(newOffers);
    const leadTimeOrder = sortOrderLeadTime(newOffers);
    return {
        offers: newOffers, //sortedOffers,
        offerOrder: {
            price: priceOrder,
            lead_time: leadTimeOrder
        },
        //message: mpnData.apis[api].message,
        //retry: mpnData.apis[api].retry
    };
}

//unused overtaken by offerorder
function sortAlgorithm(sort, offers){
    let sortedOffers;
    switch(sort){
        case 'price':
            sortedOffers = sortPrice(offers);
            break;
        case 'lead_time':
            sortedOffers = sortLeadTime(offers);
            break;
        default:
            sortedOffers = offers;
            break;
    }
    return sortedOffers;
}