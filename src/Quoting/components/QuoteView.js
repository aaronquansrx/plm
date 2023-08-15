import {useState, useEffect} from 'react';

import update from 'immutability-helper';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';

import XLSX from 'xlsx';

import { UploadTableSingle, UploadMain } from '../components/UploadTable';
import { ExcelDropzone } from '../../components/Dropzone';
import { SimpleArrayTable, HeaderArrayTable, EditTable } from '../../components/Tables';
import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { excelSheetToArray } from '../../scripts/ExcelHelpers';
import { ObjectSuggestionSearcher } from '../../components/Searcher';
import { Notification } from './Notifications';
import { HoverOverlay } from '../../components/Tooltips';
import { bestPriceOffer } from '../../scripts/PLMAlgorithms';

import { 
    ConsolidatePricesView, ConsolidateView, 
    SupplierMapping, RequestForQuoteList,
    MasterWorkingFile, MasterUpload
} from './ConsolidateViews';
import { EditQuote } from './CreateQuote';

function QuoteView(props){
    //console.log(props.quote);
    const [products, setProducts] = useState([]); //products with child data
    const [productsList, setProductsList] = useState([]); // list of products, regardless of child status (no child info)
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [highlightedProduct, setHighlightedProduct] = useState(null);
    const [pageState, setPageState] = useState({current:0, last: null});
    const [minBatches, setMinBatches] = useState(1);

    const [customHeaders, setCustomHeaders] = useState([]);
    const [consolidatedData, setConsolidatedData] = useState({
        data: [], headers: [], manufacturers: {}, totals: null, num_batches: 0
    });
    useEffect(() => {
        if(pageState.current === 0){
            setSelectedProduct(null);
            setHighlightedProduct(null);
        }
    }, [pageState]);

    useEffect(() => {
        const getData = {
            function: 'get_children', quote_id: props.quote.id, user: props.user
        }
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            updateProducts(res.data);
        },
        (res) => {
            console.log(res.data);
        });
    }, []);
    function updateProducts(data){
        setProducts(data.products);
        setProductsList(data.product_list);
        setMinBatches(data.num_batches);
    }
    function changeQuotePageState(i){
        setPageState(update(pageState, {
            current: {$set: i}
        }));
    }
    function handleEditQuote(){
        props.changePageState(4);
    }
    function handleBack(){
        props.changePageState(0);
    }
    function selectProduct(p){
        setSelectedProduct(p);
    }

    function handleConsolidate(data){
        /*
        setConsolidatedData(data);
        setPriceConsolidatedData(data.data);
        //setEditedConsolidatedData(data.data);
        setConsolidateStatus('Consolidate completed');
        setTimeout(() => {
            setConsolidateStatus(null);
        }, 2000);*/
        changeQuotePageState(3);
    }
    function handleConsolidateError(){
        /*
        setConsolidateStatus('Consolidate error');
        setTimeout(() => {
            setConsolidateStatus(null);
        }, 2000);
        */
    }
    function handleStartConsolidate(){
        //setConsolidateStatus('Consolidate running');
    }
    function renderView(){
        //const numBatches = consolidatedData ? consolidatedData.num_batches : 0;
        switch(pageState.current){
            case 0:
                return <MainQuoteView quote={props.quote} updateProducts={updateProducts} products={products} 
                productsList={productsList} user={props.user}
                changeMainPageState={props.changePageState} changeQuotePageState={changeQuotePageState} 
                selectProduct={selectProduct} minBatches={minBatches} onConsolidate={handleConsolidate}
                onStartConolidate={handleStartConsolidate} onConsolidateError={handleConsolidateError}
                setHighlightedProduct={setHighlightedProduct}/>
            case 1:
                return <UploadQuoteView products={products} quote={props.quote} user={props.user}
                update={updateProducts} changeQuotePageState={changeQuotePageState} product={selectedProduct}
                productsList={productsList} updateProducts={updateProducts}
                />
            case 2:
                return <ViewProduct product={selectedProduct} changeQuotePageState={changeQuotePageState} 
                quote={props.quote} user={props.user} />

            case 3:
                return <ConsolidatePage user={props.user} quote={props.quote}
                highlightedProduct={highlightedProduct}
                store={props.store} currency={props.currency} changeQuotePageState={changeQuotePageState}/>
            case 4:
                return <PartUsageView /*consolidatedData={consolidatedData}*/ 
                user={props.user} quote={props.quote} 
                changeQuotePageState={changeQuotePageState}/>
            //case 5:
            //    return <EditQuote quote={props.quote} changePageState={props.changePageState}
            //    user={props.user} />
        }
    }
    return(
        <>

            {renderView()}
        </>
    );
}

function ConsolidatePage(props){
    const messageTime = 3000;
    const numSupplierColumns = 5;
    const [pageState, setPageState] = useState({current:0, last: null});
    const [customHeaders, setCustomHeaders] = useState([]);
    const [consolidatedData, setConsolidatedData] = useState({
        data: [], headers: [], manufacturers: {}, totals: null, num_batches: 0, success: false
    });
    //const [priceConsolidatedData, setPriceConsolidatedData] = useState([]);
    const [priceSupplierMappingData, setPriceSupplierMappingData] = useState([]);
    const [RFQData, setRFQData] = useState([]);
    const [consolidateStatus, setConsolidateStatus] = useState({success: false,  message: null}); // success not used anymore (uses consolidatedData.success)
    //const [selectedPriceData, setSelectedPriceData] = useState(null);
    const [priceGroups, setPriceGroups] = useState([]);
    const [region, setRegion] = useState('AU');
    useState(() => {
        if(!consolidatedData.success) getAllConsolidateData();
    }, []);
    function getAllConsolidateData(){
        const getData = props.highlightedProduct === null ? {function: 'consolidate_quote', user: props.user, quote_id: props.quote.id} 
        : {function: 'consolidate_product', user: props.user, product_id: props.highlightedProduct};
        setConsolidateStatus({success: false, message: 'Consolidate running'});
        getPLMRequest('quote', getData,
        (res)=>{
            console.log(res.data);
            setConsolidatedData(res.data);
            //setPriceConsolidatedData(res.data.data);
            const spd = res.data.data.map((line, i) => {
                return {...line, system: i, suppliers: []};
            });
            setPriceSupplierMappingData(spd);
            requestInitialPriceData(res.data.data, res.data.manufacturers);
            //requestSupplierMapping(res.data.data, res.data.manufacturers);
            //setTimeout(() => setConsolidateStatus({success: true, message: 'Consolidate completed'}), 4000);
            setConsolidateStatus({success: true, message: 'Consolidate completed'})
            setTimeout(() => {
                setConsolidateStatus(update(consolidateStatus, {
                    success: {$set: true},
                    message: {$set: null}
                }));
            }, messageTime);
        },
        (res)=>{
            console.log(res.data);
            setConsolidateStatus('Consolidate error');
            setTimeout(() => {
                setConsolidateStatus(update(consolidateStatus, {
                    message: {$set: null}
                }));
            }, messageTime);
        });
        const getPriceGroupData = {
            function: 'price_groups', quote_id: props.quote.id, user: props.user
        };
        getPLMRequest('quote', getPriceGroupData,
        (res) => {
            console.log(res.data);
            setPriceGroups(res.data.groups);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function requestInitialPriceData(cd, manufacturers=null){
        if(!manufacturers){
            manufacturers = consolidatedData.manufacturers;
        }
        const getPriceData = {
            function: 'first_price_save', quote_id: props.quote.id, user: props.user
        };
        getPLMRequest('quote', getPriceData,
        (res) => {
            console.log(res.data);
            function reformatPriceData(line){
                const uom = line.uom.length > 0 ? line.uom[0] : '';
                const newData = {uom: uom, distributor: null, plm_price: null, packaging: null,
                plc: null};
                return {...line, ...newData};
            }
            let newPriceData = [...cd];
            if(res.data.prices !== null){
                const mpnPriceMap = res.data.prices.reduce((obj, p) => {
                    obj[p.mpn] = p;
                    return obj;
                }, {});
                newPriceData = [...cd].map((line, i) => {
                    let newLine = {...line};
                    newLine = reformatPriceData(newLine);
                    if(line.mpn in mpnPriceMap){
                        newLine = {...newLine, ...mpnPriceMap[line.mpn]};
                    }
                    return newLine;
                });
            }else{
                newPriceData = [...cd].map((line, i) => {
                    let newLine = {...line};
                    return reformatPriceData(newLine);
                });
            }
            requestSupplierMapping(newPriceData, manufacturers);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function requestSupplierMapping(priceCD, manufacturers=null){
        if(!manufacturers){ 
            manufacturers = consolidatedData.manufacturers;
        }
        const postQuoteSupplierMapping = {
            function: 'supplier_mapping', quote_id: props.quote.id, user: props.user,
            manufacturer_list: manufacturers
        }
        postPLMRequest('quote', postQuoteSupplierMapping,
        (res) => {
            console.log(res.data);
            const newData = updateSupplierMappingData(priceCD, 
                res.data.quote_mapping_details.region,
                res.data.manufacturer_supplier_map,
                res.data.quote_mapping_details.custom_supplier_manufacturer
            );
            updateRFQData(newData);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function updateSupplierMappingData(priceCD, region, manufacturerSupplierMap, customSupplierManufacturerMap){
        setRegion(region);
        //console.log(customSupplier);
        //const manufacturer_supplier_map = data.manufacturer_supplier_map;
        const newData = [...priceCD].map((line, i) => {
            const newLine = {...line};
            const manu = line.master_manufacturer;
            newLine.system = i;
            if(manu !== null){
                const suppliers = manufacturerSupplierMap[manu];
                const customs = manu in customSupplierManufacturerMap ? customSupplierManufacturerMap[manu] : [];
                //console.log(customs);
                for(let j=0; j <= 5; j++){
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
        //console.log(newData);
        setPriceSupplierMappingData(newData);

        return newData;
    }
    function updateRFQData(newData){
        let lines = -1;
        function returnLine(line, sup, sys){
            const status = 'Pending RFQ';
            lines++;
            return {...line, system: sys, supplier: sup.supplier_name, supplier_id: sup.supplier_id, 
                email: sup.email, status: status, selection: false, 
                mqa: null, est_total_po: null, excess: null, lineNum: lines};
        }
        const newRFQData = newData.reduce((arr, line, ln) => {
            const lines = line.suppliers.map((sup,i) => {
                const sys = line.system+'.'+i;
                return returnLine(line, sup, sys);
            });
            const customLines = line.custom_suppliers.map((sup,i) => {
                const sys = line.system+'.'+(i+line.suppliers.length);
                return returnLine(line, sup, sys);
            });
            return arr.concat(lines).concat(customLines);
        }, []);
        const postData = {
            function: 'load_working_file', rfq_data: newRFQData,
            quote_id: props.quote.id, user: props.user,
        }
        postPLMRequest('quote', postData, 
        (res) => {
            if(res.data.success){
                const compRFQData = loadIntoRFQData(res.data.upload_data, newRFQData, res.data.load_data_map);
                setRFQData(compRFQData);
            }
        },
        (res) => {
            console.log(res.data);
        });
    }
    function loadIntoRFQData(workingUploadData, newRFQData, loadDataMap=null){
        const mpnMap = workingUploadData.reduce((obj, data) => {
            if(data.quoted_mpn){
                if(data.quoted_mpn in obj){
                    obj[data.quoted_mpn][data.quoted_supplier] = data;
                }else{
                    obj[data.quoted_mpn] = {[data.quoted_supplier]: data};
                }
            }
            return obj;
        }, {});
        const cpnMap = workingUploadData.reduce((obj, data) => {
            if(data.cpn){
                if(data.cpn in obj){
                    obj[data.cpn][data.quoted_supplier] = data;
                }else{
                    obj[data.cpn] = {[data.quoted_supplier]: data};
                }
            }
            return obj;
        }, {});
        const updates = [];
        //console.log(mpnMap);
        function updateLine(newLine, isMpn=true){
            const oldStatus = newLine.status;
            if(isMpn) newLine = {...newLine, ...mpnMap[newLine.mpn][newLine.supplier]};
            else{
                newLine = {...newLine, ...cpnMap[newLine.cpn][newLine.supplier]};
            }
            if(loadDataMap === null){
                const updateFields = [
                    {accessor: 'mqa', value: newLine.mqa, type: 'string'}, 
                    {accessor: 'selection', value: newLine.selection, type: 'integer'}];
                updates.push({
                    update_fields: [{accessor: 'status', value: 'Quoted', type: 'string'}],
                    line: newLine
                });
                if(newLine.mqa){
                    updateFields.push({accessor: 'mqa', value: newLine.mqa, type: 'string'});
                }
                if(newLine.selection){
                    updateFields.push({accessor: 'selection', value: newLine.selection, type: 'integer'});
                }
                if(newLine.status === null){ 
                    newLine.status = oldStatus;
                }else{
                    updateFields.push({accessor: 'status', value: newLine.status, type: 'string'});
                }
                updates.push({
                    update_fields: updateFields,
                    line: newLine
                });
            }
            return newLine;
        }
        const compRFQData = newRFQData.map((line) => {
            let newLine = {...line};
            if(loadDataMap !== null && newLine.mpn in loadDataMap){
                if(newLine.supplier_id in loadDataMap[newLine.mpn]){
                    newLine = {...newLine, ...loadDataMap[newLine.mpn][newLine.supplier_id]};
                }
            }
            if(newLine.mpn in mpnMap){
                if(newLine.supplier in mpnMap[newLine.mpn]){
                    newLine = updateLine(newLine);
                    //const old
                    // newLine = {...newLine, ...mpnMap[newLine.mpn][newLine.supplier]};
                    // if(loadDataMap === null){
                    //     //newLine.status = 'Quoted';
                    //     updates.push({
                    //         update_fields: [{accessor: 'status', value: 'Quoted', type: 'string'}],
                    //         line: newLine
                    //     });
                    // }
                }
            }else if(newLine.cpn in cpnMap){
                if(newLine.supplier in cpnMap[newLine.cpn]){
                    newLine = updateLine(newLine, false);
                    // newLine = {...newLine, ...cpnMap[newLine.cpn][newLine.supplier]};
                    // if(loadDataMap === null){
                    //     //newLine.status = 'Quoted';
                    //     updates.push({
                    //         update_fields: [{accessor: 'status', value: 'Quoted', type: 'string'}],
                    //         line: newLine
                    //     });
                    // }
                }
            }
            return newLine;
        });
        console.log(compRFQData);
        compRFQData.forEach((line, i) => {
            const moq = parseInt(line.moq);
            const batch = parseFloat(line['sum0']);
            const spq = parseInt(line.spq);
            const price = parseFloat(line.price);
            const totalPo = (moq >= batch ? moq : Math.ceil(batch, spq)) * price;
            const excess = ((moq >= batch ? moq : Math.ceil(batch, spq))-batch) * price;

            if(!isNaN(totalPo)){
                compRFQData[i].est_total_po = totalPo;
            }
            if(!isNaN(excess)){
                compRFQData[i].excess = excess;
            }
        });
        if(updates.length > 0){
            const postData = {
                function: 'update_working_file', quote_id: props.quote.id, user: props.user,
                update_data: updates
            }
            postPLMRequest('quote', postData,
            (res) => {
                console.log(res.data);
            },
            (res) => {
                console.log(res.data);
            });
        }
        return compRFQData;
    }
    function changePageState(i){
        if(consolidatedData.success){
            setPageState(update(pageState, {
                current: {$set: i},
                last: {$set: pageState.last}
            }));
        }else{
            setConsolidateStatus(update(consolidateStatus, {
                message: {$set: 'Wait for consolidate completion'}
            }));
            setTimeout(() => setConsolidateStatus(update(consolidateStatus, {message: {$set: null}}), messageTime));
        }
    }
    const masterWorkingHeaders = [
        {accessor: 'mpn', label: 'Approved MPN', display: false},
        {accessor: 'cpn', label: 'CPN', display: false},

        {accessor: 'selection', label: 'Selection', display: false},
        {accessor: 'status', label: 'Status', display: false},
        {accessor: 'mqa', label: 'MQA Remarks', display: false},
        
        {accessor: 'quoted_supplier', label: 'Quoted Supplier', display: true},
        {accessor: 'quoted_mpn', label: 'Quoted MPN', display: true},
        {accessor: 'quoted_mfr', label: 'Quoted MFR', display: true},
        {accessor: 'leadtime', label: 'LT (calendar week)', display: true},
        {accessor: 'spq', label: 'SPQ', display: true},
        {accessor: 'currency', label: 'Currency', display: true},
        {accessor: 'moq', label: 'MOQ', display: true},
        {accessor: 'price', label: 'Price/pce', display: true},
        {accessor: 'book_price', label: 'Book Price (Y/N)', display: true},
        {accessor: 'payment_terms', label: 'Payment Terms', display: true},
        {accessor: 'incoterms', label: 'Incoterms', display: true},
        {accessor: 'incoterms_location', label: 'Incoterms Location', display: true},
        {accessor: 'country_of_origin', label: 'Country of Origin (COO)', display: true},
        {accessor: 'cancellation_window', label: 'Cancellation Window', display: true},
        {accessor: 'packaging_type', label: 'Packaging Type', display: true},
        {accessor: 'rohs', label: '(RoHS) (Y/N)', display: true},
        {accessor: 'reach', label: 'Reach (Y/N)', display: true},
        {accessor: 'conflict_minerals', label: 'Conflict Minerals (Y/N)', display: true},
        {accessor: 'nre_cost', label: 'NRE cost', display: true},
        {accessor: 'tooling_lead_time', label: 'Tooling Lead time (Week)', display: true},
        {accessor: 'remarks', label: 'Remarks', display: true}
    ];
    function handleMasterUpload(uploadData){
        const compRFQData = loadIntoRFQData(uploadData, RFQData);
        setRFQData(compRFQData);
        const postData = {
            function: 'upload_quote_master_file_data', quote_id: props.quote.id, user: props.user,
            upload_data: uploadData, 
        }
        postPLMRequest('quote', postData, 
        (res) => {
            console.log(res.data);
        },
        (res) => {
            console.log(res.data);
        });
        changePageState(4);
    }
    function renderView(){
        switch(pageState.current){
            case 0:
                return <ConsolidateView consolidatedData={consolidatedData} 
                changePageState={changePageState} changeQuotePageState={props.changeQuotePageState} 
                setConsolidatedData={setConsolidatedData} getAllConsolidateData={getAllConsolidateData}/>
            case 1:
                return <ConsolidatePricesView consolidatedData={consolidatedData} 
                priceSupplierMappingData={priceSupplierMappingData}
                priceGroups={priceGroups}
                setPriceGroups={setPriceGroups}
                user={props.user} quote={props.quote} 
                store={props.store} currency={props.currency}
                changePageState={changePageState}
                setPriceSupplierMappingData={setPriceSupplierMappingData}
                requestSupplierMapping={requestSupplierMapping}
                />
            case 2:
                return <SupplierMapping numBatches={consolidatedData.num_batches} consolidatedData={consolidatedData}
                changePageState={changePageState} supplierMappingData={priceSupplierMappingData}
                setSupplierMappingData={setPriceSupplierMappingData} setCustomHeaders={setCustomHeaders}
                region={region} setRegion={setRegion} quote={props.quote} user={props.user}
                updateSupplierMappingData={updateSupplierMappingData}
                manufacturerList={consolidatedData.manufacturers}
                numSupplierColumns={numSupplierColumns}
                updateRFQData={updateRFQData}
                />
            case 3:
                return <RequestForQuoteList numBatches={consolidatedData.num_batches} RFQData={RFQData} 
                changePageState={changePageState} setRFQData={setRFQData} customHeaders={customHeaders}/>
            case 4:
                return <MasterWorkingFile numBatches={consolidatedData.num_batches} RFQData={RFQData} setRFQData={setRFQData}
                changePageState={changePageState} customHeaders={customHeaders} 
                uploadMasterHeaders={masterWorkingHeaders}
                loadIntoRFQData={loadIntoRFQData} quote={props.quote} user={props.user}
                />
            case 5:
                return <MasterUpload headers={masterWorkingHeaders} changePageState={changePageState} onMasterUpload={handleMasterUpload}/>
        }
    }
    return(
        <>
        <ConsolidateNavigation changeQuotePageState={props.changeQuotePageState} changePageState={changePageState} selected={pageState.current}/>
        <div>
            {consolidateStatus.message}
        </div>
        {renderView()}
        </>
    );
}

function ConsolidateNavigation(props){
    function handleNavChange(i){
        return function(){
            //console.log(i);
            if(props.changePageState){
                props.changePageState(i);
            }
            //props.changeQuotePageState(i);
        }
    }
    function handleBack(){
        props.changeQuotePageState(0);
    }
    function styling(sel, i){
        if(sel === i) return { backgroundColor: '#acb3ba'};
        return {};
    }
    return(
        <div className='FlexNormal IconNav'>
            <div className='MainSwitchIcon'>
            <HoverOverlay tooltip={'Back to Quote'} placement='bottom'>
                    <div className={'Pointer'} onClick={handleBack}>
                        Back to Quote
                    </div>
                </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Consolidate'} placement='bottom'>
                    <div style={styling(props.selected, 0)} className={'Pointer'} 
                    onClick={handleNavChange(0)}>
                        Consolidate
                    </div>
                </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Price Data Mapping'} placement='bottom'>
                    <div style={styling(props.selected, 1)} className={'Pointer'} 
                    onClick={handleNavChange(1)}>
                        Price Data Mapping
                    </div>
                </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Supplier Mapping'} placement='bottom'>
                    <div style={styling(props.selected, 2)} className={'Pointer'} 
                    onClick={handleNavChange(2)}>
                        Supplier Mapping
                    </div>
                </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Request For Quote List'} placement='bottom'>
                    <div style={styling(props.selected, 3)} className={'Pointer'} 
                    onClick={handleNavChange(3)}>
                        Request For Quote List
                    </div>
                </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Master Working File'} placement='bottom'>
                    <div style={styling(props.selected, 4)} className={'Pointer'} 
                    onClick={handleNavChange(4)}>
                        Master Working File
                    </div>
                </HoverOverlay>
            </div>
        </div>
    );
}

function MainQuoteView(props){
    const [highlightedProduct, setHighlightedProduct] = useState(null);
    //const [parentProduct, setParentProduct] = useState(false);
    const [numBatches, setNumBatches] = useState(0);
    const [userRecommends, setUserRecommends] = useState([]);
    useEffect(() => {
        if(numBatches < props.minBatches){
            setNumBatches(props.minBatches);
        }
    }, [props.minBatches]);
    function handleEditQuote(){
        props.changeMainPageState(3);
    }
    function handleBack(){
        props.changeMainPageState(0);
    }
    function handleUpload(p){
        return function(){
            props.changeQuotePageState(1);
            props.selectProduct(p);
        }
    }
    function handleViewProduct(p){
        return function(){
            console.log(p);
            props.changeQuotePageState(2);
            props.selectProduct(p);
        }
    }
    function handleHighlightProduct(p){
        if(p === null){
            setHighlightedProduct(null);
            props.setHighlightedProduct(null);
        }else{
            if(p.id === highlightedProduct){
                setHighlightedProduct(null);
                props.setHighlightedProduct(null);
            }else{
                setHighlightedProduct(p.id);
                props.setHighlightedProduct(p.id);
            }
        }
    }
    function handleChangeBatches(e){
        const val = parseInt(e.target.value);
        if(val >= props.minBatches && val < 10){
            setNumBatches(val);
        }
    }
    function handleConsolidate(){
        props.onConsolidate();
    }
    
    function handlePartUsage(){
        props.changeQuotePageState(4);
    }
    
    function handleMainUpload(){
        props.changeQuotePageState(1);
        props.selectProduct(null);
    }
    function handleSearchUser(search){
        console.log(search);
        const getData = {function: 'users', search: search, limit: 5};
        getPLMRequest('srx_records', getData,
        (res) => {
            console.log(res.data);
            setUserRecommends(res.data.users);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleDeleteProduct(){
        if(highlightedProduct !== null){
            console.log(highlightedProduct);
            const getData = {function: 'delete_product', user: props.user, product_id: highlightedProduct, 
            quote_id: props.quote.id};
            getPLMRequest('quote', getData, 
            (res) => {
                console.log(res.data);
                props.updateProducts(res.data);
                setHighlightedProduct(null);
                props.setHighlightedProduct(null);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    return(
        <div className='Vert'>
            <div className='FlexNormal'>
            Customer BOM
            <Button variant="secondary" onClick={handleBack}>Quote List</Button>
            <Button onClick={handleEditQuote}>Edit Quote</Button>
            </div>
            <div>

            <div className='FlexNormal'>
                <div>
                <h3>{props.quote.formatted.rfq}</h3>
                <h5>Customer: {props.quote.formatted.customer}</h5>
                <h6>Owner: {props.quote.formatted.owner}</h6>
                <div className='Hori'>
                    <div className='FlexNormal' style={{display: 'flex', justifyContent: 'center'}}>
                    <Form>
                        <Form.Label>Number of Batches</Form.Label>
                        <Form.Control style={{width:'100px'}} type='number' value={numBatches} onChange={handleChangeBatches}/>
                    </Form>
                    </div>
                    <div className='FlexNormal'>
                        <Button onClick={handleConsolidate}>Consolidate</Button>
                        <Button onClick={handlePartUsage}>Part Usage</Button>
                    </div>
                </div>
                </div>
            </div>
            <h3>Products</h3>
            <ProductTable products={props.products} onViewProduct={handleViewProduct} quote={props.quote} 
            onUpload={handleUpload} user={props.user} productsList={props.productsList}
            onHighlightProduct={handleHighlightProduct} highlightedProduct={highlightedProduct} numBatches={numBatches}
            updateProducts={props.updateProducts}/>
            <div className='Hori'>
            <div className='Hori'>
            <ProductAdder updateProducts={props.updateProducts} user={props.user} quoteId={props.quote.id} 
            highlightedProduct={highlightedProduct}/>
            <Button variant='danger' onClick={handleDeleteProduct}>Delete</Button>
            </div>
            </div>
            </div>
            <Button onClick={handleMainUpload}>Upload</Button>
        </div>
    );
}

function ProductRow(props){
    const p = props.product;
    //console.log(p.batches);
    const [batches, setBatches] = useState(p.batches);
    const [edit, setEdit] = useState(false);
    const [name, setName] = useState(p.name);
    const [qty, setQty] = useState(p.qty ? p.qty : undefined);
    const [eau, setEau] = useState(p.eau ? p.eau : undefined);
    useEffect(() => {
        refreshProduct(p);
    }, [p]);
    useEffect(() => {
        //setBatches(props.batchesArr.map(() => undefined));
    }, [props.batchesArr]);
    function refreshProduct(newProduct){
        setName(newProduct.name);
        setQty(newProduct.qty ? newProduct.qty : undefined);
        setEau(newProduct.eau ? newProduct.eau : undefined);
        setBatches(newProduct.batches);
    }
    function handleChangeBatchValue(i){
        return function(e){
            if(!isNaN(e.target.value)){
                const val = parseInt(e.target.value);
                setBatches(update(batches, {
                    [i]: {$set: val}
                }));
            }
        }
    }
    function handleChangeQty(e){
        if(!isNaN(e.target.value)){
            const val = parseInt(e.target.value);
            setQty(val)
        }
    }
    function handleChangeEau(e){
        if(!isNaN(e.target.value)){
            const val = parseInt(e.target.value);
            setEau(val)
        }
    }
    function handleChangeName(e){
        setName(e.target.value);
    }
    function handleToggleEdit(){
        setEdit(!edit);
    }
    function handleSave(){
        console.log(batches);
        handleToggleEdit();
        const bd = {
            name: name,
            eau: eau,
            qty: qty,
            batches: batches
        }
        console.log(props.quoteId);
        const postData = {function: 'modify_batch', quote_id: props.quoteId, user: props.user, 
        product_id: p.id, batch_details: bd};
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
            props.updateProducts(res.data);
        },
        (res) => {
            console.log(res.data);
        }
        );
    }
    function handleHighlightProduct(e){
        //console.log(e.target.id);
        if(!edit && e.target.id !== 'edit') props.onHighlightProduct(p);
    }
    //console.log(name);
    return(
        <>
        <tr className={props.cn} onClick={handleHighlightProduct}>
            <td>{props.product && props.idValue}</td>
            <td>{edit ? <Form.Control type='text' value={name} onChange={handleChangeName}/> : name}</td>
            <td>
                {p.has_sheet ? <Button onClick={props.onViewProduct(p)}>View</Button> : 
                <Button variant='danger' onClick={props.onUpload(p)}>No Sheet</Button>}
            </td>
            <td>
            {edit ? <Form.Control type='text' value={qty !== undefined ? qty : ''} onChange={handleChangeQty}/> : qty ? qty : ''}
            </td>
            {props.batchesArr.map((n) => {
                return <td key={n}>
                    {edit ? <Form.Control type='text' value={batches[n] !== undefined ? batches[n] : ''} 
                    onChange={handleChangeBatchValue(n)}/> : batches[n] ? batches[n] : ''}
                </td>
            })}
            <td>
            {edit ? <Form.Control type='text' value={eau !== undefined ? eau : ''} onChange={handleChangeEau}/> : eau ? eau : ''}
            </td>
            <td>
                {edit ? <Button onClick={handleSave} id='edit'>Save</Button> : <Button variant='success' id='edit' onClick={handleToggleEdit}>Edit</Button>}
            </td>
        </tr>
        {props.children && props.children.map((child, i) => {
            return <ProductRow key={i} onHighlightProduct={props.onHighlightProduct} onViewProduct={props.onViewProduct}
            onUpload={props.onUpload} batchesArr={props.batchesArr} quoteId={props.quoteId} user={props.user} {...child}
            updateProducts={props.updateProducts}/>
        })}
        </>
    );
}

function ProductTable(props){
    const batchesArr = [...Array(props.numBatches).keys()];
    //console.log(props.productsList);
    //console.log(props.highlightedProduct);
    return(
        <Table>
        <thead>
        <tr>
            <th>Id</th><th>Name</th><th>Status</th><th>Qty</th>
            {batchesArr.map((n) => <th key={n}>Batch {n+1}</th>)}
            <th>EAU</th>
            <th>Edit</th>
        </tr>
        </thead>
        <tbody>
        {props.productsList.map((product, pid) => {
            const cn = product.id === props.highlightedProduct ? 'HighlightedRow' : '';
            return <ProductRow key={pid} user={props.user} onHighlightProduct={props.onHighlightProduct} onViewProduct={props.onViewProduct}
            onUpload={props.onUpload} product={product} cn={cn} quoteId={props.quote.id} idValue={product.id_string} batchesArr={batchesArr}
            updateProducts={props.updateProducts}/>
        })}
        </tbody>
        </Table>
    );
}

const productSheetHeaders = [
    {label: 'Level', accessor: 'level'},
    {label: 'Commodity', accessor: 'commodity'},
    {label: 'CMs', accessor: 'cms'},
    {label: 'Item No.', accessor: 'item_no'}, 
    {label: 'CPN', accessor: 'cpn'},
    {label: 'SRX PN', accessor: 'srx_pn'},
    {label: 'Description', accessor: 'description'},
    {label: 'Usage Per', accessor: 'usage_per_float'},
    {label: 'UOM', accessor: 'uom'},
    {label: 'Designator', accessor: 'designator'},
    {label: 'Approved MFR', accessor: 'mfr'},
    {label: 'Approved MPN', accessor: 'mpn'},
    {label: 'Supplier 1', accessor: 'supplier'},
    {label: 'Supplier Part Number 1', accessor: 'spn'},
    {label: 'Value', accessor: 'value'},
    {label: 'Footprint', accessor: 'footprint'},
    {label: 'Fitted', accessor: 'fitted'},
    {label: 'Notes', accessor: 'notes'},
    {label: 'Comments', accessor: 'comments'},
    {label: 'Batch Qty', accessor: 'batch_qty'},
    {label: 'Customer Price', accessor: 'customer_price_string'},
    {label: 'Critical Components', accessor: 'critical_components'},
    {label: 'Custom 1', accessor: 'custom1'},
    {label: 'Custom 2', accessor: 'custom2'},
    {label: 'Custom 3', accessor: 'custom3'},
    {label: 'Custom 4', accessor: 'custom4'},
    {label: 'Custom 5', accessor: 'custom5'}
];

function UploadQuoteView(props){
    const [sheets, setSheets] = useState(null);
    function handleBack(){
        props.changeQuotePageState(0);
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
            <div className='FlexNormal'>
            {/*<ProductAdder setProducts={props.setProducts} user={props.user} quoteId={props.quote.id}/>*/}
            </div>
            {props.product ?
            <UploadTableSingle sheets={sheets} productSheetHeaders={productSheetHeaders} user={props.user}
            products={props.products} updateProducts={props.updateProducts} quoteId={props.quote.id}
            product={props.product} changeQuotePageState={props.changeQuotePageState}/>
            : <UploadMain user={props.user} sheets={sheets} productsList={props.productsList} 
            productSheetHeaders={productSheetHeaders} quoteId={props.quote.id} updateProducts={props.updateProducts}
            changeQuotePageState={props.changeQuotePageState}/>}
        </>
    );
}

function ProductAdder(props){
    const [productName, setProductName] = useState('');
    const [errorTool, setErrorTool] = useState(null);
    function handleAddProduct(){
        if(productName !== ''){
            let pd;
            if(props.highlightedProduct){
                pd = {type: 'product', details: {name: productName}, parent_type:'product', child_type: 'product', 
                parent: props.highlightedProduct};
            }else{
                pd = {type: 'product', details: {name: productName}, parent_type:'quote', child_type: 'product',
            parent: props.quoteId};
            }
            //console.log(pd);
            const postData = {child_details: pd, function: 'add_child', user: props.user, quote_id:props.quoteId};
            postPLMRequest('quote', postData,
                (res) => {
                    console.log(res.data);
                    props.updateProducts(res.data);
                },
                (res) => {
                    console.log(res.data);
                },
            );
            setProductName('');
        }
    }
    function handleProductNameChange(e){
        setProductName(e.target.value);
    }
    return (
        <>
            <div>Product Name:</div>
            <Form.Control type={'text'} onChange={handleProductNameChange} value={productName}/>
            <Button onClick={handleAddProduct}>Add Product</Button>
        </>
    );
}

function ViewProduct(props){
    const [productSheet, setProductSheet] = useState(null);
    useEffect(() => {
        const getData = {function: 'get_product_sheet', user: props.user, product_id: props.product.id};
        getPLMRequest('quote', getData,
            (res) => {
                console.log(res.data);
                //props.setProducts(res.data.products);
                if(res.data.success){
                    setProductSheet(res.data.product_sheet);
                }
            },
            (res) => {
                console.log('error');
                console.log(res.data);
            }
        );
    }, [props.product]);
    function handleBack(){
        props.changeQuotePageState(0);
    }
    function handleSubmitEdit(cell, value){
        const row = cell.y;
        const header = productSheetHeaders[cell.x].accessor;
        const postData = {function: 'edit_sheet_value',
            user: props.user, product_id: props.product.id, value_details: {
            index: row, header: header, value, value
        }};
        postPLMRequest('quote', postData, 
        (res)=>{
            if(res.data.success){
                setProductSheet(res.data.product_sheet);
            }
        },
        (res)=> {
            console.log(res.data);
        });
    }
    function handleOverwrite(){
        props.changeQuotePageState(1);
    }
    function handleDownloadTemplate(){
        const headers = productSheetHeaders.map((v) => v.label);
        const sheet = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, 'Sheet');
        XLSX.writeFile(wb, 'headers.xlsx');
    }
    return(
        <>
        <div className={'FlexNormal'}>
        <Button onClick={handleDownloadTemplate}>Download Template</Button>
        <Button onClick={handleOverwrite}>Upload Overwrite</Button>
        <Button variant='secondary' onClick={handleBack}>Back to Quote</Button>
        <h3>{props.product.name}</h3>
        </div>
        {productSheet &&
        <div className='MainTable'>
        <EditTable headers={productSheetHeaders} data={productSheet} onSubmit={handleSubmitEdit}/>
        </div>
        }
        </>
    );
}

function PartUsageView(props){
    const [data, setData] = useState({data: [], headers: []});
    useEffect(() => {
        const getData = {function: 'part_usage', user: props.user, quote_id: props.quote.id};
        getPLMRequest('quote', getData,
        (res)=>{
            console.log(res.data);
            setData(res.data);
            //props.onConsolidate({data: res.data.data, headers: res.data.headers});
            //props.changeQuotePageState(4);
        },
        (res)=>{
            console.log(res.data);
        });
    }, []);
    function handleBack(){
        props.changeQuotePageState(0);
    }
    return(
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <HeaderArrayTable data={data.data} headers={data.headers}/>
        </div>
    );
}

function AddProductModal(props){
    const [name, setName] = useState('');
    function handleChange(e){
        setName();
        if(props.onChange) props.onChange(e.target.value, props.formId)
    }
    return(
        <Modal>
            <Modal.Header closeButton={true}>
                <Modal.Title>Add Products</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form.Control type={'text'} onChange={handleChange} value={props.value}/>
            </Modal.Body>

            <Modal.Footer>
                {/*<Button addProduct>Add Product</Button>*/}
            </Modal.Footer>
        </Modal>
    )
}


export default QuoteView;