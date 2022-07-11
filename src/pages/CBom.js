import React, {useState} from 'react';

import Button from 'react-bootstrap/Button';

import {MyDropzone} from './../components/Dropzone';
import {LabeledCheckbox} from './../components/Forms';
import {useImportCBom, useExportCBom} from './../hooks/CBOM';
import {NamingModal} from './../components/Modals';

import { BsFileEarmarkArrowDown } from "react-icons/bs";

import './../css/main.css';

function CBom(){
    const [workbook, fileName, handleDrop] = useImportCBom();
    const [exportCBom] = useExportCBom(workbook);
    const [trimLinesChecked, setTrimLinesChecked] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    function toggleExportModal(){
        setShowExportModal(!showExportModal);
    }
    function handleTrimLinesChange(){
        setTrimLinesChecked(!trimLinesChecked);
    }
    function handleExportCBom(exportName){
        exportCBom(trimLinesChecked, exportName);
    }
    return(
        <div>
        <MyDropzone class='DropFiles' onDrop={handleDrop} styles={true}>
        <BsFileEarmarkArrowDown size={40}/>
        <p>Drop CBOM file</p>
        </MyDropzone>
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
        </div>
    );
}

export default CBom;