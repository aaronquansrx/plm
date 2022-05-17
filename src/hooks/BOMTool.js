import React, {useEffect, useState} from 'react';
import { sortOffers, bestPriceDisplay } from '../scripts/Offer';

export function useTableData(inputBOM, apiData, apiList){
    const initTableData = inputBOM.map((line) => {
        line.mpns = {
            current: line.mpn,
            options: line.mpnOptions,
            //f: changeOption
        }
        line.quantities = {
            initial: line.quantity,
            single: line.quantity,
            multi: line.quantity
        }
        return line;
    });
    const [tableData, setTableData] = useState(initTableData);
    const [initTableLinesToCall, setInitTableLinesToCall] = useState(new Set([...Array(inputBOM.length).keys()]));
    const [timesUpdated, setTimesUpdated] = useState(0);
    const tableFinishedStatus = initTableLinesToCall.size === 0;
    function addApiDataLine(line){
        const mpnApiData = apiData.get(line.mpns.current).data;//apiData[line.mpns.current];
        apiList.forEach(api => {
            const tableApiData = apiDataToTable(mpnApiData[api], line.quantity);
            line[api] = tableApiData;
        });
        line.maxOffers = mpnApiData.maxOffers;
        return line;
    }
    useEffect(() => {
        function updateTableFunction(){
            const linesComplete = [];
            const newTable = tableData.map((line, i) => {
                let newLine = {...line};
                if(initTableLinesToCall.has(i)){
                    if(apiData.has(line.mpns.current) /*in apiData*/){
                        newLine = addApiDataLine(newLine);
                        linesComplete.push(i);
                    }
                }
                return newLine;
            });
            setTableData(newTable);
            const newStatus = new Set(initTableLinesToCall);
            linesComplete.forEach(l => {
                newStatus.delete(l);
            });
            setInitTableLinesToCall(newStatus);
            console.log(newStatus);
            const timeout = newStatus.size !== 0 ? setTimeout(() => setTimesUpdated(timesUpdated+1), 1000) : null;
            return timeout;
        }
        const updateTableTimeout = updateTableFunction();
        return () => clearTimeout(updateTableTimeout);
    }, [timesUpdated]);
    return [tableData, setTableData, tableFinishedStatus];
}

function apiDataToTable(singleApiData, quantity){
    const offers = singleApiData.offers.map(offer => {
        const {price, index} = bestPriceDisplay(quantity, offer.moq, offer.pricing);
        offer.price = price;
        offer.prices = {
            price: price,
            table: offer.pricing,
            tableIndex: index
        };
        return offer;
    });
    return {
        offers: offers,
        message: singleApiData.message
    };
}