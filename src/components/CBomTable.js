import React, {useState} from 'react';

import Table from 'react-bootstrap/Table';

export function CBomTable(props){
    const tbh = props.tableHeaders;
    const data = [
        {'CPN': 1, 'SRX PN': 2, 'Descriptions': 3, 'Approved MFR': 4, 'Approved MPN': 5},
        {'CPN': 1, 'SRX PN': 2, 'Descriptions': 3, 'Approved MFR': 4, 'Approved MPN': 5}
    ];
    console.log(props.data);
    return(
        <div>
            <Table>
                <thead>
                    <tr>
                    {tbh.map((header, h) => {
                        return <th key={h}>{header}</th>
                    })}
                    </tr>
                </thead>
                <tbody>
                {props.data.map((line, l) => {
                    return (
                    <tr key={l}>
                    {tbh.map((header, i) => 
                    <td key={i}>{line[header]}</td>
                    )}
                    </tr>
                    )
                })}
                </tbody>
            </Table>
        </div>
    );
}