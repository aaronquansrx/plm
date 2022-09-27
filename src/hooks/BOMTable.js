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
    changeEvaluation, algorithmMode, quantityMultiplier, retryLock, retryMpns, multiRetryData, singleRetryData){
    const serverUrl = useServerUrl();
    const lenBOM = bom.length;
    const initTableBOM = useMemo(() => {
        return bom.map((line, i) => {
            line.rowNum = i;
            line.selectedOffers = [];
            line.octopart = {requested: false, data: null};
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
        const addedHeaders = [{Header: 'Apis', accessor: 'activeApis'}, {Header: 'Octopart', accessor: 'octopart'}];
        /*if(buildtype !== 'production'){
            addedHeaders.push({Header: 'Octopart', accessor: 'octopart'});
        }*/
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
        let updateTimeout = null;
        if(retryLock.get){
            updateTimeout = retryAllProcess(lineNumsToEvaluate);
        }else if(tableLock){
            updateTimeout = newBomProcess(lineNumsToEvaluate);
        }else{
            console.log('devchange');
            if(process.env.NODE_ENV === 'development'){
                const newTable = [...tableBOM].map((line) => {
                    const newLine = processBomLine({...line});
                    return newLine;
                });
                setTableBOM(newTable);
                setLineNumsToEvaluate(new Set());
                changeLocks(false);
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
        const lnte = new Set([...Array(lenBOM)].keys());
        setLineNumsToEvaluate(lnte);
        const updateTimeout = newBomProcess(lnte);
        setTableBOM(initTableBOM);
        return () => {
            if(updateTimeout !== null) clearTimeout(updateTimeout);
        }
    }, [store, currency]);
    useEffect(() => {
        //runBOMAlgorithms(tableBOM);
    }, [testCall]);
    useEffect(() => {
        if(singleRetryData !== null){
            const newLine = processBomLine({...tableBOM[singleRetryData.row]}, 
                singleRetryData.data, [singleRetryData.api]);
            const newTable = update(tableBOM, {
                [singleRetryData.row]: {$set: newLine}
            });
            setTable(newTable);
            runBomAlgorithms(newTable);
            changeLocks(false);
        }
    }, [singleRetryData]);
    useEffect(() => {
        if(!dataProcessingLock){
            console.log('dp false');
        }else{
            console.log('dp true');
            //changeLocks(true);
        }
    }, [dataProcessingLock]);
    useEffect(() => {
        let updateTimeout = null;
        if(retryLock.get){
            const retryLines = new Set();
            const retryMpnSet = new Set(retryMpns.map((ret) => ret.mpn));
            const mpnToApis = retryMpns.reduce((obj, retMpn) => {
                obj[retMpn.mpn] = retMpn.apis;
                return obj;
            }, {})
            const newBOM = [...tableBOM].map((line, i) => {
                if(retryMpnSet.has(line.mpns.current)){
                    const newLine = waitingLineApi(line, mpnToApis[line.mpns.current]);
                    retryLines.add(i);
                    return newLine;
                }
                return line;
            });
            setTableBOM(newBOM);
            setLineNumsToEvaluate(retryLines);
            updateTimeout = retryAllProcess(retryLines);
        }
        return () => {
            if(updateTimeout !== null) clearTimeout(updateTimeout);
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
            runBomAlgorithms(newTable);
        }
    }, [quantityMultiplier]);
    function newBomProcess(lnte){
        let timeout = null;
        const evaledLines = [];
        const newTable = [...tableBOM].map((line, i) => {
            const newLine = {...line};
            const mpn = newLine.mpns.current;
            if(lnte.has(i)){
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
                }
            }
            return newLine;
        });
        setTableBOM(newTable);
        const newLineNumsEval = update(lnte, {
            $remove: evaledLines
        });
        setLineNumsToEvaluate(newLineNumsEval);
        if(newLineNumsEval.size === 0){
            runBomAlgorithms(newTable);
            changeLocks(false);
        }else{
            timeout = setTimeout(() => setUpdateTable(updateTable+1), 1000);
        }
        return timeout;
    }
    function retryAllProcess(lnte){
        const evaledLines = [];
        const retrysDone = [];
        const newTable = [...tableBOM].map((line, i) => {
            if(lnte.has(i)){
                const mpn = line.mpns.current;
                if(multiRetryData.has(mpn)){
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
        const newLineNumsEval = update(lnte, {
            $remove: evaledLines
        });
        
        if(newLineNumsEval.size === 0){
            runBomAlgorithms(newTable);
            retryLock.set(false)
            changeLocks(false);
        }else{
            setTimeout(() => setUpdateTable(updateTable+1), 1000);
        }
    }
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
    function retryApis(row, apis, newRowData){
        const newLine = processBomLine({...tableBOM[row]}, newRowData, apis);
        //console.log(newLine);
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTableBOM(newBOM);
        runBomAlgorithms(newBOM);
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
            runBomAlgorithms(newBOM);
        }
    }
    function changeQuantityLine(quantity, row){
        const line = tableBOM[row];
        line.quantities.single = quantity;
        line.quantities.multi = quantity*quantityMultiplier;
        const newLine = processBomLine(line);
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTableBOM(newBOM);
        runBomAlgorithms(newBOM);
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
        runBomAlgorithms(newTable);
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
        runBomAlgorithms(newTable);
    }
    function runBomAlgorithms(b=null, lt=null){
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
    function waitingLineApi(line, apis){
        const newLine = {...line};
        apis.forEach((api) => {
            newLine[api].retry = false;
            newLine[api].message = 'Waiting...';
        });
        return newLine;
        /*
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTable(newBOM);*/
    }
    function changeWaitingRowApi(row, apis){
        const newLine = waitingLineApi(tableBOM[row], apis);
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
    function octopartLineChange(octoData, row){
        if(octoData){
            const tableLine = {...tableBOM[row]};
            const newOcto = octoData.sellers.map((seller) => {
                //const newOffers = evalApiV2(seller, tableLine.quantities.multi);
                seller.offers = evalApiV2(seller, tableLine.quantities.multi);
                return seller;
            });
            tableLine.octopart = newOcto;
            setTable(update(tableBOM, {
                [row]: {$set: tableLine}
            }));
        }
    }
    return [tableBOM, filteredTableBOM, setTable, headers, runBomAlgorithms, 
        runBOMLineAlgorithmsV2, //retryApis, 
        changeMPNLine, changeQuantityLine, changeActiveApis,
        changeActiveApisGlobal, changeWaitingRowApi, tableLock,
        octopartLineChange
    ];
}

export function useQuantityMultiplierV2(){
    //changeQuantityLine inside useTable
    const [multiplier, setMultiplier] = useState(1);
    function handleChangeMulti(newM){
        const newMulti = newM === '0' ? 1 : parseInt(newM);
        if(multiplier !== newMulti){
            setMultiplier(newMulti);
        }
    }
    return [multiplier, handleChangeMulti];
}

export function useMpnOptions(tableBOM, apiData, apisList, setTable,
    callMpn, changeMPNLine){
    const waitingOffer = {
        offers: [],
        offer_order: algorithmsInitialStructure([]),
        message: 'Waiting...',
        retry: false
    };
    function addMpnOption(row, newMpn){
        if(newMpn === '') return;
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


export function evalApisV2(multiApiData, apisList, quantity){
    const data = multiApiData.apis
    const evaledApis = apisList.reduce((obj, api) => {
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
        return obj;
    }, {});
    return evaledApis;
}

function evalApiV2(singleApiData, quantity){
    const newOffers = singleApiData.offers.map((offer) => {
        const newOffer = {...offer};
        const oe = offerEvaluation(newOffer, quantity);
        Object.assign(newOffer, oe);
        return newOffer;
    }); 
    return newOffers;
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
