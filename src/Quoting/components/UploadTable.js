import {useState, useEffect, useMemo, useRef} from 'react';
import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import styled from 'styled-components';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { OutsideClickFunction } from '../../hooks/InterfaceHelpers';
import { TabbedSheetTable } from '../../components/Tables';
import {ListSelectDropdown} from '../../components/Dropdown';
import { PalleteTable } from '../components/PalleteTable';


import './../../css/main.css';
import { ListGroup } from 'react-bootstrap';
import { TemplateModal } from '../../components/Modals';

const S1 = styled.div`
    width: 30px;
    height: 25px;
    background-color: ${props => props.bgc ? props.bgc : 'white'};
`;

const linkModes = [{label: 'Batch', accessor:'batch'}, {label: 'Sheet',  accessor:'sheet'}];

const batchUploadHeaders = [
    {label: 'Product', accessor: 'id', type: 'string'},
    {label: 'Product Name', accessor: 'name', type: 'string'},
    {label: 'Qty Per', accessor: 'qty', type: 'integer'},
    {label: 'Batch', accessor: 'batch', type: 'integer'},
    {label: 'EAU', accessor: 'eau', type: 'integer'}
];

const defaultHeaders = [
    {label: 'Level', accessor: 'level'},
    {label: 'Commodity', accessor: 'commodity'},
    {label: 'CMs', accessor: 'cms'},
    {label: 'Item No.', accessor: 'item_no'}, 
    {label: 'CPN', accessor: 'cpn'},
    {label: 'SRX PN', accessor: 'srx_pn'},
    {label: 'Description', accessor: 'description'},
    {label: 'Usage Per', accessor: 'usage_per'},
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
    {label: 'Batch Qty', accessor: 'batch_qty'}
];

export function UploadMain(props){
    const [sheetId, setSheetId] = useState(null);
    const [productIndex, setProductIndex] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [linkMode, setLinkMode] = useState(linkModes[0]); // 0 for 
    const [headers, setHeaders] = useState(batchUploadHeaders);
    const [showHeaderModal, setShowHeaderModal] = useState(false);
    useEffect(() => {
        //if(changeSheets.current){
            if(props.sheets !== null){
                setSheetId(0);
                //setSheetValues(nullSheetValues());
            }
           //changeSheets.current = false;
        //}
    }, [props.sheets]);
    useEffect(() => {
        if(props.productsList.length > 0){
            //setSelectedProduct(props.productsList[0]);
            setProductIndex(0);
        }
    }, [props.productsList])
    function handleChangeProduct(e){
        console.log(e.target.value);
        const i = parseInt(e.target.value);
        //setSelectedProduct(props.productsList[i]);
        setProductIndex(i);
    }
    function handleChangeSheet(i){
        setSheetId(i);
    }

    function handleSheetRowSelect(rowIndex){
        if(selectedRow && selectedRow.row === rowIndex && selectedRow.sheetId === sheetId){
            setSelectedRow(null);
        }else{
            const activeSheet = props.sheets[sheetId].array;
            const sheetRow = activeSheet[rowIndex];
            const productHeaderIndex = sheetRow.findIndex((header) => header === 'Product');
            const productChildrenVals = productHeaderIndex !== -1 ? getProductChildrenValues(activeSheet, productHeaderIndex, rowIndex) : null;
            //const productChildrenVals = productHeaderIndex !== -1 ? getProductChildrenValues(activeSheet.map((row) => row[productHeaderIndex]))
            // : null;
            const headerSet = new Set(headers.map(h => h.label));
            const headersFound = sheetRow.map((str) => {
                const matches = headerSet.has(str) || str.startsWith("Batch ");
                return matches;
            });
            //console.log(productChildrenVals);
            setSelectedRow({sheetId: sheetId, row: rowIndex, productValues: productChildrenVals, headersFound: headersFound});
        }
        /*
        setProductValues(update(productValues, {
            [productIndex]: {
                [linkMode]: {$set: {row: i}}
            }
        }));*/
    }
    function getProductChildrenValues(sheet, headerIndex, startingRow){
        const openSheet = [...sheet];
        openSheet.splice(0, startingRow+1);
        const productStrings = openSheet.map((row) => row[headerIndex]);
        const ps = productStrings.reduce((inds, str, row) => {
            const indexes = getIndexesFromProductString(str);
            if(indexes){
                inds.push({row: row, indexes: indexes});
            }
            return inds;
        }, []);
        return ps;
    }
    function getIndexesFromProductString(str){
        const parString = 'Parent ';
        const chString = 'Child '
        if(str.startsWith(parString)){
            const piStr = str.substring(parString.length);
            const parentIndex = parseInt(piStr)-1;
            return [parentIndex];
        }else if(str.startsWith('Child ')){
            const ciStr = str.substring(chString.length);
            const childIndexes = ciStr.split('.');
            const childIndex = childIndexes.map((i) => {
                return parseInt(i)-1;
            });
            return childIndex;
        }
        return null;
    }
    function nullProductSheetValues(){
        console.log(props.productsList);
        return props.productsList.map(() => {
            return {sheet: null, batch: null}
        })
    }
    function nullSheetValues(){
        if(props.sheets === null) return [];
        return props.sheets.map((sheet) => {
            return sheet.array.map((r) => r.map(() => null));
        });
    }
    function handleLinkModeChange(e){
        //console.log(e.target.value);
        const found = linkModes.find(mode => mode.accessor === e.target.value);
        setLinkMode(found);
    }
    function handleUpload(){
        if(selectedRow !== null){
            const headerSet = new Set(headers.map(h => h.label));
            const headerLabelMap = headers.reduce((mp, h) => {
                mp[h.label] = {accessor: h.accessor, type: h.type};
                return mp;
            }, {});
            const activeSheet = props.sheets[selectedRow.sheetId].array;
            const sheetRow = activeSheet[selectedRow.row];
            let nBatches = 0;
            const hs = sheetRow.reduce((arr, h, n) => {
                if(headerSet.has(h)){
                    const header = headerLabelMap[h];
                    arr.push({accessor: header.accessor, index: n, type: header.type});
                }else if(h.startsWith('Batch')){
                    arr.push({accessor: 'batches', index: n, type: 'integer'});
                    nBatches+=1;
                }
                return arr;
            }, []);
            const objs = [];
            for(let r=selectedRow.row+1; r < activeSheet.length; r++){
                const obj = hs.reduce((o, h) => {
                    const val = activeSheet[r][h.index];
                    if(h.accessor === 'batches'){
                        const batchSize = parseInt(val);
                        if('batches' in o){
                            o['batches'].push(batchSize);
                        }else{
                            o['batches'] = [batchSize];
                        }
                    }else if(h.accessor === 'id'){
                        //decode string into array of child id?
                        o[h.accessor] = val;
                        o['indexes'] = getIndexesFromProductString(val);
                    }else{
                        if(h.type === 'integer'){
                            o[h.accessor] = parseInt(val);
                        }else{
                            o[h.accessor] = val; 
                        }
                    }
                    return o;
                }, {});
                objs.push(obj);
            }
            console.log(objs);
            const postData = {function: 'upload_products', user: props.user, quote_id: props.quoteId, product_details: objs};
            postPLMRequest('quote', postData,
            (res)=>{
                console.log(res.data);
                if(res.data.success){
                    props.updateProducts(res.data);
                    props.changeQuotePageState(0);
                }
            },
            (res)=>{
                console.log(res.data);
            }
            );
        }
    }
    function handleChangeHeaders(newHeaders){
        setHeaders(newHeaders);
    }
    function handleHeaderModal(){
        setShowHeaderModal(true);
    }
    function handleCloseModal(){
        setShowHeaderModal(false);
    }
    return(
        <>
        <div className='FlexNormal'>
            <div className='Hori'>
                <div className='FlexNormal'>
                <Form.Select value={linkMode.accessor} onChange={handleLinkModeChange}>
                    {linkModes.map((mode, i) => 
                        <option key={i} value={mode.accessor}>{mode.label}</option>
                    )}
                </Form.Select>
                </div>
                <div>
                    Types
                </div>
                <Button onClick={handleHeaderModal}>Headers</Button>
            </div>
            <Button onClick={handleUpload}>Upload</Button>
        </div>
        <TabbedSheetTable sheets={props.sheets} sheetId={sheetId}
        onChangeSheet={handleChangeSheet}
        tableClass={'FlexNormal Overflow'} tabsClass={'FlexNormal'}
        table={(props) =>
        <HeaderTableWithRowSelectorV2 {...props} 
        selectedRow={selectedRow && selectedRow.sheetId == sheetId ? selectedRow.row : null} />}
        tableProps={{
            onRowSelect:handleSheetRowSelect, 
            sheetHeaders:headers, 
            selectedHeadersFound: selectedRow ? selectedRow.headersFound : []
        }}
        />
        <HeaderModal show={showHeaderModal} onClose={handleCloseModal} headers={headers} 
        onChangeHeaders={handleChangeHeaders}/>
        </>
    );
}

function HeaderModal(props){
    const [editingHeaders, setEditingHeaders] = useState(props.headers);
    const [editHeader, setEditHeader] = useState({index: null, value: ''});
    useEffect(() => {
        setEditingHeaders(props.headers);
    }, [props.show]);
    const body = <div>
        <Table>
        <thead>
            <tr><th>Accessor</th><th>Labels</th></tr>
        </thead>
        <tbody>
        {editingHeaders.map((header, i) => {
            const isEditing = editHeader.index === i;
            return(
            <tr key={i}>
                <td>{header.accessor}</td>
                <td onClick={handleSelectLabel(i)}>
                    {isEditing ? 
                    <OutsideClickFunction func={handleHeaderLabel}>
                        <Form.Control type='text' autoFocus value={editHeader.value} onChange={handleEditTextChange} 
                        onKeyDown={handleEnterLabel}/>
                    </OutsideClickFunction>
                        : header.label
                    }
                </td>
            </tr>
            );
        })}
        </tbody>
        </Table>
    </div>
    const footer = <Button onClick={handleSubmitHeaders}>Submit</Button>
    function handleEditTextChange(e){
        setEditHeader(update(editHeader, {
            value: {$set: e.target.value}
        }));
    }
    function handleEnterLabel(e){
        if(e.key == 'Enter'){
            handleHeaderLabel();
        }
    }
    function handleHeaderLabel(){
        setEditingHeaders(update(editingHeaders, {
            [editHeader.index]: {
                label: {$set: editHeader.value}
            }
        }));
        setEditHeader({index: null, value: ''});
    }
    function handleSelectLabel(i){
        return function(){
            setEditHeader({index: i, value: editingHeaders[i].label});
        }
    }
    function handleSubmitHeaders(){
        if(props.onChangeHeaders) props.onChangeHeaders(editingHeaders);
        if(props.onClose) props.onClose();
    }
    return(
        <TemplateModal show={props.show} body={body} footer={footer}
        onClose={props.onClose} title={'Headers'}/>
    );
}

function ProductDropdown(props){
    const [open, setOpen] = useState(false);
    function handleClickOutside(){
        setOpen(false);
    }
    function handleOpen(){
        setOpen(true);
    }
    function handleSelect(i){
        return function(){
            if(props.onSelect) props.onSelect(i);
            setOpen(false);
        }
        //console.log(e);
        //const id = parseInt(e.target.id);
    }
    function Item(props){
        return <>
        <span style={{borderRight: '1px solid black'}}>{props.selected.id_string}</span>
        <span>{props.selected.name}</span>
        </>
    }
    return (
        <OutsideClickFunction func={handleClickOutside}>
            <ListGroup className='Pointer' style={{position: 'absolute', zIndex: 10}}>
                {open ? props.items.map((it, i) => {
                    return <ListGroup.Item key={i} id={i} onClick={handleSelect(i)}><Item selected={it}/></ListGroup.Item>;
                }) : props.selected && 
                <ListGroup.Item onClick={handleOpen} className='Pointer'>
                    <Item selected={props.selected}/>
                </ListGroup.Item>
                }
            </ListGroup>
        </OutsideClickFunction>
    );
}

function HeaderTableWithRowSelectorV2(props){
    //const [selectedRow, setSelectedRow] = useState(null);
    console.log(props.selectedHeadersFound);
    function handleRowSelect(j){
        return function(){
            //setSelectedRow(j);
            props.onRowSelect(j);
        }
    }
    return(
        <Table>
        <tbody>
        {props.sheet && props.sheet.map((row, j) => {
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
                    let ncn = cn;
                    if(cn === 'HL' && !props.selectedHeadersFound[i]){
                        ncn = 'NHL';
                    }
                    return <td key={i} className={ncn}>{str}</td>
                }
                )}
            </tr>
            )}
        )}
        </tbody>
        </Table>
    );
}


export function UploadTableSingle(props){
    const [sheetId, setSheetId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showHeaderModal, setShowHeaderModal] = useState(false);
    const [headers, setHeaders] = useState(defaultHeaders);
    function handleChangeSheet(i){
        setSheetId(i);
        console.log(i);
    }
    function handleChangeHeaders(newHeaders){
        console.log(newHeaders);
        setHeaders(newHeaders);
    }
    function handleSheetRowSelect(rowIndex){
        //reference this row for more detail (can use HeaderTableWithRowSelectorV2 and TabbedTable)
        //setSelectedRow({sheetId: sheetId, row: rowIndex, productValues: productChildrenVals, headersFound: headersFound});
        if(selectedRow && selectedRow.row === rowIndex && selectedRow.sheetId === sheetId){
            setSelectedRow(null);
        }else{
            const activeSheet = props.sheets[sheetId].array;
            const sheetRow = activeSheet[rowIndex];
            const headerSet = new Set(headers.map(h => h.label));
            console.log(headers);
            const headersFound = sheetRow.map((str) => {
                const matches = headerSet.has(str);
                return matches;
            });
            setSelectedRow({sheetId: sheetId, row: rowIndex, headersFound: headersFound});
        }
    }
    function handleSubmit(){
        console.log(headers);
        if(selectedRow.row !== null){
            //find correct headers
            console.log(headers);
            const headerSet = new Set(headers.map(h => h.label));
            const headerMap = headers.reduce((mp, h) => {
                mp[h.label] = h.accessor;
                return mp;
            }, {});
            const activeSheet = props.sheets[selectedRow.sheetId].array;
            console.log(activeSheet);
            const sheetRow = activeSheet[selectedRow.row];
            const hs = sheetRow.reduce((arr, h, n) => {
                if(headerSet.has(h)){
                    arr.push({accessor: headerMap[h], index: n});
                }
                return arr;
            }, []);
            const objs = [];
            for(let r=selectedRow.row+1; r < activeSheet.length; r++){
                const obj = hs.reduce((o, h) => {
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
                    props.updateProducts(res.data);
                },
                (res) => {
                    console.log(res.data);
                }
            );
        }
    }
    function handleHeaderModal(){
        setShowHeaderModal(true);
    }
    function handleCloseModal(){
        setShowHeaderModal(false);
    }
    return(
        <>
        <div className='FlexNormal'>
            <h3>{props.product && props.product.name}</h3>
            <Button onClick={handleHeaderModal}>Headers</Button>
            <Button onClick={handleSubmit}>Submit</Button>
        </div>
        <div className='FlexNormal'>
            <TabbedSheetTable sheets={props.sheets} sheetId={sheetId}
            onChangeSheet={handleChangeSheet}
            tableClass={'FlexNormal Overflow'} tabsClass={'FlexNormal'}
            table={(props) =>
                <HeaderTableWithRowSelectorV2 {...props} 
                selectedRow={selectedRow && selectedRow.sheetId == sheetId ? selectedRow.row : null} />}
                tableProps={{
                    onRowSelect:handleSheetRowSelect, 
                    selectedHeadersFound: selectedRow ? selectedRow.headersFound : []
                }}
            />
        </div>
        <HeaderModal show={showHeaderModal} onClose={handleCloseModal} 
        headers={headers} onChangeHeaders={handleChangeHeaders}/>
        </>
    )
}

//old test upload components

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
            let rowCn = '';
            if(props.selectedRow !== null){
                if(props.selectedRow === j){
                    rowCn = 'HL';
                }else if(props.selectedRow < j){
                    rowCn = 'HLC';
                }
            }
            return(
            <tr key={j}>
                <td className='RowSelector' onClick={handleRowSelect(j)}> </td>
                {row.map((str, i) => {
                    let cn = rowCn;
                    //const productHeaderSet = new Set(props.productSheetHeaders);
                    if(rowCn === 'HL' && !productHeaderSet.has(str)){
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

//export default UploadTable;