import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';

import {HoverOverlay} from '../components/Tooltips';
import {BsFileEarmarkArrowDown} from "react-icons/bs";

import {ExcelDropzone} from './Dropzone';
import {SimpleDropdown} from './Dropdown';

import {UploadIcon, EditIcon, SheetIcon} from '../components/Icons';

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import {useExcelUpload} from './../hooks/FileUpload';
import { set } from 'lodash';

function BOMScrubInterface(props){
    const [interfaceState, setInterfaceState] = useState('upload');
    const [sheet, filename, parseSheet] = useExcelUpload();
    const [tableHeaders, setTableHeaders] = useState([]);
    const [tableBody, setTableBody] = useState([]);
    function changeState(state){
        setInterfaceState(state);
    }
    function onFileUpload(workbook, file){
        const ps = parseSheet(workbook, file, true);
        setTableHeaders(ps.headers);
        setTableBody(ps.sheet);
        setInterfaceState('table');
    }

    function renderInterfaceState(){
        let render = <></>;
        switch(interfaceState){
            case 'upload':
                render = <UploadInterface onFileUpload={onFileUpload}/>
                break;
            case 'table':
                render = <TableInterface headers={tableHeaders} body={tableBody} table={sheet}/>
                break;
            case 'export':
                break;
            default:
                break;
        }
        return render;
    }
    return (
        <>
        <Navigation onNavChange={changeState} interfaceState={interfaceState}/>
        {renderInterfaceState()}
        </>
    );
}

function UploadInterface(props){
    return(
    <div>
        <ExcelDropzone class='DropFiles' onDrop={props.onFileUpload}>
            <BsFileEarmarkArrowDown size={40}/>
            <p>Drop BOM files (excel, csv)</p>
        </ExcelDropzone>
    </div>
    );
}

function Navigation(props){
    const size = 35;
    function handleNavChange(state){
        return function(){
            props.onNavChange(state);
        }
    }
    return(
    <div className='FlexNormal'>
        <div className='IconNav'>
            <div className='MainSwitchIcon'>
            <HoverOverlay tooltip={'Upload'} placement='bottom'>
            <UploadIcon onClick={handleNavChange('upload')} 
            selected={props.interfaceState==='upload'} size={size}/>
            </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
            <HoverOverlay tooltip={'Table'} placement='bottom'>
            <EditIcon onClick={handleNavChange('table')} 
            selected={props.interfaceState==='table'} size={size}/>
            </HoverOverlay>
            </div>
        </div>
    </div>
    );
}

const scrubHeaders = [
    'RoHS', 'REACH'
]

function TableInterface(props){
    const [selectedTableColumns, setSelectedTableColumns] = useState([]);
    const [columnOrder, setColumnOrder] = useState(props.headers);
    function handleEditAttributeChange(i, value){
        const valueIndex = scrubHeaders.reduce((v, h, i) => {
            if(h === value){
                return i;
            }
            return v;
        }, null);
        if(valueIndex !== null && valueIndex !== i){
            setSelectedTableColumns(update(selectedTableColumns, {
                [i]: {$set: value},
                [valueIndex]: {$set: null} //old index
            }));
        }else{
            setSelectedTableColumns(update(selectedTableColumns, {
                [i]: {$set: value}
            }));
        }
    }
    function handleAddColumn(){
        setSelectedTableColumns(update(selectedTableColumns, {
            $push: [null]
        }));
        setColumnOrder(update(columnOrder, {
            $push: [null]
        }))
    }
    function handleDataLookup(){
        console.log('do batch details data lookup');
    }
    console.log(props.body);
    return(
    <div>
    <Table>
        <thead className='TableHeader'>
        <tr>
            {props.headers.map((header, i) => 
            <td key={i}>
                {header}
            </td>
            )}
            {[...Array(selectedTableColumns.length)].map((e, i) => 
            <td key={i}>
                <SimpleDropdown items={scrubHeaders} 
                selected={selectedTableColumns[i] === null ? '-' : selectedTableColumns[i]} onChange={(item) => handleEditAttributeChange(i, item)}/>
            </td>
            )}
        </tr>
        </thead>
        <tbody>
        {props.body.map((line, ln) => 
        <tr key={ln}>
            {columnOrder.map((val, i) => 
                val in line ? <td key={i}>{line[val]}</td> : <td key={i}></td>
            )}
        </tr>
        )}
        </tbody>
    </Table>
    <Button onClick={handleAddColumn}>Add Column</Button>
    <Button onClick={handleDataLookup}>Data Lookup</Button>
    <Button>Export</Button>

    </div>
    );
}

export default BOMScrubInterface;