import {useState, useEffect, useRef} from 'react';

import update from 'immutability-helper';
import XLSX from 'xlsx';

import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';

import { Notification } from './Notifications';
import {SimplePopover} from '../../components/Tooltips';
import { BOMApiProgressBarV2 } from '../../components/Progress';
import { TemplateModal, ExcelExportModal, DeleteModal } from '../../components/Modals';

import { MasterManufacturerAdder, AlternateManufacturerAdder, SupplierButtonChooser } from './ManufacturerSupplierTables';

import { excelSheetToArray } from '../../scripts/ExcelHelpers';

import { IdCheckbox } from '../../components/Checkbox';
import { ExcelDropzone } from '../../components/Dropzone';
import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { bestPriceOffer } from '../../scripts/PLMAlgorithms';
import { TabPages } from '../../components/Tabs';
import { LabeledTextInput, TextInput } from '../../components/Forms';
import { pickKeysObject, objectToArray } from '../../scripts/General';
import { SimpleDropdown } from '../../components/Dropdown';
import { MasterWorkingUploadTable } from './UploadTable';
import { ToggleButtonList, ToggleButton } from '../../components/ButtonList';


//const statusOptions = ['Pending RFQ', 'RFQ Failed', 'Pending Quote', 'Missing Info', 'Quoted']; // old
const statusOptions = ['No Bid', 'Quoted', 'Pending Quote', 'Missing Info', 'Pending RFQ'];

export function ConsolidateView(props){
    const [modalDetails, setModalDetails] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [filteredData, setFilteredData] = useState(props.consolidatedData.data);
    const headers = props.consolidatedData.headers;
    useEffect(() => {
        setFilteredData(props.consolidatedData.data);
    }, [props.consolidatedData]);
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
            props.getAllConsolidateData();
            setModalDetails(null);
        },
        (res) => {
            console.log(res.data);
        }
        );

    }
    function handleUpdateExisting(){
        props.getAllConsolidateData();
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
    function handleToggle(b){
        if(b){
            const withoutManufacturer = props.consolidatedData.data.reduce((arr, line, i) => {
                if(!line.status.manu_found){
                    arr.push(line);
                }
                return arr;
            }, []);
            setFilteredData(withoutManufacturer);
        }else{
            setFilteredData(props.consolidatedData.data);
        }
    }
    const buttonListStyle = {display: 'flex', flexDirection: 'row', justifyContent: 'center'};
    return(
        <>
        {props.navigation}
        <div className='FlexNormal' style={buttonListStyle}>
        <ExcelExportModal show={showExportModal} onClose={handleCloseExport} onExport={handleExportExcel}/>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleExportModal}>Export</Button>
        <ToggleButton onToggle={handleToggle} init={false}>Filter Missing Master</ToggleButton>
        <Button onClick={handlePrices}>Data Mapping</Button>
        </div>
        <div className='MainTable'>
        <ConsolidateHeaderArrayTable data={filteredData} headers={headers}
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
    const [selectedGroup, setSelectedGroup] = useState(null)
    const headers = [
        {accessor: 'cpn', label: 'CPN'},
        {accessor: 'mpn', label: 'MPN'},  
        {accessor: 'master_manufacturer', label: 'Manufacturer'},
        {accessor: 'description', label: 'Description'},
        {accessor: 'total', label: 'Total'},
        {accessor: 'uom', label: 'UOM'},
        {accessor: 'packaging', label: 'Packaging'},
        {accessor: 'plc', label: 'Product Life Cycle'},
        {accessor: 'plm_price', label: 'Price'},
        {accessor: 'distributor', label: 'Distributor'}
    ];
    useEffect(() => {
        setSelectedGroup(props.priceGroups[props.priceGroups.length-1]);
    }, [props.priceGroups]);
    useEffect(() => {
        if(finished){
            const newData = props.priceSupplierMappingData.map((line, i) => {
                const newLine = reformatPriceData(line);
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
                        newLine.distributor = p.distributor;
                        newLine.plm_price = p.total_price;
                    }
                    if(data.details.length > 0){
                        newLine.packaging = data.details[0].Parameters.Packaging;
                        newLine.plc = data.details[0].Parameters['Part Status'];
                    }
                }
                return newLine;
            });
            //setPriceData(newData);
            props.setPriceSupplierMappingData(newData);
        }
    }, [finished]);
    function reformatPriceData(line){
        const newData = {distributor: null, plm_price: null, packaging: null,
        plc: ''};
        return {...line, ...newData};
    }
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
        const prices = props.priceSupplierMappingData.reduce((arr, line) => {
            if(line.plm_price !== null){
                arr.push(pickKeysObject(line, ['mpn', 'distributor', 'plm_price', 'packaging', 'plc']));
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
            props.setPriceGroups(res.data.groups);
        },
        (res) => {
            console.log(res.data);
        });
        setShowSaveModal(false);
    }
    function handleDeletePrices(){
        console.log(selectedGroup);
        const postData = {
            function: 'delete_prices', quote_id: props.quote.id, save_id: selectedGroup.id,
            user: props.user
        }
        postPLMRequest('quote', postData, 
        (res) => {
            console.log(res.data);
            props.setPriceGroups(res.data.groups);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleOpenSaveModal(){
        setShowSaveModal(true);
    }
    function handleCloseSaveModal(){
        setShowSaveModal(false);
    }
    function handleChangeGroup(name, i){
        //console.log('changeGroup');
        setSelectedGroup(props.priceGroups[i]);
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
            const newPriceData = props.priceSupplierMappingData.map((line) => {
                let newLine = reformatPriceData(line);
                if(newLine.mpn in mpnMap){
                    newLine = {...newLine, ...mpnMap[newLine.mpn]};
                }
                return newLine;
            }, []);
            props.setPriceSupplierMappingData(newPriceData);
            props.requestSupplierMapping(newPriceData);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function getPriceGroupName(pg){
        if(!pg) return 'No Prices Saved';
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
            <SimpleDropdown selected={getPriceGroupName(selectedGroup)}
                //props.priceGroups.length > 0 ? getPriceGroupName(props.priceGroups[props.priceGroups.length-1]) : null} 
            items={props.priceGroups.map((pg) => getPriceGroupName(pg))} onChange={handleChangeGroup}/>
            <Button onClick={handleOpenSaveModal}>Save</Button>
            <DeleteModal deleteName={'Prices'} onConfirm={handleDeletePrices}/>
        </div>
        <BOMApiProgressBarV2 show={showProgress} numParts={mpnSet.length} 
        numFinished={finishedParts.size} onHideBar={handleHide}/>
        <div className='MainTable'>
        <HeaderArrayTable data={props.priceSupplierMappingData} headers={headers}/>
        </div>
        </>
    );
}

const regions = ['AU', 'MY'];

export function SupplierMapping(props){
    const numSupplierColumns = props.numSupplierColumns;
    const [selected, setSelected] = useState(null);
    const [customHeaders, setCustomHeaders] = useState([]);
    const [showExport, setShowExport] = useState(false);
    const [supplierInputs, setSupplierInputs] = useState(props.supplierMappingData.map(() => null));
    const [filterNoSup, setFilterNoSup] = useState(false);
    const [filteredData, setFilteredData] = useState(props.supplierMappingData);

    const batchHeaders = Array.from(Array(props.numBatches)).map((_, i) => {
        return {accessor: 'sum'+i.toString(), label: 'Batch '+(i+1).toString()};
    });
    console.log(batchHeaders);
    const [errorText, setErrorText] = useState(null);
    useEffect(() => {
        if(errorText !== null) setTimeout(() => setErrorText(null), 2000);
    }, [errorText]);
    useEffect(() => {
        const filtData = getFilterData();
        setFilteredData(filtData);
    }, [props.supplierMappingData, filterNoSup]);
    useEffect(() => {
        const getData = {
            function: 'get_master_file_custom_header', quote_id: props.quote.id, user: props.user
        };
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            if(res.data.success){
                newCustomHeaders(res.data.header);
            }
        },
        (res) => {
            console.log(res.data);
        });
    }, []);
    function getFilterData(){
        const filt = props.supplierMappingData.reduce((arr, line) => {
            if(filterNoSup){
                if(line.suppliers.length === 0 && !('supplier0' in line)){
                    arr.push(line);
                }
            }else{
                arr.push(line);
            }
            return arr;
        }, []);
        return filt;
    }

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
    const supplierHeaders = Array.from(Array(numSupplierColumns)).map((_, n) => {
        const i = n+1;
        return {accessor: 'supplier'+i.toString(), label: 'Supplier '+i.toString()};
    });
    const customOptions = ['custom1', 'custom2', 'custom3', 'custom4', 'custom5', 'cms', 'comments',
        'commodity', 'designator', 'fitted', 'footprint', 'notes', 'srx_pn', 'supplier', 'spn',
        'critical_components', 'value', 'customer_price_string'
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
    function newCustomHeaders(newHeaders){
        setCustomHeaders(newHeaders);
        props.setCustomHeaders(newHeaders);
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
                res.data.region, res.data.manufacturer_supplier_map,
                res.data.quote_mapping_details.custom_supplier_manufacturer);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleChangeCustom(val, i){
        const headerId = customHeaders[i].id;
        const postData = {
            function: 'update_master_file_custom_header', quote_id: props.quote.id, 
            header_id: headerId, user: props.user, header_name: val
        }
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
            if(res.data.success){   
                newCustomHeaders(res.data.header);
            }
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleAddCustom(){
        const next = customOptions.reduce((n, curr) => {
            if(n === null && !customHeaders.includes(curr)){
                n = curr;
            }
            return n;
        }, null);
        if(next){
            const postData = {
                function: 'add_master_file_custom_header', quote_id: props.quote.id, 
                header_name: next, user: props.user
            }
            postPLMRequest('quote', postData,
            (res) => {
                console.log(res.data);
                if(res.data.success){   
                    newCustomHeaders(res.data.header);
                }
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleDeleteCustom(i){
        const headerId = customHeaders[i].id;
        const postData = {
            function: 'delete_master_file_custom_header', quote_id: props.quote.id, 
            header_id: headerId, user: props.user
        }
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
            if(res.data.success){   
                newCustomHeaders(res.data.header);
            }
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleShowExport(){
        setShowExport(true);
    }
    function handleExportExcel(fn){
        const customHeaderNames = customHeaders.map(h=>h.header);
        const keys = headers.map((h) => h.accessor).concat(customHeaders);
        const labels = headers.map((h) => h.label);
        const supplierLabels = supplierHeaders.map((h) => h.label);
        const fullLabels = labels.concat(customHeaders).concat(supplierLabels);

        const formattedData = props.supplierMappingData.map((line) => {
            return objectToArray(line, keys);
        });
        const supplierData = props.supplierMappingData.map((line) => {
            return Array.from(Array(numSupplierColumns)).reduce((arr, _, n) => {
                const i = (n + 1).toString();
                const val = line['supplier'+i.toString()] ? line['supplier'+i.toString()].name : '';
                arr.push(val);
                return arr;
            }, []);
        });
        const fullFormatted = formattedData.map((form, i) => {
            return form.concat(supplierData[i]);
        });
        console.log(fullFormatted);
        const excelData = [fullLabels].concat(fullFormatted);
        const sheet = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, '');
        XLSX.writeFile(wb, fn+'.xlsx');
        
    }
    function handleCloseExport(){
        setShowExport(false);
    }
    function handleAddSupplier(i, supplier){
        if(filteredData[i].full_master_manufacturer){
            const masterId = filteredData[i].full_master_manufacturer.id;
            const postData = {
                function: 'add_manufacturer_supplier', supplier_id: supplier.id, 
                manufacturer_id: masterId, region: props.region
            };
            postPLMRequest('srx_records', postData,
            (res) => {
                const postData2 = {
                    function: 'supplier_mapping', quote_id: props.quote.id,
                    user: props.user, manufacturer_list: props.manufacturerList, 
                    region: props.region
                };
                postPLMRequest('quote', postData2, 
                (res) => {
                    console.log(res.data);
                    if(res.data.success){
                        updateSupplierMappingData(res.data.manufacturer_supplier_map,
                            res.data.quote_mapping_details.custom_supplier_manufacturer);
                        setSupplierInputs(update(supplierInputs, {
                            [i]: {$set: null}
                        }));
                    }
                },
                (res) => {
                    console.log(res.data);
                });      
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    function handleAddQuoteSupplier(i, supplier){
        //console.log(supplier);
        const master_manufacturer = filteredData[i].full_master_manufacturer;
        //console.log(master_manufacturer);
        if(master_manufacturer){
            const postData = {
                function: 'add_quote_custom_supplier', supplier_id: supplier.id, 
                manufacturer_id: master_manufacturer.id, quote_id: props.quote.id,
                user: props.user, manufacturer_list: props.manufacturerList, 
                region: props.region
            };
            postPLMRequest('quote', postData,
            (res) => {
                console.log(res.data);
                updateSupplierMappingData(res.data.manufacturer_supplier_map,
                    res.data.quote_mapping_details.custom_supplier_manufacturer);
                setSupplierInputs(update(supplierInputs, {
                    [i]: {$set: null}
                }));
            },
            (res) => {
                console.log(res.data);
            });
        }else{
            setErrorText('No Master Manufacturer Linked');
        }
    }
    function handleDeleteQuoteSupplier(i, j){
        //console.log(i + ' ' + j);
        //console.log(props.supplierMappingData[i].custom_suppliers[j]);
        const saveID = props.supplierMappingData[i].custom_suppliers[j].custom_id;
        const postData = {
            function: 'delete_quote_custom_supplier', quote_id: props.quote.id, user: props.user,
            manufacturer_list: props.manufacturerList, save_id: saveID, region: props.region
        };
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
            updateSupplierMappingData(res.data.manufacturer_supplier_map,
                res.data.quote_mapping_details.custom_supplier_manufacturer);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function updateSupplierMappingData(manufacturerSupplierMap, customSupplierManufacturerMap){
        const newData = props.supplierMappingData.map((line, i) => {
            const newLine = {...line};
            const manu = line.master_manufacturer;
            newLine.system = i;
            if(manu !== null){
                const suppliers = manufacturerSupplierMap[manu];
                const customs = manu in customSupplierManufacturerMap ? customSupplierManufacturerMap[manu] : [];
                for(let j=0; j <= numSupplierColumns; j++){
                    delete newLine['supplier'+j.toString()];
                }
                suppliers.forEach((supplier, i) => {
                    const supString = 'supplier'+i.toString();
                    newLine[supString] = {name: supplier.supplier_name, type: 'global'};
                });
                newLine.suppliers = suppliers;
                customs.forEach((custom, i) => {
                    const supString = 'supplier'+(suppliers.length+i).toString();
                    newLine[supString] = {name: custom.supplier_name, type: 'custom'};
                });
                newLine.custom_suppliers = customs;
            }else{
                newLine.suppliers = []; 
                newLine.custom_suppliers = [];
            }
            return newLine;
        });
        console.log(newData);
        props.setSupplierMappingData(newData);
        props.updateRFQData(newData);
        return newData;
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
    function handleToggle(togg){
        setFilterNoSup(togg);
    }
    const buttonListStyle = {display: 'flex', flexDirection: 'row', justifyContent: 'center'};
    return(
        <>
        {props.navigation}
        <ExcelExportModal show={showExport} onClose={handleCloseExport} onExport={handleExportExcel}/>
        <div className='FlexNormal'>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <Button onClick={handleRequestForQuote}>Request For Quote</Button>
        </div>
        <div className='FlexNormal'>
        <Button onClick={handleAddCustom}>Add Custom Column</Button>
        <Button onClick={handleShowExport}>Export</Button>
        </div>
        <div className='FlexNormal' style={buttonListStyle}>
            <ToggleButton onToggle={handleToggle} init={filterNoSup}>Filter No Suppliers</ToggleButton>
            {/*<Button onClick={handleAutoMap} disabled={true}>Auto Map</Button>*/}
            <SimpleDropdown selected={props.region} items={regions} onChange={handleChangeRegion}/>
        </div>
        <div className='FlexNormal'>{errorText}</div>
        <div className='MainTable'>
        <SupplierMappingTable data={filteredData} headers={headers} 
        customHeaders={customHeaders.map(h=>h.header)} customOptions={customOptions}
        supplierInputs={supplierInputs} numSupplierColumns={numSupplierColumns}
        onDeselectSupplierInput={handleDeselectSupplierInput}
        onSelectSupplierInput={handleSelectSupplierInput}
        onSelectLine={handleSelectLine}
        onDeselectLine={handleDeselectLine}
        onChangeCustom={handleChangeCustom}
        onDeleteCustom={handleDeleteCustom}
        onAddSupplier={handleAddSupplier}
        onAddQuoteSupplier={handleAddQuoteSupplier}
        onDeleteQuoteSupplier={handleDeleteQuoteSupplier}
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
    function handleAddQuoteSupplier(i){
        return function(e){
            props.onAddQuoteSupplier(i, props.supplierInputs[i]);
        };
    }
    function handleRemoveCustom(i, j){
        return function(){
            props.onDeleteQuoteSupplier(i, j);
        }
    }
    function handleChangeHeader(val){
        return function(header){
            console.log(val);
            console.log(header);
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
                {Array.from(Array(props.numSupplierColumns)).map((n,i) => {
                    return <th key={i}>Supplier {i+1}</th>
                })}
                </tr>
            </thead>
            <tbody>
                {props.data.map((row, i) => {
                    //console.log(props.data);
                    let hasSupplierChooser = false;

                    const cn = selectedRow === i ? 'HighlightedRow' : (!row.status.manu_found ? 'NHL' 
                    : (row.suppliers.length === 0 && !('supplier0' in row) ? 'HLC' : ''));
                    return(
                    <tr key={i} className={cn} onClick={handleSelectLine(i)}>
                        {props.headers.map((h, j) => 
                            <td key={j}>{row[h.accessor]}</td>
                        )}
                        {props.customHeaders.map((header, j) => {
                            const out = row[header].length === 0 ? '' 
                            : (row[header].length === 1 ? row[header][0] : <SimpleDropdown 
                                 items={row[header]/*.concat('<ALL>')*/} onChange={handleChangeHeader(header)}/>);
                        return(
                            <td key={j}>
                                {out}
                            </td>
                        )
                        })}
                        {Array.from(Array(props.numSupplierColumns)).map((n, j) => {
                            let cell = '';
                            if(!hasSupplierChooser){
                                if(row['supplier'+j] === undefined){
                                    cell = <div style={{position: 'relative', height: 'auto'}}>
                                        <SupplierButtonChooser chosenSupplier={props.supplierInputs[i]}
                                    onSelectSupplier={handleSelectSupplierInput(i)}
                                    onDeselectSupplier={handleDeselectSupplierInput(i)}/>
                                    {props.supplierInputs[i] && 
                                    <>
                                    <Button onClick={handleAddSupplier(i)}>Add Global</Button>
                                    <Button onClick={handleAddQuoteSupplier(i)}>Add to Quote</Button>
                                    </>
                                    }
                                    </div>;
                                    hasSupplierChooser = true;
                                }else{
                                    if(row['supplier'+j].type === 'global'){
                                        cell = row['supplier'+j].name;
                                    }else{
                                        const customIndex = j - row['suppliers'].length;
                                        cell =
                                        <div>
                                            {row['supplier'+j].name}
                                            <Button onClick={handleRemoveCustom(i, customIndex)} variant='danger'>X</Button>
                                        </div>
                                    }
                                }
                            }else{
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
    const [showExportModal, setShowExportModal] = useState(false);
    const batchHeaders = Array.from(Array(props.numBatches)).map((_, i) => {
        return {accessor: 'sum'+i.toString(), label: 'Batch '+(i+1).toString()};
    });
    
    const customHeaders = props.customHeaders.map((header) => {
        return {accessor: header.header, label: header.header, type: 'custom'};
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
                console.log(row);
                return(
                <tr key={i} className={''} /*onClick={handleSelectLine(i)}*/>
                    {props.headers.map((h, j) => {
                        let contents = <></>;
                        if(h.type === 'custom'){
                            console.log(h.accessor);
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
    const [showExport, setShowExport] = useState(false);
    const [stickyTable, setStickyTable] = useState(false);
    const batchHeaders = Array.from(Array(props.numBatches)).map((_, i) => {
        return {accessor: 'sum'+i.toString(), label: 'Batch '+(i+1).toString()};
    });
    const customHeaders = props.customHeaders.map((header) => {
        return {accessor: header.header, label: header.header, type: 'custom'};
    });
    const mpnValues = new Set(props.RFQData.map((l) => l.mpn));
    const mfrValues = new Set(props.RFQData.map((l) => l.manufacturer));
    const supplierValues = new Set(props.RFQData.map((l) => l.supplier));
    const cpnValues = new Set(props.RFQData.map((l) => l.cpn));
    const [filters, setFilters] = useState({
        mpn: {items: mpnValues, active: mpnValues, display: 'MPN Filter', show: false}, 
        manufacturer: {items: mfrValues, active: mfrValues, display: 'Manufacturer Filter', show: false},
        supplier: {items: supplierValues, active: supplierValues, display: 'Supplier Filter', show: false},
        cpn: {items: cpnValues, active: cpnValues, display: 'CPN Filter', show: false}
    });
    const [filteredData, setFilteredData] = useState(props.RFQData);

    useEffect(() => {
        const newData = props.RFQData.reduce((arr, line) => {
            let notHave = true;
            Object.entries(filters).forEach(([key,value]) => {
                if(!value.active.has(line[key])){
                    notHave = false;
                }
            });
            if(notHave) arr.push(line);
            return arr;
        }, []);
        setFilteredData(newData);
    }, [filters, props.RFQData]);
    const masterHeaders = props.uploadMasterHeaders.reduce((arr, header) => {
        if(header.display){
            arr.push(header);
        }
        return arr;
    }, []);
    const mainHeaders = [
        {accessor: 'system', label: 'System Unique ID'}, 
        {accessor: 'cpn', label: 'CPN'},
        {accessor: 'description', label: 'Description'},
        {accessor: 'uom', label: 'UOM'},
        {accessor: 'mpn', label: 'Approved MPN'},
        {accessor: 'manufacturer', label: 'Approved MFR'},
        {accessor: 'supplier', label: 'Supplier'},
    ];
    const otherHeaders = [
        ...customHeaders,
        ...batchHeaders,
        {accessor: 'sum_eau', label: 'Total EAU'},
        {accessor: 'packaging', label: 'Packaging'},
        {accessor: 'plc', label: 'Product Life Cycle'},
        {accessor: 'customer_price_string', label: 'Customer Price'},
        {accessor: 'plm_price', label: 'PLM Price'},
        {accessor: 'distributor', label: 'Distributor'},
        {accessor: 'selection', label: 'Selection'},
        {accessor: 'status', label: 'Status'},
        {accessor: 'mqa', label: 'MQA Remarks'},
        {accessor: 'est_total_po', label: 'Est. Total PO cost (USD)'},
        {accessor: 'excess', label: 'Excess (USD)'},
        ...masterHeaders
    ];
    const headers = [
        ...mainHeaders,
        ...otherHeaders
    ];

    function handleBack(){
        if(props.changePageState){
            props.changePageState(3);
        }
    }
    function handleUpload(){
        if(props.changePageState){
            props.changePageState(5);
        }
    }
    function handleChangeFilterItem(filter, item){
        console.log(item);
        let list = new Set(filters[filter].active);
        if(filters[filter].active.has(item)){
            list.delete(item);
        }else{
            list.add(item);
        }
        console.log(list);
        setFilters(update(filters, {
            [filter]: {
                active: {$set: new Set(list)}
            }
        }));
    }
    function handleShowFilter(filter){
        setFilters(update(filters, {
            [filter]: {
                show: {$set: true}
            }
        }));
    }
    function handleCloseFilter(filter){
        return function(){
            console.log(filter);
            setFilters(update(filters, {
                [filter]: {
                    show: {$set: false}
                }
            }));
        }
    }
    function handleSelectAllFilter(filter){
        setFilters(update(filters, {
            [filter]: {
                active: {$set: new Set(filters[filter].items)}
            }
        }));
    }
    function handleDeselectAllFilter(filter){
        setFilters(update(filters, {
            [filter]: {
                active: {$set: new Set()}
            }
        }));
    }
    function handleShowExport(){
        setShowExport(true);
    }
    function handleCloseExport(){
        setShowExport(false);
    }
    function getFilterValues(filter){
        return filters[filter].items;
    }
    function handleExportExcel(fn){
        const keys = headers.map((h) => h.accessor);
        const labels = headers.map((h) => h.label);
        const formattedData = props.RFQData.map((line) => {
            return objectToArray(line, keys);
        });
        formattedData.forEach(line => {
            line.selection = line.selection ? 1 : 0;
        });
        const excelData = [labels].concat(formattedData);
        console.log(excelData);
        
        const sheet = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, '');
        XLSX.writeFile(wb, fn+'.xlsx');
        handleCloseExport();
    }
    function toggleStickyTable(){
        setStickyTable(!stickyTable);
    }
    function handleClickSelection(i){
        i = getRealLineNum(i);
        const newValue = !props.RFQData[i].selection;
        const updateData = {
            [i]: {
                selection: {$set: newValue}
            }
        }
        const selectionValueInt = newValue ? 1 : 0;
        const updateDataWF = [
            {update_fields: [{accessor: 'selection', value: selectionValueInt, type: 'integer'}], line: props.RFQData[i]}
        ];
        if(newValue){
            const findIndex = props.RFQData.reduce((ln, line, n) => {
                if(line.cpn === props.RFQData[i].cpn){
                    if(line.selection){
                        ln = n;
                    }
                }
                return ln;
            }, null);
            if(findIndex !== null && i !== findIndex){
                Object.assign(updateData, {[findIndex] : {
                    selection: {$set: false}
                }});
                updateDataWF.push({
                    update_fields: [{accessor: 'selection', value: 0, type: 'integer'}], 
                    line: props.RFQData[findIndex]
                });
            }
        }
        updateRFQData(updateDataWF);
        props.setRFQData(update(props.RFQData, updateData));
    }
    function updateRFQData(updateData){
        const postData = {
            function: 'update_working_file', quote_id: props.quote.id, user: props.user,
            update_data: updateData
        }
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleClearFilters(){
        setFilters(update(filters, {
            mpn: {
                active: {$set: mpnValues}
            },
            manufacturer: {
                active: {$set: mfrValues}
            },
            supplier: {
                active: {$set: supplierValues}
            },
            cpn: {
                active: {$set: cpnValues}
            }
        }));
    }
    function handleChangeStatus(ln, newStatus){
        ln = getRealLineNum(ln);
        const updateData = [{
            update_fields:[{accessor: 'status', value: newStatus, type: 'string'}],
            line: props.RFQData[ln]
        }];
        updateRFQData(updateData);
    }
    function handleChangeMQA(ln, newMQA){
        ln = getRealLineNum(ln);
        props.setRFQData(update(props.RFQData, {
            [ln]: {mqa: {$set: newMQA}}
        }));
        const updateData = [{
            update_fields:[{accessor: 'mqa', value: newMQA, type: 'string'}],
            line: props.RFQData[ln]
        }];
        updateRFQData(updateData);
    }
    function getRealLineNum(i){
        return filteredData[i].lineNum;
    }
    return(
        <>
        {props.navigation}
        <div className='FlexNormal' style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
            <Button variant='secondary' onClick={handleBack}>Back</Button>
            <Button onClick={handleUpload}>Upload</Button>
            <Button onClick={handleClearFilters}>Clear Filters</Button>
            <ListGroup.Item className={'ToggleItem'} onClick={toggleStickyTable} active={stickyTable}>
                Freeze Pane
            </ListGroup.Item>
            <Button onClick={handleShowExport}>Export</Button>
        </div>
        <div className='MainTable'>
            <MasterWorkingTable data={filteredData} headers={headers} stickyTable={stickyTable}
            mainHeaders={mainHeaders} otherHeaders={otherHeaders}
            filterNames={Object.keys(filters)} onClickFilter={handleShowFilter}
            onClickSelection={handleClickSelection}
            onChangeStatus={handleChangeStatus}
            onChangeMQA={handleChangeMQA}
            />
        </div>
        {Object.entries(filters).map(([key, value], i) => {
            return <FilterModal key={i} show={value.show} title={value.display} 
            items={getFilterValues(key)} onClose={handleCloseFilter(key)} 
            itemsActive={value.active} filter={key}
            onSelectAll={handleSelectAllFilter} onDeselectAll={handleDeselectAllFilter}
            onChangeItem={handleChangeFilterItem}/>
        })}
        <ExcelExportModal show={showExport} onClose={handleCloseExport} onExport={handleExportExcel}/>
        </>
    );
}

function MasterWorkingTable(props){
    const stickyColumnRefs = useRef([]);
    const [editMQA, setEditMQA] = useState(null);
    const [leftColumn, setLeftColumn] = useState(props.mainHeaders.map(() => 0));
    //const statusOptions = ['Pending RFQ', 'RFQ Failed', 'Pending Quote', 'Missing Info', 'Quoted'];
    useEffect(() => {
        let left = 0;
        const lefts = [];
        stickyColumnRefs.current.map(r => {
            lefts.push(left);
            if(r != null){
                left += r.clientWidth;
            }
        });
        setLeftColumn(lefts);
    }, [stickyColumnRefs, props.stickyTable, props.data]);
    useEffect(() => {
        setEditMQA(null);
    }, [props.data]);
    function handleClickHeader(headerName){
        return function(){  
            props.onClickFilter(headerName);
        }
    }
    function renderMainHeaders(){
        return props.mainHeaders.map((h, i) => {
            const sty = props.stickyTable ? {position: 'sticky', left: leftColumn[i]+'px', zIndex: 5} : {};
            if(props.filterNames.includes(h.accessor)){
                return <th key={i} onClick={handleClickHeader(h.accessor)} className='Select' style={sty} ref={r => stickyColumnRefs.current[i] = r}>
                    {<SimplePopover popoverBody={'Filter '+h.label} trigger={['hover', 'focus']} placement='auto'><div>{h.label}</div></SimplePopover>}
                </th>
            }
            return <th key={i} ref={r => stickyColumnRefs.current[i] = r} style={sty}>{h.label}</th>;
        })
    }
    function renderOtherHeaders(){
        return props.otherHeaders.map((h, i) => {
            return <th key={i}>{h.label}</th>;
        });
    }
    function handleClickData(i, j, accessor){
        return function(){
            if(accessor === 'selection'){
                //console.log(i + ' ' + j);
            }
            if(accessor === 'mqa'){
                //console.log(i + ' ' + j);
                setEditMQA(i);
            }
        }
    }
    function handleClickSelection(i){
        return function(){
            props.onClickSelection(i);
        }
    }
    function handleMQAEdit(ln){
        return function(str){
            //console.log(e);
            props.onChangeMQA(ln, str)
            setEditMQA(null);
        }
    }
    function handleChangeStatus(ln){
        return function(item){
            props.onChangeStatus(ln, item);
        }
    }
    return(
        <>
        <Table>
        <thead className={'TableHeading'}>
            <tr>
            {props.mainHeaders.map((h, i) => {
                const sty = props.stickyTable ? {position: 'sticky', left: leftColumn[i]+'px', background: 'rgb(202, 205, 207)' } : {};
                if(props.filterNames.includes(h.accessor)){
                    return <th key={i} onClick={handleClickHeader(h.accessor)} className='Select' 
                    ref={r => stickyColumnRefs.current[i] = r} style={sty}> 
                        {<SimplePopover popoverBody={'Filter '+h.label} trigger={['hover', 'focus']} placement='auto'>
                            <div>{h.label}</div>
                        </SimplePopover>}
                    </th>
                }
                return <th key={i} style={sty}
                ref={r => stickyColumnRefs.current[i] = r}>
                    {h.label}
                    </th>;
            })}
            {props.otherHeaders.map((h, i) => {
                const sty = i === 0 ? {} : {}
                return <th key={i} style={sty}>{h.label}</th>;
            })}
            </tr>
        </thead>
        <tbody>
            {props.data.map((row, i) => {
                //const lineNum = row.lineNum;
                //console.log(lineNum);
                return(
                <tr key={i} className={''}>
                    {props.headers.map((h, j) => {
                        let contents = <></>;
                        const sty = props.stickyTable && j < leftColumn.length ? 
                        {position: 'sticky', left: leftColumn[j]+'px', background: 'white', zIndex: 6} 
                        : {};
                        if(h.type === 'custom'){
                            if(row[h.accessor].length > 0){
                                contents = row[h.accessor][0];
                            }
                        }else if(h.accessor === 'mqa'){
                            contents = editMQA !== null && editMQA === i ? <LabeledTextInput onBlur={handleMQAEdit(i)}/> : row[h.accessor];
                        }else{
                            if(h.accessor === 'status'){
                                contents = <SimpleDropdown selected={row.status} items={statusOptions} 
                                onChange={handleChangeStatus(i)}/>
                            }else if(h.accessor === 'selection'){
                                contents = <IdCheckbox checked={row.selection} onChange={handleClickSelection(i)}/>
                            }else if((h.accessor === 'est_total_po' || h.accessor === 'excess') && row[h.accessor] !== null){
                                contents = row[h.accessor].toFixed(2);
                            }else{
                                contents = row[h.accessor];
                            }
                        }
                        return <td key={j} onClick={handleClickData(i, j, h.accessor)} style={sty}>{contents}</td>;
                    })}
                </tr>
                )}
            )}
        </tbody>
    </Table> 
    </>
    );
}

export function FilterModal(props){
    const [searchTerm, setSearchTerm] = useState('');
    const [buttonList, setButtonList] = useState([...props.items]);
    useEffect(() => {
        setButtonList([...props.items]);
    }, [props.items])
    function handleChangeList(items){
        if(props.onChangeList) props.onChangeList(props.filter, items);
    }
    function handleChangeItem(item, i){
        console.log(item);
        if(props.onChangeItem) props.onChangeItem(props.filter, item);
    }
    function handleSelectAll(){
        if(props.onSelectAll) props.onSelectAll(props.filter);
    }
    function handleDeselectAll(){
        if(props.onDeselectAll) props.onDeselectAll(props.filter);
    }
    function handleChangeTerm(st){
        //console.log(st);
        if(st !== ''){
            const buttons = [...props.items].reduce((arr, item) => {
                const lowerItem = item.toLowerCase();
                if(lowerItem.includes(st.toLowerCase())){
                    arr.push(item);
                }
                return arr;
            }, []);
            setButtonList(buttons);
        }else{
            setButtonList([...props.items]);
        }
        setSearchTerm(st);
    }
    //console.log(props.itemsActive);
    //console.log([...props.itemsActive]);
    const body = <>
        <Button onClick={handleSelectAll}>Select All</Button>
        <Button onClick={handleDeselectAll}>Deselect All</Button>
        <LabeledTextInput onChange={handleChangeTerm}/>
        <ToggleButtonList items={buttonList} itemsActive={[...props.itemsActive]} onToggleItem={handleChangeItem} onChangeList={handleChangeList}/>
    </>;
    return(
        <TemplateModal show={props.show} title={props.title} body={body} onClose={props.onClose}/>
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

export function MasterUpload(props){
    const [sheets, setSheets] = useState(null);
    function handleBack(){
        if(props.changePageState){
            props.changePageState(4);
        }
    }
    function handleDrop(wb, file){
        console.log(wb);
        const sheetNames = wb.SheetNames;
        const sheets = sheetNames.map((sn) => {
            const sheetArray = excelSheetToArray(wb.Sheets[sn]);
            return {name: sn, array: sheetArray};
        });
        setSheets(sheets);
    }
    return(
        <>
        <div className='FlexNormal'>
            <Button variant='secondary' onClick={handleBack}>Back</Button>
            <ExcelDropzone class='DropFiles' onDrop={handleDrop}>
                <p>Upload</p>
            </ExcelDropzone>
        </div>
        <MasterWorkingUploadTable headers={props.headers} sheets={sheets} statusOptions={statusOptions}
        onMasterUpload={props.onMasterUpload}/>
        </>
    );
}