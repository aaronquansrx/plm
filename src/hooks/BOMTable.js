import {useState, useEffect, useMemo} from 'react';

import axios from 'axios';
import update from 'immutability-helper';

import { findPriceBracket, sortPrice, sortLeadTime, 
    sortOrderPrice, sortOrderLeadTime } from '../scripts/Offer';
import {useServerUrl} from '../hooks/Urls';

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
            line.offerEvaluation = {
                offers: [],
                quantity_found: 0,
                total_price: 0,
                fully_evaluated: 0 >= line.quantities.multi
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
                            message: ad.message
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
        //console.log(newTable);
        //setTable(newTable);
        return newTable;
    }
    function runBOMAlgorithms(bom){
        if(lineNumsToEvaluate.size === 0){
            axios({
                method: 'POST',
                url: serverUrl+'api/algorithms',
                data: {
                    bom: bom,
                    algorithms: ['simplebestprice', 'leadtime']
                }
            }).then(response => {
                console.log(response.data)
                const algos = response.data.data; 
                const newTableBOM = [...bom].map((line,i) => {
                    const newLine = {...line};
                    newLine.highlights = {
                        price: algos[i].simplebestprice,
                        lead_time: algos[i].leadtime
                    }
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
                    algorithms: ['simplebestprice', 'leadtime']
                }
            }).then((response) => {
                const algos = response.data.data;
                const newLine = {...tableBOM[row]};
                newLine.highlights = {
                    price: algos.simplebestprice,
                    lead_time: algos.leadtime
                }
                setTable(update(tableBOM, {
                    [row]: {$set: newLine}
                }));
            });
        }
    }
    return [tableBOM, setTable, headers, runBOMAlgorithms, runBOMLineAlgorithms, resortOffers];
}

export function useApiAttributes(){
    const initApiAttrs = [
        {Header: 'Stock', accessor: 'available'},
        {Header: 'MOQ', accessor: 'moq'},
        {Header: 'Lead Time', accessor: 'leadtime'},
        {Header: 'Price', accessor: 'prices'},
        {Header: 'SPQ', accessor: 'spq'},
        {Header: 'Currency', accessor: 'currency'}
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
    //console.log(mpnData);
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
            message: mpnData.apis[api].message
        };
    });
    return outApiData;
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