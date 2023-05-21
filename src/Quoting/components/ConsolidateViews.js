import {useState, useEffect} from 'react';

import update from 'immutability-helper';
import XLSX from 'xlsx';

import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { Notification } from './Notifications';
import {SimplePopover} from '../../components/Tooltips';
import { BOMApiProgressBarV2 } from '../../components/Progress';
import { TemplateModal, ExcelExportModal } from '../../components/Modals';

import { MasterManufacturerAdder, AlternateManufacturerAdder, SupplierButtonChooser } from './ManufacturerSupplierTables';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { bestPriceOffer } from '../../scripts/PLMAlgorithms';
import { ModalDialog } from 'react-bootstrap';
import { TabPages } from '../../components/Tabs';
import { pickKeysObject, objectToArray } from '../../scripts/General';
import { SimpleDropdown } from '../../components/Dropdown';


export function ConsolidateView(props){
    //const headers = consolidateHeaders.concat(props.consolidatedData.headers);
    const [modalDetails, setModalDetails] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const headers = props.consolidatedData.headers;
    console.log(headers);
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
    function handleExportModal(){
        setShowExportModal(true);
    }
    function handleExportExcel(filename){
        const keys = headers.map((h) => h.accessor);
        const formattedData = props.consolidatedData.data.map((line) => {
            const newLine = {...line};
            if(newLine.uom.length === 1){
                newLine.uom = newLine.uom[0];
            }else{
                newLine.uom = '';
            }
            return pickKeysObject(newLine, keys);
        });
        
        const sheet = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, '');
        XLSX.writeFile(wb, filename+'.xlsx');
        
    }
    function handleCloseExport(){
        setShowExportModal(false);
    }
    return(
        <div>
        <ExcelExportModal show={showExportModal} onClose={handleCloseExport} onExport={handleExportExcel}/>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleExportModal}>Export</Button>
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
                        {props.headers.map((h, j) => {
                            let contents;
                            switch(h.accessor){
                                case 'manufacturer':
                                    contents = <SimplePopover popoverBody={pt} trigger={['hover', 'focus']} placement='auto'>
                                        <div>{row[h.accessor]}</div>
                                    </SimplePopover>
                                    break;
                                case 'uom':
                                    if(row.uom.length === 0){
                                        contents = 'No UOM found';
                                    }else if(row.uom.length === 1){
                                        contents = row.uom[0];
                                    }else{
                                        contents = 'Multiple UOMs: ';
                                        row.uom.forEach((uom) => {
                                            contents = contents.concat(uom+' ');
                                        });
                                    }
                                    break;
                                default:
                                    contents = row[h.accessor];
                                    break;
                            }
                            return(
                            <td key={j} className={cn}>
                                {contents}
                            </td>
                            )
                        })}
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
        {accessor: 'uom', label: 'UOM'},
        {accessor: 'packaging', label: 'Packaging'},
        {accessor: 'plc', label: 'Product Life Cycle'},
        {accessor: 'price', label: 'Price'}
    ];
    const [showProgress, setShowProgress] = useState(false);
    const [priceData, setPriceData] = useState(props.consolidatedData.data.map((line) => {
        const uom = line.uom.length > 0 ? line.uom[0] : '';
        return {mpn: line.mpn, total: line.total, description: line.description,
            master_manufacturer: line.master_manufacturer, uom: uom,  price: null};
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
        props.changeQuotePageState(3);
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

const regions = ['AU', 'MY'];

export function SupplierMapping(props){
    //console.log(props.consolidatedData);
    //const [supplierInput, setSupplierInput] = useState(null);
    const [selected, setSelected] = useState(null);
    const [regionSelector, setRegionSelector] = useState('AU');
    const [customHeaders, setCustomHeaders] = useState([]);

    const [showExport, setShowExport] = useState(false);

    const [data, setData] = useState(props.consolidatedData.data.map((line, i) => {
        const uom = line.uom.length > 0 ? line.uom[0] : '';
        return {...line, system: i, uom: uom, suppliers: []}
    }));
    useEffect(() => {
        props.setEditedConsolidatedData(data);
    }, []);
    const batchHeaders = Array.from(Array(props.consolidatedData.num_batches)).map((_, i) => {
        return {accessor: 'sum'+i.toString(), label: 'Batch '+(i+1).toString()};
    });
    const headers = [
        {accessor: 'system', label: 'System Unique ID'},  
        {accessor: 'cpn', label: 'CPN'},
        {accessor: 'description', label: 'Description'},
        {accessor: 'uom', label: 'UOM'},
        {accessor: 'mpn', label: 'Approved MPN'},
        {accessor: 'manufacturer', label: 'Approved MFR'},  
        {accessor: 'description', label: 'Description'},
        ...batchHeaders,
        {accessor: 'sum_eau', label: 'Total EAU'},
        /*
        {accessor: 'supplier0', label: 'Supplier 1'},
        {accessor: 'supplier1', label: 'Supplier 2'},
        {accessor: 'supplier2', label: 'Supplier 3'},
        {accessor: 'supplier3', label: 'Supplier 4'},
        {accessor: 'supplier4', label: 'Supplier 5'}*/
    ];
    const customOptions = ['custom1', 'custom2', 'custom3', 'custom4', 'custom5', 'cms', 'comments',
        'commodity', 'designator', 'fitted', 'footprint', 'notes', 'srx_pn', 'supplier', 'spn',
        'critical_components', 'value', 'customer_price'];
    function handleBack(){
        props.changeQuotePageState(5);
    }
    function handleAddSupplier(){
        //if()
        const postData = {function: 'add_manufacturer_supplier'};

    }
    function handleSelectLine(i){
        console.log(i);
        setSelected(i);
    }
    function handleDeselectLine(){
        setSelected(null);
    }
    function handleAutoMap(){
        const postData = {
            function: 'get_manufacturer_supplier_list', 
            manufacturer_list: props.consolidatedData.manufacturers,
            region: regionSelector
        };
        postPLMRequest('srx_records', postData, 
        (res) => {
            console.log(res.data);

            const manufacturer_supplier_map = res.data.manufacturer_supplier_map;
            const newData = [...data].map((line) => {
                const newLine = {...line};
                //console.log(newLine);
                const manu = line.master_manufacturer;
                //console.log(manu);
                if(manu !== null){
                    const suppliers = manufacturer_supplier_map[manu];
                    suppliers.forEach((supplier, i) => {
                        const supString = 'supplier'+i.toString();
                        newLine[supString] = supplier.supplier_name;
                    });
                    newLine.suppliers = suppliers;
                }else{
                    newLine.suppliers = []; 
                }
                return newLine;
            });
            setData(newData);
            console.log(newData);
            props.setEditedConsolidatedData(newData);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleChangeRegion(item){
        setRegionSelector(item);
    }
    /*
    function handleSelectSupplierInput(supplier){
        setSupplierInput(supplier);
    }
    function handleDeselectSupplierInput(){
        setSupplierInput(null);
    }*/
    function handleRequestForQuote(){
        props.changeQuotePageState(7);
    }
    function handleChangeCustom(val, i){
        setCustomHeaders(update(customHeaders, {
            [i]: {$set: val}
        }));
    }
    function handleAddCustom(){
        const next = customOptions.reduce((n, curr) => {
            if(n === null && !customHeaders.includes(curr)){
                n = curr;
            }
            return n;
        }, null);
        if(next){
            setCustomHeaders(update(customHeaders, {
                $push: [next]
            }));
        }
    }
    function handleShowExport(){
        setShowExport(true);
    }
    function handleExportExcel(fn){
        console.log('do export: '+fn);
        const keys = headers.map((h) => h.accessor).concat(customHeaders);
        const labels = headers.map((h) => h.label);
        const fullLabels = labels.concat(customHeaders);
        const formattedData2 = data.map((line) => {
            return objectToArray(line, keys);
        });
        const excelData = [fullLabels].concat(formattedData2);
        
        const sheet = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, '');
        XLSX.writeFile(wb, fn+'.xlsx');
        
    }
    function handleCloseExport(){
        setShowExport(false);
    }
    function handleAddSupplier(i, supplier){
        //console.log(i);
        //console.log(supplier);
        console.log(data[i]);
        const postData = {function: 'add_manufacturer_supplier', supplier_id: supplier.id, };
        postPLMRequest('srx_records', postData,
        (res) => {
            console.log(res.data);
        },
        (res) => {
            console.log(res.data);
        });
    }
    return(
        <>
        <ExcelExportModal show={showExport} onClose={handleCloseExport} onExport={handleExportExcel}/>
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleRequestForQuote}>Request For Quote</Button>
        {/*
        <div><SupplierButtonChooser chosenSupplier={supplierInput}
        onSelectSupplier={handleSelectSupplierInput}
        onDeselectSupplier={handleDeselectSupplierInput}/>
        </div>
        <Button onClick={handleAddSupplier} 
        disabled={supplierInput === null || selected === null}>
            Add Supplier
        </Button>
        */}
        <div>
        <Button onClick={handleAddCustom}>Add Custom Column</Button>
        <Button onClick={handleShowExport}>Export</Button>
        </div>
        <div>
        
        <Button onClick={handleAutoMap}>Auto Map</Button>
        <SimpleDropdown selected={regionSelector} items={regions} onChange={handleChangeRegion}/>
        </div>
        </div>
        <SupplierMappingTable data={data} headers={headers} 
        customHeaders={customHeaders} customOptions={customOptions}
        onSelectLine={handleSelectLine}
        onDeselectLine={handleDeselectLine}
        onChangeCustom={handleChangeCustom}
        onAddSupplier={handleAddSupplier}
        />
        </>
    )
}

function SupplierMappingTable(props){
    const [supplierInputs, setSupplierInputs] = useState(props.data.map(() => null));
    const [selectedRow, setSelectedRow] = useState(null);
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
    function handleChange(i){
        return function(val){
            props.onChangeCustom(val, i);
        }
    }
    function handleSelectSupplierInput(i){
        return function(supplier){
            setSupplierInputs(update(supplierInputs, {
                [i]: {$set: supplier}
            }));
        }
    }
    function handleDeselectSupplierInput(i){
        return function(){
            setSupplierInputs(update(supplierInputs, {
                [i]: {$set: null}
            }));
        }
    }
    function handleAddSupplier(i){
        return function(){
            props.onAddSupplier(i, supplierInputs[i]);
        }
    }
    return(
        <Table>
            <thead>
                <tr>
                {props.headers.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                {props.customHeaders.map((header, i) => {
                    return(
                        <th key={i}><SimpleDropdown selected={header} 
                        items={props.customOptions} onChange={handleChange(i)}/>
                        </th>
                    );
                })}
                {Array.from(Array(5)).map((n,i) => {
                    return <th key={i}>Supplier {i+1}</th>
                })}
                </tr>
            </thead>
            <tbody>
                {props.data.map((row, i) => {
                    let hasSupplierChooser = false;
                    const cn = selectedRow === i ? 'HighlightedRow' : '';
                    return(
                    <tr key={i} className={cn} onClick={handleSelectLine(i)}>
                        {props.headers.map((h, j) => 
                            <td key={j}>{row[h.accessor]}</td>
                        )}
                        {props.customHeaders.map((header, j) => {
                        return(
                            <td key={j}>
                                {row[header]}
                            </td>
                        )
                        })}
                        {Array.from(Array(5)).map((n, j) => {
                            let cell = row['supplier'+j];
                            if(!hasSupplierChooser){
                                if(row['supplier'+j] === undefined){
                                    cell = <div><SupplierButtonChooser chosenSupplier={supplierInputs[i]}
                                    onSelectSupplier={handleSelectSupplierInput(i)}
                                    onDeselectSupplier={handleDeselectSupplierInput(i)}/>
                                    {supplierInputs[i] && <Button onClick={handleAddSupplier(j)}>Add</Button>}
                                    </div>;
                                    hasSupplierChooser = true;
                                }
                            }
                            return(
                            <td key={j}>
                                {cell}
                            </td>
                            )
                        })}
                    </tr>
                    )}
                )}
            </tbody>
        </Table>
    )
}

export function RequestForQuoteList(props){
    //console.log(props.editedData);
    const [data, setData] = useState(getRFQData());
    const [showExportModal, setShowExportModal] = useState(false);
    function getRFQData(){
        //props.editedData.
        const newData = props.editedData.reduce((arr, line) => {
            const lines = line.suppliers.map((sup,i) => {
                const sys = line.system+'.'+i;
                return {...line, system: sys, supplier: sup.supplier_name, email: sup.email};
            });
            return arr.concat(lines);
        }, []);
        return newData;
    }
    const batchHeaders = Array.from(Array(props.numBatches)).map((_, i) => {
        return {accessor: 'sum'+i.toString(), label: 'Batch '+(i+1).toString()};
    });
    const headers = [
        {accessor: 'system', label: 'System Unique ID'}, 
        {accessor: 'cpn', label: 'CPN'},
        {accessor: 'description', label: 'Description'},
        {accessor: 'uom', label: 'UOM'},
        {accessor: 'mpn', label: 'Approved MPN'},
        {accessor: 'manufacturer', label: 'Approved MFR'},
        ...batchHeaders,
        {accessor: 'sum_eau', label: 'Total EAU'},
        {accessor: 'supplier', label: 'Supplier'},
        {accessor: 'email', label: 'Email'}
    ];
    function handleBack(){
        props.changeQuotePageState(6);
    }
    function handleNext(){
        props.changeQuotePageState(8);
    }
    function handleShowExport(){
        setShowExportModal(true);
    }
    function handleExportExcel(fn){
        //console.log('do export: '+fn);
        const keys = headers.map((h) => h.accessor);
        const labels = headers.map((h) => h.label);
        /*
        const formattedData = data.map((line) => {
            const newLine = {...line};
            if(newLine.uom.length === 1){
                //newLine.uom = newLine.uom[0];
            }else{
                //newLine.uom = '';
            }
            return pickKeysObject(newLine, keys);
        });*/
        const formattedData2 = data.map((line) => {
            return objectToArray(line, keys);
        });
        const excelData = [labels].concat(formattedData2);
        console.log(excelData);
        
        const sheet = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, '');
        XLSX.writeFile(wb, fn+'.xlsx');
        
    }
    function handleCloseExport(){
        setShowExportModal(false);
    }
    return(
        <div>
            <ExcelExportModal show={showExportModal} onClose={handleCloseExport} onExport={handleExportExcel}/>
            <Button variant='secondary' onClick={handleBack}>Back</Button>
            <Button onClick={handleShowExport}>Export</Button>
            <Button onClick={handleNext}>Next</Button>
            <RFQTable data={data} headers={headers}/>
        </div>
    );
}

export function RFQTable(props){
    return (
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
                //const cn = selectedRow === i ? 'HighlightedRow' : '';
                return(
                <tr key={i} className={''} /*onClick={handleSelectLine(i)}*/>
                    {props.headers.map((h, j) =>
                        <td key={j}>{row[h.accessor]}</td>
                    )}
                </tr>
                )}
            )}
        </tbody>
    </Table> 
    );
}

export function MasterWorkingFile(props){
    function handleBack(){
        props.changeQuotePageState(7);
    }
    return(
        <div>
            <Button variant='secondary' onClick={handleBack}>Back</Button>
        </div>
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
            //console.log(retryTimes);
            if(retryTimes === maxRetries){
                partSet.add(mpn);
                setPartsFinished(new Set([...partSet]));
            }
            //console.log(partSet);
            current.push(mpn);
            
            if(partsToDo.length === current.length){
                if(retries.length > 0 && retryTimes < maxRetries){
                    /*
                    console.log(currentParts);
                    console.log(retries);
                    const parts = retries.map((retry) => retry.mpn);
                    partsToDo = parts;
                    retries = [];
                    current = [];
                    retryTimes++;
                    partsToDo.forEach((part) => {
                        callPart(part, handleCompletePart, handleError);
                    });*/
                    doRetry();
                }else{
                    setFinished(true);
                }
            }
            
        }
        function handleError(mpn){
            current.push(mpn);
            if(partsToDo.length === current.length){
                if(retries > 0 && retryTimes < maxRetries){
                    /*
                    console.log(currentParts);
                    console.log(retries);
                    const parts = retries.map((retry) => retry.mpn);
                    partsToDo = parts;
                    retries = [];
                    current = [];
                    retryTimes++;
                    partsToDo.forEach((part) => {
                        callPart(part, handleCompletePart, handleError);
                    });*/
                    doRetry();
                }else{
                    partSet.add(mpn)
                    setPartsFinished(partSet);
                    setFinished(true);
                }
            }
            //retries.push({apis: rets, mpn: mpn});
        }
        function doRetry(){
            const parts = retries.map((retry) => retry.mpn);
            partsToDo = parts;
            retries = [];
            current = [];
            retryTimes++;
            partsToDo.forEach((part) => {
                callPart(part, handleCompletePart, handleError);
            });
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