import {useState, useEffect, useMemo} from 'react';

import axios from 'axios';
import update from 'immutability-helper';

import { findPriceBracket } from '../scripts/Offer';
import {useServerUrl} from '../hooks/Urls';

export function useTableBOM(req, bom, tableHeaders, apis, mpnApiData, apiDataProgress, testCall){
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
            const mpn = line.mpns.current;
            if(lineNumsToEvaluate.has(i)){
                if(mpnApiData.has(mpn)){
                    newMpns.push(i);
                    const mpnData = mpnApiData.get(mpn).data;
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
                    line.maxOffers = mpnData.maxOffers;
                }
            }
            return line;
        });
        setLineNumsToEvaluate(update(lineNumsToEvaluate, {
            $remove: newMpns
        }));
        setTableBOM(newTable);
        runBOMAlgorithms(newTable);
        return () => {
            clearTimeout(updateTimeout);
        }
    }, [initUpdateTable]);
    useEffect(() => {
        runBOMAlgorithms(tableBOM);
    }, [testCall]);
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
                //console.log(response.data);
                const algos = response.data.data; 
                const newTableBOM = [...tableBOM].map((line,i) => {
                    const simpleAlgo = algos[i].simplebestprice;
                    const newLine = {...line};
                    newLine.highlights = {
                        price: simpleAlgo,
                        lead_time: algos[i].leadtime
                    }
                    //console.log(line.highlights);
                    return newLine;
                });
                //console.log(newTableBOM);
                setTable(newTableBOM);
            });
        }
    }
    function runBOMLineAlgorithms(row, b=null){
        const bom = b === null ? tableBOM : b;
        axios({
            method: 'POST',
            url: serverUrl+'api/algorithms',
            data: {
                line: bom[row],
                algorithms: ['simplebestprice', 'leadtime']
            }
        }).then(response => {

        });

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

/*
export function useQuantityMultiplier(tableBOM, setTable, apiData, apisList){
    const [multiplier, setMultiplier] = useState(1);
    useEffect(() => {
        const newTable = [...tableBOM].map((line) => {
            const newLine = {...line};
            newLine.quantities.multi = line.quantities.single*multiplier;
            const mpnApiData = apiData.get(line.mpns.current).data;
            const lineApiData = evalLineApis(newLine, apisList, mpnApiData);
            console.log(lineApiData);
            lineApiData.forEach((lad) => {
                newLine[lad.api].offers = lad.offers;
            });
            return newLine;
        });
        setTable(newTable);
    }, [multiplier]);
    return multiplier;
}
*/

export function evalLineApis(line, apis, mpnData){
    //const mpnData = mpnApiData.get(mpn).data;
    const apiData = apis.map((api) => {
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
    return apiData;
}