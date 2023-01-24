import {useState, useEffect} from 'react';

import XLSX from 'xlsx';

import Spreadsheet from "react-spreadsheet";

import { WorkbookHandler, ExcelSheetParser, excelSheetToArray } from '../../scripts/ExcelHelpers';
import { SimpleArrayTable } from '../../components/Tables';
import UploadTemplateEditor from './../components/UploadTemplateEditor';
import UploadTable from './../components/UploadTable';
import {ExcelDropzone} from '../../components/Dropzone';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';


import '../../css/main.css';

const pageStates = [
    (props) => <Main {...props}/>, 
    (props) => <QuoteView {...props}/>, 
    (props) => <UploadTable {...props}/>,
    (props) => <UploadTemplateEditor {...props}/>
];

const quoteHeaders = ["Level","Commodity","CMs","Item No.","CPN","SRX PN",
    "Description","Usage Per","UOM","Designator","Approved MFR","Approved MPN","Supplier 1",
    "Supplier Part Number 1","Value","Footprint","Fitted","Notes","Comments","Batch Qty"
];

function myJsx(jsx){
    return (p) => null;
}

function QuotingMain(props){
    const [uploadedData, setUploadedData] = useState(null);
    const [quotes, setQuotes] = useState([
        {
            name: "Quote A",
            client: "Client",
            users: ["User1", "User2"]
        },
        {
            name: "Quote B",
            client: "CCC",
            users: ["User2"]
        }
    ]);
    const mainState = {page: 0, props: {quotes: quotes, openQuote: openQuote, droppedFile: droppedFile, toTemplates: toTemplates}};
    const [pageState, setPageState] = useState(mainState);
    function handleBack(){
        setPageState(mainState);
    }
    function openQuote(i){
        return function(){
            setPageState({
                page: 1, props: {quote: quotes[i], back: handleBack}
            });
        }
    }
    function toTemplates(){
        setPageState({page: 3, props: {}});
    }
    function droppedFile(sheets){
        //setUploadedData(upl);
        console.log(sheets);
        setPageState({page: 2, props: {sheets: sheets, quoteHeaders: quoteHeaders, back: handleBack}});
    }
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
            <Button onClick={props.toTemplates}>Templates</Button>
            <h2>Quote List</h2>
            <ListGroup>
                {props.quotes.map((q, i) => 
                    <ListGroup.Item key={i} onClick={props.openQuote(i)} className="Pointer Quote">
                    <span>{q.name}</span>
                    <Badge bg="secondary">{q.client}</Badge>
                    {q.users.map((user) => 
                        <Badge>{user}</Badge>
                    )}
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
        <h3>{props.quote.name}</h3>
        <h5>Client: {props.quote.client}</h5>
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