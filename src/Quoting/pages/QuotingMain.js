import {useState, useEffect} from 'react';

import XLSX from 'xlsx';

import { SimpleArrayTable } from '../../components/Tables';
import {ExcelDropzone} from '../../components/Dropzone';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';

import '../../css/main.css';

const pageStates = [
    (props) => <Main {...props}/>, 
    (props) => <QuoteView {...props}/>, 
    (props) => <Table {...props}/>
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
    const mainState = {page: 0, props: {quotes: quotes, openQuote: openQuote, droppedFile: droppedFile}};
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
    function droppedFile(upl){
        setUploadedData(upl);
        setPageState({page: 2, props: {data: upl}});
    }
    return(
        <div className='FlexNormal Scrollable'>
            {pageStates[pageState.page](pageState.props)}
        </div>
    );
}

function Main(props){
    function handleDrop(wb, file){
        console.log(wb);
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
        console.log(passData);
        console.log('drop');
        props.droppedFile(passData);
    }
    return(
        <div>
            <ExcelDropzone class='DropFiles' onDrop={handleDrop}>
                <p>Upload Quotes</p>
            </ExcelDropzone>
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

function Table(props){
    return(
        <div>
            <SimpleArrayTable data={props.data}/>
        </div>
    )
}

export default QuotingMain;