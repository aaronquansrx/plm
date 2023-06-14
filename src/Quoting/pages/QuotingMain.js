import {useState, useEffect} from 'react';

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
    const [activeQuote, setActiveQuote] = useState(null);
    const [pageState, setPageState] = useState({current:0, last: null});
    useEffect(() => {
        const getData = {function: 'get_quotes', user: props.user}
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            if(res.data.success){
                setQuotes(res.data.quotes);
            }
        },
        (res) => {
            console.log(res.data);
        }
        );
    }, [props.user]);

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
                return <Main user={props.user} quotes={quotes} setQuotes={setQuotes} onOpenQuote={handleOpenQuote} changePageState={changePageState}/>
            case 1: //quoteView
                return <QuoteView quote={activeQuote} changePageState={changePageState} user={props.user} 
                store={props.store} currency={props.currency}/>
            case 2:
                return <CreateQuote changePageState={changePageState} onCreateQuote={handleCreateProduct} 
                lastPageState={pageState.last} user={props.user} setQuotes={setQuotes}/>
            case 3:
                return <EditQuote quote={activeQuote} user={props.user} changePageState={changePageState}
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
    function handleDrop(wb, file){
        console.log(wb);
        const sheetNames = wb.SheetNames;
        const sheets = sheetNames.map((sn) => {
            const sheetArray = excelSheetToArray(wb.Sheets[sn]);
            return {name: sn, array: sheetArray};
        });
        /*
        const ws = wb.Sheets['Material'];
        const data = XLSX.utils.sheet_to_json(ws, {header: 1});
        const colRange = XLSX.utils.decode_range(ws['!ref']).e.c+1;
        const passData = data.reduce((arr,l) => {
            const line = [];
            let activeLine = false; // check if line has content other than ''
            for(let i=0; i<colRange; i++){
                if(l[i]){
                    line.push(l[i].toString());
                    activeLine = true;
                }else{
                    line.push('');
                }
            }
            if(activeLine) arr.push(line);
            return arr;
        }, []);
        */

        /*

        const wbh = new WorkbookHandler(wb);
        //const esp = new ExcelSheetParser(wbh.getSheet('Material'));
        const espStructure = new ExcelSheetParser(wbh.getSheet('Structure'));
        const structureObject = espStructure.toObjectArray(0);
        console.log(structureObject);
        const products = structureObject.map((obj) => obj.Products);
        console.log(products);
        const quoteSheets = products.reduce((obj, p) => {
            const esp = new ExcelSheetParser(wbh.getSheet(p));
            const arr = esp.toObjectArray(0, quoteHeaders);
            obj[p] = arr;
            return obj;
        }, {});
        console.log(quoteSheets);

        */

        //const obj = esp.toObjectArray(4);
        //console.log(obj);

        //console.log(passData);
        //console.log('drop');
        props.droppedFile(sheets);
    }
    function os(r){
        console.log(r);
    }
    function handleCreateQuote(){
        props.changePageState(2);
    }
    function handleTemplates(){
        props.changePageState(4);
    }
    function handleToMaster(){
        props.changePageState(5);
    }
    return(
        <div>
            {/*
            <ExcelDropzone class='DropFiles' onDrop={handleDrop}>
                <p>Upload Quotes</p>
            </ExcelDropzone>
            */}
            <Button onClick={handleCreateQuote}>Create Quote</Button>
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
            <a href={clientUrl+"/tables"}>
                <Button>Tables</Button>
            </a>
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
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
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
    function showDeleteConfirm(){
        setDeleteConfirmModal(true);
    }
    function hideDeleteConfirm(){
        setDeleteConfirmModal(false);
    }
    function handleDelete(){
        const qids = selectedQuotes.reduce((arr, v, i) => {
            if(v){
                arr.push(props.quotes[i].id);
            }
            return arr;
        }, []);
        //console.log(qids);
        //console.log(props.quotes);
        
        const postData = {function: 'delete_quotes', user: props.user, quote_ids: qids};
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
        {/*<Button variant='danger' onClick={showDeleteConfirm}>Delete</Button>
        <ConfirmDeleteModal show={deleteConfirmModal} onConfirm={handleDelete} onClose={hideDeleteConfirm}/>*/}
        <DeleteModal deleteName='Quotes' onConfirm={handleDelete}/>
        </div>
    );
}
/*
function ConfirmDeleteModal(props){
    function handleClose(){
        if(props.onClose) props.onClose();
    }
    function handleConfirm(){
        if(props.onConfirm) props.onConfirm();
        if(props.onClose) props.onClose();
    }
    return(
        <Modal show={props.show} onHide={handleClose}>
            <Modal.Header closeButton={true}>
                <Modal.Title>Delete Quotes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Button onClick={handleConfirm}>Confirm</Button><Button onClick={handleClose} variant={'secondary'}>Cancel</Button>
            </Modal.Body>
        </Modal>
    );
}
*/
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