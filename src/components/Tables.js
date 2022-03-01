import {useState, useEffect, useMemo} from 'react';
import update from 'immutability-helper';

import { useTable/*, useGroupBy, useExpanded*/ } from 'react-table'

import Table from 'react-bootstrap/Table';
import {SimpleDropdown} from './Dropdown';
import {PartRow, EmptyOffer} from './Offer';
import {IdCheckbox} from './Checkbox';
import {HoverOverlay} from './Tooltips';
import {PageInterface} from './Pagination';

import './../css/table.css';
import './../css/temp.css';
import { slice } from 'lodash';

export function BOMAPITable(props){
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => props.bomAttrs.concat(props.apis), [props.bomAttrs, props.apis]);

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
                        highlight={props.showHighlights ? props.highlights[rn] : null}/>
                    );
                
                }else{
                    return(
                    <EmptyOffer key={rn} row={row} apiSubHeadings={props.apiSubHeadings}
                    bomAttrsLength={props.bomAttrs.length} onChangeQuantity={handleChangeQuantity(rn)}
                    finished={props.rowsFinished[rn]}/>
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
        {props.pricing.map((bracket, i) => 
            <tr key={i}>
                <td className='PricingCell'>{bracket.BreakQuantity}</td>
                <td className='PricingCell'>{bracket.UnitPrice}</td>
            </tr>
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
    console.log(props);
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