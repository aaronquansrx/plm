import React, {useState} from 'react';

import Button from 'react-bootstrap/Button';

import {MyDropzone} from './../components/Dropzone';
import {LabeledCheckbox} from './../components/Forms';
import {useImportCBom, useExportCBom} from './../hooks/CBOM';

import './../css/main.css';

function CBom(){
    const [workbook, fileName, handleDrop] = useImportCBom();
    const [exportCBom] = useExportCBom(workbook);
    const [trimLinesChecked, setTrimLinesChecked] = useState(false);
    function handleTrimLinesChange(){
        setTrimLinesChecked(!trimLinesChecked);
    }
    function handleExportCBom(){
        exportCBom(trimLinesChecked);
    }
    return(
        <div>
        <MyDropzone class='DropFiles' onDrop={handleDrop} styles={true}/>
        <div>
            {fileName}
            <div className='Hori'>
            <Button onClick={handleExportCBom} disabled={workbook==null}>Export</Button>
            <LabeledCheckbox className={'Pointer'} label={'Trim Lines'} checked={trimLinesChecked} onChange={handleTrimLinesChange}/>
            </div>
        </div>
        </div>
    );
}

export default CBom;