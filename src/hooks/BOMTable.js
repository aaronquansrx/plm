import {useState, useEffect, useMemo} from 'react';

import axios from 'axios';
import update from 'immutability-helper';

import { findPriceBracket } from '../scripts/Offer';
import {useServerUrl} from '../hooks/Urls';

export function useTableBOM(req, bom, tableHeaders, apis, apiData, apiDataProgress, testCall){
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
                            message: ad.message
                        };
                    });
                    /*
                    apis.forEach(apiFull => {
                        const api = apiFull.accessor;
                        const newOffers = mpnData.apis[api].offers.map((offer) => {
                            const {price, index} = findPriceBracket(offer.pricing, 
                                line.quantity, offer.moq);
                            offer.price = price;
                            offer.prices = {
                                price: price,
                                pricing: offer.pricing,
                                pricingIndex: index
                            }
                            return offer;
                        });
                        line[api] = {
                            offers: newOffers,
                            message: mpnData.apis[api].message
                        };
                    });
                    */
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
        runBOMAlgorithms(tableBOM);
    }, [testCall]);
    useEffect(() => {
        runBOMAlgorithms(tableBOM);
    }, [lineNumsToEvaluate]);
    function setTable(table){
        setTableBOM(table);
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
                console.log(response.data);
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
    return [tableBOM, setTable, headers, runBOMAlgorithms, runBOMLineAlgorithms];
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
                //setTable(newTable);
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
                //setTable(newTable);
                runBOMAlgorithms(newTable);
                setMultiplier(newMulti);
            }
        }
    }
    return [multiplier, adjustQuantity, handleNewMulti];
}

export function evalLineApis(line, apis, apiData){
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
        return {
            api: api,
            offers: newOffers,
            message: mpnData.apis[api].message
        };
    });
    return outApiData;
}