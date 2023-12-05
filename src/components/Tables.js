import {useState, useEffect, useMemo} from 'react';
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
                            const isEditCell = editCell && props.editing && h.editing ? i === editCell.x && j === editCell.y : false;
                            return <td key={j} onMouseDown={handleEdit(i, j, row[h.accessor])}>
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