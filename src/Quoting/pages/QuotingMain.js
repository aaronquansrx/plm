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

import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { useClientUrl } from '../../hooks/Urls';
import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import '../../css/main.css';

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
    function changePageState(i){
        setPageState({last: pageState.current, current: i});
    }
    function renderView(){
        switch(pageState.current){
            case 0: // main quote list for user
                return <Main user={props.user}  quotes={quotes} duties={duties} isAdmin={isAdmin.current}
                setQuotes={setQuotes} onOpenQuote={handleOpenQuote} changePageState={changePageState}/>
            case 1: //quoteView
                return <QuoteView quote={activeQuote} changePageState={changePageState} 
                user={props.username} store={props.store} currency={props.currency}/>
            case 2:
                return <CreateQuote changePageState={changePageState} onCreateQuote={handleCreateProduct} 
                lastPageState={pageState.last} user={props.username} setQuotes={setQuotes}/>
            case 3:
                return <EditQuote quote={activeQuote} user={props.username} changePageState={changePageState}
                lastPageState={pageState.last} setQuotes={setQuotes}/>
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

function Main(props){
    const clientUrl = useClientUrl();
    const [errorMessage, setErrorMessage] = useState(null);
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
    return(
        <div>
            <WarningToolTipButton onClick={handleCreateQuote} buttonText={'Create Quote'}>{errorMessage}</WarningToolTipButton>
            {/*<Button onClick={handleCreateQuote}>Create Quote</Button>*/}
            {/*<Button onClick={handleTemplates}>Templates</Button>*/}
            <h2>Quote List</h2>
            {/*
            <ListGroup>
                {props.quotes && props.quotes.map((q, i) => 
                    <ListGroup.Item key={i} onClick={props.onOpenQuote(q)} className="Pointer Quote">
                    <span>{q.id}</span>
                    <Badge bg="secondary">{q.details.customer}</Badge>
                    {q.users.map((user, u) => 
                        <Badge key={u}>{user.name}</Badge>
                    )}
                    <Badge bg="warning">{q.details.currency}</Badge>
                    </ListGroup.Item>
                )}
            </ListGroup>
            */}
            {<QuoteTable quotes={props.quotes} user={props.user} onOpenQuote={props.onOpenQuote} setQuotes={props.setQuotes}/>}
            {/*<UploadTemplateEditor />*/}
            {seeTable && <a href={clientUrl+"/tables"}>
                <Button>Tables</Button>
            </a>}
            {seeQuoteUsers &&
            <a href={clientUrl+"/quoteusers"}>
                <Button>Users</Button>
            </a>
            }
            {/*<Button onClick={handleToMaster}>Manufacturer Master List</Button>*/}
        </div>
    )
}

const quoteTableHeaders = [
    {name: 'RFQ#', resource: ['internal', 'rfq_number'], accessor: 'rfq'},
    {name: 'Owner', resource: ['users', 0, 'name'], accessor: 'owner'},
    {name: 'Site',  resource: ['internal', 'manufacturing_location'], accessor: 'site'},
    {name: 'Customer', resource: ['details', 'customer'], accessor: 'customer'},
    {name: 'Product Description', resource: ['details', 'description'], accessor: 'description'},
    {name: 'Application', resource: ['details', 'application'], accessor: 'application'}
];

function QuoteTable(props){
    const [selectedQuotes, setSelectedQuotes] = useState([]);
    console.log(selectedQuotes);
    useEffect(() => {
        setSelectedQuotes(props.quotes.map(() => false));
    }, [props.quotes]);
    function getVar(obj, resourceArray){
        let v = obj;
        resourceArray.forEach((ra) => {
            v = v[ra];
        })
        return v;
    }
    function handleClickQuote(quote){
        return function(){
            console.log(quote);
            props.onOpenQuote(quote);
        }
    }
    function handleCheckboxChange(i){
        setSelectedQuotes(update(selectedQuotes, {
            [i]: {$set: !selectedQuotes[i]}
        }));
    }
    function handleDelete(){
        const qids = selectedQuotes.reduce((arr, v, i) => {
            if(v){
                arr.push(props.quotes[i].id);
            }
            return arr;
        }, []);
        
        const postData = {function: 'delete_quotes', user: props.user.name, quote_ids: qids};
        postPLMRequest('quote', postData,
        (res) => {
            console.log(res.data);
            if(res.data.success){
                props.setQuotes(res.data.quotes);
            }
        },
        (res) => {
            console.log(res.data);
        }
        );
        
    }
    //getVar(quote, h.resource)
    return(
        <div>
        <Table>
            <thead>
                <tr>
                    <th></th>
                    {quoteTableHeaders.map((h, i) => {
                        return <th key={i}>{h.name}</th>;
                    })}
                </tr>
            </thead>
            <tbody>
                {props.quotes.map((quote, i) => {
                    return <tr key={i} onMouseOver={() => {}} className='RowSelector'>
                        <td>{<IdCheckbox i={i} onChange={handleCheckboxChange} checked={selectedQuotes.length > i ? selectedQuotes[i] : false}/>}</td>
                        {quoteTableHeaders.map((h, j) => {
                            return <td key={j} className='Pointer' onClick={props.onOpenQuote(quote)}>{quote.formatted[h.accessor]}</td>
                        })}
                    </tr>
                })}
            </tbody>
        </Table>
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