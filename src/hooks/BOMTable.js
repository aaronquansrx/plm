import {useState, useEffect, useMemo} from 'react';

import axios from 'axios';
import update from 'immutability-helper';

import { findPriceBracket, sortPrice, sortLeadTime, 
    sortOrderPrice, sortOrderLeadTime } from '../scripts/Offer';
import {useServerUrl} from '../hooks/Urls';
import { BOMAPITable } from '../components/Tables';

export function useTableBOM(bom, tableHeaders, apis, apiData, 
    testCall, ltco, store, currency, dataProcessingLock, appLock, searchMpn){
    const serverUrl = useServerUrl();
    const lenBOM = bom.length;
    const initTableBOM = useMemo(() => {
        return bom.map((line, i) => {
            line.rowNum = i;
            line.selectedOffers = [];
            //line.octopart = line.mpn;
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
            /*
            line.highlights = {
                price: null,
                lead_time: null
            }*/
            line.highlights = algorithmsInitialStructure();
            //have offer evaluation for best price and lead time
            line.offerEvaluation = {
                price: {
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
        });
    });
    const [tableLock, setTableLock] = useState(true);
    const apisList = apis.map(api => api.accessor);
    const [tableBOM, setTableBOM] = useState(initTableBOM);
    const [filteredTableBOM, setFilteredTableBOM] = useState(initTableBOM);
    const headers = useMemo(() => {
        const headerChangeMap = {
            mpn: 'mpns',
            quantity: 'quantities'
        };
        const addedHeaders = [{Header: 'Apis', accessor: 'activeApis'}, {Header: 'Octopart', accessor: 'octopart'}];
        const allHeaders = tableHeaders.concat(addedHeaders);
        return allHeaders.map((header) => {
            const newHeader = {...header};
            if(newHeader.accessor in headerChangeMap){
                newHeader.accessor = headerChangeMap[newHeader.accessor];
            }
            return newHeader;
        });
    }, [tableHeaders]);
    const [initUpdateTable, setInitUpdateTable] = useState(0);
    const [lineNumsToEvaluate, setLineNumsToEvaluate] = useState(new Set([...Array(lenBOM).keys()]));
    //const linesComplete = lenBOM - lineNumsToEvaluate.size;
    useEffect(() => {
        const updateTimeout = lineNumsToEvaluate.size !== 0 
        ? setTimeout(() => setInitUpdateTable(initUpdateTable+1), 1000)
        : null;
        //test new table (also put in new function)
        if(tableLock){
            const newMpns = [];
            const newTable = [...tableBOM].map((line, i) => {
                const newLine = {...line};
                const mpn = newLine.mpns.current;
                if(lineNumsToEvaluate.has(i)){
                    if(apiData.has(mpn)){
                        newMpns.push(i);
                        const ea = evalApis(newLine.quantities.multi, apiData.get(mpn).data, apisList);
                        Object.assign(newLine, ea);
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
        }
        return () => {
            clearTimeout(updateTimeout);
        }
    }, [initUpdateTable]);
    useEffect(() => {
        if(searchMpn !== ''){
            searchMpnTableFilter(searchMpn);
        }else{
            setFilteredTableBOM(tableBOM);
        }

    }, [tableBOM, searchMpn]);
    useEffect(() => {
        setLineNumsToEvaluate(new Set([...Array(lenBOM)].keys()));
        setInitUpdateTable(initUpdateTable+1);
        setTableBOM(initTableBOM);
    }, [store, currency]);
    useEffect(() => {
        //runBOMAlgorithms(tableBOM);
    }, [testCall]);
    useEffect(() => {
        //runBOMAlgorithms(tableBOM);
    }, [lineNumsToEvaluate]);
    
    useEffect(() => {
        if(!dataProcessingLock){
            const newTable = [...tableBOM].map((newLine, i) => {
                const mpn = newLine.mpns.current;
                //console.log(apiData.get(mpn).data);
                const ea = evalApis(newLine.quantities.multi, apiData.get(mpn).data, apisList);
                Object.assign(newLine, ea);
                newLine.maxOffers = apiData.get(mpn).data.maxOffers;
                return newLine;
            });
            console.log(newTable);
            runBOMAlgorithms(newTable);
            console.log('run algos');
        }else{
            //setTableLock(true);
            changeLocks(true);
        }
    }, [dataProcessingLock]);
    function changeLocks(bool){
        setTableLock(bool);
        appLock(bool);
    }
    function setTable(table){
        setTableBOM(table);
    }
    function retryForApi(row, api, newRowData){
        const newLine = {...tableBOM[row]};
        const ea = evalApis(newLine.quantities.multi, newRowData, [api]);
        Object.assign(newLine, ea);
        newLine.maxOffers = Math.max(newLine.maxOffers, newRowData.apis[api].offers.length);
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        runBOMLineAlgorithms(row, newBOM);
    }
    function changeMPNLine(row, newLine, mpn){
        //const newLine = {...tableBOM[row]};
        newLine.mpns.current = mpn;
        const ea = evalApis(newLine.quantities.multi, apiData.get(mpn).data, apisList);
        Object.assign(newLine, ea);
        newLine.maxOffers = apiData.get(mpn).data.maxOffers;
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        runBOMLineAlgorithms(row, newBOM);
    }
    function evalMpn(newLine, newData){
        return evalApis(newLine.quantities.multi, newData, apisList);
    }
    function lineAlgorithmsModifyFull(line, algoData){
        const stockOnly = algoData.in_stock_only;
        const notStockOnly = algoData.not_stock_only;

        //best price
        const bestPrice = stockOnly.bestpricefull;
        const bestPriceNoStock = notStockOnly.bestpricefull;
        const priceHL = bestPrice.best ? {api: bestPrice.best.api, offerNum: bestPrice.best.offerNum} : null;
        const priceNoStockHL = bestPriceNoStock.best ? 
        {api: bestPriceNoStock.best.api, offerNum: bestPriceNoStock.best.offerNum} : null;

        //lead time
        const leadTime = stockOnly.bestleadtimefull;
        const leadTimeNoStock = notStockOnly.bestleadtimefull;
        const leadtimeHL = leadTime.best ? 
            {api: leadTime.best.api, offerNum: leadTime.best.offerNum} : null;
        const leadtimeNoStockHL = leadTimeNoStock.best ? 
            {api: leadTimeNoStock.best.api, offerNum: leadTimeNoStock.best.offerNum} : null;

        line.highlights.stock.price = priceHL;
        line.highlights.noStock.price = priceNoStockHL;
        line.highlights.stock.leadTime = leadtimeHL;
        line.highlights.noStock.leadTime = leadtimeNoStockHL;
        if(bestPrice.best){
            line.offerEvaluation.price = {
                offers: [bestPrice.best],
                quantity_found: bestPrice.best.quantity,
                total_price: bestPrice.best.total,
                fully_evaluated: bestPrice.best.quantity >= line.quantities.multi
            }
        }else{
            line.offerEvaluation.price = {
                offers: [],
                quantity_found: 0,
                total_price: 0,
                fully_evaluated: false
            }
        }
        if(leadTime.best){
            line.offerEvaluation.leadtime = {
                offers: [leadTime.best],
                quantity_found: leadTime.best.quantity,
                total_price: leadTime.best.total,
                fully_evaluated: leadTime.best.quantity >= line.quantities.multi
            }
        }else{
            line.offerEvaluation.leadtime = {
                offers: [],
                quantity_found: 0,
                total_price: 0,
                fully_evaluated: false
            }
        }
        const stockInfo = stockOnly.offerinfoquantityprices;
        const noStockInfo = notStockOnly.offerinfoquantityprices;
        apisList.forEach((api) => {
            line[api].offerOrder.stock.price = bestPrice.sort[api];
            line[api].offerOrder.noStock.price = bestPriceNoStock.sort[api];
            line[api].offerOrder.stock.leadTime = leadTime.sort[api];
            line[api].offerOrder.noStock.leadTime = leadTimeNoStock.sort[api];

            line[api].offers.forEach((off, i) => {
                //if(!stockInfo[api][i] || !noStockInfo[api][i]) return;
                off.adjustedQuantity = {
                    stock: stockInfo[api][i].quantity,
                    noStock: noStockInfo[api][i].quantity
                };

                off.prices.price = {
                    stock: stockInfo[api][i].price_per,
                    noStock: noStockInfo[api][i].price_per,
                };
                off.prices.pricingIndex = {
                    stock: stockInfo[api][i].index,
                    noStock: noStockInfo[api][i].index
                };
                off.totalPrice = {
                    stock: stockInfo[api][i].total,
                    noStock: noStockInfo[api][i].total,
                };
                //off.prices.pricingIndex = algorithmsStockStructure(bestPrice.offer_info[api][i].index);
            });
        });

        return line;
    }
    function runBOMAlgorithms(bom, lt=null){
        const newLeadtimeCutOff = lt == null ? ltco : lt;
        const hasInStock = true;
        axios({
            method: 'POST',
            url: serverUrl+'api/algorithms',
            data: {
                bom: bom,
                algorithms: ['bestpricefull', 'bestleadtimefull', 'offerinfoquantityprices'],
                in_stock: hasInStock,
                lead_time_cut_off: newLeadtimeCutOff
            }
        }).then(response => {
            console.log(response.data);
            const algos = response.data.data;
            const newTableBOM = [...bom].map((line,i) => {
                const newLine = lineAlgorithmsModifyFull({...line}, algos[i]);
                return newLine;
            });
            setTable(newTableBOM);
            //setTableLock(false);
            changeLocks(false);
        });
    }
    function runBOMLineAlgorithms(row, b=null){
        const bom = b === null ? tableBOM : b;
        const hasInStock = true;
        axios({
            method: 'POST',
            url: serverUrl+'api/algorithms',
            data: {
                line: bom[row],
                algorithms: ['bestpricefull', 'bestleadtimefull', 'offerinfoquantityprices'],
                in_stock: hasInStock,
                lead_time_cut_off: ltco
            }
        }).then(response => {
            console.log(response.data);
            const algos = response.data.data;
            const newLine = lineAlgorithmsModifyFull({...bom[row]}, algos);
            setTable(update(bom, {
                [row]: {$set: newLine}
            }));
        });
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
    function searchMpnTableFilter(searchTerm){
        const loweredSearchTerm = searchTerm.toLowerCase();
        const filtered = tableBOM.reduce((arr, line) => {
            if(line.mpnOptions.findIndex((mpn) => mpn.toLowerCase().includes(loweredSearchTerm)) !== -1){
                arr.push(line);
            }
            return arr;
        }, []);
        setFilteredTableBOM(filtered);
        return filtered;
    }
    return [tableBOM, filteredTableBOM, setTable, headers, runBOMAlgorithms, 
        runBOMLineAlgorithms,
        retryForApi,
        waitingRowApi, changeMPNLine, evalMpn, tableLock
    ];
}

export function useApiAttributes(){
    const initApiAttrs = [
        {Header: 'Stock', accessor: 'available'},
        {Header: 'MOQ', accessor: 'moq'},
        {Header: 'Lead Time', accessor: 'leadtime'},
        {Header: 'Price', accessor: 'prices'},
        {Header: 'SPQ', accessor: 'spq'},
        {Header: 'Adj. Q', accessor: 'adjustedQuantity'},
        {Header: 'Packaging', accessor: 'packaging'}
    ];
    const [apiAttrs, setApiAttrs] = useState(initApiAttrs);
    return apiAttrs;
}


export function useQuantityMultiplier(tableBOM, apiData, apisList, 
    runBOMAlgorithms, runBOMLineAlgorithms){
    const [multiplier, setMultiplier] = useState(1);
    function newLineChangeQuantity(line, single, multi){
        const newLine = {...line};
        newLine.quantities.single = single
        newLine.quantities.multi = multi;
        //const mpnApiData = apiData.get(newLine.mpns.current).data;
        const mpn = newLine.mpns.current;
        const ea = evalApis(newLine.quantities.multi, apiData.get(mpn).data, apisList);
        Object.assign(newLine, ea);
        /*
        const lineApiData = evalLineApis(newLine, apisList, apiData);
        lineApiData.forEach((lad) => {
            newLine[lad.api].offers = lad.offers;
            newLine[lad.api].offerOrder = lad.offerOrder;
        });
        */
        return newLine;
    }
    function adjustQuantity(newQuantity, row){
        if(newQuantity !== tableBOM[row].quantities.single){
            //condition handled at input level with lock
            //if(!mpnsInProgress.has(tableBOM[row].mpns.current)){
                const newLine = newLineChangeQuantity(tableBOM[row], newQuantity, 
                    newQuantity*multiplier);
                const newTable = update(tableBOM, {
                    [row]: {$set: newLine}
                });
                runBOMLineAlgorithms(row, newTable);
            //}
        }
    }
    function handleNewMulti(newM){
        const newMulti = newM === '0' ? 1 : parseInt(newM); 
        //lock handled at input level
        if(multiplier !== newMulti){
            console.log(newMulti);
            const newTable = [...tableBOM].map((line) => {
                const newLine = newLineChangeQuantity(line, line.quantities.initial,
                    line.quantities.initial*newMulti);
                return newLine;
            });
            runBOMAlgorithms(newTable);
            setMultiplier(newMulti);
        }
        return newMulti;
    }
    return [multiplier, adjustQuantity, handleNewMulti];
}

export function useApiRetrys(apiData, apisList, mpnList, retryLine, waitingRowApi, callApiRetry, 
    setDataProcessingLock, retryAllStart, callApisRetry, setMpnsInProgress){
    function retryApi(mpn, api, rowNum){
        setDataProcessingLock(true);
        setMpnsInProgress([api]);
        function onComplete(newData){
            retryLine(rowNum, api, newData);
            setDataProcessingLock(false);
        }
        waitingRowApi(rowNum, api);
        callApiRetry(mpn, api, onComplete);
    }
    function retryAll(){
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
        const retryMpns = new Set(mpnRetrys.map((ret) => ret.mpn));
        retryAllStart(retryMpns);
        function onComplete(mpn){
            retryMpns.delete(mpn);
            setMpnsInProgress(retryMpns);
            if(retryMpns.size === 0){
                setDataProcessingLock(false);
                //console.log('lock release');
                //console.log(props.apiData);
            }
        }
        callApisRetry(mpnRetrys, onComplete);
    }
    return [retryApi, retryAll]//, retryAll];
}

export function useMpnOptions(tableBOM, apiData, apisList, setTable, runBOMLineAlgorithms, 
    callMpn, changeMPNLine){
    const waitingOffer = {
        offers: [],
        offerOrder: {
            stock: {price: [], leadTime: []},
            noStock: {price: [], leadTime: []}
        },
        message: 'Waiting...',
        retry: false
    };
    function addMpnOption(row){
        const newLine = {...tableBOM[row]};
        newLine.mpns.current = '';
        newLine.mpns.options.push('');
        apisList.forEach((api) => {
            newLine[api] = waitingOffer;
        });
        newLine.maxOffers = 1;
        const newTable = update(tableBOM, {
            [row]: {
                $set: newLine
            }
        });
        setTable(newTable);
    }
    function editMpnOption(row, oldMpn, newMpn){
        const newLine = {...tableBOM[row]};
        const i = newLine.mpns.options.indexOf(oldMpn);
        newLine.mpns.options[i] = newMpn;
        newLine.mpns.current = newMpn;
        function onComp(data){
            //const ea = evalMpn(newLine, data);
            const ea = evalApis(newLine.quantities.multi, data, apisList);
            Object.assign(newLine, ea);
            newLine.maxOffers = data.maxOffers;
            const newBOM = update(tableBOM, {
                [row]: {$set: newLine}
            });
            runBOMLineAlgorithms(row, newBOM);
        }
        if(apiData.has(newMpn)){
            onComp(apiData.get(newMpn).data);
        }else{
            apisList.forEach((api) => {
                newLine[api] = waitingOffer;
            });
            const newBOM = update(tableBOM, {
                [row]: {$set: newLine}
            });
            setTable(newBOM);
            callMpn(newMpn, onComp);
        }
    }
    function deleteMpnOption(row, delMpn){
        const newLine = {...tableBOM[row]};
        const i = newLine.mpns.options.indexOf(delMpn);
        const newMpn = i === 0 ? newLine.mpns.options[1] : newLine.mpns.options[i-1];
        newLine.mpns.options.splice(i, 1)
        changeMPNLine(row, newLine, newMpn);
    }
    return [addMpnOption, editMpnOption, deleteMpnOption];
}

function evalApi(quantity, singleApiData){
    const newOffers = singleApiData.offers.map((offer) => {
        const newOffer = {...offer};
        const {price, index} = findPriceBracket(newOffer.pricing, 
            quantity, newOffer.moq);
        newOffer.price = price;
        newOffer.prices = {
            price: algorithmsStockStructure(price),
            pricing: offer.pricing,
            pricingIndex: algorithmsStockStructure(index)
        }
        newOffer.adjustedQuantity = null;
        newOffer.excess = null;
        return newOffer;
    }); 
    return newOffers;
}
function evalApis(quantity, multiApiData, apisList){
    //console.log(multiApiData);
    const data = multiApiData.apis
    const evaledApis = apisList.reduce((obj, api) => {
        const order = [...Array(data[api].offers.length).keys()];
        obj[api] = {
            offers: evalApi(quantity, data[api]),
            offerOrder: algorithmsInitialStructure(order),
            message: data[api].message,
            retry: data[api].retry
        }
        /*
        obj[api].offers = evalApi(quantity, multiApiData.apis[api]);
        obj[api].message = multiApiData[api].message;
        obj[api].retry = multiApiData[api].retry;*/
        return obj;
    }, {});
    return evaledApis;
}

function algorithmsInitialStructure(value=null){
    return {
        stock: {
            price: value,
            leadTime: value
        },
        noStock: {
            price: value,
            leadTime: value
        }
    }
}
function algorithmsStockStructure(value=null){
    return {
        stock: value,
        noStock: value
    }
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
