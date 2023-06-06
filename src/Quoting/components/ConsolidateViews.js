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
import { TabPages } from '../../components/Tabs';
import { LabeledTextInput } from '../../components/Forms';
import { pickKeysObject, objectToArray } from '../../scripts/General';
import { SimpleDropdown } from '../../components/Dropdown';


export function ConsolidateView(props){
    const [modalDetails, setModalDetails] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const headers = props.consolidatedData.headers;
    function handleBack(){
        //if(props.changeQuotePageState) props.changeQuotePageState(0);
        if(props.changePageState){
            props.changeQuotePageState(0);
        }
    }
    function handlePrices(){
        //if(props.changeQuotePageState) props.changeQuotePageState(5);
        if(props.changePageState){
            props.changePageState(1);
        }
    }
    function handleRowClick(r){
        console.log(props.consolidatedData.data[r]);
        setModalDetails({manufacturer: props.consolidatedData.data[r].manufacturer, row: r})
    }
    function handleClose(){
        setModalDetails(null);
    }
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
        <>
        {props.navigation}
        <div className='FlexNormal'>
        <ExcelExportModal show={showExportModal} onClose={handleCloseExport} onExport={handleExportExcel}/>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleExportModal}>Export</Button>
        <Button onClick={handlePrices}>Data Mapping</Button>
        <Notification data={props.consolidatedData}/>
        </div>
        <div className='MainTable'>
        <ConsolidateHeaderArrayTable data={props.consolidatedData.data} headers={headers}
        onRowClick={handleRowClick}/>
        </div>
        <div className='FlexNormal'>
        <TotalsDisplay data={props.consolidatedData.totals}/>
        </div>

        <TemplateModal show={modalDetails !== null} onClose={handleClose}
        body={body}
        />
        </>
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
            <thead className={'TableHeading'}>
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
            <thead className={'TableHeading'}>
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
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [partData, finished, requestParts, finishedParts] = usePartData(mpnSet, 0, props.currency, props.store);
    const [showProgress, setShowProgress] = useState(false);
    /*
    const [priceData, setPriceData] = useState(props.consolidatedData.data.map((line) => {
        const uom = line.uom.length > 0 ? line.uom[0] : '';
        return { ...line, uom: uom, price: null,
            distributor: null, packaging: null, plc: null
        };
    }));
    */
    //const [priceGroups, setPriceGroups] = useState([]);
    const headers = [
        {accessor: 'cpn', label: 'CPN'},
        {accessor: 'mpn', label: 'MPN'},  
        {accessor: 'master_manufacturer', label: 'Manufacturer'},
        {accessor: 'description', label: 'Description'},
        {accessor: 'total', label: 'Total'},
        {accessor: 'uom', label: 'UOM'},
        {accessor: 'packaging', label: 'Packaging'},
        {accessor: 'plc', label: 'Product Life Cycle'},
        {accessor: 'price', label: 'Price'},
        {accessor: 'distributor', label: 'Distributor'}
    ];
    useEffect(() => {
        if(finished){
            //console.log(partData);
            const newData = [...props.priceConsolidatedData];
            props.consolidatedData.data.forEach((line, i) => {
                if(partData.has(line.mpn)){
                    const data = partData.get(line.mpn);
                    let offers = [];
                    for(const api in data.apis){
                        const apiOffers = data.apis[api].offers.map((offer) => {
                            return {...offer, api: api};
                        });
                        offers = offers.concat(apiOffers);
                    }
                    const p = bestPriceOffer(offers, line.total);
                    if(p !== null){
                        newData[i].distributor = p.distributor;
                        newData[i].price = p.total_price;
                    }
                    if(data.details.length > 0){
                        newData[i].packaging = data.details[0].Parameters.Packaging;
                        newData[i].plc = data.details[0].Parameters['Part Status'];
                    }
                }
            });
            //setPriceData(newData);
            props.setPriceConsolidatedData(newData);
        }
        //getPriceGroups();
        //console.log(finished);
    }, [finished]);
    function handleBack(){
        if(props.changePageState){
            props.changePageState(0);
        }
    }
    function handleSupplierMapping(){
        if(props.changePageState){
            props.changePageState(2);
        }
    }
    function handleGetPrices(){
        console.log('requesting parts');
        requestParts();
        setShowProgress(true);
    }
    function handleHide(){
        setShowProgress(false);
    }
    function handleSavePrices(savename){
        console.log(savename);
        const prices = props.priceConsolidatedData.reduce((arr, line) => {
            if(line.price !== null){
                arr.push(pickKeysObject(line, ['mpn', 'distributor', 'price', 'packaging', 'plc']));
            }
            return arr;
        }, []);
        const postData = {
            function: 'save_prices', quote_id: props.quote.id, prices: prices, 
            name: savename, user: props.user
        };
        postPLMRequest('quote', postData, 
        (res) => {
            console.log(res.data);
        },
        (res) => {
            console.log(res.data);
        });
        setShowSaveModal(false);
    }
    /*
    function getPriceGroups(){
        const getData = {
            function: 'price_groups', quote_id: props.quote.id, user: props.user
        };
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            setPriceGroups(res.data.groups);
        },
        (res) => {
            console.log(res.data);
        });
    }*/
    function handleOpenSaveModal(){
        setShowSaveModal(true);
    }
    function handleCloseSaveModal(){
        setShowSaveModal(false);
    }
    function handleChangeGroup(name, i){
        const getData = {
            function: 'price_save', save_id: props.priceGroups[i].id, user: props.user
        };
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            const mpnMap = res.data.prices.reduce((obj, price) => {
                obj[price.mpn] = price;
                return obj;
            }, {});
            const newPriceData = props.priceConsolidatedData.map((line) => {
                if(line.mpn in mpnMap){
                    line = {...line, ...mpnMap[line.mpn]};
                }
                return line;
            }, []);
            //setPriceData(newPriceData);
            props.setPriceConsolidatedData(newPriceData);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function getPriceGroupName(pg){
        return pg.name+' '+pg.date_saved;
    }
    return(
        <>
        {props.navigation}
        <SavePricesModal show={showSaveModal} onSavePrices={handleSavePrices} onClose={handleCloseSaveModal}/>
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleGetPrices}>Request Prices</Button>
        <Button onClick={handleSupplierMapping}>Supplier Mapping</Button>
        </div>
        <div>
            <SimpleDropdown selected={props.priceGroups.length > 0 ? getPriceGroupName(props.priceGroups[props.priceGroups.length-1]) : null} 
            items={props.priceGroups.map((pg) => getPriceGroupName(pg))} onChange={handleChangeGroup}/>
            <Button onClick={handleOpenSaveModal}>Save</Button>
        </div>
        <BOMApiProgressBarV2 show={showProgress} numParts={mpnSet.length} 
        numFinished={finishedParts.size} onHideBar={handleHide}/>
        <div className='MainTable'>
        <HeaderArrayTable data={props.priceConsolidatedData} headers={headers}/>
        </div>
        </>
    );
}

const regions = ['AU', 'MY'];

export function SupplierMapping(props){
    //console.log(props.consolidatedData);
    //const [supplierInput, setSupplierInput] = useState(null);
    const [selected, setSelected] = useState(null);
    //const [regionSelector, setRegionSelector] = useState('AU');
    const [customHeaders, setCustomHeaders] = useState([]);

    const [showExport, setShowExport] = useState(false);
    //console.log(props.priceConsolidatedData);
    //const [data, setData] = useState(props.priceConsolidatedData.map((line, i) => {
        //const uom = line.uom.length > 0 ? line.uom[0] : '';
        //return {...line, system: i, suppliers: []};
    //}));

    const [supplierInputs, setSupplierInputs] = useState(props.supplierMappingData.map(() => null));
    useEffect(() => {
        //props.setEditedConsolidatedData(data);
    }, []);
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
        {accessor: 'description', label: 'Description'},
        ...batchHeaders,
        {accessor: 'sum_eau', label: 'Total EAU'}
    ];
    const customOptions = ['custom1', 'custom2', 'custom3', 'custom4', 'custom5', 'cms', 'comments',
        'commodity', 'designator', 'fitted', 'footprint', 'notes', 'srx_pn', 'supplier', 'spn',
        'critical_components', 'value', 'customer_price'
    ];
    function handleBack(){
        if(props.changePageState){
            props.changePageState(1);
        }
    }
    function handleRequestForQuote(){
        if(props.changePageState){
            props.changePageState(3);
        }
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
            region: props.region
        };
        postPLMRequest('srx_records', postData, 
        (res) => {
            const manufacturer_supplier_map = res.data.manufacturer_supplier_map;
            const newData = [...props.supplierMappingData].map((line) => {
                const newLine = {...line};
                const manu = line.master_manufacturer;
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
            props.setSupplierMappingData(newData);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleChangeRegion(item){
        //setRegionSelector(item);
        props.setRegion(item);
        const postData = {
            function: 'update_supplier_mapping_region', quote_id: props.quote.id, user: props.user,
            region: item, manufacturer_list: props.manufacturerList
        }
        postPLMRequest('quote', postData, 
        (res) => {
            console.log(res.data);
            props.updateSupplierMappingData(props.supplierMappingData,
                res.data.region, res.data.manufacturer_supplier_map, res.data);
        },
        (res) => {
            console.log(res.data);
        })
    }
    function handleChangeCustom(val, i){
        const newHeaders = update(customHeaders, {
            [i]: {$set: val}
        });
        setCustomHeaders(newHeaders);
        props.setCustomHeaders(newHeaders);
    }
    function handleAddCustom(){
        const next = customOptions.reduce((n, curr) => {
            if(n === null && !customHeaders.includes(curr)){
                n = curr;
            }
            return n;
        }, null);
        if(next){
            const newHeaders = update(customHeaders, {
                $push: [next]
            });
            setCustomHeaders(newHeaders);
            props.setCustomHeaders(newHeaders);
        }
    }
    function handleDeleteCustom(i){
        const newHeaders = update(customHeaders, {
            $splice: [[i, 1]]
        });
        setCustomHeaders(newHeaders);
        props.setCustomHeaders(newHeaders);
    }
    function handleShowExport(){
        setShowExport(true);
    }
    function handleExportExcel(fn){
        const keys = headers.map((h) => h.accessor).concat(customHeaders);
        const labels = headers.map((h) => h.label);
        const fullLabels = labels.concat(customHeaders);
        const formattedData2 = props.supplierMappingData.map((line) => {
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
        if(props.supplierMappingData[i].full_master_manufacturer){
            const masterId = props.supplierMappingData[i].full_master_manufacturer.id;
            const postData = {
                function: 'add_manufacturer_supplier', supplier_id: supplier.id, 
                manufacturer_id: masterId, region: props.region
            };
            postPLMRequest('srx_records', postData,
            (res) => {
                const newData = props.supplierMappingData.map((line) => {
                    const newLine = {...line};
                    if(newLine.master_manufacturer === props.supplierMappingData[i].master_manufacturer){
                        newLine.suppliers = res.data.suppliers;
                        res.data.suppliers.forEach((supplier, j) => {
                            const supString = 'supplier'+j.toString();
                            newLine[supString] = supplier.supplier_name;
                        });
                    }
                    return newLine;
                });
                props.setSupplierMappingData(newData);
                setSupplierInputs(update(supplierInputs, {
                    [i]: {$set: null}
                }));
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleSelectSupplierInput(i, supplier){
        setSupplierInputs(update(supplierInputs, {
            [i]: {$set: supplier}
        }));
    }
    function handleDeselectSupplierInput(i){
        setSupplierInputs(update(supplierInputs, {
            [i]: {$set: null}
        }));
    }
    return(
        <>
        {props.navigation}
        <ExcelExportModal show={showExport} onClose={handleCloseExport} onExport={handleExportExcel}/>
        <div className='FlexNormal'>
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleRequestForQuote}>Request For Quote</Button>
        <div>
        <Button onClick={handleAddCustom}>Add Custom Column</Button>
        <Button onClick={handleShowExport}>Export</Button>
        </div>
        <div>
        <Button onClick={handleAutoMap}>Auto Map</Button>
        <SimpleDropdown selected={props.region} items={regions} onChange={handleChangeRegion}/>
        </div>
        </div>
        </div>
        <div className='MainTable'>
        <SupplierMappingTable data={props.supplierMappingData} headers={headers} 
        customHeaders={customHeaders} customOptions={customOptions}
        supplierInputs={supplierInputs}
        onDeselectSupplierInput={handleDeselectSupplierInput}
        onSelectSupplierInput={handleSelectSupplierInput}
        onSelectLine={handleSelectLine}
        onDeselectLine={handleDeselectLine}
        onChangeCustom={handleChangeCustom}
        onDeleteCustom={handleDeleteCustom}
        onAddSupplier={handleAddSupplier}
        />
        </div>
        </>
    )
}

function SupplierMappingTable(props){
    //const [supplierInputs, setSupplierInputs] = useState(props.data.map(() => null));
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
            props.onSelectSupplierInput(i, supplier);
        }
    }
    function handleDeselectSupplierInput(i){
        return function(){
            props.onDeselectSupplierInput(i);
        }
    }
    function handleAddSupplier(i){
        return function(){
            props.onAddSupplier(i, props.supplierInputs[i]);
        }
    }
    function handleDeleteCustom(i){
        return function(e){
            if(e.shiftKey){
                //console.log(e);
                props.onDeleteCustom(i);
            }
        }
    }
    return(
        <Table>
            <thead className={'TableHeading'}>
                <tr>
                {props.headers.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                {props.customHeaders.map((header, i) => {
                    return(
                        <th key={i} onClick={handleDeleteCustom(i)}>
                            <SimplePopover popoverBody='Shift+Click to delete' trigger={['hover', 'focus']} placement='auto'>
                            <div><SimpleDropdown selected={header} 
                            items={props.customOptions} onChange={handleChange(i)}/></div>
                            </SimplePopover>
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
                                    cell = <div><SupplierButtonChooser chosenSupplier={props.supplierInputs[i]}
                                    onSelectSupplier={handleSelectSupplierInput(i)}
                                    onDeselectSupplier={handleDeselectSupplierInput(i)}/>
                                    {props.supplierInputs[i] && <Button onClick={handleAddSupplier(i)}>Add</Button>}
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
    //const [data, setData] = useState(getRFQData());
    const [showExportModal, setShowExportModal] = useState(false);
    /*
    function getRFQData(){
        const newData = props.editedData.reduce((arr, line) => {
            const lines = line.suppliers.map((sup,i) => {
                const sys = line.system+'.'+i;
                return {...line, system: sys, supplier: sup.supplier_name, email: sup.email};
            });
            return arr.concat(lines);
        }, []);
        return newData;
    }
    useEffect(() => {
        props.setRFQData(data);
    }, [data]);
    */
    const batchHeaders = Array.from(Array(props.numBatches)).map((_, i) => {
        return {accessor: 'sum'+i.toString(), label: 'Batch '+(i+1).toString()};
    });
    const customHeaders = props.customHeaders.map((header) => {
        return {accessor: header, label: header, type: 'custom'};
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
        {accessor: 'email', label: 'Email'},
        ...customHeaders
    ];
    function handleBack(){
        if(props.changePageState){
            props.changePageState(2);
        }
    }
    function handleNext(){
        if(props.changePageState){
            props.changePageState(4);
        }
    }
    function handleShowExport(){
        setShowExportModal(true);
    }
    function handleExportExcel(fn){
        //console.log('do export: '+fn);
        const keys = headers.map((h) => h.accessor);
        const labels = headers.map((h) => h.label);
        const formattedData2 = props.RFQData.map((line) => {
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
        <>
        {props.navigation}
        <div className='FlexNormal'>
            <ExcelExportModal show={showExportModal} onClose={handleCloseExport} onExport={handleExportExcel}/>
            <Button variant='secondary' onClick={handleBack}>Back</Button>
            <Button onClick={handleShowExport}>Export</Button>
            <Button onClick={handleNext}>Next</Button>
        </div>
        <div className='MainTable'>
            <RFQTable data={props.RFQData} headers={headers}/>
        </div>
        </>
    );
}

export function RFQTable(props){
    return (
        <Table>
        <thead className={'TableHeading'}>
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
                    {props.headers.map((h, j) => {
                        let contents = <></>;
                        if(h.type === 'custom'){
                            if(row[h.accessor].length > 0){
                                contents = row[h.accessor][0];
                            }
                        }else{
                            contents = row[h.accessor];
                        }
                        return <td key={j}>{contents}</td>;
                    })}
                </tr>
                )}
            )}
        </tbody>
    </Table> 
    );
}

export function MasterWorkingFile(props){
    //const [data, setData] = useState(props.RFQData);
    const batchHeaders = Array.from(Array(props.numBatches)).map((_, i) => {
        return {accessor: 'sum'+i.toString(), label: 'Batch '+(i+1).toString()};
    });
    const customHeaders = props.customHeaders.map((header) => {
        return {accessor: header, label: header, type: 'custom'};
    });
    console.log(props.RFQData);
    const headers = [
        {accessor: 'system', label: 'System Unique ID'}, 
        {accessor: 'cpn', label: 'CPN'},
        {accessor: 'description', label: 'Description'},
        {accessor: 'uom', label: 'UOM'},
        {accessor: 'mpn', label: 'Approved MPN'},
        {accessor: 'manufacturer', label: 'Approved MFR'},
        ...customHeaders,
        ...batchHeaders,
        {accessor: 'sum_eau', label: 'Total EAU'},
        {accessor: 'packaging', label: 'Packaging'},
        {accessor: 'plc', label: 'Product Life Cycle'},
        {accessor: 'customer_price', label: 'Customer Price'},
        {accessor: 'price', label: 'PLM Price'},
        {accessor: 'distributor', label: 'Distributor'},
        {accessor: 'status', label: 'Status'}
    ];
    function handleBack(){
        if(props.changePageState){
            props.changePageState(3);
        }
    }
    return(
        <>
        {props.navigation}
        <div className='FlexNormal'>
            <Button variant='secondary' onClick={handleBack}>Back</Button>
        </div>
        <div className='MainTable'>
            <MasterWorkingTable data={props.RFQData} headers={headers}/>
        </div>
        </>
    );
}

function MasterWorkingTable(props){
    const statusOptions = ['Pending RFQ', 'RFQ Failed', 'Pending Quote', 'Missing Info', 'Quoted'];
    return(
        <Table>
        <thead className={'TableHeading'}>
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
                    {props.headers.map((h, j) => {
                        let contents = <></>;
                        if(h.type === 'custom'){
                            if(row[h.accessor].length > 0){
                                contents = row[h.accessor][0];
                            }
                        }else{
                            if(h.accessor === 'status'){
                                contents = <SimpleDropdown items={statusOptions}/>
                            }else{
                                contents = row[h.accessor];
                            }
                        }
                        return <td key={j}>{contents}</td>;
                    })}
                </tr>
                )}
            )}
        </tbody>
    </Table> 
    );
}

function usePartData(partList, numRetries, currency, store){
    const [partData, setPartData] = useState(new Map());
    const [finished, setFinished] = useState(false);
    const [partsFinished, setPartsFinished] = useState(new Set());
    const maxRetries = numRetries;
    //const [completeParts, setCompleteParts] = useState(new Set());
    //const [retries, setRetries] = useState({times: 0, parts: partList, current: new Set(), new: []});
    function handleRequestParts(){
        const controller = null;
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
                    doRetry();
                }else{
                    setFinished(true);
                }
            }
            console.log(partSet);
        }
        function handleError(mpn){
            current.push(mpn);
            partSet.add(mpn)
            setPartsFinished(partSet);
            if(partsToDo.length === current.length){
                if(retries.length > 0 && retryTimes < maxRetries){
                    doRetry();
                }else{
                    setFinished(true);
                }
            }
        }
        function doRetry(){
            const parts = retries.map((retry) => retry.mpn);
            partsToDo = parts;
            retries = [];
            current = [];
            retryTimes++;
            partsToDo.forEach((part) => {
                callPart(part, handleCompletePart, handleError, currency, store, controller);
            });
        }
        partsToDo.forEach((part) => {
            callPart(part, handleCompletePart, handleError, currency, store, controller);
        });
    }
    return [partData, finished, handleRequestParts, partsFinished];
}

function callPart(mpn, onComplete, onError, currency, store){
    const getData = {mpn: mpn, currency: currency, store: store};
    getPLMRequest('part', getData,
    (res) => {
        console.log(res.data);
        if(res.data.success){
            onComplete(mpn, res.data.refined);
        }else{
            onError(mpn);
        }
    },
    (res) => {
        onError(mpn);
    })
}


function SavePricesModal(props){
    const [name, setName] = useState('');
    const title = 'Save Prices';
    const body = <div>
        <LabeledTextInput label={'Name'} onChange={handleChangeName}/>
    </div>
    const footer = <>
        <Button onClick={handleSave}>Save</Button>
        <Button variant='secondary' onClick={handleClose}>Close</Button>
    </>
    function handleChangeName(n){
        setName(n);
    }
    function handleSave(){
        props.onSavePrices(name);
    }
    function handleClose(){
        props.onClose();
    }
    
    return(
        <TemplateModal show={props.show} onClose={props.onClose} title={title} body={body} footer={footer}/>
    )
}