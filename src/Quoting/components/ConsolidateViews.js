import {useState, useEffect} from 'react';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { Notification } from './Notifications';
import {SimplePopover} from '../../components/Tooltips';
import { BOMApiProgressBarV2 } from '../../components/Progress';
import { TemplateModal } from '../../components/Modals';

import { MasterManufacturerAdder, AlternateManufacturerAdder, SupplierButtonChooser } from './ManufacturerSupplierTables';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { bestPriceOffer } from '../../scripts/PLMAlgorithms';
import { ModalDialog } from 'react-bootstrap';
import { TabPages } from '../../components/Tabs';


export function ConsolidateView(props){
    //const headers = consolidateHeaders.concat(props.consolidatedData.headers);
    const [modalDetails, setModalDetails] = useState(null);
    const headers = props.consolidatedData.headers;
    function handleBack(){
        props.changeQuotePageState(0);
    }
    function handlePrices(){
        props.changeQuotePageState(5);
    }
    function handleRowClick(r){
        console.log(props.consolidatedData.data[r]);
        setModalDetails({manufacturer: props.consolidatedData.data[r].manufacturer, row: r})
    }
    function handleClose(){
        setModalDetails(null);
    }
    console.log(modalDetails);
    function handleAddMasterManufacturer(masterInputs, id){
        const postData = {function: 'manufacturer_string_id', id: id, string: modalDetails.manufacturer};
        postPLMRequest('srx_records', postData, 
        (res) => {
            console.log(res.data);
            setModalDetails(null);
        },
        (res) => {
            console.log(res.data);
        }
        );

    }
    function handleUpdateExisting(){
        const sameManuAdd = props.consolidatedData.data.reduce((obj, row, rn) => {
            if(row.manufacturer === modalDetails.manufacturer){
                //obj.push(rn);
                obj[rn] = {status: {manu_found: {$set: row.manufacturer}}};
            }
            return obj;
        }, {});
        console.log(sameManuAdd);
        props.setConsolidatedData(update(props.consolidatedData, {
            data: sameManuAdd
            /*{
                [modalDetails.row]:  {
                    status: {
                        manu_found: {$set: modalDetails.manufacturer}
                    }
                }
            }*/
        }));
        setModalDetails(null);
    }
    const tabs = [
        {
            name: 'Existing Master Manufacturer', 
            content: <AlternateManufacturerAdder alternateName={modalDetails && modalDetails.manufacturer}
            onAddManufacturer={handleClose}
            updateData={handleUpdateExisting}/>
        },
        {
            name: 'Add Master Manufacturer', 
            content: <MasterManufacturerAdder onAddManufacturer={handleAddMasterManufacturer}/>
        }
    ]
    const body = <div>
        <TabPages tabs={tabs}/>
    </div>
    //<SimpleArrayTable data={props.data}/>
    return(
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handlePrices}>Data Mapping</Button>
        <Notification data={props.consolidatedData}/>
        {props.consolidateStatus && <div>{props.consolidateStatus}</div>}
        <ConsolidateHeaderArrayTable data={props.consolidatedData.data} headers={headers}
        onRowClick={handleRowClick}/>
        <TotalsDisplay data={props.consolidatedData.totals}/>

        <TemplateModal show={modalDetails !== null} onClose={handleClose}
        body={body}
        />
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

function ConsolidateHeaderArrayTable(props){
    const [popup, setPopup] = useState(null);
    console.log(props.data);
    function handleRowClick(r){
        return function(){
            const hasFound = props.data[r].status.manu_found;
            if(!hasFound){
                if(props.onRowClick){
                    props.onRowClick(r);
                }
            }
        }
    }
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
                    if(row.status.manu_found === null){
                        cn = 'NHL';
                    }else if(row.status.multiple_mpn || row.status.multiple_cpn){
                        cn = 'HLC';
                    }
                    const pt = <>{row.status.manu_found !== null ? row.status.manu_found  : 'Manufacturer Not Found'}</>;
                    return(
                    <tr key={i} onClick={handleRowClick(i)}>
                        {props.headers.map((h, j) =>
                            <td key={j} className={cn}>
                                {h.accessor !== 'manufacturer' ? row[h.accessor] :
                                <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
                                    <div>{row[h.accessor]}</div>
                                </SimplePopover>
                                }
                            </td>
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
    const h = [
        {accessor: 'mpn', label: 'MPN'},  
        {accessor: 'master_manufacturer', label: 'Manufacturer'},
        {accessor: 'description', label: 'Description'},
        {accessor: 'total', label: 'Total'},
        {accessor: 'packaging', label: 'Packaging'},
        {accessor: 'plc', label: 'Product Life Cycle'},
        {accessor: 'price', label: 'Price'}
    ];

    const [showProgress, setShowProgress] = useState(false);
    const [priceData, setPriceData] = useState(props.consolidatedData.data.map((line) => {
        return {mpn: line.mpn, total: line.total, description: line.description,
            master_manufacturer: line.master_manufacturer, price: null};
    }));
    //console.log(partData);
    useEffect(() => {
        //const mpnSet = props.consolidatedData.data.map((line) => line.mpn);
        if(finished){
            console.log(partData);
            const newData = [...priceData];
            props.consolidatedData.data.forEach((line, i) => {
                if(partData.has(line.mpn)){
                    const data = partData.get(line.mpn);
                    let offers = [];
                    for(const api in data.apis){
                        offers = offers.concat(data.apis[api].offers);
                    }
                    //console.log(offers);
                    //const offers = data.reduce();
                    const p = bestPriceOffer(offers, line.total);
                    if(p !== null){
                        newData[i].price = p.total_price;
                    }
                    if(data.details.length > 0){
                        newData[i].packaging = data.details[0].Parameters.Packaging;
                        newData[i].plc = data.details[0].Parameters['Part Status'];
                    }
                }
            });
            setPriceData(newData);
        }
    }, [finished]);
    function handleBack(){
        props.changeQuotePageState(4);
    }
    function handleSupplierMapping(){
        props.changeQuotePageState(6);
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
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleGetPrices}>Request Prices</Button>
        <Button onClick={handleSupplierMapping}>Supplier Mapping</Button>
        </div>
        <BOMApiProgressBarV2 show={showProgress} numParts={mpnSet.length} 
        numFinished={finishedParts.size} onHideBar={handleHide}/>
        <HeaderArrayTable data={priceData} headers={h}/>
        </>
    );
}

export function SupplierMapping(props){
    console.log(props.consolidatedData);
    const [selected, setSelected] = useState(null);
    const [data, setData] = useState(props.consolidatedData.data.map((line, i) => {
        return {system: i, cpn: 'cpn', mpn: line.mpn, mfr: line.master_manufacturer, desc: line.description}
    }));
    //const []
    //const [selectedLine, ]
    const h = [
        {accessor: 'system', label: 'System Unique ID'},  
        {accessor: 'mpn', label: 'MPN'},  
        {accessor: 'mfr', label: 'Manufacturer'},
        {accessor: 'desc', label: 'Description'},
        {accessor: 'supplier0', label: 'Supplier 1'},
        {accessor: 'supplier1', label: 'Supplier 2'},
        {accessor: 'supplier2', label: 'Supplier 3'},
        {accessor: 'supplier3', label: 'Supplier 4'},
        {accessor: 'supplier4', label: 'Supplier 5'}
    ];
    function handleBack(){
        props.changeQuotePageState(5);
    }
    function handleAddSupplier(){
        
    }
    function handleSelectLine(){
        setSelected();
    }
    function handleAutoMap(){
        const postData = {
            function: 'get_manufacturer_supplier_list', 
            manufacturer_list: props.consolidatedData.manufacturers
        };
        postPLMRequest('srx_records', postData, 
        (res) => {
            console.log(res.data);

            const manufacturer_supplier_map = res.data.manufacturer_supplier_map;
            const newData = [...data].map((line) => {
                const newLine = {...line};
                //console.log(newLine);
                const manu = line.mfr;
                console.log(manu);
                if(manu !== null){
                    const suppliers = manufacturer_supplier_map[manu];
                    suppliers.forEach((supplier, i) => {
                        const supString = 'supplier'+i.toString();
                        newLine[supString] = supplier.supplier_name
                    });
                }
                return newLine;
            });
            setData(newData);
            console.log(newData);
        },
        (res) => {
            console.log(res.data);
        });
    }
    return(
        <>
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <div><SupplierButtonChooser/>
        </div>
        <Button onClick={handleAddSupplier} disabled={true}>Add Supplier</Button>
        <Button onClick={handleAutoMap}>Auto Map</Button>
        </div>
        <SelectLineHeaderArrayTable data={data} headers={h} onSelectLine={handleSelectLine}/>
        </>
    )
}

function SelectLineHeaderArrayTable(props){
    const [selectedRow, setSelectedRow] = useState();
    function handleSelectLine(i){
        return function(){
            if(i === selectedRow){
                setSelectedRow(null);
                if(props.onDeselectLine) props.onDeselectLine(i);
            }else{
                setSelectedRow(i);
                if(props.onSelectLine) props.onSelectLine(i);
            }
        }
    }
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
                    const cn = selectedRow === i ? 'HighlightedRow' : '';
                    return(
                    <tr key={i} className={cn} onClick={handleSelectLine(i)}>
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
            //console.log(retryTimes);
            if(retryTimes === maxRetries){
                partSet.add(mpn);
                setPartsFinished(new Set([...partSet]));
            }
            //console.log(partSet);
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