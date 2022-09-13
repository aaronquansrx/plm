import {useState, useEffect, useMemo} from 'react';

import axios from 'axios';
import update from 'immutability-helper';

import { findPriceBracket, sortPrice, sortLeadTime, 
    sortOrderPrice, sortOrderLeadTime } from '../scripts/Offer';
import {useServerUrl} from '../hooks/Urls';
import { BOMAPITable } from '../components/Tables';

import {offerEvaluation, findBestOffer, allSortApiOffers} from './../scripts/BOMAlgorithms';

import {stockString, algorithmsInitialStructure, algorithmsStockStructure} from './../scripts/AlgorithmVariable';
import _, { forEach } from 'lodash';

const buildtype = process.env.NODE_ENV;

export function useTableBOM(bom, tableHeaders, apis, apiData, 
    testCall, ltco, store, currency, dataProcessingLock, appLock, searchMpn, 
    changeEvaluation, algorithmMode, quantityMultiplier, retryLock, retryMpns, multiRetryData){
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
            line.evaluated = false;
            return line;
        });
    });
    const [tableLock, setTableLock] = useState(true);
    const apisList = apis.map(api => api.accessor);
    const [tableBOM, setTableBOM] = useState(initTableBOM);
    const [filteredTableBOM, setFilteredTableBOM] = useState(initTableBOM);
    const [oldAlgorithmMode, setOldAlgorithmMode] = useState(null);
    const headers = useMemo(() => {
        const headerChangeMap = {
            mpn: 'mpns',
            quantity: 'quantities'
        };
        const addedHeaders = [{Header: 'Apis', accessor: 'activeApis'}/*, {Header: 'Octopart', accessor: 'octopart'}*/];
        if(buildtype !== 'production'){
            addedHeaders.push({Header: 'Octopart', accessor: 'octopart'});
        }
        const allHeaders = tableHeaders.concat(addedHeaders);
        return allHeaders.map((header) => {
            const newHeader = {...header};
            if(newHeader.accessor in headerChangeMap){
                newHeader.accessor = headerChangeMap[newHeader.accessor];
            }
            return newHeader;
        });
    }, [tableHeaders]);
    const [updateTable, setUpdateTable] = useState(0);
    const [lineNumsToEvaluate, setLineNumsToEvaluate] = useState(new Set([...Array(lenBOM).keys()]));
    //const linesComplete = lenBOM - lineNumsToEvaluate.size;
    useEffect(() => {
        /*
        const updateTimeout = lineNumsToEvaluate.size !== 0
        ? setTimeout(() => setUpdateTable(updateTable+1), 1000)
        : null;*/
        let updateTimeout = null;
        if(retryLock.get){
            const evaledLines = [];
            const retrysDone = [];
            console.log(lineNumsToEvaluate);
            console.log(multiRetryData);
            const newTable = [...tableBOM].map((line, i) => {
                if(lineNumsToEvaluate.has(i)){
                    const mpn = line.mpns.current;
                    if(multiRetryData.has(mpn)){
                        //console.log(mpn);
                        const ad = multiRetryData.get(mpn).data;
                        const newLine = processBomLine({...line}, ad);
                        retrysDone.push(mpn);
                        evaledLines.push(i);
                        return newLine;
                    }
                }
                return line;
            });
            setTableBOM(newTable);
            const newLineNumsEval = update(lineNumsToEvaluate, {
                $remove: evaledLines
            });
            
            if(newLineNumsEval.size === 0){
                runBOMAlgorithmsV2(newTable);
                retryLock.set(false)
                changeLocks(false);
            }else{
                updateTimeout = setTimeout(() => setUpdateTable(updateTable+1), 1000);
            }
            
            //changeLocks(false);
            //retryLock.set(false);
        }else if(tableLock){
            const evaledLines = [];
            const newTable = [...tableBOM].map((line, i) => {
                const newLine = {...line};
                const mpn = newLine.mpns.current;
                if(lineNumsToEvaluate.has(i)){
                    if(apiData.has(mpn)){
                        const ad = apiData.get(mpn).data;
                        const quantity = newLine.quantities.multi;
                        const ea = evalApisV2(ad, apisList, quantity);
                        Object.assign(newLine, ea);
                        const best = findBestOffer(newLine);
                        changeBestOffer(newLine, best, algorithmMode);
                        newLine.max_offers = ad.max_offers;
                        newLine.evaluated = true;
                        evaledLines.push(i);
                        /*
                        axios({
                            method: 'POST',
                            url: serverUrl+'api/algorithms',
                            data: {offers: ad, quantity: line.quantities.multi},
                        }).then(response => {
                            //console.log(i);
                            //console.log(response.data);
                            const data = response.data.data;
                            const newOfferLine = lineOfferEvaluation(newLine, data.offers_evaluation);
                            changeBestOffer(newOfferLine, data.best, false, 'price');
                            newTable[i] = newOfferLine;
                            setTable(newTable);
                            toEval.delete(i);
                            setLineNumsToEvaluate(toEval);
                            if(toEval.size === 0){
                                runBOMAlgorithmsV2(newTable);
                                changeLocks(false);
                            }
                        });
                        */
                    }
                }
                return newLine;
            });
            setTableBOM(newTable);
            const newLineNumsEval = update(lineNumsToEvaluate, {
                $remove: evaledLines
            });
            setLineNumsToEvaluate(newLineNumsEval);
            if(newLineNumsEval.size === 0){
                runBOMAlgorithmsV2(newTable);
                changeLocks(false);
            }else{
                updateTimeout = setTimeout(() => setUpdateTable(updateTable+1), 1000);
            }
        }else{
            //for dev
            //redoa
            console.log('devchange');
            if(process.env.NODE_ENV === 'development'){
                const newTable = [...tableBOM].map((line) => {
                    const newLine = processBomLine({...line});
                    return newLine;
                });
                setTableBOM(newTable);
                setLineNumsToEvaluate(new Set());
            }
        }
        return () => {
            if(updateTimeout !== null) clearTimeout(updateTimeout);
        }
    }, [updateTable]);
    useEffect(() => {
        if(searchMpn !== ''){
            searchMpnTableFilter(searchMpn);
        }else{
            setFilteredTableBOM(tableBOM);
        }

    }, [tableBOM, searchMpn]);
    useEffect(() => {
        setLineNumsToEvaluate(new Set([...Array(lenBOM)].keys()));
        setTimeout(() => setUpdateTable(updateTable+1), 200);
        setTableBOM(initTableBOM);
    }, [store, currency]);
    useEffect(() => {
        //runBOMAlgorithms(tableBOM);
    }, [testCall]);
    
    useEffect(() => {
        if(!dataProcessingLock){
            console.log('dplock table process');
            /*
            const newTable = [...tableBOM].map((newLine, i) => {
                const mpn = newLine.mpns.current;
                const ad = apiData.get(mpn).data;
                //console.log(apiData.get(mpn).data);
                //const ea = evalApis(newLine.quantities.multi, apiData.get(mpn).data, apisList);
                //console.log(ad);
                axios({
                    method: 'POST',
                    url: serverUrl+'api/algorithms',
                    data: {offers: ad, quantity: newLine.quantities.multi},
                }).then(response => {
                    //console.log(response.data);
                    //const newOfferLine = lineOfferEvaluation(newLine, response.data.offers);
                    //console.log(newOfferLine);
                    
                    const algos = response.data.data;
                    const newLine = lineAlgorithmsModifyFull({...bom[row]}, algos);
                    setTable(update(bom, {
                        [row]: {$set: newLine}
                    }));
                    
                });
                const ea = evalApisV2(ad, apisList);
                Object.assign(newLine, ea);
                newLine.max_offers = ad.max_offers;
                //newLine.highlights = ad.bests;
                return newLine;
            });
            //console.log(newTable);
            */
            //changeLocks(false);
            //runBOMAlgorithms(newTable);
            //console.log('run algos');
            //runBOMAlgorithmsV2(tableBOM);
            
        }else{
            //setTableLock(true);
            changeLocks(true);
        }
    }, [dataProcessingLock]);
    useEffect(() => {
        //console.log(lineNumsToEvaluate);
        //if(lineNumsToEvaluate.size === 0){
            //runBOMAlgorithmsV2(newTable);
            //retryLock.set(false)
            //changeLocks(false);
        //}
    }, [lineNumsToEvaluate]);
    useEffect(() => {
        if(retryLock.get){
            const retryLines = new Set();
            const retryMpnSet = new Set(retryMpns.map((ret) => ret.mpn));
            tableBOM.forEach((line, i) => {
                if(retryMpnSet.has(line.mpns.current)){
                    retryLines.add(i);
                }
            });
            //console.log(retryLines);
            setLineNumsToEvaluate(retryLines);
            setTimeout(() => setUpdateTable(updateTable+1), 200);
        }
    }, [retryLock.get]);
    useEffect(() => {
        //console.log(algorithmMode);
        const newTable = tableBOM.map((line) => {
            const newLine = {...line};
            const mpn = newLine.mpns.current;
            if(apiData.has(mpn)){
                const best = findBestOffer(newLine);
                if(oldAlgorithmMode){
                    changeBestOffer(newLine, best, algorithmMode, oldAlgorithmMode);
                }else{
                    changeBestOffer(newLine, best, algorithmMode);
                }
            }
            return newLine;
        });
        setOldAlgorithmMode(algorithmMode);
        setTable(newTable);
    }, [algorithmMode]);
    useEffect(() => {
        if(!tableLock){
            const newTable = tableBOM.map((line) => {
                const newLine = {...line};
                const mpn = newLine.mpns.current;
                const quantity = newLine.quantities.initial*quantityMultiplier
                newLine.quantities.single = newLine.quantities.initial;
                newLine.quantities.multi = quantity;
                if(apiData.has(mpn)){
                    const ad = apiData.get(mpn).data;
                    const ea = evalApisV2(ad, apisList, quantity);
                    Object.assign(newLine, ea);
                    const best = findBestOffer(newLine);
                    changeBestOffer(newLine, best, algorithmMode);
                }
                return newLine;
            });
            setTable(newTable);
            runBOMAlgorithmsV2(newTable);
        }
    }, [quantityMultiplier]);
    function changeLocks(bool){
        setTableLock(bool);
        appLock(bool);
    }
    function setTable(table){
        setTableBOM(table);
    }
    function processBomLine(line, newApiData=null, apis=apisList){
        const newLine = {...line};
        const mpn = newLine.mpns.current;
        function doProcess(dt){
            const quantity = newLine.quantities.multi;
            const ea = evalApisV2(dt, apis, quantity);
            Object.assign(newLine, ea);
            const best = findBestOffer(newLine);
            changeBestOffer(newLine, best, algorithmMode);
            newLine.max_offers = dt.max_offers;
        }
        if(newApiData !== null){
            doProcess(newApiData);
        }else if(apiData.has(mpn)){
            const ad = apiData.get(mpn).data;
            doProcess(ad);
        }
        return newLine;
    }
    function retryForApis(row, apis, newRowData){
        const newLine = processBomLine({...tableBOM[row]}, newRowData, apis);
        //console.log(newLine);
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTableBOM(newBOM);
        runBOMAlgorithmsV2(newBOM);
        changeLocks(false);
    }
    function changeMPNLine(row, line, mpn, data=null){
        line.mpns.current = mpn;
        const newLine = processBomLine(line, data);
        if(apiData.has(mpn) || data !== null){
            const newBOM = update(tableBOM, {
                [row]: {$set: newLine}
            });
            setTableBOM(newBOM);
            runBOMAlgorithmsV2(newBOM);
        }
    }
    function changeQuantityLine(row, quantity){
        const line = tableBOM[row];
        line.quantities.single = quantity;
        line.quantities.multi = quantity*quantityMultiplier;
        const newLine = processBomLine(line);
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTableBOM(newBOM);
        runBOMAlgorithmsV2(newBOM);
    }
    function changeActiveApis(apis, row){
        const newActiveApis = [...tableBOM[row].activeApis].map((actApi) => {
            actApi.active = apis[actApi.accessor];
            return actApi;
        });
        let newLine = [...tableBOM[row]];
        newLine.activeApis = newActiveApis;
        newLine = processBomLine(newLine);
        const newTable = update(tableBOM, {
            [row]: newLine
        });
        //console.log(newActiveApis);
        setTable(newTable);
        runBOMAlgorithms(newTable);
    }
    function changeActiveApisGlobal(apis){
        const newTable = [...tableBOM].map((line) => {
            if(!line.lineLock){
                line.activeApis = line.activeApis.map((actApi) => {
                    actApi.active = apis[actApi.accessor];
                    return actApi;
                });
            }
            const newLine = processBomLine(line);
            return newLine;
        });
        setTable(newTable);
        runBOMAlgorithms(newTable);
    }
    function evalMpn(newLine, newData){
        return evalApis(newLine.quantities.multi, newData, apisList);
    }
    function lineOfferEvaluation(line, algoData){
        const retLine = {...line};
        apisList.forEach((api) => {
            retLine[api].offers.forEach((off, i) => {
                off.adjusted_quantity = algoData[api][i].adjusted_quantity;
                off.excess_quantity = algoData[api][i].excess_quantity;
                off.excess_price = algoData[api][i].excess_price;
                off.total_price = algoData[api][i].total_price;
                off.prices.price = algoData[api][i].price_per;
                off.prices.index = algoData[api][i].index;
                off.prices.total = algoData[api][i].total_price;
            });
        });
        return retLine;
    }
    function runBOMAlgorithmsV2(b=null, lt=null){
        const bom = b === null ? tableBOM : b;
        const newLeadtimeCutOff = lt == null ? ltco : lt;
        axios({
            method: 'POST',
            url: serverUrl+'api/algorithms',
            data: {
                bom: bom,
                //algorithms: ['bestpricefull', 'bestleadtimefull', 'offerinfoquantityprices'],
                //in_stock: hasInStock,
                lead_time_cut_off: newLeadtimeCutOff
            }
        }).then(response => {
            //console.log(response);
            console.log(response.data);
            changeEvaluation(response.data.data.totals);
        });
    }
    //may not use
    function runBOMLineAlgorithmsV2(row, b=null){
        const bom = b === null ? tableBOM : b;
        axios({
            method: 'POST',
            url: serverUrl+'api/algorithms',
            data: {
                line: bom[row],
                lead_time_cut_off: ltco
            }
        }).then(response => {
            console.log(response.data);
        });
    }
    function changeBestOffer(line, bests, algoMode, oldAlgoMode=null){
        //console.log(bests);
        line.best = bests;
        const nss = stockString(algoMode.stock);
        if(oldAlgoMode !== null){
            const oss = stockString(oldAlgoMode.stock)
            if(bests[oss][oldAlgoMode.best]){
                const oApi = bests[oss][oldAlgoMode.best].api;
                const oOffer = bests[oss][oldAlgoMode.best].offer_num;
                line[oApi].offers[oOffer].best = false;
            }
        }
        if(bests[nss][algoMode.best]){
            const bApi = bests[nss][algoMode.best].api;
            const bOffer = bests[nss][algoMode.best].offer_num;
            line[bApi].offers[bOffer].best = true;
        }
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
                off.prices.total_price = {
                    stock: stockInfo[api][i].total,
                    noStock: noStockInfo[api][i].total
                }
                off.totalPrice = {
                    stock: stockInfo[api][i].total,
                    noStock: noStockInfo[api][i].total,
                };
                //off.prices.pricingIndex = algorithmsStockStructure(bestPrice.offer_info[api][i].index);
                off.excessQuantity = {
                    stock: stockInfo[api][i].excess_quantity,
                    noStock: noStockInfo[api][i].excess_quantity,
                };
                off.excessPrice = {
                    stock: stockInfo[api][i].excess_price,
                    noStock: noStockInfo[api][i].excess_price,
                }
            });
        });

        return line;
    }
    function runBOMAlgorithms(b=null, lt=null){
        const bom = b === null ? tableBOM : b;
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
            //console.log(response);
            console.log(response.data);
            //const algos = response.data.data;
            /*
            const newTableBOM = [...bom].map((line,i) => {
                const newLine = lineAlgorithmsModifyFull({...line}, algos[i]);
                return newLine;
            });
            setTable(newTableBOM);
            */
            //setTableLock(false);
            //changeLocks(false);
            
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
            /*
            const algos = response.data.data;
            const newLine = lineAlgorithmsModifyFull({...bom[row]}, algos);
            setTable(update(bom, {
                [row]: {$set: newLine}
            }));
            */
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
    return [tableBOM, filteredTableBOM, setTable, headers, runBOMAlgorithmsV2, 
        runBOMLineAlgorithmsV2,
        retryForApis,
        waitingRowApi, changeMPNLine, changeQuantityLine, changeActiveApis,
        changeActiveApisGlobal, evalMpn, tableLock
    ];
}


export function useQuantityMultiplier(tableBOM, apiData, apisList, 
    runBOMAlgorithms, runBOMLineAlgorithms){
    const [multiplier, setMultiplier] = useState(1);
    function newLineChangeQuantity(line, single, multi){
        const newLine = {...line};
        newLine.quantities.single = single
        newLine.quantities.multi = multi;
        //processBomLine();
        return newLine;
    }
    function adjustQuantity(newQuantity, row){
        if(newQuantity !== tableBOM[row].quantities.single){
            //condition handled at input level with lock
            const newLine = newLineChangeQuantity(tableBOM[row], newQuantity, 
                newQuantity*multiplier);
            const newTable = update(tableBOM, {
                [row]: {$set: newLine}
            });
        }
    }
    function handleNewMulti(newM){
        const newMulti = newM === '0' ? 1 : parseInt(newM); 
        //lock handled at input level
        if(multiplier !== newMulti){
            //console.log(newMulti);
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

export function useQuantityMultiplierV2(){
    const [multiplier, setMultiplier] = useState(1);
    function handleChangeMulti(newM){
        const newMulti = newM === '0' ? 1 : parseInt(newM);
        if(multiplier !== newMulti){
            setMultiplier(newMulti);
        }
    }
    return [multiplier, handleChangeMulti];
}

//maybe remove this hook, put inside 
export function useApiRetrys(apiData, apisList, mpnList, retryForApis, waitingRowApi, callApiRetry, 
    setDataProcessingLock, retryAllStart, callApisRetry, setMpnsInProgress, retryMpns){
    function retryApi(mpn, api, rowNum){
        setDataProcessingLock(true);
        setMpnsInProgress(new Set([mpn]));//
        function onComplete(newData){
            retryForApis(rowNum, [api], newData);
            setDataProcessingLock(false);
        }
        waitingRowApi(rowNum, api);
        callApiRetry(mpn, api, onComplete);
    }
    function retryAll(){
        //use a variable extracted after retrys complete
        //console.log(retryMpns);
        
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
        /*
        const mpnRetrysMap = mpnList.reduce((mp, mpn) => {
            if(apiData.has(mpn)){
                const retryApis = apisList.reduce((arrApi, api)=> {
                    if(mpnApisData[api].retry) arrApi.push(api);
                    return arrApi;
                }, []);
                if(retryApis.length > 0){
                    mp[mpn] = retryApis;
                }
                return mp;
            }
        }, {});*/
        //const retryMpns = new Set(mpnRetrys.map((ret) => ret.mpn));
        
        //retryAllStart(retryMpns);
        /*
        function onComplete(mpn){
            retryMpns.delete(mpn);
            //retryForApis()
            setMpnsInProgress(retryMpns);
            if(retryMpns.size === 0){
                setDataProcessingLock(false);
                //console.log('lock release');
                //console.log(props.apiData);
            }
        }
        callApisRetry(mpnRetrys, onComplete);
        */
    }
    return [retryApi]//, retryAll]//, retryAll];
}

export function useMpnOptions(tableBOM, apiData, apisList, setTable, runBOMLineAlgorithms, 
    callMpn, changeMPNLine, processBomLine){
    const waitingOffer = {
        offers: [],
        offer_order: algorithmsInitialStructure([]),
        message: 'Waiting...',
        retry: false
    };
    function addMpnOption(row, newMpn){
        const newLine = {...tableBOM[row]};
        const ni = newLine.mpns.options.indexOf(newMpn);
        if(ni === -1){
            newLine.mpns.current = newMpn;
            newLine.mpns.options.push(newMpn);
            apisList.forEach((api) => {
                newLine[api] = waitingOffer;
            });
            newLine.max_offers = 1;
            const newTable = update(tableBOM, {
                [row]: {
                    $set: newLine
                }
            });
            setTable(newTable);
            function onComp(data){
                changeMPNLine(row, newLine, newMpn, data);
            }
            callMpn(newMpn, onComp);
        }else{
            newLine.mpns.current = newMpn;
            changeMPNLine(row, newLine, newMpn);
        }
    }
    function changeMpnOption(row, newMpn){
        const newLine = {...tableBOM[row]};
        changeMPNLine(row, newLine, newMpn);
    }
    function editMpnOption(row, oldMpn, newMpn){
        if(oldMpn === newMpn) return;
        const newLine = {...tableBOM[row]};
        const ni = newLine.mpns.options.indexOf(newMpn);
        if(ni !== -1){
            newLine.mpns.current = newMpn;
            changeMPNLine(row, newLine, newMpn);
        }else{
            const i = newLine.mpns.options.indexOf(oldMpn);
            newLine.mpns.options[i] = newMpn;
            newLine.mpns.current = newMpn;
            function onComp(data){
                changeMPNLine(row, newLine, newMpn, data);
            }
            if(apiData.has(newMpn)){
                changeMPNLine(row, newLine, newMpn);
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
    }
    function deleteMpnOption(row, delMpn){
        const newLine = {...tableBOM[row]};
        const i = newLine.mpns.options.indexOf(delMpn);
        const newMpn = i === 0 ? newLine.mpns.options[1] : newLine.mpns.options[i-1];
        newLine.mpns.options.splice(i, 1)
        changeMPNLine(row, newLine, newMpn);
    }
    return [addMpnOption, editMpnOption, deleteMpnOption, changeMpnOption];
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
            pricingIndex: algorithmsStockStructure(index),
            total_price: algorithmsStockStructure(price*quantity),
            //excess: null
        }
        newOffer.adjustedQuantity = null;
        newOffer.excessQuantity = null;
        newOffer.excessPrice = null;
        newOffer.selected = false;
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
            offer_order: algorithmsInitialStructure(order),
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

function evalApisV2(multiApiData, apisList, quantity){
    //console.log(multiApiData);
    const data = multiApiData.apis
    const evaledApis = apisList.reduce((obj, api) => {
        //const order = [...Array(data[api].offers.length).keys()];
        const offers = evalApiV2(data[api], quantity);
        //console.log(offers);
        const order = allSortApiOffers(offers, quantity);
        //console.log(order);
        obj[api] = {
            offers: offers,
            offer_order: order,
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

function evalApiV2(singleApiData, quantity){
    const newOffers = singleApiData.offers.map((offer) => {
        const newOffer = {...offer};
        //console.log(newOffer);
        const oe = offerEvaluation(newOffer, quantity);
        Object.assign(newOffer, oe);
        /*
        newOffer.price = 0;
        //newOffer.prices = null;
        newOffer.adjusted_quantity = null;
        newOffer.excess_quantity = null;
        newOffer.excess_price = null;
        newOffer.selected = false;
        */
        return newOffer;
    }); 
    return newOffers;
}

/*
function algorithmsInitialStructure(value=null){
    return {
        in_stock: {
            price: value,
            leadtime: value
        },
        no_stock: {
            price: value,
            leadtime: value
        }
    }
}
function algorithmsStockStructure(value=null){
    return {
        in_stock: value,
        no_stock: value
    }
}
*/

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
