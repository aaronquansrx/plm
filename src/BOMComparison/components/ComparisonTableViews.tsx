import {useState, useEffect, useRef} from 'react';
import { CollectedBOMLine } from '../scripts/differencesTs';
import { Table } from 'react-bootstrap';
import { TableHeader } from './Tables';

type CompareKeyTableProps = {
    headers: TableHeader<CollectedBOMLine>[];
    table_data_old: CollectedBOMLine[];
    table_data_new: CollectedBOMLine[];
}

export function CompareKeyTable(props: CompareKeyTableProps){
    const style = {width: '50%', overflow: 'auto'};
    const border = {borderRight: 'black 2px solid'};
    return (
        <>
        <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{...style, ...border}}>
        <Table>
            <thead className='TableHeading'>
                <tr>
                    <th colSpan={props.headers.length+1}>BOM Old</th>
                </tr>
                <tr>
                    {props.headers.map((h, i) => {
                        if(h.label === 'Designator'){
                            return <th key={i} colSpan={2}>{h.label}</th>
                        }
                        return <th key={i}>{h.label}</th>
                    }
                    )}
                </tr>
            </thead>
            <tbody>
                {props.table_data_old.map((line, i) => {
                    return <tr key={i}>
                    {props.headers.map((h, i) => {
                        if(h.label === 'Designator'){
                            return <th key={i} colSpan={2}>{line[h.accessor as keyof CollectedBOMLine]}</th>
                        }
                        return <td key={i}>{line[h.accessor as keyof CollectedBOMLine]}</td>;
                    })}
                    </tr>
                })}
            </tbody>
        </Table>
        </div>
        <div style={style}>
        <Table>
        <thead className='TableHeading'>
            <tr>
                <th colSpan={props.headers.length+1}>BOM New</th>
            </tr>
            <tr>
                {props.headers.map((h, i) => {
                    if(h.label === 'Designator'){
                        return <th key={i} colSpan={2}>{h.label}</th>
                    }
                    return <th key={i}>{h.label}</th>
                }
                )}
            </tr>
        </thead>
        <tbody>
            {props.table_data_new.map((line, i) => {
                return <tr key={i}>
                {props.headers.map((h, i) => {
                    
                    if(h.label === 'Designator'){
                        return <th key={i} colSpan={2}>{line[h.accessor as keyof CollectedBOMLine]}</th>
                    }
                    return <td key={i}>{line[h.accessor as keyof CollectedBOMLine]}</td>;
                })}
                </tr>
            })}
        </tbody>
    </Table>
    </div>
    </div>
        </>
    )
}

//write table seperately


