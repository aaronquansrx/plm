import {useState, useEffect, useRef} from 'react';

import { Link } from 'react-router-dom';

import XLSX from 'xlsx';
import update from 'immutability-helper';

import Spreadsheet from "react-spreadsheet";

import { WorkbookHandler, ExcelSheetParser, excelSheetToArray } from '../../scripts/ExcelHelpers';
import { SimpleArrayTable } from '../../components/Tables';
import {EditQuote, CreateQuote} from './../components/CreateQuote';
import QuoteView from './../components/QuoteView';
import UploadTemplateEditor from './../components/UploadTemplateEditor';
import UploadTable from './../components/UploadTable';
import LinkProductUpload from '../components/LinkProductUpload';
import {ExcelDropzone} from '../../components/Dropzone';
import {IdCheckbox} from '../../components/Checkbox';
import { HeaderArrayTable } from '../../components/Tables';
import { DeleteModal } from '../../components/Modals';
import { WarningToolTipButton } from '../../components/Tooltips';
import {FilterModal} from '../components/ConsolidateViews';
import { SimplePopover } from '../../components/Tooltips';
import { TemplateModal } from '../../components/Modals';
import { PaginationInterface } from '../../components/Pagination';

import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { useClientUrl } from '../../hooks/Urls';
import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import '../../css/main.css';
import { ListSelectDropdown, SimpleDropdown } from '../../components/Dropdown';

/*
const pageStates = [
    (props) => <Main {...props}/>, 
    (props) => <QuoteView {...props}/>, 
    (props) => <CreateQuote {...props}/>,
    (props) => <CustomerBOM {...props}/>,
    (props) => <UploadTable {...props}/>,
];
*/

const quoteHeaders = ["Level","Commodity","CMs","Item No.","CPN","SRX PN",
    "Description","Usage Per","UOM","Designator","Approved MFR","Approved MPN","Supplier 1",
    "Supplier Part Number 1","Value","Footprint","Fitted","Notes","Comments","Batch Qty"
];

function QuotingMain(props){
    const [quotes, setQuotes] = useState([]);
    const [duties, setDuties] = useState({});
    const [activeQuote, setActiveQuote] = useState(null);
    const [pageState, setPageState] = useState({current:0, last: null});
    const [quoteValues, setQuoteValues] = useState(getQuoteValues());
    const isAdmin = useRef(false);
    useEffect(() => {
        if(props.user){
            isAdmin.current = props.user.is_admin;
            const getUserDuty = {
                function: 'user_role_duties', user_id: props.user.id
            }
            getPLMRequest('user', getUserDuty, 
            (res) => {
                console.log(res.data);
                if(res.data.success && res.data.has_role){
                    if(res.data.has_role){
                        setDuties(res.data.duties);
                    }
                }
            },
            (res) => {
                console.log(res.data);
            });
        }else{
            isAdmin.current = false;
        }
        if(props.username && props.user){
            const getData = {function: 'get_quotes', user: props.username, user_id: props.user.id}
            getPLMRequest('quote', getData,
            (res) => {
                console.log(res.data);
                if(res.data.success){
                    setQuotes(res.data.quotes);
                }
            },
            (res) => {
                console.log(res.data);
            });
        }else{
            setQuotes([]);
        }
    }, [props.user, props.username]);
    useEffect(() => {
        setQuoteValues(getQuoteValues());
    }, [quotes]);
    function getQuoteValues(){
        return {
            rfq: new Set(quotes.map(q => q.formatted.rfq)),
            owner: new Set(quotes.map(q => q.owner)),
            customer: new Set(quotes.map(q => q.customer)),
            site: new Set(quotes.map(q => q.site)),
            status: new Set(['Closed', 'In Progress'])
        }
    }
    function handleOpenQuote(quote){
        return function(){
            setActiveQuote(quote)
            changePageState(1);
        }
    }
    function handleCreateProduct(quote){
        setActiveQuote(quote)
        changePageState(1);
    }
    function handleEditQuote(quote){
        setActiveQuote(quote)
        changePageState(1);
    }
    function changePageState(i){
        setPageState({last: pageState.current, current: i});
    }
    function renderView(){
        switch(pageState.current){
            case 0: // main quote list for user
                return <Main user={props.user}  quotes={quotes} duties={duties} isAdmin={isAdmin.current}
                setQuotes={setQuotes} onOpenQuote={handleOpenQuote} changePageState={changePageState}
                quoteValues={quoteValues}/>
            case 1: //quoteView
                return <QuoteView quote={activeQuote} changePageState={changePageState} 
                user={props.username} store={props.store} currency={props.currency}/>
            case 2:
                return <CreateQuote changePageState={changePageState} onCreateQuote={handleCreateProduct} 
                lastPageState={pageState.last} user={props.username} setQuotes={setQuotes}/>
            case 3:
                return <EditQuote quote={activeQuote} user={props.username} onEditQuote={handleEditQuote} changePageState={changePageState}
                lastPageState={pageState.last} setQuotes={setQuotes} details={activeQuote}/>
            case 4:
                return <LinkProductUpload quote={activeQuote}/>

        }
    }
    
    return(
        <>
            {renderView()}
        </>
    );
}
const its = ['In Progress', 'Closed'];
const statusVals = new Set([true, false]);
function Main(props){
    const clientUrl = useClientUrl();
    const [errorMessage, setErrorMessage] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [filters, setFilters] = useState({
        rfq: {items: props.quoteValues.rfq, active: props.quoteValues.rfq, 
            display: 'RFQ Filter', show: false},
        owner: {items: props.quoteValues.owner, active: props.quoteValues.owner, 
            display: 'Owner Filter', show: false},
        site: {items: props.quoteValues.site, active: props.quoteValues.site, 
            display: 'Site Filter', show: false},
        customer: {items: props.quoteValues.customer, active: props.quoteValues.customer, 
            display: 'Customer Filter', show: false},
        status: {items: new Set(its), active: new Set(its), display: 'Status Filter', show: false}
    });
    useEffect(() => {
        const cusValues = props.quoteValues.customer ? props.quoteValues.customer : new Set();
        setFilters(update(filters, {
            rfq: {items: {$set: props.quoteValues.rfq}, active: {$set: props.quoteValues.rfq}},
            owner: {items: {$set: props.quoteValues.owner}, active: {$set: props.quoteValues.owner}},
            site: {items: {$set: props.quoteValues.site}, active: {$set: props.quoteValues.site}},
            customer: {items: {$set: cusValues}, active: {$set: cusValues}},
            //status: {items: {$set: new Set(its)}, active: {$set: new Set(its)}}
        }));
    }, [props.quoteValues]);
    useEffect(() => {
        const newQuotes = props.quotes.reduce((arr, line) => {
            let notHave = true;
            Object.entries(filters).forEach(([key,value]) => {
                if(key === 'status'){
                    const v = line[key] ? 'In Progress' : 'Closed';
                    if(!value.active.has(v)){
                        notHave = false;
                    }
                }
                else if(!value.active.has(line[key])){
                    notHave = false;
                }
            });
            if(notHave) arr.push(line);
            return arr;
        }, []);
        setFilteredQuotes(newQuotes);
    }, [filters, props.quotes]);
    function getRFQValues(){
        return new Set(props.quotes.map(q => q.rfq));
    }
    useEffect(() => {
        if(props.user){
            setErrorMessage(null);
        }
    }, [props.user]);
    function handleDrop(wb, file){
        console.log(wb);
        const sheetNames = wb.SheetNames;
        const sheets = sheetNames.map((sn) => {
            const sheetArray = excelSheetToArray(wb.Sheets[sn]);
            return {name: sn, array: sheetArray};
        });
        props.droppedFile(sheets);
    }
    function os(r){
        console.log(r);
    }
    function handleCreateQuote(){
        if(props.user){
            props.changePageState(2);
        }else{
            setErrorMessage('Not logged in');
        }
    }
    function handleTemplates(){
        props.changePageState(4);
    }
    function handleToMaster(){
        props.changePageState(5);
    }
    //console.log(props.duties);
    const seeTable = 'table_access' in props.duties || props.isAdmin;
    const seeQuoteUsers = 'role_edit' in props.duties || props.isAdmin;
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
    function getFilterValues(filter){
        return filters[filter].items;
    }
    function handleShowFilter(filter){
        if(filter in filters){
            setFilters(update(filters, {
                [filter]: {
                    show: {$set: true}
                }
            }));
        }
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
    function handleClearFilters(){
        const upd = {};
        Object.entries(filters).forEach(([key,value]) => {
            upd[key] = {active: {$set: props.quoteValues[key]}}
        });
        setFilters(update(filters, upd));
    }
    function handleOpenOptions(){
        setShowOptions(true);
    }
    function handleCloseOptions(){
        setShowOptions(false);
    }
    return(
        <>
        <div className='FlexNormal'>
            <WarningToolTipButton onClick={handleCreateQuote} buttonText={'Create Quote'}>{errorMessage}</WarningToolTipButton>
            {seeTable && <a href={clientUrl+"/tables"}>
                <Button>Tables</Button>
            </a>}
            {seeQuoteUsers &&
            <a href={clientUrl+"/quoteusers"}>
                <Button>Users</Button>
            </a>}
            <Button onClick={handleOpenOptions}>
                Options
            </Button>
        </div>
        {Object.entries(filters).map(([key, value], i) => {
            //console.log(value);
            return <FilterModal key={i} show={value.show} title={value.display} 
            items={value.items} onClose={handleCloseFilter(key)} 
            itemsActive={value.active} filter={key}
            onSelectAll={handleSelectAllFilter} onDeselectAll={handleDeselectAllFilter}
            onChangeItem={handleChangeFilterItem}/>
        })}
        {<QuoteTable quotes={filteredQuotes} user={props.user} onOpenQuote={props.onOpenQuote} 
        onClickFilter={handleShowFilter} setQuotes={props.setQuotes} filterNames={Object.keys(filters)}/>}
        <QuoteOptionsModal show={showOptions} onClearFilters={handleClearFilters} onClose={handleCloseOptions}/>
        </>
    )
}

function QuoteOptionsModal(props){
    
    const body = <div>
        <Button onClick={props.onClearFilters}>Clear Filters</Button>
    </div>
    return(
        <TemplateModal show={props.show} title='Options' body={body} onClose={props.onClose}/>
    );
}

const quoteTableHeaders = [
    {name: 'RFQ#', resource: ['internal', 'rfq_number'], accessor: 'rfq'},
    {name: 'Owner', resource: ['users', 0, 'name'], accessor: 'owner'},
    {name: 'Site',  resource: ['internal', 'manufacturing_location'], accessor: 'site'},
    {name: 'Customer', resource: ['details', 'customer'], accessor: 'customer'},
    {name: 'Product Description', resource: ['details', 'description'], accessor: 'description'},
    {name: 'Application', resource: ['details', 'application'], accessor: 'application'},
    {name: 'Status', resource: ['status'], accessor: 'status'},
    {name: 'Date Created', resource: ['date_created'], accessor: 'date_created'},
    {name: 'Due Date', resource: ['internal', 'due_date'], accessor: 'due_date'}
];

function QuoteTable(props){
    const [selectedQuotes, setSelectedQuotes] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [maxPages, setMaxPages] = useState(0);
    const [page, setPage] = useState(0);
    const [filteredData, setFilteredData] = useState(props.quotes);
    useEffect(() => {
        setSelectedQuotes(props.quotes.map(() => false));
        const fd = props.quotes.slice(0, pageSize);
        setMaxPages(Math.ceil(props.quotes.length/pageSize));
        setFilteredData(fd);
        setPage(0);
    }, [props.quotes]);
    function handlePageClick(pn){
        const fd = props.quotes.slice(pn*pageSize, +(pn*pageSize) + +pageSize);
        setFilteredData(fd);
        setPage(pn);
    }
    function handlePageSizeChange(nps){
        setPageSize(nps);
        setMaxPages(Math.ceil(props.quotes.length/nps));
        const fd = props.quotes.slice(0, nps);
        setPage(0);
        setFilteredData(fd);
    }
    function handleCheckboxChange(i){
        setSelectedQuotes(update(selectedQuotes, {
            [i]: {$set: !selectedQuotes[i]}
        }));
    }
    function handleDelete(){
        const qids = selectedQuotes.reduce((arr, v, i) => {
            if(v){
                arr.push(filteredData[i].id);
            }
            return arr;
        }, []);
        const postData = {function: 'delete_quotes', user: props.user.user, quote_ids: qids};
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
            if(res.data.success){
                props.setQuotes(res.data.quotes);
            }
        },
        (res) => {
            console.log(res.data);
        });
    }

    function handleClickHeader(headerName){
        return function(){  
            props.onClickFilter(headerName);
        }
    }
    function handleChangeStatus(i){
        return function(newStatus){
            const status = newStatus === 'In Progress' ? 1 : 0;
            const postData = {
                function: 'update_quote_status',
                user: props.user.user,
                quote_id: filteredData[i].id,
                status: status
            }
            postPLMRequest('quote', postData, 
            (res) => {
                console.log(res.data);
            },
            (res) => {
                console.log(res.data);
            });
        }
    }
    return(
        <div className='MainTable'> 
        <Table>
        <thead>
            <tr>
                <th></th>
                {quoteTableHeaders.map((h, i) => {
                    if(props.filterNames.includes(h.accessor)){
                        return <th key={i} onClick={handleClickHeader(h.accessor)}
                        className='Select'>
                            {<SimplePopover popoverBody={'Filter '+h.name} trigger={['hover', 'focus']} placement='auto'>
                        <div>{h.name}</div>
                            </SimplePopover>}
                        </th>
                    }
                    return <th key={i} onClick={handleClickHeader(h.accessor)}>{h.name}</th>;
                })}
            </tr>
        </thead>
        <tbody>
            {filteredData.map((quote, i) => {
                return <tr key={i} onMouseOver={() => {}} className='RowSelector'>
                    <td>{<IdCheckbox i={i} onChange={handleCheckboxChange} checked={selectedQuotes.length > i ? selectedQuotes[i] : false}/>}</td>
                    {quoteTableHeaders.map((h, j) => {
                        let val = h.resource.reduce((v, r) => {
                            if(v && r in v){
                                return v[r];
                            }
                            return v;
                        }, quote);
                        if(typeof val === 'object') val = '';
                        if(h.accessor === 'status'){
                            return  <td key={j} className='Pointer'>{
                                <SimpleDropdown selected={quote.status ? its[0] : its[1]} items={its}
                                onChange={handleChangeStatus(i)}/>
                            }</td>;
                        }
                        return <td key={j} className='Pointer' onClick={props.onOpenQuote(quote)}>{val}</td>
                    })}
                </tr>
            })}
        </tbody>
        </Table>
        <div className='PageInterface'>
        <div>
            <PaginationInterface page={page} displayWidth={2} onPageClick={handlePageClick} 
            pageSize={pageSize} max={maxPages} onPageChangeSize={handlePageSizeChange}/>
        </div>
        </div>
        <DeleteModal deleteName='Quotes' onConfirm={handleDelete}/>
        </div>
    );
}
/*
function QuoteView(props){
    return(
    <div>
        <Button variant="secondary" onClick={props.back}>Quote List</Button>
        <div>
        <h3>{props.quote.id}</h3>
        <h5>Customer: {props.quote.details.customer}</h5>
        <h6>Users: {props.quote.users.map(u => <Badge>{u}</Badge>)}</h6>
        <div>
            Contents goes here
        </div>
        </div>
    </div>
    )
}*/

/*
//Manufacturer Master List
function ManufacturerMasterList(props){
    const [manuInputs, setManuInputs] = useState({manufacturer: '', string: ''});
    const [masterManufacturerData, setMasterManufacturerData] = useState([]);
    const [manufacturerMap, setManufacturerMap] = useState({});
    useState(() => {
        getManufacturers();
    }, []);
    const headers = [{label: 'Manufacturer', accessor: 'name'}, {label: 'Alias', accessor: 'string'}];
    function handleBack(){
        props.changePageState(0);
    }
    function getManufacturers(){
        const getData = {function: 'manufacturer_string'};
        getPLMRequest('srx_records', getData, 
        (res) => {
            console.log(res.data);
            updateDatas(res.data);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function updateDatas(data){
        setMasterManufacturerData(data.manufacturer_master);
        setManufacturerMap(data.manufacturer_map);
    }
    function handleChangeInputs(inp){
        return function(e){
            setManuInputs(update(manuInputs, {
                [inp]: {$set: e.target.value}
            }));
        }
    }
    function handleAddManufacturer(){
        console.log(manuInputs);
        setManuInputs(update(manuInputs, {
            string: {$set: ''}
        }));
        const hasManufacturerString = manuInputs.manufacturer in manufacturerMap && 
        manufacturerMap[manuInputs.manufacturer].includes(manuInputs.string);
        if(!hasManufacturerString){
            const postData = {function: 'manufacturer_string', 
            details: {manufacturer: manuInputs.manufacturer, string: manuInputs.string}};
            postPLMRequest('srx_records', postData, 
            (res)=>{
                console.log(res.data);
                updateDatas(res.data);
            },
            (res)=>{
                console.log(res.data);
            });
        }
    }
    return (
        <div>
        <Button variant='secondary' onClick={handleBack}>Back</Button>
        <HeaderArrayTable data={masterManufacturerData} headers={headers}/>
        <Form>
            <Form.Label>Manufacturer</Form.Label>
            <Form.Control type='text' value={manuInputs.manufacturer} onChange={handleChangeInputs('manufacturer')}/>
        </Form>
        <Form>
            <Form.Label>Alias</Form.Label>
            <Form.Control type='text' value={manuInputs.string} onChange={handleChangeInputs('string')}/>
        </Form>
        <Button onClick={handleAddManufacturer}>Add Manufacturer</Button>
        </div>
    );
}
*/

function SpreadsheetTemplate(props){

}

export default QuotingMain;