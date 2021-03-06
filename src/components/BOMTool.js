import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import axios from 'axios';
import _ from 'lodash';

import {BOMAPITable, BestPriceTable} from './Tables'; 
import {BOMAPITableV2} from './TableBOM';
import {SimpleProgressBar, BomApiProgressBar} from './Progress';
import {BomApiCheckBoxModal} from './Modals';
import BOMExporter from './BOMExporter';
import { NamedCheckBox, IdCheckbox } from './Checkbox';
import { FormAlign, NumberInput } from './Forms';
import {SimpleLabel} from './Offer';
import {sortOffers, simpleBestPrice, bestPriceDisplay} from './../scripts/Offer';

import Button from 'react-bootstrap/Button';

import './../css/temp.css';
import './../css/table.css';
/*
Main tool for working with BOMs
Functions: 
Part lookup
*/

/*
const testHeaders = [{Header: 'MPN', accessor: 'MPN'}, 
{Header: 'Future Electronics', accessor: 'futureelectronics'}, 
{Header: 'Digikey', accessor: 'digikey'}];
*/

const bestPriceHeaders = [
    {
        Header: 'MPN',
        accessor: 'mpn'
    },
    {
        Header: 'Total Price',
        accessor: 'total_price',
        Cell: (r) => r.value.toFixed(2)
    },
    {
        Header: 'Quantity Buying',
        accessor: 'quantity'
    },
    {
        Header: 'Quantity Diff',
        accessor: 'diff'
    },
    {
        Header: 'Offers',
        accessor: 'offers',
        Cell: (r) => {
            const offers = r.value;
            //console.log(offers);
            return (
                <div>
                {offers.map((offer,i) => {
                    return(
                    <div key={i}>
                    <span>Api: {offer.api}</span><span> N: {offer.offerNum}</span>
                    <span> Price: {offer.total.toFixed(2)}</span><span> Quantity: {offer.quantity}</span>
                    <span> Per: {offer.per.toFixed(2)}</span>
                    </div>
                    );
                })}
                </div>
            );
        }
    }
];
const build_type = process.env.NODE_ENV;
const server_url = build_type === 'production' ? 
process.env.REACT_APP_SERVER_URL : process.env.REACT_APP_TEST_URL;

const apiAttrs = [
    {
        Header: 'Stock',
        accessor: 'available'
    },
    {
        Header: 'MOQ',
        accessor: 'moq'
    },
    {
        Header: 'Lead Time',
        accessor: 'leadtime'
    },
    {
        Header: 'Price',
        accessor: 'price'
    },
    {
        Header: 'SPQ',
        accessor: 'spq'
    },
    {
        Header: 'Currency',
        accessor: 'currency'
    }
];

const apiAttrs2 = [
    {
        Header: 'Stock',
        accessor: 'available'
    },
    {
        Header: 'MOQ',
        accessor: 'moq'
    },
    {
        Header: 'Lead Time',
        accessor: 'leadtime'
    },
    {
        Header: 'Price',
        accessor: 'prices'
    },
    {
        Header: 'SPQ',
        accessor: 'spq'
    },
    {
        Header: 'Currency',
        accessor: 'currency'
    }
];
const numHeader = [
{
    Header: 'Quantities',
    accessor: 'quantities',
},  
/*
{
    Header: 'N',
    accessor: 'n'
},*/
/*
{
    Header: 'CBox',
    accessor: 'checkbox',
    Cell: (r) => {
        function handleChange(i){
            console.log(i);
        }
        //console.log(r);
        return <IdCheckbox onChange={handleChange} i={r.row.index} checked={false}/>
    }
}
*/
/*
{
    Header: 'Octopart',
    accessor: 'octopart',
    Cell: (r) => {
        return <Button onClick={requestOctopart(r.value)}>Req</Button>
    }
}*/
];

function BOMTool(props){
    //console.log(props.BOMData);
    const apis = props.BOMData.apis;
    //console.log(apis);
    const numParts = props.BOMData.bom.length;
    const initBomAttrs = props.BOMData.attrs;
    const v2BomAttrs = props.BOMData.attrs.concat(numHeader);
    const initBom = props.BOMData.bom;
    initBom.forEach((line) => {
        line.quantities = {
            display: line.display_quantity,
            single: line.quantity,
            multi: line.quantity
        }
    });
    /*
    if(build_type !== 'production'){
        function reqOcto(mpn){
            return function(){
                console.log(mpn);
                requestOctopart(mpn);
            }
        }
        const octopartHeader = {
            Header: 'Octopart',
            accessor: 'octopart',
            Cell: (r) => {
                return <Button onClick={reqOcto(r.value)}>Req</Button>
            }
        }
        initBomAttrs.push(octopartHeader);
        initBom.forEach((line) => {
            line.octopart = line.mpn;
        });
    }
    initBom.forEach((line) => {
        line.initialQuantity = line.quantity;
    });
    console.log(initBom);
    */
    
    
    //const [partLookupData, setPartLookupData] = useState(Array(props.BOMData.bom.length).fill(null));
    const [bomdata, setBomdata] = useState(initBom);
    const [bomAttrs, setBomAttrs] = useState(initBomAttrs);
    const [apiHeaders, setApiHeaders] = useState([]);
    //const [hasEvaluatedBOMData, setHasEvaluatedBOMData] = useState(null);
    const [bomApiFinished, setBomApiFinished] = useState(false);
    const [bomApiProgress, setBomApiProgress] = useState(Array(numParts).fill(null));
    const [showProgress, setShowProgress] = useState(false);
    //const [bestPriceData, setBestPriceData] = useState(null);
    const [tableView, setTableView] = useState('default');

    const [showApiLineModal, setShowApiLineModal] = useState(false);
    const [bomApiCheckBoxes, setBomApiCheckBoxes] = useState(Array(numParts).fill(
        apis.reduce((obj,api) => {
            obj[api.accessor] = true;
            return obj;
        }, {})
    ));
    
    const [highlightView, setHighlightView] = useState('normal');
    const [lowestPriceOffers, setLowestPriceOffers] = useState(Array(numParts).fill(null));
    const [lowestLeadTime, setLowestLeadTime] = useState(Array(numParts).fill(null));
    //const [lowestPrices] = useState();

    const [priceEvaluation, setPriceEvaluation] = useState({
        totalPrice: null, offers: Array(numParts).fill(null),
        partsComplete: null, partialComplete: null, 
        partsCompleteArray: Array(numParts).fill(false)
    });
    const [bestOfferTable, setBestOfferTable] = useState(Array(numParts).fill(null));
    
    const [octopartMonthlyCalls, setOctopartMonthlyCalls] = useState(null);

    const [showOldTable, setShowOldTable] = useState(false);

    useEffect(() => {
        axios({
            method: 'get',
            url: server_url+'api/octopart'
        }).then(res => {
            setOctopartMonthlyCalls(res.data.limit);
        })
    }, []);
    useEffect(() => {

        //test axios call
        /*
        axios({
            method: 'get',
            url: server_url+'api/part',
            params: {'save_parts': false, part: 'TSAL6100'},
            //signal: controller.signal
        }).then(res =>{
            console.log(res.data);
        });*/

        const mpnList = bomdata.map(line => line.mpn);
        //call api

        //resetting progress bar variables

        setBomApiFinished(false);
        setBomApiProgress(Array(numParts).fill(null));
        setShowProgress(0);
        const controller = new AbortController();
        console.log(numParts);
        if(numParts > 0){
            console.log('calling post parts');
            axios({
                method: 'post',
                url: server_url+'api/part', //?part
                data: new URLSearchParams({
                    parts: mpnList,
                    save: false // set to true to save to db
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                signal: controller.signal
            }).then(response => {
                console.log(response);
            });
        }
        callApis(controller);

        //Working Promise
        /*
        const partRequests = props.BOMData.BOM.map(line => {
            return axios({
                method: 'get',
                url: 'https://localhost/plmserver/api/part?part='+line['MPN']
            });
        });
        Promise.all(partRequests).then((results) => {
            var ubom = bomdata; 
            //console.log(results);
            for(var i=0;i<results.length;i++){
                const offers = results[i].data.futureelectronics.offers;
                if(offers.length > 0){
                    ubom = update(ubom, {
                        [i]: {$merge: {'URL':offers[0].part_id.web_url} } 
                    });
                    //console.log(offers[0].part_id.web_url);
                }
            }
            //console.log(ubom);
            setBomdata(ubom);
        });
        */
        return () => {
            controller.abort();
        }
    }, [props.BOMData.bom]);
    useEffect(() => {
        const newHeaders = props.BOMData.apis.map((api) => {
            return {
                Header: api.Header,
                accessor: api.accessor,
                Cell: props => {
                    //console.log(props);
                    return api.Header;
                }
            }
        });
        setApiHeaders(newHeaders);

    }, [props.BOMData.apis])
    useEffect(() => {
        const apiFinished = bomApisFinished();
        setBomApiFinished(apiFinished);
        //console.log(bomApiFinished);
        if(apiFinished){
            //const lowestPrices = getLowestPrices(bomdata);
            fullBomRunAlgorithms();
        
        }
    }, [bomApiProgress]);

    useEffect(() => {

    }, []);
    function bomApisFinished(){
        return bomApiProgress.reduce((b, apisn) => {
            if(apisn === null || apisn.length > 0){
                b = false;
            }
            return b;
        }, true);
    }

    function requestOctopart(mpn=null, limit=1){
        console.log(mpn);
        const requestOptions = {
            method: 'get',
            url: server_url+'api/octopart'
        }
        if(mpn){
            requestOptions.params = {search: mpn, limit: limit};
        } 
        console.log(requestOptions);
        axios(requestOptions).then(res => {
            console.log(res.data);
            setOctopartMonthlyCalls(res.data.limit);
        });
    }
    

    function callApis(controller){
        let apiProgress = bomApiProgress;
        let ubom = bomdata;
        function updateBOM(api, i, info){
            ubom = update(ubom, {
                [i]: {$merge: {[api]: info} } 
            });
            setBomdata(ubom);
        }
        function updateBOMOffers(i, info){
            ubom = update(ubom, {
                [i]: {$merge: info}
            });
            setBomdata(ubom);
        }
        /*function updateApiProgress(i, apiErrorList){
            apiProgress = update(apiProgress, {
                [i]: {$set: apiErrorList}
            });
            if(apiErrorList.length === 0){
                const apiFinished = apiProgress.reduce((b, apisn) => {
                    if(apisn === null || apisn.length > 0){
                        b = false;
                    }
                    return b;
                }, true);
                if(apiFinished){
                    setBomApiFinished(apiFinished);
                }
            }
        }*/
        let apiBomData = Array(ubom.length).fill({});
        function callApi(line, i, n, maxCalls, controller, api_name=null, api_list=null){
            // apis being a list of apis to call
            setShowProgress(true);
            const mpn = line.mpn;
            if(n <= maxCalls){
                const callUrl = server_url+'api/part';
                const params = {part: mpn, save_parts: true};
                if(api_name !== null) params.api = api_name;
                axios({
                    method: 'get',
                    url: callUrl,
                    params: params,
                    signal: controller.signal
                }).then(response => {
                    const apisOutput = api_name ? {}:{
                        maxOffers: 0
                    }
                    let maxOffers = 0;
                    //console.log(response);
                    const hasError = [];
                    console.log(response.data);
                    const apis = response.data.apis
                    props.BOMData.apis.forEach((api_header) => {
                        const api = api_header.accessor;
                        if(api in apis){
                            const apiresponse = apis[api];
                            console.log(apiresponse);
                            let offerOutput = {offers: [], success: false};
                            if(apiresponse.status === "success"){
                                /*
                                setHasEvaluatedBOMData(update(hasEvaluatedBOMData, {
                                    [i]: {[api]: {$set: true}}
                                }));*/
                                const offers = apiresponse.offers;
                                //console.log(offers);
                                if(offers.length > 0){
                                    const trimmedOffers = [];
                                    for(const offer of offers){
                                        const {price: displayPrice, index: tableIndex} = bestPriceDisplay(line.quantity, offer.Quantity.MinimumOrder, offer.Pricing);
                                        trimmedOffers.push({
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
                                        });
                                    }
                                    const sortedOffers = sortOffers(trimmedOffers, line.quantity);
                                    offerOutput = {
                                        offers: sortedOffers, //trimmedOffers
                                        success: true,
                                        message: ''
                                        //length: offers.length
                                    }
                                    maxOffers = Math.max(offers.length, maxOffers);
                                    //apisOutput[api] = offerOutput;
                                }else{
                                    offerOutput.message = 'No Offers';
                                }
                            }else if(apiresponse.status === "error"){
                                offerOutput.message = apiresponse.message;
                                console.log({api: api, res: apiresponse, mpn: mpn});
                                if(apiresponse.code === 400 || apiresponse.code === 500 || 
                                apiresponse.code === 403){
                                    //offerOutput.message = apiresponse.message;
                                    console.log('timeout '+line.mpn+' api: '+api);
                                    setTimeout(() => {callApi(line, i, n+1, maxCalls, controller, api)}, 1000);
                                    hasError.push(api);
                                    //instead accumulate apis that need refreshing and call all in another group

                                }
                            }
                            apisOutput[api] = offerOutput;
                        }
                        /*
                        let offerOutput;
                        if(apiresponse.status === "success"){
                            const offers = apiresponse.data;
                            if(offers.length > 0){
                                offerOutput = <SimpleOffer offers={offers}/>
                            }else{
                                offerOutput = (<div>No offers</div>);
                            }
                        }else if(apiresponse.status === "error"){
                            if(apiresponse.code === 400 || apiresponse.code === 500 || 
                                apiresponse.code === 403){
                                //try again
                                offerOutput = (<div>Trying Again</div>);
                                console.log('retry api: '+api+' mpn: '+mpn);
                                setTimeout(callApi(mpn, i, n+1, controller, api), 1000);
                            }else{
                                offerOutput = (<div>Server Unavailable</div>);
                            }
                        }
                        */
                        //console.log(i);
                        //updateBOMOffers(api, i, offerOutput, maxOffers);
                    });
                    
                    apiProgress = update(apiProgress, {
                        [i]: {$set: hasError}
                    });
                    //console.log(apiProgress);
                    setBomApiProgress(apiProgress);

                    if(api_name!==null){
                        if(maxOffers < ubom[i].maxOffers){
                            maxOffers = ubom[i].maxOffers;
                        }
                    }
                    apisOutput['maxOffers'] = maxOffers;
                    apiBomData[i] = apisOutput;
                    updateBOMOffers(i, apisOutput);
                }).catch((err) => {
                    if(axios.isCancel(err)){
                        console.log('cancelled');
                        return 'cancelled';
                    }
                    return err
                });
            }else if(api_name !== null){
                //const offerOutput = (<div>API calls exceeded</div>);
                //updateBOM(api_name, i, offerOutput);
                apiProgress = update(apiProgress, {
                    [i]: {$set: []}
                });
                //console.log(apiProgress);
                setBomApiProgress(apiProgress);

            }
        }
        const maxCalls = 4
        props.BOMData.bom.forEach((line, i) => {
            if('mpn' in line) callApi(line, i, 0, maxCalls, controller);
        });

    }
    function fullBomRunAlgorithms(bom=null, quantityMulti=1){
        const data = bom ? bom : bomdata;
        const apiNames = getActiveApis();
        //full bom request
        axios({
            method: 'POST',
            url: server_url+'api/bestprice',
            data: {
                bom: data,
                apis_list: apiNames,
                quantity_multi: quantityMulti,
                algorithms: ['simple']
            }
        }).then(response => {
            console.log(response.data);
            
            const best = response.data.best;
            const lowestPrices = best.map((line) => {
                const simple = line.simple;
                return simple ? {api: simple.api, offerNum: simple.offerNum} : null;
            });
            setLowestPriceOffers(lowestPrices);
            
        });
        
        axios({
            method: 'POST',
            url: server_url+'api/bestprice',
            data: {
                bom: data,
                apis_list: apiNames,
                quantity_multi: quantityMulti,
                algorithms: ['multioffers']
            }
        }).then(response => {
            console.log(response.data);
            
            const best = response.data.best;
            const bestOffers = best.map((line) => {
                const best = line.multioffers;
                return {offers: best.offers, total: best.total};
            });
            const bestOfferTableFormat = best.map((line, i) => {
                const offs = line.multioffers.offers;
                const tableOffers = offs.map((offer) => {
                    return {
                        api: offer.api, offerNum: offer.offerNum,
                        per: offer.price_per, total: offer.total, quantity: offer.quantity
                    };
                });
                const diff = line.multioffers.quantity_offered - bomdata[i].quantity;
                return {
                    mpn: bomdata[i].mpn, total_price: line.multioffers.total,
                    quantity: line.multioffers.quantity_offered, offers: tableOffers,
                    diff: diff
                };
            });
            //console.log(bestOfferTableFormat);
            setBestOfferTable(bestOfferTableFormat);

            const partialComplete = best.reduce((v, line) => {
                const mo = line.multioffers;
                if(mo.complete && mo.quantity_offered >= 0){
                    return v+1;
                }
                return v;
            }, 0);
            const ptCompArray = best.map((line) => {
                const mo = line.multioffers;
                return mo.complete;
            });
            const bd = response.data.multioffers_breakdown;
            setPriceEvaluation(update(priceEvaluation, {
                totalPrice: {$set: bd.total_price},
                offers: {$set: bestOffers},
                partsComplete: {$set: bd.num_completed_offers},
                partialComplete: {$set: partialComplete},
                partsCompleteArray: {$set: ptCompArray}
            }));
        });


        const noVericalApis = apiNames.map((apis) => {
            return apis.reduce((arr, api) => {
                if(api !== 'verical'){
                    arr.push(api);
                }
                return arr;
            }, []);
        });
        //console.log(noVericalApis);
        axios({
            method: 'POST',
            url: server_url+'api/bestprice',
            data: {
                bom: data,
                apis_list: noVericalApis,
                algorithms: ['leadtime']
            }
        }).then(response => {
            console.log(response.data);
            const best = response.data.best;
            const lowestLeads = best.map(ltOffer => {
                const offer = ltOffer.leadtime.offer;
                if(offer === null){
                    return null;
                }
                return {api: offer.api, offerNum: offer.offerNum};
            });
            setLowestLeadTime(lowestLeads);
        });
    }
    function handlePriceOptions(opt){
        //console.log(opt);
        switch(opt){
            case 'default':
                break;
            case 'prices':
                //bestApiPrice();
                break;
            case 'lead':
                break;
        }
        setTableView(opt);
    }
    function handleHighlightOptions(opt, bom=null){
        switch(opt){
            case 'normal':
                //setLowestPriceOffers(Array(numParts).fill(null));
                break;
            case 'lowest':
                const b = bom ? bom : bomdata;
                const lowestPrices = getLowestPrices(b);
                setLowestPriceOffers(lowestPrices);
                break;
            case 'lead':
                setLowestPriceOffers(lowestLeadTime);
                break;
        }
        setHighlightView(opt);
    }
    function getActiveApis(i=null){
        const activeApis = i !== null 
        ? Object.entries(bomApiCheckBoxes[i]).reduce((arr, [k,v]) => {
            if(v) arr.push(k);
            return arr;
        }, [])
        : bomApiCheckBoxes.map((line) => {
            return Object.entries(line).reduce((arr, [k,v]) => {
                if(v) arr.push(k);
                return arr;
            }, []);
        });
        return activeApis;
    }
    function getLowestPrices(b){
        const lowestPrices = b.map((line, i) => {
            const activeApis = Object.entries(bomApiCheckBoxes[i]).reduce((arr, [k,v]) => {
                if(v) arr.push(k);
                return arr;
            }, []);
            return simpleBestPrice(line, activeApis);
        });
        return lowestPrices;
    }
    
    function quantityBestPrice(line, api_list=[]){
        const quantity = line.quantity ? line.quantity : 0;
        //todo find best price considering quantity
    }
    function showHighlights(){
        return highlightView !== 'normal';
    }
    //console.log(bomApiProgress.map((apis) => apis !== null && apis.length === 0));
    function displayTableView(){
        let v;
        //const tableData = priceEvaluation;
        //console.log(tableData);
        switch(tableView){
            case 'default':
                v = <BOMAPITable data={bomdata} bomAttrs={bomAttrs} apis={apiHeaders} apiSubHeadings={apiAttrs}
                onChangeQuantity={handleChangeQuantity} highlights={lowestPriceOffers} 
                rowsFinished={bomApiProgress.map((a) => a !== null && a.length === 0)}
                showHighlights={showHighlights()}/>;
                break;
            case 'prices':
                v = <>
                {/*Algorithm currently bugged*/}
                {/*<BestPriceResults data={bestPriceData}/>*/}
                {<BestPriceTable data={bestOfferTable} headers={bestPriceHeaders}/>}
                </>
                break;
            case 'lead':
                v = <>Lead Time algorithm not available in this version</>;
            default:
                v = <>This table view is unavailable</>;
                break;
        }
        return v;
    }
    function resetQuantityPriceOffers(row, newQ){
        const newRow = {...row};
        apis.forEach((api) => {
            if(api.accessor in newRow){
                const offers = newRow[api.accessor].offers.map(offer => {
                    const bpd = bestPriceDisplay(newQ, offer.moq, offer.pricing);
                    offer.price = bpd.price;
                    return offer;
                });
                newRow[api.accessor].offers = sortOffers(offers, newQ);
            }
        });
        newRow.quantity = newQ;
        if(newRow.display_quantity !== ''){
            newRow.display_quantity = newQ.toString();
        }
        return newRow;
    }
    function handleChangeQuantity(row, quantity){
        const isFinished = bomApisFinished();
        if(isFinished){
            const newQ = parseInt(quantity);
            const r = bomdata[row];
            const newRow = resetQuantityPriceOffers(r, newQ);
            let newBom = update(bomdata, {
                [row]: {$set: newRow}
                    //quantity: {$set: newQ},
                    //price: {$set: bestPriceDisplay(r, r.moq, r.pricing, newQ)}
            });
            //change rows for the (alternate mpns) i.e rows that have no display quantity
            const rows = [row];
            let nrow = row+1;
            while(nrow < bomdata.length && bomdata[nrow].display_quantity === ''){
                newBom = update(newBom, {
                    [nrow]: {quantity: {$set: newQ}}
                });
                rows.push(nrow);
                nrow++;
            }
            setBomdata(newBom);

            //change rows for the (alternate mpns) i.e rows that have no display quantity (from rows)
            //do algorithm for multi lines
            const apiNames = rows.map((n) => getActiveApis(n));
            console.log(apiNames);
            axios({
                method: 'POST',
                url: server_url+'api/bestprice',
                data: {
                    bom: newBom,
                    lines: rows,
                    apis_list: apiNames,
                    algorithms: ['simple', 'multioffers']
                }
            }).then(response => {
                console.log(response.data);
                const best = response.data.best;
                let lpo = lowestPriceOffers; let pe = priceEvaluation; let bot = bestOfferTable;
                let fullDiff = 0;
                best.forEach((obj, i) => {
                    const simple = obj.simple;
                    const multioffers = obj.multioffers;
                    const n = rows[i];
                    const bestOffer = simple ? {api: simple.api, offerNum: simple.offerNum} : null;
                    lpo = update(lpo, {
                        [n]: {$set: bestOffer}
                    });
                    const newTotal = multioffers.total;
                    const oldOffers = priceEvaluation.offers[n];
                    const oldTotal = oldOffers.total;
                    const diff = oldTotal-newTotal;
                    fullDiff += diff;
                    pe = update(pe, {
                        //totalPrice: {$set: priceEvaluation.totalPrice-diff},
                        offers: {[n]: {$set: multioffers}}
                    });
                    const offs = multioffers.offers;
                    const tableOffers = offs.map((offer) => {
                        return {
                            api: offer.api, offerNum: offer.offerNum,
                            per: offer.price_per, total: offer.total, quantity: offer.quantity
                        };
                    });
                    const qdiff = multioffers.quantity_offered - newBom[n].quantity;
                    const tableLine = {
                        mpn: bomdata[n].mpn, total_price: newTotal,
                        quantity: multioffers.quantity_offered, offers: tableOffers,
                        diff: qdiff
                    };
                    bot = update(bot, {
                        [n]: {$set: tableLine}
                    });
                });
                /*
                const partialComplete = best.reduce((v, line) => {
                    const mo = line.multioffers;
                    if(mo.complete && mo.quantity_offered >= 0){
                        return v+1;
                    }
                    return v;
                }, 0);*/
                const nPartsExistingCompleted = rows.reduce((v, row) => {
                    if(pe.partsCompleteArray[row]){
                        return v+1;
                    }
                    return v;
                }, 0);
                const offersCompleteDiff = nPartsExistingCompleted - response.data.multioffers_breakdown.num_completed_offers;
                pe = update(pe, {
                    totalPrice: {$set: pe.totalPrice-fullDiff},
                    partsComplete: {$set: pe.partsComplete-offersCompleteDiff}
                });
                setLowestPriceOffers(lpo);
                setPriceEvaluation(pe);
                setBestOfferTable(bot);

                /*
                const data = response.data;
                const bestOffer = data.simple ? {api: data.simple.api, offerNum: data.simple.offerNum} : null;
                setLowestPriceOffers(update(lowestPriceOffers, {
                    [n]: {$set: bestOffer}
                }));
                const newTotal = data.multioffers.total;
                const oldOffers = priceEvaluation.offers[row];
                const oldTotal = oldOffers.total;
                const diff = oldTotal-newTotal;
                setPriceEvaluation(update(priceEvaluation, {
                    totalPrice: {$set: priceEvaluation.totalPrice-diff},
                    offers: {[n]: {$set: data.multioffers}}
                }));
                const offs = data.multioffers.offers;
                const tableOffers = offs.map((offer) => {
                    return {
                        api: offer.api, offerNum: offer.offerNum,
                        per: offer.price_per, total: offer.total, quantity: offer.quantity
                    };
                });
                const tableLine = {
                    mpn: bomdata[n].mpn, total_price: newTotal,
                    quantity: data.multioffers.quantity_offered, offers: tableOffers
                };
                setBestOfferTable(update(bestOfferTable, {
                    [n]: {$set: tableLine}
                }));
                */
            });
        }

    }
    function test(){
        /*
        const apiNames = apis.map(api => api.accessor);
        axios({
            method: 'POST',
            url: server_url+'api/bestprice',
            data: {
                bom: bomdata,
                apis: apiNames,
                algorithms: ['simple', 'multioffers']
            }
        }).then(response => {
            console.log(response.data);
        });
        */
       /*
        const mpnList = bomdata.map(line => line.mpn);
        axios({
            method: 'post',
            url: server_url+'api/part', //?part
            data: new URLSearchParams({
                parts: mpnList,
                save: false,
                request: true
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            //signal: controller.signal
        }).then(response => {
            console.log(response.data);
        });
        */
       setShowOldTable(!showOldTable);
    }
    function handleShowApiModal(){
        setShowApiLineModal(true);
    }
    function handleLineApisSubmit(){
        //if(highlightView === 'lowest'){
        handleHighlightOptions('lowest');
        fullBomRunAlgorithms();
        //}
    }
    function handleControlPanelSubmit(quantity_multi){
        console.log(quantity_multi);
        const isFinished = bomApisFinished();
        if(isFinished){
            let newBom = bomdata;
            newBom.forEach((row, i) => {
                const newQ = row.initialQuantity*quantity_multi;
                const newRow = resetQuantityPriceOffers(row, newQ);
                //const newLine = {...line};
                /*
                newLine.quantity = line.initialQuantity*quantity_multi;
                if(newLine.display_quantity !== ''){
                    newLine.display_quantity = newLine.quantity.toString();
                }
                */
                console.log(newRow);
                newBom = update(newBom, {
                    [i]: {$set: newRow}
                });
            });
            setBomdata(newBom);
            fullBomRunAlgorithms(newBom);
        }
    }
    function hideLineApisModal(){
        setShowApiLineModal(false);
    }
    function handleBomApiModal(ln, api_name){
        //console.log(ln+' '+api_name);
        const opp = !bomApiCheckBoxes[ln][api_name];
        setBomApiCheckBoxes(
            update(bomApiCheckBoxes, {
                [ln]: {[api_name]: {$set: opp}}
            })
        );

    }
    function handleHideBar(){
        setShowProgress(false);
    }
    return (
        <>  
            {/*<RefreshIcon onClick={handleReload} size={35}/>*/}
            <PricesEvaluationInterface priceEvaluation={priceEvaluation} numParts={numParts}/>
            <BOMToolInterfaceOptions data={bomdata} apiHeaders={apiHeaders} apiSubHeadings={apiAttrs} 
            status={bomApiFinished} onPriceOptionsChange={handlePriceOptions}
            onApiModal={handleShowApiModal} onHighlight={handleHighlightOptions} highlightView={highlightView}
            lowestOffers={lowestPriceOffers} lowestLeadTime={lowestLeadTime} bomAttrs={props.BOMData.attrs}
            onSubmit={handleControlPanelSubmit}
            />
            {/*<CheckBoxModal show={showApiLineModal} boxes={apiCheckBoxes[checkBoxLineIndex]} 
            hideAction={hideLineApisModal} submitAction={handleLineApisSubmit}/>*/}
            {<BomApiProgressBar show={showProgress} bomApiProgress={bomApiProgress} 
            numParts={numParts} onHideBar={handleHideBar}/>}
            {<BomApiCheckBoxModal show={showApiLineModal} data={bomdata} bomApiCheckBoxes={bomApiCheckBoxes}
            apis={apis} onCheckChange={handleBomApiModal} hideAction={hideLineApisModal} 
            submitAction={handleLineApisSubmit}/>}
            {/*<BOMAPITable data={bomdata} bomAttrs={bomAttrs}
             apis={props.BOMData.apis} apiHeaders={apiHeaders} apiAttrs={apiAttrs}/>
            {/*partLookupData.length > 0 && partLookupData[0]*/}
            {<button onClick={test}>test button</button>}
            {/*<div className='MainTable'>*/}
            {/*build_type !== 'production' && <div>{octopartMonthlyCalls}</div>*/}
            {showOldTable && displayTableView()}
            {<BOMAPITableV2 checkbox data={bomdata} bomAttrs={v2BomAttrs} apis={apiHeaders} apiAttrs={apiAttrs2} 
            lowestPriceOffers={lowestPriceOffers}/>}
            {/*</div>*/}
        </>
    );
}

function PricesEvaluationInterface(props){
    const pc = props.priceEvaluation.partsComplete;
    const percentageComplete = pc ? (pc/props.numParts)*100 : null; 
    return(
        <div className='WideInfoBar'>
            {props.priceEvaluation.totalPrice && 
            <SimpleLabel label='Total Price: ' value={props.priceEvaluation.totalPrice.toFixed(2)} post=' USD'/>}
            <SimpleLabel label='Number Of Parts: ' value={props.numParts}/>
            {pc && <SimpleLabel label='Parts Fully Evaluated: ' value={pc}/>}
            {percentageComplete && <SimpleLabel label='Quoted: ' value={percentageComplete.toFixed(2)+'%'}/>}
            {percentageComplete && <SimpleLabel label='Unquoted: ' value={(100-percentageComplete).toFixed(2)+'%'}/>}
        </div>
    );
}

function BOMToolInterfaceOptions(props){
    function handlePriceOptionChange(opt){
        props.onPriceOptionsChange(opt);
    }
    return(
    <div className='FlexNormal'>
        <div className='IconNav'>
            <BOMControlPanel onApiModal={props.onApiModal} onSubmit={props.onSubmit}/>
            {/*<div><Button variant='secondary' onClick={props.onApiModal}>MPN APIs</Button></div>*/}
            <BOMExporter data={props.data} apis={props.apiHeaders} apiSubHeadings={props.apiSubHeadings} 
            lowestOffers={props.lowestOffers} lowestLeadTime={props.lowestLeadTime} bomAttrs={props.attrs}/>
            <HighlightBest onChange={props.onHighlight} selected={props.highlightView} status={props.status}/>
            {<PriceHighlightOptions onChange={handlePriceOptionChange} status={props.status}/>}
        </div>
    </div>
    );
}

function BOMControlPanel(props){
    const [quantity, setQuantity] = useState(1);
    const [leadTimeCutoff, setLeadTimeCutoff] = useState(365*2);
    function handleSubmit(){
        props.onSubmit(quantity);
    }
    function handleChangeQuantity(q){
        setQuantity(q)
    }
    //<Button onClick={props.onApiModal}>MPN APIs</Button>
    return(
        <div>
        <div className='IconNav'>
            <div className='Ver'>
            <FormAlign>
                <NumberInput label='Quantity Multiply' onChange={(q) => setQuantity(q)} value={1}/>
                <NumberInput label='Lead Time Cutoff (days) (display only)' onChange={(q) => setLeadTimeCutoff(q)} value={leadTimeCutoff}/>
            </FormAlign>
            </div>
            <div><Button variant='secondary' onClick={props.onApiModal}>MPN APIs</Button></div>
        </div>
        <Button variant='success' onClick={handleSubmit}>Submit</Button>
        </div>
    )
}

function HighlightBest(props){
    const options = [{display: 'None', value: 'normal'}, 
    {display: 'Lowest Price', value: 'lowest'}, {display: 'Lead Time', value: 'leadtime'}];
    //const [selectedOption, setSelectedOption] = useState('normal');
    function handleOptionChange(event){
        //setSelectedOption(event.target.value);
        props.onChange(event.target.value);
    }
    return(
        <div>
            Highlight
            {options.map((opt, i) => 
            <span key={i}>
                <NamedCheckBox disabled={!props.status} onChange={handleOptionChange}
                 value={opt.value} label={opt.display} checked={props.selected===opt.value}/>
            </span>
            )}
        </div>
    );
}

function PriceHighlightOptions(props){
    const options = [{display: 'Table', value: 'default'}, 
    {display: 'Prices', value: 'prices'}, {display: 'Lead Time', value: 'lead'}];
    const [selectedOption, setSelectedOption] = useState('default');
    function handleOptionChange(event){
        //console.log(event);
        setSelectedOption(event.target.value);
        props.onChange(event.target.value);
    }
    /*<input type="radio" disabled={!props.status} onChange={handleOptionChange} 
    value={opt.value} checked={selectedOption===opt.value}/>{opt.display}*/
    return(
        <div>
            Views
        <div className='Radios'>
            {options.map((opt, i) => 
            <span key={i}>
                <NamedCheckBox disabled={!props.status} onChange={handleOptionChange}
                 value={opt.value} label={opt.display} checked={selectedOption===opt.value}/>
            </span>
            )}
        </div>
        </div>
    );
}

function BestPriceResults(props){
    const total = props.data.reduce((t, p) => p.total_price+t, 0);
    return(
        <div>
        Total Price: {total}
        </div>
    )
}
export default BOMTool;