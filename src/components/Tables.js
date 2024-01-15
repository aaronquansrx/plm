import {useState, useEffect, useMemo, useRef} from 'react';
import styled from 'styled-components';
import update from 'immutability-helper';

import { useTable } from 'react-table'

import Table from 'react-bootstrap/Table';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import {SimpleDropdown} from './Dropdown';
import {PartRow, EmptyOffer} from './Offer';
import {IdCheckbox} from './Checkbox';
import {HoverOverlay} from './Tooltips';
import {PageInterface, PaginationInterface} from './Pagination';

import { OutsideClickFunction } from '../hooks/InterfaceHelpers';

import './../css/table.css';
import './../css/temp.css';
import './../css/offer.css';
import { filter, slice } from 'lodash';
import { Form } from 'react-bootstrap';
import { TextControl } from './Forms';

import { useMouseMove, useMouseRefPosition, useMousePosition, useMouseUp } from '../hooks/Mouse';


export function TabbedSheetTable(props){
    const activeSheet = useMemo(() => {
        if(props.sheets === null || props.sheetId === null) return [];
        return props.sheets.length > 0 ? props.sheets[props.sheetId].array : [];
    }, [props.sheetId, props.sheets]);
    function handleSheetChange(i){
        return function(){
            if(props.onChangeSheet) props.onChangeSheet(i);
        }
    }
    return(
        <>
        <div className={props.tabsClass}>
        {<Nav variant="tabs" activeKey={props.sheetId}>
            {props.sheets && props.sheets.map((sheet, i) => 
                <Nav.Item key={i} onClick={handleSheetChange(i)}>
                    <Nav.Link id={i === props.sheetId ? 'Grey' : ''}>{sheet.name}</Nav.Link>
                </Nav.Item>
            )}
        </Nav>}
        </div>
        <div className={props.tableClass}>
        {props.table && props.table({sheet: activeSheet, index: props.sheetId, ...props.tableProps})}
        </div>
        </>
    );
}

export function EditTable(props){
    const [editValue, setEditValue] = useState('');
    const [editCell, setEditCell] = useState(null);
    function handleEdit(i, j, val){
        return function(){
            if(val === null) val = '';
            if(editCell !== null){
                if(editCell.x !== i && editCell.y !== j){
                    submitCellValue();
                    setEditCell({x: i, y: j});
                    setEditValue(val);
                }
            }else{
                setEditCell({x: i, y: j});
                setEditValue(val);
            }
        }
    }
    function handleEditChange(e){
        setEditValue(e.target.value);
    }
    function handleSubmit(e){
        if(e.key === 'Enter'){
            submitCellValue();
        }
    }
    function submitCellValue(){
        if(props.onSubmit) props.onSubmit(editCell, editValue);
        setEditCell(null);
    }
    return(
        <Table>
        <thead className='TableHeading'>
            <tr>
            {props.headers.map((h, i) => <th key={i}>{h.label}</th>)}
            {props.delete && <th></th>}
            </tr>
        </thead>
        <tbody>
        {props.data.map((l, j) => {
            return <tr key={j}>
                {props.headers.map((h, i) => {
                    const isEditCell = editCell ? i === editCell.x && j === editCell.y : false;
                    return <td key={i} onMouseDown={handleEdit(i, j, l[h.accessor])}>
                        {isEditCell ? 
                        <OutsideClickFunction func={submitCellValue}>
                        <Form.Control style={{minWidth: '100px'}} autoFocus type='text' 
                        value={editValue} onChange={handleEditChange} onKeyDown={handleSubmit}/> 
                        </OutsideClickFunction>
                        : l[h.accessor]}
                    </td>
                })}
            </tr>
        })}
        </tbody>
        </Table>
        
    );
}


const testHeaders = [
    {label: 'hi', accessor: 'hello',},
    {label: 'b', accessor: 'b',},
    {label: 'a very long colll ll   f', accessor: 'a very long colll ll'}
];
const testData = [
    {
        'a very long colll ll': '123213',
        b: 'hi',
        hello: '1239',
    },
    {
        'a very long colll ll': 'not a long col',
        b: '',
        hello: '1239',
    },
    {
        'a very long colll ll': '123213',
        b: 'hi',
        hello: 'question',
    }
]
export function DragAdjustColumnTable(props){
    const [headers, setHeaders] = useState(testHeaders.map((header) => {
        header.width = null;
        return header;
    }));
    const headersCopy = useRef(testHeaders.map((header) => {
        header.width = null;
        return header;
    }));
    const [selectedDrawHeader, setSelectedDrawHeader] = useState(null);
    //const [overwriteColumnWidths, setOverwriteColumnWidths] = useState([]);
    const [headerCursor, setHeaderCursor] = useState('move');
    //const isResizing = useRef(false);
    const startResizeWidths = useRef(null);
    const adjustLocationLeft = useRef(true); // true if mouse hovers adjust column on left side
    const startDrag = useRef(null);
    //const [selectCursor, setSel]
    const mouse = useMousePosition();
    useMouseUp(() => {
        startResizeWidths.current = null;
        setSelectedDrawHeader(null);
        if(startDrag.current){
            if(startDrag.current.dragHeader){
                dropHeaderOriginal();
            }
            startDrag.current = null;

        }
    });
    useMouseMove((ev) => {
        const mouse = { x: ev.clientX, y: ev.clientY }
        //console.log(mouse);
        //ckeck if mouse was down
        //console.log(headersCopy.current);
        if(startResizeWidths.current /*&&& isResizing.current*/){
            //resize columns using x
            const mx = mouse.x - mouseDownPosition.current.x;
            const index = startResizeWidths.current.index;
            const w1 = startResizeWidths.current.widths[0];
            const w2 = startResizeWidths.current.widths[1];
            setHeaders(update(headers, {
                [index]: {width: {$set: w1+mx}},
                [index+1]: {width: {$set: w2-mx}}
            }));
        }else if(startDrag.current){
            //console.log('dragging');
            if(startDrag.current.dragHeader){
                //console.log('selected');
                const tableRect = tableRef.current.getBoundingClientRect();
                if(mouse.x < tableRect.left || mouse.x > tableRect.right || mouse.y < tableRect.top || mouse.y > tableRect.bottom){
                    dropHeaderOriginal();
                }else{
                    //console.log(headerRefs.current);
                    if(startDrag.current.dragHeader){
                        const position = headerRefs.current.reduce((pos, header, i) => {
                            if(pos !== null) return pos;
                            if(!header) return null;
                            const rect = header.getBoundingClientRect();
                            const mouseInCell = {x: mouse.x - rect.x, y: mouse.y - rect.y};
                            if(mouseInCell.x > 0 && mouseInCell.x < rect.width){
                                //console.log(mouseInCell);
                                const moveInPadding = (rect.width*0.05);
                                if(mouseInCell.x > rect.width-moveInPadding){
                                    return i+1;
                                }else if(mouseInCell.x < moveInPadding){
                                    return i;
                                }
                            }
                            return null;
                        }, null);
                        if(position !== null){
                            const nh = [...headersCopy.current];
                            nh.splice(position, 0, startDrag.current.dragHeader);
                            headersCopy.current = nh;
                            setHeaders(nh);
                            setSelectedDrawHeader(null);
                            startDrag.current.currentIndex = position;
                            startDrag.current.dragHeader = null;
                        }
                    }
                }
            }else{
                const cellIndex = startDrag.current.currentIndex;
                const originalHeaders = startDrag.current.original;
                if(cellIndex != null){
                    const cellRect = headerRefs.current[cellIndex].getBoundingClientRect();
                    const mouseInCell = {x: mouse.x - cellRect.x, y: mouse.y - cellRect.y};
                    //console.log(cellRect);
                    const cellWidth = startDrag.current.width;
                    const moveOutPadding = (cellWidth*0.01);
                    //console.log(mouseInCell);
                    if(mouseInCell.x > cellWidth-moveOutPadding || mouseInCell.x < moveOutPadding){
                        setSelectedDrawHeader(originalHeaders[startDrag.current.index]);
                        //console.log(startDrag.current.currentIndex);
                        startDrag.current.dragHeader = originalHeaders[startDrag.current.index];
                        const newHeaders = headersCopy.current.reduce((arr, header, i) => {
                            if(i !== startDrag.current.currentIndex){
                                arr.push(header);
                            }
                            return arr;
                        }, []);
                        setHeaders(newHeaders);
                        headersCopy.current = newHeaders;
                        startDrag.current.currentIndex = null;
                    }
                }
            }
        }
    });
    const mouseDownPosition = useRef();
    useEffect(() => {
        //const newWidths = headers.map(() => null);
        //setOverwriteColumnWidths(newWidths);
    }, [headers]);

    const headerRefs = useRef([]);
    const headerRow = useRef(null);
    const tableRef = useRef(null);
    function dropHeaderOriginal(){
        const nh = [...headersCopy.current];
        nh.splice(startDrag.current.index, 0, startDrag.current.dragHeader);
        headersCopy.current = nh;
        setHeaders(nh);
        setSelectedDrawHeader(null);
        startDrag.current = null;
    }
    function handleClickHeader(i){
        return function(e){
            mouseDownPosition.current = mouse;
            const index = e.target.cellIndex;
            const cellBound = headerRefs.current[index].getBoundingClientRect();
            if(headerCursor === 'col-resize'){
                if(adjustLocationLeft.current){
                    const cellBoundM1 = headerRefs.current[index-1].getBoundingClientRect();
                    startResizeWidths.current = {
                        index: index-1, 
                        widths: [cellBoundM1.width, cellBound.width]
                    }
                }else{
                    const cellBoundP1 = headerRefs.current[index+1].getBoundingClientRect();
                    startResizeWidths.current = {
                        index: index, 
                        widths: [cellBound.width, cellBoundP1.width]
                    }
                }
            }
            else if(headerCursor === 'move'){
                const mouseInCell = {x: mouse.x - cellBound.x, y: mouse.y - cellBound.y};
                //setSelectedDrawHeader(headers[i]);

                startDrag.current = {index: i, currentIndex: i, cellPos: mouseInCell, 
                    width: cellBound.width, 
                    original: [...headersCopy.current]
                };
            }
        }
    }
    const holdPadding = 5;
    function handleHeaderMouseMove(e){
        //console.log(e.target);
        //console.log(headerRow.current.getBoundingClientRect());
        //const headerRect = headerRow.current.getBoundingClientRect();
        //const xInCell = headerRect.x;
        //console.log(mouseDownPosition);
        const index = e.target.cellIndex;
        const cellRect = headerRefs.current[index].getBoundingClientRect();
        const mouseInCell = {x: mouse.x - cellRect.x, y: mouse.y - cellRect.y};
        const cellWidth = cellRect.width;
        if(index !== 0 && mouseInCell.x < holdPadding){
            setHeaderCursor('col-resize');
            adjustLocationLeft.current = true;
        }else if(index !== headers.length - 1 && mouseInCell.x > cellWidth - holdPadding){
            setHeaderCursor('col-resize');
            adjustLocationLeft.current = false;
        }else{
            setHeaderCursor('move');
        }
    }
    function handleHeaderMouseDown(e){
        console.log(headerRow.current);
        /*
        mouseDownPosition.current = mouse;
        //console.log(e);
        if(headerCursor === 'col-resize'){
            const index = e.target.cellIndex;
            //isResizing.current = true;
            const cellBound = headerRefs.current[index].getBoundingClientRect();
            if(adjustLocationLeft.current){
                const cellBoundM1 = headerRefs.current[index-1].getBoundingClientRect();
                startResizeWidths.current = {
                    index: index-1, 
                    widths: [cellBoundM1.width, cellBound.width]
                }
            }else{
                const cellBoundP1 = headerRefs.current[index+1].getBoundingClientRect();
                startResizeWidths.current = {
                    index: index, 
                    widths: [cellBound.width, cellBoundP1.width]
                }
            }
        }
        */
    }
    //console.log(headers);
    return (
        <>
        {selectedDrawHeader &&
        <div style={{position: 'absolute', 
        left: mouse.x-startDrag.current.cellPos.x, 
        top: mouse.y-startDrag.current.cellPos.y, cursor: 'move', width: startDrag.current.width}}>
            <Table>
                <thead>
                <tr>
                <th>{selectedDrawHeader.label}</th>
                </tr>
                </thead>
                <tbody>
                {testData.map((data, i) => {
                    return <tr key={i}>
                        <td>{data[selectedDrawHeader.accessor]}</td>
                    </tr>
                })}
            </tbody>
            </Table>
        </div>
        }
        <Table className='noselect' ref={tableRef}>
            <thead>
                <tr ref={headerRow} onMouseMove={handleHeaderMouseMove} onMouseDown={handleHeaderMouseDown}>
                    {headers.map((h, i) =>  {
                        const style = {cursor: headerCursor, borderLeftWidth: '1px', borderRightWidth: '1px'};
                        if(headers[i].width){
                            style.width = headers[i].width+'px';
                        }
                        return <th key={i} style={style}
                        ref={r => headerRefs.current[i] = r} onMouseDown={handleClickHeader(i)}>
                            {h.label}
                        </th>
                    })}
                </tr>
            </thead>
            <tbody>
                {testData.map((data, i) => {
                    return <tr key={i}>
                        {headers.map((h, j) => {
                            return <td key={j}>{data[h.accessor]}</td>
                        })}
                    </tr>
                })}
            </tbody>
        </Table>
        </>
    );
}

export function SimpleArrayTable(props){
    return(
        <Table>
            <tbody>
                {props.data.map((row, i) => 
                    <tr key={i}>
                        {row.map((str, j) =>
                            <td key={j}>{str}</td>
                        )}
                    </tr>
                )}
            </tbody>
        </Table>
    )
}

export function HeaderArrayTable(props){
    const [editValue, setEditValue] = useState('');
    const [editCell, setEditCell] = useState(null);
    function handleDelete(i){
        return function(){
            if(props.onDelete) props.onDelete(i);
        }
    }
    function handleEdit(i, j, val){
        return function(){
            if(props.onClick) props.onClick(i);
            if(!props.headers[j].editing) return;
            if(val === null) val = '';
            if(editCell !== null){
                if(editCell.x !== i && editCell.y !== j){
                    submitCellValue();
                    setEditCell({x: i, y: j});
                    setEditValue(val);
                }
            }else{
                setEditCell({x: i, y: j});
                setEditValue(val);
            }
        }
    }
    function handleEditChange(e){
        setEditValue(e.target.value);
    }
    function handleSubmit(e){
        if(e.key === 'Enter'){
            submitCellValue();
        }
    }
    function submitCellValue(){
        const header = props.headers[editCell.y].accessor;
        const id = props.data[editCell.x].id;
        if(props.onEditCell) props.onEditCell(id, header, editValue);
        setEditCell(null);
    }
    return(
        <Table>
            <thead className={props.headerClass}>
                <tr>
                {props.headers.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                {props.delete && <th></th>}
                </tr>
            </thead>
            <tbody>
                {props.data.map((row, i) => 
                    <tr key={i}>
                        {props.headers.map((h, j) => {
                            const style = props.highlightedRow!== null && props.highlightedRow === i ? {backgroundColor: '#e3ae32'} : {};
                            const isEditCell = editCell && props.editing && h.editing ? i === editCell.x && j === editCell.y : false;
                            return <td key={j} style={style} onMouseDown={handleEdit(i, j, row[h.accessor])}>
                                {isEditCell ? 
                                <OutsideClickFunction func={submitCellValue}>
                                <Form.Control style={{minWidth: '100px'}} autoFocus type='text' 
                                value={editValue} onChange={handleEditChange} onKeyDown={handleSubmit}/> 
                                </OutsideClickFunction>
                                : row[h.accessor]}
                            </td>
                        })}
                        {props.delete && <td><Button onClick={handleDelete(i)} variant='danger'>X</Button></td>}
                    </tr>
                )}
            </tbody>
        </Table>
    );
}

export function PaginationHeaderTable(props){
    const [pageSize, setPageSize] = useState(10);
    const [maxPages, setMaxPages] = useState(0);
    const [filteredData, setFilteredData] = useState(props.data);
    const [page, setPage] = useState(0);
    useEffect(() => {
        const fd = props.data.slice(0, pageSize);
        setMaxPages(Math.ceil(props.data.length/pageSize));
        setFilteredData(fd);
        setPage(0);
    }, [props.data]);
    function handlePageClick(pn){
        const fd = props.data.slice(pn*pageSize, +(pn*pageSize) + +pageSize);
        setFilteredData(fd);
        setPage(pn);
    }
    function handlePageSizeChange(nps){
        setPageSize(nps);
        setMaxPages(Math.ceil(props.data.length/nps));
        const fd = props.data.slice(0, nps);
        setPage(0);
        setFilteredData(fd);
    }
    function getLine(i){
        return props.data[(page*pageSize)+i];
    }
    function handleDelete(i){
        const line = getLine(i);
        if(props.onDelete) props.onDelete(line);
        setPage(0);
    }
    return(
        <>
        <div className='MainTable'>
            <HeaderArrayTable data={filteredData} headers={props.headers} editing={props.editing}
            onEditCell={props.onEditCell}
            headerClass={props.headerClass} delete={props.delete} onDelete={handleDelete}/>
        </div>
        <div className='PageInterface'>
            <div>
                <PaginationInterface resetPage={props.reset} displayWidth={2} onPageClick={handlePageClick} 
                pageSize={pageSize} max={maxPages} onPageChangeSize={handlePageSizeChange}/>
            </div>
        </div>
        </>
    );
}

export function SearchPaginationTable(props){
    const [filteredData, setFilteredData] = useState(props.data.map((line, i) => {
        return {...line, lineId: i};
    }));
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState(props.searchField);
    const [resetPage, setResetPage] = useState(0);
    const [fieldIndex, setFieldIndex] = useState(0);
    useEffect(() => {
        //const upperSearch = searchTerm.toUpperCase();
        const fd = props.data.reduce((arr, v) => {
            if(v[searchField].toUpperCase().startsWith(searchTerm)){
                arr.push(v);
            }
            return arr;
        }, []);
        setFilteredData(fd);
    }, [props.data]);
    function handleChangeSearch(s, sf=null){
        const sea = sf ? sf : searchField;
        if(s !== ''){
            const upperSearch = s.toUpperCase();
            const fd = props.data.reduce((arr, v) => {
                //console.log(v);
                if(v[sea].toUpperCase().startsWith(upperSearch)){
                    arr.push(v);
                }
                return arr;
            }, []);
            setSearchTerm(upperSearch);
            setFilteredData(fd);
        }else{
            setSearchTerm('');
            setFilteredData(props.data);
        }
        setResetPage(resetPage+1);
    }
    function handleFieldChange(v, i){
        handleChangeSearch(searchTerm, props.headers[i].accessor);
        setSearchField(props.headers[i].accessor);
        setResetPage(resetPage+1);
        setFieldIndex(i);
    }
    function handleDelete(i){
        setResetPage(resetPage+1);
        if(props.onDelete) props.onDelete(i);
    }
    //console.log(filteredData);
    return(
        <>
        <div className={'HoriCenter '+props.className}>
            {props.searchName}
            <TextControl onChange={handleChangeSearch}/>
            {props.fieldOptions && <SimpleDropdown items={props.headers.map((h) => h.label)} 
            selected={props.headers[fieldIndex].label} onChange={handleFieldChange}/>}
        </div>
        <PaginationHeaderTable headers={props.headers} data={filteredData} 
        headerClass={props.headerClass} editing={props.editing} onEditCell={props.onEditCell}
        reset={resetPage} delete={props.delete} onDelete={handleDelete}/>
        </>
    );
}

export function BOMAPITable(props){
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => {
        return props.bomAttrs.concat(props.apis);
    }, [props.bomAttrs, props.apis]);

    const [checkboxRows, setCheckboxRows] = useState(props.data.map(() => false));

    const pageSize = 5;
    const [pageNumber, setPageNumber] = useState(0);
    const numPages = Math.ceil(props.data.length / pageSize);
    const displayWidth = 3;
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data});

    ///not working as intended
    function handleChangeCBox(i){
        console.log(i);
        console.log(checkboxRows);
        setCheckboxRows(update(checkboxRows, {
            [i]: {$set: !checkboxRows[i]}
        }));
    }
    function handleChangeQuantity(rn){
        return function(quantity){
            props.onChangeQuantity(rn, quantity);
        }
    }
    function isAPICell(i){
        return i >= props.bomAttrs.length;
    }
    function renderHeader(){
        return (
        <>
        {headerGroups.map((headerGroup,h) => (
        <thead key={'group'+h} className='TableHeading'>
        <tr key={'group'+h} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, i) => (
            <th key={'head'+h+'col'+i} {...column.getHeaderProps()} 
            rowSpan={isAPICell(i) ? 1:2} 
            colSpan={isAPICell(i) ? props.apiSubHeadings.length:1}>
                {column.render('Header')}
            </th>
            ))}
        </tr>
        <tr key={'headers'+h}>
            {headerGroup.headers.map((column, i) => (
                isAPICell(i) && 
                props.apiSubHeadings.map((heading, j) => (
                    <th key={'head'+h+'col'+i+'sub'+j}>{heading.Header}</th>
                ))
            ))}
        </tr>
        </thead>
        ))}
        </>
        );
    }
    function handleClickRow(row){ // to be used later maybe?
        return function(){
        }
    }
    function handlePageChange(pn){
        //console.log(pn);
        setPageNumber(pn);
    }
    const pageRows = slice(rows, pageNumber*pageSize, pageNumber*pageSize+pageSize);
    return(
        <>
        <div className='MainTable'>
        <Table {...getTableProps()}>
        {renderHeader()}
        <tbody {...getTableBodyProps()}>
            {pageRows.map((row, rn) => {
                prepareRow(row);
                const rowData = row.original;
                if(rowData.maxOffers > 0){
                    return (
                        <PartRow key={rn} row={row} bomAttrsLength={props.bomAttrs.length} 
                        apiSubHeadings={props.apiSubHeadings} onClickRow={handleClickRow}
                        onChangeQuantity={handleChangeQuantity(rn)} 
                        highlight={props.showHighlights ? props.highlights[rn] : null}
                        checked={checkboxRows[rn]}/>
                    );
                
                }else{
                    return(
                    <EmptyOffer key={rn} row={row} apiSubHeadings={props.apiSubHeadings}
                    bomAttrsLength={props.bomAttrs.length} onChangeQuantity={handleChangeQuantity(rn)}
                    finished={props.rowsFinished[rn]} checked={checkboxRows[rn]}/>
                    );
                }
            })
            }
        </tbody>
        </Table>
        </div>
        <div className='PageInterface'>
        <PageInterface current={pageNumber} max={numPages} 
        displayWidth={displayWidth} onPageClick={handlePageChange}/>
        </div>
        </>
    );
}

export function BestPriceTable(props){
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => props.headers, [props.headers]);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data});
    return (
    <Table {...getTableProps()}>
        <thead className='TableHeader'>
            {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                <th
                    {...column.getHeaderProps()}
                >
                    {column.render('Header')}
                </th>
                ))}
            </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {rows.map(row => {
            prepareRow(row);
            return (
                <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                    return (
                    <td {...cell.getCellProps()}>
                        {cell.render('Cell')}
                    </td>
                    );
                })}
                </tr>
            )
            })}
        </tbody>
    </Table>
    );
}

export function PricingTable(props){
    //console.log(props.pricing);
    return(
    <>
    {props.pricing &&
    <Table bordered hover className='PricingTable'>
        <thead>
        <tr>
        <th>Break Quantity</th><th>Price</th>
        </tr>
        </thead>
        <tbody>
        {props.pricing.map((bracket, i) => {
            const cn = props.highlight == i ? 'PricingCell HighlightedCell' : 'PricingCell'; 
            return(
            <tr key={i}>
                <td className={cn}>{bracket.BreakQuantity}</td>
                <td className={cn}>{bracket.UnitPrice}</td>
            </tr>
            )}
        )}
        </tbody>
    </Table>
    }
    </>
    );
}

export function SimpleApiTable(props){
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => props.bomAttrs.concat(props.apiAttrs), [props.bomAttrs, props.apiAttrs]);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data});
    return (
    <Table {...getTableProps()} bordered>
        <thead>
            {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                <th
                    {...column.getHeaderProps()}
                >
                    {column.render('Header')}
                </th>
                ))}
            </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {rows.map(row => {
            prepareRow(row);
            return (
                <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                    return (
                    <td {...cell.getCellProps()}>
                        {cell.render('Cell')}
                    </td>
                    );
                })}
                </tr>
            )
            })}
        </tbody>
    </Table>
    )
}

function ApiPriceRow(props){
    const priceCols = props.cells.reduce(function(apis, cell){
        if(cell.column.parent){
            const apiName = cell.column.parent.id;
            if(!(apiName in apis)){
                apis[apiName] = cell.column.parent;
            }
        }
        return apis;
    }, {});
    //console.log(priceCols);
    return(
        <tr>
            {Object.keys(priceCols).map((cell, i) => 
                <td key={i} colSpan={props.colspan}>{priceCols[cell].PriceRender(priceCols[cell])}</td>
            )}
        </tr>
    );
}

export function ReactTable(props){
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => props.headers, [props.headers]);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data});
    return(
    <Table {...getTableProps()}>
        <thead className='TableHeader'>
            {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>
                    {column.render('Header')}
                </th>
                ))}
            </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {rows.map(row => {
            prepareRow(row);
            return (
                <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                    return (
                    <td {...cell.getCellProps()}>
                        {cell.render('Cell')}
                    </td>
                    );
                })}
                </tr>
            )
            })}
        </tbody>
    </Table>
    );
}

export function HeaderExcelDisplayTable(props){
    //const header = 
}

export function CheckLinesExcelTable(props){
    const numCols = props.sheet.length > 0 ? props.sheet[0].length : 0;
    const [allChecked, setAllChecked] = useState(true);
    const [checkedRows, setCheckedRows] = useState([true]);
    useEffect(() => {
        setCheckedRows(Array(props.sheet.length).fill(false));
    }, [props.sheet])
    function handleCheckBox(i){
        setCheckedRows(update(checkedRows, {[i]: {$set: !checkedRows[i]}}));
    }
    const headerRow = <tr>
        {numCols > 0 &&
        <td></td>
        }
    {[...Array(numCols)].map((e, i) => <td key={i}>i</td>)}
    </tr>
    const tableRow = (cell) => 
        cell.map((val, i) => <td key={i}>{val}</td>)
    ;
    const tableRows = props.sheet.map((row,i) => 
        <tr key={i}>
            <td>
                <IdCheckbox i={i} checked={checkedRows[i]} onChange={handleCheckBox}/>
            </td>
            {tableRow(row)}
        </tr>
    );
    return (
        <Table bordered hover>
            <tbody>
            {headerRow}
            {tableRows}
            </tbody>
        </Table>
    );
}

/* 
Display table from 2d array with checkbox column on left side 
Dropdown list for each column
Checkbox column displayed given checkedRow array (boolean array)
*/
export function CheckboxRowCustomColumnTable(props){
    //console.log(props);
    const numCols = props.sheet.length > 0 ? props.sheet[0].length : 0;
    const checkCol = (i) => 
    <td>
        <HoverOverlay tooltip='Check to remove line'>
        <IdCheckbox i={i} checked={props.checkedRows[i]} onChange={props.onCheckBox}/>
        </HoverOverlay>
    </td>;
    const headerRow = (
    <tr>
        {numCols > 0 &&
        <td></td>
        }
        {[...Array(numCols)].map((e, i) => 
        <td key={i}>
            <SimpleDropdown items={props.columnOptions} 
            selected={props.columnAttributes[i]} onChange={(item) => props.onColumnChange(i, item)}/>
        </td>
        )}
    </tr>
    );
    return (
        <Table bordered hover>
            <thead className='TableHeading'>
                {headerRow}
            </thead>
            <tbody>
            {props.sheet.map((row,i) => 
                <tr key={i}>
                    {checkCol(i)}
                    {row.map((val, j) => 
                    <td key={j}>{val}</td>
                    )}
                </tr>
            )}
            </tbody>
        </Table>
    );
}
/*
export function ChooseHeaderRowsTable(props){
    const firstHeadings = props.sheet && props.headings ? Array(props.sheet[0].length).fill(props.headings[0].Header) : [];
    const [selectedRows, setSelectedRows] = useState(Array(props.sheet.length).fill(false));
    const [selectedHeadings, setSelectedHeadings] = useState(firstHeadings);
    const headers = props.headings.map((h) => h.Header);
    function onDropdownChange(i){
        return function(e){
            //console.log(e);
            const eIndex = selectedHeadings.reduce((v, h, i) => {
                if(h === e){
                    return i;
                }
                return v;
            }, null);
            if(eIndex !== null){
                setSelectedHeadings(update(selectedHeadings, {
                    [i]: {$set: e},
                    [eIndex]: {$set: props.headings[0].Header}
                }));
            }else{
                setSelectedHeadings(update(selectedHeadings, {
                    [i]: {$set: e}
                }));
            }
            //props.onColumnChange(i, item)
        }
    }
    function onCheckBox(e){
        setSelectedRows(update(selectedRows, {
            [e]: {$set: !selectedRows[e]}
        }))
    }
    const checkCol = (i) => <td><IdCheckbox i={i} checked={selectedRows[i]} onChange={onCheckBox}/></td>;
    function headingsRow(){
        return(
        <tr>
            <td></td>
            {selectedHeadings.map((e, i) =>
            <td key={i}>
                <SimpleDropdown items={headers} 
                selected={e} onChange={onDropdownChange(i)}/>
            </td>
            )
            }
        </tr>
        );
    }
    function dataRows(){
        return(
        <>
        {props.sheet.map((line, i) => 
            <tr key={i}>
                {checkCol(i)}
                {line.map((val, j) =>
                    <td key={j}>{val}</td>
                )}
            </tr>
        )}
        </>
        );
    }
    return(
    <Table bordered>
        <thead className='TableHeading'>
            {headingsRow()}
        </thead>
        <tbody>
            {dataRows()}
        </tbody>
    </Table>
    );
}

export function BOMAPITableOld(props) {
    const data = useMemo(() => props.data, [props.data]);
    console.log(props.bomAttrs.concat(props.apiHeaders));
    const columns = useMemo(() => props.bomAttrs.concat(props.apiHeaders), [props.bomAttrs, props.apiHeaders]);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data});
    return (
    <Table {...getTableProps()}>
        <thead className='TableHeader'>
            {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                <th
                    {...column.getHeaderProps()}
                >
                    {column.render('Header')}
                </th>
                ))}
            </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {rows.map(row => {
            prepareRow(row);
            return (
                <>
                <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                    return (
                    <td {...cell.getCellProps()} rowSpan={cell.column.parent ? 1 : 2}>
                        {cell.render('Cell')}
                    </td>
                    );
                })}
                </tr>
                </>
            )
            })}
        </tbody>
    </Table>
    )
}
*/