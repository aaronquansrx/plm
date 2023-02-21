import {useState, useEffect, useMemo, useRef} from 'react';
import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Table from 'react-bootstrap/Table';
import styled from 'styled-components';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { PalleteTable } from '../components/PalleteTable';

import './../../css/main.css';
import { ListGroup } from 'react-bootstrap';

const S1 = styled.div`
    width: 30px;
    height: 25px;
    background-color: ${props => props.bgc ? props.bgc : 'white'};
`;

export function UploadTable(props){
    console.log(props.sheets);
    const [colour, setColour] = useState(null);
    const [palleteSetting, setPalleteSetting] = useState('single');
    const [pallete, setPallete] = useState({colour: null, setting: 'single'});
    const sheetNames = useMemo(() => {
        if(!props.sheets) return [];
        return props.sheets.map((sheet) => sheet.name);
    }, [props.sheets]);
    //const [displaySheet, setDisplaySheet] = useState(props.sheets[0].array);
    const [activeSheetIndex, setActiveSheetIndex] = useState(0);
    const tableDiv = useRef(null);
    const selectedRow = useRef(null);
    const greys = useRef([]);

    const [colourChanges, setColourChanges] = useState(null/*props.sheets[activeSheetIndex].array.map((row) => row.map(() => null))*/);
    const headerMatch = useRef(null); // null for no match
    const activeSheet = props.sheets ? props.sheets[activeSheetIndex].array : null;
    //console.log(colourChanges);
    function changeColour(c){
        return function(){
            console.log(c);
            setColour(c)
            setPallete(update(pallete, {
                colour: {$set: c}
            }));
        }
    }
    function test(){
        console.log(selectedRow.current);
        console.log(greys.current);
        console.log(tableDiv);
    }
    function handleSelectCell(i,j){
        //console.log(greys);
        if(pallete.colour==='lightblue'){
            const cSheet = props.sheets[activeSheetIndex].array;
            const ccs = props.sheets[activeSheetIndex].array.map((row) => row.map(() => null));
            const headerSet = new Set(props.quoteHeaders);
            const rowColours = cSheet[j].map((h, n) => {
                if(headerSet.has(h)){
                    return 'lightblue';
                }
                return 'red';
            });
            ccs[j] = rowColours;
            if(selectedRow.current !== null){
                ccs[selectedRow.current] = cSheet[selectedRow.current].map(() => 'white');
            }
            for(let n = j+1; n < cSheet.length; n++){
                ccs[n] = cSheet[n].map(() => 'aqua');
            }
            setColourChanges(ccs);
            selectedRow.current = j;
            console.log(cSheet[j]);
            headerMatch.current = cSheet[j].map((h, n) => {
                if(headerSet.has(h)){
                    return h;
                }
                return null;
            }, []);
        }else if(pallete.colour==='grey'){
            greys.current = update(greys.current, {
                $push: [{x: i, y: j}]
            });
        }
    }
    function handleSubmit(){
        if(headerMatch.current !== null){
            const objArray = [];
            for(let j = selectedRow.current+1; j < activeSheet.length; j++){
                const obj = activeSheet[j].reduce((obj, v, n) => {
                    if(headerMatch.current[n] !== null){
                        obj[headerMatch.current[n]] = v;
                    }
                    return obj;
                }, {});
                //console.log(obj);
                objArray.push(obj);
            }
            console.log(objArray);
            
        }
    }
    function handleSheetChange(i){
        return function(){
            //setDisplaySheet(props.sheets[i].array);
            setActiveSheetIndex(i);
        }
    }
    return(
        <div>
            <div>
                <div>
                <Button variant='secondary' onClick={props.back}>Back</Button>
                <Button onClick={handleSubmit}>Submit</Button>
                </div>
                <div className='Hori'>
                    <div>
                        <span className='Hori' onClick={changeColour('lightblue')}>Header Row: <S1 bgc={'lightblue'}/></span>
                        <span className='Hori'>Invalid Header: <S1 bgc={'red'}/></span>
                        <span className='Hori' onClick={changeColour('aqua')}>Data Collected: <S1 bgc={'aqua'}/></span>
                        {/*<Button onClick={test}>Get Data</Button>*/}
                    </div>
                    <div>
                        <span className='Hori' onClick={changeColour('yellow')}>Product 1: <S1 bgc={'yellow'}/></span>
                        <span className='Hori' onClick={changeColour('orange')}>Product 2: <S1 bgc={'orange'}/></span>
                        <span className='Hori' onClick={changeColour('white')}>Clear: <S1 bgc={'grey'}/></span>
                    </div>
                </div>
            </div>
            {

            }
            <div>
                <Nav variant="tabs">
                    {sheetNames.map((tab, i) => 
                        <Nav.Item key={i} onClick={handleSheetChange(i)}>
                            <Nav.Link>{tab}</Nav.Link>
                        </Nav.Item>
                    )}
                </Nav>
            <div ref={tableDiv}>
                {props.sheets &&
                    <PalleteTable data={props.sheets[activeSheetIndex].array} pallete={pallete} onClickCell={handleSelectCell}
                    colourChanges={colourChanges}/>
                }
            </div>
            </div>
        </div>
    )
}

export function UploadTableSingle(props){
    const sheetNames = useMemo(() => {
        if(!props.sheets) return [];
        return props.sheets.map((sheet) => sheet.name);
    }, [props.sheets]);
    const [activeSheetIndex, setActiveSheetIndex] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const activeSheet = activeSheetIndex !== null ? props.sheets[activeSheetIndex].array : null;
    function handleSheetChange(i){
        return function(){
            setActiveSheetIndex(i);
        }
    }
    function handleSheetRowSelect(i){
        setSelectedRow(i);
    }
    function handleSubmit(){
        if(selectedRow !== null){

            //find correct headers
            const headerSet = new Set(props.productSheetHeaders.map(h => h.label));
            const headerMap = props.productSheetHeaders.reduce((mp, h) => {
                mp[h.label] = h.accessor;
                return mp;
            }, {});
            const sheetRow = activeSheet[selectedRow];
            const headers = sheetRow.reduce((arr, h, n) => {
                if(headerSet.has(h)){
                    arr.push({accessor: headerMap[h], index: n});
                }
                return arr;
            }, []);
            console.log(headers);

            //re do headers into objects
            const objs = [];
            for(let r=selectedRow+1; r < activeSheet.length; r++){
                const obj = headers.reduce((o, h) => {
                    o[h.accessor] = activeSheet[r][h.index];
                    return o;
                }, {});
                objs.push(obj);
            }
            const postData = {product_sheet: objs, function: 'add_product_sheet', user: props.user, 
            product_id: props.product.id, quote_id: props.quoteId};
            postPLMRequest('quote', postData,
                (res) => {
                    console.log(res.data);
                    props.changeQuotePageState(2);
                    props.setProducts(res.data.products);
                },
                (res) => {
                    console.log(res.data);
                }
            );
        }
    }
    return(
        <>
        <div className='FlexNormal'>
            <h3>{props.product && props.product.name}</h3>
            <Button onClick={handleSubmit}>Submit</Button>
            <Nav variant="tabs" activeKey={activeSheetIndex}>
                {sheetNames.map((tab, i) => 
                    <Nav.Item key={i} onClick={handleSheetChange(i)}>
                        <Nav.Link id={i === activeSheetIndex ? 'Grey' : ''}>{tab}</Nav.Link>
                    </Nav.Item>
                )}
            </Nav>
            </div>

            <HeaderTable data={activeSheet} selectedRow={selectedRow} 
            productSheetHeaders={props.productSheetHeaders} 
            onRowSelect={handleSheetRowSelect}/>
        </>
    )
}

export function UploadTableV2(props){
    const sheetNames = useMemo(() => {
        if(!props.sheets) return [];
        return props.sheets.map((sheet) => sheet.name);
    }, [props.sheets]);
    const unlinkedProducts = useMemo(() => {
        return props.products.reduce((arr, p) => {
            if(!p.has_sheet) arr.push(p);
            return arr;
        }, []);
    }, [props.products]);
    const [activeSheetIndex, setActiveSheetIndex] = useState(null);
    const [linkedProducts, setLinkedProducts] = useState(unlinkedProducts.map((p) => null));
    const [linkedSheets, setLinkedSheets] = useState(null);

    useEffect(() => {
        if(props.sheets){
            setActiveSheetIndex(0);
            setLinkedSheets(props.sheets.map(() => null));
            console.log(props.sheets);
        }
    }, [props.sheets]);
    useEffect(() => {
        const newLP = unlinkedProducts.map((p, i) => {
            if(linkedProducts[i] !== null) return linkedProducts[i];
            return null;
        });
        setLinkedProducts(newLP);
    }, [props.products]);
    function handleSheetChange(i){
        return function(){
            setActiveSheetIndex(i);
        }
    }
    const activeSheet = activeSheetIndex !== null ? props.sheets[activeSheetIndex].array : null;
    const selectedRow = activeSheetIndex !== null && linkedSheets[activeSheetIndex] ? linkedSheets[activeSheetIndex].row : null;
    function handleSheetRowSelect(i){
        const headerSet = new Set(props.productSheetHeaders);
        const sheetRow = activeSheet[i];
        const headers = sheetRow.reduce((arr, h, n) => {
            if(headerSet.has(h)){
                arr.push({header: h, index: n});
            }
            return arr;
        }, []);
        console.log(headers);
        const obj = {row: i, product: null};
        setLinkedSheets(update(linkedSheets, {
            [activeSheetIndex]: {$set: obj}
        }));
    }
    function handleSelectProduct(p, i){
        return function(){
            if(activeSheetIndex !== null){
                if(linkedSheets[activeSheetIndex] !== null){
                    console.log(p);
                }
                setLinkedSheets(update(linkedSheets, {
                    [activeSheetIndex]: {
                        product: {$set: i}
                    }
                }));
            }
        }
    }
    console.log(linkedSheets);
    //console.log(props.productSheetHeaders);
    return(
        <>
            <div className='FlexNormal'>
                {!props.product &&
                <>
                Unlinked Products
                <ListGroup className='Pointer'>
                {props.products.map((p, i) => {
                    return <ListGroup.Item key={i} onClick={handleSelectProduct(p, i )}>{p.name}</ListGroup.Item>
                })}
                </ListGroup>
                </>
                }
            </div>
            <div className='FlexNormal'>
            <Nav variant="tabs" activeKey={activeSheetIndex}>
                {sheetNames.map((tab, i) => 
                    <Nav.Item key={i} onClick={handleSheetChange(i)}>
                        <Nav.Link id={i === activeSheetIndex ? 'Grey' : ''}>{tab}</Nav.Link>
                    </Nav.Item>
                )}
            </Nav>
            </div>

            <HeaderTable data={activeSheet} selectedRow={selectedRow} 
            productSheetHeaders={props.productSheetHeaders} 
            onRowSelect={handleSheetRowSelect}/>
        </>
    );
}

function ProductSheetHeaderModal(props){

}

function HeaderTable(props){
    const [selectedRow, setSelectedRow] = useState(null);
    function handleRowSelect(j){
        return function(){
            setSelectedRow(j);
            props.onRowSelect(j);
        }
    }
    const productHeaderSet = new Set(props.productSheetHeaders.map(h => h.label));
    //console.log(productHeaderSet);
    return(
        <div className='MainTable'>
        <Table>
        <tbody>
        {props.data && props.data.map((row, j) => {
            let cn = '';
            if(props.selectedRow !== null){
                if(props.selectedRow === j){
                    cn = 'HL';
                }else if(props.selectedRow < j){
                    cn = 'HLC';
                }
            }
            return(
            <tr key={j}>
                <td className='RowSelector' onClick={handleRowSelect(j)}> </td>
                {row.map((str, i) => {
                    //const productHeaderSet = new Set(props.productSheetHeaders);
                    if(cn === 'HL' && !productHeaderSet.has(str)){
                        cn = 'NHL';
                    }
                    return <td key={i} className={cn}>{str}</td>
                }
                )}
            </tr>
            )}
        )}
        </tbody>
        </Table>
        </div>
    );
}

//export default UploadTable;