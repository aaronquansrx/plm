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
    testCall, ltco, store, currency, /*dataProcessingLock,*/ appLock, searchMpn, 
    changeEvaluation, algorithmMode, quantityMultiplier, retryLock, retryMpns, multiRetryData, singleRetryData, filterStates,
    mqm, manufacturerData, stringToManufacturer){
    const serverUrl = useServerUrl();
    const lenBOM = bom.length;
    const initTableBOM = useMemo(() => {
        return bom.map((line, i) => {
            line.rowNum = i;
            line.selectedOffers = [];
            line.manu = {
                bom: 'manufacturer' in line ? line.manufacturer : null,
                linked_manufacturer: null,
                found_manufacturers: [], manufacturer_filter: null,
                database_strings: []
            };
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
            line.status = 'start';
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
    const [currencyStore, setCurrencyStore] = useState({store: store, currency: currency})
    const [tableLock, setTableLock] = useState(true);
    const apisList = apis.map(api => api.accessor);
    const [tableBOM, setTableBOM] = useState(initTableBOM);
    const [filteredTableBOM, setFilteredTableBOM] = useState(initTableBOM);
    const [oldAlgorithmMode, setOldAlgorithmMode] = useState(algorithmMode);
    /*
    const [mpnQuantityMap, setMpnQuantityMap] = useState(new Map(bom.reduce((arr, line) => {
        const mpnQuantities = line.mpnOptions.map((mpn) => {
            return [mpn, line.quantity];
        })
        return arr.concat(mpnQuantities);
    }, [])
    ));*/
    const headers = useMemo(() => {
        const tableAccessorSet = tableHeaders.reduce((st, th) => {
            st.add(th.accessor);
            return st;
        }, new Set());
        const headerChangeMap = {
            mpn: 'mpns',
            quantity: 'quantities'
        };
        const extraHeaders = [{Header: 'Manufacturer', accessor: 'manu'}, {Header: 'Apis', accessor: 'activeApis'}, {Header: 'Octopart', accessor: 'octopart'}];
        const addedHeaders = extraHeaders.reduce((arr, header) => {
            if(!tableAccessorSet.has(header.accessor)){
                arr.push(header);
            }
            return arr;
        }, []);
        
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
    useEffect(() => {
        let updateTimeout = null;
        if(retryLock.get){
            console.log('retryLock');
            updateTimeout = retryAllProcess(lineNumsToEvaluate);
        }else if(tableLock){
            //console.log(lineNumsToEvaluate);
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
        const filterStrings = new Set([...Object.entries(filterStates).reduce((arr, [k, v]) => {
            if(v.show) arr.push(k);
            return arr;
        }, [])]);
        const filtered = searchMpn !== '' 
        ? tableBOM.reduce((arr, line) => {
            const loweredSearchTerm = searchMpn.toLowerCase();
            if(filterStrings.has(line.status) 
            && line.mpns.current.toLowerCase().includes(loweredSearchTerm)){
                arr.push(line);
            }
            return arr;
        }, [])
        : tableBOM.reduce((arr, line) => {
            if(filterStrings.has(line.status)){
                arr.push(line);
            }
            return arr;
        }, []);
        /*
        if(searchMpn !== ''){
            //searchMpnTableFilter(searchMpn);
            //tableFilter(filterStates, searchMpn);
        }else{
            //setFilteredTableBOM(tableBOM);
            //tableFilter(filterStates);
        }*/
        setFilteredTableBOM(filtered);
    }, [tableBOM, searchMpn, filterStates]);
    useEffect(() => {
        let updateTimeout = null;
        if(store !== currencyStore.store || currency !== currencyStore.currency){
            changeLocks(true);
            setTableBOM(initTableBOM);
            console.log('store/curr change');
            const lnte = new Set([...Array(lenBOM)].keys());
            setLineNumsToEvaluate(lnte);
            //setTimeout(() => {
            updateTimeout = newBomProcess(lnte, false);
            //}, 1000);
            setCurrencyStore({store: store, currency: currency});
        }
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
            setTableBOM(newTable);
            runBomAlgorithms(newTable);
            changeLocks(false);
        }
    }, [singleRetryData]);
    useEffect(() => {
        let updateTimeout = null;
        if(retryLock.get){
            console.log('retlock');
            const retryLines = new Set();
            const retryMpnSet = new Set(retryMpns.get.map((ret) => ret.mpn));
            const mpnToApis = retryMpns.get.reduce((obj, retMpn) => {
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
        if(oldAlgorithmMode.best !== algorithmMode.best ||
        oldAlgorithmMode.stock !== algorithmMode.stock){
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
            setTableBOM(newTable);
        }
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
            setTableBOM(newTable);
            runBomAlgorithms(newTable);
            mqm.set(mpnQuantityMatch(newTable));
        }//
    }, [quantityMultiplier]);
    function endBomTableDataProcess(){

    }
    function mpnQuantityMatch(table=null){
        const tb = table !== null ? table : tableBOM;
        const mp = new Map();
        tb.forEach((line) => {
            line.mpns.options.forEach((mpn) => {
                mp.set(mpn, line.quantities.multi);
            });
        });
        return mp;
    }
    function newBomProcess(lnte, runImmediate=true){
        let timeout = null;
        if(runImmediate){
            const evaledLines = [];
            const newTable = [...tableBOM].map((line, i) => {
                const newLine = {...line};
                const mpn = newLine.mpns.current;
                if(lnte.has(i)){
                    if(apiData.has(mpn)){
                        //const nl = processBomLine({...line});
                        const dt = apiData.get(mpn).data;
                        const quantity = newLine.quantities.multi;
                        const gmf = getManufacturerFilter(dt.found_manufacturers, null, newLine.manu.bom);
                        newLine.manu.linked_manufacturer = gmf.linked_manufacturer;
                        newLine.manu.found_manufacturers = dt.found_manufacturers;
                        newLine.manu.manufacturer_filter = gmf.filtered_manufacturers;
                        newLine.manu.database_strings = gmf.database_strings;
                        const ea = evalApisV2(dt, apisList, quantity, gmf.filtered_manufacturers);
                        Object.assign(newLine, ea);
                        const best = findBestOffer(newLine);
                        changeBestOffer(newLine, best, algorithmMode);
                        //newLine.max_offers = ad.max_offers;
                        newLine.evaluated = true;
                        evaledLines.push(i);
                    }
                }
                return newLine;
            });
            const newLineNumsEval = update(lnte, {
                $remove: evaledLines
            });
            setTableBOM(newTable);
            setLineNumsToEvaluate(newLineNumsEval);
            //console.log(newLineNumsEval);
            if(newLineNumsEval.size === 0){
                runBomAlgorithms(newTable);
                changeLocks(false);
                console.log('lock free');
            }else{
                timeout = setTimeout(() => setUpdateTable(updateTable+1), 1000);
            }
            return timeout;
        }
        if(lnte.size > 0){
            timeout = setTimeout(() => setUpdateTable(updateTable+1), 1000);
        }
        return timeout;
    }
    function getManufacturerFilter(foundManufacturers, linkedManufacturer, lineManu=null){
        const out = {filtered_manufacturers: new Set([...foundManufacturers]), linked_manufacturer: linkedManufacturer, database_strings: []};
        if(linkedManufacturer !== null){
            console.log(foundManufacturers);
            const stringSet = new Set([...linkedManufacturer.strings]);
            const found = foundManufacturers.reduce((s, m) => {
                if(stringSet.has(m.toLowerCase())){
                    s.add(m);
                }
                return s;
            }, new Set());
            out.database_strings = linkedManufacturer.strings;
            out.filtered_manufacturers = found;
        }
        else if(lineManu !== null){
            const lowerLineManu = lineManu.toLowerCase();
            if(lowerLineManu in stringToManufacturer.get){
                const manuName = stringToManufacturer.get[lowerLineManu];
                console.log(manufacturerData);
                console.log(foundManufacturers);
                if(manufacturerData.get.has(manuName)){
                    const md = manufacturerData.get.get(manuName);
                    if(foundManufacturers.reduce((bool, mn) => {
                        if (bool) return bool;
                        return md.strings.includes(mn.toLowerCase());
                    }, false)){
                        out.linked_manufacturer = md;
                        const stringSet = new Set([...md.strings]);
                        const found = foundManufacturers.reduce((s, m) => {
                            if(stringSet.has(m.toLowerCase())){
                                s.add(m);
                            }
                            return s;
                        }, new Set());
                        out.database_strings = md.strings;
                        out.filtered_manufacturers = found;
                    }
                }
            }
        }
        return out;
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
            console.log('retry all fin');
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
    function processBomLine(line, mpnApiData=null, apis=apisList, changeManufacturer=false, newManufacturer=null, overwriteManufacturer=false){
        const newLine = {...line};
        const mpn = newLine.mpns.current;
        function doProcess(dt){
            console.log(dt);
            const quantity = newLine.quantities.multi;
            let fm = newLine.manu.manufacturer_filter;
            if(changeManufacturer){
                const bomManu = overwriteManufacturer ? null : newLine.manu.bom;
                console.log(newManufacturer);
                const gmf = getManufacturerFilter(dt.found_manufacturers, newManufacturer, bomManu);
                newLine.manu.linked_manufacturer = gmf.linked_manufacturer;
                newLine.manu.found_manufacturers = dt.found_manufacturers;
                newLine.manu.manufacturer_filter = gmf.filtered_manufacturers;
                newLine.manu.database_strings = gmf.database_strings;
                fm = gmf.filtered_manufacturers;
            }
            const ea = evalApisV2(dt, apis, quantity, fm);
            console.log(ea);
            Object.assign(newLine, ea);
            const best = findBestOffer(newLine);
            changeBestOffer(newLine, best, algorithmMode);
        }
        
        if(mpnApiData !== null){
            doProcess(mpnApiData);
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
        const d = data === null ? null : data.get(mpn).data;
        const newLine = processBomLine(line, d, apisList, true);
        if(apiData.has(mpn) || data !== null){
            const newBOM = update(tableBOM, {
                [row]: {$set: newLine}
            });
            console.log(newLine);
            console.log(newBOM);
            setTableBOM(newBOM);
            runBomAlgorithms(newBOM);
        }
    }
    function changeQuantityLine(quantity, row){
        const q = parseInt(quantity);
        const line = tableBOM[row];
        const newQuantity = q*quantityMultiplier;
        line.quantities.single = q;
        line.quantities.multi = newQuantity;
        const newLine = processBomLine(line, null, apisList, false);
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTableBOM(newBOM);
        runBomAlgorithms(newBOM);
        const mpnQUpdates = line.mpns.options.map((mpn) => {
            return [mpn, newQuantity];
        });
        const mpnQM = update(mqm.get, {
            $add: mpnQUpdates
        });
        mqm.set(mpnQM);
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
        setTableBOM(newTable);
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
        setTableBOM(newTable);
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
            if(response.data.data){
                changeEvaluation(response.data.data.totals);
            }
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
    }
    function changeWaitingRowApi(row, apis){
        const newLine = waitingLineApi(tableBOM[row], apis);
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        setTableBOM(newBOM);
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
        const tableLine = {...tableBOM[row]};
        if(!tableLine.octopart.requested){
            //const tableLine = {...tableBOM[row]};
            const newOcto = octoData.sellers.map((seller) => {
                //const newOffers = evalApiV2(seller, tableLine.quantities.multi);
                seller.offers = evalApiV2(seller, tableLine.quantities.multi);
                return seller;
            });
            tableLine.octopart = {requested: true, data: newOcto};
            setTableBOM(update(tableBOM, {
                [row]: {$set: tableLine}
            }));
        }
    }
    function filterManufacturerOffers(row, linkedManufacturer){
        const tableLine = {...tableBOM[row]};
        const newLine = processBomLine(tableLine, null, apisList, true, linkedManufacturer, true);
        setTableBOM(update(tableBOM, {
            [row]: {$set: newLine}
        }));
        console.log(linkedManufacturer);
    }
    return [tableBOM, filteredTableBOM, setTableBOM, headers, runBomAlgorithms, 
        runBOMLineAlgorithmsV2, //retryApis, 
        changeMPNLine, changeQuantityLine, changeActiveApis,
        changeActiveApisGlobal, changeWaitingRowApi, tableLock,
        octopartLineChange, filterManufacturerOffers
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

export function useMpnOptions(tableBOM, apiData, apisList, setTableBOM,
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
            setTableBOM(newTable);
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
                setTableBOM(newBOM);
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

//manufacturer filter is a set of manufacturers
export function evalApisV2(multiApiData, apisList, quantity, manufacturerFilter=null){
    const data = multiApiData.apis;
    let maxOffers = 0;
    const evaledApis = apisList.reduce((obj, api) => {
        const offers = evalApiV2(data[api], quantity, manufacturerFilter);
        const order = allSortApiOffers(offers, quantity);
        maxOffers = maxOffers < offers.length ? offers.length : maxOffers;
        obj[api] = {
            offers: offers,
            offer_order: order,
            message: data[api].message,
            retry: data[api].retry
        }
        return obj;
    }, {});
    evaledApis.max_offers = maxOffers;
    evaledApis.status = multiApiData.status;
    return evaledApis;
}

function evalApiV2(singleApiData, quantity, manufacturerFilter=null){
    //console.log(singleApiData);
    const newOffers = singleApiData.offers.reduce((arr, offer) => {
        //console.log(offer.api_manufacturer);
        if(manufacturerFilter === null || manufacturerFilter.has(offer.api_manufacturer)){
            const newOffer = {...offer};
            const oe = offerEvaluation(newOffer, quantity);
            Object.assign(newOffer, oe);
            arr.push(newOffer)
        }
        return arr;
    }, []); 
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
