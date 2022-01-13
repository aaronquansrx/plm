import {useState, useEffect, useMemo} from 'react';
import update from 'immutability-helper';

import { useTable, useGroupBy, useExpanded } from 'react-table'

import Table from 'react-bootstrap/Table';
import {SimpleDropdown} from './Dropdown';
import {PartRow} from './Offer';

import './../css/table.css';
import './../css/temp.css';
 
export function BOMAPITable(props) {
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

export function BOMAPITableV2(props){
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => props.bomAttrs.concat(props.apis), [props.bomAttrs, props.apis]);
    //console.log(props.bomAttrs.concat(props.apis));
    const [showPriceOffers, setShowPriceOffers] = useState(null);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data});
    useEffect(() => {
        const initShowPriceOffers = props.data.map((row) => {
            return {switches: Array(row.maxOffers).fill(false), ntrue: 0};
        });
        //console.log(initShowPriceOffers);
        setShowPriceOffers(initShowPriceOffers);
    }, [props.data]);
    //console.log(props.apiSubHeadings);
    function handleShowPrice(rn, i){
        return function(){
            //console.log(rn);
            const inc = showPriceOffers[rn].switches[i] ? -1 : 1;
            const opp = !showPriceOffers[rn].switches[i];
            setShowPriceOffers(update(showPriceOffers, {
                [rn]: 
                {
                    switches:{[i]: {$set: opp}}, 
                    ntrue: {$apply: (n) => n+inc}
                }
            }));
        }
    }
    function handleChangeQuantity(rn){
        return function(quantity){
            //console.log(props);
            props.onChangeQuantity(rn, quantity);
            //console.log(rn);
            //console.log(quantity);
        }
    }
    function isAPICell(i){
        return i >= props.bomAttrs.length;
    }
     {/*
        <tr key={'headers'+h}>
            {headerGroup.headers.map((column, i) => (
                isAPICell(i) && 
                props.apiSubHeadings.map((heading, j) => (
                    <th key={'head'+h+'col'+i+'sub'+j}>{heading.Header}</th>
                ))
            ))}
        </tr>
        */}
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
    function NoOffer(k){
        return <td key={k} colSpan={props.apiSubHeadings.length}>No Offer</td>;
    }
    //console.log(data);
    return(
        <Table {...getTableProps()}>
        {renderHeader()}
        <tbody {...getTableBodyProps()}>
            {rows.map((row, rn) => {
            prepareRow(row);
            const rowData = row.original;
            if(rowData.maxOffers > 0){
                return (
                    <PartRow key={rn} row={row} bomAttrsLength={props.bomAttrs.length} 
                    apiSubHeadings={props.apiSubHeadings}
                    onChangeQuantity={handleChangeQuantity(rn)}/>
                );
            }else{
                return(
                <tr key={rn} {...row.getRowProps()}>
                    {row.cells.map((cell,i) => {
                        const k = 'row'+rn+'cell'+i;
                        if(isAPICell(i)){
                            return NoOffer(k);
                        }else{
                            //const maxOffers = rowData.maxOffers ? rowData.maxOffers : 0;
                            return (
                            <td key={k} {...cell.getCellProps()}>
                                {cell.render('Cell')}
                            </td>
                            );
                        }
                    })}
                </tr>
                );
            }
            })}
        </tbody>
        </Table>
    );
}

export function BestPriceTable(props){
    console.log(props.data);
    //const headers = props.headers;
    const headers = [
        {
            Header: 'MPN',
            accessor: 'mpn'
        },
        {
            Header: 'Total Price',
            accessor: 'total_price',
            Cell: (r) => r.value.toFixed(2)
        },
        {
            Header: 'Quantity Buying',
            accessor: 'quantity'
        },
        {
            Header: 'Offers',
            accessor: 'offers',
            Cell: (r) => {
                const offers = r.value;
                //console.log(offers);
                return (
                    <div>
                    {offers.map((offer,i) => {
                        return(
                        <div key={i}>
                        <span>Api: {offer.api}</span><span> N: {offer.offerNum}</span>
                        <span> Price: {offer.total.toFixed(2)}</span><span> Quantity: {offer.quantity}</span>
                        <span> Per: {offer.per.toFixed(2)}</span>
                        </div>
                        );
                    })}
                    </div>
                );
            }
        }
    ];
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => headers, [props.headers]);
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

/*[...Array(rowData.maxOffers)].map((e, i) => {
    const rk = 'row'+rn+'offer'+i;
    const rowProps = i === 0 ? {...row.getRowProps()} : {}
    return(
    <>
    <tr key={rk} {...rowProps} >
        {row.cells.map((cell,c) => {
            const k = 'cell'+cell.column.id+'offer'+i;
            if(isAPICell(c)){
                if(cell.column.id in rowData){
                    const offers = rowData[cell.column.id].offers;
                    if(i < offers.length){
                        const offer = offers[i];
                        return(
                            <>
                            {props.apiSubHeadings.map((heading, j) => 
                                <td key={k+'heading'+j}>
                                    {heading.accessor in offer && offer[heading.accessor]}
                                </td>
                            )}
                            </>
                        );
                    }else{
                        return <td key={k} colSpan={props.apiSubHeadings.length}></td>;
                    }
                }else{
                    return NoOffer(k);
                }
            }else{
                if(cell.column.id === 'n'){
                    return(
                        <td key={k} {...cell.getCellProps()} className='Ver'>
                            <span>{i+1}</span>
                            <button onClick={handleShowPrice(rn, i)}>Prices</button>
                        </td>
                    );
                }else{
                    if(i === 0){
                        return(
                        <td key={k} {...cell.getCellProps()} 
                        rowSpan={rowData.maxOffers+showPriceOffers[rn].ntrue}>
                            {cell.render('Cell')}
                        </td>
                        );
                    }
                }
            }
        })}
    </tr>
    { showPriceOffers[rn].switches[i] &&
    <tr key={rk+'2'}>
        {row.cells.map((cell,c) => {
            if(isAPICell(c)){
                if(cell.column.id in rowData){
                    const offers = rowData[cell.column.id].offers;
                    if(i < offers.length){
                        const offer = offers[i];
                        //console.log(offer);
                        return(
                            <td colSpan={props.apiSubHeadings.length}>
                                <PricingTable pricing={offer.pricing}/>
                            </td>
                        );
                    }else{
                        return <td colSpan={props.apiSubHeadings.length}></td>;
                    }
                }else{
                    return <td colSpan={props.apiSubHeadings.length}></td>;
                }
            }else if(cell.column.id === 'n'){
                return <td className='CellHeading'>Price</td>;
            }
        })}
    </tr>
    }
    </>
    );
})*/

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

//should rename functions more simply
export function ExcelDisplayTable(props){
    const tableRow = (cell) => 
        cell.map((val, i) => <td key={i}>{val}</td>)
    ;
    const tableRows = props.sheet.map((row,i) => 
        <tr key={i}>{tableRow(row)}</tr>
    );
    return (
        <Table bordered hover>
            <tbody>
            {tableRows}
            </tbody>
        </Table>
    );
}

function TableHeader(props){
    return(
        <tr>
            {props.array.map((str, i) =>
                str !== "_remove" &&
                <th key={i}>{str}</th>
                
            )}
        </tr>
    );
}

function TableRow(props){
    return(
    <tr>
        {props.map((str, i) =>
            <td key={i}>{str}</td>
        )}
    </tr>
    );
}

export function JsonArrayDisplayTable(props){
    console.log(props.headings);
    return(
        <Table bordered hover>
            <tbody>
                <TableHeader array={props.headings}/>
                {props.jsonArray.map((row, i) => 
                    <tr key={i}>
                    {props.headings.map((header, j) => 
                        header !== "_remove" &&
                        <td key={j}>{row[header]}</td>
                        
                    )}
                    </tr>
                )}
            </tbody>
        </Table>  
    );
}

export function HeaderExcelDisplayTable(props){
    //const header = 
}

function IdCheckbox(props){
    function handleChange(){
        props.onChange(props.i);
    }
    return (
        <input className="form-check-input" type="checkbox" value={props.key} checked={props.checked} onChange={handleChange}/>
    );
}

export function CheckLinesExcelTable(props){
    const numCols = props.sheet.length > 0 ? props.sheet[0].length : 0;
    const [allChecked, setAllChecked] = useState(true);
    const [checkedRows, setCheckedRows] = useState([true]);
    useEffect(() => {
        setCheckedRows(Array(props.sheet.length).fill(false));
    }, [props.sheet])
    function handleCheckAll(){
        setAllChecked(!allChecked);
        //props.handleCheckAll();
    }
    function handleSelectAll(){
        setAllChecked(true); //invoke all false checkboxes
    }
    function handleDeselectAll(){
        setAllChecked(false);
    }
    function handleCheckBox(i){
        setCheckedRows(update(checkedRows, {[i]: {$set: !checkedRows[i]}}));
    }
    /*
    function handleCheckedRows(i){
        console.log(checkedRows);
        const newRow = update(checkedRows, {[i]: {$set: !checkedRows[i]}});
        setCheckedRows(update(checkedRows, {[i]: {$set: !checkedRows[i]}}));
        console.log(newRow);
    }*/
    /*
    select all buttons
    <button onClick={handleSelectAll}>Select All</button>
    <button onClick={handleDeselectAll}>Deselect All</button>
    */
    //<input className="form-check-input" type="checkbox" value="all" checked={allChecked} onChange={handleCheckAll}/>
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
    const numCols = props.sheet.length > 0 ? props.sheet[0].length : 0;
    const checkCol = (i) => 
    <td>
        <IdCheckbox i={i} checked={props.checkedRows[i]} onChange={props.onCheckBox}/>
    </td>;
    const headerRow = <tr>
        {numCols > 0 &&
        <td></td>
        }
    {[...Array(numCols)].map((e, i) => 
    <td key={i}>
        <SimpleDropdown items={props.columnOptions} 
        selected={props.columnAttributes[i]} onChange={(item) => props.onColumnChange(i, item)}/>
    </td>
    )}
    </tr>;
    return (
        <Table bordered hover>
            <tbody>
            <PreRowPreColumnTableRows preRow={headerRow} preCol={checkCol} sheet={props.sheet}/>
            </tbody>
        </Table>
    );
}

function PreColumnTableRow(props){
    return(
        <>
        {props.preCol}
        {props.columns.map((val, i) => 
        <td key={i}>{val}</td>
        )}
        </>
    )
}

function PreRowPreColumnTableRows(props){
    return(
    <>
    {props.preRow}
    {props.sheet.map((row,i) => 
        <tr key={i}>
            <PreColumnTableRow preCol={props.preCol(i)} columns={row}/>
        </tr>
    )}
    </>
    );
}