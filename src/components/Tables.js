import {useState, useEffect, useMemo} from 'react';
import update from 'immutability-helper';

import { useTable } from 'react-table'

import Table from 'react-bootstrap/Table';
import {SimpleDropdown} from './Dropdown';
 
export function ReactTable(props) {
    const data = useMemo(() => props.data, [props.data]);
    const columns = useMemo(() => props.headers, [props.headers]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data })

    return (
    <Table {...getTableProps()} bordered hover>
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
            prepareRow(row)
            return (
                <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                    return (
                    <td
                        {...cell.getCellProps()}
                    >
                        {cell.render('Cell')}
                    </td>
                    )
                })}
                </tr>
            )
            })}
        </tbody>
    </Table>
    )
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
                str != "_remove" &&
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
                        header != "_remove" &&
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