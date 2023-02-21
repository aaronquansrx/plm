import {useState, useEffect} from 'react';

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

import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';

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

/*
[
    {
        id: "Quote A",
        client: "Client",
        users: ["User1", "User2"]
    },
    {
        id: "Quote B",
        client: "CCC",
        users: ["User2"]
    }
]
*/

function myJsx(jsx){
    return (p) => null;
}

function QuotingMain(props){
    const [uploadedData, setUploadedData] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [activeQuote, setActiveQuote] = useState(null);
    //const [quoteList, setQuoteList]
    //const mainState = {page: 0, props: {quotes: quotes, openQuote: openQuote, droppedFile: droppedFile, createQuote: createQuoteFunction()}};
    const [pageState, setPageState] = useState({current:0, last: null});

    useEffect(() => {
        const getData = {function: 'get_quotes', user: props.user}
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            if(res.data.success){
                setQuotes(res.data.quotes);
            }
            /*
            if(pageState.page === 0){
                setPageState(update(pageState, {
                    props: {
                        quotes: {$set: res.data.quotes}
                    }
                }));
            }*/
        },
        (res) => {
            console.log(res.data);
        }
        );
    }, [props.user]);
    function handleBack(){
        //setPageState({page: 0, props: {quotes: quotes, onOpenQuote: handleOpenQuote, droppedFile: droppedFile, createQuote: createQuoteFunction()}});
    }
    function openQuote(qid, quote){
        setActiveQuote(quote);
        return function(){
            /*
           const hb = handleBack();
            setPageState({
                page: 3, props: {toEditQuote: createQuoteFunction(false), quoteId: qid, quote: quote, user: props.user, back: hb}
            });
            */
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
    /*
    function toCustomerBom(qid, quote){
        setPageState({
            page: 3, props: {toEditQuote: createQuoteFunction(false), quoteId: qid, quote: quote, user: props.user, back: handleBack}
        });
    }*/
    function changePageState(i){
        setPageState({last: pageState.current, current: i});
    }
    function toCreateQuote(){
        //const title = create ? 'Create Quote' : 'Edit Quote';
        //return function(){
        setPageState(2);
            //page: 2, props: {back: handleBack, toCustomerBom: toCustomerBom, title: title, create: create, user: props.user}});
        //}
    }
    /*
    function droppedFile(sheets){
        //setUploadedData(upl);
        console.log(sheets);
        setPageState({page: 4, props: {sheets: sheets, quoteHeaders: quoteHeaders, back: handleBack}});
    }*/
    
    function renderView(){
        switch(pageState.current){
            case 0: // main quote list for user
                return <Main user={props.user} quotes={quotes} setQuotes={setQuotes} onOpenQuote={handleOpenQuote} changePageState={changePageState}/>
            case 1: //quoteView
                return <QuoteView quote={activeQuote} changePageState={changePageState} user={props.user}/>
            case 2:
                return <CreateQuote changePageState={changePageState} onCreateQuote={handleCreateProduct} 
                lastPageState={pageState.last} user={props.user} setQuotes={setQuotes}/>
            case 3:
                return <EditQuote quote={activeQuote}/>
            case 4:
                return <LinkProductUpload quote={activeQuote}/>
                //return <UploadTable sheets={sheets} quoteHeaders={quoteHeaders} changePageState={changePageState}/>

        }
    }
    
    return(
        <>
            {renderView()}
            {/*pageStates[pageState.page](pageState.props)*/}
        </>
    );
}

function Main(props){
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
        props.changePageState(4)
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
        <Button variant='danger' onClick={showDeleteConfirm}>Delete</Button>
        <ConfirmDeleteModal show={deleteConfirmModal} onConfirm={handleDelete} onClose={hideDeleteConfirm}/>
        </div>
    );
}

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

function SpreadsheetTemplate(props){

}

export default QuotingMain;