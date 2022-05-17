import React, {useEffect, useState, useMemo} from 'react';

import Button from 'react-bootstrap/Button';

import axios from 'axios';
import update from 'immutability-helper';

import { BOMAPITableV2 } from './TableBOM';

import { useServerUrl } from '../hooks/Urls';
import {useBOMCallAPIs, useApiProgress} from '../hooks/PartAPICall';
import {useTableData} from '../hooks/BOMTool';

import { sortOffers, bestPriceDisplay } from '../scripts/Offer';
import { forEach, set } from 'lodash';

const attributeMapConverter = {
    mpn: 'mpns',
    display_quantity: 'quantities'
}

function BOMToolV2(props){
    const apiData = props.apiData;
    //console.log(props.apiData);
    //code to convert attributes for new table
    const bomAttributes = useMemo(() => {
        return props.bomAttributes.map((attr) => {
            if(attr.accessor in attributeMapConverter){
                attr.accessor = attributeMapConverter[attr.accessor];
            }
            return attr;
        });
    }, [props.bomAttributes]);
    //const [algorithmData, setAlgorithmData] = 
    const [s,setS] = useState(false);
    const apiList = useMemo(() => props.apis.map(api=>api.accessor), [props.apis]);
    const mpnList = useMemo(() => {
        //console.log(props.bomLines);
        return props.bomLines.reduce((arr, line) => {
            line.mpnOptions.forEach((mpn) => {
                arr.push(mpn);
            })
            return arr;
        }, []);
    }, [props.bomLines]);
    
    const bomLineMpnMap = useMemo(() => props.bomLines.reduce((obj,line,i) => {
        line.mpnOptions.forEach(mpn => {
            obj[mpn] = i;
        })
        //obj[line.mpn] = i;
        return obj;
    }, {}), [props.bomLines]);

    const [tableData, setTableData, tableFinishedStatus] = useTableData(props.bomLines, apiData, apiList);
    //console.log(mpnList);
    const [apiPartsProgress] = useBOMCallAPIs(s, mpnList, apiList, apiData, props.updateApiData); 
    const apiProgress = useApiProgress(apiData, mpnList);
    function addApiDataLine(line){
        const mpnApiData = apiData.get(line.mpns.current).data;//apiData[line.mpns.current];
        apiList.forEach(api => {
            const tableApiData = apiDataToTable(mpnApiData[api], line.quantity);
            line[api] = tableApiData;
        });
        line.maxOffers = mpnApiData.maxOffers;
        return line;
    }
    const server_url = useServerUrl();
    useEffect(() => {
        if(tableFinishedStatus){
            callAlgo();
        }
    }, [tableFinishedStatus]);
    function callAlgo(){
        console.log('finished table: calling algorithms on table');
        const controller = new AbortController();
        console.log(tableData);
        const apisList = [...Array(tableData.length)].map(() => apiList);
        axios({
            method: 'POST',
            url: server_url+'bestprice',
            data: {
                bom: tableData,
                apis_list: apisList,
                quantity_multi: 1,
                algorithms: ['simple', 'multioffers', 'leadtime']
            },
            signal: controller ? controller.signal : null
        }).then(response => {
            console.log(response.data)
        });
    }

    useEffect(() => {
        /*
        if(apiProgress.allCalled){
            const newTable = tableData.map((line, i) => {
                const newLine = addApiDataLine({...line});
                return newLine;
            });
            setTableData(newTable);
        }*/
    }, [apiProgress]);

    function handleCallApi(){
        setS(true);
    }
    const tableFunctions = {
        mpns: {
            changeOption: changeOption
        },
        quantities: {
            changeQuantity: change
        }
    }
    function changeOption(oldMpn, mpn){
        const lineNum = bomLineMpnMap[oldMpn];
        const singleApiData = apiData.get(mpn).data;//apiData[mpn];
        if(lineNum >= 0){
            const line = {...tableData[lineNum]};
            line.mpns.current = mpn;
            console.log(line);
            apiList.forEach(api => {
                const tableApiData = apiDataToTable(singleApiData[api], line.quantities.multi);
                line[api] = tableApiData;
            });
            const newTable = update(tableData, {
                [lineNum]: {$set: line}
            });
            console.log(newTable);
            setTableData(newTable);
            //setForceChange(forceChange+1);
        }
    }
    function change(newQuantity, rowNum){
        const nq = parseInt(newQuantity);
        const line = {...tableData[rowNum]};
        line.quantities.single = nq;
        line.quantities.multi = nq;
        apiList.forEach(api => {
            const tableApiData = apiDataToTable(line[api], line.quantities.multi);
                line[api] = tableApiData;
        });
        setTableData(update(tableData, {
            [rowNum]: {$set: line}
        }));
    }
    return(
        <div>
        <Button onClick={handleCallApi}>Call API</Button>
        {
           /* apiProgress.allCalled && 'finished' */
        }
        <BOMAPITableV2 data={tableData} bomAttrs={bomAttributes} apis={props.apis} 
        apiAttrs={props.apiAttrs} apisAllCalled={apiProgress.allCalled} 
        functions={tableFunctions}/>
        </div>
    );
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

function toApiData(bomLines, apiRaw, apisMpnData={}){
    const fullData = bomLines.reduce((obj, line) => {
        line.mpnOptions.forEach((mpn) => {
            obj[mpn] = parseApisData(line.quantities.single, apiRaw[mpn]);
        });
        return obj;
    }, {});
    return fullData;
}


function toTableData(bomLines, apiData){
    const fullData = bomLines.map(line => {
        const mpn = line.mpn;
        line.mpns = {
            mpn: mpn,
            options: line.mpnOptions
        }
        line.quantities = {
            initial: line.quantity
        }
        //const quantity = line.quantities.single;
        const mpnApiData = apiData[mpn];
        console.log(mpnApiData);
        Object.entries(mpnApiData).forEach(([k,v]) => {
            line[k] = v;
        });
        return line;
    });
    console.log(fullData);
    return fullData;
}

//function apisData

function parseApisData(quantity, rawData){
    let maxOffers = 0;
    //const output = {};
    if(!rawData) return {};
    const output = Object.entries(rawData).reduce((obj, [api, data]) => {
        if(data.status == 'success'){
            const offers = data.offers;
            const parsedOffers = offers.map((offer) => {
                const {price: displayPrice, index: tableIndex} = bestPriceDisplay(quantity, offer.Quantity.MinimumOrder, offer.Pricing);
                return {
                    available: offer.Quantity.Available,
                    moq: offer.Quantity.MinimumOrder,
                    spq: offer.Quantity.OrderMulti,
                    leadtime: offer.LeadTime,
                    leadtimedays: offer.LeadTimeDays,
                    pricing: offer.Pricing,
                    price: displayPrice,
                    prices: {//displayPrice,
                        table: offer.Pricing,
                        price: displayPrice,
                        tableIndex: tableIndex
                    },
                    currency: offer.Currency
                }
            });
            const sortedOffers = sortOffers(parsedOffers, quantity);
            const offerOutput = {
                offers: sortedOffers, //sortedOffers
                success: true,
                message: data.message
                //length: offers.length
            }
            maxOffers = Math.max(offers.length, maxOffers);
            obj[api] = offerOutput;
        }else{
            obj[api] = {
                offers: [],
                success: false,
                message: 'No Offers'
            }
        }
        obj.maxOffers = maxOffers;
        return obj;
    }, {});
    return output;
}

export default BOMToolV2;