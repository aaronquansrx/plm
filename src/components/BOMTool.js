import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import axios from 'axios';
import _, { set } from 'lodash';

import {JsonArrayDisplayTable, BOMAPITable, BOMAPITableV2, BestPriceTable} from './Tables'; 
import {SimpleOffer} from './Offer';
import {SimpleProgressBar} from './Progress';
import {CheckBoxModal, BomApiCheckBoxModal} from './Modals';
import BOMExporter from './BOMExporter';
import { NamedCheckBox } from './Checkbox';
import { RefreshIcon } from './Icons';

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
        Header: 'MPQ',
        accessor: 'mpq'
    }
    //{
    //    accessor: 'price'
    //}
];

const numHeader = [{
    Header: 'N',
    accessor: 'n'
}];

function BOMTool(props){
    //console.log(props.BOMData);
    const apis = props.BOMData.apis;
    const numParts = props.BOMData.bom.length;
    const [partLookupData, setPartLookupData] = useState(Array(props.BOMData.bom.length).fill(null));
    const [bomdata, setBomdata] = useState(props.BOMData.bom);
    const [bomAttrs, setBomAttrs] = useState(props.BOMData.bomAttrs.concat(numHeader));
    const [apiHeaders, setApiHeaders] = useState([]);
    const [apiHeaders2, setApiHeaders2] = useState([]);
    const [hasEvaluatedBOMData, setHasEvaluatedBOMData] = useState(null);
    /*
    const [bomApiProgress, setBomApiProgress] = useState({
        'finished': false,  'partsEvaluated': 0, 'progressPercent': 0,
        'line': {'status': false, 'unfinishedApis': Array(numParts).fill([])}
    });*/
    const [bomApiFinished, setBomApiFinished] = useState(false);
    const [bomApiProgress, setBomApiProgress] = useState(Array(numParts).fill(null));
    const [showProgress, setShowProgress] = useState(false);
    const [bestPriceData, setBestPriceData] = useState(null);
    const [tableView, setTableView] = useState('default');

    const [apiCheckBoxes, setApiCheckBoxes] = useState(Array(numParts).fill(apis.map((api) => {
        return {name: api.accessor, checked: true};
    })));
    const [showApiLineModal, setShowApiLineModal] = useState(false);
    const [bomApiCheckBoxes, setBomApiCheckBoxes] = useState(Array(numParts).fill(
        apis.reduce((obj,api) => {
            obj[api.accessor] = true;
            return obj;
        }, {})
    ));
    
    const [highlightView, setHighlightView] = useState('normal');
    const [lowPriceHighlighted, setLowPriceHighlighted] = useState(Array(numParts).fill(null));
    
    useEffect(() => {

        //call api
        /*const apis = ['futureelectronics', 'digikey'];
        const apiOffers = Array(props.BOMData.bom.length).fill(
            apis.reduce(function(map, api) {
            map[api] = null;
            return map;
        }, {}));*/
        setBomApiFinished(false);
        setBomApiProgress(Array(numParts).fill(null));
        setShowProgress(0);
        const controller = new AbortController();
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
        /*
        setApiHeaders(props.BOMData.apis.map((api) => {
            const newAttrs = apiAttrs.map((attr) => {
                //const accessor = attr.accessor+'_'+api.accessor;
                return {
                    Header: attr.Header,
                    accessor: attr.accessor+'_'+api.accessor,
                    Cell: r => {
                        //console.log(r);
                        const apiAccessor = r.row.original[api.accessor];
                        if(apiAccessor){
                            const data = apiAccessor[attr.accessor];
                            if(data){
                                return (
                                <div className='Ver'>
                                    {data.map((val) => 
                                    <span>{val}</span>
                                    )}
                                </div>
                                );
                            }
                        }
                        return <>No Offer</>;
                    }
                }
            });
            return {
                Header: api.Header,
                columns: newAttrs,
                accessor: api.accessor,
                //id: api.accessor,
                PriceRender: props => {
                    //console.log(props);
                    return 'prices';
                }
            }
        }));
        */

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

        setApiHeaders2(newHeaders);

    }, [props.BOMData.apis])

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
        function callApi(line, i, n, controller, api_name=null, api_list=null){
            // apis being a list of apis to call
            setShowProgress(true);
            const mpn = line.mpn;
            if(n <= 2){
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
                    console.log(response);
                    props.BOMData.apis.forEach((api_header) => {
                        const api = api_header.accessor;
                        if(api in response.data){
                            const apiresponse = response.data[api];
                            let offerOutput = {};
                            if(apiresponse.status === "success"){
                                /*
                                setHasEvaluatedBOMData(update(hasEvaluatedBOMData, {
                                    [i]: {[api]: {$set: true}}
                                }));*/
                                const offers = apiresponse.offers;
                                if(offers.length > 0){
                                    const trimmedOffers = []
                                    for(const offer of offers){
                                        trimmedOffers.push({
                                            available: offer.Quantity.Available,
                                            moq: offer.Quantity.MinimumOrder,
                                            mpq: offer.Quantity.OrderMulti,
                                            leadtime: offer.LeadTime,
                                            pricing: offer.Pricing,
                                            price: bestPriceDisplay(line, offer.Quantity.MinimumOrder, offer.Pricing)
                                        });
                                    }
                                    offerOutput = {
                                        offers: trimmedOffers
                                        //length: offers.length
                                    }
                                    maxOffers = Math.max(offers.length, maxOffers);
                                    apisOutput[api] = offerOutput;
                                }
                            }else if(apiresponse.status === "error"){
                                if(apiresponse.code === 400 || apiresponse.code === 500 || 
                                apiresponse.code === 403){
                                    console.log('timeout '+line.mpn+' api: '+api);
                                    setTimeout(() => {callApi(line, i, n+1, controller, api)}, 1000);
                                    hasError.push(api);
                                    //instead accumulate apis that need refreshing and call all in another group
                                }
                            }
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
                    console.log(apiProgress);
                    setBomApiProgress(apiProgress);
                    
                    if(hasError.length > 0){
                        //call apis again
                        console.log(hasError);
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
        props.BOMData.bom.forEach((line, i) => {
            if('mpn' in line) callApi(line, i, 0, controller);
        });

        /*
        const mergedData = ubom.map((line, i) => {
            return {...line, ...apiBomData[i]};
        });
        //setBomdata(mergedData); doesnt work (calls before apis return)
        */
    }
    function getPrice(pricing, quantity){
        let n = 0;
        while(n+1 < pricing.length && quantity >= pricing[n+1].BreakQuantity){
            n+=1;
        }
        return quantity < pricing[n].BreakQuantity ? null : pricing[n].UnitPrice;
    }
    function bestPriceDisplay(line, moq, pricing, overQuantity=null){
        const quantity = overQuantity ? overQuantity : 'quantity' in line ? line.quantity : moq;
        let n = 0; //quantity bracket index
        while(n+1 < pricing.length && quantity >= pricing[n+1].BreakQuantity){
            n+=1;
        }
        return quantity < pricing[n].BreakQuantity ? 'No Price' : pricing[n].UnitPrice;
    }
    function effectivePrice(offer, quantity){
        const moq = offer.moq; const mpq = offer.mpq; 
        const available = offer.available; const pricing = offer.pricing;
        //find quantities
        let pQuantity = moq > quantity ? [moq] : [quantity]; //must be > moq
        if(pQuantity[0] % mpq != 0){
            pQuantity[0] += (mpq - (pQuantity % mpq)); // above quantity
            pQuantity.push(pQuantity[0] - (pQuantity[0] % mpq)); // below quantity
        }
        if(pQuantity[0] > available){ // limit to available
            pQuantity[0] = available;
        }
        if(available === 0){
            return [];
        }
        /*
        let n = 0; //quantity bracket index
        while(n+1 < pricing.length && pQuantity >= pricing[n+1].BreakQuantity){
            n+=1;
        }
        const pricePer = pricing[n].UnitPrice;
        const total = pQuantity*pricePer;
        */
        const prices = [];
        pQuantity.forEach((q) => {
            let n = 0; //quantity bracket index
            while(n+1 < pricing.length && q >= pricing[n+1].BreakQuantity){
                n+=1;
            }
            const pricePer = pricing[n].UnitPrice;
            const total = q*pricePer;
            const effectivePrice = q < quantity ? total/q : total/quantity;
            prices.push({
                'total': total, 'effective': effectivePrice, 
                'per': pricePer, 'quantity': q, 
                'api': offer.api, 'offerNum': offer.offerNum
            });
        });
        return prices;
    }
    /*
    function BOMDataToArray(data, headers){
        return data.map((line) => {
            const out = headers.map((header) => {
                //line 
            });
        });
    }*/
    function handleEditBOM(){
        props.changeState(1);
    }
    function handleUploadBOM(){
        props.changeState(0);
    }
    function handleReload(){
        callApis();
    }
    function handlePriceOptions(opt){
        //console.log(opt);
        switch(opt){
            case 'default':
                break;
            case 'lowest':
                bestApiPrice();
                break;
            case 'lead':
                break;
        }
        setTableView(opt);
    }
    function handleHighlightOptions(opt, bom=null){
        switch(opt){
            case 'normal':
                setLowPriceHighlighted(Array(numParts).fill(null));
                break;
            case 'lowest':
                const b = bom ? bom : bomdata;
                const lowestPrices = b.map((line, i) => {
                    const activeApis = Object.entries(bomApiCheckBoxes[i]).reduce((arr, [k,v]) => {
                        if(v) arr.push(k);
                        return arr;
                    }, []);
                    return simpleBestPrice(line, activeApis);
                });
                setLowPriceHighlighted(lowestPrices);
                set()
                break;
        }
        setHighlightView(opt);
    }
    function bestApiPrice(){
        //console.log(bomdata);
        const bestPrices = bomdata.map((line) => {
            const best = bestPriceLine(line);
            const total = best.reduce((p, offer) => {
                return {'price': p.price+offer.total, 'quantity': p.quantity+offer.quantity};
            }, {'price': 0, 'quantity': 0});
            const data = {
                'mpn': line.mpn,
                'total_price': total.price,
                'quantity': total.quantity,
                'offers': best
            }
            return data;
        });
        setBestPriceData(bestPrices);
    }
    function bestPriceLine(line, excluded_apis=[]){
        const quantity = line.quantity ? line.quantity : 0;
        const apiOffers = apis.reduce((offerList,api) => {
            if(api.accessor in line){
                line[api.accessor].offers.forEach((offer, i) => {
                    offer['api'] = api.accessor;
                    offer['offerNum'] = i;
                    offerList.push(offer);
                });
            }
            return offerList;
        }, []);
        function bestOfferPerQuantity(q, usedOffers=[]){
            const priceOffers = [];
            apiOffers.forEach((offer) => {
                const isNotUsed = usedOffers.reduce((bool, used) => {
                    if(used.offerNum === offer.offerNum && used.api === offer.api){
                        return false;
                    }
                    return bool;
                }, true); // checks whether offer is same as used offers
                if(isNotUsed){
                    const bp = effectivePrice(offer, q);
                    bp.forEach((p) => {
                        priceOffers.push({'effective': p, 'offer': offer});
                    });
                }
            });
            const offers = priceOffers;
            // groups all by quantity offering (potentially wrong)
            /*
            const offers = priceOffers.reduce((obj, off) => {
                const eff = off.effective;
                if(eff.quantity in obj){
                    if(eff.effective < obj[eff.quantity].effective){
                        obj[eff.quantity] = eff;
                    }
                }else{
                    obj[eff.quantity] = eff;
                }
                return obj;
            }, {});
            */
            //const offs = Object.values(offers);
            const offs = priceOffers.map((off) => off.effective);
            offs.sort((a,b) => a.effective-b.effective);
            //console.log(offs);
            return offs;
        }
        //const offs = bestOfferPerQuantity(quantity);
        //console.log(offs);
        //let purchases = [];
        function algo(quantityRemaining, quantityUsed, offersUsed=[]){
            if(quantityRemaining <= 0){
                return [];
            }
            const offers = bestOfferPerQuantity(quantityRemaining, offersUsed);
            /*
            if(offersUsed.length > 0){
                console.log(offers);
                console.log(quantityRemaining);
            };*/
            if(offers.length > 0){
                const minEff = offers.reduce((e, o) => {
                    const qRem = quantityRemaining - o.quantity;
                    const qUsed = quantityUsed + o.quantity > quantity ? quantity : quantityUsed + o.quantity;
                    const used = [...offersUsed];
                    used.push({'api': o.api, 'offerNum': o.offerNum});
                    //console.log(offersUsed);
                    const usingO = [o].concat(algo(qRem, qUsed, used));
                    const totalPrice = usingO.reduce((p, o) => {
                        return p+o.total;
                    }, 0);
                    //console.log(totalPrice);
                    const eff = totalPrice/qUsed;
                    if(eff < e.effective){
                        //console.log(usingO);
                        return {'effective': eff, 'offer': usingO};
                    }
                    return e;
                }, {'effective': Number.MAX_SAFE_INTEGER, 'offer': []});
                return minEff.offer;
            }
            return [];
        }
        const purchases = algo(quantity, 0);
        console.log(purchases);
        /*
        if(offs.length === 0){
            //no offers
        }else{
            if(offs[0].quantity >= quantity){
                purchases.push(offs[0]);
            }else{
                algo()
            }
        }
        */

        return purchases;
    }

    function simpleBestPrice(line, api_list=[]){
        //todo find the best price of line regardless of quantity
        const quantity = line.quantity ? line.quantity : 0;
        const pricing = line.pricing;
        if(quantity < line.moq) quantity = line.moq;
        const apiOffers = api_list.reduce((offerList,api) => {
            if(api in line){
                line[api].offers.forEach((offer, i) => {
                    const price = getPrice(offer.pricing, quantity);
                    offer['priceComp'] = price;
                    offer['api'] = api;
                    offer['offerNum'] = i;
                    if(price) offerList.push(offer);
                });
            }
            return offerList;
        }, []);
        console.log(apiOffers);
        apiOffers.sort((a,b) => a.priceComp-b.priceComp);
        let out = null;
        if(apiOffers.length > 0){
            //console.log(apiOffers[0]);
            out = {api: apiOffers[0].api, offerNum: apiOffers[0].offerNum};
        }
        return out;
        
    }
    function quantityBestPrice(line, api_list=[]){
        const quantity = line.quantity ? line.quantity : 0;
        //todo find best price considering quantity
    }
    function displayTableView(){
        let v;
        switch(tableView){
            case 'default':
                v = <BOMAPITableV2 data={bomdata} bomAttrs={bomAttrs} apis={apiHeaders2} apiSubHeadings={apiAttrs}
                onChangeQuantity={handleChangeQuantity} onClickRow={handleShowApiModal} highlights={lowPriceHighlighted}/>;
                break;
            case 'lowest':
                v = <>
                Algorithm currently bugged
                <BestPriceResults data={bestPriceData}/>
                <BestPriceTable data={bestPriceData}/>
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
        console.log(row);
        const newQ = parseInt(quantity)
        const r = bomdata[row];
        const newRow = {...r};
        apis.forEach((api) => {
            if(api.accessor in newRow){
                const offers = newRow[api.accessor].offers.map(offer => {
                    offer.price = bestPriceDisplay(r, offer.moq, offer.pricing, newQ);
                    return offer;
                });
            }
            newRow.quantity = newQ;
        })
        const newBom = update(bomdata, {
            [row]: {$set: newRow}
                //quantity: {$set: newQ},
                //price: {$set: bestPriceDisplay(r, r.moq, r.pricing, newQ)}
        })
        bestPriceLine(newBom[row]);
        setBomdata(newBom);
        console.log(highlightView);
        if(highlightView === 'lowest'){
            handleHighlightOptions('lowest', newBom); // write one for individual line
        }
    }
    function test(){
        console.log(bomApiProgress);
        console.log(bomdata);
    }
    function handleShowApiModal(){
        //console.log(row);
        //setCheckBoxLineIndex(row);
        setShowApiLineModal(true);
    }
    function handleLineApisSubmit(){
        console.log(bomApiCheckBoxes);
        console.log(highlightView);
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
    //<BOMAPITableV2 data={bomdata} bomAttrs={bomAttrs} apis={apiHeaders2} apiSubHeadings={apiAttrs}
    //onChangeQuantity={handleChangeQuantity}/>
    return (
        <>  
            {/*<RefreshIcon onClick={handleReload} size={35}/>*/}
            <BOMToolInterfaceOptions data={bomdata} apiHeaders={apiHeaders2} apiSubHeadings={apiAttrs} 
            status={bomApiFinished} onPriceOptionsChange={handlePriceOptions}
            onApiModal={handleShowApiModal} onHighlight={handleHighlightOptions} highlightView={highlightView}/>
            {/*<CheckBoxModal show={showApiLineModal} boxes={apiCheckBoxes[checkBoxLineIndex]} 
            hideAction={hideLineApisModal} submitAction={handleLineApisSubmit}/>*/}
            {progressBar()}
            {<BomApiCheckBoxModal show={showApiLineModal} data={bomdata} bomApiCheckBoxes={bomApiCheckBoxes}
            apis={apis} onCheckChange={handleBomApiModal} hideAction={hideLineApisModal} 
            submitAction={handleLineApisSubmit}/>}
            {/*<BOMAPITable data={bomdata} bomAttrs={bomAttrs}
             apis={props.BOMData.apis} apiHeaders={apiHeaders} apiAttrs={apiAttrs}/>
            {/*partLookupData.length > 0 && partLookupData[0]*/}
            {/*<button onClick={test}> tb</button>*/}
            <div className='MainTable'>
            {displayTableView()}
            </div>
        </>
    );
}

function BOMToolInterfaceOptions(props){
    function handlePriceOptionChange(opt){
        props.onPriceOptionsChange(opt);
    }
    return(
    <div className='FlexNormal'>
        <div className='IconNav'>
            <BOMExporter data={props.data} apis={props.apiHeaders} apiSubHeadings={props.apiSubHeadings}/>
            <Button onClick={props.onApiModal}>MPN APIs</Button>
            <HighlightBest onChange={props.onHighlight} selected={props.highlightView}/>
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
                <NamedCheckBox onChange={handleOptionChange}
                 value={opt.value} label={opt.display} checked={props.selected===opt.value}/>
            </span>
            )}
        </div>

    );
}

function PriceHighlightOptions(props){
    const options = [{display: 'Default', value: 'default'}, 
    {display: 'Lowest Price', value: 'lowest'}, {display: 'Lead Time', value: 'lead'}];
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