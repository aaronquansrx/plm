import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import axios from 'axios';
import _ from 'lodash';

import {BOMAPITable, BestPriceTable} from './Tables'; 
import {SimpleProgressBar} from './Progress';
import {BomApiCheckBoxModal} from './Modals';
import BOMExporter from './BOMExporter';
import { NamedCheckBox } from './Checkbox';
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

const server_url = process.env.REACT_APP_SERVER_URL;

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

const numHeader = [{
    Header: 'N',
    accessor: 'n'
}];

function BOMTool(props){
    //console.log(props.BOMData);
    const apis = props.BOMData.apis;
    const numParts = props.BOMData.bom.length;
    const bomAttrs = props.BOMData.bomAttrs.concat(numHeader);
    //const [partLookupData, setPartLookupData] = useState(Array(props.BOMData.bom.length).fill(null));
    const [bomdata, setBomdata] = useState(props.BOMData.bom);
    //const [bomAttrs, setBomAttrs] = useState(props.BOMData.bomAttrs.concat(numHeader));
    const [apiHeaders, setApiHeaders] = useState([]);
    //const [hasEvaluatedBOMData, setHasEvaluatedBOMData] = useState(null);
    const [bomApiFinished, setBomApiFinished] = useState(false);
    const [bomApiProgress, setBomApiProgress] = useState(Array(numParts).fill(null));
    const [showProgress, setShowProgress] = useState(false);
    const [bestPriceData, setBestPriceData] = useState(null);
    const [tableView, setTableView] = useState('default');

    const [showApiLineModal, setShowApiLineModal] = useState(false);
    const [bomApiCheckBoxes, setBomApiCheckBoxes] = useState(Array(numParts).fill(
        apis.reduce((obj,api) => {
            obj[api.accessor] = true;
            return obj;
        }, {})
    ));
    //console.log(bomAttrs);
    
    const [highlightView, setHighlightView] = useState('normal');
    const [lowestPriceOffers, setLowestPriceOffers] = useState(Array(numParts).fill(null));
    //const [lowestPrices] = useState();

    const [priceEvaluation, setPriceEvaluation] = useState({
        totalPrice: null, offers: Array(numParts).fill(null),
        partsComplete: null
    });
    
    useEffect(() => {
        const mpnList = bomdata.map(line => line.mpn);
        //call api

        //resetting progress bar variables

        setBomApiFinished(false);
        setBomApiProgress(Array(numParts).fill(null));
        setShowProgress(0);
        const controller = new AbortController();
        if(numParts.length > 0){
            axios({
                method: 'post',
                url: server_url+'api/part', //?part
                data: new URLSearchParams({
                    parts: mpnList
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
        const apiFinished = bomApiProgress.reduce((b, apisn) => {
            if(apisn === null || apisn.length > 0){
                b = false;
            }
            return b;
        }, true);
        //console.log(apiFinished);
        if(apiFinished){
            //const lowestPrices = getLowestPrices(bomdata);
            
            //setLowestPriceOffers(lowestPrices);

            const apiNames = apis.map(api => api.accessor);
            axios({
                method: 'POST',
                url: server_url+'api/bestprice',
                data: {
                    bom: bomdata,
                    apis: apiNames,
                    algorithms: ['simple']
                }
            }).then(response => {
                console.log(response.data);
                
                const best = response.data.best;
                const lowestPrices = best.map((line) => {
                    const simple = line.simple;
                    return {api: simple.api, offerNum: simple.offerNum};
                });
                //console.log(lowestPrices);
                setLowestPriceOffers(lowestPrices);
                
            });
            axios({
                method: 'POST',
                url: server_url+'api/bestprice',
                data: {
                    bom: bomdata,
                    apis: apiNames,
                    algorithms: ['multioffers']
                }
            }).then(response => {
                console.log(response.data);
                
                const best = response.data.best;
                const bestOffers = best.map((line) => {
                    const best = line.multioffers;
                    return {offers: best.offers};
                });
                
                const bd = response.data.multioffers_breakdown;
                setPriceEvaluation(update(priceEvaluation, {
                    totalPrice: {$set: bd.total_price},
                    partsComplete: {$set: bd.num_completed_offers}
                }));
            });

            //setLowestPriceOffers();
        }
    }, [bomApiProgress]);

    useEffect(() => {

    }, []);

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
        function updateApiProgress(i, apiErrorList){
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
        }
        let apiBomData = Array(ubom.length).fill({});
        function callApi(line, i, n, maxCalls, controller, api_name=null, api_list=null){
            // apis being a list of apis to call
            setShowProgress(true);
            const mpn = line.mpn;
            if(n <= maxCalls){
                const callUrl = api_name!==null 
                ? server_url+'api/part?part='+mpn+'&api='+api_name
                : server_url+'api/part?part='+mpn;
                axios({
                    method: 'get',
                    url: callUrl,
                    signal: controller.signal
                }).then(response => {
                    const apisOutput = api_name ? {}:{
                        maxOffers: 0
                    }
                    let maxOffers = 0;
                    //console.log(response);
                    const hasError = [];
                    //console.log(response.data);
                    props.BOMData.apis.forEach((api_header) => {
                        const api = api_header.accessor;
                        if(api in response.data){
                            const apiresponse = response.data[api];
                            let offerOutput = {offers: [], success: false};
                            if(apiresponse.status === "success"){
                                /*
                                setHasEvaluatedBOMData(update(hasEvaluatedBOMData, {
                                    [i]: {[api]: {$set: true}}
                                }));*/
                                const offers = apiresponse.offers;
                                if(offers.length > 0){
                                    const trimmedOffers = [];
                                    for(const offer of offers){
                                        trimmedOffers.push({
                                            available: offer.Quantity.Available,
                                            moq: offer.Quantity.MinimumOrder,
                                            spq: offer.Quantity.OrderMulti,
                                            leadtime: offer.LeadTime,
                                            pricing: offer.Pricing,
                                            price: bestPriceDisplay(line, offer.Quantity.MinimumOrder, offer.Pricing),
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
                                if(apiresponse.code === 400 || apiresponse.code === 500 || 
                                apiresponse.code === 403){
                                    offerOutput.message = apiresponse.message;
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
                    
                    if(hasError.length > 0){
                        //call apis again
                        //console.log(hasError);
                    }else{
                        const apiFinished = apiProgress.reduce((b, apisn) => {
                            if(apisn === null || apisn.length > 0){
                                b = false;
                            }
                            return b;
                        }, true);
                        if(apiFinished){
                            setBomApiFinished(apiFinished);
                        }
                        //setBomApiFinished(apiFinished);
                    }
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
        }
        const maxCalls = 4
        props.BOMData.bom.forEach((line, i) => {
            if('mpn' in line) callApi(line, i, 0, maxCalls, controller);
        });

        /*
        const mergedData = ubom.map((line, i) => {
            return {...line, ...apiBomData[i]};
        });
        //setBomdata(mergedData); doesnt work (calls before apis return)
        */
    }
    /*
    function BOMDataToArray(data, headers){
        return data.map((line) => {
            const out = headers.map((header) => {
                //line 
            });
        });
    }*/
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
                setLowestPriceOffers(Array(numParts).fill(null));
                break;
            case 'lowest':
                const b = bom ? bom : bomdata;
                const lowestPrices = getLowestPrices(b);
                setLowestPriceOffers(lowestPrices);
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
    //console.log(bomApiProgress.map((apis) => apis !== null && apis.length === 0));
    function displayTableView(){
        let v;
        switch(tableView){
            case 'default':
                v = <BOMAPITable data={bomdata} bomAttrs={bomAttrs} apis={apiHeaders} apiSubHeadings={apiAttrs}
                onChangeQuantity={handleChangeQuantity} highlights={lowestPriceOffers} 
                rowsFinished={bomApiProgress.map((apis) => apis !== null && apis.length === 0)}
                showHighlights={highlightView === 'lowest'}/>;
                break;
            case 'prices':
                v = <>
                Algorithm currently bugged
                <BestPriceResults data={bestPriceData}/>
                <BestPriceTable data={bestPriceData} headers={bestPriceHeaders}/>
                </>
                break;
            default:
                v = <>Lead Time algorithm not available in this version</>;
                break;
        }
        return v;
    }
    function progressBar(){
        if(showProgress){
            const nFinished = bomApiProgress.reduce((n, api_list) => {
                if(api_list !== null && api_list.length === 0) return n+1;
                return n
            }, 0);
            const ratio = nFinished/numParts;
            const percentage = ratio*100;
            if(ratio >= 1){
                setTimeout(() => setShowProgress(false), 2000);
            }
            return <SimpleProgressBar now={percentage}/>
        }
        return <></>;
    }
    function handleChangeQuantity(row, quantity){
        const newQ = parseInt(quantity);
        const r = bomdata[row];
        const newRow = {...r};
        apis.forEach((api) => {
            if(api.accessor in newRow){
                const offers = newRow[api.accessor].offers.map(offer => {
                    offer.price = bestPriceDisplay(newRow, offer.moq, offer.pricing, newQ);
                    return offer;
                });
                newRow[api.accessor].offers = sortOffers(offers, newQ);
            }
            newRow.quantity = newQ;
            newRow.display_quantity = quantity;
        });
        let newBom = update(bomdata, {
            [row]: {$set: newRow}
                //quantity: {$set: newQ},
                //price: {$set: bestPriceDisplay(r, r.moq, r.pricing, newQ)}
        });
        //change rows for the (alternate mpns) i.e rows that have no display quantity
        let nrow = row+1;
        while(nrow < bomdata.length && bomdata[nrow].display_quantity === ''){
            newBom = update(newBom, {
                [nrow]: {quantity: {$set: newQ}}
            });
            nrow++;
        }
        setBomdata(newBom);
        //console.log(highlightView);
        if(highlightView === 'lowest'){
            handleHighlightOptions('lowest', newBom); // write one for individual line
        }
        //sort offers
        const apiNames = getActiveApis(row);
        axios({
            method: 'POST',
            url: server_url+'api/bestprice',
            data: {
                line: newRow,
                apis: apiNames,
                algorithms: 'simple'
            }
        }).then(response => {
            console.log(response.data);
            /*
            console.log(response.data);
            const best = response.data.best;
                const lowestPrices = best.map((line) => {
                    const simple = line.simple;
                    return {api: simple.api, offerNum: simple.offerNum};
                });
                //console.log(lowestPrices);
                setLowestPriceOffers(lowestPrices);
            */
        });

    }
    function test(){
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
    }
    function handleShowApiModal(){
        setShowApiLineModal(true);
    }
    function handleLineApisSubmit(){
        if(highlightView === 'lowest'){
            handleHighlightOptions('lowest');
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
    return (
        <>  
            {/*<RefreshIcon onClick={handleReload} size={35}/>*/}
            <PricesEvaluationInterface priceEvaluation={priceEvaluation} numParts={numParts}/>
            <BOMToolInterfaceOptions data={bomdata} apiHeaders={apiHeaders} apiSubHeadings={apiAttrs} 
            status={bomApiFinished} onPriceOptionsChange={handlePriceOptions}
            onApiModal={handleShowApiModal} onHighlight={handleHighlightOptions} highlightView={highlightView}
            lowestOffers={lowestPriceOffers} bomAttrs={props.BOMData.bomAttrs}/>
            {/*<CheckBoxModal show={showApiLineModal} boxes={apiCheckBoxes[checkBoxLineIndex]} 
            hideAction={hideLineApisModal} submitAction={handleLineApisSubmit}/>*/}
            {progressBar()}
            {<BomApiCheckBoxModal show={showApiLineModal} data={bomdata} bomApiCheckBoxes={bomApiCheckBoxes}
            apis={apis} onCheckChange={handleBomApiModal} hideAction={hideLineApisModal} 
            submitAction={handleLineApisSubmit}/>}
            {/*<BOMAPITable data={bomdata} bomAttrs={bomAttrs}
             apis={props.BOMData.apis} apiHeaders={apiHeaders} apiAttrs={apiAttrs}/>
            {/*partLookupData.length > 0 && partLookupData[0]*/}
            {<button onClick={test}> tb</button>}
            <div className='MainTable'>
            {displayTableView()}
            </div>
        </>
    );
}

function PricesEvaluationInterface(props){
    const percentageComplete = props.priceEvaluation.partsComplete ? (props.priceEvaluation.partsComplete/props.numParts)*100 : null; 
    return(
        <div>
            {props.priceEvaluation.totalPrice && <SimpleLabel label='Total Price' value={props.priceEvaluation.totalPrice}/>}
            <SimpleLabel label='Parts Evaluated' value={props.numParts}/>
            {percentageComplete && <SimpleLabel label='Percent' value={percentageComplete}/>}
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
            <BOMExporter data={props.data} apis={props.apiHeaders} apiSubHeadings={props.apiSubHeadings} 
            lowestOffers={props.lowestOffers} bomAttrs={props.bomAttrs}/>
            <Button onClick={props.onApiModal}>MPN APIs</Button>
            <HighlightBest onChange={props.onHighlight} selected={props.highlightView} status={props.status}/>
            <PriceHighlightOptions onChange={handlePriceOptionChange} status={props.status}/>
        </div>
    </div>
    );
}

function HighlightBest(props){
    const options = [{display: 'None', value: 'normal'}, 
    {display: 'Lowest Price', value: 'lowest'}];
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
    const options = [{display: 'Default', value: 'default'}, 
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
        <div className='Radios'>
            {options.map((opt, i) => 
            <span key={i}>
                <NamedCheckBox disabled={!props.status} onChange={handleOptionChange}
                 value={opt.value} label={opt.display} checked={selectedOption===opt.value}/>
            </span>
            )}
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