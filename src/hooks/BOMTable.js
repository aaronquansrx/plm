import {useState, useEffect, useMemo} from 'react';

import { findPriceBracket } from '../scripts/Offer';

export function useTableBOM(req, bom, tableHeaders, apis, apiData){
    const initTableBOM = useMemo(() => {
        return bom.map((line) => {
            line.mpns = {
                mpn: line.mpn,
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
    const [mpnsInitialEvaluated, setMpnsInitialEvaluated] = useState(new Set());
    useEffect(() => {

        const updateTimeout = setTimeout(
            () => setUpdateTable(updateTable+1)
        , 1000);
        //test new table (also put in new function)
        const newTable = [...tableBOM].map((line) => {
            apis.forEach(api => {
                const newOffers = line[api].offers.map((offer) => {
                    const {price, index} = findPriceBracket(offer.pricing, line.quantity, offer.moq);
                    offer.price = price;
                    offer.prices = {
                        price: price,
                        pricingIndex: index
                    }
                    return offer;
                });
                line[api].offers = newOffers;
            });
            return line;
        });
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