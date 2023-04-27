import {useState, useEffect} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { Notification } from './Notifications';
import { BOMApiProgressBarV2 } from '../../components/Progress';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { bestPriceOffer } from '../../scripts/PLMAlgorithms';


export function ConsolidateView(props){
    //const headers = consolidateHeaders.concat(props.consolidatedData.headers);
    const headers = props.consolidatedData.headers;
    function handleBack(){
        props.changeQuotePageState(0);
    }
    function handlePrices(){
        props.changeQuotePageState(5);
    }

    //<SimpleArrayTable data={props.data}/>
    return(
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handlePrices}>Prices</Button>
        <Notification data={props.consolidatedData}/>
        {props.consolidateStatus && <div>{props.consolidateStatus}</div>}
        <CustomHeaderArrayTable data={props.consolidatedData.data} headers={headers}/>
        <TotalsDisplay data={props.consolidatedData.totals}/>
        </div>
    );
}

function TotalsDisplay(props){
    return(
        <>
            {props.data && 
            <div className='FlexNormal'>
            <div>Total Sum of Usage Per: {props.data.sum_products}</div>
            <div>Total Sum of EAU: {props.data.eau}</div>
            </div>
            }
        </>
    );
}

function CustomHeaderArrayTable(props){
    console.log(props.data);
    return(
        <Table>
            <thead>
                <tr>
                {props.headers.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                </tr>
            </thead>
            <tbody>
                {props.data.map((row, i) => {
                    let cn = '';
                    if(!row.manu_found){
                        cn = 'NHL';
                    }
                    return(
                    <tr key={i}>
                        {props.headers.map((h, j) =>
                            <td key={j} className={cn}>{row[h.accessor]}</td>
                        )}
                    </tr>
                    )}
                )}
            </tbody>
        </Table>
    )
}


function HeaderArrayTable(props){
    return(
        <Table>
            <thead>
                <tr>
                {props.headers.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                </tr>
            </thead>
            <tbody>
                {props.data.map((row, i) => {
                    return(
                    <tr key={i}>
                        {props.headers.map((h, j) =>
                            <td key={j}>{row[h.accessor]}</td>
                        )}
                    </tr>
                    )}
                )}
            </tbody>
        </Table>
    )
}

export function ConsolidatePricesView(props){
    const mpnSet = props.consolidatedData.data.map((line) => line.mpn);
    const [partData, finished, requestParts, finishedParts] = usePartData(mpnSet);
    const h = [{accessor: 'mpn', label: 'MPN'}, {accessor: 'price', label: 'Price'}];

    const [showProgress, setShowProgress] = useState(false);
    const [priceData, setPriceData] = useState(props.consolidatedData.data.map((line) => {
        return {mpn: line.mpn, price: null};
    }));
    //console.log(partData);
    useEffect(() => {
        //const mpnSet = props.consolidatedData.data.map((line) => line.mpn);
        if(finished){
            console.log(partData);
            const newData = [...priceData];
            props.consolidatedData.data.forEach((line, i) => {
                if(partData.has(line.mpn)){
                    const data = partData.get(line.mpn).apis;
                    let offers = [];
                    for(const api in data){
                        offers = offers.concat(data[api].offers);
                    }
                    //console.log(offers);
                    //const offers = data.reduce();
                    const p = bestPriceOffer(offers);
                    if(p !== null){
                        newData[i].price = p.total_price;
                    }
                }
            });
            setPriceData(newData);
        }
    }, [finished]);
    function handleBack(){
        props.changeQuotePageState(0);
    }
    function handleGetPrices(){
        console.log('requesting parts');
        requestParts();
        setShowProgress(true);
    }
    function handleHide(){
        setShowProgress(false);
    }
    return(
        <>
        <Button onClick={handleBack}>Back</Button>
        <Button onClick={handleGetPrices}>Prices</Button>
        Prices
        <BOMApiProgressBarV2 show={showProgress} numParts={mpnSet.length} 
        numFinished={finishedParts.size} onHideBar={handleHide}/>
        <HeaderArrayTable data={priceData} headers={h}/>
        </>
    );
}

function usePartData(partList){
    const [partData, setPartData] = useState(new Map());
    const [finished, setFinished] = useState(false);
    const [partsFinished, setPartsFinished] = useState(new Set());
    const maxRetries = 5;
    //const [completeParts, setCompleteParts] = useState(new Set());
    //const [retries, setRetries] = useState({times: 0, parts: partList, current: new Set(), new: []});
    function handleRequestParts(){
        const currentParts = new Map();
        let retryTimes = 0;
        let partsToDo = partList;
        let current = [];
        let retries = [];
        //let parts = partList;

        const partSet = new Set();

        function handleCompletePart(mpn, data){
            currentParts.set(mpn, data);
            setPartData(currentParts);
            const rets = [];
            for(const api in data.apis){
                if(data.apis[api].retry){
                    rets.push(api);
                }
            }
            if(rets.length > 0){
                retries.push({apis: rets, mpn: mpn});
            }else{
                partSet.add(mpn);
                setPartsFinished(new Set([...partSet]));
            }
            console.log(retryTimes);
            if(retryTimes === maxRetries){
                partSet.add(mpn);
                setPartsFinished(new Set([...partSet]));
            }
            console.log(partSet);
            current.push(mpn);
            
            if(partsToDo.length === current.length){
                if(retries.length > 0 && retryTimes < maxRetries){
                    console.log(currentParts);
                    console.log(retries);
                    const parts = retries.map((retry) => retry.mpn);
                    partsToDo = parts;
                    retries = [];
                    current = [];
                    retryTimes++;
                    partsToDo.forEach((part) => {
                        callPart(part, handleCompletePart, handleError);
                    });
                }else{
                    setFinished(true);
                }
            }
            
        }
        function handleError(mpn){
            current.push(mpn);
            if(partsToDo.length === current.length){
                if(retries > 0 && retryTimes < maxRetries){
                    console.log(currentParts);
                    console.log(retries);
                    const parts = retries.map((retry) => retry.mpn);
                    partsToDo = parts;
                    retries = [];
                    current = [];
                    retryTimes++;
                    partsToDo.forEach((part) => {
                        callPart(part, handleCompletePart, handleError);
                    });
                }else{
                    partSet.add(mpn)
                    setPartsFinished(partSet);
                    setFinished(true);
                }
            }
            //retries.push({apis: rets, mpn: mpn});
        }
        partsToDo.forEach((part) => {
            callPart(part, handleCompletePart, handleError);
        });
    }
    /*
    function handleCompletePart(mpn, data){
        setPartData(update(partData, {
            $add: [[mpn, data]]
        }));
        setCompleteParts(update(completeParts, {
            $add: [mpn]
        }));
        const rets = [];
        for(const api in data.apis){
            if(data.apis[api].retry){
                rets.push(api);
            }
        }
        const retUpdateObj = {
            current: {$add: [mpn]}
        }
        if(rets.length > 0){
            retUpdateObj.new = {$push: [{apis: rets, mpn: mpn}]};
        }
        setRetries(update(retries, retUpdateObj));

    }*/
    return [partData, finished, handleRequestParts, partsFinished];
}

function callPart(mpn, onComplete, onError){
    const getData = {mpn: mpn};
    getPLMRequest('part', getData,
    (res) => {
        //console.log(res.data);
        onComplete(mpn, res.data.refined);
    },
    (res) => {
        onError(mpn);
    })
}