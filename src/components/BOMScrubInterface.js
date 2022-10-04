import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import axios from 'axios';
import XLSX from 'xlsx';

import {HoverOverlay} from '../components/Tooltips';
import {BsFileEarmarkArrowDown} from "react-icons/bs";

import {SimplePopover} from './Tooltips';
import {ExcelDropzone} from './Dropzone';
import {SimpleDropdown} from './Dropdown';

import {PageInterface} from './Pagination';
import {usePaging} from './../hooks/Paging';

import {UploadIcon, EditIcon, SheetIcon} from '../components/Icons';

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import {useExcelUpload} from './../hooks/FileUpload';
import {useServerUrl} from './../hooks/Urls';

import './../css/main.css';

function BOMScrubInterface(props){
    const [interfaceState, setInterfaceState] = useState('upload');
    const [sheet, filename, parseSheet] = useExcelUpload();
    const [tableHeaders, setTableHeaders] = useState([]);
    const [uploadedTable, setUploadedTable] = useState([]);
    const [tableBody, setTableBody] = useState([]); //table that is edited by table state
    function changeState(state){
        setInterfaceState(state);
    }
    function handleFileUpload(workbook, file){
        const ps = parseSheet(workbook, file, true);
        setTableHeaders(ps.headers);
        setTableBody(ps.sheet);
        setInterfaceState('table');
        setUploadedTable(ps.sheet);
    }
    function handleReset(){
        setTableBody(uploadedTable);
    }
    function renderInterfaceState(){
        let render = <></>;
        switch(interfaceState){
            case 'upload':
                render = <UploadInterface onFileUpload={handleFileUpload}/>
                break;
            case 'table':
                render = <TableInterface headers={tableHeaders} body={tableBody} table={sheet} onReset={handleReset}/>
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
    'Description', 'RoHS', 'Reach', 'MSL', 'Lead', 
]

function TableInterface(props){
    const serverUrl = useServerUrl();
    const [mpnHeader, setMpnHeader] = useState(null);
    //const [newColumns, setNewColumns] = useState(new Set());
    const [columnOrder, setColumnOrder] = useState(props.headers.concat(scrubHeaders));
    const [tableData, setTableData] = useState(props.body);
    //const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const [dataLock, setDataLock] = useState(false); 
    const [showExportModal, setShowExportModal] = useState(false);
    // to make sure mpnHeader doesnt change during data processing

    const [pageSize, setPageSize] = useState(5);
    const [pageNumber, numPages, handlePageChange] = usePaging(tableData.length, pageSize);
    const displayWidth = 3;
    const displayTableData = tableData.slice(pageNumber*pageSize, +(pageNumber*pageSize) + +pageSize);
    function handleChangePageSize(s){
        setPageSize(s);
        handlePageChange(0);
    }

    useEffect(() => {
        console.log(props.body);

    }, [props.body]);
    useEffect(() => {
        const mpnHeaderStrings = ['mpn', 'manufacturing part number'];
        const mpnHeader = props.headers.reduce((h, header) => {
            if(mpnHeaderStrings.includes(header.toLowerCase())){
                return header;
            }
            return h;
        }, null);
        if(mpnHeader !== null){
            setMpnHeader(mpnHeader);
        }
    }, [props.headers]);
    function handleClickHeader(i){
        //for mpn header detect ', ' or ',' to seperate or use POST DONE!!
        return function(e){
            if(e.ctrlKey){
                setMpnHeader(columnOrder[i]);
                setError(null);
            }
        }
    }
    function handleEditAttributeChange(i, value){
        setColumnOrder(update(columnOrder, {
            [i]: {$set: value}
        }));
    }
    function handleAddColumn(){
        setColumnOrder(update(columnOrder, {
            $push: [null]
        }))
    }
    function handleDataLookup(){
        console.log('do batch details data lookup');
        if(mpnHeader !== null){
            const mpns = tableData.map((line) => line[mpnHeader]);
            axios({
                method: 'POST',
                url: serverUrl+'api/partdetails',
                //params: {parts:mpnSplit, digikey:true},
                data: {
                    mpns: mpns,
                    digikey: true
                }
                //signal: controller.signal
            }).then(response => {
                console.log(response.data);
                const details = response.data.details;
                //setData(details);
                const newTableData = tableData.map((line,i) => {
                    const mpn = mpns[i];
                    scrubHeaders.forEach(col => {
                        if(col in details[mpn]){
                            line[col] = details[mpn][col];
                        }
                    });
                    return line;
                })
                setTableData(newTableData);
            });
        }else{
            setError('MPN header not selected');
        }

    }
    function handleReset(){
        setColumnOrder(props.headers);
        props.onReset();
    }
    function handleDeleteHeader(i){
        return function(e){
            if(e.altKey){
                //console.log('alt');
                const newColumnOrder = [...columnOrder];
                newColumnOrder.splice(i, 1);
                setColumnOrder(newColumnOrder);
            }
        }
    }
    function handleExport(fn){
        const sheet = XLSX.utils.json_to_sheet(tableData, {header: columnOrder});
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, 'BOMScrub');
        XLSX.writeFile(wb, fn+'.xlsx');
    }
    function handleOpenExport(){
        setShowExportModal(true);
    }
    function handleCloseExport(){
        setShowExportModal(false);
    }
    return(
    <div>
        <ExportModal show={showExportModal} hideAction={handleCloseExport} exportAction={handleExport}/>
        <div>
            <Button onClick={handleAddColumn}>Add Column</Button>
        {error === null ? <Button onClick={handleDataLookup}>Data Lookup</Button> : 
        <SimplePopover popoverBody={error} trigger={['hover', 'focus']} placement='auto'>
            <Button onClick={handleDataLookup}>Data Lookup</Button>
        </SimplePopover>
        }
        <Button onClick={handleOpenExport}>Export</Button>
        </div>
        <div className='MainTable'>
        <Table>
            <thead className='TableHeading'>
            <tr>
                {columnOrder.map((header, i) => {

                    let headerCell = (
                        <td key={i} onClick={handleClickHeader(i)}>
                            <SimplePopover popoverBody='CTRL Click to select MPN column' trigger={['hover', 'focus']} placement='auto'>
                            <div>{header}</div>
                            </SimplePopover>
                        </td>
                    );
                    if(scrubHeaders.includes(header) || header === null){
                        headerCell = <td key={i} onClick={handleDeleteHeader(i)}>
                            <SimpleDropdown items={scrubHeaders} 
                            selected={columnOrder[i] === null ? '-' : columnOrder[i]} onChange={(item) => handleEditAttributeChange(i, item)}/>
                        </td>;
                    }else if(header === mpnHeader){
                        headerCell = (
                        <td className={'MpnHeader'} key={i}>
                            <SimplePopover popoverBody='Selected MPN column' trigger={['hover', 'focus']} placement='auto'>
                            <div>{header}</div>
                            </SimplePopover>
                        </td>
                        );
                    }
                    return headerCell;
                })}
            </tr>
            </thead>
            <tbody>
            {displayTableData.map((line, ln) => 
            <tr key={ln}>
                {columnOrder.map((val, i) => 
                    val in line ? <td key={i}>{line[val]}</td> : <td key={i}></td>
                )}
            </tr>
            )}
            </tbody>
        </Table>
        </div>
        <div className='PageInterface'>
        <PageInterface current={pageNumber} max={numPages} 
            displayWidth={displayWidth} onPageClick={handlePageChange} 
            pageSize={pageSize} onChangePageSize={handleChangePageSize}/>
        </div>
    </div>
    );
}

function ExportModal(props){
    const [fn, setFn] = useState('');
    const handleClose = () => props.hideAction();
    const handleExport = () => {
        props.exportAction(fn);
        props.hideAction();
    };
    function handleChange(e){
        setFn(e.target.value);
    }
    return(
    <Modal show={props.show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>Export Excel</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        File Name: <input type='text' value={fn} onChange={handleChange}/>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleExport}>Export</Button>
    </Modal.Footer>
    </Modal>
    );
}

export default BOMScrubInterface;