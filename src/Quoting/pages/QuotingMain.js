import {useState, useEffect} from 'react';

import XLSX from 'xlsx';
import update from 'immutability-helper';

import Spreadsheet from "react-spreadsheet";

import { WorkbookHandler, ExcelSheetParser, excelSheetToArray } from '../../scripts/ExcelHelpers';
import { SimpleArrayTable } from '../../components/Tables';
import CreateQuote from './../components/CreateQuote';
import CustomerBOM from './../components/CustomerBOM';
import UploadTemplateEditor from './../components/UploadTemplateEditor';
import UploadTable from './../components/UploadTable';
import {ExcelDropzone} from '../../components/Dropzone';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';

import '../../css/main.css';

const pageStates = [
    (props) => <Main {...props}/>, 
    (props) => <QuoteView {...props}/>, 
    (props) => <CreateQuote {...props}/>,
    (props) => <CustomerBOM {...props}/>,
    (props) => <UploadTable {...props}/>,
];

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
    //const [quoteList, setQuoteList]
    const mainState = {page: 0, props: {quotes: quotes, openQuote: openQuote, droppedFile: droppedFile, createQuote: createQuoteFunction()}};
    const [pageState, setPageState] = useState(mainState);

    useEffect(() => {
        const getData = {function: 'get_quotes', user: props.user}
        getPLMRequest('quote', getData,
        (res) => {
            console.log(res.data);
            setQuotes(res.data.quotes);
            if(pageState.page === 0){
                setPageState(update(pageState, {
                    props: {
                        quotes: {$set: res.data.quotes}
                    }
                }));
            }
        });
    }, []);
    function handleBack(){
        setPageState({page: 0, props: {quotes: quotes, openQuote: openQuote, droppedFile: droppedFile, createQuote: createQuoteFunction()}});
    }
    function openQuote(qid, quote){
        return function(){
            /*
            setPageState({
                page: 1, props: {quote: q, back: handleBack}
            });
            */
           const hb = handleBack();
            setPageState({
                page: 3, props: {toEditQuote: createQuoteFunction(false), quoteId: qid, quote: quote, user: props.user, back: hb}
            });
        }
    }
    function toCustomerBom(qid, quote){
        setPageState({
            page: 3, props: {toEditQuote: createQuoteFunction(false), quoteId: qid, quote: quote, user: props.user, back: handleBack}
        });
    }
    function createQuoteFunction(create=true){
        const title = create ? 'Create Quote' : 'Edit Quote';
        return function(){
            setPageState({page: 2, props: {back: handleBack, toCustomerBom: toCustomerBom, title: title, create: create, user: props.user}});
        }
    }
    function droppedFile(sheets){
        //setUploadedData(upl);
        console.log(sheets);
        setPageState({page: 4, props: {sheets: sheets, quoteHeaders: quoteHeaders, back: handleBack}});
    }
    /*
    function renderView(){
        switch(pageState){
            case 0:
                return 
        }
    }
    */
    return(
        <>
        <div className='FlexNormal Scrollable'>
            {pageStates[pageState.page](pageState.props)}
        </div>
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
    return(
        <div>
            <ExcelDropzone class='DropFiles' onDrop={handleDrop}>
                <p>Upload Quotes</p>
            </ExcelDropzone>
            <Button onClick={props.createQuote}>Create Quote</Button>
            <Button onClick={props.toTemplates}>Templates</Button>
            <h2>Quote List</h2>
            <ListGroup>
                {props.quotes.map((q, i) => 
                    <ListGroup.Item key={i} onClick={props.openQuote(q.id, q)} className="Pointer Quote">
                    <span>{q.id}</span>
                    <Badge bg="secondary">{q.details.customer}</Badge>
                    {q.users.map((user, u) => 
                        <Badge key={u}>{user}</Badge>
                    )}
                    <Badge bg="warning">{q.details.currency}</Badge>
                    </ListGroup.Item>
                )}
            </ListGroup>
            {/*<UploadTemplateEditor />*/}
        </div>
    )
}

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
}

function SpreadsheetTemplate(props){

}

export default QuotingMain;