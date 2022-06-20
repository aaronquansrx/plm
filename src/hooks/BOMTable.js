import {useState, useEffect, useMemo} from 'react';

import axios from 'axios';
import update from 'immutability-helper';

import { findPriceBracket, sortPrice, sortLeadTime, 
    sortOrderPrice, sortOrderLeadTime } from '../scripts/Offer';
import {useServerUrl} from '../hooks/Urls';
import { BOMAPITable } from '../components/Tables';

export function useTableBOM(req, bom, tableHeaders, apis, apiData, 
    apiDataProgress, testCall, ltco, store, currency){
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
            const newHeader = {...header};
            if(newHeader.accessor in headerChangeMap){
                newHeader.accessor = headerChangeMap[newHeader.accessor];
            }
            return newHeader;
        });
    }, [tableHeaders]);
    const [initUpdateTable, setInitUpdateTable] = useState(0);
    const [lineNumsToEvaluate, setLineNumsToEvaluate] = useState(new Set([...Array(lenBOM).keys()]));
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
                    const ea = evalApis(newLine.quantities.multi, apiData.get(mpn).data, apisList);
                    Object.assign(newLine, ea);
                    /*
                    const lineApiData = evalLineApis(newLine, apisList, apiData);
                    
                    lineApiData.forEach((ad) => {
                        newLine[ad.api] = {
                            offers: ad.offers,
                            offerOrder: ad.offerOrder, 
                            message: ad.message,
                            retry: apiData.get(mpn).data.apis[ad.api].retry
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
        //console.log(newRowData);
        const newLine = {...tableBOM[row]};
        const ea = evalApis(newLine.quantities.multi, newRowData, [api]);
        Object.assign(newLine, ea);
        //console.log(ea);
        /*
        const newEvalData = newEvalApi(newLine, newRowData);
        //console.log(newEvalData);
        newLine[api] = {
            offers: newEvalData.offers,
            offerOrder: newEvalData.offerOrder,
            message: newRowData.message,
            retry: newRowData.retry
        }
        */
        newLine.maxOffers = Math.max(newLine.maxOffers, newRowData.apis[api].offers.length);
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
    function changeMPNLine(row, newLine, mpn){
        //const newLine = {...tableBOM[row]};
        newLine.mpns.current = mpn;
        const ea = evalApis(newLine.quantities.multi, apiData.get(mpn).data, apisList);
        Object.assign(newLine, ea);
        /*
        const lineApiData = evalLineApis(newLine, apisList, apiData);
        lineApiData.forEach((ad) => {
            newLine[ad.api] = {
                offers: ad.offers,
                offerOrder: ad.offerOrder, 
                message: ad.message,
                retry: apiData.get(mpn).data.apis[ad.api].retry
            };
        });
        */
        newLine.maxOffers = apiData.get(mpn).data.maxOffers;
        const newBOM = update(tableBOM, {
            [row]: {$set: newLine}
        });
        runBOMLineAlgorithms(row, newBOM);
    }
    function evalMpn(newLine, newData){
        return evalApis(newLine.quantities.multi, newData, apisList);
        //return newEvalApis(newLine, newData);
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
    /*
    function lineAlgorithmsModify(line, algoData, hasInStock=false){
        //const algos = i===null ? algoData : algoData[]
        if(!hasInStock){
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
        }else{
            const stockOnly = algoData.in_stock_only;
            const notStockOnly = algoData.not_stock_only;
            const bestPrice = stockOnly.bestprice;
            const bestPriceNoStock = notStockOnly.bestprice;
            const leadTime = stockOnly.leadtime;
            const leadTimeNoStock = stockOnly.leadtime;
            console.log(algoData);
            const priceHL = bestPrice ? 
            {api: bestPrice.api, offerNum: bestPrice.offerNum} : null;
            const leadtimeHL = leadTime ? 
            {api: leadTime.api, offerNum: leadTime.offerNum} : null;
            const priceNoStockHL = bestPriceNoStock ? 
            {api: bestPriceNoStock.api, offerNum: bestPriceNoStock.offerNum} : null;
            const leadtimeNoStockHL = leadTimeNoStock ? 
            {api: leadTimeNoStock.api, offerNum: leadTimeNoStock.offerNum} : null;
            line.highlights = {
                stock: {
                    price: priceHL,
                    leadTime: leadtimeHL
                },
                noStock: {
                    price: priceNoStockHL,
                    leadTime: leadtimeNoStockHL
                }
            }
            if(bestPrice){
                line.offerEvaluation.price = {
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
        }
        return line;
    }
    */
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
        //console.log(stockOnly.offerinfoquantityprices);
        //console.log(notStockOnly.offerinfoquantityprices);
        const stockInfo = stockOnly.offerinfoquantityprices;
        const noStockInfo = notStockOnly.offerinfoquantityprices;
        apisList.forEach((api) => {
            line[api].offerOrder.stock.price = bestPrice.sort[api];
            line[api].offerOrder.noStock.price = bestPriceNoStock.sort[api];
            line[api].offerOrder.stock.leadTime = leadTime.sort[api];
            line[api].offerOrder.noStock.leadTime = leadTimeNoStock.sort[api];
            line[api].offers.forEach((off, i) => {
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
        //const bom = b === null ? tableBOM : b;
        const newLeadtimeCutOff = lt == null ? ltco : lt;
        if(lineNumsToEvaluate.size === 0){
            const hasInStock = true;
            /*
            axios({
                method: 'POST',
                url: serverUrl+'api/algorithms',
                data: {
                    bom: bom,
                    algorithms: ['leadtime', 'bestprice'],
                    in_stock: hasInStock
                }
            }).then(response => {
                console.log(response.data);
                const algos = response.data.data; 
                const newTableBOM = [...bom].map((line,i) => {
                    const newLine = lineAlgorithmsModify({...line}, algos[i], hasInStock);
                    //newLine.
                    //configure sorting here
                    return newLine;
                });
                setTable(newTableBOM);
            });
            */
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
            });
        }
    }
    function runBOMLineAlgorithms(row, b=null){
        const bom = b === null ? tableBOM : b;
        if(lineNumsToEvaluate.size === 0){
            /*
            axios({
                method: 'POST',
                url: serverUrl+'api/algorithms',
                data: {
                    line: bom[row],
                    algorithms: ['leadtime', 'bestprice']
                }
            }).then((response) => {
                const algos = response.data.data;
                //const newLine = {...tableBOM[row]};
                const newLine = lineAlgorithmsModify({...bom[row]}, algos);
                setTable(update(bom, {
                    [row]: {$set: newLine}
                }));
            });
            */
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
        waitingRowApi, changeMPNLine, evalMpn
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
    runBOMAlgorithms, runBOMLineAlgorithms, apiDataProgress){
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
    function handleNewMulti(newM){
        const newMulti = newM === '0' ? 1 : parseInt(newM); 
        if(apiDataProgress.finished){
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
        }
        return newMulti;
    }
    return [multiplier, adjustQuantity, handleNewMulti];
}

/*
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
            offer.adjustedQuantity = null;
            return offer;
        });
        //const priceOrder = sortOrderPrice(newOffers);
        //const leadTimeOrder = sortOrderLeadTime(newOffers);
        const order = [...Array(mpnData.apis[api].offers.length).keys()];
        //console.log(order);
        return {
            api: api,
            offers: newOffers, //sortedOffers,
            offerOrder: algorithmsInitialStructure(order),
            message: mpnData.apis[api].message,
            retry: mpnData.apis[api].retry
        };
    });
    return outApiData;
}
*/

function evalApi(quantity, singleApiData){
    const newOffers = singleApiData.offers.map((offer) => {
        const {price, index} = findPriceBracket(offer.pricing, 
            quantity, offer.moq);
        offer.price = price;
        offer.prices = {
            price: algorithmsStockStructure(price),
            pricing: offer.pricing,
            pricingIndex: algorithmsStockStructure(index)
        }
        offer.adjustedQuantity = null;
        return offer;
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
/*
function newEvalApi(line, singleApiData){
    const newOffers = singleApiData.offers.map((offer) => {
        const {price, index} = findPriceBracket(offer.pricing, 
            line.quantities.multi, offer.moq);
        offer.price = price;
        offer.prices = {
            price: price,
            pricing: offer.pricing,
            pricingIndex: index
        }
        offer.adjustedQuantity = null;
        return offer;
    });
    const priceOrder = sortOrderPrice(newOffers);
    const leadTimeOrder = sortOrderLeadTime(newOffers);
    return {
        offers: newOffers, //sortedOffers,
        offerOrder: {
            stock: {
                price: priceOrder,
                leadTime: leadTimeOrder
            },
            noStock: {
                price: priceOrder,
                leadTime: leadTimeOrder
            }
        },
        //message: mpnData.apis[api].message,
        //retry: mpnData.apis[api].retry
    };
}*/

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
