import React, {useEffect, useState, useRef} from 'react';

import update from 'immutability-helper';
import axios from 'axios';
import XLSX from 'xlsx';

import {HoverOverlay} from '../components/Tooltips';
import {BsFileEarmarkArrowDown} from "react-icons/bs";

import {SimplePopover} from './Tooltips';
import {ExcelDropzone} from './Dropzone';
import {SimpleDropdown} from './Dropdown';

import {BOMApiProgressBarV2} from './Progress';

import {PageInterface} from './Pagination';
import { LabeledCheckbox, TextInput } from './Forms';
import {usePaging} from './../hooks/Paging';

import {UploadIcon, EditIcon, SheetIcon} from '../components/Icons';

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


import {useExcelUpload} from './../hooks/FileUpload';
import {useServerUrl} from './../hooks/Urls';

import { getPLMRequest, postPLMRequest } from '../scripts/APICall';

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
    'Description', 'RoHS', 'REACH', 'MSL', 'Lead', 'Mounting Type', 'Product Status', 'Packaging' 
];

const hiddenHeaders = ['Long Description'];

function TableInterface(props){
    const serverUrl = useServerUrl();
    const [mpnHeader, setMpnHeader] = useState(null);
    const [quantityHeader, setQuantityHeader] = useState(null);
    //const [newColumns, setNewColumns] = useState(new Set());
    const [columnOrder, setColumnOrder] = useState(props.headers.concat(scrubHeaders));
    const [tableData, setTableData] = useState(props.body);
    const [splitString, setSplitString] = useState('');
    //const [rawData, setRawData] = useState(props.body);
    //const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const [dataLock, setDataLock] = useState(false); 
    const [showExportModal, setShowExportModal] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [finishedData, setFinishedData] = useState(0);

    const typeData = useRef({});
    // to make sure mpnHeader doesnt change during data processing

    const [pageSize, setPageSize] = useState(5);
    const [pageNumber, numPages, handlePageChange] = usePaging(tableData.length, pageSize);
    const displayWidth = 3;
    const displayTableData = tableData.slice(pageNumber*pageSize, +(pageNumber*pageSize) + +pageSize);
    function handleChangePageSize(s){
        setPageSize(s);
        handlePageChange(0);
    }
    const allHeaders = scrubHeaders.concat(hiddenHeaders);
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
        const quantityHeaderStrings = ['quantity'];
        const quantityHeader = props.headers.reduce((h, header) => {
            if(quantityHeaderStrings.includes(header.toLowerCase())){
                return header;
            }
            return h;
        }, null);
        if(quantityHeader !== null){
            setQuantityHeader(quantityHeader);
        }
    }, [props.headers]);
    useEffect(() => {
        typeData.current = handleCountTypes();
    }, [tableData]);
    useEffect(() => {
        const newTableData = tableData.map(line => {
            if(quantityHeader) line.Quantity = line[quantityHeader];
            return line;
        })
        setTableData(newTableData);
    }, [quantityHeader])
    function handleClickHeader(i){
        //for mpn header detect ', ' or ',' to seperate or use POST DONE!!
        return function(e){
            if(e.ctrlKey){
                setMpnHeader(columnOrder[i]);
                setError(null);
            }else if(e.altKey){
                setQuantityHeader(columnOrder[i]);
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
        setFinishedData(0);
        setShowProgress(true);
        //console.log('Do batch details data lookup');


        if(mpnHeader !== null){
            const mpns = tableData.map((line) => line[mpnHeader]);
            //requestOldDetails(mpns);
            requestDetails(mpns);
        }else{
            setError('MPN header not selected');
        }
    }
    function genNewTableData(details, mpns){

        const newTableData = tableData.map((line,i) => {
            const mpn = line.MPN;
            if(mpn in details){
                scrubHeaders.forEach(col => {
                    if(col in details[mpn]){
                        if(col === 'Packaging'){
                            line[col] = details[mpn][col].join(', ');
                        }else{
                            line[col] = details[mpn][col];
                        }
                    }
                });
            }
            return line;
        });
        return newTableData;
    }
    function requestDetails(mpns){
        postPLMRequest('newpartdetails', {
            mpns: mpns,
            digikey: true
        }, (response) => {
            console.log(response.data);
            if(typeof response.data !== 'object'){
                setError('Data Lookup Error (contact IT)');
            }else{
                const details = response.data.details;
                const newTableData = genNewTableData(details, mpns);
                const notFound = []; // find not found
                Object.entries(response.data.details).forEach(([k,v]) => {
                    if(!v.found) notFound.push(k);
                });
                if(notFound.length){
                    requestOldDetails(notFound);
                }else{
                    setFinishedData(1);
                    setTableData(newTableData);
                }
            }
        },
        (res) => {
            console.log(res.data);
        });
    }
    function requestOldDetails(mpns){
        //console.log(mpns);
        if(mpns.length > 0){
            postPLMRequest('partdetails', {mpns: mpns,},  (response) => {
                //console.log(response.data);
                if(typeof response.data !== 'object'){
                    setError('Data Lookup Error (contact IT)');
                }else{
                    const details = response.data.details;
                    const newTableData = genNewTableData(details, mpns);
                    const notFound = []; // find not found
                    Object.entries(details).forEach(([k,v]) => {
                        if(!v.found) notFound.push(k);
                    });
                    setFinishedData(1);
                    setTableData(newTableData);
                }
            });
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
    function handleExport(fn, options={}){
        if(options.csv){
            const sheet = XLSX.utils.json_to_sheet(tableData, {header: columnOrder});
            const csv = XLSX.utils.sheet_to_csv(sheet, );
            const csvContent = "data:text/csv;charset=utf-8,"+csv;
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", fn+".csv");
            link.click();
        }else{
            const sheet = XLSX.utils.json_to_sheet(tableData, {header: columnOrder});
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, 'BOMScrub');
            if(options.countSheet){
                const sheetArray = Object.entries(typeData.current);
                const cSheet = XLSX.utils.json_to_sheet(sheetArray);
                XLSX.utils.book_append_sheet(wb, cSheet, 'Mounting Type Counts');
            }
            XLSX.writeFile(wb, fn+'.xlsx');
        }
    }
    function handleCountTypes(){
        if(finishedData === 1){
            const counts = tableData.reduce((cs, data) => {
                const quantity = 'Quantity' in data ? data['Quantity'] : 1;
                if('Mounting Type' in data){
                    if(data['Mounting Type'] !== null){
                        
                        if(data['Mounting Type'].startsWith('Surface Mount')){

                            if('Surface Mount' in cs){
                                cs['Surface Mount'] += quantity;
                            }else{
                                cs['Surface Mount'] = quantity;
                            }
                        }else{
                            if(data['Mounting Type'] in cs){
                                cs[data['Mounting Type']] += quantity;
                            }else{
                                cs[data['Mounting Type']] = quantity;
                            }
                        }
                    }else{
                        if('None' in cs){
                            cs.None += quantity;
                        }else{
                            cs.None = quantity;
                        }
                    }
                }
                return cs;
            }, {});
            return counts;
        }
        return {};
    }
    function handleOpenExport(){
        setShowExportModal(true);
    }
    function handleCloseExport(){
        setShowExportModal(false);
    }
    function handleSplitChange(val){
        setSplitString(val);
    }
    function handleSplitMPN(){
        if(mpnHeader !== null && splitString !== ''){
            const parseSplitString = splitString.replace("\\n", '\n');
            const newTableData = tableData.reduce((table, line, i) => {
                const mpns = line.MPN.split(parseSplitString);
                const restLine = {...line};
                delete restLine.MPN;
                mpns.forEach((mpn) => {
                    table.push({MPN: mpn, ...restLine, originalIndex: i});
                })
                return table;
            }, []);
            setTableData(newTableData);
        }
    }
    return(
    <div>
        <ExportComponentAttributeModal show={showExportModal} hideAction={handleCloseExport} exportAction={handleExport}/>
        <div className='FlexNormal Hori' style={{justifyContent: 'center'}}>
            <Button onClick={handleAddColumn}>Add Column</Button>
        {error === null ? <Button onClick={handleDataLookup}>Data Lookup</Button> : 
        <SimplePopover popoverBody={error} trigger={['hover', 'focus']} placement='auto'>
            <Button onClick={handleDataLookup}>Data Lookup</Button>
        </SimplePopover>
        }
        <Button onClick={handleOpenExport}>Export</Button>
        <TextInput onChange={handleSplitChange}/>
        <Button onClick={handleSplitMPN}>Split MPN Field</Button>
        <Button onClick={handleCountTypes} disabled={finishedData !== 1}>Count Types</Button>
        {
            displayTableData.map(() => {

            })
        }
        {error !== null && <div style={{color: 'red'}}>{error}</div>}
        </div>
        {<CountDisplay data={typeData.current}/>}
        <BOMApiProgressBarV2 show={showProgress} numParts={1} onHideBar={() => setShowProgress(false)} numFinished={finishedData}/>
        <div className={'MainTable'}>
        <Table>
            <thead className='TableHeading'>
            <tr>
                {columnOrder.map((header, i) => {

                    let headerCell = (
                        <td key={i} onClick={handleClickHeader(i)}>
                            <SimplePopover popoverBody='CTRL Click to select MPN column | ALT Click to select ' trigger={['hover', 'focus']} placement='auto'>
                            <div>{header}</div>
                            </SimplePopover>
                        </td>
                    );
                    if(allHeaders.includes(header) || header === null){
                        headerCell = <td key={i} onClick={handleDeleteHeader(i)}>
                            <SimpleDropdown items={allHeaders} 
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
                    }else if(header === quantityHeader){
                        headerCell = (
                            <td className={'QuantityHeader'} key={i}>
                            <SimplePopover popoverBody='Selected Quantity column' trigger={['hover', 'focus']} placement='auto'>
                            <div>{header}</div>
                            </SimplePopover>
                        </td>
                        )
                    }
                    return headerCell;
                })}
            </tr>
            </thead>
            <tbody className=''>
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

export function ExportComponentAttributeModal(props){
    const [fn, setFn] = useState('');
    const [csv, setCsv] = useState(false);
    const [countSheet, setCountSheet] = useState(false);
    const handleClose = () => props.hideAction();
    const handleExport = () => {
        props.exportAction(fn, {csv: csv, countSheet: countSheet});
        props.hideAction();
    };
    function handleChange(e){
        setFn(e.target.value);
    }
    function handleChangeCSV(){
        setCsv(!csv)
    }
    function handleCountSheet(){
        setCountSheet(!countSheet);
    }
    return(
    <Modal show={props.show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>Export Excel</Modal.Title>
    </Modal.Header>

    <Modal.Body>
        File Name: <input type='text' value={fn} onChange={handleChange}/>
        <LabeledCheckbox label={'CSV'} checked={csv} onChange={handleChangeCSV}/>
        <LabeledCheckbox label={'Add count sheet'} checked={countSheet} onChange={handleCountSheet}/>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleExport}>Export</Button>
    </Modal.Footer>
    </Modal>
    );
}

function CountDisplay(props){
    console.log(props.data);
    return (
        <div>
            <h5>Mounting Type Counts</h5>
            {Object.entries(props.data).map(([key, value], i) => {
                return <div key={i}>{key}: {value}</div>
            })}
        </div>
    );
}

export default BOMScrubInterface;