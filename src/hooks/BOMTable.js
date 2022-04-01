import {useState, useEffect, useMemo} from 'react';

import update from 'immutability-helper';

import { findPriceBracket } from '../scripts/Offer';

export function useTableBOM(req, bom, tableHeaders, apis, mpnApiData){
    const lenBOM = bom.length;
    const initTableBOM = useMemo(() => {
        return bom.map((line) => {
            line.mpns = {
                current: line.mpn,
                options: line.mpnOptions
            }
            line.quantities = {
                initial: line.quantity,
                single: line.quantity,
                multi: line.quantity,
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
        //const headers = tableHeaders.concat(apis);
        return tableHeaders.map((header) => {
            if(header.accessor in headerChangeMap){
                header.accessor = headerChangeMap[header.accessor];
            }
            return header;
        });
    });
    const [updateTable, setUpdateTable] = useState(0);
    const [lineNumsToEvaluate, setLineNumsToEvaluate] = useState(new Set([...Array(lenBOM)].keys()));
    useEffect(() => {
        //change below to !== 0
        const updateTimeout = lineNumsToEvaluate.size !== 0 
        ? setTimeout(() => setUpdateTable(updateTable+1), 1000)
        : null;
        //test new table (also put in new function)
        const newMpns = [];
        const newTable = [...tableBOM].map((line, i) => {
            const mpn = line.mpns.current;
            console.log(mpn);
            if(lineNumsToEvaluate.has(i)){
                if(mpnApiData.has(mpn)){
                    newMpns.push(i);
                    const mpnData = mpnApiData.get(mpn).data;
                    apis.forEach(api => {
                        const newOffers = mpnData.apis[api].offers.map((offer) => {
                            const {price, index} = findPriceBracket(offer.pricing, line.quantity, offer.moq);
                            console.log(price);
                            offer.price = price;
                            offer.prices = {
                                price: price,
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
        console.log(newMpns);
        setLineNumsToEvaluate(update(lineNumsToEvaluate, {
            $remove: newMpns
        }));
        setTableBOM(newTable);

        return () => {
            clearTimeout(updateTimeout);
        }
    }, [updateTable]);
    return [tableBOM, setTableBOM, headers];
}

export function useApiAttributes(){
    const initApiAttrs = [
        {Header: 'Stock', accessor: 'available'},
        {Header: 'MOQ', accessor: 'moq'},
        {Header: 'Lead Time', accessor: 'leadtime'},
        {Header: 'Price', accessor: 'price'},
        {Header: 'SPQ', accessor: 'spq'},
        {Header: 'Currency', accessor: 'currency'}
    ];
    const [apiAttrs, setApiAttrs] = useState(initApiAttrs);
    return apiAttrs;
}