import React, {useState} from 'react';

import Button from 'react-bootstrap/Button';

import {ExcelDropzone} from './../components/Dropzone';
import {LabeledCheckbox} from './../components/Forms';
import {useImportCBom, useExportCBom, useCBomFunctions} from './../hooks/CBOM';
import {lookupCriteria} from './../scripts/CBOM';
import {NamingModal} from './../components/Modals';

import {CBomTable} from './../components/CBomTable';

import { BsFileEarmarkArrowDown } from "react-icons/bs";

import './../css/main.css';

function CBom(){
    const [workbook, fileName, handleDrop] = useImportCBom();
    const [exportCBom] = useExportCBom(workbook);
    const [lookup, lookupData] = useCBomFunctions(workbook);
    const [trimLinesChecked, setTrimLinesChecked] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [data, setData] = useState([]);
    function toggleExportModal(){
        setShowExportModal(!showExportModal);
    }
    function handleTrimLinesChange(){
        setTrimLinesChecked(!trimLinesChecked);
    }
    function handleExportCBom(exportName){
        exportCBom(trimLinesChecked, exportName);
    }

    function handleLookup(){
        lookup();
    }

    return(
        <div>
        <ExcelDropzone class='DropFiles' onDrop={handleDrop} styles={true}>
        <BsFileEarmarkArrowDown size={40}/>
        <p>Drop CBOM file</p>
        </ExcelDropzone>
        <div>
            {fileName}
            <div className='Hori'>
            <Button onClick={toggleExportModal} disabled={workbook==null}>Export</Button>
            {/*<Button onClick={handleExportCBom} disabled={workbook==null}>Export</Button>*/}
            <LabeledCheckbox className={'Pointer'} label={'Trim Lines'} checked={trimLinesChecked} onChange={handleTrimLinesChange}/>
            </div>
        </div>
        <NamingModal show={showExportModal} submitAction={handleExportCBom} hideAction={toggleExportModal}
         title='Export CBOM' nameLabel='File Name:' submitButton='Export'/>
         <div>
            <Button onClick={handleLookup} disabled={workbook==null}>Get Lookup Criteria</Button>
            {' '}Master File Lookup Criteria
            <CBomTable tableHeaders={lookupCriteria} data={lookupData}/>
         </div>
        </div>
    );
}

export default CBom;