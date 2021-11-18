import Table from 'react-bootstrap/Table';

export function ExcelDisplayTable(props){
    const tableRow = (cell) => 
        cell.map((val, i) => <td key={i}>{val}</td>)
    ;
    const tableRows = props.sheet.map((row,i) => 
        <tr key={i}>{tableRow(row)}</tr>
    );
    return (
        <Table striped bordered hover>
            <tbody>
            {tableRows}
            </tbody>
        </Table>
    );
}

export function CheckLinesExcelTable(props){
    const tableRow = (cell) => 
        cell.map((val, i) => <td key={i}>{val}</td>)
    ;
    const tableRows = props.sheet.map((row,i) => 
        <tr key={i}>
            <td>
                <input class="form-check-input" type="checkbox" value={i} id={"line"+i}/>
            </td>
            {tableRow(row)}
        </tr>
    );
    return (
        <Table>
            <tbody>
            {tableRows}
            </tbody>
        </Table>
    );
}